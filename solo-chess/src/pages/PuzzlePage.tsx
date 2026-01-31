// src/pages/PuzzlePage.tsx

import { useState, useCallback } from 'react';
import { InteractivePuzzleBoard } from '@/components/learning';
import { Button } from '@/components/common';
import { useLearningStore } from '@/stores';
import {
  getRandomPuzzle,
  getPuzzlesByDifficulty,
} from '@/data';
import type { Puzzle, PuzzleDifficulty } from '@/types';
import { cn } from '@/utils';

type GameState = 'select' | 'playing' | 'solved' | 'failed';

const DIFFICULTY_CONFIG: Record<
  PuzzleDifficulty,
  { name: string; emoji: string; color: string }
> = {
  beginner: { name: '입문', emoji: '🌱', color: 'text-green-500' },
  easy: { name: '쉬움', emoji: '🌿', color: 'text-blue-500' },
  medium: { name: '보통', emoji: '🌳', color: 'text-yellow-500' },
  hard: { name: '어려움', emoji: '🔥', color: 'text-red-500' },
};

export function PuzzlePage() {
  const { progress, solvePuzzle, resetPuzzleStreak } = useLearningStore();

  const [gameState, setGameState] = useState<GameState>('select');
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<PuzzleDifficulty>('beginner');
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);

  // 퍼즐 시작
  const startPuzzle = useCallback(
    (difficulty?: PuzzleDifficulty) => {
      const diff = difficulty ?? selectedDifficulty;
      const puzzle = getRandomPuzzle(diff);
      setCurrentPuzzle(puzzle);
      setGameState('playing');
      setCurrentHintIndex(0);
      setShowHint(false);
      setAttemptsCount(0);
    },
    [selectedDifficulty],
  );

  // 퍼즐 해결
  const handleSolve = useCallback(() => {
    if (currentPuzzle) {
      solvePuzzle(currentPuzzle.difficulty);
      setGameState('solved');
    }
  }, [currentPuzzle, solvePuzzle]);

  // 퍼즐 실패 (오답)
  const handleFail = useCallback(() => {
    setAttemptsCount((prev) => prev + 1);

    // 3번 이상 틀리면 연속 기록 리셋
    if (attemptsCount >= 2) {
      resetPuzzleStreak();
    }
  }, [attemptsCount, resetPuzzleStreak]);

  // 힌트 보기
  const showNextHint = useCallback(() => {
    if (currentPuzzle && currentHintIndex < currentPuzzle.hints.length) {
      setShowHint(true);
    }
  }, [currentPuzzle, currentHintIndex]);

  // 다음 힌트
  const nextHint = useCallback(() => {
    if (
      currentPuzzle &&
      currentHintIndex < currentPuzzle.hints.length - 1
    ) {
      setCurrentHintIndex((prev) => prev + 1);
    }
  }, [currentPuzzle, currentHintIndex]);

  // 선택 화면
  if (gameState === 'select') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">체크메이트 퍼즐</h2>
          <p className="text-gray-500">
            체크메이트를 완성하세요! 난이도를 선택하고 시작하세요.
          </p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary-500">
              {progress.puzzlesSolved}
            </p>
            <p className="text-sm text-gray-500">해결한 퍼즐</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              {progress.currentPuzzleStreak}
            </p>
            <p className="text-sm text-gray-500">현재 연속</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">
              {progress.bestPuzzleStreak}
            </p>
            <p className="text-sm text-gray-500">최고 연속</p>
          </div>
        </div>

        {/* 난이도 선택 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">난이도 선택</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(DIFFICULTY_CONFIG) as PuzzleDifficulty[]).map(
              (diff) => {
                const config = DIFFICULTY_CONFIG[diff];
                const puzzleCount = getPuzzlesByDifficulty(diff).length;
                const solvedCount = progress.puzzlesByDifficulty[diff];

                return (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-left',
                      selectedDifficulty === diff
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{config.emoji}</span>
                      <div>
                        <p className={cn('font-medium', config.color)}>
                          {config.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {solvedCount} / {puzzleCount} 해결
                        </p>
                      </div>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </section>

        {/* 시작 버튼 */}
        <Button onClick={() => startPuzzle()} size="lg" className="w-full">
          🧩 퍼즐 시작
        </Button>

        {/* 난이도별 해결 현황 */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <h4 className="font-medium mb-3">난이도별 현황</h4>
          <div className="space-y-2">
            {(Object.keys(DIFFICULTY_CONFIG) as PuzzleDifficulty[]).map(
              (diff) => {
                const config = DIFFICULTY_CONFIG[diff];
                const puzzleCount = getPuzzlesByDifficulty(diff).length;
                const solvedCount = progress.puzzlesByDifficulty[diff];
                const percentage =
                  puzzleCount > 0 ? (solvedCount / puzzleCount) * 100 : 0;

                return (
                  <div key={diff}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>
                        {config.emoji} {config.name}
                      </span>
                      <span>
                        {solvedCount} / {puzzleCount}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    );
  }

  // 플레이 화면
  if (
    (gameState === 'playing' || gameState === 'failed') &&
    currentPuzzle
  ) {
    const config = DIFFICULTY_CONFIG[currentPuzzle.difficulty];

    return (
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className={cn('text-sm font-medium', config.color)}>
              {config.emoji} {config.name}
            </span>
            <h2 className="text-xl font-bold">{currentPuzzle.title}</h2>
          </div>
          <div className="text-sm text-gray-500">
            연속: {progress.currentPuzzleStreak}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 체스판 */}
          <div>
            <InteractivePuzzleBoard
              puzzle={currentPuzzle}
              onSolve={handleSolve}
              onFail={handleFail}
              boardWidth={400}
            />
          </div>

          {/* 정보 패널 */}
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="font-medium mb-1">문제</p>
              <p className="text-gray-600 dark:text-gray-400">
                {currentPuzzle.description}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {currentPuzzle.playerColor === 'w' ? '백' : '흑'}이 둘
                차례입니다.
              </p>
            </div>

            {/* 힌트 */}
            {showHint &&
              currentPuzzle.hints[currentHintIndex] !== undefined && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                  <p className="font-medium mb-1">
                    💡 힌트 {currentHintIndex + 1}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentPuzzle.hints[currentHintIndex]}
                  </p>
                  {currentHintIndex < currentPuzzle.hints.length - 1 && (
                    <button
                      onClick={nextHint}
                      className="mt-2 text-sm text-primary-600 hover:underline"
                    >
                      다음 힌트 보기
                    </button>
                  )}
                </div>
              )}

            {!showHint && currentPuzzle.hints.length > 0 && (
              <Button
                variant="secondary"
                onClick={showNextHint}
                className="w-full"
              >
                💡 힌트 보기
              </Button>
            )}

            {/* 시도 횟수 */}
            {attemptsCount > 0 && (
              <p className="text-sm text-gray-500 text-center">
                시도 횟수: {attemptsCount}
              </p>
            )}

            {/* 포기 */}
            <Button
              variant="ghost"
              onClick={() => {
                resetPuzzleStreak();
                setGameState('select');
              }}
              className="w-full text-gray-500"
            >
              포기하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 해결 화면
  if (gameState === 'solved' && currentPuzzle) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="py-8">
          <span className="text-6xl block mb-4">🎉</span>
          <h2 className="text-2xl font-bold mb-2">정답입니다!</h2>
          <p className="text-gray-500 mb-6">
            {currentPuzzle.title} 퍼즐을 해결했습니다.
          </p>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-500">
                  {progress.currentPuzzleStreak}
                </p>
                <p className="text-sm text-gray-500">현재 연속</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-500">
                  {progress.puzzlesSolved}
                </p>
                <p className="text-sm text-gray-500">총 해결</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => startPuzzle()}
              size="lg"
              className="w-full"
            >
              다음 퍼즐
            </Button>
            <Button
              variant="secondary"
              onClick={() => setGameState('select')}
              className="w-full"
            >
              난이도 선택으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
