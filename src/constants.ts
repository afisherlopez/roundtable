import type { ModelId } from '@/types/debate';

export const MAX_ROUNDS = 5;

export const MODEL_NAMES: Record<ModelId, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
};

export const MODEL_COLORS: Record<ModelId, string> = {
  chatgpt: 'poppy-400',
  claude: 'iris-400',
  gemini: 'sky-400',
};

export const MODEL_IDS: Record<ModelId, string> = {
  chatgpt: 'gpt-4o',
  claude: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash',
};

export const STORAGE_KEYS = {
  API_KEYS: 'roundtable-api-keys',
} as const;
