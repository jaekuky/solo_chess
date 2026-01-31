// src/components/statistics/ActivityChart.tsx

import { useMemo } from 'react';
import type { PeriodStats } from '@/types';
import { cn } from '@/utils';

interface ActivityChartProps {
  dailyStats: PeriodStats[];
  days?: number;
  className?: string;
}

export function ActivityChart({
  dailyStats,
  days = 30,
  className,
}: ActivityChartProps) {
  // 최근 N일 데이터 준비
  const chartData = useMemo(() => {
    const data: { date: string; games: number; wins: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStats = dailyStats.find((d) => d.date === dateStr);

      data.push({
        date: dateStr,
        games: dayStats?.gamesPlayed || 0,
        wins: dayStats?.wins || 0,
      });
    }

    return data;
  }, [dailyStats, days]);

  // 최대 게임 수 (차트 스케일용)
  const maxGames = Math.max(...chartData.map((d) => d.games), 1);

  return (
    <div className={cn(className)}>
      <div className="flex items-end gap-1 h-24">
        {chartData.map((day) => {
          const height = (day.games / maxGames) * 100;
          const winRate = day.games > 0 ? day.wins / day.games : 0;

          // 색상 (승률에 따라)
          const getColor = () => {
            if (day.games === 0) return 'bg-gray-200 dark:bg-gray-700';
            if (winRate >= 0.6) return 'bg-green-500';
            if (winRate >= 0.4) return 'bg-yellow-500';
            return 'bg-red-500';
          };

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={cn(
                  'w-full rounded-t transition-all hover:opacity-80',
                  getColor(),
                )}
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${day.date}: ${day.games}게임, ${day.wins}승`}
              />
            </div>
          );
        })}
      </div>

      {/* X축 레이블 (일주일 간격) */}
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        {chartData
          .filter((_, i) => i % 7 === 0)
          .map((day) => (
            <span key={day.date}>
              {new Date(day.date).getMonth() + 1}/
              {new Date(day.date).getDate()}
            </span>
          ))}
      </div>
    </div>
  );
}
