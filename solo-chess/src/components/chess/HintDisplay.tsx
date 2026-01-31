// src/components/chess/HintDisplay.tsx

import type { Square } from 'chess.js';
import { cn } from '@/utils';

interface HintDisplayProps {
  hint: { from: Square; to: Square } | null;
  isLoading: boolean;
  hintsUsed: number;
  maxHints?: number;
  onRequestHint: () => void;
  onClearHint: () => void;
  disabled?: boolean;
  className?: string;
}

export function HintDisplay({
  hint,
  isLoading,
  hintsUsed,
  maxHints = Infinity,
  onRequestHint,
  onClearHint,
  disabled = false,
  className,
}: HintDisplayProps) {
  const hasUnlimitedHints = maxHints === Infinity;
  const remainingHints = hasUnlimitedHints ? Infinity : maxHints - hintsUsed;
  const canRequestHint = !disabled && !isLoading && remainingHints > 0;

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium flex items-center gap-2">💡 힌트</h4>
        {!hasUnlimitedHints && (
          <span className="text-sm text-gray-500">
            남은 횟수:{' '}
            {remainingHints === Infinity ? '무제한' : remainingHints}
          </span>
        )}
      </div>

      {hint ? (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              추천 수:{' '}
              <span className="font-mono font-bold">
                {hint.from} → {hint.to}
              </span>
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              체스판에 파란색으로 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClearHint}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            힌트 숨기기
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRequestHint}
          disabled={!canRequestHint}
          className={cn(
            'w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors',
            canRequestHint
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500',
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⟳</span>
              분석 중...
            </span>
          ) : remainingHints === 0 ? (
            '힌트를 모두 사용했습니다'
          ) : (
            '힌트 보기'
          )}
        </button>
      )}

      {hintsUsed > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          이 게임에서 {hintsUsed}번 힌트를 사용했습니다.
        </p>
      )}
    </div>
  );
}
