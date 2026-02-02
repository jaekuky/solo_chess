// src/constants/routes.ts

export const ROUTES = {
  HOME: '/',

  // 게임 관련
  GAME_SETTINGS: '/game/settings',
  GAME_PLAY: '/game/play',
  GAME_RESULT: '/game/result',

  // 학습 관련
  LEARN: '/learn',
  RULES: '/learn/rules',
  PUZZLE: '/learn/puzzle',
  STRATEGY: '/learn/strategy',

  // 기록 관련
  HISTORY: '/history',
  REPLAY: '/history/replay',
  SAVED_GAMES: '/saved-games',

  // 설정
  SETTINGS: '/settings',
} as const;
