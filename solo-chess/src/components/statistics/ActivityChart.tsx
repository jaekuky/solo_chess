// src/components/statistics/ActivityChart.tsx

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PeriodStats } from '@/types';
import { cn } from '@/utils';

interface ActivityChartProps {
  dailyStats: PeriodStats[];
  days?: number;
  className?: string;
}

type ViewRange = 7 | 14 | 30 | 90;

interface ChartDataItem {
  date: string;
  label: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  duration: number;
}

// 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const games = payload.find((p) => p.name === '게임 수')?.value || 0;
  const wins = payload.find((p) => p.name === '승리')?.value || 0;
  const losses = payload.find((p) => p.name === '패배')?.value || 0;
  const draws = payload.find((p) => p.name === '무승부')?.value || 0;
  const winRate = payload.find((p) => p.name === '승률')?.value;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg min-w-[160px]">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1.5">
        {label}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">총 게임</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{games}</span>
        </div>
        {games > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">승리</span>
              <span className="font-medium text-green-600">{wins}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">무승부</span>
              <span className="font-medium text-gray-500">{draws}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-500">패배</span>
              <span className="font-medium text-red-500">{losses}</span>
            </div>
            {winRate !== undefined && (
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100 dark:border-gray-700">
                <span className="text-blue-500">승률</span>
                <span className="font-medium text-blue-500">{winRate.toFixed(0)}%</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ActivityChart({
  dailyStats,
  days = 30,
  className,
}: ActivityChartProps) {
  const [viewRange, setViewRange] = useState<ViewRange>(
    (days <= 7 ? 7 : days <= 14 ? 14 : days <= 30 ? 30 : 90) as ViewRange
  );

  // 차트 데이터 준비
  const chartData = useMemo<ChartDataItem[]>(() => {
    const data: ChartDataItem[] = [];
    const today = new Date();

    for (let i = viewRange - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = dailyStats.find((d) => d.date === dateStr);

      const games = dayStats?.gamesPlayed || 0;
      const wins = dayStats?.wins || 0;
      const losses = dayStats?.losses || 0;
      const draws = dayStats?.draws || 0;

      data.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        games,
        wins,
        losses,
        draws,
        winRate: games > 0 ? (wins / games) * 100 : 0,
        duration: dayStats?.totalDuration || 0,
      });
    }

    return data;
  }, [dailyStats, viewRange]);

  // 요약 통계
  const summary = useMemo(() => {
    const totalGames = chartData.reduce((sum, d) => sum + d.games, 0);
    const totalWins = chartData.reduce((sum, d) => sum + d.wins, 0);
    const activeDays = chartData.filter((d) => d.games > 0).length;
    const avgGames = activeDays > 0 ? totalGames / activeDays : 0;
    const overallWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    return { totalGames, totalWins, activeDays, avgGames, overallWinRate };
  }, [chartData]);

  // X축 틱 간격 조정
  const tickInterval = viewRange <= 7 ? 0 : viewRange <= 14 ? 1 : viewRange <= 30 ? 4 : 13;

  const viewRanges: { value: ViewRange; label: string }[] = [
    { value: 7, label: '7일' },
    { value: 14, label: '14일' },
    { value: 30, label: '30일' },
    { value: 90, label: '90일' },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더: 기간 선택 + 요약 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">기간 내 게임</span>
            <span className="font-bold text-lg ml-2 text-gray-800 dark:text-gray-100">
              {summary.totalGames}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <div>
            <span className="text-gray-500">활동일</span>
            <span className="font-bold text-lg ml-2 text-blue-600">
              {summary.activeDays}일
            </span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <div>
            <span className="text-gray-500">기간 승률</span>
            <span className={cn(
              'font-bold text-lg ml-2',
              summary.overallWinRate >= 50 ? 'text-green-600' : 'text-red-500',
            )}>
              {summary.overallWinRate.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* 기간 선택 버튼 */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {viewRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => setViewRange(range.value)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                viewRange === range.value
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 차트 */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
            className="dark:opacity-20"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval={tickInterval}
          />
          <YAxis
            yAxisId="games"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="winRate"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={30}
            formatter={(value: string) => (
              <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />

          {/* 스택 바 차트 - 승/무/패 */}
          <Bar
            yAxisId="games"
            dataKey="wins"
            name="승리"
            stackId="result"
            fill="#22c55e"
            radius={[0, 0, 0, 0]}
            animationDuration={600}
          />
          <Bar
            yAxisId="games"
            dataKey="draws"
            name="무승부"
            stackId="result"
            fill="#d1d5db"
            radius={[0, 0, 0, 0]}
            animationDuration={600}
          />
          <Bar
            yAxisId="games"
            dataKey="losses"
            name="패배"
            stackId="result"
            fill="#ef4444"
            radius={[2, 2, 0, 0]}
            animationDuration={600}
          />

          {/* 승률 라인 오버레이 */}
          <Line
            yAxisId="winRate"
            type="monotone"
            dataKey="winRate"
            name="승률"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={800}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
