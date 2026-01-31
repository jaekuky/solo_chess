// src/pages/LearnPage.tsx

import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

export function LearnPage() {
  const learnItems = [
    {
      path: ROUTES.RULES,
      title: '체스 규칙',
      description: '기물 이동 방법과 특수 규칙을 배웁니다',
      icon: '📖',
    },
    {
      path: ROUTES.PUZZLE,
      title: '체크메이트 퍼즐',
      description: '실전 감각을 키우는 퍼즐을 풀어봅니다',
      icon: '🧩',
    },
    {
      path: ROUTES.STRATEGY,
      title: '전략 가이드',
      description: '오프닝, 미들게임, 엔드게임 전략을 배웁니다',
      icon: '📋',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">학습</h2>
      <div className="space-y-4">
        {learnItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
