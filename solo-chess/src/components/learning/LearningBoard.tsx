// src/components/learning/LearningBoard.tsx

import { useState, useMemo, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from '@/types';
import { useSettingsStore } from '@/stores';
import { cn } from '@/utils';
import { BOARD_STYLE_CONFIG, ANIMATION_SPEED_CONFIG } from '@/constants';

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

  const boardStyleConfig =
    BOARD_STYLE_CONFIG[settings.boardStyle] ?? BOARD_STYLE_CONFIG.classic;
  const boardColors = {
    lightSquare: boardStyleConfig.light,
    darkSquare: boardStyleConfig.dark,
  };

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
          showNotation:
            showCoordinates ??
            settings.gameOptions.showCoordinates !== 'none',
          animationDurationInMs: animationDuration,
          allowDragging: false,
          arrows: arrowOptions,
          onSquareClick: handleSquareClick,
        }}
      />
    </div>
  );
}
