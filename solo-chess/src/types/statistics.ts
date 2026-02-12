// src/types/statistics.ts

import { type Difficulty, type GameEndReason } from './game';
import { type PieceColor } from './chess';

// 난이도별 통계
export interface DifficultyStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalMoves: number;
  totalDuration: number; // 초
  averageMoves: number;
  averageDuration: number;
  winStreak: number;
  lossStreak: number;
  bestWinStreak: number;
  checkmates: number; // 체크메이트로 이긴 횟수
}

// 기간별 통계
export interface PeriodStats {
  date: string; // YYYY-MM-DD
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalDuration: number;
}

// 시간대별 통계
export interface TimeOfDayStats {
  morning: number; // 6-12
  afternoon: number; // 12-18
  evening: number; // 18-24
  night: number; // 0-6
}

// 오프닝 통계
export interface OpeningStats {
  name: string;
  eco: string; // ECO 코드
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

// 전체 통계
export interface Statistics {
  // 총합 통계
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalMoves: number;
  totalDuration: number; // 초
  totalHintsUsed: number;

  // 현재 연속 기록
  currentWinStreak: number;
  currentLossStreak: number;
  bestWinStreak: number;
  worstLossStreak: number;

  // 난이도별 통계
  byDifficulty: Record<Difficulty, DifficultyStats>;

  // 색상별 통계
  byColor: {
    white: { games: number; wins: number; losses: number; draws: number };
    black: { games: number; wins: number; losses: number; draws: number };
  };

  // 종료 사유별 통계
  byEndReason: Record<Exclude<GameEndReason, null>, number>;

  // 체크메이트 통계
  checkmatesGiven: number;
  checkmatesReceived: number;

  // 시간 관련
  fastestWin: number | null; // 초
  longestGame: number | null; // 초
  averageGameDuration: number;
  averageMovesPerGame: number;

  // 기간별 통계 (최근 90일)
  dailyStats: PeriodStats[];

  // 시간대별 선호도
  timeOfDayStats: TimeOfDayStats;

  // 마지막 업데이트
  lastUpdated: number;
  firstGameAt: number | null;
}

// 통계 필터
export interface StatsFilter {
  period: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  difficulty: Difficulty | 'all';
  color: PieceColor | 'all';
  customDateRange?: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
}

// 초기 난이도별 통계
const INITIAL_DIFFICULTY_STATS: DifficultyStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  totalMoves: 0,
  totalDuration: 0,
  averageMoves: 0,
  averageDuration: 0,
  winStreak: 0,
  lossStreak: 0,
  bestWinStreak: 0,
  checkmates: 0,
};

// 초기 통계
export const INITIAL_STATISTICS: Statistics = {
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  totalDraws: 0,
  totalMoves: 0,
  totalDuration: 0,
  totalHintsUsed: 0,

  currentWinStreak: 0,
  currentLossStreak: 0,
  bestWinStreak: 0,
  worstLossStreak: 0,

  byDifficulty: {
    beginner: { ...INITIAL_DIFFICULTY_STATS },
    intermediate: { ...INITIAL_DIFFICULTY_STATS },
    advanced: { ...INITIAL_DIFFICULTY_STATS },
    custom: { ...INITIAL_DIFFICULTY_STATS },
  },

  byColor: {
    white: { games: 0, wins: 0, losses: 0, draws: 0 },
    black: { games: 0, wins: 0, losses: 0, draws: 0 },
  },

  byEndReason: {
    checkmate: 0,
    resignation: 0,
    timeout: 0,
    stalemate: 0,
    draw_agreement: 0,
    insufficient_material: 0,
    fifty_move_rule: 0,
    threefold_repetition: 0,
  },

  checkmatesGiven: 0,
  checkmatesReceived: 0,

  fastestWin: null,
  longestGame: null,
  averageGameDuration: 0,
  averageMovesPerGame: 0,

  dailyStats: [],

  timeOfDayStats: {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  },

  lastUpdated: Date.now(),
  firstGameAt: null,
};
