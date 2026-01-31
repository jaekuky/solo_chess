// src/types/statistics.ts

import type { Difficulty } from './game';

// 난이도별 통계
export interface DifficultyStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
}

// 전체 통계
export interface Statistics {
  // 전체 기록
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;

  // 난이도별 기록
  byDifficulty: Record<Difficulty, DifficultyStats>;

  // 연승/연패 기록
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;

  // 시간 관련
  totalPlayTime: number; // 총 플레이 시간 (초)
  averageGameDuration: number; // 평균 게임 시간 (초)
  shortestWin: number | null; // 가장 빠른 승리 (수)
  longestGame: number | null; // 가장 긴 게임 (수)

  // 기타 통계
  totalMoves: number;
  totalHintsUsed: number;
  checkmates: number; // 체크메이트로 승리한 횟수

  // 날짜 기록
  firstGameAt: number | null;
  lastGameAt: number | null;
}

// 통계 초기값
export const INITIAL_STATISTICS: Statistics = {
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  totalDraws: 0,

  byDifficulty: {
    beginner: { played: 0, wins: 0, losses: 0, draws: 0 },
    intermediate: { played: 0, wins: 0, losses: 0, draws: 0 },
    advanced: { played: 0, wins: 0, losses: 0, draws: 0 },
    custom: { played: 0, wins: 0, losses: 0, draws: 0 },
  },

  currentWinStreak: 0,
  currentLossStreak: 0,
  longestWinStreak: 0,
  longestLossStreak: 0,

  totalPlayTime: 0,
  averageGameDuration: 0,
  shortestWin: null,
  longestGame: null,

  totalMoves: 0,
  totalHintsUsed: 0,
  checkmates: 0,

  firstGameAt: null,
  lastGameAt: null,
};
