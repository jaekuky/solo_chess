// src/pages/HistoryPage.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  StatCard,
  WinRateChart,
  ActivityChart,
  DifficultyBreakdown,
} from '@/components/statistics';
import { Button } from '@/components/common';
import { useStatisticsStore } from '@/stores';
import { useGameHistory } from '@/hooks';
import type { StatsFilter } from '@/types';
import { ROUTES, DIFFICULTY_CONFIG } from '@/constants';
import { formatDuration, cn } from '@/utils';

type TabType = 'overview' | 'games' | 'achievements';

export function HistoryPage() {
  const { statistics, getWinRate } = useStatisticsStore();
  const {
    filteredRecords,
    filter,
    setFilter,
    getFilteredStats,
  } = useGameHistory();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const filteredStats = getFilteredStats();

  // 개요 탭
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="총 게임"
          value={statistics.totalGames}
          icon="🎮"
        />
        <StatCard
          title="승률"
          value={`${getWinRate().toFixed(1)}%`}
          icon="📊"
          color={getWinRate() >= 50 ? 'green' : 'red'}
        />
        <StatCard
          title="현재 연승"
          value={statistics.currentWinStreak}
          icon="🔥"
          color={statistics.currentWinStreak > 0 ? 'yellow' : 'default'}
        />
        <StatCard
          title="총 플레이 시간"
          value={formatDuration(statistics.totalDuration)}
          icon="⏱️"
        />
      </div>

      {/* 승률 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">전체 성적</h3>
        <WinRateChart
          wins={statistics.totalWins}
          losses={statistics.totalLosses}
          draws={statistics.totalDraws}
          size="lg"
        />
      </div>

      {/* 활동 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">최근 30일 활동</h3>
        <ActivityChart dailyStats={statistics.dailyStats} days={30} />
      </div>

      {/* 난이도별 분석 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">난이도별 성적</h3>
        <DifficultyBreakdown stats={statistics.byDifficulty} />
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="체크메이트 승리"
          value={statistics.checkmatesGiven}
          subtitle={`체크메이트 패배: ${statistics.checkmatesReceived}`}
          icon="♚"
        />
        <StatCard
          title="최고 연승"
          value={statistics.bestWinStreak}
          icon="🏆"
          color="yellow"
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
          title="사용한 힌트"
          value={statistics.totalHintsUsed}
          icon="💡"
        />
      </div>

      {/* 색상별 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">색상별 성적</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">♔</span>
              <span className="font-medium">백</span>
              <span className="text-sm text-gray-500">
                ({statistics.byColor.white.games}게임)
              </span>
            </div>
            <WinRateChart
              wins={statistics.byColor.white.wins}
              losses={statistics.byColor.white.losses}
              draws={statistics.byColor.white.draws}
              size="sm"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">♚</span>
              <span className="font-medium">흑</span>
              <span className="text-sm text-gray-500">
                ({statistics.byColor.black.games}게임)
              </span>
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
  );

  // 게임 기록 탭
  const GamesTab = () => (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filter.period}
          onChange={(e) =>
            setFilter({ period: e.target.value as StatsFilter['period'] })
          }
          className="px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">전체 기간</option>
          <option value="today">오늘</option>
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="year">올해</option>
        </select>

        <select
          value={filter.difficulty}
          onChange={(e) =>
            setFilter({ difficulty: e.target.value as StatsFilter['difficulty'] })
          }
          className="px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">모든 난이도</option>
          <option value="beginner">초급</option>
          <option value="intermediate">중급</option>
          <option value="advanced">고급</option>
        </select>

        <select
          value={filter.color}
          onChange={(e) =>
            setFilter({ color: e.target.value as StatsFilter['color'] })
          }
          className="px-3 py-1.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">모든 색상</option>
          <option value="w">백</option>
          <option value="b">흑</option>
        </select>
      </div>

      {/* 필터 결과 요약 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
        <span className="text-gray-500">
          {filteredStats.total}게임 |
          <span className="text-green-600 ml-1">{filteredStats.wins}승</span>
          <span className="text-gray-400 mx-1">·</span>
          <span className="text-gray-500">{filteredStats.draws}무</span>
          <span className="text-gray-400 mx-1">·</span>
          <span className="text-red-600">{filteredStats.losses}패</span>
          <span className="text-gray-400 mx-2">|</span>
          승률 {filteredStats.winRate.toFixed(1)}%
        </span>
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
                'border-l-4 transition-all hover:shadow-md',
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
                      <span className="text-xs text-gray-400">
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
      <p className="text-gray-500 text-center py-8">
        업적 시스템은 추후 업데이트 예정입니다.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <AchievementCard
          title="첫 승리"
          description="첫 번째 게임에서 승리"
          unlocked={statistics.totalWins >= 1}
          icon="🎉"
        />
        <AchievementCard
          title="10승 달성"
          description="총 10번 승리"
          unlocked={statistics.totalWins >= 10}
          icon="🏅"
        />
        <AchievementCard
          title="3연승"
          description="연속으로 3번 승리"
          unlocked={statistics.bestWinStreak >= 3}
          icon="🔥"
        />
        <AchievementCard
          title="100게임"
          description="총 100게임 플레이"
          unlocked={statistics.totalGames >= 100}
          icon="🎮"
        />
        <AchievementCard
          title="체크메이트 마스터"
          description="체크메이트로 10번 승리"
          unlocked={statistics.checkmatesGiven >= 10}
          icon="♚"
        />
        <AchievementCard
          title="고급 정복"
          description="고급 난이도에서 승리"
          unlocked={statistics.byDifficulty.advanced.wins >= 1}
          icon="🌳"
        />
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'games':
        return <GamesTab />;
      case 'achievements':
        return <AchievementsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">기록 및 통계</h2>
        <p className="text-gray-500">
          플레이 기록과 성장 과정을 확인하세요.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b dark:border-gray-700">
        {[
          { id: 'overview', label: '개요', icon: '📊' },
          { id: 'games', label: '게임 기록', icon: '📋' },
          { id: 'achievements', label: '업적', icon: '🏆' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.icon} {tab.label}
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
}: {
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border-2 transition-all',
        unlocked
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
          : 'border-gray-200 dark:border-gray-700 opacity-50',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('text-3xl', !unlocked && 'grayscale')}>
          {icon}
        </span>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {unlocked && <span className="ml-auto text-yellow-500">✓</span>}
      </div>
    </div>
  );
}
