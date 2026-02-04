import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionContentPart } from 'openai/resources/chat/completions';
import type { AIClientConfig, GenerateOptions, GenerateResult } from './types';

export function createOpenAIClient(config: AIClientConfig) {
  const client = new OpenAI({ apiKey: config.apiKey });

  return {
    async generate(options: GenerateOptions): Promise<GenerateResult> {
      const messages: ChatCompletionMessageParam[] = options.messages.map((msg) => {
        const hasImages = msg.images && msg.images.length > 0;
        const hasPdfs = msg.pdfs && msg.pdfs.length > 0;
        
        // If message has attachments, use content array format (only valid for user messages)
        if (msg.role === 'user' && (hasImages || hasPdfs)) {
          const contentParts: ChatCompletionContentPart[] = [];
          
          // Build text content with PDF note if needed
          let textContent = msg.content;
          if (hasPdfs && msg.pdfs) {
            const pdfNames = msg.pdfs.map(p => p.name).join(', ');
            textContent = `[Note: PDF files attached (${pdfNames}) - these will be analyzed by Claude and Gemini who can read PDFs directly]\n\n${msg.content}`;
          }
          
          contentParts.push({ type: 'text', text: textContent });
          
          // Add images (OpenAI supports these)
          if (msg.images) {
            for (const img of msg.images) {
              contentParts.push({
                type: 'image_url' as const,
                image_url: {
                  url: `data:${img.mimeType};base64,${img.data}`,
                },
              });
            }
          }
          
          return { role: 'user' as const, content: contentParts };
        }
        if (msg.role === 'assistant') {
          return { role: 'assistant' as const, content: msg.content };
        }
        return { role: 'user' as const, content: msg.content };
      });

      const stream = await client.chat.completions.create({
        model: options.model,
        messages: [
          { role: 'system' as const, content: options.systemPrompt },
          ...messages,
        ],
        stream: true,
      });

      let content = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          content += delta;
          options.onChunk?.(delta);
        }
      }

      return { content };
    },
  };
}
