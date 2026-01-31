// src/pages/LearnPage.tsx

import { Link } from 'react-router-dom';
import { useLearningStore } from '@/stores';
import {
  PIECE_LESSONS,
  SPECIAL_RULE_LESSONS,
  PUZZLES,
  STRATEGY_GUIDES,
} from '@/data';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';

export function LearnPage() {
  const { progress } = useLearningStore();

  // 진행률 계산
  const rulesProgress =
    ((progress.completedPieceLessons.length +
      progress.completedSpecialRules.length) /
      (PIECE_LESSONS.length + SPECIAL_RULE_LESSONS.length)) *
    100;

  const puzzleProgress = (progress.puzzlesSolved / PUZZLES.length) * 100;

  const strategyProgress =
    (progress.readStrategies.length / STRATEGY_GUIDES.length) * 100;

  const learnItems = [
    {
      path: ROUTES.RULES,
      title: '체스 규칙',
      description: '기물 이동 방법과 특수 규칙을 배웁니다',
      icon: '📖',
      progress: rulesProgress,
      stats: `${progress.completedPieceLessons.length + progress.completedSpecialRules.length}/${PIECE_LESSONS.length + SPECIAL_RULE_LESSONS.length} 완료`,
    },
    {
      path: ROUTES.PUZZLE,
      title: '체크메이트 퍼즐',
      description: '실전 감각을 키우는 퍼즐을 풀어봅니다',
      icon: '🧩',
      progress: Math.min(puzzleProgress, 100),
      stats: `${progress.puzzlesSolved}개 해결 | 연속 ${progress.currentPuzzleStreak}`,
    },
    {
      path: ROUTES.STRATEGY,
      title: '전략 가이드',
      description: '오프닝, 미들게임, 엔드게임 전략을 배웁니다',
      icon: '📋',
      progress: strategyProgress,
      stats: `${progress.readStrategies.length}/${STRATEGY_GUIDES.length} 읽음`,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">학습</h2>
        <p className="text-gray-500">
          체스의 기본부터 고급 전략까지 체계적으로 배워보세요.
        </p>
      </div>

      {/* 전체 진행률 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="font-semibold mb-4">전체 학습 진행률</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-500">
              {progress.completedPieceLessons.length +
                progress.completedSpecialRules.length}
            </p>
            <p className="text-xs text-gray-500">규칙 학습</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">
              {progress.puzzlesSolved}
            </p>
            <p className="text-xs text-gray-500">퍼즐 해결</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">
              {progress.readStrategies.length}
            </p>
            <p className="text-xs text-gray-500">전략 가이드</p>
          </div>
        </div>

        {/* 최고 연속 기록 */}
        {progress.bestPuzzleStreak > 0 && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500">
              🔥 최고 퍼즐 연속 기록:{' '}
              <span className="font-bold text-orange-500">
                {progress.bestPuzzleStreak}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* 학습 항목 */}
      <div className="space-y-4">
        {learnItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{item.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {item.description}
                </p>

                {/* 진행 바 */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                  <div
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      item.progress === 100 ? 'bg-green-500' : 'bg-primary-500',
                    )}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">{item.stats}</p>
              </div>
              <span className="text-gray-400 text-xl">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 추천 학습 경로 */}
      {progress.completedPieceLessons.length === 0 && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h4 className="font-medium mb-2">💡 추천 학습 순서</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>
              1. 체스 규칙에서 각 기물의 이동 방법을 배우세요.
            </li>
            <li>
              2. 특수 규칙(캐슬링, 앙파상, 프로모션)을 익히세요.
            </li>
            <li>3. 입문 퍼즐로 체크메이트 감각을 키우세요.</li>
            <li>4. 전략 가이드로 실력을 한 단계 높이세요.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
