// src/components/chess/PlayerInfo.tsx

import type { PieceColor } from '@/types';
import { cn } from '@/utils';

interface PlayerInfoProps {
  color: PieceColor;
  name: string;
  isCurrentTurn: boolean;
  timeRemaining?: number | null;
  isPlayer?: boolean;
  className?: string;
}

export function PlayerInfo({
  color,
  name,
  isCurrentTurn,
  timeRemaining,
  isPlayer = false,
  className,
}: PlayerInfoProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime =
    timeRemaining !== null &&
    timeRemaining !== undefined &&
    timeRemaining < 30;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all',
        isCurrentTurn
          ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500'
          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent',
        className
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full border-2 flex items-center justify-center',
          color === 'w' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600'
        )}
      >
        <span className={color === 'w' ? 'text-gray-800' : 'text-white'}>
          {color === 'w' ? '♔' : '♚'}
        </span>
      </div>
      <div className="flex-1">
        <p className="font-medium">
          {name}
          {isPlayer && (
            <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">
              (나)
            </span>
          )}
        </p>
        {isCurrentTurn && (
          <p className="text-xs text-primary-600 dark:text-primary-400">
            생각 중...
          </p>
        )}
      </div>
      {timeRemaining !== null && timeRemaining !== undefined && (
        <div
          className={cn(
            'px-3 py-1 rounded-md font-mono text-lg',
            isLowTime
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
              : 'bg-gray-100 dark:bg-gray-700'
          )}
        >
          {formatTime(timeRemaining)}
        </div>
      )}
    </div>
  );
}
