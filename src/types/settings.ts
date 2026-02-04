export interface ApiKeys {
  openai: string;
  anthropic: string;
  google: string;
}

export interface KeyStatus {
  openai: boolean;
  anthropic: boolean;
  google: boolean;
}

export type KeySource = 'saved' | 'server' | 'missing';

export interface UserSettings {
  apiKeys: ApiKeys;
}
