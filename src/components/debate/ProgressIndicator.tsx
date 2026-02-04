'use client';

import type { ModelId } from '@/types/debate';
import { MODEL_NAMES, MAX_ROUNDS } from '@/constants';
import { Spinner } from '@/components/ui/Spinner';

interface ProgressIndicatorProps {
  currentRound: number;
  currentModel: ModelId | null;
  status: 'idle' | 'debating' | 'complete' | 'error';
}

export function ProgressIndicator({
  currentRound,
  currentModel,
  status,
}: ProgressIndicatorProps) {
  if (status === 'idle') return null;

  if (status === 'complete') {
    return (
      <div className="flex items-center gap-2 text-xs text-clover-400">
        <span>&#10003;</span>
        <span>Debate complete</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-rose-400">
        <span>&#10007;</span>
        <span>Error occurred</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-bark-600">
      <Spinner />
      <span>
        Round {currentRound}/{MAX_ROUNDS}
        {currentModel && (
          <>
            : {MODEL_NAMES[currentModel]} responding
            <span className="animate-blink">&#9608;</span>
          </>
        )}
      </span>
    </div>
  );
}
