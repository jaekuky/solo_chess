// src/components/learning/LearningBoard.tsx

import { useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from '@/types';
import { useSettingsStore } from '@/stores';
import { cn } from '@/utils';
import type { BoardStyle } from '@/types';

interface LearningBoardProps {
  fen: string;
  highlightSquares?: Square[];
  arrows?: { from: Square; to: Square; color?: string }[];
  onSquareClick?: (square: Square) => void;
  boardWidth?: number;
  orientation?: 'white' | 'black';
  interactive?: boolean;
  showCoordinates?: boolean;
  className?: string;
}

// 보드 스타일
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

export function LearningBoard({
  fen,
  highlightSquares = [],
  arrows = [],
  onSquareClick,
  boardWidth = 400,
  orientation = 'white',
  interactive = false,
  showCoordinates = true,
  className,
}: LearningBoardProps) {
  const { settings } = useSettingsStore();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const boardColors =
    BOARD_STYLES[settings.boardStyle] ?? BOARD_STYLES.classic;

  // 커스텀 칸 스타일
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 하이라이트 칸
    highlightSquares.forEach((square) => {
      styles[square] = {
        backgroundColor: 'rgba(255, 255, 0, 0.5)',
        boxShadow: 'inset 0 0 0 3px rgba(255, 200, 0, 0.8)',
      };
    });

    // 선택된 칸
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: 'rgba(0, 255, 0, 0.4)',
      };
    }

    return styles;
  }, [highlightSquares, selectedSquare]);

  // 화살표 (react-chessboard 형식으로 변환)
  const arrowOptions = useMemo(() => {
    return arrows.map((arrow) => ({
      startSquare: arrow.from,
      endSquare: arrow.to,
      color: arrow.color ?? 'rgba(0, 128, 255, 0.8)',
    }));
  }, [arrows]);

  // 칸 클릭 핸들러
  const handleSquareClick = useCallback(
    ({ square }: { piece: unknown; square: string }) => {
      if (!interactive) return;
      setSelectedSquare(square as Square);
      onSquareClick?.(square as Square);
    },
    [interactive, onSquareClick],
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
          showNotation: showCoordinates ?? settings.showCoordinates,
          animationDurationInMs: animationDuration,
          allowDragging: false,
          arrows: arrowOptions,
          onSquareClick: handleSquareClick,
        }}
      />
    </div>
  );
}
