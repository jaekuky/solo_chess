// src/stores/learningStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  LearningProgress,
  PieceType,
  SpecialRuleType,
  PuzzleDifficulty,
} from '@/types';
import { INITIAL_LEARNING_PROGRESS } from '@/types';

interface LearningStore {
  progress: LearningProgress;

  // 기물 레슨
  completePieceLesson: (piece: PieceType) => void;
  isPieceLessonCompleted: (piece: PieceType) => boolean;

  // 특수 규칙
  completeSpecialRule: (rule: SpecialRuleType) => void;
  isSpecialRuleCompleted: (rule: SpecialRuleType) => boolean;

  // 퍼즐
  solvePuzzle: (difficulty: PuzzleDifficulty) => void;
  resetPuzzleStreak: () => void;

  // 전략 가이드
  markStrategyAsRead: (strategyId: string) => void;
  isStrategyRead: (strategyId: string) => boolean;

  // 초기화
  resetProgress: () => void;
}

export const useLearningStore = create<LearningStore>()(
  devtools(
    persist(
      (set, get) => ({
        progress: INITIAL_LEARNING_PROGRESS,

        completePieceLesson: (piece) => {
          set((state) => {
            if (state.progress.completedPieceLessons.includes(piece)) {
              return state;
            }
            return {
              progress: {
                ...state.progress,
                completedPieceLessons: [
                  ...state.progress.completedPieceLessons,
                  piece,
                ],
                lastLearningAt: Date.now(),
              },
            };
          });
        },

        isPieceLessonCompleted: (piece) => {
          return get().progress.completedPieceLessons.includes(piece);
        },

        completeSpecialRule: (rule) => {
          set((state) => {
            if (state.progress.completedSpecialRules.includes(rule)) {
              return state;
            }
            return {
              progress: {
                ...state.progress,
                completedSpecialRules: [
                  ...state.progress.completedSpecialRules,
                  rule,
                ],
                lastLearningAt: Date.now(),
              },
            };
          });
        },

        isSpecialRuleCompleted: (rule) => {
          return get().progress.completedSpecialRules.includes(rule);
        },

        solvePuzzle: (difficulty) => {
          set((state) => {
            const newStreak = state.progress.currentPuzzleStreak + 1;
            return {
              progress: {
                ...state.progress,
                puzzlesSolved: state.progress.puzzlesSolved + 1,
                puzzlesByDifficulty: {
                  ...state.progress.puzzlesByDifficulty,
                  [difficulty]:
                    state.progress.puzzlesByDifficulty[difficulty] + 1,
                },
                currentPuzzleStreak: newStreak,
                bestPuzzleStreak: Math.max(
                  state.progress.bestPuzzleStreak,
                  newStreak,
                ),
                lastLearningAt: Date.now(),
              },
            };
          });
        },

        resetPuzzleStreak: () => {
          set((state) => ({
            progress: {
              ...state.progress,
              currentPuzzleStreak: 0,
            },
          }));
        },

        markStrategyAsRead: (strategyId) => {
          set((state) => {
            if (state.progress.readStrategies.includes(strategyId)) {
              return state;
            }
            return {
              progress: {
                ...state.progress,
                readStrategies: [
                  ...state.progress.readStrategies,
                  strategyId,
                ],
                lastLearningAt: Date.now(),
              },
            };
          });
        },

        isStrategyRead: (strategyId) => {
          return get().progress.readStrategies.includes(strategyId);
        },

        resetProgress: () => {
          set({ progress: INITIAL_LEARNING_PROGRESS });
        },
      }),
      {
        name: 'solo-chess-learning',
      },
    ),
    { name: 'LearningStore' },
  ),
);
