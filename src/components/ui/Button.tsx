'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const base =
      'font-mono font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
    const variants = {
      primary:
        'bg-spring-500 text-white hover:bg-spring-400 border border-spring-400',
      secondary:
        'bg-spring-100 text-bark-800 hover:bg-spring-200 border border-spring-300',
      ghost:
        'bg-transparent text-bark-600 hover:text-bark-800 hover:bg-spring-100',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded',
      md: 'px-4 py-2 text-sm rounded-md',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
