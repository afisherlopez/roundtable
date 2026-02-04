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

const MODEL_NAMES: Record<ModelId, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
};

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('exceeded') ||
      message.includes('too many requests') ||
      message.includes('429') ||
      message.includes('insufficient_quota') ||
      message.includes('billing') ||
      message.includes('credit')
    );
  }
  return false;
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
  
  // Track disabled models due to rate limits
  const disabledModels = new Set<ModelId>();

  let proposerAnswer = '';
  let debateHistory = '';
  let finalAnswer = '';

  // Helper to safely call a model
  async function safeGenerate(
    modelId: ModelId,
    options: Parameters<typeof openai.generate>[0]
  ): Promise<GenerateResult | null> {
    if (disabledModels.has(modelId)) {
      return null;
    }

    try {
      return await clients[modelId].generate(options);
    } catch (error) {
      if (isRateLimitError(error)) {
        disabledModels.add(modelId);
        onEvent({
          type: 'model_error',
          data: {
            modelId,
            error: `${MODEL_NAMES[modelId]} has hit its usage limit and will be skipped for the rest of this debate.`,
          },
        });
        return null;
      }
      // Re-throw non-rate-limit errors
      throw error;
    }
  }

  // Get list of available proposers (prefer ChatGPT, fallback to others)
  function getAvailableProposer(): ModelId | null {
    const preferredOrder: ModelId[] = ['chatgpt', 'claude', 'gemini'];
    for (const id of preferredOrder) {
      if (!disabledModels.has(id)) return id;
    }
    return null;
  }

  // Get list of available critics
  function getAvailableCritics(): ModelId[] {
    const critics: ModelId[] = ['claude', 'gemini', 'chatgpt'];
    return critics.filter(id => !disabledModels.has(id));
  }

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    onEvent({ type: 'round_start', data: { round } });

    const proposerId = getAvailableProposer();
    
    // If no models available, we can't continue
    if (!proposerId) {
      onEvent({
        type: 'error',
        data: { error: 'All models have hit their usage limits. Unable to continue the debate.' },
      });
      return;
    }

    // Proposer proposes or revises
    onEvent({ type: 'model_start', data: { round, modelId: proposerId } });

    let proposerContent = '';
    if (round === 1) {
      const result = await safeGenerate(proposerId, {
        model: models[proposerId],
        systemPrompt: PROPOSER_SYSTEM_PROMPT,
        messages: [{ 
          role: 'user', 
          content: buildProposerMessage(userPrompt),
          images: config.images,
          pdfs: config.pdfs,
        }],
        onChunk: (chunk) =>
          onEvent({ type: 'model_chunk', data: { round, modelId: proposerId, chunk } }),
      });
      
      if (!result) {
        // Proposer hit rate limit on first try, try next available
        const nextProposer = getAvailableProposer();
        if (!nextProposer) {
          onEvent({
            type: 'error',
            data: { error: 'All models have hit their usage limits. Unable to continue the debate.' },
          });
          return;
        }
        onEvent({ type: 'model_start', data: { round, modelId: nextProposer } });
        const retryResult = await safeGenerate(nextProposer, {
          model: models[nextProposer],
          systemPrompt: PROPOSER_SYSTEM_PROMPT,
          messages: [{ 
            role: 'user', 
            content: buildProposerMessage(userPrompt),
            images: config.images,
            pdfs: config.pdfs,
          }],
          onChunk: (chunk) =>
            onEvent({ type: 'model_chunk', data: { round, modelId: nextProposer, chunk } }),
        });
        if (!retryResult) {
          onEvent({
            type: 'error',
            data: { error: 'All models have hit their usage limits. Unable to continue the debate.' },
          });
          return;
        }
        proposerContent = retryResult.content;
        onEvent({
          type: 'model_complete',
          data: { round, modelId: nextProposer, content: proposerContent },
        });
      } else {
        proposerContent = result.content;
        onEvent({
          type: 'model_complete',
          data: { round, modelId: proposerId, content: proposerContent },
        });
      }
    } else {
      const result = await safeGenerate(proposerId, {
        model: models[proposerId],
        systemPrompt: PROPOSER_REVISION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildRevisionMessage(userPrompt, proposerAnswer, debateHistory),
          },
        ],
        onChunk: (chunk) =>
          onEvent({ type: 'model_chunk', data: { round, modelId: proposerId, chunk } }),
      });
      
      if (result) {
        proposerContent = result.content;
        onEvent({
          type: 'model_complete',
          data: { round, modelId: proposerId, content: proposerContent },
        });
      } else {
        // Use previous answer if proposer fails
        proposerContent = proposerAnswer;
        onEvent({
          type: 'model_complete',
          data: { round, modelId: proposerId, content: '[Using previous answer due to rate limit]' },
        });
      }
    }

    proposerAnswer = proposerContent;

    // Critics evaluate
    const availableCritics = getAvailableCritics().filter(id => id !== proposerId);
    const verdicts: Record<string, 'AGREE' | 'DISAGREE' | null> = {};
    let roundFeedback = '';

    for (const criticId of availableCritics) {
      onEvent({ type: 'model_start', data: { round, modelId: criticId } });

      const result = await safeGenerate(criticId, {
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

      if (result) {
        const verdict = parseVerdict(result.content);
        verdicts[criticId] = verdict;
        roundFeedback += `\n\n**${MODEL_NAMES[criticId]}:**\n${result.content}`;

        onEvent({
          type: 'model_complete',
          data: { round, modelId: criticId, content: result.content, verdict: verdict ?? undefined },
        });

        onEvent({
          type: 'agreement_check',
          data: { round, modelId: criticId, verdict: verdict ?? undefined },
        });
      }
    }

    debateHistory += `\n\n--- Round ${round} ---\n**${MODEL_NAMES[proposerId]}:**\n${proposerAnswer}${roundFeedback}`;

    // Check if all available critics agree
    const criticVerdicts = Object.values(verdicts);
    const allAgree = criticVerdicts.length > 0 && criticVerdicts.every(v => v === 'AGREE');

    if (allAgree) {
      finalAnswer = proposerAnswer;

      // Try to generate summary with any available model
      let summaryResult = '';
      const summaryModels: ModelId[] = ['claude', 'gemini', 'chatgpt'];
      for (const summaryModelId of summaryModels) {
        if (!disabledModels.has(summaryModelId)) {
          try {
            summaryResult = await generateSummary(
              clients[summaryModelId],
              models[summaryModelId],
              userPrompt,
              debateHistory,
              finalAnswer
            );
            break;
          } catch {
            // Try next model
          }
        }
      }

      onEvent({
        type: 'debate_complete',
        data: {
          finalAnswer,
          summary: summaryResult || 'Summary unavailable due to rate limits.',
          allAgree: true,
        },
      });
      return;
    }
  }

  // Max rounds reached — synthesize with any available model
  const synthesisModels: ModelId[] = ['claude', 'gemini', 'chatgpt'];
  let synthesisModelId: ModelId | null = null;
  
  for (const id of synthesisModels) {
    if (!disabledModels.has(id)) {
      synthesisModelId = id;
      break;
    }
  }

  if (!synthesisModelId) {
    // No models available, use the last proposer answer
    finalAnswer = proposerAnswer;
    onEvent({
      type: 'debate_complete',
      data: {
        finalAnswer,
        summary: 'All models hit their usage limits. Returning the last available answer.',
        allAgree: false,
      },
    });
    return;
  }

  onEvent({ type: 'model_start', data: { round: MAX_ROUNDS, modelId: synthesisModelId } });

  const synthesisResult = await safeGenerate(synthesisModelId, {
    model: models[synthesisModelId],
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
        data: { round: MAX_ROUNDS, modelId: synthesisModelId!, chunk },
      }),
  });

  if (synthesisResult) {
    finalAnswer = synthesisResult.content;
    onEvent({
      type: 'model_complete',
      data: { round: MAX_ROUNDS, modelId: synthesisModelId, content: finalAnswer },
    });
  } else {
    finalAnswer = proposerAnswer;
  }

  // Try to generate summary
  let summaryResult = '';
  for (const summaryModelId of synthesisModels) {
    if (!disabledModels.has(summaryModelId)) {
      try {
        summaryResult = await generateSummary(
          clients[summaryModelId],
          models[summaryModelId],
          userPrompt,
          debateHistory,
          finalAnswer
        );
        break;
      } catch {
        // Try next model
      }
    }
  }

  onEvent({
    type: 'debate_complete',
    data: {
      finalAnswer,
      summary: summaryResult || 'Summary unavailable due to rate limits.',
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
