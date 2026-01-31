// src/components/chess/MoveHistory.tsx

import { useRef, useEffect } from 'react';
import type { Move } from '@/types';
import { cn } from '@/utils';

interface MoveHistoryProps {
  moves: Move[];
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
  className?: string;
  maxHeight?: string;
}

export function MoveHistory({
  moves,
  currentMoveIndex,
  onMoveClick,
  className,
  maxHeight = '200px',
}: MoveHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moves.length]);

  type GroupedMove = {
    turnNumber: number;
    white?: Move;
    black?: Move;
    whiteIndex: number;
    blackIndex?: number;
  };

  const groupedMoves: GroupedMove[] = [];
  moves.forEach((move, index) => {
    const turnNumber = Math.floor(index / 2) + 1;
    if (move.color === 'w') {
      groupedMoves.push({ turnNumber, white: move, whiteIndex: index });
    } else {
      const lastTurn = groupedMoves[groupedMoves.length - 1];
      if (lastTurn && lastTurn.turnNumber === turnNumber) {
        lastTurn.black = move;
        lastTurn.blackIndex = index;
      }
    }
  });

  if (moves.length === 0) {
    return (
      <div className={cn('text-gray-400 text-sm p-2', className)}>
        기보가 여기에 표시됩니다
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-y-auto font-mono text-sm', className)}
      style={{ maxHeight }}
    >
      <table className="w-full">
        <tbody>
          {groupedMoves.map(
            ({ turnNumber, white, black, whiteIndex, blackIndex }) => (
              <tr
                key={turnNumber}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="w-8 text-gray-400 text-right pr-2">
                  {turnNumber}.
                </td>
                <td className="w-20 px-1">
                  {white && (
                    <button
                      type="button"
                      onClick={() => onMoveClick?.(whiteIndex)}
                      className={cn(
                        'w-full text-left px-1 py-0.5 rounded',
                        currentMoveIndex === whiteIndex
                          ? 'bg-primary-100 dark:bg-primary-900/50'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      {white.san}
                    </button>
                  )}
                </td>
                <td className="w-20 px-1">
                  {black && blackIndex !== undefined && (
                    <button
                      type="button"
                      onClick={() => onMoveClick?.(blackIndex)}
                      className={cn(
                        'w-full text-left px-1 py-0.5 rounded',
                        currentMoveIndex === blackIndex
                          ? 'bg-primary-100 dark:bg-primary-900/50'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      {black.san}
                    </button>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
