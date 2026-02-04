'use client';

import type { DebateRound as DebateRoundType } from '@/types/debate';
import { DebateMessageComponent } from './DebateMessage';

interface DebateRoundProps {
  round: DebateRoundType;
}

export function DebateRoundComponent({ round }: DebateRoundProps) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-wider text-bark-500 mb-2 font-bold">
        Round {round.roundNumber}
      </div>
      <div className="space-y-3">
        {round.messages.map((message, i) => (
          <DebateMessageComponent key={`${round.roundNumber}-${message.modelId}-${i}`} message={message} />
        ))}
      </div>
    </div>
  );
}
