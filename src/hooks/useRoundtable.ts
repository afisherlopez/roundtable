'use client';

import { useState, useCallback, useRef } from 'react';
import type { DebateState, SSEEvent, DebateRound, DebateMessage, ModelId } from '@/types/debate';
import type { ApiKeys } from '@/types/settings';
import type { ImageInput, PdfInput } from '@/lib/ai/types';

const INITIAL_STATE: DebateState = {
  id: '',
  status: 'idle',
  currentRound: 0,
  currentModel: null,
  rounds: [],
  finalAnswer: null,
  summary: null,
  error: null,
  disabledModels: [],
};

export function useRoundtable() {
  const [debateState, setDebateState] = useState<DebateState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const startDebate = useCallback(async (prompt: string, apiKeys: ApiKeys, images?: ImageInput[], pdfs?: PdfInput[]) => {
    // Abort any existing debate
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const debateId = crypto.randomUUID();

    setDebateState({
      ...INITIAL_STATE,
      id: debateId,
      status: 'debating',
    });

    try {
      const response = await fetch('/api/roundtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, apiKeys, images, pdfs }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        setDebateState((prev) => ({
          ...prev,
          status: 'error',
          error: err.error || 'Failed to start debate',
        }));
        return debateId;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setDebateState((prev) => ({
          ...prev,
          status: 'error',
          error: 'No response stream',
        }));
        return debateId;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6));
              processEvent(event, setDebateState);
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setDebateState((prev) => ({
          ...prev,
          status: 'error',
          error: (err as Error).message || 'Connection lost',
        }));
      }
    }

    return debateId;
  }, []);

  const cancelDebate = useCallback(() => {
    abortRef.current?.abort();
    setDebateState((prev) => ({
      ...prev,
      status: 'idle',
    }));
  }, []);

  const resetDebate = useCallback(() => {
    abortRef.current?.abort();
    setDebateState(INITIAL_STATE);
  }, []);

  return {
    debateState,
    startDebate,
    cancelDebate,
    resetDebate,
  };
}

function processEvent(
  event: SSEEvent,
  setState: React.Dispatch<React.SetStateAction<DebateState>>
) {
  switch (event.type) {
    case 'round_start': {
      const round = event.data.round!;
      setState((prev) => ({
        ...prev,
        currentRound: round,
        rounds: [
          ...prev.rounds,
          { roundNumber: round, messages: [] } as DebateRound,
        ],
      }));
      break;
    }
    case 'model_start': {
      setState((prev) => ({
        ...prev,
        currentModel: event.data.modelId as ModelId,
      }));
      // Add empty message placeholder to current round
      setState((prev) => {
        const rounds = [...prev.rounds];
        const currentRound = rounds[rounds.length - 1];
        if (currentRound) {
          currentRound.messages = [
            ...currentRound.messages,
            {
              modelId: event.data.modelId as ModelId,
              content: '',
            } as DebateMessage,
          ];
          rounds[rounds.length - 1] = { ...currentRound };
        }
        return { ...prev, rounds };
      });
      break;
    }
    case 'model_chunk': {
      setState((prev) => {
        const rounds = [...prev.rounds];
        const currentRound = rounds[rounds.length - 1];
        if (currentRound) {
          const messages = [...currentRound.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg && lastMsg.modelId === event.data.modelId) {
            messages[messages.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + (event.data.chunk || ''),
            };
            rounds[rounds.length - 1] = { ...currentRound, messages };
          }
        }
        return { ...prev, rounds };
      });
      break;
    }
    case 'model_complete': {
      setState((prev) => {
        const rounds = [...prev.rounds];
        const currentRound = rounds[rounds.length - 1];
        if (currentRound) {
          const messages = [...currentRound.messages];
          const lastMsg = messages[messages.length - 1];
          if (lastMsg && lastMsg.modelId === event.data.modelId) {
            messages[messages.length - 1] = {
              ...lastMsg,
              content: event.data.content || lastMsg.content,
              verdict: event.data.verdict,
            };
            rounds[rounds.length - 1] = { ...currentRound, messages };
          }
        }
        return { ...prev, rounds, currentModel: null };
      });
      break;
    }
    case 'debate_complete': {
      setState((prev) => ({
        ...prev,
        status: 'complete',
        currentModel: null,
        finalAnswer: event.data.finalAnswer || null,
        summary: event.data.summary || null,
      }));
      break;
    }
    case 'model_error': {
      const modelId = event.data.modelId as ModelId;
      setState((prev) => {
        // Add error message to current round
        const rounds = [...prev.rounds];
        const currentRound = rounds[rounds.length - 1];
        if (currentRound) {
          currentRound.messages = [
            ...currentRound.messages,
            {
              modelId,
              content: event.data.error || `${modelId} hit its usage limit`,
            } as DebateMessage,
          ];
          rounds[rounds.length - 1] = { ...currentRound };
        }
        return {
          ...prev,
          rounds,
          disabledModels: [...prev.disabledModels, modelId],
          currentModel: null,
        };
      });
      break;
    }
    case 'error': {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: event.data.error || 'Unknown error',
      }));
      break;
    }
  }
}
