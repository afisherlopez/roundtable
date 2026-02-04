'use client';

import { useState } from 'react';
import type { DebateState } from '@/types/debate';
import { DebateRoundComponent } from '@/components/debate/DebateRound';
import { ProgressIndicator } from '@/components/debate/ProgressIndicator';

interface DebatePanelProps {
  debateState: DebateState;
}

export function DebatePanel({ debateState }: DebatePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (debateState.status === 'idle' || debateState.rounds.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      {/* Summary */}
      {debateState.summary && (
        <div className="text-xs text-bark-500 mb-2 italic">
          {debateState.summary}
        </div>
      )}

      {/* Progress */}
      {debateState.status === 'debating' && (
        <div className="mb-2">
          <ProgressIndicator
            currentRound={debateState.currentRound}
            currentModel={debateState.currentModel}
            status={debateState.status}
          />
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-xs text-spring-500 hover:text-spring-400 transition-colors cursor-pointer"
      >
        <span
          className={`transform transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        >
          &#9654;
        </span>
        <span>
          {isExpanded ? 'Hide' : 'View'} Discussion ({debateState.rounds.length}{' '}
          round{debateState.rounds.length !== 1 ? 's' : ''})
        </span>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-3 bg-spring-200 rounded border border-spring-300 p-4 max-h-[60vh] overflow-y-auto">
          {debateState.rounds.map((round) => (
            <DebateRoundComponent key={round.roundNumber} round={round} />
          ))}
        </div>
      )}
    </div>
  );
}
