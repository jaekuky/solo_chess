// src/components/statistics/TrendChart.tsx
// 승률 추이를 이동평균 라인 차트로 시각화

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { PeriodStats } from '@/types';
import { cn } from '@/utils';

interface TrendChartProps {
  dailyStats: PeriodStats[];
  days?: number;
  className?: string;
}

interface TrendDataItem {
  date: string;
  label: string;
  winRate: number | null;
  movingAvg7: number | null;
  movingAvg30: number | null;
  cumulativeWinRate: number;
  games: number;
}

// 이동 평균 계산
function calculateMovingAverage(
  data: { winRate: number | null; games: number }[],
  windowSize: number,
): (number | null)[] {
  return data.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = data.slice(start, index + 1);
    const validItems = window.filter((d) => d.games > 0);
    if (validItems.length === 0) return null;

    const totalWins = window.reduce(
      (sum, _d, i) => {
        const dayData = data[start + i];
        return sum + (dayData.games > 0 ? (dayData.winRate ?? 0) * dayData.games : 0);
      },
      0,
    );
    const totalGames = window.reduce((sum, d) => sum + d.games, 0);
    return totalGames > 0 ? totalWins / totalGames : null;
  });
}

// 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number | null; name: string; color: string; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const gamesEntry = payload.find((p) => p.dataKey === 'winRate');
  const games = gamesEntry ? (gamesEntry as unknown as { payload: { games: number } }).payload?.games : 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      <div className="space-y-1.5">
        {games > 0 && (
          <div className="text-xs text-gray-500">
            게임 수: {games}
          </div>
        )}
        {payload.map(
          (entry, i) =>
            entry.value !== null && (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                <span className="font-medium ml-auto" style={{ color: entry.color }}>
                  {entry.value.toFixed(1)}%
                </span>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

export function TrendChart({
  dailyStats,
  days = 90,
  className,
}: TrendChartProps) {
  const chartData = useMemo<TrendDataItem[]>(() => {
    const rawData: { date: string; label: string; winRate: number | null; games: number; totalWins: number; totalGames: number }[] = [];
    const today = new Date();
    let cumulativeWins = 0;
    let cumulativeGames = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStats = dailyStats.find((d) => d.date === dateStr);

      const games = dayStats?.gamesPlayed || 0;
      const wins = dayStats?.wins || 0;
      cumulativeWins += wins;
      cumulativeGames += games;

      rawData.push({
        date: dateStr,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        winRate: games > 0 ? (wins / games) * 100 : null,
        games,
        totalWins: cumulativeWins,
        totalGames: cumulativeGames,
      });
    }

    // 이동 평균 계산
    const ma7 = calculateMovingAverage(rawData, 7);
    const ma30 = calculateMovingAverage(rawData, 30);

    return rawData.map((item, i) => ({
      ...item,
      movingAvg7: ma7[i],
      movingAvg30: ma30[i],
      cumulativeWinRate:
        item.totalGames > 0 ? (item.totalWins / item.totalGames) * 100 : 0,
    }));
  }, [dailyStats, days]);

  // 전체 평균 승률
  const overallAvg = useMemo(() => {
    const totalGames = chartData.reduce((sum, d) => sum + d.games, 0);
    const totalWins = chartData.reduce(
      (sum, d) => sum + (d.winRate !== null ? (d.winRate / 100) * d.games : 0),
      0,
    );
    return totalGames > 0 ? (totalWins / totalGames) * 100 : 50;
  }, [chartData]);

  const tickInterval = days <= 14 ? 1 : days <= 30 ? 4 : 13;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-500 rounded" />
          <span>7일 이동평균</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-purple-500 rounded" />
          <span>30일 이동평균</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-gray-400 rounded border-dashed" />
          <span>평균 ({overallAvg.toFixed(0)}%)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={overallAvg}
            stroke="#9ca3af"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <ReferenceLine
            y={50}
            stroke="#e5e7eb"
            strokeWidth={1}
            className="dark:opacity-30"
          />

          {/* 7일 이동평균 영역 */}
          <Area
            type="monotone"
            dataKey="movingAvg7"
            name="7일 이동평균"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#winRateGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={800}
            connectNulls
          />

          {/* 30일 이동평균 라인 */}
          <Area
            type="monotone"
            dataKey="movingAvg30"
            name="30일 이동평균"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="transparent"
            dot={false}
            activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={1000}
            connectNulls
          />

          {/* 일별 승률 (점으로만 표시) */}
          <Area
            type="monotone"
            dataKey="winRate"
            name="일별 승률"
            stroke="transparent"
            fill="transparent"
            dot={(props: { cx?: number; cy?: number; payload?: TrendDataItem }) => {
              if (!props.payload?.games || props.payload.winRate === null || props.cx == null || props.cy == null) return <></>;
              const size = Math.min(6, 2 + props.payload.games);
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={size}
                  fill={props.payload.winRate >= 50 ? '#22c55e' : '#ef4444'}
                  fillOpacity={0.6}
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            }}
            activeDot={false}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
