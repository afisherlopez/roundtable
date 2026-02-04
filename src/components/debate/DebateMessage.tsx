'use client';

import type { DebateMessage as DebateMessageType } from '@/types/debate';
import { MODEL_NAMES, MODEL_COLORS } from '@/constants';
import { Markdown } from '@/components/ui/Markdown';
import { AgreementBadge } from './AgreementBadge';

interface DebateMessageProps {
  message: DebateMessageType;
}

const COLOR_CLASSES: Record<string, { border: string; text: string; bg: string }> = {
  'poppy-400': {
    border: 'border-l-poppy-400',
    text: 'text-poppy-400',
    bg: 'bg-poppy-400',
  },
  'iris-400': {
    border: 'border-l-iris-400',
    text: 'text-iris-400',
    bg: 'bg-iris-400',
  },
  'sky-400': {
    border: 'border-l-sky-400',
    text: 'text-sky-400',
    bg: 'bg-sky-400',
  },
};

export function DebateMessageComponent({ message }: DebateMessageProps) {
  const colorKey = MODEL_COLORS[message.modelId];
  const colors = COLOR_CLASSES[colorKey];

  return (
    <div className={`border-l-2 ${colors.border} pl-3 py-2`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
        <span className={`text-xs font-bold ${colors.text}`}>
          {MODEL_NAMES[message.modelId]}
        </span>
        {message.verdict && <AgreementBadge verdict={message.verdict} />}
      </div>
      {message.content ? (
        <Markdown content={message.content} />
      ) : (
        <span className="text-xs text-bark-500 italic">Thinking...</span>
      )}
    </div>
  );
}
