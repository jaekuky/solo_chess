// src/components/chess/AIThinkingIndicator.tsx

import { cn } from '@/utils';

interface AIThinkingIndicatorProps {
  message?: string;
  className?: string;
}

export function AIThinkingIndicator({
  message = 'AI가 생각 중입니다...',
  className,
}: AIThinkingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400',
        className
      )}
    >
      <div className="flex gap-1">
        <span
          className="h-2 w-2 rounded-full bg-primary-500 animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary-500 animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-2 w-2 rounded-full bg-primary-500 animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span>{message}</span>
    </div>
  );
}
