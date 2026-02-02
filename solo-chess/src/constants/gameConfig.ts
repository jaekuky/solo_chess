// src/constants/gameConfig.ts

import type { Difficulty, TimeControl } from '@/types';

// 난이도별 설정
export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    name: string;
    description: string;
    depth: number;
    moveTime: number; // AI가 수를 계산하는 최대 시간 (ms)
  }
> = {
  beginner: {
    name: '초급',
    description: '체스를 처음 배우는 분께 추천합니다',
    depth: 1,
    moveTime: 500,
  },
  intermediate: {
    name: '중급',
    description: '기본 규칙을 알고 있는 분께 추천합니다',
    depth: 5,
    moveTime: 1000,
  },
  advanced: {
    name: '고급',
    description: '체스 전략에 익숙한 분께 추천합니다',
    depth: 12,
    moveTime: 2000,
  },
  custom: {
    name: '커스텀',
    description: 'AI 강도를 직접 설정합니다',
    depth: 5,
    moveTime: 1500,
  },
};

// 시간 제한 설정
export const TIME_CONTROL_CONFIG: Record<
  TimeControl,
  {
    name: string;
    description: string;
    seconds: number | null; // null이면 시간 제한 없음
  }
> = {
  none: {
    name: '시간 제한 없음',
    description: '천천히 생각하며 플레이합니다',
    seconds: null,
  },
  '10min': {
    name: '10분',
    description: '각자 10분씩 주어집니다',
    seconds: 600,
  },
  '5min': {
    name: '5분',
    description: '빠른 게임을 즐깁니다',
    seconds: 300,
  },
  '3min': {
    name: '3분',
    description: '블리츠 게임입니다',
    seconds: 180,
  },
  '1min': {
    name: '1분',
    description: '불릿 게임입니다',
    seconds: 60,
  },
};

// 기물 가치 (통계 계산용)
export const PIECE_VALUES: Record<string, number> = {
  p: 1,   // 폰
  n: 3,   // 나이트
  b: 3,   // 비숍
  r: 5,   // 룩
  q: 9,   // 퀸
  k: 0,   // 킹 (잡을 수 없음)
};

// AI 이름
export const AI_NAMES: Record<Difficulty, string> = {
  beginner: '루키 봇',
  intermediate: '미들 봇',
  advanced: '마스터 봇',
  custom: '커스텀 봇',
};

// 초기 FEN (표준 시작 위치)
export const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
