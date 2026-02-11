// src/components/statistics/PeriodComparisonChart.tsx
// 두 기간을 나란히 비교하는 차트 (이번 주 vs 지난 주, 이번 달 vs 지난 달)
// Amplitude/Mixpanel의 "Compare to previous period" 기능

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PeriodStats } from '@/types';
import { cn } from '@/utils';

/* ─────────────────── Types ─────────────────── */

interface PeriodComparisonChartProps {
  dailyStats: PeriodStats[];
  className?: string;
}

type ComparisonPeriod = 'week' | 'month';

interface ComparisonItem {
  label: string;
  currentGames: number;
  previousGames: number;
  currentWins: number;
  previousWins: number;
  currentWinRate: number;
  previousWinRate: number;
  currentDuration: number;
  previousDuration: number;
}

/* ─────────────────── Utils ─────────────────── */

function buildPeriodData(
  dailyStats: PeriodStats[],
  startDate: Date,
  days: number,
) {
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const found = dailyStats.find((s) => s.date === dateStr);
    result.push({
      date: dateStr,
      dateObj: new Date(d),
      games: found?.gamesPlayed ?? 0,
      wins: found?.wins ?? 0,
      losses: found?.losses ?? 0,
      draws: found?.draws ?? 0,
      duration: found?.totalDuration ?? 0,
    });
  }
  return result;
}

const DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

/* ─────────────────── Tooltip ─────────────────── */

function ComparisonTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string; payload: ComparisonItem }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl min-w-[200px]">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2.5 pb-2 border-b border-gray-100 dark:border-gray-700">
        {label}
      </p>
      <div className="space-y-2">
        {/* 현재 기간 */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">이번 기간</span>
          </div>
          <div className="pl-4 space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">게임</span>
              <span className="font-medium">{data.currentGames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">승률</span>
              <span className="font-medium text-blue-500">{data.currentWinRate.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* 이전 기간 */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">이전 기간</span>
          </div>
          <div className="pl-4 space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">게임</span>
              <span className="font-medium">{data.previousGames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">승률</span>
              <span className="font-medium text-gray-500">{data.previousWinRate.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* 변화 */}
        {data.previousGames > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            {(() => {
              const gameDiff = data.currentGames - data.previousGames;
              const winRateDiff = data.currentWinRate - data.previousWinRate;
              return (
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">게임 수 변화</span>
                    <span className={gameDiff >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {gameDiff >= 0 ? '+' : ''}{gameDiff}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">승률 변화</span>
                    <span className={winRateDiff >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {winRateDiff >= 0 ? '+' : ''}{winRateDiff.toFixed(1)}%p
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */

export function PeriodComparisonChart({
  dailyStats,
  className,
}: PeriodComparisonChartProps) {
  const [period, setPeriod] = useState<ComparisonPeriod>('week');

  const days = period === 'week' ? 7 : 30;

  // 현재 기간 & 이전 기간 데이터
  const { currentData, previousData } = useMemo(() => {
    const today = new Date();

    const currentStart = new Date(today);
    currentStart.setDate(currentStart.getDate() - days + 1);

    const previousStart = new Date(today);
    previousStart.setDate(previousStart.getDate() - days * 2 + 1);

    return {
      currentData: buildPeriodData(dailyStats, currentStart, days),
      previousData: buildPeriodData(dailyStats, previousStart, days),
    };
  }, [dailyStats, days]);

  // 비교 차트 데이터 구성
  const chartData = useMemo<ComparisonItem[]>(() => {
    return currentData.map((curr, i) => {
      const prev = previousData[i];

      const currentWinRate = curr.games > 0 ? (curr.wins / curr.games) * 100 : 0;
      const previousWinRate = prev.games > 0 ? (prev.wins / prev.games) * 100 : 0;

      // 레이블: 주간이면 요일, 월간이면 날짜
      const label = period === 'week'
        ? DAY_SHORT[curr.dateObj.getDay()]
        : `${curr.dateObj.getDate()}일`;

      return {
        label,
        currentGames: curr.games,
        previousGames: prev.games,
        currentWins: curr.wins,
        previousWins: prev.wins,
        currentWinRate,
        previousWinRate,
        currentDuration: curr.duration,
        previousDuration: prev.duration,
      };
    });
  }, [currentData, previousData, period]);

  // 요약 통계
  const summary = useMemo(() => {
    const currTotal = currentData.reduce((s, d) => s + d.games, 0);
    const prevTotal = previousData.reduce((s, d) => s + d.games, 0);
    const currWins = currentData.reduce((s, d) => s + d.wins, 0);
    const prevWins = previousData.reduce((s, d) => s + d.wins, 0);
    const currWinRate = currTotal > 0 ? (currWins / currTotal) * 100 : 0;
    const prevWinRate = prevTotal > 0 ? (prevWins / prevTotal) * 100 : 0;
    const currDuration = currentData.reduce((s, d) => s + d.duration, 0);
    const prevDuration = previousData.reduce((s, d) => s + d.duration, 0);

    const gameChange = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : (currTotal > 0 ? 100 : 0);
    const winRateChange = currWinRate - prevWinRate;
    const durationChange = prevDuration > 0 ? ((currDuration - prevDuration) / prevDuration) * 100 : (currDuration > 0 ? 100 : 0);

    return {
      currTotal, prevTotal, currWinRate, prevWinRate, currDuration, prevDuration,
      gameChange, winRateChange, durationChange,
    };
  }, [currentData, previousData]);

  const periodLabel = period === 'week' ? '주' : '달';

  return (
    <div className={cn('space-y-5', className)}>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            기간 비교
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이번 {periodLabel} vs 지난 {periodLabel} 성과를 비교합니다.
          </p>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={cn(
              'px-4 py-1.5 text-xs font-medium rounded-md transition-all',
              period === 'week'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            주간
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={cn(
              'px-4 py-1.5 text-xs font-medium rounded-md transition-all',
              period === 'month'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            월간
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          title="게임 수"
          current={summary.currTotal}
          previous={summary.prevTotal}
          change={summary.gameChange}
          format={(v) => `${v}`}
        />
        <SummaryCard
          title="승률"
          current={summary.currWinRate}
          previous={summary.prevWinRate}
          change={summary.winRateChange}
          format={(v) => `${v.toFixed(1)}%`}
          isPercentagePoint
        />
        <SummaryCard
          title="플레이 시간"
          current={summary.currDuration}
          previous={summary.prevDuration}
          change={summary.durationChange}
          format={(v) => v < 60 ? `${Math.round(v)}초` : `${Math.round(v / 60)}분`}
        />
      </div>

      {/* 바 차트 */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ComparisonTooltip />} />
          <Legend
            verticalAlign="top"
            height={30}
            formatter={(value: string) => (
              <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
          <Bar
            dataKey="currentGames"
            name={`이번 ${periodLabel}`}
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            animationDuration={500}
            maxBarSize={period === 'week' ? 40 : 16}
          />
          <Bar
            dataKey="previousGames"
            name={`지난 ${periodLabel}`}
            fill="#d1d5db"
            radius={[4, 4, 0, 0]}
            animationDuration={500}
            maxBarSize={period === 'week' ? 40 : 16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────── Summary Card ─────────────────── */

function SummaryCard({
  title,
  current,
  previous,
  change,
  format,
  isPercentagePoint = false,
}: {
  title: string;
  current: number;
  previous: number;
  change: number;
  format: (v: number) => string;
  isPercentagePoint?: boolean;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {format(current)}
        </span>
        {previous > 0 && (
          <span
            className={cn(
              'text-xs font-medium',
              change >= 0 ? 'text-green-500' : 'text-red-500',
            )}
          >
            {change >= 0 ? '↑' : '↓'}
            {isPercentagePoint
              ? `${Math.abs(change).toFixed(1)}%p`
              : `${Math.abs(change).toFixed(0)}%`}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        이전: {format(previous)}
      </p>
    </div>
  );
}
