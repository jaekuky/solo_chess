// src/components/statistics/DifficultyBreakdown.tsx

import { useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { DifficultyStats } from '@/types';
import type { Difficulty } from '@/types';
import { DIFFICULTY_CONFIG } from '@/constants';
import { cn } from '@/utils';

interface DifficultyBreakdownProps {
  stats: Record<Difficulty, DifficultyStats>;
  className?: string;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: '#22c55e',     // green
  intermediate: '#f59e0b', // amber
  advanced: '#ef4444',     // red
  custom: '#8b5cf6',       // violet
};

const DIFFICULTY_ICONS: Record<Difficulty, string> = {
  beginner: '🌱',
  intermediate: '🌿',
  advanced: '🌳',
  custom: '⚙️',
};

// 커스텀 레이더 툴팁
function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; name: string; payload: { fullMark: number; subject: string } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
        {payload[0]?.payload?.subject}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.name === '나의 성과' ? '#3b82f6' : '#9ca3af' }}>
          {entry.name}: {entry.value.toFixed(0)}
        </p>
      ))}
    </div>
  );
}

// 커스텀 바 차트 툴팁
function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; winRate: number; gamesPlayed: number; wins: number; losses: number; draws: number; avgMoves: number; difficulty: Difficulty } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg min-w-[150px]">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {DIFFICULTY_ICONS[data.difficulty]} {data.name}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">총 게임</span>
          <span className="font-medium">{data.gamesPlayed}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-green-600">승리</span>
          <span className="font-medium text-green-600">{data.wins}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">무승부</span>
          <span className="font-medium">{data.draws}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-red-500">패배</span>
          <span className="font-medium text-red-500">{data.losses}</span>
        </div>
        <div className="flex justify-between text-sm pt-1 border-t border-gray-100 dark:border-gray-700">
          <span className="text-blue-500">승률</span>
          <span className="font-bold text-blue-500">{data.winRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">평균 수</span>
          <span className="font-medium">{data.avgMoves.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
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

  const hasData = difficulties.some((d) => stats[d].gamesPlayed > 0);

  // 바 차트 데이터
  const barData = useMemo(() => {
    return difficulties
      .filter((diff) => stats[diff].gamesPlayed > 0)
      .map((diff) => {
        const s = stats[diff];
        const winRate = s.gamesPlayed > 0 ? (s.wins / s.gamesPlayed) * 100 : 0;
        return {
          difficulty: diff,
          name: DIFFICULTY_CONFIG[diff].name,
          gamesPlayed: s.gamesPlayed,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          winRate,
          avgMoves: s.averageMoves,
          color: DIFFICULTY_COLORS[diff],
        };
      });
  }, [stats]);

  // 레이더 차트 데이터 - 난이도별 능력치 비교
  const radarData = useMemo(() => {
    const activeDiffs = difficulties.filter((d) => stats[d].gamesPlayed > 0);
    if (activeDiffs.length === 0) return [];

    // 모든 활성 난이도의 데이터를 정규화
    const maxGames = Math.max(...activeDiffs.map((d) => stats[d].gamesPlayed));
    const maxStreak = Math.max(...activeDiffs.map((d) => stats[d].bestWinStreak));
    const maxCheckmates = Math.max(...activeDiffs.map((d) => stats[d].checkmates));

    return [
      {
        subject: '승률',
        value: activeDiffs.reduce((sum, d) => sum + (stats[d].wins / stats[d].gamesPlayed) * 100, 0) / activeDiffs.length,
        fullMark: 100,
      },
      {
        subject: '경험치',
        value: maxGames > 0 ? (activeDiffs.reduce((sum, d) => sum + stats[d].gamesPlayed, 0) / (maxGames * activeDiffs.length)) * 100 : 0,
        fullMark: 100,
      },
      {
        subject: '연승력',
        value: maxStreak > 0 ? (activeDiffs.reduce((sum, d) => sum + stats[d].bestWinStreak, 0) / (maxStreak * activeDiffs.length)) * 100 : 0,
        fullMark: 100,
      },
      {
        subject: '체크메이트',
        value: maxCheckmates > 0 ? (activeDiffs.reduce((sum, d) => sum + stats[d].checkmates, 0) / (maxCheckmates * activeDiffs.length)) * 100 : 0,
        fullMark: 100,
      },
      {
        subject: '효율성',
        value: Math.min(100, activeDiffs.reduce((sum, d) => {
          const avgMoves = stats[d].averageMoves;
          return sum + (avgMoves > 0 ? Math.max(0, 100 - avgMoves) : 0);
        }, 0) / activeDiffs.length),
        fullMark: 100,
      },
    ];
  }, [stats]);

  if (!hasData) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <p className="text-gray-400">아직 플레이한 게임이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 난이도별 승률 바 차트 */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">난이도별 승률</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<BarTooltip />} />
            <Bar
              dataKey="winRate"
              radius={[6, 6, 0, 0]}
              animationDuration={600}
              maxBarSize={60}
            >
              {barData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 종합 능력치 레이더 */}
      {radarData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">종합 능력치</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="#e5e7eb" className="dark:opacity-30" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                tickCount={5}
              />
              <Tooltip content={<RadarTooltip />} />
              <Radar
                name="나의 성과"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.25}
                animationDuration={800}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 난이도별 상세 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {difficulties.map((diff) => {
          const diffStats = stats[diff];
          if (diffStats.gamesPlayed === 0) return null;

          const winRate = (diffStats.wins / diffStats.gamesPlayed) * 100;

          return (
            <div
              key={diff}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border-l-4 transition-all hover:shadow-md"
              style={{ borderLeftColor: DIFFICULTY_COLORS[diff] }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{DIFFICULTY_ICONS[diff]}</span>
                <span className="text-sm font-medium">{DIFFICULTY_CONFIG[diff].name}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: DIFFICULTY_COLORS[diff] }}>
                {winRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {diffStats.gamesPlayed}게임 · {diffStats.wins}승 {diffStats.draws}무 {diffStats.losses}패
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                최고연승 {diffStats.bestWinStreak} · 평균 {diffStats.averageMoves.toFixed(0)}수
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
