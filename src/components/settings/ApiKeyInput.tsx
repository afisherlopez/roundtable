'use client';

import { useState } from 'react';
import type { KeySource } from '@/types/settings';

interface ApiKeyInputProps {
  label: string;
  value: string;
  source: KeySource;
  onChange: (value: string) => void;
}

export function ApiKeyInput({ label, value, source, onChange }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  const sourceLabel: Record<KeySource, { text: string; color: string }> = {
    saved: { text: '(saved)', color: 'text-clover-400' },
    server: { text: '(server)', color: 'text-daisy-400' },
    missing: { text: '(missing)', color: 'text-rose-400' },
  };

  const { text, color } = sourceLabel[source];

  return (
    <div className="mb-4">
      <label className="flex items-center gap-2 text-xs text-bark-600 mb-1.5">
        <span>{label}</span>
        <span className={`${color} text-[10px]`}>{text}</span>
      </label>
      <div className="flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={source === 'server' ? '••• using server key' : 'Enter API key...'}
          className="flex-1 bg-white border border-spring-300 rounded px-3 py-2 text-xs text-bark-800 placeholder-bark-500/50 focus:outline-none focus:border-spring-500 font-mono"
        />
        <button
          onClick={() => setVisible(!visible)}
          className="text-xs text-bark-500 hover:text-bark-800 px-2 cursor-pointer"
          type="button"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
