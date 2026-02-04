'use client';

import { useState, useEffect } from 'react';
import type { ApiKeys, KeySource } from '@/types/settings';
import { ApiKeyInput } from './ApiKeyInput';
import { Button } from '@/components/ui/Button';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
  getKeySource: (provider: keyof ApiKeys) => KeySource;
}

export function SettingsPanel({
  isOpen,
  onClose,
  apiKeys,
  onSave,
  getKeySource,
}: SettingsPanelProps) {
  const [localKeys, setLocalKeys] = useState<ApiKeys>(apiKeys);

  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys]);

  const handleSave = () => {
    onSave(localKeys);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-spring-100 border-l border-spring-300 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-spring-300 flex items-center justify-between">
          <h2 className="text-sm font-bold text-bark-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-bark-500 hover:text-bark-800 text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-bark-500 mb-4">
            API keys are stored locally in your browser. Server keys from .env.local
            are used as fallback.
          </p>

          <ApiKeyInput
            label="OpenAI"
            value={localKeys.openai}
            source={getKeySource('openai')}
            onChange={(v) => setLocalKeys((prev) => ({ ...prev, openai: v }))}
          />
          <ApiKeyInput
            label="Anthropic"
            value={localKeys.anthropic}
            source={getKeySource('anthropic')}
            onChange={(v) => setLocalKeys((prev) => ({ ...prev, anthropic: v }))}
          />
          <ApiKeyInput
            label="Google"
            value={localKeys.google}
            source={getKeySource('google')}
            onChange={(v) => setLocalKeys((prev) => ({ ...prev, google: v }))}
          />

          <div className="flex gap-2 mt-6">
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
