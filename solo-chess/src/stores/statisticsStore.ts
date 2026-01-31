// src/stores/statisticsStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Statistics, Difficulty, GameResult } from '@/types';
import { INITIAL_STATISTICS } from '@/types';

interface StatisticsStore {
  statistics: Statistics;

  // 게임 결과 기록
  recordGameResult: (
    result: GameResult,
    difficulty: Difficulty,
    duration: number,
    moveCount: number,
    hintsUsed: number,
    isCheckmate: boolean
  ) => void;

  // 통계 초기화
  resetStatistics: () => void;
}

export const useStatisticsStore = create<StatisticsStore>()(
  devtools(
    persist(
      (set) => ({
        statistics: INITIAL_STATISTICS,

        recordGameResult: (
          result,
          difficulty,
          duration,
          moveCount,
          hintsUsed,
          isCheckmate
        ) =>
          set((state) => {
            const stats = { ...state.statistics };
            const now = Date.now();

            // 전체 기록 업데이트
            stats.totalGames += 1;
            if (result === 'win') stats.totalWins += 1;
            else if (result === 'lose') stats.totalLosses += 1;
            else if (result === 'draw') stats.totalDraws += 1;

            // 난이도별 기록 업데이트
            const diffStats = { ...stats.byDifficulty[difficulty] };
            diffStats.played += 1;
            if (result === 'win') diffStats.wins += 1;
            else if (result === 'lose') diffStats.losses += 1;
            else if (result === 'draw') diffStats.draws += 1;
            stats.byDifficulty = {
              ...stats.byDifficulty,
              [difficulty]: diffStats,
            };

            // 연승/연패 업데이트
            if (result === 'win') {
              stats.currentWinStreak += 1;
              stats.currentLossStreak = 0;
              if (stats.currentWinStreak > stats.longestWinStreak) {
                stats.longestWinStreak = stats.currentWinStreak;
              }
            } else if (result === 'lose') {
              stats.currentLossStreak += 1;
              stats.currentWinStreak = 0;
              if (stats.currentLossStreak > stats.longestLossStreak) {
                stats.longestLossStreak = stats.currentLossStreak;
              }
            }

            // 시간 통계 업데이트
            stats.totalPlayTime += duration;
            stats.averageGameDuration = stats.totalPlayTime / stats.totalGames;

            // 최단 승리, 최장 게임 업데이트
            if (result === 'win') {
              if (
                stats.shortestWin === null ||
                moveCount < stats.shortestWin
              ) {
                stats.shortestWin = moveCount;
              }
            }
            if (
              stats.longestGame === null ||
              moveCount > stats.longestGame
            ) {
              stats.longestGame = moveCount;
            }

            // 기타 통계
            stats.totalMoves += moveCount;
            stats.totalHintsUsed += hintsUsed;
            if (result === 'win' && isCheckmate) {
              stats.checkmates += 1;
            }

            // 날짜 기록
            if (stats.firstGameAt === null) {
              stats.firstGameAt = now;
            }
            stats.lastGameAt = now;

            return { statistics: stats };
          }),

        resetStatistics: () => set({ statistics: INITIAL_STATISTICS }),
      }),
      {
        name: 'solo-chess-statistics',
      }
    ),
    { name: 'StatisticsStore' }
  )
);
