// src/hooks/useChessGame.ts

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Move as ChessMove, PieceSymbol } from 'chess.js';
import type {
  Move,
  PieceColor,
  CapturedPieces,
  PieceType,
  Square,
} from '@/types';
import { INITIAL_FEN } from '@/constants';

interface UseChessGameOptions {
  initialFen?: string;
  playerColor?: PieceColor;
  onMove?: (move: Move) => void;
  onGameEnd?: (result: {
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
    winner: PieceColor | null;
  }) => void;
}

interface ChessGameState {
  game: Chess;
  fen: string;
  turn: PieceColor;
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  moveHistory: Move[];
  capturedPieces: CapturedPieces;
  pendingPromotion: { from: Square; to: Square } | null;
}

interface ChessGameActions {
  selectSquare: (square: Square) => void;
  clearSelection: () => void;
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  confirmPromotion: (piece: PieceSymbol) => void;
  cancelPromotion: () => void;
  undoMove: () => boolean;
  undoMoves: (count: number) => boolean;
  resetGame: (fen?: string) => void;
  loadGame: (pgn: string) => boolean;
  getLegalMovesForSquare: (square: Square) => Square[];
  isValidMove: (from: Square, to: Square) => boolean;
  getPieceAt: (
    square: Square
  ) => { type: PieceType; color: PieceColor } | null;
}

