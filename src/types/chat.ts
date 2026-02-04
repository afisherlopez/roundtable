export interface ImageAttachment {
  id: string;
  data: string; // base64 encoded
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  name: string;
}

export interface PdfAttachment {
  id: string;
  data: string; // base64 encoded
  mimeType: 'application/pdf';
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  debateId?: string;
  images?: ImageAttachment[];
  pdfs?: PdfAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
