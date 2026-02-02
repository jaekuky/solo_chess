// src/constants/settings.ts

import type {
  BoardStyle,
  AnimationSpeed,
  ThemeMode,
  CoordinateDisplay,
} from '@/types';

// 테마 옵션
export const THEME_OPTIONS: {
  value: ThemeMode;
  label: string;
  icon: string;
}[] = [
  { value: 'light', label: '라이트', icon: '☀️' },
  { value: 'dark', label: '다크', icon: '🌙' },
  { value: 'system', label: '시스템', icon: '💻' },
];

// 보드 스타일 설정
export const BOARD_STYLE_CONFIG: Record<
  BoardStyle,
  {
    name: string;
    light: string;
    dark: string;
    preview: string;
  }
> = {
  classic: {
    name: '클래식',
    light: '#f0d9b5',
    dark: '#b58863',
    preview: '🟫',
  },
  modern: {
    name: '모던',
    light: '#eeeed2',
    dark: '#769656',
    preview: '🟩',
  },
  wood: {
    name: '나무결',
    light: '#e8c99b',
    dark: '#a17a4d',
    preview: '🪵',
  },
  blue: {
    name: '블루',
    light: '#dee3e6',
    dark: '#8ca2ad',
    preview: '🟦',
  },
  green: {
    name: '그린',
    light: '#ffffdd',
    dark: '#86a666',
    preview: '🌿',
  },
  marble: {
    name: '대리석',
    light: '#f5f5f5',
    dark: '#b0b0b0',
    preview: '⬜',
  },
  canvas: {
    name: '캔버스',
    light: '#d7b899',
    dark: '#97732c',
    preview: '📜',
  },
};

// 애니메이션 속도 설정
export const ANIMATION_SPEED_CONFIG: Record<
  AnimationSpeed,
  {
    name: string;
    duration: number; // ms
  }
> = {
  none: { name: '없음', duration: 0 },
  fast: { name: '빠르게', duration: 100 },
  normal: { name: '보통', duration: 200 },
  slow: { name: '느리게', duration: 400 },
};

// 좌표 표시 옵션
export const COORDINATE_OPTIONS: {
  value: CoordinateDisplay;
  label: string;
}[] = [
  { value: 'none', label: '숨김' },
  { value: 'inside', label: '내부' },
  { value: 'outside', label: '외부' },
];

