// src/pages/HistoryPage.tsx

import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useStatisticsStore } from '@/stores';

export function HistoryPage() {
  const { statistics } = useStatisticsStore();

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">기록 및 통계</h2>

      {/* 통계 요약 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-semibold mb-4">통계 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold">{statistics.totalGames}</p>
            <p className="text-sm text-gray-500">총 게임</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-win">
              {statistics.totalWins}
            </p>
            <p className="text-sm text-gray-500">승리</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-lose">
              {statistics.totalLosses}
            </p>
            <p className="text-sm text-gray-500">패배</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-draw">
              {statistics.totalDraws}
            </p>
            <p className="text-sm text-gray-500">무승부</p>
          </div>
        </div>
      </section>

      {/* 저장된 게임 링크 */}
      <Link
        to={ROUTES.SAVED_GAMES}
        className="block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">저장된 게임</h3>
            <p className="text-sm text-gray-500">
              진행 중이던 게임을 이어서 플레이합니다
            </p>
          </div>
          <span className="text-2xl">→</span>
        </div>
      </Link>

      <p className="mt-6 text-gray-500">게임 기록 목록 (6단계에서 구현)</p>
    </div>
  );
}
