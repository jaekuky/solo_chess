// src/components/chess/MoveHistoryPanel.tsx

import { useRef, useEffect, useState } from 'react';
import type { Move } from '@/types';
import { Button } from '@/components/common';
import { cn } from '@/utils';

interface MoveHistoryPanelProps {
  moves: Move[];
  currentMoveIndex?: number;
  onMoveSelect?: (index: number) => void;
  onNavigate?: (direction: 'first' | 'prev' | 'next' | 'last') => void;
  isReplayMode?: boolean;
  className?: string;
}

export function MoveHistoryPanel({
  moves,
  currentMoveIndex,
  onMoveSelect,
  onNavigate,
  isReplayMode = false,
  className,
}: MoveHistoryPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 새 수 추가 시 자동 스크롤
  useEffect(() => {
    if (containerRef.current && !isReplayMode) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moves.length, isReplayMode]);

  // 복기 모드에서 현재 수로 스크롤
  useEffect(() => {
    if (
      containerRef.current &&
      isReplayMode &&
      currentMoveIndex !== undefined
    ) {
      const selectedElement = containerRef.current.querySelector(
        `[data-index="${currentMoveIndex}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentMoveIndex, isReplayMode]);

  // 수를 턴 단위로 그룹화
  const groupedMoves: {
    turnNumber: number;
    white?: Move;
    black?: Move;
    whiteIndex: number;
    blackIndex?: number;
  }[] = [];

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

  // PGN 문자열 생성
  const pgnString = moves
    .map((move, index) => {
      const turnNumber = Math.floor(index / 2) + 1;
      if (index % 2 === 0) {
        return `${turnNumber}. ${move.san}`;
      }
      return move.san;
    })
    .join(' ');

  // PGN 복사
  const copyPgn = () => {
    navigator.clipboard.writeText(pgnString);
    // TODO: 토스트 알림 추가
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm',
        className,
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
        <h3 className="font-semibold flex items-center gap-2">
          📋 기보
          <span className="text-sm font-normal text-gray-500">
            ({moves.length}수)
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyPgn}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="PGN 복사"
          >
            📋
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* 네비게이션 버튼 (복기 모드) */}
      {isReplayMode && onNavigate && (
        <div className="flex items-center justify-center gap-1 px-4 py-2 border-b dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('first')}
            disabled={currentMoveIndex === -1}
            title="처음으로"
          >
            ⏮️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('prev')}
            disabled={currentMoveIndex === -1}
            title="이전"
          >
            ◀️
          </Button>
          <span className="px-3 text-sm text-gray-500">
            {(currentMoveIndex ?? -1) === -1
              ? '시작'
              : `${(currentMoveIndex ?? -1) + 1}/${moves.length}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('next')}
            disabled={currentMoveIndex === moves.length - 1}
            title="다음"
          >
            ▶️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('last')}
            disabled={currentMoveIndex === moves.length - 1}
            title="마지막으로"
          >
            ⏭️
          </Button>
        </div>
      )}

      {/* 기보 목록 */}
      <div
        ref={containerRef}
        className={cn(
          'overflow-y-auto font-mono text-sm',
          isExpanded ? 'max-h-96' : 'max-h-48',
        )}
      >
        {moves.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            기보가 여기에 표시됩니다
          </div>
        ) : (
          <table className="w-full">
            <tbody>
              {groupedMoves.map(
                ({
                  turnNumber,
                  white,
                  black,
                  whiteIndex,
                  blackIndex,
                }) => (
                  <tr
                    key={turnNumber}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="w-10 text-gray-400 text-right pr-2 py-1">
                      {turnNumber}.
                    </td>
                    <td className="w-20 px-1 py-1">
                      {white && (
                        <button
                          type="button"
                          data-index={whiteIndex}
                          onClick={() => onMoveSelect?.(whiteIndex)}
                          className={cn(
                            'w-full text-left px-2 py-0.5 rounded transition-colors',
                            currentMoveIndex === whiteIndex
                              ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600',
                          )}
                        >
                          {white.san}
                          {white.captured && (
                            <span className="text-red-500 ml-1">×</span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="w-20 px-1 py-1">
                      {black && blackIndex !== undefined && (
                        <button
                          type="button"
                          data-index={blackIndex}
                          onClick={() => onMoveSelect?.(blackIndex)}
                          className={cn(
                            'w-full text-left px-2 py-0.5 rounded transition-colors',
                            currentMoveIndex === blackIndex
                              ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600',
                          )}
                        >
                          {black.san}
                          {black.captured && (
                            <span className="text-red-500 ml-1">×</span>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
