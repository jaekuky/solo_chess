// src/components/statistics/RetentionCohortChart.tsx
// 리텐션/코호트 분석 차트
// - 주간 코호트 기반 리텐션 테이블 (삼각형 히트맵)
// - 리텐션 커브 라인 차트
// - 코호트별 활동 요약 통계
// - 일별 리턴율 분석

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { GameRecord } from '@/types';
import { cn } from '@/utils';

/* ─────────────────── Types ─────────────────── */

interface RetentionCohortChartProps {
  gameRecords: GameRecord[];
  className?: string;
}

type ViewMode = 'cohort' | 'retention' | 'return';

interface CohortWeek {
  weekLabel: string; // 예: "1/6 ~ 1/12"
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  gamesPlayed: number;
  activeDays: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgDuration: number;
  // 이후 주차 활동 여부 (W0 = 해당 주, W1 = 다음 주, ...)
  retention: (boolean | null)[]; // null = 아직 도래하지 않은 기간
}

interface RetentionData {
  week: string; // "W0", "W1", ...
  weekLabel: string;
  rate: number; // 리텐션율 (%)
  cohortCount: number; // 해당 주차 데이터를 가진 코호트 수
}

interface DayReturnData {
  dayLabel: string;
  dayIndex: number;
  returnRate: number;
  gamesPlayed: number;
}

/* ─────────────────── Constants ─────────────────── */

const COHORT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#6366f1', '#f43f5e',
  '#84cc16', '#14b8a6', '#a855f7', '#e11d48',
];

/* ─────────────────── Utility Functions ─────────────────── */

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=일 ~ 6=토
  d.setDate(d.getDate() - day + 1); // 월요일로 이동
  if (day === 0) d.setDate(d.getDate() - 7); // 일요일이면 이전 주 월요일
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6); // 일요일
  return d;
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getRetentionColor(rate: number): string {
  if (rate >= 80) return 'bg-green-600 text-white';
  if (rate >= 60) return 'bg-green-500 text-white';
  if (rate >= 40) return 'bg-green-400 text-white';
  if (rate >= 20) return 'bg-green-300 text-gray-800';
  if (rate > 0) return 'bg-green-200 text-gray-700';
  return 'bg-gray-100 dark:bg-gray-700 text-gray-400';
}

function getRetentionColorDark(rate: number): string {
  if (rate >= 80) return 'dark:bg-green-700 dark:text-green-100';
  if (rate >= 60) return 'dark:bg-green-600 dark:text-green-100';
  if (rate >= 40) return 'dark:bg-green-500/80 dark:text-green-100';
  if (rate >= 20) return 'dark:bg-green-400/40 dark:text-green-200';
  if (rate > 0) return 'dark:bg-green-300/20 dark:text-green-300';
  return 'dark:bg-gray-700 dark:text-gray-500';
}

/* ─────────────────── Custom Tooltip ─────────────────── */

function RetentionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl min-w-[180px]">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400 text-xs">
                {entry.name}
              </span>
            </div>
            <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */

