export type ModelId = 'chatgpt' | 'claude' | 'gemini';

export interface DebateMessage {
  modelId: ModelId;
  content: string;
  verdict?: 'AGREE' | 'DISAGREE';
}

export interface DebateRound {
  roundNumber: number;
  messages: DebateMessage[];
}

export interface DebateState {
  id: string;
  status: 'idle' | 'debating' | 'complete' | 'error';
  currentRound: number;
  currentModel: ModelId | null;
  rounds: DebateRound[];
  finalAnswer: string | null;
  summary: string | null;
  error: string | null;
}

export type SSEEventType =
  | 'round_start'
  | 'model_start'
  | 'model_chunk'
  | 'model_complete'
  | 'agreement_check'
  | 'debate_complete'
  | 'error';

export interface SSEEvent {
  type: SSEEventType;
  data: {
    round?: number;
    modelId?: ModelId;
    chunk?: string;
    content?: string;
    verdict?: 'AGREE' | 'DISAGREE';
    finalAnswer?: string;
    summary?: string;
    error?: string;
    allAgree?: boolean;
  };
}
