// src/components/statistics/TrendChart.tsx
// GA/Amplitude 스타일 다중 지표 시계열 트렌드 차트
// - 다중 지표 선택 (승률, 게임 수, 평균 수, 플레이 시간)
// - 기간 범위 선택 (7/14/30/60/90일)
// - 기간 비교 모드 (이번 기간 vs 지난 기간 오버레이)
// - 이동평균 + 누적 승률 + 일별 데이터 포인트

import { useMemo, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
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

/* ─────────────────── Types ─────────────────── */

interface TrendChartProps {
  dailyStats: PeriodStats[];
  className?: string;
}

type MetricKey = 'winRate' | 'games' | 'avgMoves' | 'duration';
type PeriodRange = 7 | 14 | 30 | 60 | 90;

interface MetricConfig {
  key: MetricKey;
  label: string;
  shortLabel: string;
  color: string;
  format: (v: number) => string;
  yDomain?: [number, number];
  unit: string;
}

interface DayData {
  date: string;
  label: string;
  dayOfWeek: string;
  // 현재 기간 값
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
  avgMoves: number | null;
  duration: number;
  // 이동평균
  ma7: number | null;
  ma30: number | null;
  // 누적
  cumulativeWinRate: number | null;
  // 비교 기간 값 (기간 비교 모드)
  prevGames?: number;
  prevWinRate?: number | null;
  prevMa7?: number | null;
  prevDuration?: number;
  prevAvgMoves?: number | null;
}

/* ─────────────────── Constants ─────────────────── */

const METRICS: MetricConfig[] = [
  {
    key: 'winRate',
    label: '승률',
    shortLabel: '승률',
    color: '#3b82f6',
    format: (v) => `${v.toFixed(1)}%`,
    yDomain: [0, 100],
    unit: '%',
  },
  {
    key: 'games',
    label: '게임 수',
    shortLabel: '게임',
    color: '#8b5cf6',
    format: (v) => `${Math.round(v)}게임`,
    unit: '게임',
  },
  {
    key: 'avgMoves',
    label: '평균 수',
    shortLabel: '평균수',
    color: '#f59e0b',
    format: (v) => `${v.toFixed(1)}수`,
    unit: '수',
  },
  {
    key: 'duration',
    label: '플레이 시간',
    shortLabel: '시간',
    color: '#10b981',
    format: (v) => {
      if (v < 60) return `${Math.round(v)}초`;
      if (v < 3600) return `${Math.round(v / 60)}분`;
      return `${(v / 3600).toFixed(1)}시간`;
    },
    unit: '분',
  },
];

const PERIOD_RANGES: { value: PeriodRange; label: string }[] = [
  { value: 7, label: '7일' },
  { value: 14, label: '14일' },
  { value: 30, label: '30일' },
  { value: 60, label: '60일' },
  { value: 90, label: '90일' },
];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/* ─────────────────── Utils ─────────────────── */

function calculateMovingAvg(
  values: (number | null)[],
  gameCounts: number[],
  windowSize: number,
): (number | null)[] {
  return values.map((_, idx) => {
    const start = Math.max(0, idx - windowSize + 1);
    let totalWeightedValue = 0;
    let totalWeight = 0;

    for (let i = start; i <= idx; i++) {
      if (values[i] !== null && gameCounts[i] > 0) {
        totalWeightedValue += values[i]! * gameCounts[i];
        totalWeight += gameCounts[i];
      }
    }
    return totalWeight > 0 ? totalWeightedValue / totalWeight : null;
  });
}

function buildDailyData(
  dailyStats: PeriodStats[],
  startDate: Date,
  days: number,
): { date: string; games: number; wins: number; losses: number; draws: number; duration: number }[] {
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const found = dailyStats.find((s) => s.date === dateStr);
    result.push({
      date: dateStr,
      games: found?.gamesPlayed ?? 0,
      wins: found?.wins ?? 0,
      losses: found?.losses ?? 0,
      draws: found?.draws ?? 0,
      duration: found?.totalDuration ?? 0,
    });
  }
  return result;
}

/* ─────────────────── Custom Tooltip ─────────────────── */

