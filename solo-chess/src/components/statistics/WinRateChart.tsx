// src/components/statistics/WinRateChart.tsx

import { useMemo } from 'react';
import { cn } from '@/utils';

interface WinRateChartProps {
  wins: number;
  losses: number;
  draws: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function WinRateChart({
  wins,
  losses,
  draws,
  size = 'md',
  showLabels = true,
  className,
}: WinRateChartProps) {
  const total = wins + losses + draws;

  const percentages = useMemo(() => {
    if (total === 0) return { wins: 0, losses: 0, draws: 0 };
    return {
      wins: (wins / total) * 100,
      losses: (losses / total) * 100,
      draws: (draws / total) * 100,
    };
  }, [wins, losses, draws, total]);

  const sizeConfig = {
    sm: { height: 'h-2', text: 'text-xs' },
    md: { height: 'h-3', text: 'text-sm' },
    lg: { height: 'h-4', text: 'text-base' },
  };

  const config = sizeConfig[size];

  if (total === 0) {
    return (
      <div className={className}>
        <div
          className={cn(
            'w-full bg-gray-200 dark:bg-gray-700 rounded-full',
            config.height,
          )}
        />
        {showLabels && (
          <p className={cn('text-center text-gray-400 mt-2', config.text)}>
            기록 없음
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 바 차트 */}
      <div
        className={cn(
          'w-full flex rounded-full overflow-hidden',
          config.height,
        )}
      >
        {percentages.wins > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${percentages.wins}%` }}
            title={`승리: ${wins}게임 (${percentages.wins.toFixed(1)}%)`}
          />
        )}
        {percentages.draws > 0 && (
          <div
            className="bg-gray-400 transition-all"
            style={{ width: `${percentages.draws}%` }}
            title={`무승부: ${draws}게임 (${percentages.draws.toFixed(1)}%)`}
          />
        )}
        {percentages.losses > 0 && (
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${percentages.losses}%` }}
            title={`패배: ${losses}게임 (${percentages.losses.toFixed(1)}%)`}
          />
        )}
      </div>

      {/* 레이블 */}
      {showLabels && (
        <div className={cn('flex justify-between mt-2', config.text)}>
          <span className="text-green-600 dark:text-green-400">
            {wins}승 ({percentages.wins.toFixed(0)}%)
          </span>
          <span className="text-gray-500">
            {draws}무 ({percentages.draws.toFixed(0)}%)
          </span>
          <span className="text-red-600 dark:text-red-400">
            {losses}패 ({percentages.losses.toFixed(0)}%)
          </span>
        </div>
      )}
    </div>
  );
}
