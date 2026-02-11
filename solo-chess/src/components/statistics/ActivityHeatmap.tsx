// src/components/statistics/ActivityHeatmap.tsx
// GitHub Contribution 스타일 90일 활동 캘린더 히트맵
// - 일별 게임 수 / 승률을 색상 강도로 표현
// - 연속 플레이 일수 (Streak) 표시
// - 호버 툴팁에 상세 정보

import { useMemo, useState } from 'react';
import type { PeriodStats } from '@/types';
import { cn } from '@/utils';

/* ─────────────────── Types ─────────────────── */

interface ActivityHeatmapProps {
  dailyStats: PeriodStats[];
  className?: string;
}

type ColorMode = 'games' | 'winRate';

interface DayCell {
  date: string;
  dateObj: Date;
  dayOfWeek: number; // 0=일 ~ 6=토
  weekIndex: number;
  monthLabel: string | null; // 해당 주 시작이 새 월이면 표시
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
  duration: number;
  isToday: boolean;
  isFuture: boolean;
}

/* ─────────────────── Constants ─────────────────── */

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_SIZE = 14;
const CELL_GAP = 3;

/* ─────────────────── Color Scales ─────────────────── */

function getGameCountColor(count: number, maxCount: number): string {
  if (count === 0) return 'var(--heatmap-empty, #ebedf0)';
  const ratio = Math.min(count / Math.max(maxCount, 1), 1);
  if (ratio <= 0.25) return '#9be9a8';
  if (ratio <= 0.5) return '#40c463';
  if (ratio <= 0.75) return '#30a14e';
  return '#216e39';
}

function getGameCountColorDark(count: number, maxCount: number): string {
  if (count === 0) return 'var(--heatmap-empty-dark, #161b22)';
  const ratio = Math.min(count / Math.max(maxCount, 1), 1);
  if (ratio <= 0.25) return '#0e4429';
  if (ratio <= 0.5) return '#006d32';
  if (ratio <= 0.75) return '#26a641';
  return '#39d353';
}

function getWinRateColor(winRate: number | null, hasGames: boolean): string {
  if (!hasGames || winRate === null) return 'var(--heatmap-empty, #ebedf0)';
  if (winRate >= 75) return '#216e39';
  if (winRate >= 60) return '#30a14e';
  if (winRate >= 50) return '#40c463';
  if (winRate >= 40) return '#fbbf24';
  if (winRate >= 25) return '#f97316';
  return '#ef4444';
}

function getWinRateColorDark(winRate: number | null, hasGames: boolean): string {
  if (!hasGames || winRate === null) return 'var(--heatmap-empty-dark, #161b22)';
  if (winRate >= 75) return '#39d353';
  if (winRate >= 60) return '#26a641';
  if (winRate >= 50) return '#006d32';
  if (winRate >= 40) return '#fbbf24';
  if (winRate >= 25) return '#f97316';
  return '#ef4444';
}

/* ─────────────────── Main Component ─────────────────── */

