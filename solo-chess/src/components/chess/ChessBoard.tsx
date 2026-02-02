// src/components/chess/ChessBoard.tsx

import { useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from '@/types';
import type { PieceColor } from '@/types';
import { useSettingsStore } from '@/stores';
import { cn } from '@/utils';
import { BOARD_STYLE_CONFIG, ANIMATION_SPEED_CONFIG } from '@/constants';

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
  const boardStyleConfig =
    BOARD_STYLE_CONFIG[settings.boardStyle] ?? BOARD_STYLE_CONFIG.classic;
  const boardColors = {
    lightSquare: boardStyleConfig.light,
    darkSquare: boardStyleConfig.dark,
  };

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }
    if (settings.gameOptions.showLegalMoves && legalMoves.length > 0) {
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
    if (settings.gameOptions.showLastMove && lastMove) {
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
    settings.gameOptions.showLegalMoves,
    settings.gameOptions.showLastMove,
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

  const animationDuration = useMemo(
    () =>
      ANIMATION_SPEED_CONFIG[settings.animationSpeed]?.duration ?? 200,
    [settings.animationSpeed]
  );

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
          showNotation: settings.gameOptions.showCoordinates !== 'none',
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
