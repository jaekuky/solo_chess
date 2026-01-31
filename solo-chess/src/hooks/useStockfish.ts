// src/hooks/useStockfish.ts

import { useState, useCallback, useEffect, useRef } from 'react';

// Stockfish 상태
interface StockfishState {
  isReady: boolean;
  isCalculating: boolean;
  bestMove: string | null;
  ponderMove: string | null;
  evaluation: {
    type: 'cp' | 'mate';
    value: number;
  } | null;
  depth: number;
  error: string | null;
}

// 분석 정보
interface AnalysisInfo {
  depth?: number;
  score?: { type: string; value: number };
  pv?: string[];
  nodes?: number;
  nps?: number;
  time?: number;
}

// 옵션
interface UseStockfishOptions {
  onBestMove?: (move: string, ponder?: string | null) => void;
  onAnalysis?: (info: AnalysisInfo) => void;
  onError?: (error: string) => void;
}

interface StockfishActions {
  init: () => void;
  quit: () => void;
  setPosition: (fen: string, moves?: string[]) => void;
  getBestMove: (options?: { depth?: number; movetime?: number }) => void;
  stopCalculation: () => void;
  getHint: (fen: string, depth?: number) => Promise<string | null>;
}

export function useStockfish(
  options: UseStockfishOptions = {}
): [StockfishState, StockfishActions] {
  const { onBestMove, onAnalysis, onError } = options;

  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<StockfishState>({
    isReady: false,
    isCalculating: false,
    bestMove: null,
    ponderMove: null,
    evaluation: null,
    depth: 0,
    error: null,
  });
  const resolverRef = useRef<((move: string | null) => void) | null>(null);

  const handleWorkerMessage = useCallback(
    (e: MessageEvent) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'ready':
          break;
        case 'initialized':
          setState((prev) => ({ ...prev, isReady: true, error: null }));
          break;
        case 'bestmove':
          setState((prev) => ({
            ...prev,
            isCalculating: false,
            bestMove: payload.bestMove,
            ponderMove: payload.ponderMove,
          }));
          onBestMove?.(payload.bestMove, payload.ponderMove);
          if (resolverRef.current) {
            resolverRef.current(payload.bestMove);
            resolverRef.current = null;
          }
          break;
        case 'info':
          if (payload.depth) {
            setState((prev) => ({
              ...prev,
              depth: payload.depth,
              evaluation: payload.score
                ? { type: payload.score.type as 'cp' | 'mate', value: payload.score.value }
                : prev.evaluation,
            }));
          }
          onAnalysis?.(payload);
          break;
        case 'error': {
          const errorMsg = payload.message || 'Unknown error';
          setState((prev) => ({
            ...prev,
            error: errorMsg,
            isCalculating: false,
          }));
          onError?.(errorMsg);
          if (resolverRef.current) {
            resolverRef.current(null);
            resolverRef.current = null;
          }
          break;
        }
      }
    },
    [onBestMove, onAnalysis, onError]
  );

  const init = useCallback(() => {
    if (workerRef.current) return;

    try {
      workerRef.current = new Worker(
        new URL('../workers/stockfish.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current.onmessage = handleWorkerMessage;
      workerRef.current.onerror = (e) => {
        const errorMsg = 'Worker error: ' + e.message;
        setState((prev) => ({ ...prev, error: errorMsg }));
        onError?.(errorMsg);
      };
      workerRef.current.postMessage({ type: 'init' });
    } catch (error) {
      const errorMsg = 'Failed to create worker: ' + String(error);
      setState((prev) => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
    }
  }, [handleWorkerMessage, onError]);

  const quit = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'quit' });
      workerRef.current.terminate();
      workerRef.current = null;
      setState({
        isReady: false,
        isCalculating: false,
        bestMove: null,
        ponderMove: null,
        evaluation: null,
        depth: 0,
        error: null,
      });
    }
  }, []);

  const setPosition = useCallback((fen: string, moves?: string[]) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'position', payload: { fen, moves } });
  }, []);

  const getBestMove = useCallback(
    (options?: { depth?: number; movetime?: number }) => {
      if (!workerRef.current || !state.isReady) return;

      setState((prev) => ({
        ...prev,
        isCalculating: true,
        bestMove: null,
        ponderMove: null,
      }));
      workerRef.current.postMessage({ type: 'go', payload: options || {} });
    },
    [state.isReady]
  );

  const stopCalculation = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'stop' });
    setState((prev) => ({ ...prev, isCalculating: false }));
  }, []);

  const getHint = useCallback(
    (fen: string, depth = 10): Promise<string | null> => {
      return new Promise((resolve) => {
        if (!workerRef.current || !state.isReady) {
          resolve(null);
          return;
        }
        resolverRef.current = resolve;
        setPosition(fen);
        setTimeout(() => getBestMove({ depth }), 50);
        setTimeout(() => {
          if (resolverRef.current === resolve) {
            stopCalculation();
            resolve(null);
            resolverRef.current = null;
          }
        }, 5000);
      });
    },
    [state.isReady, setPosition, getBestMove, stopCalculation]
  );

  useEffect(() => {
    return () => {
      quit();
    };
  }, [quit]);

  const actions: StockfishActions = {
    init,
    quit,
    setPosition,
    getBestMove,
    stopCalculation,
    getHint,
  };

  return [state, actions];
}