export function ActivityHeatmap({ dailyStats, className }: ActivityHeatmapProps) {
  const [colorMode, setColorMode] = useState<ColorMode>('games');
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 90일 캘린더 데이터 구성
  const { cells, weeks, maxGames, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 90일 전부터 시작 (일요일에 맞춰 정렬)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 89);
    // 해당 주의 일요일로 이동
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const endDate = new Date(today);
    // 이번 주 토요일까지
    endDate.setDate(endDate.getDate() + (6 - today.getDay()));

    const allCells: DayCell[] = [];
    let weekIdx = 0;
    const mLabels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().split('T')[0];
      const dow = cursor.getDay();
      const isFuture = cursor > today;
      const isToday = dateStr === todayStr;

      const found = dailyStats.find((s) => s.date === dateStr);
      const games = found?.gamesPlayed ?? 0;
      const wins = found?.wins ?? 0;
      const losses = found?.losses ?? 0;
      const draws = found?.draws ?? 0;

      // 월 레이블 (주의 첫 날에서)
      const month = cursor.getMonth();
      let monthLabel: string | null = null;
      if (dow === 0 && month !== lastMonth) {
        const label = `${month + 1}월`;
        monthLabel = label;
        mLabels.push({ weekIndex: weekIdx, label });
        lastMonth = month;
      }

      allCells.push({
        date: dateStr,
        dateObj: new Date(cursor),
        dayOfWeek: dow,
        weekIndex: weekIdx,
        monthLabel,
        games,
        wins,
        losses,
        draws,
        winRate: games > 0 ? (wins / games) * 100 : null,
        duration: found?.totalDuration ?? 0,
        isToday,
        isFuture,
      });

      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() === 0) weekIdx++;
    }

    const maxG = Math.max(...allCells.map((c) => c.games), 1);
    const totalWeeks = weekIdx + 1;

    return {
      cells: allCells,
      weeks: totalWeeks,
      maxGames: maxG,
      monthLabels: mLabels,
    };
  }, [dailyStats]);

  // 요약 통계
  const summary = useMemo(() => {
    const activeCells = cells.filter((c) => c.games > 0 && !c.isFuture);
    const totalGames = activeCells.reduce((s, c) => s + c.games, 0);
    const totalWins = activeCells.reduce((s, c) => s + c.wins, 0);
    const activeDays = activeCells.length;
    const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    // 현재 연속 플레이 일수
    let currentStreak = 0;
    const pastCells = cells.filter((c) => !c.isFuture);
    for (let i = pastCells.length - 1; i >= 0; i--) {
      if (pastCells[i].games > 0) currentStreak++;
      else break;
    }

    // 최대 연속 플레이 일수
    let maxStreak = 0;
    let streak = 0;
    for (const c of pastCells) {
      if (c.games > 0) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }

    return { totalGames, activeDays, winRate, currentStreak, maxStreak };
  }, [cells]);

  // 셀 색상 결정
  const getCellColor = (cell: DayCell, isDark: boolean) => {
    if (cell.isFuture) {
      return isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    }
    if (colorMode === 'games') {
      return isDark
        ? getGameCountColorDark(cell.games, maxGames)
        : getGameCountColor(cell.games, maxGames);
    }
    return isDark
      ? getWinRateColorDark(cell.winRate, cell.games > 0)
      : getWinRateColor(cell.winRate, cell.games > 0);
  };

  const svgWidth = weeks * (CELL_SIZE + CELL_GAP) + 30; // 30 for day labels
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 25; // 25 for month labels

  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            최근 90일간{' '}
            <span className="font-bold text-gray-800 dark:text-gray-100">
              {summary.totalGames}게임
            </span>
            {' · '}
            <span className="font-bold text-green-600">
              {summary.activeDays}일
            </span>
            {' 활동'}
          </div>
        </div>

        {/* 모드 전환 */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setColorMode('games')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all',
              colorMode === 'games'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            게임 수
          </button>
          <button
            type="button"
            onClick={() => setColorMode('winRate')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-all',
              colorMode === 'winRate'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            승률
          </button>
        </div>
      </div>

      {/* 연속 플레이 배지 */}
      <div className="flex gap-3">
        {summary.currentStreak > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium">
            <span>🔥</span>
            현재 {summary.currentStreak}일 연속 플레이 중
          </div>
        )}
        {summary.maxStreak >= 3 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium">
            <span>🏅</span>
            최대 {summary.maxStreak}일 연속
          </div>
        )}
      </div>

      {/* 히트맵 SVG */}
      <div className="overflow-x-auto pb-2 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          className="select-none"
        >
          {/* 월 레이블 */}
          {monthLabels.map((ml) => (
            <text
              key={`month-${ml.weekIndex}`}
              x={30 + ml.weekIndex * (CELL_SIZE + CELL_GAP)}
              y={10}
              className="text-[10px] fill-gray-400"
            >
              {ml.label}
            </text>
          ))}

          {/* 요일 레이블 */}
          {[1, 3, 5].map((dow) => (
            <text
              key={`day-${dow}`}
              x={0}
              y={20 + dow * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 + 3}
              className="text-[10px] fill-gray-400"
            >
              {DAY_LABELS[dow]}
            </text>
          ))}

          {/* 셀 */}
          {cells.map((cell) => {
            const x = 30 + cell.weekIndex * (CELL_SIZE + CELL_GAP);
            const y = 18 + cell.dayOfWeek * (CELL_SIZE + CELL_GAP);

            return (
              <g key={cell.date}>
                {/* 라이트 모드 셀 */}
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  ry={2}
                  fill={getCellColor(cell, false)}
                  stroke={cell.isToday ? '#3b82f6' : 'transparent'}
                  strokeWidth={cell.isToday ? 2 : 0}
                  className={cn(
                    'transition-all cursor-pointer dark:hidden',
                    !cell.isFuture && 'hover:stroke-gray-400 hover:stroke-1',
                  )}
                  onMouseEnter={(e) => {
                    if (!cell.isFuture) {
                      setHoveredCell(cell);
                      const rect = (e.target as SVGElement).getBoundingClientRect();
                      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />
                {/* 다크 모드 셀 */}
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  ry={2}
                  fill={getCellColor(cell, true)}
                  stroke={cell.isToday ? '#3b82f6' : 'transparent'}
                  strokeWidth={cell.isToday ? 2 : 0}
                  className={cn(
                    'transition-all cursor-pointer hidden dark:block',
                    !cell.isFuture && 'hover:stroke-gray-500 hover:stroke-1',
                  )}
                  onMouseEnter={(e) => {
                    if (!cell.isFuture) {
                      setHoveredCell(cell);
                      const rect = (e.target as SVGElement).getBoundingClientRect();
                      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }
                  }}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* 호버 툴팁 (포탈 대신 absolute) */}
        {hoveredCell && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 8,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap">
              <p className="font-semibold mb-1">
                {hoveredCell.dateObj.toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
                {hoveredCell.isToday && (
                  <span className="ml-1.5 text-blue-400 dark:text-blue-600">(오늘)</span>
                )}
              </p>
              {hoveredCell.games > 0 ? (
                <div className="space-y-0.5">
                  <p>
                    {hoveredCell.games}게임 ·{' '}
                    <span className="text-green-400 dark:text-green-600">{hoveredCell.wins}승</span>{' '}
                    <span className="text-gray-400 dark:text-gray-500">{hoveredCell.draws}무</span>{' '}
                    <span className="text-red-400 dark:text-red-600">{hoveredCell.losses}패</span>
                  </p>
                  <p>
                    승률:{' '}
                    <span className={
                      (hoveredCell.winRate ?? 0) >= 50
                        ? 'text-green-400 dark:text-green-600'
                        : 'text-red-400 dark:text-red-600'
                    }>
                      {hoveredCell.winRate?.toFixed(0)}%
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">활동 없음</p>
              )}
              {/* 화살표 */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
            </div>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {colorMode === 'games' ? '게임 적음' : '승률 낮음'}
        </span>
        <div className="flex items-center gap-1">
          {colorMode === 'games' ? (
            <>
              <div className="w-3 h-3 rounded-sm bg-[#ebedf0] dark:bg-[#161b22]" />
              <div className="w-3 h-3 rounded-sm bg-[#9be9a8] dark:bg-[#0e4429]" />
              <div className="w-3 h-3 rounded-sm bg-[#40c463] dark:bg-[#006d32]" />
              <div className="w-3 h-3 rounded-sm bg-[#30a14e] dark:bg-[#26a641]" />
              <div className="w-3 h-3 rounded-sm bg-[#216e39] dark:bg-[#39d353]" />
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-sm bg-[#ebedf0] dark:bg-[#161b22]" />
              <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
              <div className="w-3 h-3 rounded-sm bg-[#f97316]" />
              <div className="w-3 h-3 rounded-sm bg-[#fbbf24]" />
              <div className="w-3 h-3 rounded-sm bg-[#40c463]" />
              <div className="w-3 h-3 rounded-sm bg-[#216e39] dark:bg-[#39d353]" />
            </>
          )}
        </div>
        <span>
          {colorMode === 'games' ? '게임 많음' : '승률 높음'}
        </span>
      </div>
    </div>
  );
}
