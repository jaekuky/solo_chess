// src/pages/HomePage.tsx

import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useGameStore, useStatisticsStore } from '@/stores';

export function HomePage() {
  const { game } = useGameStore();
  const { statistics } = useStatisticsStore();

  const hasOngoingGame = game.status === 'playing';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 히어로 섹션 */}
      <section className="text-center py-8">
        <h2 className="text-3xl font-bold mb-4">
          Solo Chess에 오신 것을 환영합니다
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          AI와 함께 체스 실력을 키워보세요. 당신의 페이스에 맞춰 학습하고
          도전할 수 있습니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={ROUTES.GAME_SETTINGS}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            🎮 빠른 게임 시작
          </Link>

          {hasOngoingGame && (
            <Link
              to={ROUTES.GAME_PLAY}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              ▶️ 진행 중인 게임 이어하기
            </Link>
          )}
        </div>
      </section>

      {/* 간단한 통계 */}
      {statistics.totalGames > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">내 기록</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {statistics.totalGames}
              </p>
              <p className="text-sm text-gray-500">총 게임</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-win">
                {statistics.totalWins}
              </p>
              <p className="text-sm text-gray-500">승리</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {statistics.totalGames > 0
                  ? Math.round(
                      (statistics.totalWins / statistics.totalGames) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-500">승률</p>
            </div>
          </div>
        </section>
      )}

      {/* 체스가 처음이신가요? */}
      <section className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2">체스가 처음이신가요?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          걱정 마세요! 기본 규칙부터 차근차근 배울 수 있습니다.
        </p>
        <Link
          to={ROUTES.RULES}
          className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
        >
          체스 규칙 배우기 →
        </Link>
      </section>
    </div>
  );
}
