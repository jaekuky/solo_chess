// src/components/statistics/SegmentComparison.tsx
// 세그먼트 비교 레이더 차트 – 난이도별 / 색상별 / 기간별 성과를 겹쳐서 비교

import { useMemo, useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { Statistics, GameRecord } from '@/types';
import type { Difficulty } from '@/types';
import { DIFFICULTY_CONFIG } from '@/constants';
import { cn } from '@/utils';

// ── 타입 ────────────────────────────────────────────────────────

interface SegmentComparisonProps {
  statistics: Statistics;
  gameRecords: GameRecord[];
  className?: string;
}

type CompareMode = 'difficulty' | 'color' | 'period';

interface RadarDataPoint {
  axis: string;
  [segmentKey: string]: number | string;
}

interface SegmentMeta {
  key: string;
  label: string;
  color: string;
  active: boolean;
}

// ── 상수 ────────────────────────────────────────────────────────

const AXES = [
  { key: 'winRate', label: '승률' },
  { key: 'experience', label: '경험치' },
  { key: 'streakPower', label: '연승력' },
  { key: 'checkmateRate', label: '체크메이트율' },
  { key: 'efficiency', label: '효율성' },
  { key: 'endurance', label: '지속력' },
] as const;

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
  custom: '#8b5cf6',
};

const COLOR_SEGMENT_COLORS = {
  white: '#3b82f6',
  black: '#1e293b',
};

const PERIOD_COLORS = {
  thisWeek: '#3b82f6',
  lastWeek: '#9ca3af',
};

const MODE_CONFIG: Record<CompareMode, { label: string; icon: string; description: string }> = {
  difficulty: {
    label: '난이도별',
    icon: '🎯',
    description: '각 난이도에서의 성과를 비교합니다.',
  },
  color: {
    label: '색상별',
    icon: '♟️',
    description: '백(White)과 흑(Black)으로 플레이했을 때의 성과를 비교합니다.',
  },
  period: {
    label: '기간별',
    icon: '📅',
    description: '이번 주와 지난 주의 성과를 비교합니다.',
  },
};

// ── 유틸 – 값 정규화 (0~100) ────────────────────────────────────

