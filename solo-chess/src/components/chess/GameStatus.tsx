// src/components/chess/GameStatus.tsx

import { cn } from '@/utils';

interface GameStatusProps {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
  className?: string;
}

export function GameStatus({
  isCheck,
  isCheckmate,
  isStalemate,
  isDraw,
  turn,
  className,
}: GameStatusProps) {
  type StatusType = 'info' | 'warning' | 'danger' | 'success';
  let status: { message: string; type: StatusType } | null = null;

  if (isCheckmate) {
    const winner = turn === 'w' ? '흑' : '백';
    status = { message: `체크메이트! ${winner} 승리`, type: 'danger' };
  } else if (isStalemate) {
    status = { message: '스테일메이트! 무승부', type: 'info' };
  } else if (isDraw) {
    status = { message: '무승부', type: 'info' };
  } else if (isCheck) {
    status = { message: '체크!', type: 'warning' };
  }

  if (!status) return null;

  const colorClasses: Record<StatusType, string> = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    warning:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    success:
      'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };

  return (
    <div
      className={cn(
        'px-4 py-2 rounded-lg text-center font-medium animate-fade-in',
        colorClasses[status.type],
        className
      )}
    >
      {status.message}
    </div>
  );
}
