// src/components/statistics/WeeklyPatternHeatmap.tsx
// 요일 × 시간대 활동 패턴 히트맵
// - GameRecord 배열의 playedAt 타임스탬프로부터 7(요일) × 24(시간) 또는 7×4(시간대) 그리드
// - 게임 수 / 승률 모드 전환
// - 피크 타임, 가장 활발한 요일 자동 감지

import { useMemo, useState } from 'react';
import type { GameRecord } from '@/types';
import { cn } from '@/utils';

/* ─────────────────── Types ─────────────────── */

interface WeeklyPatternHeatmapProps {
  gameRecords: GameRecord[];
  className?: string;
}

type ViewMode = 'games' | 'winRate';
type GridMode = 'hourly' | 'slots';

interface HourSlotData {
  dayOfWeek: number;
  hour: number; // 0-23 또는 슬롯 index (0-3)
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
}

/* ─────────────────── Constants ─────────────────── */

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_LABELS_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const SLOT_LABELS = ['심야 (0-6시)', '오전 (6-12시)', '오후 (12-18시)', '저녁 (18-24시)'];
const SLOT_SHORT = ['심야', '오전', '오후', '저녁'];

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}시`);

/* ─────────────────── Color Utils ─────────────────── */

function getIntensityColor(value: number, max: number, isDark: boolean): string {
  if (value === 0) return isDark ? '#1f2937' : '#f3f4f6';
  const ratio = Math.min(value / Math.max(max, 1), 1);
  if (isDark) {
    if (ratio <= 0.2) return '#164e63';
    if (ratio <= 0.4) return '#0e7490';
    if (ratio <= 0.6) return '#0891b2';
    if (ratio <= 0.8) return '#06b6d4';
    return '#22d3ee';
  }
  if (ratio <= 0.2) return '#cffafe';
  if (ratio <= 0.4) return '#a5f3fc';
  if (ratio <= 0.6) return '#67e8f9';
  if (ratio <= 0.8) return '#22d3ee';
  return '#06b6d4';
}

function getWinRateHeatColor(winRate: number | null, hasGames: boolean, isDark: boolean): string {
  if (!hasGames || winRate === null) return isDark ? '#1f2937' : '#f3f4f6';
  if (isDark) {
    if (winRate >= 70) return '#22c55e';
    if (winRate >= 55) return '#4ade80';
    if (winRate >= 45) return '#fbbf24';
    if (winRate >= 30) return '#f97316';
    return '#ef4444';
  }
  if (winRate >= 70) return '#bbf7d0';
  if (winRate >= 55) return '#dcfce7';
  if (winRate >= 45) return '#fef9c3';
  if (winRate >= 30) return '#fed7aa';
  return '#fecaca';
}

/* ─────────────────── Main Component ─────────────────── */

export function WeeklyPatternHeatmap({
  gameRecords,
  className,
}: WeeklyPatternHeatmapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('games');
  const [gridMode, setGridMode] = useState<GridMode>('slots');
  const [hoveredSlot, setHoveredSlot] = useState<HourSlotData | null>(null);

  // 데이터 집계
  const gridData = useMemo(() => {
    const cols = gridMode === 'hourly' ? 24 : 4;

    // 7 × cols 2D 배열 초기화
    const grid: HourSlotData[][] = Array.from({ length: 7 }, (_, dow) =>
      Array.from({ length: cols }, (_, h) => ({
        dayOfWeek: dow,
        hour: h,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: null,
      })),
    );

    for (const record of gameRecords) {
      const d = new Date(record.playedAt);
      const dow = d.getDay();
      const hour = d.getHours();
      const col = gridMode === 'hourly' ? hour : Math.floor(hour / 6);

      const cell = grid[dow][col];
      cell.games++;
      if (record.result === 'win') cell.wins++;
      else if (record.result === 'lose') cell.losses++;
      else cell.draws++;
    }

    // 승률 계산
    let maxGames = 0;
    for (const row of grid) {
      for (const cell of row) {
        cell.winRate = cell.games > 0 ? (cell.wins / cell.games) * 100 : null;
        maxGames = Math.max(maxGames, cell.games);
      }
    }

    return { grid, maxGames, cols };
  }, [gameRecords, gridMode]);

  // 피크 타임 찾기
  const insights = useMemo(() => {
    let peakCell: HourSlotData | null = null;
    let bestWinRateCell: HourSlotData | null = null;
    const dayTotals = Array(7).fill(0);

    for (const row of gridData.grid) {
      for (const cell of row) {
        dayTotals[cell.dayOfWeek] += cell.games;
        if (!peakCell || cell.games > peakCell.games) peakCell = cell;
        if (
          cell.games >= 3 &&
          (bestWinRateCell === null ||
            (cell.winRate ?? 0) > (bestWinRateCell.winRate ?? 0))
        ) {
          bestWinRateCell = cell;
        }
      }
    }

    const busiestDay = dayTotals.indexOf(Math.max(...dayTotals));
    const quietestDay = dayTotals.indexOf(Math.min(...dayTotals.filter((_, i) => dayTotals[i] >= 0)));

    return { peakCell, bestWinRateCell, busiestDay, quietestDay, dayTotals };
  }, [gridData]);

  const colLabels = gridMode === 'hourly' ? HOUR_LABELS : SLOT_SHORT;
  const cellWidth = gridMode === 'hourly' ? 28 : 80;
  const cellHeight = 32;
  const gap = 2;
  const totalGames = gameRecords.length;

  if (totalGames === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-10', className)}>
        <span className="text-3xl mb-2">📅</span>
        <p className="text-gray-400 text-sm">게임 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 컨트롤 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* 모드 전환 */}
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('games')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                viewMode === 'games'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              게임 수
            </button>
            <button
              type="button"
              onClick={() => setViewMode('winRate')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                viewMode === 'winRate'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              승률
            </button>
          </div>

          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setGridMode('slots')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                gridMode === 'slots'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              시간대
            </button>
            <button
              type="button"
              onClick={() => setGridMode('hourly')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-all',
                gridMode === 'hourly'
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              시간별
            </button>
          </div>
        </div>

        {/* 인사이트 요약 */}
        <div className="text-xs text-gray-500">
          가장 활발한 시간:{' '}
          {insights.peakCell && insights.peakCell.games > 0 ? (
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {DAY_LABELS[insights.peakCell.dayOfWeek]}{' '}
              {gridMode === 'hourly'
                ? `${insights.peakCell.hour}시`
                : SLOT_SHORT[insights.peakCell.hour]}
              {' '}({insights.peakCell.games}게임)
            </span>
          ) : (
            '-'
          )}
        </div>
      </div>

      {/* 히트맵 그리드 */}
      <div className="overflow-x-auto pb-2">
        <table className="border-separate" style={{ borderSpacing: `${gap}px` }}>
          {/* 컬럼 헤더 */}
          <thead>
            <tr>
              <th className="w-10" />
              {colLabels.map((label, i) => (
                <th
                  key={i}
                  className="text-[10px] text-gray-400 font-normal pb-1 text-center"
                  style={{ width: cellWidth }}
                >
                  {gridMode === 'hourly' ? (i % 3 === 0 ? label : '') : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.grid.map((row, dow) => (
              <tr key={dow}>
                {/* 요일 레이블 */}
                <td className="text-[11px] text-gray-500 font-medium pr-2 text-right align-middle">
                  {DAY_LABELS[dow]}
                </td>
                {row.map((cell, col) => {
                  const bgColor =
                    viewMode === 'games'
                      ? getIntensityColor(cell.games, gridData.maxGames, false)
                      : getWinRateHeatColor(cell.winRate, cell.games > 0, false);
                  const bgColorDark =
                    viewMode === 'games'
                      ? getIntensityColor(cell.games, gridData.maxGames, true)
                      : getWinRateHeatColor(cell.winRate, cell.games > 0, true);

                  const isHovered =
                    hoveredSlot?.dayOfWeek === cell.dayOfWeek &&
                    hoveredSlot?.hour === cell.hour;

                  return (
                    <td
                      key={col}
                      className="relative"
                      onMouseEnter={() => setHoveredSlot(cell)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    >
                      {/* 라이트 모드 */}
                      <div
                        className={cn(
                          'rounded-md transition-all cursor-pointer flex items-center justify-center dark:hidden',
                          isHovered && 'ring-2 ring-gray-400 ring-offset-1',
                        )}
                        style={{
                          width: cellWidth,
                          height: cellHeight,
                          backgroundColor: bgColor,
                        }}
                      >
                        {cell.games > 0 && gridMode === 'slots' && (
                          <span className="text-[10px] font-medium text-gray-700/70">
                            {cell.games}
                          </span>
                        )}
                      </div>
                      {/* 다크 모드 */}
                      <div
                        className={cn(
                          'rounded-md transition-all cursor-pointer items-center justify-center hidden dark:flex',
                          isHovered && 'ring-2 ring-gray-500 ring-offset-1 ring-offset-gray-800',
                        )}
                        style={{
                          width: cellWidth,
                          height: cellHeight,
                          backgroundColor: bgColorDark,
                        }}
                      >
                        {cell.games > 0 && gridMode === 'slots' && (
                          <span className="text-[10px] font-medium text-gray-200/70">
                            {cell.games}
                          </span>
                        )}
                      </div>

                      {/* 호버 툴팁 */}
                      {isHovered && (
                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap">
                            <p className="font-semibold mb-1">
                              {DAY_LABELS_FULL[cell.dayOfWeek]}{' '}
                              {gridMode === 'hourly'
                                ? `${cell.hour}:00 - ${cell.hour}:59`
                                : SLOT_LABELS[cell.hour]}
                            </p>
                            {cell.games > 0 ? (
                              <div className="space-y-0.5">
                                <p>
                                  {cell.games}게임 ·{' '}
                                  <span className="text-green-400 dark:text-green-600">
                                    {cell.wins}승
                                  </span>{' '}
                                  <span className="text-gray-400 dark:text-gray-500">
                                    {cell.draws}무
                                  </span>{' '}
                                  <span className="text-red-400 dark:text-red-600">
                                    {cell.losses}패
                                  </span>
                                </p>
                                <p>
                                  승률:{' '}
                                  <span
                                    className={
                                      (cell.winRate ?? 0) >= 50
                                        ? 'text-green-400 dark:text-green-600'
                                        : 'text-red-400 dark:text-red-600'
                                    }
                                  >
                                    {cell.winRate?.toFixed(0)}%
                                  </span>
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-400 dark:text-gray-500">
                                활동 없음
                              </p>
                            )}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 + 인사이트 카드 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* 범례 */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{viewMode === 'games' ? '적음' : '낮음'}</span>
          <div className="flex gap-0.5">
            {viewMode === 'games'
              ? [0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-sm dark:hidden"
                    style={{
                      backgroundColor: getIntensityColor(
                        r * gridData.maxGames,
                        gridData.maxGames,
                        false,
                      ),
                    }}
                  />
                ))
              : [0, 30, 45, 55, 70, 90].map((wr, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-sm dark:hidden"
                    style={{
                      backgroundColor: getWinRateHeatColor(wr, i > 0, false),
                    }}
                  />
                ))}
            {viewMode === 'games'
              ? [0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                  <div
                    key={`d-${i}`}
                    className="w-4 h-4 rounded-sm hidden dark:block"
                    style={{
                      backgroundColor: getIntensityColor(
                        r * gridData.maxGames,
                        gridData.maxGames,
                        true,
                      ),
                    }}
                  />
                ))
              : [0, 30, 45, 55, 70, 90].map((wr, i) => (
                  <div
                    key={`d-${i}`}
                    className="w-4 h-4 rounded-sm hidden dark:block"
                    style={{
                      backgroundColor: getWinRateHeatColor(wr, i > 0, true),
                    }}
                  />
                ))}
          </div>
          <span>{viewMode === 'games' ? '많음' : '높음'}</span>
        </div>

        {/* 인사이트 */}
        <div className="flex flex-wrap gap-2">
          {insights.busiestDay >= 0 && insights.dayTotals[insights.busiestDay] > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 text-xs">
              <span>📅</span>
              가장 많이 플레이: <span className="font-semibold">{DAY_LABELS_FULL[insights.busiestDay]}</span>
              ({insights.dayTotals[insights.busiestDay]}게임)
            </div>
          )}
          {insights.bestWinRateCell && (insights.bestWinRateCell.winRate ?? 0) > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
              <span>🏆</span>
              최고 승률:{' '}
              <span className="font-semibold">
                {DAY_LABELS[insights.bestWinRateCell.dayOfWeek]}{' '}
                {gridMode === 'hourly'
                  ? `${insights.bestWinRateCell.hour}시`
                  : SLOT_SHORT[insights.bestWinRateCell.hour]}
              </span>
              ({insights.bestWinRateCell.winRate?.toFixed(0)}%)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