export function useChessGame(
  options: UseChessGameOptions = {}
): [ChessGameState, ChessGameActions] {
  const {
    initialFen = INITIAL_FEN,
    onMove,
    onGameEnd,
  } = options;

  const [game] = useState(() => new Chess(initialFen));
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const gameStatus = useMemo(
    () => ({
      turn: game.turn() as PieceColor,
      isCheck: game.isCheck(),
      isCheckmate: game.isCheckmate(),
      isStalemate: game.isStalemate(),
      isDraw: game.isDraw(),
      isGameOver: game.isGameOver(),
    }),
    [fen]
  );

  const capturedPieces = useMemo((): CapturedPieces => {
    const captured: CapturedPieces = { white: [], black: [] };
    moveHistory.forEach((move) => {
      if (move.captured) {
        if (move.color === 'w') {
          captured.white.push(move.captured as PieceType);
        } else {
          captured.black.push(move.captured as PieceType);
        }
      }
    });
    return captured;
  }, [moveHistory]);

  useEffect(() => {
    if (gameStatus.isGameOver && onGameEnd) {
      let winner: PieceColor | null = null;
      if (gameStatus.isCheckmate) {
        winner = gameStatus.turn === 'w' ? 'b' : 'w';
      }
      onGameEnd({
        isCheckmate: gameStatus.isCheckmate,
        isStalemate: gameStatus.isStalemate,
        isDraw: gameStatus.isDraw,
        winner,
      });
    }
  }, [
    gameStatus.isGameOver,
    gameStatus.isCheckmate,
    gameStatus.isStalemate,
    gameStatus.isDraw,
    gameStatus.turn,
    onGameEnd,
  ]);

  const getLegalMovesForSquare = useCallback(
    (square: Square): Square[] => {
      const moves = game.moves({ square, verbose: true });
      return moves.map((m) => m.to as Square);
    },
    [game]
  );

  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      try {
        const moveResult = game.move({
          from,
          to,
          promotion: promotion ?? 'q',
        });
        if (moveResult) {
          setFen(game.fen());
          setLastMove({ from, to });
          setSelectedSquare(null);
          setLegalMoves([]);
          setPendingPromotion(null);
          const move: Move = {
            from: moveResult.from as Square,
            to: moveResult.to as Square,
            piece: moveResult.piece as PieceType,
            color: moveResult.color as PieceColor,
            captured: moveResult.captured as PieceType | undefined,
            promotion: moveResult.promotion as PieceType | undefined,
            flags: moveResult.flags,
            san: moveResult.san,
            lan: moveResult.lan,
          };
          setMoveHistory((prev) => [...prev, move]);
          onMove?.(move);
          return true;
        }
      } catch {
        // invalid move
      }
      return false;
    },
    [game, onMove]
  );

  const selectSquare = useCallback(
    (square: Square) => {
      const piece = game.get(square);
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      if (selectedSquare && legalMoves.includes(square)) {
        const selectedPiece = game.get(selectedSquare);
        const isPromotion =
          selectedPiece?.type === 'p' &&
          ((selectedPiece.color === 'w' && square[1] === '8') ||
            (selectedPiece.color === 'b' && square[1] === '1'));
        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
        } else {
          makeMove(selectedSquare, square);
        }
        return;
      }
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(square));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [
      selectedSquare,
      legalMoves,
      game,
      getLegalMovesForSquare,
      makeMove,
    ]
  );

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const confirmPromotion = useCallback(
    (piece: PieceSymbol) => {
      if (pendingPromotion) {
        makeMove(pendingPromotion.from, pendingPromotion.to, piece);
      }
    },
    [pendingPromotion, makeMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const undoMove = useCallback((): boolean => {
    const move = game.undo();
    if (move) {
      setFen(game.fen());
      setMoveHistory((prev) => prev.slice(0, -1));
      setLastMove(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      return true;
    }
    return false;
  }, [game]);

  const undoMoves = useCallback(
    (count: number): boolean => {
      let undone = 0;
      for (let i = 0; i < count; i++) {
        if (game.undo()) undone++;
        else break;
      }
      if (undone > 0) {
        setFen(game.fen());
        setMoveHistory((prev) => prev.slice(0, -undone));
        setLastMove(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        return true;
      }
      return false;
    },
    [game]
  );

  const resetGame = useCallback(
    (newFen?: string) => {
      game.load(newFen ?? INITIAL_FEN);
      setFen(game.fen());
      setSelectedSquare(null);
      setLegalMoves([]);
      setLastMove(null);
      setMoveHistory([]);
      setPendingPromotion(null);
    },
    [game]
  );

  const loadGame = useCallback(
    (pgn: string): boolean => {
      try {
        game.loadPgn(pgn);
        setFen(game.fen());
        setSelectedSquare(null);
        setLegalMoves([]);
        setLastMove(null);
        const history = game.history({ verbose: true });
        setMoveHistory(
          history.map((m: ChessMove) => ({
            from: m.from as Square,
            to: m.to as Square,
            piece: m.piece as PieceType,
            color: m.color as PieceColor,
            captured: m.captured as PieceType | undefined,
            promotion: m.promotion as PieceType | undefined,
            flags: m.flags,
            san: m.san,
            lan: m.lan,
          }))
        );
        return true;
      } catch {
        return false;
      }
    },
    [game]
  );

  const isValidMove = useCallback(
    (from: Square, to: Square): boolean => {
      const moves = game.moves({ square: from, verbose: true });
      return moves.some((m) => m.to === to);
    },
    [game]
  );

  const getPieceAt = useCallback(
    (
      square: Square
    ): { type: PieceType; color: PieceColor } | null => {
      const piece = game.get(square);
      if (piece) {
        return {
          type: piece.type as PieceType,
          color: piece.color as PieceColor,
        };
      }
      return null;
    },
    [game]
  );

  const state: ChessGameState = {
    game,
    fen,
    turn: gameStatus.turn,
    selectedSquare,
    legalMoves,
    lastMove,
    isCheck: gameStatus.isCheck,
    isCheckmate: gameStatus.isCheckmate,
    isStalemate: gameStatus.isStalemate,
    isDraw: gameStatus.isDraw,
    isGameOver: gameStatus.isGameOver,
    moveHistory,
    capturedPieces,
    pendingPromotion,
  };

  const actions: ChessGameActions = {
    selectSquare,
    clearSelection,
    makeMove,
    confirmPromotion,
    cancelPromotion,
    undoMove,
    undoMoves,
    resetGame,
    loadGame,
    getLegalMovesForSquare,
    isValidMove,
    getPieceAt,
  };

  return [state, actions];
}
