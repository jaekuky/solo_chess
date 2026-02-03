// src/pages/MultiplayerGamePage.tsx
// 실시간 멀티플레이어 게임 페이지

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Square } from '@/types';
import type { PieceSymbol } from 'chess.js';
import {
  ChessBoard,
  PromotionModal,
  PlayerInfo,
  CapturedPieces,
  MoveHistoryPanel,
  GameStatus,
  Timer,
} from '@/components/chess';
import { Button, ConfirmDialog, LoadingSpinner } from '@/components/common';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { useAuthStore } from '@/stores/authStore';
import { useResponsive } from '@/hooks';
import { ROUTES } from '@/constants';
import type { PieceColor, CapturedPieces as CapturedPiecesType, PieceType } from '@/types';

export function MultiplayerGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const [showResignDialog, setShowResignDialog] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<{
    result: 'win' | 'lose' | 'draw';
    reason: string;
  } | null>(null);

  // 게임 훅
  const [gameState, gameActions] = useMultiplayerGame({
    gameId: gameId || '',
    userId: user?.id || '',
    onGameEnd: (result, reason) => {
      setGameEnded(true);
      setGameResult({ result, reason });
    },
  });

  const { boardSize } = useResponsive(true);

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate(ROUTES.LOBBY);
    }
  }, [user, navigate]);

  // 게임 ID 체크
  useEffect(() => {
    if (!gameId) {
      navigate(ROUTES.LOBBY);
    }
  }, [gameId, navigate]);

  // 잡힌 기물 계산
  const capturedPieces = useMemo((): CapturedPiecesType => {
    const captured: CapturedPiecesType = { white: [], black: [] };
    gameState.moveHistory.forEach((move) => {
      if (move.captured) {
        if (move.color === 'w') {
          captured.white.push(move.captured as PieceType);
        } else {
          captured.black.push(move.captured as PieceType);
        }
      }
    });
    return captured;
  }, [gameState.moveHistory]);

  // 킹 위치 찾기 (체크 표시용)
  const findKingSquare = useCallback((): Square | null => {
    if (!gameState.isCheck) return null;
    const position = gameState.fen.split(' ')[0];
    const kingChar = gameState.turn === 'w' ? 'K' : 'k';
    let rank = 8;
    let file = 0;
    const files = 'abcdefgh';
    for (const char of position) {
      if (char === '/') {
        rank--;
        file = 0;
      } else if (!Number.isNaN(Number(char))) {
        file += Number(char);
      } else {
        if (char === kingChar) return `${files[file]}${rank}` as Square;
        file++;
      }
    }
    return null;
  }, [gameState.fen, gameState.isCheck, gameState.turn]);

  // 마지막 이동
  const lastMove = useMemo(() => {
    if (gameState.moveHistory.length === 0) return null;
    const last = gameState.moveHistory[gameState.moveHistory.length - 1];
    return { from: last.from, to: last.to };
  }, [gameState.moveHistory]);

  // 프로모션 체크
  const checkPromotion = useCallback(
    (from: Square, to: Square): boolean => {
      const file = from.charCodeAt(0) - 97;
      const fromRank = Number(from[1]);
      const toRank = Number(to[1]);
      const fen = gameState.fen.split(' ')[0];
      const ranks = fen.split('/');
      const rankIndex = 8 - fromRank;
      const rank = ranks[rankIndex];
      let currentFile = 0;
      for (const char of rank) {
        if (!Number.isNaN(Number(char))) {
          currentFile += Number(char);
        } else {
          if (currentFile === file) {
            const isPawn = char.toLowerCase() === 'p';
            const isWhitePromotion = char === 'P' && toRank === 8;
            const isBlackPromotion = char === 'p' && toRank === 1;
            return isPawn && (isWhitePromotion || isBlackPromotion);
          }
          currentFile++;
        }
      }
      return false;
    },
    [gameState.fen]
  );

  // 칸 클릭 핸들러
  const handleSquareClick = useCallback(
    (square: Square) => {
      // 내 차례가 아니거나 게임 종료 시 무시
      if (!gameState.isMyTurn || gameState.isGameOver || gameEnded) {
        return;
      }

      // 같은 칸 클릭 시 선택 해제
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // 이동 실행
      if (selectedSquare && legalMoves.includes(square)) {
        const isPromotion = checkPromotion(selectedSquare, square);
        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
        } else {
          gameActions.makeMove(selectedSquare, square);
        }
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // 새 기물 선택
      const moves = gameActions.getLegalMoves(square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setLegalMoves(moves);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [
      selectedSquare,
      legalMoves,
      gameState.isMyTurn,
      gameState.isGameOver,
      gameEnded,
      gameActions,
      checkPromotion,
    ]
  );

  // 드래그 앤 드롭 핸들러
  const handlePieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      if (!gameState.isMyTurn || gameState.isGameOver || gameEnded) {
        return false;
      }

      if (!gameActions.isValidMove(sourceSquare, targetSquare)) {
        return false;
      }

      const isPromotion = checkPromotion(sourceSquare, targetSquare);
      if (isPromotion) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        return false;
      }

      gameActions.makeMove(sourceSquare, targetSquare);
      return true;
    },
    [gameState.isMyTurn, gameState.isGameOver, gameEnded, gameActions, checkPromotion]
  );

  // 프로모션 선택 핸들러
  const handlePromotionSelect = useCallback(
    (piece: PieceSymbol) => {
      if (pendingPromotion) {
        gameActions.makeMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
      }
    },
    [pendingPromotion, gameActions]
  );

  // 기권 핸들러
  const handleResign = useCallback(() => setShowResignDialog(true), []);

  const confirmResign = useCallback(() => {
    setShowResignDialog(false);
    gameActions.resign();
  }, [gameActions]);

  // 로비로 돌아가기
  const goToLobby = useCallback(() => {
    gameActions.disconnect();
    navigate(ROUTES.LOBBY);
  }, [gameActions, navigate]);

  // 로딩 중
  if (gameState.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-500">게임을 불러오는 중...</p>
      </div>
    );
  }

  // 에러
  if (gameState.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">{gameState.error}</p>
        <Button onClick={goToLobby}>로비로 돌아가기</Button>
      </div>
    );
  }

  // 대기 중 (상대방 없음)
  if (gameState.game?.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <h2 className="text-xl font-semibold mt-4 mb-2">상대방을 기다리는 중...</h2>
          <p className="text-gray-500 mb-6">
            다른 플레이어가 참가하면 게임이 시작됩니다
          </p>
          <Button variant="outline" onClick={goToLobby}>
            취소하고 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const myColor: PieceColor = gameState.myColor || 'w';
  const opponentColor: PieceColor = myColor === 'w' ? 'b' : 'w';

  return (
    <div className="max-w-5xl mx-auto relative">
      {/* 게임 결과 오버레이 */}
      {gameEnded && gameResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">
              {gameResult.result === 'win'
                ? '🏆'
                : gameResult.result === 'lose'
                  ? '😔'
                  : '🤝'}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {gameResult.result === 'win'
                ? '승리!'
                : gameResult.result === 'lose'
                  ? '패배'
                  : '무승부'}
            </h2>
            <p className="text-gray-500 mb-6">
              {gameResult.reason === 'checkmate'
                ? '체크메이트'
                : gameResult.reason === 'resignation'
                  ? '기권'
                  : gameResult.reason === 'timeout'
                    ? '시간 초과'
                    : gameResult.reason === 'stalemate'
                      ? '스테일메이트'
                      : gameResult.reason}
            </p>
            <Button onClick={goToLobby} className="w-full">
              로비로 돌아가기
            </Button>
          </div>
        </div>
      )}

      {/* 연결 상태 */}
      <div className="flex items-center justify-between mb-4">
        <GameStatus
          isCheck={gameState.isCheck}
          isCheckmate={gameState.isCheckmate}
          isStalemate={gameState.isStalemate}
          isDraw={gameState.isDraw}
          turn={gameState.turn}
        />
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              gameState.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-500">
            {gameState.isConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 메인 게임 영역 */}
        <div className="flex-1 flex flex-col items-center">
          {/* 상대방 정보 */}
          <div className="w-full max-w-lg mb-2">
            <div className="flex items-center justify-between gap-2">
              <PlayerInfo
                color={opponentColor}
                name={gameState.opponent?.username || '상대방'}
                isCurrentTurn={gameState.turn === opponentColor}
                className="flex-1"
              />
              {gameState.game?.time_control && (
                <Timer
                  timeInSeconds={
                    opponentColor === 'w'
                      ? gameState.game.white_time_remaining || 0
                      : gameState.game.black_time_remaining || 0
                  }
                  isActive={gameState.turn === opponentColor}
                  size="lg"
                />
              )}
            </div>
            <CapturedPieces
              pieces={capturedPieces[opponentColor === 'w' ? 'white' : 'black']}
              color={opponentColor}
              className="min-h-[32px] mt-1"
            />
          </div>

          {/* 체스판 */}
          <div className="relative">
            <ChessBoard
              fen={gameState.fen}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              isCheck={gameState.isCheck}
              checkSquare={findKingSquare()}
              playerColor={myColor}
              boardWidth={boardSize}
              disabled={!gameState.isMyTurn || gameState.isGameOver || gameEnded}
            />

            {/* 차례 표시 오버레이 */}
            {!gameState.isMyTurn && !gameState.isGameOver && !gameEnded && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg">
                  <p className="text-sm font-medium">상대방 차례입니다</p>
                </div>
              </div>
            )}
          </div>

          {/* 내 정보 */}
          <div className="w-full max-w-lg mt-2">
            <CapturedPieces
              pieces={capturedPieces[myColor === 'w' ? 'white' : 'black']}
              color={myColor}
              className="min-h-[32px] mb-1"
            />
            <div className="flex items-center justify-between gap-2">
              <PlayerInfo
                color={myColor}
                name={profile?.username || '나'}
                isCurrentTurn={gameState.isMyTurn}
                isPlayer
                className="flex-1"
              />
              {gameState.game?.time_control && (
                <Timer
                  timeInSeconds={
                    myColor === 'w'
                      ? gameState.game.white_time_remaining || 0
                      : gameState.game.black_time_remaining || 0
                  }
                  isActive={gameState.isMyTurn}
                  size="lg"
                />
              )}
            </div>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="lg:w-72 flex flex-col gap-4">
          <MoveHistoryPanel moves={gameState.moveHistory} />

          {/* 게임 컨트롤 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-3">
            <Button
              variant="danger"
              className="w-full"
              onClick={handleResign}
              disabled={gameState.isGameOver || gameEnded}
            >
              🏳️ 기권
            </Button>
            <Button variant="outline" className="w-full" onClick={goToLobby}>
              🚪 나가기
            </Button>
          </div>

          {/* 게임 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm space-y-1">
            <p className="text-gray-500">
              <span className="font-medium">상대:</span>{' '}
              {gameState.opponent?.username || '알 수 없음'}
              {gameState.opponent?.rating && ` (${gameState.opponent.rating})`}
            </p>
            <p className="text-gray-500">
              <span className="font-medium">시간:</span>{' '}
              {gameState.game?.time_control
                ? `${Math.floor(gameState.game.time_control / 60)}분`
                : '무제한'}
            </p>
            <p className="text-gray-500">
              <span className="font-medium">내 색상:</span>{' '}
              {myColor === 'w' ? '백 (선공)' : '흑 (후공)'}
            </p>
          </div>
        </div>
      </div>

      {/* 프로모션 모달 */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        color={myColor}
        onSelect={handlePromotionSelect}
        onCancel={() => setPendingPromotion(null)}
      />

      {/* 기권 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showResignDialog}
        onClose={() => setShowResignDialog(false)}
        onConfirm={confirmResign}
        title="기권하시겠습니까?"
        message="기권하면 패배로 기록됩니다."
        confirmText="기권"
        cancelText="취소"
        variant="danger"
      />
    </div>
  );
}
