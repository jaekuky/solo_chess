// src/stores/statisticsStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  type Statistics,
  INITIAL_STATISTICS,
  type PeriodStats,
} from '@/types';
import {
  type Difficulty,
  type PieceColor,
  type GameResult,
  type GameEndReason,
} from '@/types';

interface RecordGameParams {
  result: GameResult;
  difficulty: Difficulty;
  playerColor: PieceColor;
  duration: number; // 초
  moveCount: number;
  hintsUsed: number;
  undosUsed: number;
  endReason: GameEndReason;
  isCheckmate: boolean;
}

interface StatisticsStore {
  statistics: Statistics;

  // 게임 결과 기록
  recordGameResult: (params: RecordGameParams) => void;

  // 통계 조회
  getWinRate: (difficulty?: Difficulty) => number;
  getAverageGameDuration: (difficulty?: Difficulty) => number;
  getAverageMovesPerGame: (difficulty?: Difficulty) => number;
  getDailyStats: (days: number) => PeriodStats[];
  getRecentPerformance: (
    games: number
  ) => { wins: number; losses: number; draws: number };

  // 초기화
  resetStatistics: () => void;
}

// 시간대 판별
function getTimeOfDay(
  timestamp: number
): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date(timestamp).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

// 날짜 문자열 (YYYY-MM-DD)
function getDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

