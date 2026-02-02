// src/hooks/useAIGame.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { PieceSymbol } from 'chess.js';
import type { Square } from '@/types';
import { useStockfish } from './useStockfish';
import type {
  Difficulty,
  PieceColor,
  Move,
  GameResult,
  GameEndReason,
} from '@/types';
import {
  AI_DIFFICULTY_SETTINGS,
  createCustomDifficulty,
  getRandomThinkingTime,
  shouldWeakenMove,
  type AIDifficultySettings,
} from '@/utils/aiDifficulty';
import { playMoveSound, playGameEndSound, playSound } from '@/utils/sounds';
import { INITIAL_FEN } from '@/constants';

interface GameEndState {
  fen: string;
  moveHistory: Move[];
  pgn: string;
}

interface UseAIGameOptions {
  difficulty: Difficulty;
  customDepth?: number;
  playerColor: PieceColor;
  initialFen?: string;
  initialMoveHistory?: Move[];
  onGameEnd?: (
    result: GameResult,
    reason: GameEndReason,
    finalState?: GameEndState,
  ) => void;
  onAIMove?: (move: Move) => void;
}

interface AIGameState {
  fen: string;
  turn: PieceColor;
  moveHistory: Move[];
  isAIThinking: boolean;
  aiError: string | null;
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  hintMove: { from: Square; to: Square } | null;
}

interface AIGameActions {
  makePlayerMove: (from: Square, to: Square, promotion?: string) => boolean;
  undoMove: () => boolean;
  resetGame: () => void;
  requestHint: () => Promise<void>;
  clearHint: () => void;
  initAI: () => void;
  stopAI: () => void;
  getLegalMoves: (square: Square) => Square[];
  isValidMove: (from: Square, to: Square) => boolean;
}