export function RetentionCohortChart({ gameRecords, className }: RetentionCohortChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cohort');
  const [maxWeeks, setMaxWeeks] = useState(8);
  const [hoveredCell, setHoveredCell] = useState<{
    cohortIdx: number;
    weekOffset: number;
    rate: number;
  } | null>(null);

  // ─── 코호트 데이터 계산 ───
  const cohortData = useMemo<CohortWeek[]>(() => {
    if (gameRecords.length === 0) return [];

    // 게임 기록을 날짜별로 그룹핑
    const dayMap = new Map<string, GameRecord[]>();
    for (const record of gameRecords) {
      const dateStr = new Date(record.playedAt).toISOString().split('T')[0];
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
      dayMap.get(dateStr)!.push(record);
    }

    // 가장 오래된 기록부터 현재까지 주간 코호트 생성
    const sortedRecords = [...gameRecords].sort((a, b) => a.playedAt - b.playedAt);
    const firstDate = new Date(sortedRecords[0].playedAt);
    const firstWeekStart = getWeekStart(firstDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const currentWeekStart = getWeekStart(today);

    const cohorts: CohortWeek[] = [];
    const cursor = new Date(firstWeekStart);

    while (cursor <= currentWeekStart) {
      const weekStart = new Date(cursor);
      const weekEnd = getWeekEnd(weekStart);

      // 해당 주의 게임 기록 수집
      const weekRecords: GameRecord[] = [];
      const activeDaysSet = new Set<string>();

      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateStr(d);
        const dayRecords = dayMap.get(dateStr);
        if (dayRecords && dayRecords.length > 0) {
          weekRecords.push(...dayRecords);
          activeDaysSet.add(dateStr);
        }
      }

      // 이후 주차 리텐션 계산
      const retention: (boolean | null)[] = [];
      for (let offset = 0; offset < maxWeeks; offset++) {
        const targetWeekStart = new Date(weekStart);
        targetWeekStart.setDate(targetWeekStart.getDate() + offset * 7);
        const targetWeekEnd = getWeekEnd(targetWeekStart);

        // 아직 도래하지 않은 주
        if (targetWeekStart > today) {
          retention.push(null);
          continue;
        }

        // 해당 주에 플레이가 있었는지 확인
        let hasActivity = false;
        for (let d = new Date(targetWeekStart); d <= targetWeekEnd && d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = formatDateStr(d);
          if (dayMap.has(dateStr) && dayMap.get(dateStr)!.length > 0) {
            hasActivity = true;
            break;
          }
        }
        retention.push(hasActivity);
      }

      const totalDuration = weekRecords.reduce((s, r) => s + r.duration, 0);

      cohorts.push({
        weekLabel: `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`,
        weekStart: formatDateStr(weekStart),
        weekEnd: formatDateStr(weekEnd),
        gamesPlayed: weekRecords.length,
        activeDays: activeDaysSet.size,
        wins: weekRecords.filter(r => r.result === 'win').length,
        losses: weekRecords.filter(r => r.result === 'lose').length,
        draws: weekRecords.filter(r => r.result === 'draw').length,
        winRate: weekRecords.length > 0
          ? (weekRecords.filter(r => r.result === 'win').length / weekRecords.length) * 100
          : 0,
        avgDuration: weekRecords.length > 0 ? totalDuration / weekRecords.length : 0,
        retention,
      });

      cursor.setDate(cursor.getDate() + 7);
    }

    // 최근 maxWeeks+2개 코호트만 표시 (너무 많으면 가독성 저하)
    return cohorts.slice(-(maxWeeks + 2));
  }, [gameRecords, maxWeeks]);

  // ─── 주차별 평균 리텐션율 ───
  const retentionCurve = useMemo<RetentionData[]>(() => {
    if (cohortData.length === 0) return [];

    const result: RetentionData[] = [];

    for (let weekOffset = 0; weekOffset < maxWeeks; weekOffset++) {
      let retainedCount = 0;
      let validCohortCount = 0;

      for (const cohort of cohortData) {
        // W0(시작 주)에 활동이 있는 코호트만 포함
        if (!cohort.retention[0]) continue;
        if (cohort.retention[weekOffset] === null) continue;

        validCohortCount++;
        if (cohort.retention[weekOffset]) retainedCount++;
      }

      if (validCohortCount === 0) continue;

      result.push({
        week: `W${weekOffset}`,
        weekLabel: weekOffset === 0 ? '시작 주' : `+${weekOffset}주`,
        rate: (retainedCount / validCohortCount) * 100,
        cohortCount: validCohortCount,
      });
    }

    return result;
  }, [cohortData, maxWeeks]);

  // ─── 일별 리턴율 (D1 ~ D30) ───
  const dayReturnData = useMemo<DayReturnData[]>(() => {
    if (gameRecords.length === 0) return [];

    // 활동이 있었던 날짜들
    const activeDays = new Set<string>();
    for (const record of gameRecords) {
      const dateStr = new Date(record.playedAt).toISOString().split('T')[0];
      activeDays.add(dateStr);
    }

    const activeDayList = Array.from(activeDays).sort();
    if (activeDayList.length < 2) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: DayReturnData[] = [];

    // D1 ~ D30: 활동 후 N일 뒤에 다시 돌아왔는지
    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
      let validDays = 0;
      let returnedDays = 0;

      for (const dayStr of activeDayList) {
        const baseDate = new Date(dayStr + 'T00:00:00');
        const targetDate = new Date(baseDate);
        targetDate.setDate(targetDate.getDate() + dayOffset);

        // 미래 날짜는 제외
        if (targetDate > today) continue;

        validDays++;
        const targetStr = targetDate.toISOString().split('T')[0];
        if (activeDays.has(targetStr)) {
          returnedDays++;
        }
      }

      if (validDays > 0) {
        result.push({
          dayLabel: `D${dayOffset}`,
          dayIndex: dayOffset,
          returnRate: (returnedDays / validDays) * 100,
          gamesPlayed: validDays,
        });
      }
    }

    return result;
  }, [gameRecords]);

  // ─── 요약 통계 ───
  const summary = useMemo(() => {
    if (cohortData.length === 0) return null;

    const activeCohorts = cohortData.filter(c => c.gamesPlayed > 0);
    const totalGames = activeCohorts.reduce((s, c) => s + c.gamesPlayed, 0);
    const totalWeeks = activeCohorts.length;

    // 평균 주간 게임 수
    const avgGamesPerWeek = totalWeeks > 0 ? totalGames / totalWeeks : 0;

    // W1 리텐션 (시작 후 1주 뒤 복귀율)
    const w1Data = retentionCurve.find(r => r.week === 'W1');
    const w1Retention = w1Data?.rate ?? 0;

    // W4 리텐션
    const w4Data = retentionCurve.find(r => r.week === 'W4');
    const w4Retention = w4Data?.rate ?? 0;

    // 최근 4주 활동일
    const recentCohorts = cohortData.slice(-4);
    const recentActiveDays = recentCohorts.reduce((s, c) => s + c.activeDays, 0);

    return {
      totalWeeks,
      avgGamesPerWeek,
      w1Retention,
      w4Retention,
      recentActiveDays,
    };
  }, [cohortData, retentionCurve]);

  // ─── 빈 상태 ───
  if (gameRecords.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-4xl mb-3">📊</p>
        <p className="text-gray-400 text-sm">
          게임 기록이 없습니다. 게임을 플레이하면 리텐션 분석이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* ─── 요약 카드 ─── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">활동 주차</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
              {summary.totalWeeks}<span className="text-sm font-normal">주</span>
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">주간 평균</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
              {summary.avgGamesPerWeek.toFixed(1)}<span className="text-sm font-normal">게임</span>
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">W1 리텐션</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
              {summary.w1Retention.toFixed(0)}<span className="text-sm font-normal">%</span>
            </p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">W4 리텐션</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {summary.w4Retention.toFixed(0)}<span className="text-sm font-normal">%</span>
            </p>
          </div>
        </div>
      )}

      {/* ─── 컨트롤 바 ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* 뷰 전환 탭 */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { id: 'cohort' as const, label: '코호트 테이블' },
            { id: 'retention' as const, label: '리텐션 커브' },
            { id: 'return' as const, label: '일별 리턴율' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                viewMode === tab.id
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 주 수 선택 */}
        {viewMode !== 'return' && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[6, 8, 10, 12].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setMaxWeeks(w)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                  maxWeeks === w
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                {w}주
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── 코호트 테이블 뷰 ─── */}
      {viewMode === 'cohort' && (
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left px-2 py-2 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                  코호트
                </th>
                <th className="px-2 py-2 text-gray-500 dark:text-gray-400 font-medium text-center whitespace-nowrap">
                  게임
                </th>
                {Array.from({ length: maxWeeks }, (_, i) => (
                  <th
                    key={i}
                    className="px-1 py-2 text-gray-500 dark:text-gray-400 font-medium text-center whitespace-nowrap min-w-[52px]"
                  >
                    {i === 0 ? '시작 주' : `+${i}주`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.filter(c => c.gamesPlayed > 0).map((cohort, cohortIdx) => {
                return (
                  <tr key={cohort.weekStart} className="border-t border-gray-100 dark:border-gray-700/50">
                    <td className="px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COHORT_COLORS[cohortIdx % COHORT_COLORS.length] }}
                        />
                        {cohort.weekLabel}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-400 font-medium">
                      {cohort.gamesPlayed}
                    </td>
                    {Array.from({ length: maxWeeks }, (_, weekOffset) => {
                      const retentionValue = cohort.retention[weekOffset];

                      if (retentionValue === null) {
                        return (
                          <td key={weekOffset} className="px-1 py-1.5">
                            <div className="w-full h-7 rounded bg-gray-50 dark:bg-gray-800" />
                          </td>
                        );
                      }

                      // 코호트 내에서 리텐션율 계산
                      // W0에 활동이 있었으면 100%, 아니면 0%
                      // 실제 리텐션율은 해당 주차까지의 비율
                      const weekRetentions = cohort.retention.slice(0, weekOffset + 1);
                      const activeWeeks = weekRetentions.filter(r => r === true).length;
                      const totalWeeks = weekRetentions.filter(r => r !== null).length;
                      const rate = totalWeeks > 0 ? (activeWeeks / totalWeeks) * 100 : 0;

                      // 해당 셀은 단순히 활동 여부
                      const isActive = retentionValue;
                      const cellRate = isActive ? 100 : 0;

                      return (
                        <td key={weekOffset} className="px-1 py-1.5">
                          <div
                            className={cn(
                              'w-full h-7 rounded flex items-center justify-center text-[10px] font-medium cursor-default transition-all',
                              isActive ? getRetentionColor(rate) : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
                              isActive ? getRetentionColorDark(rate) : '',
                              hoveredCell?.cohortIdx === cohortIdx && hoveredCell?.weekOffset === weekOffset
                                ? 'ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-gray-800'
                                : '',
                            )}
                            onMouseEnter={() => setHoveredCell({ cohortIdx, weekOffset, rate: cellRate })}
                            onMouseLeave={() => setHoveredCell(null)}
                            title={`${cohort.weekLabel} → +${weekOffset}주: ${isActive ? '활동' : '비활동'}`}
                          >
                            {isActive ? '●' : '○'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* 평균 리텐션 행 */}
              <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                <td className="px-2 py-2 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap sticky left-0 bg-gray-50 dark:bg-gray-800/50 z-10">
                  평균 리텐션
                </td>
                <td className="px-2 py-2 text-center text-gray-600 dark:text-gray-400">
                  -
                </td>
                {retentionCurve.map((data, idx) => (
                  <td key={idx} className="px-1 py-2">
                    <div
                      className={cn(
                        'w-full h-7 rounded flex items-center justify-center text-[10px] font-bold transition-all',
                        getRetentionColor(data.rate),
                        getRetentionColorDark(data.rate),
                      )}
                    >
                      {data.rate.toFixed(0)}%
                    </div>
                  </td>
                ))}
                {Array.from({ length: Math.max(0, maxWeeks - retentionCurve.length) }, (_, i) => (
                  <td key={`empty-${i}`} className="px-1 py-2">
                    <div className="w-full h-7 rounded bg-gray-50 dark:bg-gray-800" />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* 범례 */}
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>리텐션:</span>
            <div className="flex items-center gap-1">
              <span>낮음</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
                <div className="w-4 h-3 rounded-sm bg-green-200" />
                <div className="w-4 h-3 rounded-sm bg-green-300" />
                <div className="w-4 h-3 rounded-sm bg-green-400" />
                <div className="w-4 h-3 rounded-sm bg-green-500" />
                <div className="w-4 h-3 rounded-sm bg-green-600" />
              </div>
              <span>높음</span>
            </div>
            <span className="ml-auto">● 활동 / ○ 비활동</span>
          </div>
        </div>
      )}

      {/* ─── 리텐션 커브 뷰 ─── */}
      {viewMode === 'retention' && (
        <div className="space-y-4">
          {/* 전체 평균 리텐션 커브 */}
          <div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
              주차별 평균 리텐션율
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={retentionCurve}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  width={45}
                />
                <Tooltip content={<RetentionTooltip />} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="리텐션율"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 코호트별 리텐션 커브 비교 */}
          {cohortData.filter(c => c.gamesPlayed > 0).length > 1 && (
            <div>
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
                코호트별 리텐션 비교
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    allowDuplicatedCategory={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    width={45}
                  />
                  <Tooltip content={<RetentionTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {cohortData
                    .filter(c => c.gamesPlayed > 0)
                    .slice(-5) // 최근 5개 코호트
                    .map((cohort, idx) => {
                      // 코호트별 리텐션 데이터 생성
                      const cohortRetention = cohort.retention
                        .map((val, weekIdx) => {
                          if (val === null) return null;
                          // 누적 리텐션 계산
                          const validUntilHere = cohort.retention.slice(0, weekIdx + 1).filter(r => r !== null);
                          const activeUntilHere = validUntilHere.filter(r => r === true);
                          return {
                            week: `W${weekIdx}`,
                            [cohort.weekLabel]: validUntilHere.length > 0
                              ? (activeUntilHere.length / validUntilHere.length) * 100
                              : 0,
                          };
                        })
                        .filter(Boolean);

                      return (
                        <Line
                          key={cohort.weekStart}
                          data={cohortRetention as Record<string, unknown>[]}
                          type="monotone"
                          dataKey={cohort.weekLabel}
                          name={cohort.weekLabel}
                          stroke={COHORT_COLORS[idx % COHORT_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 3, fill: COHORT_COLORS[idx % COHORT_COLORS.length], stroke: '#fff', strokeWidth: 1.5 }}
                          activeDot={{ r: 5, fill: COHORT_COLORS[idx % COHORT_COLORS.length], stroke: '#fff', strokeWidth: 2 }}
                          animationDuration={600}
                          connectNulls
                        />
                      );
                    })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ─── 일별 리턴율 뷰 ─── */}
      {viewMode === 'return' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            D1 ~ D30 리턴율 — 활동일 기준으로 N일 뒤 다시 플레이한 비율
          </p>

          {dayReturnData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={dayReturnData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    interval={2}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                    width={45}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = (payload[0] as unknown as { payload: DayReturnData }).payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                            {label} ({data.dayIndex}일 후)
                          </p>
                          <p className="text-sm">
                            리턴율:{' '}
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {data.returnRate.toFixed(1)}%
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            기준 활동일: {data.gamesPlayed}일
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="returnRate"
                    name="리턴율"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={(props: { cx?: number; cy?: number; payload?: DayReturnData; index?: number }) => {
                      const d = props.payload;
                      if (!d || props.cx == null || props.cy == null) return <g />;
                      // D1, D7, D14, D30 강조 표시
                      const isKeyDay = [1, 7, 14, 30].includes(d.dayIndex);
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={isKeyDay ? 5 : 3}
                          fill={isKeyDay ? '#8b5cf6' : '#a78bfa'}
                          stroke="#fff"
                          strokeWidth={isKeyDay ? 2 : 1.5}
                        />
                      );
                    }}
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={600}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* 핵심 리텐션 지표 */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { day: 1, label: 'D1', desc: '1일 뒤' },
                  { day: 7, label: 'D7', desc: '1주 뒤' },
                  { day: 14, label: 'D14', desc: '2주 뒤' },
                  { day: 30, label: 'D30', desc: '1달 뒤' },
                ].map(({ day, label, desc }) => {
                  const data = dayReturnData.find(d => d.dayIndex === day);
                  return (
                    <div
                      key={day}
                      className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                        {label}
                      </p>
                      <p className={cn(
                        'text-sm font-semibold mt-0.5',
                        data && data.returnRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400',
                      )}>
                        {data ? `${data.returnRate.toFixed(1)}%` : '-'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              최소 2일 이상의 활동 데이터가 필요합니다.
            </div>
          )}
        </div>
      )}

      {/* ─── 인사이트 카드 ─── */}
      <RetentionInsights
        retentionCurve={retentionCurve}
        dayReturnData={dayReturnData}
        cohortData={cohortData}
      />
    </div>
  );
}

/* ─────────────────── Insights ─────────────────── */

function RetentionInsights({
  retentionCurve,
  dayReturnData,
  cohortData,
}: {
  retentionCurve: RetentionData[];
  dayReturnData: DayReturnData[];
  cohortData: CohortWeek[];
}) {
  const insights = useMemo(() => {
    const result: { icon: string; text: string; type: 'positive' | 'negative' | 'neutral' }[] = [];

    // W1 리텐션 분석
    const w1 = retentionCurve.find(r => r.week === 'W1');
    if (w1) {
      if (w1.rate >= 70) {
        result.push({
          icon: '🎯',
          text: `1주 후 리텐션이 ${w1.rate.toFixed(0)}%로 매우 높습니다. 꾸준한 플레이 습관이 형성되었습니다!`,
          type: 'positive',
        });
      } else if (w1.rate < 30) {
        result.push({
          icon: '💡',
          text: `1주 후 리텐션이 ${w1.rate.toFixed(0)}%입니다. 매일 조금씩 플레이하면 실력이 빠르게 향상됩니다!`,
          type: 'neutral',
        });
      }
    }

    // D1 리턴율
    const d1 = dayReturnData.find(d => d.dayIndex === 1);
    if (d1) {
      if (d1.returnRate >= 60) {
        result.push({
          icon: '🔥',
          text: `D1 리턴율이 ${d1.returnRate.toFixed(0)}%! 하루 뒤 바로 다시 돌아오는 높은 재참여율을 보이고 있습니다.`,
          type: 'positive',
        });
      }
    }

    // 최근 코호트 트렌드
    const recentCohorts = cohortData.filter(c => c.gamesPlayed > 0).slice(-4);
    if (recentCohorts.length >= 2) {
      const firstHalf = recentCohorts.slice(0, Math.ceil(recentCohorts.length / 2));
      const secondHalf = recentCohorts.slice(Math.ceil(recentCohorts.length / 2));
      const firstAvg = firstHalf.reduce((s, c) => s + c.gamesPlayed, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, c) => s + c.gamesPlayed, 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.2) {
        result.push({
          icon: '📈',
          text: '최근 주간 게임 수가 증가 추세입니다. 플레이 참여도가 높아지고 있어요!',
          type: 'positive',
        });
      } else if (secondAvg < firstAvg * 0.5 && firstAvg > 0) {
        result.push({
          icon: '📉',
          text: '최근 주간 게임 수가 감소하고 있습니다. 새로운 난이도에 도전해보는 건 어떨까요?',
          type: 'negative',
        });
      }
    }

    // D7 vs D30 비교
    const d7 = dayReturnData.find(d => d.dayIndex === 7);
    const d30 = dayReturnData.find(d => d.dayIndex === 30);
    if (d7 && d30 && d30.returnRate > 0) {
      const dropoff = d7.returnRate - d30.returnRate;
      if (dropoff < 10) {
        result.push({
          icon: '💪',
          text: `D7→D30 리텐션 감소폭이 ${dropoff.toFixed(0)}%p로 매우 안정적입니다. 장기적인 플레이어 성향을 보여줍니다!`,
          type: 'positive',
        });
      }
    }

    return result.slice(0, 3);
  }, [retentionCurve, dayReturnData, cohortData]);

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
