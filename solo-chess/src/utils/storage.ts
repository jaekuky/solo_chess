// src/utils/storage.ts

import type { GameState, SavedGame, GameRecord } from '@/types';
import { INITIAL_FEN } from '@/constants';

// Storage Keys
const STORAGE_KEYS = {
  SAVED_GAMES: 'solo-chess-saved-games',
  GAME_RECORDS: 'solo-chess-game-records',
  CURRENT_GAME: 'solo-chess-current-game',
  USER_SETTINGS: 'solo-chess-settings',
  STATISTICS: 'solo-chess-statistics',
} as const;

// LocalStorage 유틸리티
export const storage = {
  // 저장된 게임 목록
  getSavedGames: (): SavedGame[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_GAMES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load saved games:', error);
      return [];
    }
  },

  setSavedGames: (games: SavedGame[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_GAMES, JSON.stringify(games));
    } catch (error) {
      console.error('Failed to save games:', error);
    }
  },

  // 단일 게임 저장
  saveGame: (game: SavedGame): void => {
    const games = storage.getSavedGames();
    const existingIndex = games.findIndex((g) => g.gameId === game.gameId);

    if (existingIndex >= 0) {
      games[existingIndex] = game;
    } else {
      games.unshift(game); // 최신 게임을 앞에 추가
    }

    // 최대 50개 저장
    if (games.length > 50) {
      games.pop();
    }

    storage.setSavedGames(games);
  },

  // 단일 게임 삭제
  deleteSavedGame: (gameId: string): void => {
    const games = storage.getSavedGames();
    const filteredGames = games.filter((g) => g.gameId !== gameId);
    storage.setSavedGames(filteredGames);
  },

  // 게임 기록 (완료된 게임)
  getGameRecords: (): GameRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load game records:', error);
      return [];
    }
  },

  setGameRecords: (records: GameRecord[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('Failed to save game records:', error);
    }
  },

  // 단일 기록 추가
  addGameRecord: (record: GameRecord): void => {
    const records = storage.getGameRecords();
    records.unshift(record);

    // 최대 200개 저장
    if (records.length > 200) {
      records.pop();
    }

    storage.setGameRecords(records);
  },

  // 기록 삭제
  deleteGameRecord: (gameId: string): void => {
    const records = storage.getGameRecords();
    const filteredRecords = records.filter((r) => r.gameId !== gameId);
    storage.setGameRecords(filteredRecords);
  },

  // 현재 진행 중인 게임 (자동 저장용)
  getCurrentGame: (): GameState | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_GAME);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load current game:', error);
      return null;
    }
  },

  setCurrentGame: (game: GameState | null): void => {
    try {
      if (game) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_GAME, JSON.stringify(game));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_GAME);
      }
    } catch (error) {
      console.error('Failed to save current game:', error);
    }
  },

  // 모든 데이터 초기화
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },

  // 저장 공간 사용량 확인
  getStorageUsage: (): { used: number; total: number; percentage: number } => {
    let used = 0;

    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }

    // 대략적인 localStorage 한도 (5MB)
    const total = 5 * 1024 * 1024;

    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  },
};

// 게임 상태를 SavedGame으로 변환
export function gameStateToSavedGame(
  state: GameState,
  name?: string,
): SavedGame {
  return {
    gameId: state.gameId,
    name: name || `게임 ${new Date().toLocaleDateString('ko-KR')}`,
    state,
    savedAt: Date.now(),
    previewFen: state.fen,
  };
}

// 게임 상태를 GameRecord로 변환 (게임 종료 시)
export function gameStateToRecord(state: GameState): GameRecord {
  const duration =
    state.startedAt && state.endedAt
      ? Math.floor((state.endedAt - state.startedAt) / 1000)
      : 0;

  // result가 없는 경우 기본값으로 'draw' 사용
  const result = state.result ?? 'draw';

  return {
    gameId: state.gameId,
    playerColor: state.playerColor,
    difficulty: state.difficulty,
    customDepth: state.customDepth,
    result,
    endReason: state.endReason ?? 'resignation',
    fen: state.fen,
    initialFen: INITIAL_FEN,
    pgn: state.pgn || '',
    moves: state.moveHistory,
    moveCount: state.moveHistory.length,
    duration,
    hintsUsed: state.hintsUsed,
    undosUsed: 0,
    playedAt: state.endedAt || Date.now(),
    timeControl: state.timeControl,
  };
}
