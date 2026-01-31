// src/components/learning/InteractivePuzzleBoard.tsx

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Puzzle, Square } from '@/types';
import { useSettingsStore } from '@/stores';
import { cn } from '@/utils';
import type { BoardStyle } from '@/types';

interface InteractivePuzzleBoardProps {
  puzzle: Puzzle;
  onSolve: () => void;
  onFail: () => void;
  boardWidth?: number;
  className?: string;
}

type PuzzleState = 'playing' | 'correct' | 'incorrect' | 'completed';

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

export function InteractivePuzzleBoard({
  puzzle,
  onSolve,
  onFail,
  boardWidth = 400,
  className,
}: InteractivePuzzleBoardProps) {
  const { settings } = useSettingsStore();

  // 게임 상태
  const [game, setGame] = useState(() => new Chess(puzzle.fen));
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>('playing');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const boardColors =
    BOARD_STYLES[settings.boardStyle] ?? BOARD_STYLES.classic;

  // 퍼즐 리셋 - puzzle이 변경될 때 상태를 초기화하는 의도된 동작
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGame(new Chess(puzzle.fen));
    setCurrentMoveIndex(0);
    setPuzzleState('playing');
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setFeedback(null);
  }, [puzzle]);

  // 정답 확인
  const checkMove = useCallback(
    (from: Square, to: Square): boolean => {
      const expectedMove = puzzle.solution[currentMoveIndex];
      const actualMove = from + to;

      // 프로모션 처리 (예: e7e8q)
      if (expectedMove.length === 5) {
        return actualMove === expectedMove.slice(0, 4);
      }

      return actualMove === expectedMove;
    },
    [puzzle.solution, currentMoveIndex],
  );

  // 수 실행
  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: string) => {
      const isCorrect = checkMove(from, to);

      if (isCorrect) {
        // 정답
        const expectedMove = puzzle.solution[currentMoveIndex];
        const promo =
          expectedMove.length === 5
            ? (expectedMove[4] as 'q' | 'r' | 'b' | 'n')
            : (promotion as 'q' | 'r' | 'b' | 'n' | undefined);

        try {
          const move = game.move({ from, to, promotion: promo });

          if (move) {
            setGame(new Chess(game.fen()));
            setLastMove({ from, to });
            setSelectedSquare(null);
            setLegalMoves([]);

            // 다음 수 (상대 응수)
            const nextMoveIndex = currentMoveIndex + 1;

            if (nextMoveIndex >= puzzle.solution.length) {
              // 퍼즐 완료!
              setPuzzleState('completed');
              setFeedback('🎉 정답입니다!');
              onSolve();
            } else {
              setPuzzleState('correct');
              setFeedback('✓ 맞았습니다! 계속하세요.');

              // 상대 응수 자동 실행 (짧은 딜레이 후)
              setTimeout(() => {
                const opponentMove = puzzle.solution[nextMoveIndex];
                const oppFrom = opponentMove.slice(0, 2) as Square;
                const oppTo = opponentMove.slice(2, 4) as Square;
                const oppPromo =
                  opponentMove.length === 5
                    ? (opponentMove[4] as 'q' | 'r' | 'b' | 'n')
                    : undefined;

                const currentGame = new Chess(game.fen());
                const oppMoveResult = currentGame.move({
                  from: oppFrom,
                  to: oppTo,
                  promotion: oppPromo,
                });

                if (oppMoveResult) {
                  setGame(new Chess(currentGame.fen()));
                  setLastMove({ from: oppFrom, to: oppTo });
                  setCurrentMoveIndex(nextMoveIndex + 1);
                  setPuzzleState('playing');
                  setFeedback(null);
                }
              }, 500);
            }
          }
        } catch (error) {
          console.error('Move error:', error);
        }
      } else {
        // 오답
        setPuzzleState('incorrect');
        setFeedback('✗ 틀렸습니다. 다시 시도하세요.');
        onFail();

        // 잠시 후 피드백 제거
        setTimeout(() => {
          setFeedback(null);
          setPuzzleState('playing');
        }, 1500);
      }

      setSelectedSquare(null);
      setLegalMoves([]);
    },
    [game, currentMoveIndex, puzzle.solution, checkMove, onSolve, onFail],
  );

  // 칸 클릭
  const handleSquareClick = useCallback(
    ({ square }: { piece: unknown; square: string }) => {
      if (puzzleState !== 'playing') return;

      const squareTyped = square as Square;
      const piece = game.get(squareTyped);

      // 이미 선택된 칸 클릭 -> 선택 해제
      if (selectedSquare === squareTyped) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // 이동 가능한 칸 클릭 -> 이동
      if (selectedSquare && legalMoves.includes(square)) {
        makeMove(selectedSquare, squareTyped);
        return;
      }

      // 자신의 기물 선택
      if (piece && piece.color === puzzle.playerColor) {
        const moves = game.moves({ square: squareTyped, verbose: true });
        setSelectedSquare(squareTyped);
        setLegalMoves(moves.map((m) => m.to));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [
      game,
      selectedSquare,
      legalMoves,
      puzzleState,
      puzzle.playerColor,
      makeMove,
    ],
  );

  // 기물 드롭
  const handlePieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      piece: unknown;
      sourceSquare: string;
      targetSquare: string | null;
    }): boolean => {
      if (puzzleState !== 'playing' || !targetSquare) return false;

      const source = sourceSquare as Square;
      const target = targetSquare as Square;

      // 유효한 이동인지 확인
      const moves = game.moves({ square: source, verbose: true });
      const isValid = moves.some((m) => m.to === target);

      if (isValid) {
        makeMove(source, target);
        return true;
      }

      return false;
    },
    [game, puzzleState, makeMove],
  );

  // 커스텀 칸 스타일
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 선택된 칸
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      };
    }

    // 이동 가능한 칸
    legalMoves.forEach((sq) => {
      styles[sq] = {
        ...styles[sq],
        background:
          'radial-gradient(circle, rgba(0, 0, 0, 0.15) 25%, transparent 25%)',
      };
    });

    // 마지막 이동
    if (lastMove) {
      const moveColor = 'rgba(155, 199, 0, 0.41)';
      styles[lastMove.from] = {
        ...styles[lastMove.from],
        backgroundColor: moveColor,
      };
      styles[lastMove.to] = {
        ...styles[lastMove.to],
        backgroundColor: moveColor,
      };
    }

    return styles;
  }, [selectedSquare, legalMoves, lastMove]);

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

  const canDragPiece = useCallback(
    () => puzzleState === 'playing',
    [puzzleState],
  );

  return (
    <div className={cn('relative', className)}>
      <Chessboard
        options={{
          position: game.fen(),
          boardOrientation: puzzle.playerColor === 'w' ? 'white' : 'black',
          boardStyle: { width: boardWidth, height: boardWidth },
          squareStyles: customSquareStyles,
          lightSquareStyle: { backgroundColor: boardColors.lightSquare },
          darkSquareStyle: { backgroundColor: boardColors.darkSquare },
          showNotation: true,
          animationDurationInMs: animationDuration,
          allowDragging: puzzleState === 'playing',
          canDragPiece,
          onSquareClick: handleSquareClick,
          onPieceDrop: handlePieceDrop,
        }}
      />

      {/* 피드백 오버레이 */}
      {feedback && (
        <div
          className={cn(
            'absolute inset-x-0 top-1/2 -translate-y-1/2 transform',
            'mx-4 rounded-lg px-4 py-3 text-center text-lg font-bold',
            'animate-fade-in',
            puzzleState === 'correct' || puzzleState === 'completed'
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white',
          )}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}