function normalize(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

// ── 커스텀 툴팁 ─────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg min-w-[160px]">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-100">
              {entry.value.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────

export function SegmentComparison({
  statistics,
  gameRecords,
  className,
}: SegmentComparisonProps) {
  const [mode, setMode] = useState<CompareMode>('difficulty');
  const [activeSegments, setActiveSegments] = useState<Set<string>>(new Set());

  // ── 난이도별 세그먼트 데이터 ──────────────
  const difficultyData = useMemo(() => {
    const diffs: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'custom'];
    const activeDiffs = diffs.filter((d) => statistics.byDifficulty[d].gamesPlayed > 0);
    if (activeDiffs.length === 0) return { segments: [] as SegmentMeta[], data: [] as RadarDataPoint[] };

    // 최대값 계산 (정규화 기준)
    const maxGames = Math.max(...activeDiffs.map((d) => statistics.byDifficulty[d].gamesPlayed));
    const maxStreak = Math.max(...activeDiffs.map((d) => statistics.byDifficulty[d].bestWinStreak), 1);
    const maxDuration = Math.max(...activeDiffs.map((d) => statistics.byDifficulty[d].averageDuration), 1);

    const segments: SegmentMeta[] = activeDiffs.map((d) => ({
      key: d,
      label: DIFFICULTY_CONFIG[d].name,
      color: DIFFICULTY_COLORS[d],
      active: true,
    }));

    const data: RadarDataPoint[] = AXES.map(({ key, label }) => {
      const point: RadarDataPoint = { axis: label };
      for (const diff of activeDiffs) {
        const s = statistics.byDifficulty[diff];
        switch (key) {
          case 'winRate':
            point[diff] = s.gamesPlayed > 0 ? (s.wins / s.gamesPlayed) * 100 : 0;
            break;
          case 'experience':
            point[diff] = normalize(s.gamesPlayed, maxGames);
            break;
          case 'streakPower':
            point[diff] = normalize(s.bestWinStreak, maxStreak);
            break;
          case 'checkmateRate':
            point[diff] = s.wins > 0 ? (s.checkmates / s.wins) * 100 : 0;
            break;
          case 'efficiency':
            // 수가 적을수록 효율적 (역산), 기준: 60수 이내면 100점
            point[diff] = s.averageMoves > 0
              ? Math.max(0, Math.min(100, ((60 - s.averageMoves) / 60) * 100 + 50))
              : 0;
            break;
          case 'endurance':
            // 평균 게임 시간을 최대 기준 대비 정규화
            point[diff] = normalize(s.averageDuration, maxDuration);
            break;
        }
      }
      return point;
    });

    return { segments, data };
  }, [statistics]);

  // ── 색상별 세그먼트 데이터 ──────────────
  const colorData = useMemo(() => {
    const w = statistics.byColor.white;
    const b = statistics.byColor.black;
    if (w.games === 0 && b.games === 0) return { segments: [] as SegmentMeta[], data: [] as RadarDataPoint[] };

    // gameRecords에서 색상별 상세 데이터 추출
    const whiteRecords = gameRecords.filter((r) => r.playerColor === 'w');
    const blackRecords = gameRecords.filter((r) => r.playerColor === 'b');

    const whiteAvgMoves = whiteRecords.length > 0
      ? whiteRecords.reduce((s, r) => s + r.moveCount, 0) / whiteRecords.length
      : 0;
    const blackAvgMoves = blackRecords.length > 0
      ? blackRecords.reduce((s, r) => s + r.moveCount, 0) / blackRecords.length
      : 0;

    const whiteAvgDuration = whiteRecords.length > 0
      ? whiteRecords.reduce((s, r) => s + r.duration, 0) / whiteRecords.length
      : 0;
    const blackAvgDuration = blackRecords.length > 0
      ? blackRecords.reduce((s, r) => s + r.duration, 0) / blackRecords.length
      : 0;

    const whiteCheckmates = whiteRecords.filter(
      (r) => r.result === 'win' && r.endReason === 'checkmate',
    ).length;
    const blackCheckmates = blackRecords.filter(
      (r) => r.result === 'win' && r.endReason === 'checkmate',
    ).length;

    // 연승 계산
    const calcStreak = (records: GameRecord[]) => {
      let max = 0;
      let cur = 0;
      const sorted = [...records].sort((a, b) => a.playedAt - b.playedAt);
      for (const r of sorted) {
        if (r.result === 'win') { cur++; max = Math.max(max, cur); }
        else cur = 0;
      }
      return max;
    };
    const whiteStreak = calcStreak(whiteRecords);
    const blackStreak = calcStreak(blackRecords);

    const maxGames = Math.max(w.games, b.games, 1);
    const maxStreak = Math.max(whiteStreak, blackStreak, 1);
    const maxDuration = Math.max(whiteAvgDuration, blackAvgDuration, 1);

    const segments: SegmentMeta[] = [
      { key: 'white', label: '백 (White)', color: COLOR_SEGMENT_COLORS.white, active: true },
      { key: 'black', label: '흑 (Black)', color: COLOR_SEGMENT_COLORS.black, active: true },
    ];

    const wWinRate = w.games > 0 ? (w.wins / w.games) * 100 : 0;
    const bWinRate = b.games > 0 ? (b.wins / b.games) * 100 : 0;
    const wCmRate = w.wins > 0 ? (whiteCheckmates / w.wins) * 100 : 0;
    const bCmRate = b.wins > 0 ? (blackCheckmates / b.wins) * 100 : 0;

    const data: RadarDataPoint[] = [
      { axis: '승률', white: wWinRate, black: bWinRate },
      { axis: '경험치', white: normalize(w.games, maxGames), black: normalize(b.games, maxGames) },
      { axis: '연승력', white: normalize(whiteStreak, maxStreak), black: normalize(blackStreak, maxStreak) },
      { axis: '체크메이트율', white: wCmRate, black: bCmRate },
      {
        axis: '효율성',
        white: whiteAvgMoves > 0 ? Math.max(0, Math.min(100, ((60 - whiteAvgMoves) / 60) * 100 + 50)) : 0,
        black: blackAvgMoves > 0 ? Math.max(0, Math.min(100, ((60 - blackAvgMoves) / 60) * 100 + 50)) : 0,
      },
      { axis: '지속력', white: normalize(whiteAvgDuration, maxDuration), black: normalize(blackAvgDuration, maxDuration) },
    ];

    return { segments, data };
  }, [statistics, gameRecords]);

  // ── 기간별 세그먼트 데이터 ──────────────
  const periodData = useMemo(() => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const thisWeekRecords = gameRecords.filter((r) => r.playedAt >= oneWeekAgo);
    const lastWeekRecords = gameRecords.filter(
      (r) => r.playedAt >= twoWeeksAgo && r.playedAt < oneWeekAgo,
    );

    if (thisWeekRecords.length === 0 && lastWeekRecords.length === 0) {
      return { segments: [] as SegmentMeta[], data: [] as RadarDataPoint[] };
    }

    const calcSegment = (records: GameRecord[]) => {
      const total = records.length;
      const wins = records.filter((r) => r.result === 'win').length;
      const checkmates = records.filter(
        (r) => r.result === 'win' && r.endReason === 'checkmate',
      ).length;
      const avgMoves = total > 0
        ? records.reduce((s, r) => s + r.moveCount, 0) / total
        : 0;
      const avgDuration = total > 0
        ? records.reduce((s, r) => s + r.duration, 0) / total
        : 0;

      // 연승
      let maxStreak = 0;
      let curStreak = 0;
      const sorted = [...records].sort((a, b) => a.playedAt - b.playedAt);
      for (const r of sorted) {
        if (r.result === 'win') { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
        else curStreak = 0;
      }

      return {
        total,
        wins,
        winRate: total > 0 ? (wins / total) * 100 : 0,
        checkmates,
        checkmateRate: wins > 0 ? (checkmates / wins) * 100 : 0,
        avgMoves,
        avgDuration,
        maxStreak,
      };
    };

    const tw = calcSegment(thisWeekRecords);
    const lw = calcSegment(lastWeekRecords);

    const maxGames = Math.max(tw.total, lw.total, 1);
    const maxStreak = Math.max(tw.maxStreak, lw.maxStreak, 1);
    const maxDuration = Math.max(tw.avgDuration, lw.avgDuration, 1);

    const segments: SegmentMeta[] = [
      { key: 'thisWeek', label: '이번 주', color: PERIOD_COLORS.thisWeek, active: true },
      { key: 'lastWeek', label: '지난 주', color: PERIOD_COLORS.lastWeek, active: true },
    ];

    const data: RadarDataPoint[] = [
      { axis: '승률', thisWeek: tw.winRate, lastWeek: lw.winRate },
      { axis: '경험치', thisWeek: normalize(tw.total, maxGames), lastWeek: normalize(lw.total, maxGames) },
      { axis: '연승력', thisWeek: normalize(tw.maxStreak, maxStreak), lastWeek: normalize(lw.maxStreak, maxStreak) },
      { axis: '체크메이트율', thisWeek: tw.checkmateRate, lastWeek: lw.checkmateRate },
      {
        axis: '효율성',
        thisWeek: tw.avgMoves > 0 ? Math.max(0, Math.min(100, ((60 - tw.avgMoves) / 60) * 100 + 50)) : 0,
        lastWeek: lw.avgMoves > 0 ? Math.max(0, Math.min(100, ((60 - lw.avgMoves) / 60) * 100 + 50)) : 0,
      },
      { axis: '지속력', thisWeek: normalize(tw.avgDuration, maxDuration), lastWeek: normalize(lw.avgDuration, maxDuration) },
    ];

    return { segments, data };
  }, [gameRecords]);

  // ── 현재 모드의 데이터 선택 ────────────
  const currentData = useMemo(() => {
    switch (mode) {
      case 'difficulty':
        return difficultyData;
      case 'color':
        return colorData;
      case 'period':
        return periodData;
    }
  }, [mode, difficultyData, colorData, periodData]);

  // activeSegments 초기화
  const effectiveActiveSegments = useMemo(() => {
    if (activeSegments.size === 0) {
      return new Set(currentData.segments.map((s) => s.key));
    }
    // 현재 모드의 세그먼트 키만 필터
    const validKeys = new Set(currentData.segments.map((s) => s.key));
    const filtered = new Set([...activeSegments].filter((k) => validKeys.has(k)));
    return filtered.size === 0
      ? new Set(currentData.segments.map((s) => s.key))
      : filtered;
  }, [activeSegments, currentData]);

  const handleModeChange = (newMode: CompareMode) => {
    setMode(newMode);
    setActiveSegments(new Set());
  };

  const toggleSegment = (key: string) => {
    setActiveSegments((prev) => {
      const allKeys = currentData.segments.map((s) => s.key);
      const next = new Set(effectiveActiveSegments);
      if (next.has(key)) {
        next.delete(key);
        // 최소 1개는 유지
        if (next.size === 0) return prev;
      } else {
        next.add(key);
      }
      // 전부 켜져있으면 빈 세트로 (= 전체 선택)
      if (next.size === allKeys.length) return new Set();
      return next;
    });
  };

  const hasData = currentData.segments.length > 0;

  return (
    <div className={cn('space-y-5', className)}>
      {/* 모드 탭 */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
        {(Object.keys(MODE_CONFIG) as CompareMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all',
              mode === m
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            <span>{MODE_CONFIG[m].icon}</span>
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-400">{MODE_CONFIG[mode].description}</p>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-400 text-sm">
            비교할 데이터가 아직 없습니다.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            게임을 더 플레이하면 세그먼트 비교가 활성화됩니다.
          </p>
        </div>
      ) : (
        <>
          {/* 세그먼트 토글 */}
          <div className="flex flex-wrap gap-2">
            {currentData.segments.map((seg) => {
              const isActive = effectiveActiveSegments.has(seg.key);
              return (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => toggleSegment(seg.key)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                    isActive
                      ? 'border-transparent shadow-sm'
                      : 'border-gray-200 dark:border-gray-600 bg-transparent text-gray-400 line-through',
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: seg.color + '18',
                          color: seg.color,
                          borderColor: seg.color + '40',
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: isActive ? seg.color : '#9ca3af',
                    }}
                  />
                  {seg.label}
                </button>
              );
            })}
          </div>

          {/* 레이더 차트 */}
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart
                data={currentData.data}
                cx="50%"
                cy="50%"
                outerRadius="72%"
              >
                <PolarGrid stroke="#e5e7eb" className="dark:opacity-30" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  tickCount={5}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {currentData.segments
                  .filter((seg) => effectiveActiveSegments.has(seg.key))
                  .map((seg) => (
                    <Radar
                      key={seg.key}
                      name={seg.label}
                      dataKey={seg.key}
                      stroke={seg.color}
                      fill={seg.color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                      animationDuration={600}
                      dot={{
                        r: 3,
                        fill: seg.color,
                        stroke: '#fff',
                        strokeWidth: 1,
                      }}
                    />
                  ))}
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 축 설명 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {AXES.map(({ label, key }) => (
              <div
                key={key}
                className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30"
              >
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {label}
                </span>
                <span className="text-[11px] text-gray-400 leading-tight">
                  {key === 'winRate' && '승리 비율 (%)'}
                  {key === 'experience' && '총 게임 수 (상대 비교)'}
                  {key === 'streakPower' && '최고 연승 기록 (상대 비교)'}
                  {key === 'checkmateRate' && '승리 중 체크메이트 비율'}
                  {key === 'efficiency' && '평균 수가 적을수록 높음'}
                  {key === 'endurance' && '평균 게임 시간 (상대 비교)'}
                </span>
              </div>
            ))}
          </div>

          {/* 수치 비교 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">지표</th>
                  {currentData.segments
                    .filter((seg) => effectiveActiveSegments.has(seg.key))
                    .map((seg) => (
                      <th
                        key={seg.key}
                        className="text-center py-2 px-2 font-medium"
                        style={{ color: seg.color }}
                      >
                        {seg.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {currentData.data.map((row) => {
                  const activeSegs = currentData.segments.filter((s) =>
                    effectiveActiveSegments.has(s.key),
                  );
                  const values = activeSegs.map(
                    (s) => (row[s.key] as number) || 0,
                  );
                  const maxVal = Math.max(...values);

                  return (
                    <tr
                      key={row.axis}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="py-2 px-2 text-gray-600 dark:text-gray-300 font-medium">
                        {row.axis}
                      </td>
                      {activeSegs.map((seg) => {
                        const val = (row[seg.key] as number) || 0;
                        const isBest = val === maxVal && maxVal > 0 && activeSegs.length > 1;
                        return (
                          <td key={seg.key} className="text-center py-2 px-2">
                            <span
                              className={cn(
                                'inline-block min-w-[36px] px-1.5 py-0.5 rounded',
                                isBest
                                  ? 'font-bold bg-opacity-10'
                                  : 'text-gray-500',
                              )}
                              style={
                                isBest
                                  ? {
                                      color: seg.color,
                                      backgroundColor: seg.color + '15',
                                    }
                                  : undefined
                              }
                            >
                              {val.toFixed(0)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
