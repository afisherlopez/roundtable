import Anthropic from '@anthropic-ai/sdk';
import type { ContentBlockParam, ImageBlockParam, TextBlockParam, DocumentBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { AIClientConfig, GenerateOptions, GenerateResult } from './types';

export function createAnthropicClient(config: AIClientConfig) {
  const client = new Anthropic({ apiKey: config.apiKey });

  return {
    async generate(options: GenerateOptions): Promise<GenerateResult> {
      const messages = options.messages.map((msg) => {
        const hasImages = msg.images && msg.images.length > 0;
        const hasPdfs = msg.pdfs && msg.pdfs.length > 0;
        
        // If message has attachments, use content array format
        if (hasImages || hasPdfs) {
          const contentBlocks: ContentBlockParam[] = [];
          
          // Add PDFs first
          if (msg.pdfs) {
            for (const pdf of msg.pdfs) {
              contentBlocks.push({
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdf.data,
                },
              } as DocumentBlockParam);
            }
          }
          
          // Add images
          if (msg.images) {
            for (const img of msg.images) {
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: img.mimeType,
                  data: img.data,
                },
              } as ImageBlockParam);
            }
          }
          
          // Add text content
          contentBlocks.push({ type: 'text', text: msg.content } as TextBlockParam);
          
          return { role: msg.role as 'user' | 'assistant', content: contentBlocks };
        }
        return { role: msg.role as 'user' | 'assistant', content: msg.content };
      });

      const stream = client.messages.stream({
        model: options.model,
        max_tokens: 4096,
        system: options.systemPrompt,
        messages,
      });

      let content = '';
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          content += event.delta.text;
          options.onChunk?.(event.delta.text);
        }
      }

      return { content };
    },
  };
}
