// src/hooks/useGameStorage.ts

import { useState, useCallback, useEffect } from 'react';
import type { GameState, SavedGame, GameRecord } from '@/types';
import {
  storage,
  gameStateToSavedGame,
  gameStateToRecord,
} from '@/utils/storage';

interface UseGameStorageReturn {
  // 저장된 게임
  savedGames: SavedGame[];
  loadSavedGames: () => void;
  saveCurrentGame: (state: GameState, name?: string) => void;
  loadGame: (gameId: string) => SavedGame | null;
  deleteSavedGame: (gameId: string) => void;

  // 게임 기록
  gameRecords: GameRecord[];
  loadGameRecords: () => void;
  addGameRecord: (state: GameState) => void;
  deleteGameRecord: (gameId: string) => void;

  // 자동 저장
  autoSave: (state: GameState) => void;
  loadAutoSave: () => GameState | null;
  clearAutoSave: () => void;

  // 유틸리티
  clearAllData: () => void;
  storageUsage: { used: number; total: number; percentage: number };
}

export function useGameStorage(): UseGameStorageReturn {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 0,
    percentage: 0,
  });

  // 저장된 게임 로드
  const loadSavedGames = useCallback(() => {
    const games = storage.getSavedGames();
    setSavedGames(games);
  }, []);

  // 스토리지 사용량 업데이트
  const updateStorageUsage = useCallback(() => {
    const usage = storage.getStorageUsage();
    setStorageUsage(usage);
  }, []);

  // 게임 기록 로드
  const loadGameRecords = useCallback(() => {
    const records = storage.getGameRecords();
    setGameRecords(records);
  }, []);

  // 초기 로드 - 컴포넌트 마운트 시 데이터를 로드하는 의도된 동작
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSavedGames();
    loadGameRecords();
    updateStorageUsage();
  }, [loadSavedGames, loadGameRecords, updateStorageUsage]);

  // 현재 게임 저장
  const saveCurrentGame = useCallback(
    (state: GameState, name?: string) => {
      const savedGame = gameStateToSavedGame(state, name);
      storage.saveGame(savedGame);
      loadSavedGames();
      updateStorageUsage();
    },
    [loadSavedGames, updateStorageUsage],
  );

  // 게임 로드
  const loadGame = useCallback((gameId: string): SavedGame | null => {
    const games = storage.getSavedGames();
    return games.find((g) => g.gameId === gameId) || null;
  }, []);

  // 저장된 게임 삭제
  const deleteSavedGame = useCallback(
    (gameId: string) => {
      storage.deleteSavedGame(gameId);
      loadSavedGames();
      updateStorageUsage();
    },
    [loadSavedGames, updateStorageUsage],
  );

  // 게임 기록 추가
  const addGameRecord = useCallback(
    (state: GameState) => {
      const record = gameStateToRecord(state);
      storage.addGameRecord(record);
      loadGameRecords();
      updateStorageUsage();
    },
    [loadGameRecords, updateStorageUsage],
  );

  // 게임 기록 삭제
  const deleteGameRecord = useCallback(
    (gameId: string) => {
      storage.deleteGameRecord(gameId);
      loadGameRecords();
      updateStorageUsage();
    },
    [loadGameRecords, updateStorageUsage],
  );

  // 자동 저장
  const autoSave = useCallback((state: GameState) => {
    if (state.status === 'playing') {
      storage.setCurrentGame(state);
    }
  }, []);

  // 자동 저장 로드
  const loadAutoSave = useCallback((): GameState | null => {
    return storage.getCurrentGame();
  }, []);

  // 자동 저장 삭제
  const clearAutoSave = useCallback(() => {
    storage.setCurrentGame(null);
  }, []);

  // 모든 데이터 삭제
  const clearAllData = useCallback(() => {
    storage.clearAll();
    setSavedGames([]);
    setGameRecords([]);
    updateStorageUsage();
  }, [updateStorageUsage]);

  return {
    savedGames,
    loadSavedGames,
    saveCurrentGame,
    loadGame,
    deleteSavedGame,
    gameRecords,
    loadGameRecords,
    addGameRecord,
    deleteGameRecord,
    autoSave,
    loadAutoSave,
    clearAutoSave,
    clearAllData,
    storageUsage,
  };
}
