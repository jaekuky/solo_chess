// src/hooks/useTimer.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PieceColor } from '@/types';

interface TimerState {
  whiteTime: number; // 백의 남은 시간 (초)
  blackTime: number; // 흑의 남은 시간 (초)
  activeColor: PieceColor | null; // 현재 시간이 흐르는 색상
  isRunning: boolean;
  isExpired: boolean;
  expiredColor: PieceColor | null; // 시간이 만료된 색상
}

interface TimerActions {
  start: (color: PieceColor) => void;
  pause: () => void;
  resume: () => void;
  switchTurn: (newActiveColor: PieceColor) => void;
  reset: (initialTime: number) => void;
  addTime: (color: PieceColor, seconds: number) => void;
  setTime: (color: PieceColor, seconds: number) => void;
}

interface UseTimerOptions {
  initialTime: number; // 초기 시간 (초)
  onTimeExpired?: (color: PieceColor) => void;
  onTick?: (whiteTime: number, blackTime: number) => void;
  increment?: number; // 매 수마다 추가되는 시간 (초), Fischer 방식
}

export function useTimer(options: UseTimerOptions): [TimerState, TimerActions] {
  const { initialTime, onTimeExpired, onTick, increment = 0 } = options;

  // 상태
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);
  const [activeColor, setActiveColor] = useState<PieceColor | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [expiredColor, setExpiredColor] = useState<PieceColor | null>(null);

  // 인터벌 참조
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 타이머 틱
  useEffect(() => {
    if (isRunning && activeColor && !isExpired) {
      intervalRef.current = setInterval(() => {
        if (activeColor === 'w') {
          setWhiteTime((prev) => {
            const newTime = Math.max(0, prev - 1);

            if (newTime === 0) {
              setIsExpired(true);
              setExpiredColor('w');
              setIsRunning(false);
              onTimeExpired?.('w');
            }

            return newTime;
          });
        } else {
          setBlackTime((prev) => {
            const newTime = Math.max(0, prev - 1);

            if (newTime === 0) {
              setIsExpired(true);
              setExpiredColor('b');
              setIsRunning(false);
              onTimeExpired?.('b');
            }

            return newTime;
          });
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, activeColor, isExpired, onTimeExpired]);

  // onTick 콜백
  useEffect(() => {
    if (isRunning) {
      onTick?.(whiteTime, blackTime);
    }
  }, [whiteTime, blackTime, isRunning, onTick]);

  // 시작
  const start = useCallback((color: PieceColor) => {
    setActiveColor(color);
    setIsRunning(true);
  }, []);

  // 일시정지
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // 재개
  const resume = useCallback(() => {
    if (!isExpired && activeColor) {
      setIsRunning(true);
    }
  }, [isExpired, activeColor]);

  // 턴 전환
  const switchTurn = useCallback(
    (newActiveColor: PieceColor) => {
      // 이전 색상에 increment 추가 (Fischer 방식)
      if (increment > 0 && activeColor) {
        if (activeColor === 'w') {
          setWhiteTime((prev) => prev + increment);
        } else {
          setBlackTime((prev) => prev + increment);
        }
      }

      setActiveColor(newActiveColor);

      if (!isExpired) {
        setIsRunning(true);
      }
    },
    [activeColor, increment, isExpired],
  );

  // 리셋
  const reset = useCallback((newInitialTime: number) => {
    setWhiteTime(newInitialTime);
    setBlackTime(newInitialTime);
    setActiveColor(null);
    setIsRunning(false);
    setIsExpired(false);
    setExpiredColor(null);
  }, []);

  // 시간 추가
  const addTime = useCallback((color: PieceColor, seconds: number) => {
    if (color === 'w') {
      setWhiteTime((prev) => prev + seconds);
    } else {
      setBlackTime((prev) => prev + seconds);
    }
  }, []);

  // 시간 설정
  const setTime = useCallback((color: PieceColor, seconds: number) => {
    if (color === 'w') {
      setWhiteTime(seconds);
    } else {
      setBlackTime(seconds);
    }
  }, []);

  const state: TimerState = {
    whiteTime,
    blackTime,
    activeColor,
    isRunning,
    isExpired,
    expiredColor,
  };

  const actions: TimerActions = {
    start,
    pause,
    resume,
    switchTurn,
    reset,
    addTime,
    setTime,
  };

  return [state, actions];
}
