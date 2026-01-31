// src/components/chess/ChessBoardTest.tsx
// 이 파일은 라이브러리 통합 검증용 임시 컴포넌트입니다.
// 2단계에서 실제 ChessBoard 컴포넌트로 대체됩니다.

import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export function ChessBoardTest() {
  const [game, setGame] = useState(new Chess());

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      const gameCopy = new Chess(game.fen());

      try {
        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // 항상 퀸으로 프로모션 (임시)
        });

        if (move) {
          setGame(gameCopy);
          return true;
        }
      } catch {
        // 유효하지 않은 수
      }

      return false;
    },
    [game]
  );

  const handlePieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => (targetSquare ? onDrop(sourceSquare, targetSquare) : false),
    [onDrop]
  );

  const resetGame = () => {
    setGame(new Chess());
  };

  return (
    <div className="space-y-4">
      <div className="max-w-md mx-auto" style={{ width: 400 }}>
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: handlePieceDrop,
            boardStyle: { width: 400, height: 400 },
          }}
        />
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          현재 턴: {game.turn() === 'w' ? '백' : '흑'}
        </p>
        {game.isCheckmate() && (
          <p className="text-lg font-bold text-red-600">체크메이트!</p>
        )}
        {game.isDraw() && (
          <p className="text-lg font-bold text-yellow-600">무승부!</p>
        )}
        {game.isCheck() && !game.isCheckmate() && (
          <p className="text-lg font-bold text-orange-600">체크!</p>
        )}
        <button onClick={resetGame} className="btn-secondary">
          리셋
        </button>
      </div>

      <div className="text-center text-xs text-gray-400">
        ✅ chess.js 및 react-chessboard 통합 성공
      </div>
    </div>
  );
}
