import { GoogleGenAI, Part } from '@google/genai';
import type { AIClientConfig, GenerateOptions, GenerateResult } from './types';

export function createGeminiClient(config: AIClientConfig) {
  const client = new GoogleGenAI({ apiKey: config.apiKey });

  return {
    async generate(options: GenerateOptions): Promise<GenerateResult> {
      const contents = options.messages.map((m) => {
        const parts: Part[] = [];
        
        // Add PDFs first if present
        if (m.pdfs && m.pdfs.length > 0) {
          for (const pdf of m.pdfs) {
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: pdf.data,
              },
            });
          }
        }
        
        // Add images if present
        if (m.images && m.images.length > 0) {
          for (const img of m.images) {
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.data,
              },
            });
          }
        }
        
        // Add text content
        parts.push({ text: m.content });
        
        return {
          role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts,
        };
      });

      const response = await client.models.generateContentStream({
        model: options.model,
        config: {
          systemInstruction: options.systemPrompt,
        },
        contents,
      });

      let content = '';
      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          content += text;
          options.onChunk?.(text);
        }
      }

      return { content };
    },
  };
}
