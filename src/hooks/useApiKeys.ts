'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApiKeys, KeyStatus, KeySource } from '@/types/settings';
import { STORAGE_KEYS } from '@/constants';

const EMPTY_KEYS: ApiKeys = { openai: '', anthropic: '', google: '' };

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>(EMPTY_KEYS);
  const [serverStatus, setServerStatus] = useState<KeyStatus>({
    openai: false,
    anthropic: false,
    google: false,
  });

  // Load keys from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      if (stored) {
        setApiKeys(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Fetch server key status
  useEffect(() => {
    fetch('/api/keys/status')
      .then((res) => res.json())
      .then((data) => setServerStatus(data))
      .catch(() => {});
  }, []);

  const saveKeys = useCallback((keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
  }, []);

  const getKeySource = useCallback(
    (provider: keyof ApiKeys): KeySource => {
      if (apiKeys[provider]) return 'saved';
      if (serverStatus[provider]) return 'server';
      return 'missing';
    },
    [apiKeys, serverStatus]
  );

  const hasAllKeys = useCallback((): boolean => {
    return (
      (!!apiKeys.openai || serverStatus.openai) &&
      (!!apiKeys.anthropic || serverStatus.anthropic) &&
      (!!apiKeys.google || serverStatus.google)
    );
  }, [apiKeys, serverStatus]);

  return {
    apiKeys,
    serverStatus,
    saveKeys,
    getKeySource,
    hasAllKeys,
  };
}
