// src/types/settings.ts

import type { Difficulty, TimeControl } from './game';

// 테마 타입
export type ThemeMode = 'light' | 'dark' | 'system';

// 보드 스타일 타입
export type BoardStyle =
  | 'classic'
  | 'modern'
  | 'wood'
  | 'blue'
  | 'green'
  | 'marble'
  | 'canvas';

// 애니메이션 속도
export type AnimationSpeed = 'none' | 'fast' | 'normal' | 'slow';

// 좌표 표시 방식
export type CoordinateDisplay = 'none' | 'inside' | 'outside';

// 사운드 설정
export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-100
  moveSound: boolean;
  captureSound: boolean;
  checkSound: boolean;
  gameEndSound: boolean;
  timerWarningSound: boolean;
}

// 게임 옵션
export interface GameOptions {
  showLegalMoves: boolean;
  showLastMove: boolean;
  showCheck: boolean;
  showCoordinates: CoordinateDisplay;
  autoQueen: boolean; // 자동 퀸 승격
  confirmMove: boolean; // 수 확인 후 이동
  premove: boolean; // 프리무브 허용
  enableHints: boolean;
  maxHints: number; // 게임당 최대 힌트 수 (0 = 무제한)
  enableUndo: boolean;
  maxUndos: number; // 게임당 최대 무르기 수 (0 = 무제한)
}

// 접근성 설정
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderAnnouncements: boolean;
}

// 알림 설정
export interface NotificationSettings {
  gameReminders: boolean;
  dailyPuzzle: boolean;
  achievementUnlock: boolean;
}

// 전체 사용자 설정
export interface UserSettings {
  // 외관
  theme: ThemeMode;
  boardStyle: BoardStyle;
  animationSpeed: AnimationSpeed;

  // 사운드
  sound: SoundSettings;

  // 게임 옵션
  gameOptions: GameOptions;

  // 접근성
  accessibility: AccessibilitySettings;

  // 알림
  notifications: NotificationSettings;

  // 기타
  autoSave: boolean;

  // 게임 기본값 (게임 설정 페이지에서 사용)
  defaultDifficulty: Difficulty;
  defaultTimeControl: TimeControl;

  // 메타
  settingsVersion: number;
  lastUpdated: number;
}

// 기본 설정값
export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 70,
  moveSound: true,
  captureSound: true,
  checkSound: true,
  gameEndSound: true,
  timerWarningSound: true,
};

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  showLegalMoves: true,
  showLastMove: true,
  showCheck: true,
  showCoordinates: 'inside',
  autoQueen: false,
  confirmMove: false,
  premove: false,
  enableHints: true,
  maxHints: 0, // 무제한
  enableUndo: true,
  maxUndos: 0, // 무제한
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  screenReaderAnnouncements: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  gameReminders: true,
  dailyPuzzle: true,
  achievementUnlock: true,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  boardStyle: 'classic',
  animationSpeed: 'normal',

  sound: DEFAULT_SOUND_SETTINGS,
  gameOptions: DEFAULT_GAME_OPTIONS,
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,

  autoSave: true,

  defaultDifficulty: 'beginner',
  defaultTimeControl: 'none',

  settingsVersion: 1,
  lastUpdated: Date.now(),
};
