// src/hooks/useGameHistory.ts

import { useState, useCallback, useMemo } from 'react';
import { type GameRecord, type StatsFilter } from '@/types';
import { storage } from '@/utils/storage';

interface UseGameHistoryReturn {
  // 게임 기록
  gameRecords: GameRecord[];
  filteredRecords: GameRecord[];

  // 필터
  filter: StatsFilter;
  setFilter: (filter: Partial<StatsFilter>) => void;
  resetFilter: () => void;

  // CRUD
  loadRecords: () => void;
  getRecord: (gameId: string) => GameRecord | null;
  deleteRecord: (gameId: string) => void;
  clearAllRecords: () => void;

  // 통계
  getFilteredStats: () => {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
}

const DEFAULT_FILTER: StatsFilter = {
  period: 'all',
  difficulty: 'all',
  color: 'all',
};

export function useGameHistory(): UseGameHistoryReturn {
  // 초기 로드를 useState 초기화 함수에서 수행
  const [gameRecords, setGameRecords] = useState<GameRecord[]>(() =>
    storage.getGameRecords(),
  );
  const [filter, setFilterState] = useState<StatsFilter>(DEFAULT_FILTER);

  // 기록 로드 (수동 새로고침용)
  const loadRecords = useCallback(() => {
    const records = storage.getGameRecords();
    setGameRecords(records);
  }, []);

  // 필터와 함께 타임스탬프도 관리
  const [filterTimestamp, setFilterTimestamp] = useState(() => Date.now());

  // 필터 적용된 기록
  const filteredRecords = useMemo(() => {
    let records = [...gameRecords];

    // 기간 필터
    if (filter.period !== 'all') {
      if (filter.period === 'custom' && filter.customDateRange) {
        const startTimestamp = new Date(
          filter.customDateRange.startDate + 'T00:00:00',
        ).getTime();
        const endTimestamp = new Date(
          filter.customDateRange.endDate + 'T23:59:59.999',
        ).getTime();
        records = records.filter(
          (r) => r.playedAt >= startTimestamp && r.playedAt <= endTimestamp,
        );
      } else if (filter.period !== 'custom') {
        const now = filterTimestamp;
        let cutoff: number;

        switch (filter.period) {
          case 'today':
            cutoff = new Date(now).setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoff = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            cutoff = now - 30 * 24 * 60 * 60 * 1000;
            break;
          case 'year':
            cutoff = now - 365 * 24 * 60 * 60 * 1000;
            break;
          default:
            cutoff = 0;
        }

        records = records.filter((r) => r.playedAt >= cutoff);
      }
    }

    // 난이도 필터
    if (filter.difficulty !== 'all') {
      records = records.filter((r) => r.difficulty === filter.difficulty);
    }

    // 색상 필터
    if (filter.color !== 'all') {
      records = records.filter((r) => r.playerColor === filter.color);
    }

    // 최신순 정렬
    return records.sort((a, b) => b.playedAt - a.playedAt);
  }, [gameRecords, filter, filterTimestamp]);

  // 필터 설정 (타임스탬프도 함께 갱신)
  const setFilter = useCallback((newFilter: Partial<StatsFilter>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }));
    // 기간 필터가 변경될 때 타임스탬프 갱신
    if (newFilter.period !== undefined && newFilter.period !== 'all') {
      setFilterTimestamp(Date.now());
    }
  }, []);

  // 필터 초기화
  const resetFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  // 단일 기록 조회
  const getRecord = useCallback(
    (gameId: string): GameRecord | null => {
      return gameRecords.find((r) => r.gameId === gameId) || null;
    },
    [gameRecords],
  );

  // 기록 삭제
  const deleteRecord = useCallback(
    (gameId: string) => {
      storage.deleteGameRecord(gameId);
      loadRecords();
    },
    [loadRecords],
  );

  // 전체 삭제
  const clearAllRecords = useCallback(() => {
    storage.setGameRecords([]);
    setGameRecords([]);
  }, []);

  // 필터된 통계
  const getFilteredStats = useCallback(() => {
    const total = filteredRecords.length;
    const wins = filteredRecords.filter((r) => r.result === 'win').length;
    const losses = filteredRecords.filter((r) => r.result === 'lose').length;
    const draws = filteredRecords.filter((r) => r.result === 'draw').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return { total, wins, losses, draws, winRate };
  }, [filteredRecords]);

  return {
    gameRecords,
    filteredRecords,
    filter,
    setFilter,
    resetFilter,
    loadRecords,
    getRecord,
    deleteRecord,
    clearAllRecords,
    getFilteredStats,
  };
}
