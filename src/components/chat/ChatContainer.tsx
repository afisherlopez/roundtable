'use client';

import { useRef, useEffect, ReactNode, useCallback } from 'react';

interface ChatContainerProps {
  children: ReactNode;
}

export function ChatContainer({ children }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);

  // Check if user is near the bottom (within 120px)
  const isNearBottom = useCallback(() => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - scrollTop - clientHeight < 120;
  }, []);

  // Track whether we should keep auto-scrolling as new content streams in.
  // If the user scrolls away from the bottom, we stop auto-scrolling until they return.
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    shouldStickToBottomRef.current = isNearBottom();
  }, [isNearBottom]);

  // Auto-scroll only when the user is already near the bottom.
  // Avoid smooth scrolling here: with streaming tokens it can feel like stutter/fighting.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!shouldStickToBottomRef.current) return;

    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [children]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="max-w-3xl mx-auto">
        {children}
      </div>
    </div>
  );
}
