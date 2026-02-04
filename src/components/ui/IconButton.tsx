'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={`p-2 text-bark-600 hover:text-bark-800 hover:bg-spring-200 rounded transition-colors duration-150 cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
