'use client';

import { useRef, useEffect, ReactNode, useState, useCallback } from 'react';

interface ChatContainerProps {
  children: ReactNode;
}

export function ChatContainer({ children }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastScrollTop = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check if user is near the bottom (within 100px)
  const isNearBottom = useCallback(() => {
    if (!scrollRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Handle scroll events to detect user scrolling up
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const currentScrollTop = scrollRef.current.scrollTop;
    
    // User scrolled up
    if (currentScrollTop < lastScrollTop.current - 10) {
      setIsUserScrolling(true);
    }
    
    // User is at or near bottom, allow auto-scroll again
    if (isNearBottom()) {
      setIsUserScrolling(false);
    }
    
    lastScrollTop.current = currentScrollTop;

    // Reset the timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // After user stops scrolling for 1.5s near bottom, re-enable auto-scroll
    scrollTimeout.current = setTimeout(() => {
      if (isNearBottom()) {
        setIsUserScrolling(false);
      }
    }, 1500);
  }, [isNearBottom]);

  // Auto-scroll only when not user scrolling and content changes
  useEffect(() => {
    if (!isUserScrolling && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [children, isUserScrolling]);

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
