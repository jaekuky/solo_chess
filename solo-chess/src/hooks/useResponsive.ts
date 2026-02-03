// src/hooks/useResponsive.ts

import { useState, useEffect, useCallback } from 'react';
import { getDeviceType, getOptimalBoardSize, type DeviceType } from '@/constants/breakpoints';

interface UseResponsiveReturn {
  // 기기 정보
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // 화면 크기
  windowWidth: number;
  windowHeight: number;
  
  // 체스판 크기
  boardSize: number;
  
  // 방향
  isLandscape: boolean;
  isPortrait: boolean;
  
  // 터치 디바이스 여부
  isTouchDevice: boolean;
}

export function useResponsive(hasPanel: boolean = true): UseResponsiveReturn {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
  
  const isTouchDevice = typeof window !== 'undefined' 
    ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    : false;
  
  // 리사이즈 핸들러
  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);
  
  useEffect(() => {
    // 리사이즈 이벤트
    window.addEventListener('resize', handleResize);
    
    // 방향 변경 이벤트 (모바일)
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);
  
  const deviceType = getDeviceType(windowSize.width);
  const boardSize = getOptimalBoardSize(windowSize.width, windowSize.height, hasPanel);
  
  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    
    windowWidth: windowSize.width,
    windowHeight: windowSize.height,
    
    boardSize,
    
    isLandscape: windowSize.width > windowSize.height,
    isPortrait: windowSize.width <= windowSize.height,
    
    isTouchDevice,
  };
}