export const useStatisticsStore = create<StatisticsStore>()(
  devtools(
    persist(
      (set, get) => ({
        statistics: INITIAL_STATISTICS,

        recordGameResult: (params) => {
          const {
            result,
            difficulty,
            playerColor,
            duration,
            moveCount,
            hintsUsed,
            undosUsed: _undosUsed,
            endReason,
            isCheckmate,
          } = params;

          // TODO: undosUsed 통계 추가 시 사용 예정
          void _undosUsed;

          const now = Date.now();
          const today = getDateString(now);
          const timeOfDay = getTimeOfDay(now);

          set((state) => {
            const stats = { ...state.statistics };

            // 총합 업데이트
            stats.totalGames += 1;
            stats.totalMoves += moveCount;
            stats.totalDuration += duration;
            stats.totalHintsUsed += hintsUsed;

            // 결과별 업데이트
            if (result === 'win') {
              stats.totalWins += 1;
              stats.currentWinStreak += 1;
              stats.currentLossStreak = 0;
              stats.bestWinStreak = Math.max(
                stats.bestWinStreak,
                stats.currentWinStreak
              );

              if (isCheckmate) {
                stats.checkmatesGiven += 1;
              }

              // 최단 승리 시간
              if (stats.fastestWin === null || duration < stats.fastestWin) {
                stats.fastestWin = duration;
              }
            } else if (result === 'lose') {
              stats.totalLosses += 1;
              stats.currentLossStreak += 1;
              stats.currentWinStreak = 0;
              stats.worstLossStreak = Math.max(
                stats.worstLossStreak,
                stats.currentLossStreak
              );

              if (isCheckmate) {
                stats.checkmatesReceived += 1;
              }
            } else {
              stats.totalDraws += 1;
              stats.currentWinStreak = 0;
              stats.currentLossStreak = 0;
            }

            // 최장 게임 시간
            if (stats.longestGame === null || duration > stats.longestGame) {
              stats.longestGame = duration;
            }

            // 평균 계산
            stats.averageGameDuration =
              stats.totalDuration / stats.totalGames;
            stats.averageMovesPerGame = stats.totalMoves / stats.totalGames;

            // 난이도별 통계 업데이트
            const diffStats = { ...stats.byDifficulty[difficulty] };
            diffStats.gamesPlayed += 1;
            diffStats.totalMoves += moveCount;
            diffStats.totalDuration += duration;

            if (result === 'win') {
              diffStats.wins += 1;
              diffStats.winStreak += 1;
              diffStats.lossStreak = 0;
              diffStats.bestWinStreak = Math.max(
                diffStats.bestWinStreak,
                diffStats.winStreak
              );
              if (isCheckmate) diffStats.checkmates += 1;
            } else if (result === 'lose') {
              diffStats.losses += 1;
              diffStats.lossStreak += 1;
              diffStats.winStreak = 0;
            } else {
              diffStats.draws += 1;
              diffStats.winStreak = 0;
              diffStats.lossStreak = 0;
            }

            diffStats.averageMoves =
              diffStats.totalMoves / diffStats.gamesPlayed;
            diffStats.averageDuration =
              diffStats.totalDuration / diffStats.gamesPlayed;

            stats.byDifficulty[difficulty] = diffStats;

            // 색상별 통계
            const colorKey = playerColor === 'w' ? 'white' : 'black';
            stats.byColor[colorKey].games += 1;
            if (result === 'win') stats.byColor[colorKey].wins += 1;
            else if (result === 'lose') stats.byColor[colorKey].losses += 1;
            else stats.byColor[colorKey].draws += 1;

            // 종료 사유별 통계 (null이 아닌 경우만)
            if (endReason) {
              stats.byEndReason[endReason] =
                (stats.byEndReason[endReason] || 0) + 1;
            }

            // 시간대별 통계
            stats.timeOfDayStats[timeOfDay] += 1;

            // 일별 통계 업데이트
            const dailyStats = [...stats.dailyStats];
            const todayIndex = dailyStats.findIndex((d) => d.date === today);

            if (todayIndex >= 0) {
              const todayStats = { ...dailyStats[todayIndex] };
              todayStats.gamesPlayed += 1;
              todayStats.totalDuration += duration;
              if (result === 'win') todayStats.wins += 1;
              else if (result === 'lose') todayStats.losses += 1;
              else todayStats.draws += 1;
              dailyStats[todayIndex] = todayStats;
            } else {
              dailyStats.push({
                date: today,
                gamesPlayed: 1,
                wins: result === 'win' ? 1 : 0,
                losses: result === 'lose' ? 1 : 0,
                draws: result === 'draw' ? 1 : 0,
                totalDuration: duration,
              });
            }

            // 최근 90일 데이터만 유지
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const cutoffDate = getDateString(ninetyDaysAgo.getTime());
            stats.dailyStats = dailyStats
              .filter((d) => d.date >= cutoffDate)
              .sort((a, b) => a.date.localeCompare(b.date));

            // 메타 정보
            stats.lastUpdated = now;
            if (stats.firstGameAt === null) {
              stats.firstGameAt = now;
            }

            return { statistics: stats };
          });
        },

        getWinRate: (difficulty) => {
          const stats = get().statistics;

          if (difficulty) {
            const diffStats = stats.byDifficulty[difficulty];
            if (diffStats.gamesPlayed === 0) return 0;
            return (diffStats.wins / diffStats.gamesPlayed) * 100;
          }

          if (stats.totalGames === 0) return 0;
          return (stats.totalWins / stats.totalGames) * 100;
        },

        getAverageGameDuration: (difficulty) => {
          const stats = get().statistics;

          if (difficulty) {
            const diffStats = stats.byDifficulty[difficulty];
            return diffStats.averageDuration;
          }

          return stats.averageGameDuration;
        },

        getAverageMovesPerGame: (difficulty) => {
          const stats = get().statistics;

          if (difficulty) {
            const diffStats = stats.byDifficulty[difficulty];
            return diffStats.averageMoves;
          }

          return stats.averageMovesPerGame;
        },

        getDailyStats: (days) => {
          const stats = get().statistics;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          const cutoff = getDateString(cutoffDate.getTime());

          return stats.dailyStats.filter((d) => d.date >= cutoff);
        },

        getRecentPerformance: (games) => {
          // 최근 N 게임의 성적 (dailyStats로는 정확히 구할 수 없으므로 대략적 계산)
          const stats = get().statistics;
          const recent = stats.dailyStats.slice(-Math.ceil(games / 5)); // 대략적 추정

          return recent.reduce(
            (acc, day) => ({
              wins: acc.wins + day.wins,
              losses: acc.losses + day.losses,
              draws: acc.draws + day.draws,
            }),
            { wins: 0, losses: 0, draws: 0 }
          );
        },

        resetStatistics: () => {
          set({ statistics: INITIAL_STATISTICS });
        },
      }),
      {
        name: 'solo-chess-statistics',
      }
    ),
    { name: 'StatisticsStore' }
  )
);
