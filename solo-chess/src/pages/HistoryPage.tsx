// src/pages/HistoryPage.tsx

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  StatCard,
  WinRateChart,
  ActivityChart,
  DifficultyBreakdown,
  TrendChart,
  TimeOfDayChart,
  EndReasonChart,
  PeriodComparisonChart,
  PerformanceTimeline,
} from '@/components/statistics';
import { Button } from '@/components/common';
import { useStatisticsStore } from '@/stores';
import { useGameHistory } from '@/hooks';
import type { StatsFilter } from '@/types';
import { ROUTES, DIFFICULTY_CONFIG } from '@/constants';
import { formatDuration, cn } from '@/utils';

type TabType = 'overview' | 'analytics' | 'games' | 'achievements';

export function HistoryPage() {
  const { statistics, getWinRate, getDailyStats } = useStatisticsStore();
  const {
    gameRecords,
    filteredRecords,
    filter,
    setFilter,
    getFilteredStats,
  } = useGameHistory();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const filteredStats = getFilteredStats();

  // 스파크라인 데이터 생성 (최근 14일)
  const sparklines = useMemo(() => {
    const recentStats = getDailyStats(14);
    const today = new Date();

    const gamesData: number[] = [];
    const winsData: number[] = [];
    const durationData: number[] = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStat = recentStats.find((d) => d.date === dateStr);

      gamesData.push(dayStat?.gamesPlayed || 0);
      winsData.push(dayStat?.wins || 0);
      durationData.push(dayStat?.totalDuration || 0);
    }

    return { gamesData, winsData, durationData };
  }, [getDailyStats]);

  // 트렌드 계산 (이번 주 vs 지난 주)
  const trends = useMemo(() => {
    const thisWeekStats = getDailyStats(7);
    const allTwoWeeks = getDailyStats(14);
    const lastWeekStats = allTwoWeeks.filter(
      (d) => !thisWeekStats.find((t) => t.date === d.date),
    );

    const thisWeekGames = thisWeekStats.reduce(
      (s, d) => s + d.gamesPlayed,
      0,
    );
    const lastWeekGames = lastWeekStats.reduce(
      (s, d) => s + d.gamesPlayed,
      0,
    );
    const thisWeekWins = thisWeekStats.reduce((s, d) => s + d.wins, 0);
    const lastWeekWins = lastWeekStats.reduce((s, d) => s + d.wins, 0);

    const thisWinRate = thisWeekGames > 0 ? (thisWeekWins / thisWeekGames) * 100 : 0;
    const lastWinRate = lastWeekGames > 0 ? (lastWeekWins / lastWeekGames) * 100 : 0;

    const gamesTrend = lastWeekGames > 0
      ? ((thisWeekGames - lastWeekGames) / lastWeekGames) * 100
      : thisWeekGames > 0 ? 100 : 0;

    const winRateTrend = lastWinRate > 0
      ? thisWinRate - lastWinRate
      : thisWinRate > 0 ? thisWinRate : 0;

    return { gamesTrend, winRateTrend };
  }, [getDailyStats]);

  // 개요 탭
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* KPI 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="총 게임"
          value={statistics.totalGames}
          icon="🎮"
          color="blue"
          sparklineData={sparklines.gamesData}
          trend={
            statistics.totalGames > 0
              ? { value: trends.gamesTrend, isPositive: trends.gamesTrend >= 0 }
              : undefined
          }
        />
        <StatCard
          title="승률"
          value={`${getWinRate().toFixed(1)}%`}
          icon="📊"
          color={getWinRate() >= 50 ? 'green' : 'red'}
          sparklineData={sparklines.winsData}
          trend={
            statistics.totalGames > 0
              ? { value: trends.winRateTrend, isPositive: trends.winRateTrend >= 0 }
              : undefined
          }
        />
        <StatCard
          title="현재 연승"
          value={statistics.currentWinStreak}
          icon="🔥"
          color={statistics.currentWinStreak > 0 ? 'yellow' : 'default'}
          subtitle={`최고 연승: ${statistics.bestWinStreak}`}
        />
        <StatCard
          title="총 플레이 시간"
          value={formatDuration(statistics.totalDuration)}
          icon="⏱️"
          color="purple"
          sparklineData={sparklines.durationData}
        />
      </div>

      {/* 메인 차트 영역 - 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 전체 성적 도넛 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">전체 성적</h3>
          <WinRateChart
            wins={statistics.totalWins}
            losses={statistics.totalLosses}
            draws={statistics.totalDraws}
            size="lg"
          />
        </div>

        {/* 색상별 성적 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">색상별 성적</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">♔</span>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">백</span>
                  <span className="text-xs text-gray-500 ml-1.5">
                    {statistics.byColor.white.games}게임
                  </span>
                </div>
              </div>
              <WinRateChart
                wins={statistics.byColor.white.wins}
                losses={statistics.byColor.white.losses}
                draws={statistics.byColor.white.draws}
                size="sm"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">♚</span>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">흑</span>
                  <span className="text-xs text-gray-500 ml-1.5">
                    {statistics.byColor.black.games}게임
                  </span>
                </div>
              </div>
              <WinRateChart
                wins={statistics.byColor.black.wins}
                losses={statistics.byColor.black.losses}
                draws={statistics.byColor.black.draws}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 활동 차트 (풀 너비) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">활동 및 성과</h3>
        <ActivityChart dailyStats={statistics.dailyStats} days={30} />
      </div>

      {/* 추가 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="체크메이트 승리"
          value={statistics.checkmatesGiven}
          subtitle={`체크메이트 패배: ${statistics.checkmatesReceived}`}
          icon="♚"
          color="green"
        />
        <StatCard
          title="평균 게임 시간"
          value={formatDuration(Math.round(statistics.averageGameDuration))}
          icon="⏰"
        />
        <StatCard
          title="평균 수"
          value={statistics.averageMovesPerGame.toFixed(1)}
          subtitle="게임당"
          icon="♟️"
        />
        <StatCard
          title="최단 승리"
          value={
            statistics.fastestWin
              ? formatDuration(statistics.fastestWin)
              : '-'
          }
          icon="⚡"
          color="green"
        />
        <StatCard
          title="최장 게임"
          value={
            statistics.longestGame
              ? formatDuration(statistics.longestGame)
              : '-'
          }
          icon="🕐"
        />
        <StatCard
          title="사용한 힌트"
          value={statistics.totalHintsUsed}
          icon="💡"
          color="yellow"
        />
      </div>
    </div>
  );

  // 심층 분석 탭
  const AnalyticsTab = () => (
    <div className="space-y-6">
      {/* 시계열 트렌드 차트 (풀 너비, 핵심 차트) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">트렌드 분석</h3>
        <p className="text-xs text-gray-500 mb-4">
          다양한 지표의 시계열 추이를 추적하고, 이전 기간과 비교하세요.
        </p>
        <TrendChart dailyStats={statistics.dailyStats} />
      </div>

      {/* 기간 비교 차트 (풀 너비) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <PeriodComparisonChart dailyStats={statistics.dailyStats} />
      </div>

      {/* 게임별 퍼포먼스 타임라인 (풀 너비) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <PerformanceTimeline gameRecords={gameRecords} />
      </div>

      {/* 2컬럼: 시간대 + 종료사유 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 활동 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">시간대별 활동</h3>
          <p className="text-xs text-gray-500 mb-4">
            언제 가장 많이 플레이하는지 확인하세요.
          </p>
          <TimeOfDayChart stats={statistics.timeOfDayStats} />
        </div>

        {/* 종료 사유 분석 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">게임 종료 분석</h3>
          <p className="text-xs text-gray-500 mb-4">
            게임이 어떤 이유로 끝나는지 분석합니다.
          </p>
          <EndReasonChart stats={statistics.byEndReason} />
        </div>
      </div>

      {/* 난이도별 분석 (풀 너비) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">난이도별 성과 분석</h3>
        <p className="text-xs text-gray-500 mb-4">
          난이도별 승률, 능력치를 한눈에 비교하세요.
        </p>
        <DifficultyBreakdown stats={statistics.byDifficulty} />
      </div>
    </div>
  );

  // 게임 기록 탭
  const GamesTab = () => (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">기간</label>
            <select
              value={filter.period}
              onChange={(e) =>
                setFilter({ period: e.target.value as StatsFilter['period'] })
              }
              className="px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
              <option value="year">올해</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">난이도</label>
            <select
              value={filter.difficulty}
              onChange={(e) =>
                setFilter({ difficulty: e.target.value as StatsFilter['difficulty'] })
              }
              className="px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">모든 난이도</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">색상</label>
            <select
              value={filter.color}
              onChange={(e) =>
                setFilter({ color: e.target.value as StatsFilter['color'] })
              }
              className="px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">모든 색상</option>
              <option value="w">백</option>
              <option value="b">흑</option>
            </select>
          </div>
        </div>
      </div>

      {/* 필터 결과 요약 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-blue-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">결과</span>
            <span className="font-bold text-lg ml-2 text-gray-800 dark:text-gray-200">
              {filteredStats.total}게임
            </span>
          </div>
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-600 font-medium">{filteredStats.wins}승</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-500 font-medium">{filteredStats.draws}무</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-600 font-medium">{filteredStats.losses}패</span>
          </div>
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
          <span className={cn(
            'font-bold text-lg',
            filteredStats.winRate >= 50 ? 'text-green-600' : 'text-red-500',
          )}>
            {filteredStats.winRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 게임 목록 */}
      <div className="space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>기록된 게임이 없습니다.</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <Link
              key={record.gameId}
              to={`${ROUTES.REPLAY}/${record.gameId}`}
              className={cn(
                'block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm',
                'border-l-4 transition-all hover:shadow-md hover:translate-x-0.5',
                'border border-gray-100 dark:border-gray-700',
                record.result === 'win' && 'border-l-green-500',
                record.result === 'lose' && 'border-l-red-500',
                record.result === 'draw' && 'border-l-gray-400',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {record.result === 'win' && '🏆'}
                    {record.result === 'lose' && '😔'}
                    {record.result === 'draw' && '🤝'}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-medium',
                          record.result === 'win' && 'text-green-600',
                          record.result === 'lose' && 'text-red-600',
                          record.result === 'draw' && 'text-gray-500',
                        )}
                      >
                        {record.result === 'win' && '승리'}
                        {record.result === 'lose' && '패배'}
                        {record.result === 'draw' && '무승부'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                        vs {DIFFICULTY_CONFIG[record.difficulty].name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>
                        {record.playerColor === 'w' ? '♔ 백' : '♚ 흑'}
                      </span>
                      <span>·</span>
                      <span>{record.moveCount}수</span>
                      <span>·</span>
                      <span>{formatDuration(record.duration)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(record.playedAt).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(record.playedAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {filteredRecords.length > 20 && (
        <div className="text-center">
          <Button variant="secondary">더 보기</Button>
        </div>
      )}
    </div>
  );

  // 업적 탭
  const AchievementsTab = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-yellow-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {[
                statistics.totalWins >= 1,
                statistics.totalWins >= 10,
                statistics.bestWinStreak >= 3,
                statistics.totalGames >= 100,
                statistics.checkmatesGiven >= 10,
                statistics.byDifficulty.advanced.wins >= 1,
              ].filter(Boolean).length}
              / 6 업적 달성
            </p>
            <p className="text-xs text-gray-500">게임을 플레이하여 더 많은 업적을 잠금 해제하세요!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AchievementCard
          title="첫 승리"
          description="첫 번째 게임에서 승리"
          unlocked={statistics.totalWins >= 1}
          icon="🎉"
          progress={Math.min(statistics.totalWins, 1)}
          total={1}
        />
        <AchievementCard
          title="10승 달성"
          description="총 10번 승리"
          unlocked={statistics.totalWins >= 10}
          icon="🏅"
          progress={Math.min(statistics.totalWins, 10)}
          total={10}
        />
        <AchievementCard
          title="3연승"
          description="연속으로 3번 승리"
          unlocked={statistics.bestWinStreak >= 3}
          icon="🔥"
          progress={Math.min(statistics.bestWinStreak, 3)}
          total={3}
        />
        <AchievementCard
          title="100게임"
          description="총 100게임 플레이"
          unlocked={statistics.totalGames >= 100}
          icon="🎮"
          progress={Math.min(statistics.totalGames, 100)}
          total={100}
        />
        <AchievementCard
          title="체크메이트 마스터"
          description="체크메이트로 10번 승리"
          unlocked={statistics.checkmatesGiven >= 10}
          icon="♚"
          progress={Math.min(statistics.checkmatesGiven, 10)}
          total={10}
        />
        <AchievementCard
          title="고급 정복"
          description="고급 난이도에서 승리"
          unlocked={statistics.byDifficulty.advanced.wins >= 1}
          icon="🌳"
          progress={Math.min(statistics.byDifficulty.advanced.wins, 1)}
          total={1}
        />
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'games':
        return <GamesTab />;
      case 'achievements':
        return <AchievementsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          대시보드
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          플레이 기록과 성장 과정을 한눈에 확인하세요.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { id: 'overview' as const, label: '개요', icon: '📊' },
          { id: 'analytics' as const, label: '심층 분석', icon: '🔬' },
          { id: 'games' as const, label: '게임 기록', icon: '📋' },
          { id: 'achievements' as const, label: '업적', icon: '🏆' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium transition-all rounded-lg',
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}

function AchievementCard({
  title,
  description,
  unlocked,
  icon,
  progress,
  total,
}: {
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  progress: number;
  total: number;
}) {
  const percentage = (progress / total) * 100;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border-2 transition-all',
        unlocked
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-sm'
          : 'border-gray-200 dark:border-gray-700',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('text-3xl', !unlocked && 'grayscale opacity-50')}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium',
            unlocked ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400',
          )}>
            {title}
          </p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {unlocked && (
          <span className="text-yellow-500 text-lg">✓</span>
        )}
      </div>

      {/* 프로그레스 바 */}
      {!unlocked && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{progress}/{total}</span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
