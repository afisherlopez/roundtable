export interface AIClientConfig {
  apiKey: string;
}

export interface ImageInput {
  data: string; // base64 encoded (without data URL prefix)
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

export interface PdfInput {
  data: string; // base64 encoded (without data URL prefix)
  mimeType: 'application/pdf';
  name: string;
}

export interface MessageContent {
  role: 'user' | 'assistant';
  content: string;
  images?: ImageInput[];
  pdfs?: PdfInput[];
}

export interface GenerateOptions {
  model: string;
  systemPrompt: string;
  messages: MessageContent[];
  onChunk?: (chunk: string) => void;
}

export interface GenerateResult {
  content: string;
}
