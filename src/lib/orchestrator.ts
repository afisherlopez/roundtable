import type { SSEEvent, ModelId } from '@/types/debate';
import type { GenerateResult, ImageInput, PdfInput } from '@/lib/ai/types';
import { createOpenAIClient } from '@/lib/ai/openai';
import { createAnthropicClient } from '@/lib/ai/anthropic';
import { createGeminiClient } from '@/lib/ai/gemini';
import { parseVerdict } from '@/lib/agreement';
import { MAX_ROUNDS, MODEL_IDS } from '@/constants';
import {
  PROPOSER_SYSTEM_PROMPT,
  PROPOSER_REVISION_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
  SUMMARY_SYSTEM_PROMPT,
  buildProposerMessage,
  buildCriticMessage,
  buildRevisionMessage,
  buildSynthesisMessage,
  buildSummaryMessage,
} from '@/lib/prompts';

interface OrchestratorConfig {
  openaiKey: string;
  anthropicKey: string;
  googleKey: string;
  onEvent: (event: SSEEvent) => void;
  images?: ImageInput[];
  pdfs?: PdfInput[];
}

export async function runDebate(
  userPrompt: string,
  config: OrchestratorConfig
) {
  const { onEvent } = config;

  const openai = createOpenAIClient({ apiKey: config.openaiKey });
  const anthropic = createAnthropicClient({ apiKey: config.anthropicKey });
  const gemini = createGeminiClient({ apiKey: config.googleKey });

  const clients: Record<
    ModelId,
    { generate: (opts: Parameters<typeof openai.generate>[0]) => Promise<GenerateResult> }
  > = {
    chatgpt: openai,
    claude: anthropic,
    gemini: gemini,
  };

  const models: Record<ModelId, string> = MODEL_IDS;

  let proposerAnswer = '';
  let debateHistory = '';
  let finalAnswer = '';

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    onEvent({ type: 'round_start', data: { round } });

    // ChatGPT proposes or revises
    onEvent({ type: 'model_start', data: { round, modelId: 'chatgpt' } });

    let proposerContent = '';
    if (round === 1) {
      const result = await clients.chatgpt.generate({
        model: models.chatgpt,
        systemPrompt: PROPOSER_SYSTEM_PROMPT,
        messages: [{ 
          role: 'user', 
          content: buildProposerMessage(userPrompt),
          images: config.images,
          pdfs: config.pdfs,
        }],
        onChunk: (chunk) =>
          onEvent({ type: 'model_chunk', data: { round, modelId: 'chatgpt', chunk } }),
      });
      proposerContent = result.content;
    } else {
      const result = await clients.chatgpt.generate({
        model: models.chatgpt,
        systemPrompt: PROPOSER_REVISION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildRevisionMessage(userPrompt, proposerAnswer, debateHistory),
          },
        ],
        onChunk: (chunk) =>
          onEvent({ type: 'model_chunk', data: { round, modelId: 'chatgpt', chunk } }),
      });
      proposerContent = result.content;
    }

    proposerAnswer = proposerContent;
    onEvent({
      type: 'model_complete',
      data: { round, modelId: 'chatgpt', content: proposerContent },
    });

    // Critics evaluate sequentially
    const critics: ModelId[] = ['claude', 'gemini'];
    const verdicts: Record<string, 'AGREE' | 'DISAGREE' | null> = {};
    let roundFeedback = '';

    for (const criticId of critics) {
      onEvent({ type: 'model_start', data: { round, modelId: criticId } });

      const result = await clients[criticId].generate({
        model: models[criticId],
        systemPrompt: CRITIC_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildCriticMessage(
              userPrompt,
              proposerAnswer,
              roundFeedback || undefined
            ),
          },
        ],
        onChunk: (chunk) =>
          onEvent({ type: 'model_chunk', data: { round, modelId: criticId, chunk } }),
      });

      const verdict = parseVerdict(result.content);
      verdicts[criticId] = verdict;
      roundFeedback += `\n\n**${criticId === 'claude' ? 'Claude' : 'Gemini'}:**\n${result.content}`;

      onEvent({
        type: 'model_complete',
        data: { round, modelId: criticId, content: result.content, verdict: verdict ?? undefined },
      });

      onEvent({
        type: 'agreement_check',
        data: { round, modelId: criticId, verdict: verdict ?? undefined },
      });
    }

    debateHistory += `\n\n--- Round ${round} ---\n**ChatGPT:**\n${proposerAnswer}${roundFeedback}`;

    // Check if both critics agree
    const allAgree =
      verdicts['claude'] === 'AGREE' && verdicts['gemini'] === 'AGREE';

    if (allAgree) {
      finalAnswer = proposerAnswer;

      // Generate summary
      const summaryResult = await generateSummary(
        clients.claude,
        models.claude,
        userPrompt,
        debateHistory,
        finalAnswer
      );

      onEvent({
        type: 'debate_complete',
        data: {
          finalAnswer,
          summary: summaryResult,
          allAgree: true,
        },
      });
      return;
    }
  }

  // Max rounds reached — synthesize
  onEvent({ type: 'model_start', data: { round: MAX_ROUNDS, modelId: 'claude' } });

  const synthesisResult = await clients.claude.generate({
    model: models.claude,
    systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildSynthesisMessage(userPrompt, debateHistory),
      },
    ],
    onChunk: (chunk) =>
      onEvent({
        type: 'model_chunk',
        data: { round: MAX_ROUNDS, modelId: 'claude', chunk },
      }),
  });

  finalAnswer = synthesisResult.content;

  onEvent({
    type: 'model_complete',
    data: { round: MAX_ROUNDS, modelId: 'claude', content: finalAnswer },
  });

  // Generate summary
  const summaryResult = await generateSummary(
    clients.claude,
    models.claude,
    userPrompt,
    debateHistory,
    finalAnswer
  );

  onEvent({
    type: 'debate_complete',
    data: {
      finalAnswer,
      summary: summaryResult,
      allAgree: false,
    },
  });
}

async function generateSummary(
  client: { generate: (opts: { model: string; systemPrompt: string; messages: { role: 'user' | 'assistant'; content: string }[]; onChunk?: (chunk: string) => void }) => Promise<GenerateResult> },
  model: string,
  userPrompt: string,
  debateHistory: string,
  finalAnswer: string
): Promise<string> {
  const result = await client.generate({
    model,
    systemPrompt: SUMMARY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildSummaryMessage(userPrompt, debateHistory, finalAnswer),
      },
    ],
  });
  return result.content;
}
