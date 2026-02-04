'use client';

import { useState, useCallback, useEffect } from 'react';

export interface ModelStats {
  chatgpt: number;
  claude: number;
  gemini: number;
}

const STORAGE_KEY = 'roundtable_stats';

const INITIAL_STATS: ModelStats = {
  chatgpt: 0,
  claude: 0,
  gemini: 0,
};

export function useStats() {
  const [stats, setStats] = useState<ModelStats>(INITIAL_STATS);

  // Load stats from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setStats(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const recordContribution = useCallback((finalAnswer: string) => {
    // Parse the final answer to find primary contributors
    // Look for patterns like "Primary contributors: Claude and Gemini" or "Primary contributor: ChatGPT"
    const contributorMatch = finalAnswer.match(/primary contributors?[:\s]+([^.]+)/i);
    
    if (contributorMatch) {
      const contributorText = contributorMatch[1].toLowerCase();
      
      setStats((prev) => {
        const newStats = { ...prev };
        
        if (contributorText.includes('chatgpt') || contributorText.includes('gpt')) {
          newStats.chatgpt += 1;
        }
        if (contributorText.includes('claude')) {
          newStats.claude += 1;
        }
        if (contributorText.includes('gemini')) {
          newStats.gemini += 1;
        }
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
        
        return newStats;
      });
    }
  }, []);

  const resetStats = useCallback(() => {
    setStats(INITIAL_STATS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATS));
  }, []);

  return {
    stats,
    recordContribution,
    resetStats,
  };
}
