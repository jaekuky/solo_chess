// src/components/common/Button.tsx

import { forwardRef } from 'react';
import { cn } from '@/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary:
        'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost:
        'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
      outline:
        'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
    };
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled ?? isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <span className="mr-2 animate-spin">⟳</span>}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
