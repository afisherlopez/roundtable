'use client';

import type { ModelStats } from '@/hooks/useStats';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ModelStats;
  onReset: () => void;
}

const MODEL_COLORS = {
  chatgpt: '#4090d0', // sky blue
  claude: '#e06050', // poppy red
  gemini: '#9060c8', // iris purple
};

const MODEL_LABELS = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
};

export function StatsPanel({ isOpen, onClose, stats, onReset }: StatsPanelProps) {
  const maxValue = Math.max(stats.chatgpt, stats.claude, stats.gemini, 1);
  const total = stats.chatgpt + stats.claude + stats.gemini;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 right-0 w-80 bg-spring-50 border-l border-t border-spring-300 rounded-tl-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-spring-300 bg-spring-100 rounded-tl-xl">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-bark-600">
              <rect x="1" y="8" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.6"/>
              <rect x="6" y="4" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.8"/>
              <rect x="11" y="2" width="3" height="12" rx="0.5" fill="currentColor"/>
            </svg>
            <h2 className="text-sm font-bold text-bark-800">Model Stats</h2>
          </div>
          <button
            onClick={onClose}
            className="text-bark-500 hover:text-bark-800 transition-colors cursor-pointer p-1"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-[10px] text-bark-500 uppercase tracking-wide mb-3">
            Primary Contributions to Best Answer
          </p>

          {total === 0 ? (
            <p className="text-sm text-bark-500 text-center py-6">
              No debates completed yet
            </p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(stats) as Array<keyof ModelStats>).map((model) => {
                const value = stats[model];
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                
                return (
                  <div key={model}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-bark-800">
                        {MODEL_LABELS[model]}
                      </span>
                      <span className="text-xs text-bark-500">
                        {value} {value === 1 ? 'time' : 'times'}
                      </span>
                    </div>
                    <div className="h-6 bg-spring-200 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: MODEL_COLORS[model],
                          minWidth: value > 0 ? '8px' : '0',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total */}
          {total > 0 && (
            <div className="mt-4 pt-3 border-t border-spring-200">
              <p className="text-xs text-bark-500 text-center">
                {total} total debate{total !== 1 ? 's' : ''} completed
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-spring-200 bg-spring-100">
          <button
            onClick={onReset}
            className="w-full text-xs text-bark-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Reset Stats
          </button>
        </div>
      </div>
    </>
  );
}
