// src/components/statistics/OpeningAnalysis.tsx
// 오프닝 분석 컴포넌트 – 게임 기록에서 오프닝별 통계를 추출·시각화

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { GameRecord } from '@/types';
import { cn, calculateOpeningStats } from '@/utils';
import type { OpeningStatEntry } from '@/utils/openings';

interface OpeningAnalysisProps {
  gameRecords: GameRecord[];
  className?: string;
}

// ── 색상 팔레트 ─────────────────────────────────────────────────
const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
];

type SortKey = 'gamesPlayed' | 'winRate' | 'avgMoves' | 'name';
type SortDir = 'asc' | 'desc';

// ── 바차트 커스텀 툴팁 ──────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: OpeningStatEntry & { color: string } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg max-w-[260px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono text-gray-500">
          {d.eco}
        </span>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
          {d.nameKo}
        </span>
      </div>
      <p className="text-[11px] text-gray-400 mb-2">{d.name}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">플레이</span>
          <span className="font-bold text-gray-700 dark:text-gray-200">
            {d.gamesPlayed}게임
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">승률</span>
          <span
            className={cn(
              'font-bold',
              d.winRate >= 50 ? 'text-green-500' : 'text-red-500',
            )}
          >
            {d.winRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">전적</span>
          <span className="text-gray-600 dark:text-gray-300">
            {d.wins}승 {d.losses}패 {d.draws}무
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">평균 수</span>
          <span className="text-gray-600 dark:text-gray-300">{d.avgMoves}수</span>
        </div>
      </div>
    </div>
  );
}

