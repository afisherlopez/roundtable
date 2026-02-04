'use client';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block w-4 h-4 border-2 border-spring-300 border-t-spring-500 rounded-full animate-spin ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
