// src/components/statistics/PerformanceTimeline.tsx
// 개별 게임 결과를 시간순으로 시각화하는 타임라인 스캐터 차트
// 각 게임을 점으로 표시: 색상=결과, 크기=게임 길이, Y축=수(moves)

import { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { GameRecord } from '@/types';
import { DIFFICULTY_CONFIG } from '@/constants';
import { formatDuration, cn } from '@/utils';

/* ─────────────────── Types ─────────────────── */

interface PerformanceTimelineProps {
  gameRecords: GameRecord[];
  className?: string;
}

type TimelineView = 'scatter' | 'streak';

interface ScatterPoint {
  x: number; // timestamp (게임 시작)
  y: number; // moveCount
  z: number; // duration (크기용)
  label: string; // 날짜 레이블
  result: 'win' | 'lose' | 'draw';
  difficulty: string;
  difficultyName: string;
  duration: number;
  moveCount: number;
  hintsUsed: number;
  playerColor: string;
  gameId: string;
}

interface StreakData {
  index: number;
  label: string;
  date: string;
  value: number; // 누적 점수: +1 승, -1 패, 0 무
  result: 'win' | 'lose' | 'draw';
  streak: number; // 현재 연속 (양수=연승, 음수=연패)
  difficulty: string;
  moveCount: number;
  duration: number;
}

/* ─────────────────── Constants ─────────────────── */

const RESULT_COLORS = {
  win: '#22c55e',
  lose: '#ef4444',
  draw: '#9ca3af',
};

/* ─────────────────── Scatter Tooltip ─────────────────── */

function ScatterTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ScatterPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl min-w-[180px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: RESULT_COLORS[d.result] }}
        />
        <span className={cn(
          'text-sm font-semibold',
          d.result === 'win' && 'text-green-600',
          d.result === 'lose' && 'text-red-600',
          d.result === 'draw' && 'text-gray-500',
        )}>
          {d.result === 'win' ? '승리' : d.result === 'lose' ? '패배' : '무승부'}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{d.label}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">난이도</span>
          <span className="font-medium">{d.difficultyName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">색상</span>
          <span className="font-medium">{d.playerColor === 'w' ? '♔ 백' : '♚ 흑'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">수</span>
          <span className="font-medium">{d.moveCount}수</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">시간</span>
          <span className="font-medium">{formatDuration(d.duration)}</span>
        </div>
        {d.hintsUsed > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">힌트</span>
            <span className="font-medium text-yellow-500">{d.hintsUsed}회</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Streak Tooltip ─────────────────── */

function StreakTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: StreakData }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl min-w-[170px]">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: RESULT_COLORS[d.result] }}
        />
        <span className={cn(
          'text-sm font-semibold',
          d.result === 'win' && 'text-green-600',
          d.result === 'lose' && 'text-red-600',
          d.result === 'draw' && 'text-gray-500',
        )}>
          {d.result === 'win' ? '승리' : d.result === 'lose' ? '패배' : '무승부'}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{d.date}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">게임 #{d.index + 1}</span>
          <span className="font-medium">{d.moveCount}수 · {formatDuration(d.duration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">누적 점수</span>
          <span className={cn(
            'font-bold',
            d.value > 0 ? 'text-green-500' : d.value < 0 ? 'text-red-500' : 'text-gray-500',
          )}>
            {d.value > 0 ? '+' : ''}{d.value}
          </span>
        </div>
        {d.streak !== 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">연속</span>
            <span className={cn(
              'font-medium',
              d.streak > 0 ? 'text-green-500' : 'text-red-500',
            )}>
              {d.streak > 0 ? `${d.streak}연승` : `${Math.abs(d.streak)}연패`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */

export function PerformanceTimeline({
  gameRecords,
  className,
}: PerformanceTimelineProps) {
  const [view, setView] = useState<TimelineView>('streak');
  const [recordLimit, setRecordLimit] = useState(50);

  // 최근 N 게임 (시간순 정렬)
  const recentGames = useMemo(() => {
    return [...gameRecords]
      .sort((a, b) => a.playedAt - b.playedAt)
      .slice(-recordLimit);
  }, [gameRecords, recordLimit]);

  // ─── 스캐터 차트 데이터 ───
  const scatterData = useMemo<ScatterPoint[]>(() => {
    return recentGames.map((r) => {
      const d = new Date(r.playedAt);
      return {
        x: r.playedAt,
        y: r.moveCount,
        z: Math.max(r.duration, 30),
        label: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
        result: r.result as 'win' | 'lose' | 'draw',
        difficulty: r.difficulty,
        difficultyName: DIFFICULTY_CONFIG[r.difficulty].name,
        duration: r.duration,
        moveCount: r.moveCount,
        hintsUsed: r.hintsUsed,
        playerColor: r.playerColor,
        gameId: r.gameId,
      };
    });
  }, [recentGames]);

  // ─── 연승/연패 스트릭 데이터 ───
  const streakData = useMemo<StreakData[]>(() => {
    let cumulativeScore = 0;
    let currentStreak = 0;
    let lastResult: 'win' | 'lose' | 'draw' | null = null;

    return recentGames.map((r, i) => {
      const result = r.result as 'win' | 'lose' | 'draw';
      if (result === 'win') {
        cumulativeScore++;
        currentStreak = lastResult === 'win' ? currentStreak + 1 : 1;
      } else if (result === 'lose') {
        cumulativeScore--;
        currentStreak = lastResult === 'lose' ? currentStreak - 1 : -1;
      } else {
        currentStreak = 0;
      }
      lastResult = result;

      const d = new Date(r.playedAt);

      return {
        index: i,
        label: `#${i + 1}`,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        value: cumulativeScore,
        result,
        streak: currentStreak,
        difficulty: r.difficulty,
        moveCount: r.moveCount,
        duration: r.duration,
      };
    });
  }, [recentGames]);

  // 요약 통계
  const summary = useMemo(() => {
    const wins = recentGames.filter((r) => r.result === 'win').length;
    const losses = recentGames.filter((r) => r.result === 'lose').length;
    const draws = recentGames.filter((r) => r.result === 'draw').length;
    const total = recentGames.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    // 최고 연승/연패
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let ws = 0;
    let ls = 0;
    for (const r of recentGames) {
      if (r.result === 'win') { ws++; ls = 0; maxWinStreak = Math.max(maxWinStreak, ws); }
      else if (r.result === 'lose') { ls++; ws = 0; maxLossStreak = Math.max(maxLossStreak, ls); }
      else { ws = 0; ls = 0; }
    }

    return { total, wins, losses, draws, winRate, maxWinStreak, maxLossStreak };
  }, [recentGames]);

  if (gameRecords.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <span className="text-4xl mb-2">📭</span>
        <p className="text-gray-400 text-sm">게임 기록이 없습니다. 게임을 플레이하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            게임 타임라인
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              최근 <span className="font-bold text-gray-800 dark:text-gray-100">{summary.total}</span>게임
            </span>
            <div className="h-3.5 w-px bg-gray-300 dark:bg-gray-600" />
            <span className="text-green-600 font-medium">{summary.wins}승</span>
            <span className="text-gray-500">{summary.draws}무</span>
            <span className="text-red-500 font-medium">{summary.losses}패</span>
            <div className="h-3.5 w-px bg-gray-300 dark:bg-gray-600" />
            <span className={cn(
              'font-bold',
              summary.winRate >= 50 ? 'text-green-600' : 'text-red-500',
            )}>
              {summary.winRate.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 표시 게임 수 */}
          <select
            value={recordLimit}
            onChange={(e) => setRecordLimit(Number(e.target.value))}
            className="px-2 py-1 text-xs border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value={20}>최근 20게임</option>
            <option value={50}>최근 50게임</option>
            <option value={100}>최근 100게임</option>
          </select>

          {/* 뷰 전환 */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setView('streak')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                view === 'streak'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              스트릭
            </button>
            <button
              type="button"
              onClick={() => setView('scatter')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                view === 'scatter'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              분포
            </button>
          </div>
        </div>
      </div>

      {/* 스트릭 뷰 */}
      {view === 'streak' && (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChartStreak data={streakData} />
          </ResponsiveContainer>

          {/* 스트릭 요약 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600 dark:text-green-400">최대 연승</p>
              <p className="text-2xl font-bold text-green-600">{summary.maxWinStreak}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-red-600 dark:text-red-400">최대 연패</p>
              <p className="text-2xl font-bold text-red-500">{summary.maxLossStreak}</p>
            </div>
          </div>
        </>
      )}

      {/* 스캐터 뷰 */}
      {view === 'scatter' && (
        <>
          {/* 범례 */}
          <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>승리</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>패배</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>무승부</span>
            </div>
            <span className="text-gray-400 ml-auto">점 크기 = 게임 시간</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="x"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(v: number) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                dataKey="y"
                name="수"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                label={{ value: '수(moves)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' } }}
              />
              <ZAxis dataKey="z" range={[30, 300]} />
              <Tooltip content={<ScatterTooltipContent />} />
              <Scatter data={scatterData} animationDuration={500}>
                {scatterData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={RESULT_COLORS[entry.result]}
                    fillOpacity={0.7}
                    stroke={RESULT_COLORS[entry.result]}
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

/* ─────────────────── Streak Bar Chart (inline) ─────────────────── */

function BarChartStreak({ data }: { data: StreakData[] }) {
  return (
    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 10, fill: '#9ca3af' }}
        tickLine={false}
        axisLine={{ stroke: '#e5e7eb' }}
        interval={data.length > 30 ? Math.floor(data.length / 10) : 'preserveStartEnd'}
      />
      <YAxis
        tick={{ fontSize: 11, fill: '#9ca3af' }}
        tickLine={false}
        axisLine={false}
        label={{ value: '누적 점수', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#9ca3af' } }}
      />
      <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} />
      <Tooltip content={<StreakTooltipContent />} />
      <Bar dataKey="value" animationDuration={500} maxBarSize={12}>
        {data.map((entry, idx) => (
          <Cell
            key={idx}
            fill={entry.value > 0 ? '#22c55e' : entry.value < 0 ? '#ef4444' : '#9ca3af'}
            fillOpacity={0.8}
          />
        ))}
      </Bar>
    </BarChart>
  );
}
