// src/hooks/useTheme.ts

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useSettingsStore } from '@/stores';
import type { ThemeMode } from '@/types';

interface UseThemeReturn {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// 시스템 테마 구독을 위한 함수들
function subscribeToSystemTheme(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getSystemThemeSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useTheme(): UseThemeReturn {
  const { settings, setTheme } = useSettingsStore();
  
  // 시스템 테마 변경을 구독
  const prefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerSnapshot
  );

  // 실제 적용된 테마 계산
  const resolvedTheme = useMemo(() => {
    if (settings.theme === 'system') {
      return prefersDark ? 'dark' : 'light';
    }
    return settings.theme;
  }, [settings.theme, prefersDark]);

  // DOM에 테마 클래스 적용 (side effect로만 사용)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    }
  }, [resolvedTheme]);

  // 테마 토글
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return {
    theme: settings.theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}
