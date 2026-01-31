// src/types/settings.ts

import type { Difficulty, TimeControl } from './game';

// 화면 테마
export type Theme = 'light' | 'dark' | 'system';

// 체스판 스타일
export type BoardStyle = 'classic' | 'modern' | 'wood' | 'blue' | 'green';

// 기물 스타일
export type PieceStyle = 'standard' | 'neo' | 'alpha' | 'chess24';

// 사용자 설정
export interface UserSettings {
  // 게임 기본 설정
  defaultDifficulty: Difficulty;
  defaultTimeControl: TimeControl;
  autoSave: boolean;
  showLegalMoves: boolean;
  showLastMove: boolean;
  enableHints: boolean;
  confirmResign: boolean;

  // 화면 설정
  theme: Theme;
  boardStyle: BoardStyle;
  pieceStyle: PieceStyle;
  boardSize: 'small' | 'medium' | 'large' | 'auto';
  showCoordinates: boolean;
  animationSpeed: 'none' | 'fast' | 'normal' | 'slow';

  // 사운드 설정
  soundEnabled: boolean;
  soundVolume: number; // 0 ~ 1
  moveSound: boolean;
  captureSound: boolean;
  checkSound: boolean;
  gameEndSound: boolean;
}

// 설정 기본값
export const DEFAULT_SETTINGS: UserSettings = {
  defaultDifficulty: 'beginner',
  defaultTimeControl: 'none',
  autoSave: true,
  showLegalMoves: true,
  showLastMove: true,
  enableHints: true,
  confirmResign: true,

  theme: 'system',
  boardStyle: 'classic',
  pieceStyle: 'standard',
  boardSize: 'auto',
  showCoordinates: true,
  animationSpeed: 'normal',

  soundEnabled: true,
  soundVolume: 0.7,
  moveSound: true,
  captureSound: true,
  checkSound: true,
  gameEndSound: true,
};
