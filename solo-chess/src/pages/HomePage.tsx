// src/pages/HomePage.tsx

import { Link } from 'react-router-dom';
import { Button } from '@/components/common';
import { WinRateChart } from '@/components/statistics';
import { GoalPanel } from '@/components/goals';
import { useStatisticsStore, useLearningStore } from '@/stores';
import { useGameStorage } from '@/hooks';
import { ROUTES } from '@/constants';

export function HomePage() {
  const { statistics, getWinRate } = useStatisticsStore();
  const { progress } = useLearningStore();
  const { loadAutoSave } = useGameStorage();

  const autoSavedGame = loadAutoSave();
  const hasOngoingGame =
    autoSavedGame && autoSavedGame.status === 'playing';

  return (
    <div className="max-w-2xl mx-auto">
      {/* 환영 메시지 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Solo Chess</h1>
        <p className="text-gray-500">
          AI와 함께 체스 실력을 키워보세요
        </p>
      </div>

      {/* 진행 중인 게임 */}
      {hasOngoingGame && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">진행 중인 게임이 있습니다</p>
              <p className="text-sm text-gray-500">
                {autoSavedGame.moveHistory.length}수 진행됨
              </p>
            </div>
            <Link to={ROUTES.GAME_PLAY}>
              <Button size="sm">이어하기</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 빠른 시작 */}
      <div className="mb-8 space-y-3">
        <Link to={ROUTES.LOBBY}>
          <Button size="lg" className="w-full py-4 text-lg">
            🌐 멀티플레이어
          </Button>
        </Link>
        <Link to={ROUTES.GAME_SETTINGS}>
          <Button size="lg" variant="outline" className="w-full py-4 text-lg">
            🤖 AI와 대전
          </Button>
        </Link>
      </div>

      {/* 오늘의 목표 */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
        <GoalPanel compact />
      </div>

      {/* 통계 요약 */}
      {statistics.totalGames > 0 && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">내 전적</h2>
            <Link
              to={ROUTES.HISTORY}
              className="text-sm text-primary-600 hover:underline"
            >
              자세히 보기 →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-2xl font-bold">
                {statistics.totalGames}
              </p>
              <p className="text-xs text-gray-500">총 게임</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">
                {getWinRate().toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">승률</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">
                {statistics.currentWinStreak}
              </p>
              <p className="text-xs text-gray-500">연승</p>
            </div>
          </div>

          <WinRateChart
            wins={statistics.totalWins}
            losses={statistics.totalLosses}
            draws={statistics.totalDraws}
            size="sm"
          />
        </div>
      )}

      {/* 메뉴 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to={ROUTES.LEARN}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-3xl block mb-2">📚</span>
          <h3 className="font-semibold">학습</h3>
          <p className="text-sm text-gray-500">
            규칙과 전략을 배우세요
          </p>
          {progress.puzzlesSolved > 0 && (
            <p className="text-xs text-primary-500 mt-2">
              퍼즐 {progress.puzzlesSolved}개 해결
            </p>
          )}
        </Link>

        <Link
          to={ROUTES.HISTORY}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-3xl block mb-2">📊</span>
          <h3 className="font-semibold">기록</h3>
          <p className="text-sm text-gray-500">
            통계와 기록을 확인하세요
          </p>
          {statistics.totalGames > 0 && (
            <p className="text-xs text-primary-500 mt-2">
              {statistics.totalGames}게임 플레이
            </p>
          )}
        </Link>

        <Link
          to={ROUTES.SAVED_GAMES}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-3xl block mb-2">💾</span>
          <h3 className="font-semibold">저장된 게임</h3>
          <p className="text-sm text-gray-500">
            저장한 게임을 이어하세요
          </p>
        </Link>

        <Link
          to={ROUTES.SETTINGS}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-3xl block mb-2">⚙️</span>
          <h3 className="font-semibold">설정</h3>
          <p className="text-sm text-gray-500">
            테마와 옵션을 설정하세요
          </p>
        </Link>
      </div>
    </div>
  );
}