export function useAIGame(options: UseAIGameOptions): [AIGameState, AIGameActions] {
  const {
    difficulty,
    customDepth,
    playerColor,
    initialFen = INITIAL_FEN,
    initialMoveHistory = [],
    onGameEnd,
    onAIMove,
  } = options;

  const aiColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
  const difficultySettings: AIDifficultySettings = customDepth
    ? createCustomDifficulty(customDepth)
    : AI_DIFFICULTY_SETTINGS[difficulty];

  const gameRef = useRef(new Chess(initialFen));
  /* eslint-disable react-hooks/refs */
  // 렌더링 중 게임 상태 읽기 - 의도된 패턴 (Chess 인스턴스를 ref로 관리)
  const [fen, setFen] = useState(gameRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<Move[]>(initialMoveHistory);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hintMove, setHintMove] = useState<{ from: Square; to: Square } | null>(null);

  const game = gameRef.current;
  const turn = game.turn() as PieceColor;
  const isGameOver = game.isGameOver();
  const isCheck = game.isCheck();
  const isCheckmate = game.isCheckmate();
  const isStalemate = game.isStalemate();
  const isDraw = game.isDraw();
  /* eslint-enable react-hooks/refs */

  const handleGameEnd = useCallback(() => {
    const g = gameRef.current;
    let result: GameResult = 'draw';
    let reason: GameEndReason = 'draw_agreement';

    if (g.isCheckmate()) {
      result = g.turn() === playerColor ? 'lose' : 'win';
      reason = 'checkmate';
    } else if (g.isStalemate()) {
      result = 'draw';
      reason = 'stalemate';
    } else if (g.isDraw()) {
      result = 'draw';
      if (g.isThreefoldRepetition()) reason = 'threefold_repetition';
      else if (g.isInsufficientMaterial()) reason = 'insufficient_material';
      else reason = 'fifty_move_rule';
    }

    const history = g.history({ verbose: true });
    const moveHistory: Move[] = history.map((m) => ({
      from: m.from as Square,
      to: m.to as Square,
      piece: m.piece as Move['piece'],
      color: m.color as PieceColor,
      captured: m.captured as Move['captured'],
      promotion: m.promotion as Move['promotion'],
      flags: m.flags,
      san: m.san,
      lan: m.lan ?? `${m.from}${m.to}`,
    }));

    const finalState: GameEndState = {
      fen: g.fen(),
      moveHistory,
      pgn: moveHistory.map((m) => m.san).join(' '),
    };

    // 게임 종료 사운드 재생
    playGameEndSound(result);

    onGameEnd?.(result, reason, finalState);
  }, [playerColor, onGameEnd]);

  const handleAIMove = useCallback(
    (bestMove: string) => {
      const g = gameRef.current;
      const from = bestMove.slice(0, 2) as Square;
      const to = bestMove.slice(2, 4) as Square;
      const promotion = bestMove.length > 4 ? (bestMove[4] as PieceSymbol) : undefined;

      try {
        const moveResult = g.move({
          from,
          to,
          promotion,
        });

        if (moveResult) {
          setFen(g.fen());
          const move: Move = {
            from: moveResult.from as Square,
            to: moveResult.to as Square,
            piece: moveResult.piece as Move['piece'],
            color: moveResult.color as PieceColor,
            captured: moveResult.captured as Move['captured'],
            promotion: moveResult.promotion as Move['promotion'],
            flags: moveResult.flags,
            san: moveResult.san,
            lan: moveResult.lan,
          };

          // AI 이동 사운드 재생
          playMoveSound(move);

          setMoveHistory((prev) => [...prev, move]);
          onAIMove?.(move);
          if (g.isGameOver()) handleGameEnd();
        }
      } catch {
        setAiError('AI 이동 오류');
      }
      setIsAIThinking(false);
    },
    [onAIMove, handleGameEnd]
  );

  const selectWeakenedMove = useCallback(
    (type: 'mistake' | 'blunder' | 'random', bestMove: string) => {
      const g = gameRef.current;
      const legalMoves = g.moves({ verbose: true });
      if (legalMoves.length === 0) return;

      if (type === 'random') {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        handleAIMove(
          randomMove.from + randomMove.to + (randomMove.promotion || '')
        );
        return;
      }

      const otherMoves = legalMoves.filter(
        (m) => m.from + m.to !== bestMove.slice(0, 4)
      );
      if (otherMoves.length === 0) {
        handleAIMove(bestMove);
        return;
      }

      if (type === 'mistake') {
        const halfIndex = Math.floor(otherMoves.length / 2);
        const selectedMove =
          otherMoves[Math.floor(Math.random() * halfIndex)];
        handleAIMove(
          selectedMove.from + selectedMove.to + (selectedMove.promotion || '')
        );
      } else {
        const halfIndex = Math.floor(otherMoves.length / 2);
        const selectedMove =
          otherMoves[
            halfIndex +
              Math.floor(Math.random() * (otherMoves.length - halfIndex))
          ];
        handleAIMove(
          selectedMove.from + selectedMove.to + (selectedMove.promotion || '')
        );
      }
    },
    [handleAIMove]
  );

  const [stockfishState, stockfishActions] = useStockfish({
    onBestMove: (move) => {
      const weakenType = shouldWeakenMove(difficultySettings);
      if (weakenType === 'best') {
        handleAIMove(move);
      } else {
        selectWeakenedMove(weakenType, move);
      }
    },
    onError: (error) => {
      setAiError(error);
      setIsAIThinking(false);
    },
  });

  const startAITurn = useCallback(() => {
    if (!stockfishState.isReady || isAIThinking || isGameOver) return;
    const g = gameRef.current;
    if (g.turn() !== aiColor) return;

    setIsAIThinking(true);
    setAiError(null);
    const thinkingTime = getRandomThinkingTime(difficultySettings);

    setTimeout(() => {
      stockfishActions.setPosition(g.fen());
      setTimeout(() => {
        stockfishActions.getBestMove({
          depth: difficultySettings.depth,
          movetime: difficultySettings.movetime,
        });
      }, 50);
    }, thinkingTime);
  }, [
    stockfishState.isReady,
    isAIThinking,
    isGameOver,
    aiColor,
    difficultySettings,
    stockfishActions,
  ]);

  const makePlayerMove = useCallback(
    (from: Square, to: Square, promotion?: string): boolean => {
      const g = gameRef.current;
      if (g.turn() !== playerColor) return false;

      try {
        const moveResult = g.move({
          from,
          to,
          promotion: promotion as PieceSymbol | undefined,
        });
        if (moveResult) {
          setFen(g.fen());
          setHintMove(null);
          const move: Move = {
            from: moveResult.from as Square,
            to: moveResult.to as Square,
            piece: moveResult.piece as Move['piece'],
            color: moveResult.color as PieceColor,
            captured: moveResult.captured as Move['captured'],
            promotion: moveResult.promotion as Move['promotion'],
            flags: moveResult.flags,
            san: moveResult.san,
            lan: moveResult.lan,
          };

          // 플레이어 이동 사운드 재생
          playMoveSound(move);

          setMoveHistory((prev) => [...prev, move]);
          if (g.isGameOver()) {
            handleGameEnd();
          } else {
            setTimeout(() => startAITurn(), 100);
          }
          return true;
        }
      } catch {
        // 잘못된 이동 사운드 재생
        playSound('illegal');
      }
      return false;
    },
    [playerColor, handleGameEnd, startAITurn]
  );

  const undoMove = useCallback((): boolean => {
    const g = gameRef.current;
    if (isAIThinking) {
      stockfishActions.stopCalculation();
      setIsAIThinking(false);
    }
    if (g.turn() === aiColor) g.undo();
    const undone = g.undo();
    if (undone) {
      setFen(g.fen());
      setMoveHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].color === aiColor) {
          newHistory.pop();
        }
        if (newHistory.length > 0) newHistory.pop();
        return newHistory;
      });
      setHintMove(null);
      return true;
    }
    return false;
  }, [aiColor, isAIThinking, stockfishActions]);

  const resetGame = useCallback(() => {
    if (isAIThinking) {
      stockfishActions.stopCalculation();
      setIsAIThinking(false);
    }
    gameRef.current = new Chess(initialFen);
    setFen(gameRef.current.fen());
    setMoveHistory([]);
    setHintMove(null);
    setAiError(null);
  }, [initialFen, isAIThinking, stockfishActions]);

  const requestHint = useCallback(async () => {
    if (!stockfishState.isReady || isAIThinking) return;
    const g = gameRef.current;
    if (g.turn() !== playerColor || g.isGameOver()) return;
    const hintMoveStr = await stockfishActions.getHint(g.fen(), 10);
    if (hintMoveStr) {
      const from = hintMoveStr.slice(0, 2) as Square;
      const to = hintMoveStr.slice(2, 4) as Square;
      setHintMove({ from, to });
    }
  }, [stockfishState.isReady, isAIThinking, playerColor, stockfishActions]);

  const clearHint = useCallback(() => setHintMove(null), []);

  const initAI = useCallback(() => stockfishActions.init(), [stockfishActions]);
  const stopAI = useCallback(() => {
    if (isAIThinking) stockfishActions.stopCalculation();
    stockfishActions.quit();
  }, [isAIThinking, stockfishActions]);

  const getLegalMoves = useCallback((square: Square): Square[] => {
    const g = gameRef.current;
    const moves = g.moves({ square, verbose: true });
    return moves.map((m) => m.to as Square);
  }, []);

  const isValidMove = useCallback((from: Square, to: Square): boolean => {
    const g = gameRef.current;
    const moves = g.moves({ square: from, verbose: true });
    return moves.some((m) => m.to === to);
  }, []);

  useEffect(() => {
    if (
      stockfishState.isReady &&
      turn === aiColor &&
      !isAIThinking &&
      !isGameOver
    ) {
      startAITurn();
    }
  }, [
    stockfishState.isReady,
    turn,
    aiColor,
    isAIThinking,
    isGameOver,
    startAITurn,
  ]);

  const state: AIGameState = {
    fen,
    turn,
    moveHistory,
    isAIThinking,
    aiError,
    isGameOver,
    isCheck,
    isCheckmate,
    isStalemate,
    isDraw,
    hintMove,
  };

  const actions: AIGameActions = {
    makePlayerMove,
    undoMove,
    resetGame,
    requestHint,
    clearHint,
    initAI,
    stopAI,
    getLegalMoves,
    isValidMove,
  };

  return [state, actions];
}
