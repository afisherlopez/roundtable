import { NextRequest } from 'next/server';
import { createSSEStream } from '@/lib/sse';
import { runDebate } from '@/lib/orchestrator';
import type { ImageInput, PdfInput } from '@/lib/ai/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, apiKeys, images, pdfs } = body as {
    prompt: string;
    apiKeys?: { openai?: string; anthropic?: string; google?: string };
    images?: ImageInput[];
    pdfs?: PdfInput[];
  };

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const openaiKey = apiKeys?.openai || process.env.OPENAI_API_KEY || '';
  const anthropicKey = apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY || '';
  const googleKey = apiKeys?.google || process.env.GOOGLE_API_KEY || '';

  const missing: string[] = [];
  if (!openaiKey) missing.push('OpenAI');
  if (!anthropicKey) missing.push('Anthropic');
  if (!googleKey) missing.push('Google');

  if (missing.length > 0) {
    return new Response(
      JSON.stringify({
        error: `Missing API keys: ${missing.join(', ')}. Add them in Settings or .env.local.`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { stream, send, close } = createSSEStream();

  // Run debate in background
  (async () => {
    try {
      await runDebate(prompt, {
        openaiKey,
        anthropicKey,
        googleKey,
        onEvent: send,
        images,
        pdfs,
      });
    } catch (err) {
      send({
        type: 'error',
        data: {
          error: err instanceof Error ? err.message : 'An unexpected error occurred',
        },
      });
    } finally {
      close();
    }
  })();

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
