// src/stores/settingsStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  UserSettings,
  Theme,
  BoardStyle,
  PieceStyle,
  Difficulty,
  TimeControl,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

interface SettingsStore {
  settings: UserSettings;

  // 게임 설정
  setDefaultDifficulty: (difficulty: Difficulty) => void;
  setDefaultTimeControl: (timeControl: TimeControl) => void;
  setAutoSave: (enabled: boolean) => void;
  setShowLegalMoves: (show: boolean) => void;
  setShowLastMove: (show: boolean) => void;
  setEnableHints: (enabled: boolean) => void;
  setConfirmResign: (enabled: boolean) => void;

  // 화면 설정
  setTheme: (theme: Theme) => void;
  setBoardStyle: (style: BoardStyle) => void;
  setPieceStyle: (style: PieceStyle) => void;
  setShowCoordinates: (show: boolean) => void;
  setAnimationSpeed: (speed: 'none' | 'fast' | 'normal' | 'slow') => void;

  // 사운드 설정
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;

  // 전체 초기화
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        settings: DEFAULT_SETTINGS,

        setDefaultDifficulty: (difficulty) =>
          set((state) => ({
            settings: { ...state.settings, defaultDifficulty: difficulty },
          })),

        setDefaultTimeControl: (timeControl) =>
          set((state) => ({
            settings: { ...state.settings, defaultTimeControl: timeControl },
          })),

        setAutoSave: (enabled) =>
          set((state) => ({
            settings: { ...state.settings, autoSave: enabled },
          })),

        setShowLegalMoves: (show) =>
          set((state) => ({
            settings: { ...state.settings, showLegalMoves: show },
          })),

        setShowLastMove: (show) =>
          set((state) => ({
            settings: { ...state.settings, showLastMove: show },
          })),

        setEnableHints: (enabled) =>
          set((state) => ({
            settings: { ...state.settings, enableHints: enabled },
          })),

        setConfirmResign: (enabled) =>
          set((state) => ({
            settings: { ...state.settings, confirmResign: enabled },
          })),

        setTheme: (theme) =>
          set((state) => ({
            settings: { ...state.settings, theme },
          })),

        setBoardStyle: (style) =>
          set((state) => ({
            settings: { ...state.settings, boardStyle: style },
          })),

        setPieceStyle: (style) =>
          set((state) => ({
            settings: { ...state.settings, pieceStyle: style },
          })),

        setShowCoordinates: (show) =>
          set((state) => ({
            settings: { ...state.settings, showCoordinates: show },
          })),

        setAnimationSpeed: (speed) =>
          set((state) => ({
            settings: { ...state.settings, animationSpeed: speed },
          })),

        setSoundEnabled: (enabled) =>
          set((state) => ({
            settings: { ...state.settings, soundEnabled: enabled },
          })),

        setSoundVolume: (volume) =>
          set((state) => ({
            settings: {
              ...state.settings,
              soundVolume: Math.max(0, Math.min(1, volume)),
            },
          })),

        resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      }),
      {
        name: 'solo-chess-settings',
      }
    ),
    { name: 'SettingsStore' }
  )
);
