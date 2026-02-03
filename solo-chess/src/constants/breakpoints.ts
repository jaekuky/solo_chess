// src/constants/breakpoints.ts

// Tailwind 기본 브레이크포인트와 동일하게 설정
export const BREAKPOINTS = {
  sm: 640,   // 모바일 landscape
  md: 768,   // 태블릿
  lg: 1024,  // 작은 데스크탑
  xl: 1280,  // 데스크탑
  '2xl': 1536, // 큰 데스크탑
} as const;

// 기기 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 기기 타입 판별
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
}

// 체스판 최적 크기 계산
export function getOptimalBoardSize(
  windowWidth: number,
  windowHeight: number,
  hasPanel: boolean = true
): number {
  const deviceType = getDeviceType(windowWidth);
  
  // 여백
  const horizontalPadding = deviceType === 'mobile' ? 16 : 32;
  const verticalPadding = deviceType === 'mobile' ? 120 : 160; // 헤더 + 컨트롤
  
  // 사이드 패널 너비 (데스크탑에서만)
  const panelWidth = hasPanel && deviceType === 'desktop' ? 320 : 0;
  
  // 사용 가능한 공간
  const availableWidth = windowWidth - horizontalPadding * 2 - panelWidth;
  const availableHeight = windowHeight - verticalPadding;
  
  // 최소/최대 크기
  const minSize = 280;
  const maxSize = 600;
  
  // 정사각형 보드이므로 작은 쪽에 맞춤
  const size = Math.min(availableWidth, availableHeight);
  
  return Math.max(minSize, Math.min(maxSize, size));
}
