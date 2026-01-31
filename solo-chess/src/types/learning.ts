// src/types/learning.ts

import type { PieceType, PieceColor, Square } from './chess';

// 학습 진행 상태
export interface LearningProgress {
  // 규칙 학습
  completedPieceLessons: PieceType[];
  completedSpecialRules: SpecialRuleType[];

  // 퍼즐
  puzzlesSolved: number;
  puzzlesByDifficulty: Record<PuzzleDifficulty, number>;
  currentPuzzleStreak: number;
  bestPuzzleStreak: number;

  // 전략 가이드
  readStrategies: string[];

  // 날짜
  lastLearningAt: number | null;
}

// 특수 규칙 타입
export type SpecialRuleType =
  | 'castling'
  | 'en-passant'
  | 'promotion'
  | 'check'
  | 'checkmate'
  | 'stalemate';

// 퍼즐 난이도
export type PuzzleDifficulty = 'beginner' | 'easy' | 'medium' | 'hard';

// 퍼즐 데이터
export interface Puzzle {
  id: string;
  title: string;
  description: string;
  difficulty: PuzzleDifficulty;
  fen: string; // 시작 포지션
  solution: string[]; // 정답 수 시퀀스 (UCI 형식: e2e4)
  hints: string[]; // 힌트 메시지
  themes: string[]; // 테마 태그 (예: 'fork', 'pin', 'back-rank')
  playerColor: PieceColor; // 플레이어가 둘 색상
}

// 기물 학습 데이터
export interface PieceLesson {
  piece: PieceType;
  name: string;
  nameEn: string;
  symbol: { w: string; b: string };
  value: number;
  description: string;
  movementDescription: string;
  specialRules?: string[];
  tips: string[];
  examplePositions: {
    fen: string;
    description: string;
    highlightSquares: Square[];
  }[];
}

// 특수 규칙 학습 데이터
export interface SpecialRuleLesson {
  id: SpecialRuleType;
  name: string;
  description: string;
  steps: {
    instruction: string;
    fen: string;
    highlightSquares?: Square[];
    arrowFrom?: Square;
    arrowTo?: Square;
  }[];
  interactiveExample?: {
    fen: string;
    correctMove: string; // UCI 형식
    explanation: string;
  };
}

// 전략 가이드
export interface StrategyGuide {
  id: string;
  category: 'opening' | 'middlegame' | 'endgame' | 'tactics' | 'principles';
  title: string;
  summary: string;
  content: string; // Markdown 형식
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  examples?: {
    fen: string;
    description: string;
  }[];
}

// 학습 진행 초기값
export const INITIAL_LEARNING_PROGRESS: LearningProgress = {
  completedPieceLessons: [],
  completedSpecialRules: [],
  puzzlesSolved: 0,
  puzzlesByDifficulty: {
    beginner: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  },
  currentPuzzleStreak: 0,
  bestPuzzleStreak: 0,
  readStrategies: [],
  lastLearningAt: null,
};
