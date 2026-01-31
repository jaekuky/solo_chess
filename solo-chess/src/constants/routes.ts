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

// 라우트 이름 (네비게이션 표시용)
export const ROUTE_NAMES: Record<string, string> = {
  [ROUTES.HOME]: '홈',
  [ROUTES.GAME_SETTINGS]: '새 게임',
  [ROUTES.GAME_PLAY]: '게임',
  [ROUTES.GAME_RESULT]: '결과',
  [ROUTES.LEARN]: '학습',
  [ROUTES.RULES]: '체스 규칙',
  [ROUTES.PUZZLE]: '퍼즐',
  [ROUTES.STRATEGY]: '전략 가이드',
  [ROUTES.HISTORY]: '기록',
  [ROUTES.REPLAY]: '복기',
  [ROUTES.SAVED_GAMES]: '저장된 게임',
  [ROUTES.SETTINGS]: '설정',
};
