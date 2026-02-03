// src/components/common/LoadingOverlay.tsx

import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/utils';

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
  transparent?: boolean;
  className?: string;
}

export function LoadingOverlay({
  message = '로딩 중...',
  fullScreen = false,
  transparent = false,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen && 'fixed inset-0 z-50',
        !fullScreen && 'absolute inset-0',
        transparent
          ? 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm'
          : 'bg-white dark:bg-gray-900',
        className
      )}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-sm text-gray-500 animate-pulse">{message}</p>
      )}
    </div>
  );
}
