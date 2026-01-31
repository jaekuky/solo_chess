// src/hooks/useReplay.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { GameRecord, Move, Square } from '@/types';
import { INITIAL_FEN } from '@/constants';

interface UseReplayOptions {
  gameRecord: GameRecord;
  autoStart?: boolean;
}

interface UseReplayReturn {
  // 상태
  currentMoveIndex: number;
  fen: string;
  currentMove: Move | null;
  isPlaying: boolean;
  playbackSpeed: 'slow' | 'normal' | 'fast';

  // 네비게이션
  goToStart: () => void;
  goToEnd: () => void;
  goToMove: (index: number) => void;
  nextMove: () => boolean;
  prevMove: () => boolean;

  // 재생 제어
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: 'slow' | 'normal' | 'fast') => void;

  // 분석
  getMoveAtIndex: (index: number) => Move | null;
  getTotalMoves: () => number;

  // 하이라이트
  lastMoveSquares: { from: Square; to: Square } | null;
}

const SPEED_MS = {
  slow: 2000,
  normal: 1000,
  fast: 500,
};

export function useReplay(options: UseReplayOptions): UseReplayReturn {
  const { gameRecord, autoStart = false } = options;

  // 상태
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1은 시작 포지션
  const [fen, setFen] = useState(
    gameRecord.initialFen || INITIAL_FEN,
  );
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [playbackSpeed, setPlaybackSpeed] = useState<
    'slow' | 'normal' | 'fast'
  >('normal');

  // 타이머 참조
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chess 인스턴스로 FEN 계산
  const calculateFen = useCallback(
    (moveIndex: number): string => {
      const game = new Chess(gameRecord.initialFen || INITIAL_FEN);

      for (let i = 0; i <= moveIndex && i < gameRecord.moves.length; i++) {
        const move = gameRecord.moves[i];
        try {
          game.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
        } catch {
          console.error('Invalid move in replay:', move);
          break;
        }
      }

      return game.fen();
    },
    [gameRecord],
  );

  // 현재 수
  const currentMove =
    currentMoveIndex >= 0 && currentMoveIndex < gameRecord.moves.length
      ? gameRecord.moves[currentMoveIndex]
      : null;

  // 마지막 수 하이라이트
  const lastMoveSquares = currentMove
    ? { from: currentMove.from, to: currentMove.to }
    : null;

  // 시작으로
  const goToStart = useCallback(() => {
    setCurrentMoveIndex(-1);
    setFen(gameRecord.initialFen || INITIAL_FEN);
    setIsPlaying(false);
  }, [gameRecord.initialFen]);

  // 끝으로
  const goToEnd = useCallback(() => {
    const lastIndex = gameRecord.moves.length - 1;
    setCurrentMoveIndex(lastIndex);
    setFen(calculateFen(lastIndex));
    setIsPlaying(false);
  }, [gameRecord.moves.length, calculateFen]);

  // 특정 수로 이동
  const goToMove = useCallback(
    (index: number) => {
      const validIndex = Math.max(
        -1,
        Math.min(index, gameRecord.moves.length - 1),
      );
      setCurrentMoveIndex(validIndex);
      setFen(calculateFen(validIndex));
    },
    [gameRecord.moves.length, calculateFen],
  );

  // 다음 수
  const nextMove = useCallback(() => {
    if (currentMoveIndex < gameRecord.moves.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      setFen(calculateFen(newIndex));
      return true;
    }
    return false;
  }, [currentMoveIndex, gameRecord.moves.length, calculateFen]);

  // 이전 수
  const prevMove = useCallback(() => {
    if (currentMoveIndex >= 0) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      setFen(calculateFen(newIndex));
      return true;
    }
    return false;
  }, [currentMoveIndex, calculateFen]);

  // 재생
  const play = useCallback(() => {
    if (currentMoveIndex >= gameRecord.moves.length - 1) {
      // 끝에 있으면 처음부터
      goToStart();
    }
    setIsPlaying(true);
  }, [currentMoveIndex, gameRecord.moves.length, goToStart]);

  // 일시정지
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // 토글
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // 속도 설정
  const setSpeed = useCallback((speed: 'slow' | 'normal' | 'fast') => {
    setPlaybackSpeed(speed);
  }, []);

  // 자동 재생 처리
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentMoveIndex((prev) => {
          const newIndex = prev + 1;
          if (newIndex >= gameRecord.moves.length) {
            setIsPlaying(false);
            return prev;
          }
          setFen(calculateFen(newIndex));
          return newIndex;
        });
      }, SPEED_MS[playbackSpeed]);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isPlaying,
    playbackSpeed,
    gameRecord.moves.length,
    calculateFen,
  ]);

  // 특정 인덱스의 수 가져오기
  const getMoveAtIndex = useCallback(
    (index: number): Move | null => {
      if (index >= 0 && index < gameRecord.moves.length) {
        return gameRecord.moves[index];
      }
      return null;
    },
    [gameRecord.moves],
  );

  // 총 수
  const getTotalMoves = useCallback(() => {
    return gameRecord.moves.length;
  }, [gameRecord.moves.length]);

  return {
    currentMoveIndex,
    fen,
    currentMove,
    isPlaying,
    playbackSpeed,
    goToStart,
    goToEnd,
    goToMove,
    nextMove,
    prevMove,
    play,
    pause,
    togglePlay,
    setSpeed,
    getMoveAtIndex,
    getTotalMoves,
    lastMoveSquares,
  };
}
