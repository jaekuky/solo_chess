// src/components/statistics/DifficultyBreakdown.tsx

import type { DifficultyStats, Difficulty } from '@/types';
import { DIFFICULTY_CONFIG } from '@/constants';
import { WinRateChart } from './WinRateChart';
import { cn } from '@/utils';

interface DifficultyBreakdownProps {
  stats: Record<Difficulty, DifficultyStats>;
  className?: string;
}

export function DifficultyBreakdown({
  stats,
  className,
}: DifficultyBreakdownProps) {
  const difficulties: Difficulty[] = [
    'beginner',
    'intermediate',
    'advanced',
    'custom',
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {difficulties.map((diff) => {
        const diffStats = stats[diff];
        const config = DIFFICULTY_CONFIG[diff];

        if (diffStats.gamesPlayed === 0) return null;

        const winRate = (diffStats.wins / diffStats.gamesPlayed) * 100;

        return (
          <div
            key={diff}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {diff === 'beginner' && '🌱'}
                  {diff === 'intermediate' && '🌿'}
                  {diff === 'advanced' && '🌳'}
                  {diff === 'custom' && '⚙️'}
                </span>
                <span className="font-medium">{config.name}</span>
              </div>
              <span className="text-sm text-gray-500">
                {diffStats.gamesPlayed}게임
              </span>
            </div>

            <WinRateChart
              wins={diffStats.wins}
              losses={diffStats.losses}
              draws={diffStats.draws}
              size="sm"
              showLabels={false}
            />

            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
              <div>
                <p className="text-gray-500">승률</p>
                <p className="font-medium">{winRate.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-gray-500">평균 수</p>
                <p className="font-medium">
                  {diffStats.averageMoves.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">최고 연승</p>
                <p className="font-medium">{diffStats.bestWinStreak}</p>
              </div>
            </div>
          </div>
        );
      })}

      {difficulties.every((d) => stats[d].gamesPlayed === 0) && (
        <p className="text-center text-gray-400 py-4">
          아직 플레이한 게임이 없습니다.
        </p>
      )}
    </div>
  );
}
