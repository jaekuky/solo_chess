// src/stores/settingsStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  DEFAULT_USER_SETTINGS,
} from '@/types';
import type {
  UserSettings,
  ThemeMode,
  BoardStyle,
  AnimationSpeed,
  SoundSettings,
  GameOptions,
  AccessibilitySettings,
  NotificationSettings,
  CoordinateDisplay,
  Difficulty,
  TimeControl,
} from '@/types';

interface SettingsStore {
  settings: UserSettings;

  // 테마
  setTheme: (theme: ThemeMode) => void;

  // 보드 스타일
  setBoardStyle: (style: BoardStyle) => void;

  // 애니메이션
  setAnimationSpeed: (speed: AnimationSpeed) => void;

  // 사운드
  updateSoundSettings: (settings: Partial<SoundSettings>) => void;
  toggleSound: () => void;
  setVolume: (volume: number) => void;

  // 게임 옵션
  updateGameOptions: (options: Partial<GameOptions>) => void;
  toggleLegalMoves: () => void;
  toggleLastMove: () => void;
  toggleHints: () => void;
  toggleUndo: () => void;
  setCoordinateDisplay: (display: CoordinateDisplay) => void;

  // 접근성
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  toggleHighContrast: () => void;
  toggleReduceMotion: () => void;

  // 알림
  updateNotifications: (settings: Partial<NotificationSettings>) => void;


  // 게임 기본값
  setDefaultDifficulty: (difficulty: Difficulty) => void;
  setDefaultTimeControl: (timeControl: TimeControl) => void;

  // 자동 저장
  toggleAutoSave: () => void;

  // 전체 설정
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;

  // 내보내기/가져오기
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
}

// 테마 적용 함수
function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        settings: DEFAULT_USER_SETTINGS,

        // 테마
        setTheme: (theme) => {
          set((state) => ({
            settings: {
              ...state.settings,
              theme,
              lastUpdated: Date.now(),
            },
          }));
          applyTheme(theme);
        },

        // 보드 스타일
        setBoardStyle: (boardStyle) => {
          set((state) => ({
            settings: {
              ...state.settings,
              boardStyle,
              lastUpdated: Date.now(),
            },
          }));
        },

        // 애니메이션
        setAnimationSpeed: (animationSpeed) => {
          set((state) => ({
            settings: {
              ...state.settings,
              animationSpeed,
              lastUpdated: Date.now(),
            },
          }));
        },

        // 사운드
        updateSoundSettings: (soundSettings) => {
          set((state) => ({
            settings: {
              ...state.settings,
              sound: {
                ...state.settings.sound,
                ...soundSettings,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        toggleSound: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              sound: {
                ...state.settings.sound,
                enabled: !state.settings.sound.enabled,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        setVolume: (volume) => {
          set((state) => ({
            settings: {
              ...state.settings,
              sound: {
                ...state.settings.sound,
                volume: Math.max(0, Math.min(100, volume)),
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        // 게임 옵션
        updateGameOptions: (gameOptions) => {
          set((state) => ({
            settings: {
              ...state.settings,
              gameOptions: {
                ...state.settings.gameOptions,
                ...gameOptions,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        toggleLegalMoves: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              gameOptions: {
                ...state.settings.gameOptions,
                showLegalMoves: !state.settings.gameOptions.showLegalMoves,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        toggleLastMove: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              gameOptions: {
                ...state.settings.gameOptions,
                showLastMove: !state.settings.gameOptions.showLastMove,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        toggleHints: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              gameOptions: {
                ...state.settings.gameOptions,
                enableHints: !state.settings.gameOptions.enableHints,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        toggleUndo: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              gameOptions: {
                ...state.settings.gameOptions,
                enableUndo: !state.settings.gameOptions.enableUndo,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        setCoordinateDisplay: (showCoordinates) => {
          set((state) => ({
            settings: {
              ...state.settings,
              gameOptions: {
                ...state.settings.gameOptions,
                showCoordinates,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        // 접근성
        updateAccessibility: (accessibility) => {
          set((state) => ({
            settings: {
              ...state.settings,
              accessibility: {
                ...state.settings.accessibility,
                ...accessibility,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        toggleHighContrast: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              accessibility: {
                ...state.settings.accessibility,
                highContrast: !state.settings.accessibility.highContrast,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        toggleReduceMotion: () => {
          set((state) => {
            const reduceMotion =
              !state.settings.accessibility.reduceMotion;
            return {
              settings: {
                ...state.settings,
                accessibility: {
                  ...state.settings.accessibility,
                  reduceMotion,
                },
                animationSpeed: reduceMotion
                  ? 'none'
                  : state.settings.animationSpeed,
                lastUpdated: Date.now(),
              },
            };
          });
        },

        // 알림
        updateNotifications: (notifications) => {
          set((state) => ({
            settings: {
              ...state.settings,
              notifications: {
                ...state.settings.notifications,
                ...notifications,
              },
              lastUpdated: Date.now(),
            },
          }));
        },

        // 게임 기본값
        setDefaultDifficulty: (defaultDifficulty) => {
          set((state) => ({
            settings: {
              ...state.settings,
              defaultDifficulty,
              lastUpdated: Date.now(),
            },
          }));
        },

        setDefaultTimeControl: (defaultTimeControl) => {
          set((state) => ({
            settings: {
              ...state.settings,
              defaultTimeControl,
              lastUpdated: Date.now(),
            },
          }));
        },

        // 자동 저장
        toggleAutoSave: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              autoSave: !state.settings.autoSave,
              lastUpdated: Date.now(),
            },
          }));
        },

        // 전체 설정
        updateSettings: (newSettings) => {
          set((state) => ({
            settings: {
              ...state.settings,
              ...newSettings,
              lastUpdated: Date.now(),
            },
          }));
        },

        resetSettings: () => {
          set({ settings: DEFAULT_USER_SETTINGS });
          applyTheme(DEFAULT_USER_SETTINGS.theme);
        },

        // 내보내기
        exportSettings: () => {
          const settings = get().settings;
          return JSON.stringify(settings, null, 2);
        },

        // 가져오기
        importSettings: (data) => {
          try {
            const parsed = JSON.parse(data);

            if (!parsed.settingsVersion) {
              console.error('Invalid settings format');
              return false;
            }

            const mergedSettings: UserSettings = {
              ...DEFAULT_USER_SETTINGS,
              ...parsed,
              lastUpdated: Date.now(),
            };

            set({ settings: mergedSettings });
            applyTheme(mergedSettings.theme);

            return true;
          } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
          }
        },
      }),
      {
        name: 'solo-chess-settings',
        onRehydrateStorage: () => (state) => {
          if (state) {
            applyTheme(state.settings.theme);
          }
        },
      }
    ),
    { name: 'SettingsStore' }
  )
);

// 시스템 테마 변경 감지
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const settings = useSettingsStore.getState().settings;
      if (settings.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    });
}
