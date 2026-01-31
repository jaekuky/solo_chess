// src/components/chess/Timer.tsx

import { useMemo } from 'react';
import { cn } from '@/utils';

interface TimerProps {
  timeInSeconds: number;
  isActive: boolean;
  isExpired?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Timer({
  timeInSeconds,
  isActive,
  isExpired = false,
  size = 'md',
  className,
}: TimerProps) {
  // 시간 포맷팅
  const formattedTime = useMemo(() => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeInSeconds]);

  // 시간 부족 경고 (30초 미만)
  const isLowTime = timeInSeconds < 30 && timeInSeconds > 0;

  // 매우 부족 (10초 미만)
  const isCriticalTime = timeInSeconds < 10 && timeInSeconds > 0;

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-lg px-3 py-1.5',
    lg: 'text-2xl px-4 py-2 font-bold',
  };

  return (
    <div
      className={cn(
        'font-mono rounded-lg transition-all',
        sizeClasses[size],
        // 기본 상태
        !isActive &&
          !isExpired &&
          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        // 활성 상태
        isActive &&
          !isLowTime &&
          'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300',
        // 시간 부족
        isActive &&
          isLowTime &&
          !isCriticalTime &&
          'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
        // 시간 매우 부족
        isActive &&
          isCriticalTime &&
          'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 animate-pulse',
        // 만료
        isExpired && 'bg-red-600 text-white',
        className,
      )}
    >
      {isExpired ? '시간 초과!' : formattedTime}
    </div>
  );
}
