// src/pages/StrategyPage.tsx

import { useState } from 'react';
import { LearningBoard } from '@/components/learning';
import { Button } from '@/components/common';
import { useLearningStore } from '@/stores';
import {
  STRATEGY_GUIDES,
  getGuidesByCategory,
} from '@/data';
import type { StrategyGuide } from '@/types';
import { cn } from '@/utils';

type CategoryType = StrategyGuide['category'];

const CATEGORY_CONFIG: Record<CategoryType, { name: string; emoji: string }> =
  {
    principles: { name: '기본 원칙', emoji: '📚' },
    opening: { name: '오프닝', emoji: '🎯' },
    middlegame: { name: '미들게임', emoji: '⚔️' },
    endgame: { name: '엔드게임', emoji: '🏁' },
    tactics: { name: '전술', emoji: '💡' },
  };

const DIFFICULTY_BADGE: Record<
  StrategyGuide['difficulty'],
  { label: string; color: string }
> = {
  beginner: { label: '입문', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  intermediate: {
    label: '중급',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  advanced: {
    label: '고급',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function StrategyPage() {
  const {
    progress,
    markStrategyAsRead,
    isStrategyRead,
  } = useLearningStore();

  const [selectedCategory, setSelectedCategory] = useState<
    CategoryType | 'all'
  >('all');
  const [selectedGuide, setSelectedGuide] = useState<StrategyGuide | null>(
    null,
  );
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  // 필터링된 가이드 목록
  const filteredGuides =
    selectedCategory === 'all'
      ? STRATEGY_GUIDES
      : getGuidesByCategory(selectedCategory);

  // 가이드 선택
  const handleSelectGuide = (guide: StrategyGuide) => {
    setSelectedGuide(guide);
    setCurrentExampleIndex(0);
    markStrategyAsRead(guide.id);
  };

  // 목록 화면
  if (!selectedGuide) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">전략 가이드</h2>
          <p className="text-gray-500">
            체스 전략과 전술을 배워 실력을 향상시키세요.
          </p>
        </div>

        {/* 진행률 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">읽은 가이드</span>
            <span className="text-sm text-gray-500">
              {progress.readStrategies.length} / {STRATEGY_GUIDES.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{
                width: `${(progress.readStrategies.length / STRATEGY_GUIDES.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
            )}
          >
            전체
          </button>
          {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedCategory === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600',
              )}
            >
              {CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].name}
            </button>
          ))}
        </div>

        {/* 가이드 목록 */}
        <div className="space-y-3">
          {filteredGuides.map((guide) => {
            const isRead = isStrategyRead(guide.id);
            const catConfig = CATEGORY_CONFIG[guide.category];
            const diffBadge = DIFFICULTY_BADGE[guide.difficulty];

            return (
              <button
                key={guide.id}
                onClick={() => handleSelectGuide(guide)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border-2 transition-all',
                  'hover:border-primary-300 hover:shadow-md',
                  isRead
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-gray-200 dark:border-gray-700',
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{catConfig.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">
                        {guide.title}
                        {isRead && (
                          <span className="ml-2 text-green-500">✓</span>
                        )}
                      </h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs',
                          diffBadge.color,
                        )}
                      >
                        {diffBadge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {guide.summary}
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 가이드 상세 화면
  const catConfig = CATEGORY_CONFIG[selectedGuide.category];
  const diffBadge = DIFFICULTY_BADGE[selectedGuide.difficulty];
  const currentExample = selectedGuide.examples?.[currentExampleIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setSelectedGuide(null)}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 목록으로
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{catConfig.emoji}</span>
          <span
            className={cn('px-2 py-0.5 rounded text-xs', diffBadge.color)}
          >
            {diffBadge.label}
          </span>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6">{selectedGuide.title}</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* 콘텐츠 */}
        <div className="md:col-span-2">
          <div className="prose dark:prose-invert max-w-none">
            {/* Markdown 렌더링 (간단한 버전) */}
            {selectedGuide.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return (
                  <h1
                    key={i}
                    className="text-2xl font-bold mt-6 mb-4"
                  >
                    {line.slice(2)}
                  </h1>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2
                    key={i}
                    className="text-xl font-semibold mt-5 mb-3"
                  >
                    {line.slice(3)}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3
                    key={i}
                    className="text-lg font-medium mt-4 mb-2"
                  >
                    {line.slice(4)}
                  </h3>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <li
                    key={i}
                    className="ml-4 text-gray-600 dark:text-gray-400"
                  >
                    {line.slice(2)}
                  </li>
                );
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={i} className="font-bold">
                    {line.slice(2, -2)}
                  </p>
                );
              }
              if (line.trim()) {
                return (
                  <p
                    key={i}
                    className="text-gray-600 dark:text-gray-400 mb-2"
                  >
                    {line}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* 예제 보드 */}
        {selectedGuide.examples && selectedGuide.examples.length > 0 && (
          <div className="md:col-span-1">
            <div className="sticky top-4">
              <h3 className="font-semibold mb-3">예제</h3>

              {currentExample && (
                <div className="space-y-3">
                  <LearningBoard
                    fen={currentExample.fen}
                    boardWidth={280}
                    showCoordinates={false}
                  />
                  <p className="text-sm text-gray-500">
                    {currentExample.description}
                  </p>
                </div>
              )}

              {/* 예제 네비게이션 */}
              {selectedGuide.examples.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {selectedGuide.examples.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentExampleIndex(index)}
                      className={cn(
                        'w-2.5 h-2.5 rounded-full transition-colors',
                        index === currentExampleIndex
                          ? 'bg-primary-500'
                          : 'bg-gray-300 hover:bg-gray-400',
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="mt-8 pt-6 border-t dark:border-gray-700">
        <Button
          onClick={() => setSelectedGuide(null)}
          variant="secondary"
          className="w-full"
        >
          목록으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