// ── 승률 바 (인라인) ─────────────────────────────────────────────
function WinRateBar({
  wins,
  draws,
  losses,
  total,
}: {
  wins: number;
  draws: number;
  losses: number;
  total: number;
}) {
  if (total === 0) return <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700" />;
  const wPct = (wins / total) * 100;
  const dPct = (draws / total) * 100;
  const lPct = (losses / total) * 100;

  return (
    <div className="h-2 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
      {wPct > 0 && (
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${wPct}%` }}
          title={`${wins}승`}
        />
      )}
      {dPct > 0 && (
        <div
          className="bg-gray-400 transition-all"
          style={{ width: `${dPct}%` }}
          title={`${draws}무`}
        />
      )}
      {lPct > 0 && (
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${lPct}%` }}
          title={`${losses}패`}
        />
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export function OpeningAnalysis({
  gameRecords,
  className,
}: OpeningAnalysisProps) {
  const [sortKey, setSortKey] = useState<SortKey>('gamesPlayed');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAll, setShowAll] = useState(false);

  const openingStats = useMemo(
    () => calculateOpeningStats(gameRecords),
    [gameRecords],
  );

  // 정렬
  const sortedStats = useMemo(() => {
    const list = [...openingStats];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'gamesPlayed':
          cmp = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'winRate':
          cmp = a.winRate - b.winRate;
          break;
        case 'avgMoves':
          cmp = a.avgMoves - b.avgMoves;
          break;
        case 'name':
          cmp = a.nameKo.localeCompare(b.nameKo, 'ko');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [openingStats, sortKey, sortDir]);

  // 차트용 상위 데이터
  const chartData = useMemo(
    () =>
      openingStats.slice(0, 8).map((s, i) => ({
        ...s,
        color: COLORS[i % COLORS.length],
        label: s.nameKo.length > 10 ? s.nameKo.slice(0, 10) + '…' : s.nameKo,
      })),
    [openingStats],
  );

  const displayStats = showAll ? sortedStats : sortedStats.slice(0, 10);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  // ── 빈 상태 ─────────
  if (gameRecords.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <p className="text-4xl mb-3">♟️</p>
        <p className="text-gray-400 text-sm">게임을 플레이하면 오프닝 분석이 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {openingStats.length}
          </p>
          <p className="text-xs text-gray-500">사용한 오프닝</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {openingStats.length > 0
              ? openingStats.reduce(
                  (best, s) => (s.gamesPlayed >= 3 && s.winRate > best ? s.winRate : best),
                  0,
                ).toFixed(0)
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500">최고 승률 (3게임+)</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {openingStats.length > 0 ? openingStats[0].nameKo : '-'}
          </p>
          <p className="text-xs text-gray-500">가장 많이 플레이</p>
        </div>
      </div>

      {/* 바 차트 – 상위 오프닝별 플레이 횟수 */}
      {chartData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">
            자주 사용하는 오프닝 Top {Math.min(8, chartData.length)}
          </h4>
          <ResponsiveContainer width="100%" height={chartData.length * 36 + 40}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
                className="dark:opacity-20"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="gamesPlayed"
                radius={[0, 6, 6, 0]}
                animationDuration={600}
                maxBarSize={22}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 상세 테이블 */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">오프닝별 상세 통계</h4>

        {/* 테이블 헤더 */}
        <div className="hidden md:grid grid-cols-[1fr_80px_100px_120px_70px] gap-2 px-3 py-2 text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
          <button
            type="button"
            className="text-left hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
            onClick={() => handleSort('name')}
          >
            오프닝 {sortIcon('name')}
          </button>
          <button
            type="button"
            className="text-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
            onClick={() => handleSort('gamesPlayed')}
          >
            게임 {sortIcon('gamesPlayed')}
          </button>
          <button
            type="button"
            className="text-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
            onClick={() => handleSort('winRate')}
          >
            승률 {sortIcon('winRate')}
          </button>
          <span className="text-center">전적</span>
          <button
            type="button"
            className="text-center hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
            onClick={() => handleSort('avgMoves')}
          >
            평균 수 {sortIcon('avgMoves')}
          </button>
        </div>

        {/* 테이블 본문 */}
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {displayStats.map((stat, idx) => (
            <div
              key={`${stat.eco}-${stat.name}`}
              className={cn(
                'py-3 px-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg',
                // 데스크톱 그리드
                'md:grid md:grid-cols-[1fr_80px_100px_120px_70px] md:gap-2 md:items-center',
              )}
            >
              {/* 오프닝 이름 */}
              <div className="flex items-center gap-2 mb-2 md:mb-0">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{
                    backgroundColor: COLORS[idx % COLORS.length],
                  }}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {stat.nameKo}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {stat.eco} · {stat.name}
                  </p>
                </div>
              </div>

              {/* 모바일: 한 줄에 통계 표시 */}
              <div className="flex items-center gap-4 md:hidden mb-2">
                <span className="text-xs text-gray-500">
                  {stat.gamesPlayed}게임
                </span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    stat.winRate >= 50 ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  {stat.winRate.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  {stat.wins}승 {stat.draws}무 {stat.losses}패
                </span>
                <span className="text-xs text-gray-400">{stat.avgMoves}수</span>
              </div>

              {/* 모바일 + 데스크톱 공용 승률 바 */}
              <div className="md:hidden mb-1">
                <WinRateBar
                  wins={stat.wins}
                  draws={stat.draws}
                  losses={stat.losses}
                  total={stat.gamesPlayed}
                />
              </div>

              {/* 데스크톱 전용 */}
              <div className="hidden md:block text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.gamesPlayed}
              </div>
              <div className="hidden md:flex md:flex-col md:items-center md:gap-1">
                <span
                  className={cn(
                    'text-sm font-bold',
                    stat.winRate >= 50 ? 'text-green-500' : 'text-red-500',
                  )}
                >
                  {stat.winRate.toFixed(1)}%
                </span>
                <div className="w-full">
                  <WinRateBar
                    wins={stat.wins}
                    draws={stat.draws}
                    losses={stat.losses}
                    total={stat.gamesPlayed}
                  />
                </div>
              </div>
              <div className="hidden md:block text-center text-xs text-gray-500">
                <span className="text-green-500">{stat.wins}</span>
                <span className="mx-0.5">/</span>
                <span className="text-gray-400">{stat.draws}</span>
                <span className="mx-0.5">/</span>
                <span className="text-red-500">{stat.losses}</span>
              </div>
              <div className="hidden md:block text-center text-sm text-gray-500">
                {stat.avgMoves}
              </div>
            </div>
          ))}
        </div>

        {/* 더 보기 버튼 */}
        {sortedStats.length > 10 && (
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              {showAll
                ? '접기'
                : `전체 보기 (${sortedStats.length}개)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