function TrendTooltip({
  active,
  payload,
  label,
  metric,
  compareMode,
}: {
  active?: boolean;
  payload?: { value: number | null; name: string; color: string; dataKey: string }[];
  label?: string;
  metric: MetricConfig;
  compareMode: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // payload[0]의 payload에 dayData가 있다
  const dayData = (payload[0] as unknown as { payload: DayData }).payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl min-w-[200px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {label}
        </span>
        <span className="text-xs text-gray-400">{dayData?.dayOfWeek}</span>
      </div>

      {/* 현재 기간 데이터 */}
      <div className="space-y-1.5">
        {dayData?.games > 0 && (
          <div className="text-xs text-gray-400">
            게임: {dayData.games} ({dayData.wins}승 {dayData.draws}무 {dayData.losses}패)
          </div>
        )}

        {payload.map((entry) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 dark:text-gray-400 text-xs">
                  {entry.name}
                </span>
              </div>
              <span
                className="font-semibold tabular-nums"
                style={{ color: entry.color }}
              >
                {metric.format(entry.value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* 기간 비교 차이 */}
      {compareMode && dayData && (() => {
        const currentMetricKey = metric.key === 'winRate' ? 'ma7' : metric.key;
        const prevKey = metric.key === 'winRate' ? 'prevMa7' : `prev${metric.key.charAt(0).toUpperCase() + metric.key.slice(1)}`;
        const currentVal = (dayData as unknown as Record<string, unknown>)[currentMetricKey] as number | null;
        const prevVal = (dayData as unknown as Record<string, unknown>)[prevKey] as number | null;

        if (currentVal != null && prevVal != null && prevVal !== 0) {
          const diff = currentVal - prevVal;
          const pctChange = (diff / Math.abs(prevVal)) * 100;
          return (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5 text-xs">
              <span className={diff >= 0 ? 'text-green-500' : 'text-red-500'}>
                {diff >= 0 ? '▲' : '▼'} {Math.abs(pctChange).toFixed(1)}%
              </span>
              <span className="text-gray-400">vs 이전 기간</span>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

/* ─────────────────── Summary Cards ─────────────────── */

function MetricSummary({
  currentData,
  prevData,
  metric,
  compareMode,
}: {
  currentData: DayData[];
  prevData: DayData[] | null;
  metric: MetricConfig;
  compareMode: boolean;
}) {
  const currentValue = useMemo(() => {
    const activeDays = currentData.filter((d) => d.games > 0);
    if (activeDays.length === 0) return null;

    switch (metric.key) {
      case 'winRate': {
        const totalWins = activeDays.reduce((s, d) => s + d.wins, 0);
        const totalGames = activeDays.reduce((s, d) => s + d.games, 0);
        return totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
      }
      case 'games':
        return activeDays.reduce((s, d) => s + d.games, 0);
      case 'avgMoves': {
        const totalMoves = activeDays.reduce(
          (s, d) => s + (d.avgMoves ?? 0) * d.games,
          0,
        );
        const totalGames = activeDays.reduce((s, d) => s + d.games, 0);
        return totalGames > 0 ? totalMoves / totalGames : 0;
      }
      case 'duration':
        return activeDays.reduce((s, d) => s + d.duration, 0);
      default:
        return 0;
    }
  }, [currentData, metric.key]);

  const prevValue = useMemo(() => {
    if (!prevData) return null;
    const activeDays = prevData.filter((d) => d.games > 0);
    if (activeDays.length === 0) return null;

    switch (metric.key) {
      case 'winRate': {
        const totalWins = activeDays.reduce((s, d) => s + d.wins, 0);
        const totalGames = activeDays.reduce((s, d) => s + d.games, 0);
        return totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
      }
      case 'games':
        return activeDays.reduce((s, d) => s + d.games, 0);
      case 'avgMoves': {
        const totalMoves = activeDays.reduce(
          (s, d) => s + (d.avgMoves ?? 0) * d.games,
          0,
        );
        const totalGames = activeDays.reduce((s, d) => s + d.games, 0);
        return totalGames > 0 ? totalMoves / totalGames : 0;
      }
      case 'duration':
        return activeDays.reduce((s, d) => s + d.duration, 0);
      default:
        return 0;
    }
  }, [prevData, metric.key]);

  const change = currentValue != null && prevValue != null && prevValue !== 0
    ? ((currentValue - prevValue) / Math.abs(prevValue)) * 100
    : null;

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {currentValue != null ? metric.format(currentValue) : '-'}
      </span>
      {compareMode && change != null && (
        <span
          className={cn(
            'text-sm font-semibold flex items-center gap-0.5',
            change >= 0 ? 'text-green-500' : 'text-red-500',
          )}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          <span className="text-gray-400 font-normal text-xs ml-1">
            vs 이전 기간
          </span>
        </span>
      )}
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */

export function TrendChart({ dailyStats, className }: TrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('winRate');
  const [periodRange, setPeriodRange] = useState<PeriodRange>(30);
  const [compareMode, setCompareMode] = useState(false);
  const [showMA7, setShowMA7] = useState(true);
  const [showMA30, setShowMA30] = useState(true);
  const [showCumulative, setShowCumulative] = useState(false);

  const metric = METRICS.find((m) => m.key === selectedMetric)!;

  // ─── 현재 기간 데이터 ───
  const currentRaw = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - periodRange + 1);
    return buildDailyData(dailyStats, start, periodRange);
  }, [dailyStats, periodRange]);

  // ─── 이전 기간 데이터 (비교 모드) ───
  const prevRaw = useMemo(() => {
    if (!compareMode) return null;
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - periodRange * 2 + 1);
    return buildDailyData(dailyStats, start, periodRange);
  }, [dailyStats, periodRange, compareMode]);

  // ─── 선택된 지표에 따른 값 추출 ───
  const extractMetricValues = useCallback(
    (raw: ReturnType<typeof buildDailyData>) => {
      return raw.map((d) => {
        switch (selectedMetric) {
          case 'winRate':
            return d.games > 0 ? (d.wins / d.games) * 100 : null;
          case 'games':
            return d.games;
          case 'avgMoves':
            return d.games > 0 ? (d.wins + d.losses + d.draws) : null; // 일단 게임 수 기준
          case 'duration':
            return d.duration;
          default:
            return null;
        }
      });
    },
    [selectedMetric],
  );

  // ─── 차트 데이터 구성 ───
  const chartData = useMemo<DayData[]>(() => {
    const metricValues = extractMetricValues(currentRaw);
    const gameCounts = currentRaw.map((d) => d.games);

    // 이동평균 (승률에 대해서만 가중평균, 나머지는 단순평균)
    const ma7Values = selectedMetric === 'winRate'
      ? calculateMovingAvg(metricValues, gameCounts, 7)
      : metricValues.map((_, idx) => {
          const start = Math.max(0, idx - 6);
          const window = metricValues.slice(start, idx + 1).filter((v): v is number => v !== null);
          return window.length > 0 ? window.reduce((a, b) => a + b, 0) / window.length : null;
        });

    const ma30Values = selectedMetric === 'winRate'
      ? calculateMovingAvg(metricValues, gameCounts, 30)
      : metricValues.map((_, idx) => {
          const start = Math.max(0, idx - 29);
          const window = metricValues.slice(start, idx + 1).filter((v): v is number => v !== null);
          return window.length > 0 ? window.reduce((a, b) => a + b, 0) / window.length : null;
        });

    // 누적 승률
    let cumWins = 0;
    let cumGames = 0;

    // 이전 기간 데이터
    const prevValues = prevRaw ? extractMetricValues(prevRaw) : null;
    const prevGameCounts = prevRaw?.map((d) => d.games) ?? null;
    const prevMa7 = prevValues && prevGameCounts && selectedMetric === 'winRate'
      ? calculateMovingAvg(prevValues, prevGameCounts, 7)
      : prevValues?.map((_, idx) => {
          if (!prevValues) return null;
          const start = Math.max(0, idx - 6);
          const window = prevValues.slice(start, idx + 1).filter((v): v is number => v !== null);
          return window.length > 0 ? window.reduce((a, b) => a + b, 0) / window.length : null;
        }) ?? null;

    return currentRaw.map((d, i) => {
      cumWins += d.wins;
      cumGames += d.games;

      const dateObj = new Date(d.date);
      const dayOfWeek = DAY_NAMES[dateObj.getDay()];

      const base: DayData = {
        date: d.date,
        label: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        dayOfWeek: `${dayOfWeek}요일`,
        games: d.games,
        wins: d.wins,
        losses: d.losses,
        draws: d.draws,
        winRate: d.games > 0 ? (d.wins / d.games) * 100 : null,
        avgMoves: d.games > 0 ? d.games : null,
        duration: d.duration,
        ma7: ma7Values[i],
        ma30: ma30Values[i],
        cumulativeWinRate: cumGames > 0 ? (cumWins / cumGames) * 100 : null,
      };

      // 비교 기간 데이터 매핑
      if (compareMode && prevRaw && prevValues) {
        base.prevGames = prevRaw[i]?.games;
        base.prevWinRate = prevValues[i];
        base.prevMa7 = prevMa7?.[i] ?? null;
        base.prevDuration = prevRaw[i]?.duration;
        base.prevAvgMoves = prevValues[i];
      }

      return base;
    });
  }, [currentRaw, prevRaw, selectedMetric, compareMode, extractMetricValues]);

  // ─── 전체 기간 평균 ───
  const overallAvg = useMemo(() => {
    const activeDays = chartData.filter((d) => d.games > 0);
    if (activeDays.length === 0) return null;

    switch (selectedMetric) {
      case 'winRate': {
        const w = activeDays.reduce((s, d) => s + d.wins, 0);
        const g = activeDays.reduce((s, d) => s + d.games, 0);
        return g > 0 ? (w / g) * 100 : null;
      }
      case 'games':
        return activeDays.reduce((s, d) => s + d.games, 0) / activeDays.length;
      case 'duration':
        return activeDays.reduce((s, d) => s + d.duration, 0) / activeDays.length;
      default:
        return null;
    }
  }, [chartData, selectedMetric]);

  // ─── 데이터 키 매핑 ───
  const mainDataKey = selectedMetric === 'winRate' ? 'ma7' : selectedMetric;
  const prevDataKey = selectedMetric === 'winRate' ? 'prevMa7' : `prev${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`;

  // ─── X축 틱 간격 ───
  const tickInterval = periodRange <= 7 ? 0 : periodRange <= 14 ? 1 : periodRange <= 30 ? 4 : periodRange <= 60 ? 9 : 13;

  // ─── Y축 도메인 ───
  const yDomain = metric.yDomain ?? undefined;

  const chartHeight = 300;

  return (
    <div className={cn('space-y-5', className)}>
      {/* ─── 컨트롤 바 ─── */}
      <div className="flex flex-col gap-4">
        {/* 상단: 지표 선택 + 요약 */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          {/* 지표 선택 탭 */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide font-medium">
              지표 선택
            </p>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMetric(m.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    selectedMetric === m.key
                      ? 'bg-white dark:bg-gray-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                  )}
                  style={
                    selectedMetric === m.key
                      ? { color: m.color }
                      : undefined
                  }
                >
                  {m.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* 요약 값 */}
          <MetricSummary
            currentData={chartData}
            prevData={compareMode && prevRaw ? chartData : null}
            metric={metric}
            compareMode={compareMode}
          />
        </div>

        {/* 하단: 기간 선택 + 토글 옵션 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* 기간 선택 */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {PERIOD_RANGES.map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => setPeriodRange(range.value)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-all',
                  periodRange === range.value
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* 토글 옵션 */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {selectedMetric === 'winRate' && (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showMA7}
                    onChange={(e) => setShowMA7(e.target.checked)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span className="text-gray-600 dark:text-gray-400">7일 이동평균</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showMA30}
                    onChange={(e) => setShowMA30(e.target.checked)}
                    className="rounded border-gray-300 text-purple-500 focus:ring-purple-500 w-3.5 h-3.5"
                  />
                  <span className="text-gray-600 dark:text-gray-400">30일 이동평균</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCumulative}
                    onChange={(e) => setShowCumulative(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span className="text-gray-600 dark:text-gray-400">누적 승률</span>
                </label>
              </>
            )}
            <label className="flex items-center gap-1.5 cursor-pointer select-none ml-auto">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-3.5 h-3.5"
              />
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                기간 비교
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ─── 범례 ─── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 px-1">
        {/* 메인 라인 */}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded" style={{ backgroundColor: metric.color }} />
          <span>
            {selectedMetric === 'winRate' ? '7일 이동평균' : metric.label}
          </span>
        </div>
        {selectedMetric === 'winRate' && showMA30 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-purple-500 rounded" />
            <span>30일 이동평균</span>
          </div>
        )}
        {selectedMetric === 'winRate' && showCumulative && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-emerald-500 rounded" />
            <span>누적 승률</span>
          </div>
        )}
        {compareMode && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded border border-orange-400" style={{ borderStyle: 'dashed' }} />
            <span className="text-orange-500">이전 기간</span>
          </div>
        )}
        {/* 일별 데이터 점 */}
        {selectedMetric === 'winRate' && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500 opacity-60" />
              <div className="w-2 h-2 rounded-full bg-red-500 opacity-60" />
            </div>
            <span>일별 승률 (크기 = 게임 수)</span>
          </div>
        )}
        {overallAvg != null && (
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-4 border-t border-dashed border-gray-400" />
            <span>기간 평균: {metric.format(overallAvg)}</span>
          </div>
        )}
      </div>

      {/* ─── 메인 차트 ─── */}
      {selectedMetric === 'winRate' ? (
        // 승률: AreaChart + 이동평균 + 누적 + 일별 점
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="trendGradientMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trendGradientCum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={tickInterval}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={45}
            />
            <Tooltip
              content={
                <TrendTooltip metric={metric} compareMode={compareMode} />
              }
            />

            {/* 기준선 */}
            {overallAvg != null && (
              <ReferenceLine
                y={overallAvg}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <ReferenceLine y={50} stroke="#e5e7eb" strokeWidth={1} className="dark:opacity-30" />

            {/* 누적 승률 영역 */}
            {showCumulative && (
              <Area
                type="monotone"
                dataKey="cumulativeWinRate"
                name="누적 승률"
                stroke="#10b981"
                strokeWidth={1.5}
                fill="url(#trendGradientCum)"
                dot={false}
                activeDot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }}
                animationDuration={600}
                connectNulls
              />
            )}

            {/* 30일 이동평균 */}
            {showMA30 && (
              <Area
                type="monotone"
                dataKey="ma30"
                name="30일 이동평균"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="transparent"
                dot={false}
                activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={800}
                connectNulls
              />
            )}

            {/* 7일 이동평균 (메인) */}
            {showMA7 && (
              <Area
                type="monotone"
                dataKey="ma7"
                name="7일 이동평균"
                stroke={metric.color}
                strokeWidth={2.5}
                fill="url(#trendGradientMain)"
                dot={false}
                activeDot={{ r: 5, fill: metric.color, stroke: '#fff', strokeWidth: 2 }}
                animationDuration={600}
                connectNulls
              />
            )}

            {/* 비교 기간 라인 */}
            {compareMode && (
              <Area
                type="monotone"
                dataKey="prevMa7"
                name="이전 기간"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="6 3"
                fill="transparent"
                dot={false}
                activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={600}
                connectNulls
              />
            )}

            {/* 일별 승률 점 */}
            <Area
              type="monotone"
              dataKey="winRate"
              name="일별 승률"
              stroke="transparent"
              fill="transparent"
              dot={(props: { cx?: number; cy?: number; payload?: DayData }) => {
                const p = props.payload;
                if (!p?.games || p.winRate === null || props.cx == null || props.cy == null) return <g />;
                const size = Math.min(6, 1.5 + p.games * 1.2);
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={size}
                    fill={p.winRate >= 50 ? '#22c55e' : '#ef4444'}
                    fillOpacity={0.55}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={false}
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        // 게임 수, 평균 수, 플레이 시간: LineChart
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={tickInterval}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(v: number) => {
                if (selectedMetric === 'duration') {
                  return v < 60 ? `${v}s` : `${Math.round(v / 60)}m`;
                }
                return String(Math.round(v));
              }}
            />
            <Tooltip
              content={
                <TrendTooltip metric={metric} compareMode={compareMode} />
              }
            />

            {overallAvg != null && (
              <ReferenceLine
                y={overallAvg}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}

            {/* 메인 라인 */}
            <Line
              type="monotone"
              dataKey={mainDataKey}
              name={metric.label}
              stroke={metric.color}
              strokeWidth={2.5}
              dot={(props: { cx?: number; cy?: number; payload?: DayData }) => {
                const p = props.payload;
                if (!p?.games || props.cx == null || props.cy == null) return <g />;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={3}
                    fill={metric.color}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 5, fill: metric.color, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={600}
              connectNulls
            />

            {/* 비교 기간 라인 */}
            {compareMode && (
              <Line
                type="monotone"
                dataKey={prevDataKey}
                name="이전 기간"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={600}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* ─── 인사이트 카드 ─── */}
      <TrendInsights chartData={chartData} metric={metric} periodRange={periodRange} />
    </div>
  );
}

/* ─────────────────── Insights ─────────────────── */

function TrendInsights({
  chartData,
  metric,
  periodRange,
}: {
  chartData: DayData[];
  metric: MetricConfig;
  periodRange: number;
}) {
  const insights = useMemo(() => {
    const activeDays = chartData.filter((d) => d.games > 0);
    if (activeDays.length < 2) return [];

    const result: { icon: string; text: string; type: 'positive' | 'negative' | 'neutral' }[] = [];

    // 최근 추세 (후반 vs 전반)
    const half = Math.floor(activeDays.length / 2);
    const firstHalf = activeDays.slice(0, half);
    const secondHalf = activeDays.slice(half);

    if (metric.key === 'winRate') {
      const firstWinRate = firstHalf.reduce((s, d) => s + d.wins, 0) / Math.max(firstHalf.reduce((s, d) => s + d.games, 0), 1) * 100;
      const secondWinRate = secondHalf.reduce((s, d) => s + d.wins, 0) / Math.max(secondHalf.reduce((s, d) => s + d.games, 0), 1) * 100;
      const diff = secondWinRate - firstWinRate;

      if (Math.abs(diff) >= 5) {
        result.push({
          icon: diff > 0 ? '📈' : '📉',
          text: `최근 ${Math.ceil(periodRange / 2)}일간 승률이 ${diff > 0 ? '상승' : '하락'} 추세입니다 (${diff > 0 ? '+' : ''}${diff.toFixed(1)}%p)`,
          type: diff > 0 ? 'positive' : 'negative',
        });
      }

      // 최고/최저 승률 날
      const bestDay = activeDays.reduce((best, d) =>
        (d.winRate ?? 0) > (best.winRate ?? 0) ? d : best,
      );
      if (bestDay.winRate != null && bestDay.winRate >= 70 && bestDay.games >= 2) {
        result.push({
          icon: '🌟',
          text: `${bestDay.label} (${bestDay.dayOfWeek})에 ${bestDay.games}게임 중 승률 ${bestDay.winRate.toFixed(0)}% 달성!`,
          type: 'positive',
        });
      }
    }

    // 활동 빈도
    const activePct = (activeDays.length / chartData.length) * 100;
    if (activePct >= 70) {
      result.push({
        icon: '🔥',
        text: `최근 ${periodRange}일 중 ${activeDays.length}일 활동 — 꾸준한 플레이어!`,
        type: 'positive',
      });
    } else if (activePct <= 20 && activeDays.length > 0) {
      result.push({
        icon: '💤',
        text: `최근 ${periodRange}일 중 ${activeDays.length}일만 활동 — 더 자주 플레이 해보세요!`,
        type: 'neutral',
      });
    }

    // 연속 활동일
    let maxStreak = 0;
    let currentStreak = 0;
    for (const d of chartData) {
      if (d.games > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    if (maxStreak >= 5) {
      result.push({
        icon: '📅',
        text: `최대 ${maxStreak}일 연속 플레이 달성!`,
        type: 'positive',
      });
    }

    return result.slice(0, 3); // 최대 3개
  }, [chartData, metric, periodRange]);

  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {insights.map((insight, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-2 p-3 rounded-lg text-xs',
            insight.type === 'positive' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
            insight.type === 'negative' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
            insight.type === 'neutral' && 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
          )}
        >
          <span className="text-base flex-shrink-0">{insight.icon}</span>
          <span className="leading-relaxed">{insight.text}</span>
        </div>
      ))}
    </div>
  );
}
