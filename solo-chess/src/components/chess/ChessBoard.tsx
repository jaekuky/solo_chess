// src/components/chess/ChessBoard.tsx

import { useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from '@/types';
import type { PieceColor } from '@/types';
import { useSettingsStore } from '@/stores';
import { cn } from '@/utils';
import type { BoardStyle } from '@/types';

interface ChessBoardProps {
  fen: string;
  onSquareClick?: (square: Square) => void;
  onPieceDrop?: (sourceSquare: Square, targetSquare: Square) => boolean;
  onPieceDragBegin?: (piece: string, sourceSquare: Square) => void;
  selectedSquare?: Square | null;
  legalMoves?: Square[];
  lastMove?: { from: Square; to: Square } | null;
  isCheck?: boolean;
  checkSquare?: Square | null;
  playerColor?: PieceColor;
  boardOrientation?: 'white' | 'black';
  disabled?: boolean;
  boardWidth?: number;
  hintSquares?: { from: Square; to: Square } | null;
  className?: string;
}

const BOARD_STYLES: Record<
  BoardStyle,
  { lightSquare: string; darkSquare: string }
> = {
  classic: { lightSquare: '#f0d9b5', darkSquare: '#b58863' },
  modern: { lightSquare: '#eeeed2', darkSquare: '#769656' },
  wood: { lightSquare: '#e8c99b', darkSquare: '#a17a4d' },
  blue: { lightSquare: '#dee3e6', darkSquare: '#8ca2ad' },
  green: { lightSquare: '#ffffdd', darkSquare: '#86a666' },
};

export function ChessBoard({
  fen,
  onSquareClick,
  onPieceDrop,
  onPieceDragBegin,
  selectedSquare,
  legalMoves = [],
  lastMove,
  isCheck,
  checkSquare,
  playerColor = 'w',
  boardOrientation,
  disabled = false,
  boardWidth = 400,
  hintSquares,
  className,
}: ChessBoardProps) {
  const { settings } = useSettingsStore();
  const orientation =
    boardOrientation ?? (playerColor === 'w' ? 'white' : 'black');
  const boardColors =
    BOARD_STYLES[settings.boardStyle] ?? BOARD_STYLES.classic;

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }
    if (settings.showLegalMoves && legalMoves.length > 0) {
      legalMoves.forEach((square) => {
        styles[square] = {
          ...styles[square],
          background:
            styles[square]?.backgroundColor ??
            'radial-gradient(circle, rgba(0, 0, 0, 0.1) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      });
    }
    if (settings.showLastMove && lastMove) {
      const lastMoveColor = 'rgba(155, 199, 0, 0.41)';
      styles[lastMove.from] = {
        ...styles[lastMove.from],
        backgroundColor: lastMoveColor,
      };
      styles[lastMove.to] = {
        ...styles[lastMove.to],
        backgroundColor: lastMoveColor,
      };
    }
    if (isCheck && checkSquare) {
      styles[checkSquare] = {
        ...styles[checkSquare],
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        boxShadow: 'inset 0 0 10px 5px rgba(255, 0, 0, 0.6)',
      };
    }
    if (hintSquares) {
      const hintColor = 'rgba(59, 130, 246, 0.5)';
      styles[hintSquares.from] = {
        ...styles[hintSquares.from],
        backgroundColor: hintColor,
        boxShadow: 'inset 0 0 10px 3px rgba(59, 130, 246, 0.6)',
      };
      styles[hintSquares.to] = {
        ...styles[hintSquares.to],
        backgroundColor: hintColor,
        boxShadow: 'inset 0 0 10px 3px rgba(59, 130, 246, 0.6)',
      };
    }
    return styles;
  }, [
    selectedSquare,
    legalMoves,
    lastMove,
    isCheck,
    checkSquare,
    hintSquares,
    settings.showLegalMoves,
    settings.showLastMove,
  ]);

  const handleSquareClick = useCallback(
    ({ square }: { piece: unknown; square: string }) => {
      if (disabled) return;
      onSquareClick?.(square as Square);
    },
    [disabled, onSquareClick]
  );

  const handlePieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      piece: unknown;
      sourceSquare: string;
      targetSquare: string | null;
    }): boolean => {
      if (disabled || !targetSquare) return false;
      return onPieceDrop?.(sourceSquare as Square, targetSquare as Square) ?? false;
    },
    [disabled, onPieceDrop]
  );

  const handlePieceDragBegin = useCallback(
    ({
      piece,
      square,
    }: {
      piece: { pieceType: string };
      square: string | null;
    }) => {
      if (disabled || !square) return;
      onPieceDragBegin?.(piece.pieceType, square as Square);
    },
    [disabled, onPieceDragBegin]
  );

  const canDragPiece = useCallback(
    (): boolean => {
      if (disabled) return false;
      return true;
    },
    [disabled]
  );

  const animationDuration = useMemo(() => {
    switch (settings.animationSpeed) {
      case 'none':
        return 0;
      case 'fast':
        return 100;
      case 'normal':
        return 200;
      case 'slow':
        return 300;
      default:
        return 200;
    }
  }, [settings.animationSpeed]);

  return (
    <div className={cn('relative', className)}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          boardStyle: { width: boardWidth, height: boardWidth },
          squareStyles: customSquareStyles,
          lightSquareStyle: { backgroundColor: boardColors.lightSquare },
          darkSquareStyle: { backgroundColor: boardColors.darkSquare },
          showNotation: settings.showCoordinates,
          animationDurationInMs: animationDuration,
          allowDragging: !disabled,
          canDragPiece: canDragPiece,
          onSquareClick: handleSquareClick,
          onPieceDrop: handlePieceDrop,
          onPieceDrag: onPieceDragBegin ? handlePieceDragBegin : undefined,
        }}
      />
    </div>
  );
}
