// src/pages/GamePlayPage.tsx

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Square } from '@/types';
import type { PieceSymbol } from 'chess.js';
import {
  ChessBoard,
  PromotionModal,
  PlayerInfo,
  CapturedPieces,
  MoveHistoryPanel,
  GameStatus,
  GameControls,
  AIThinkingIndicator,
  Timer,
  SaveGameModal,
  LoadGameModal,
  PauseOverlay,
  HintDisplay,
} from '@/components/chess';
import { ConfirmDialog } from '@/components/common';
import { useAIGame, useTimer, useGameStorage } from '@/hooks';
import { useGameStore, useSettingsStore } from '@/stores';
import {
  ROUTES,
  AI_NAMES,
  DIFFICULTY_CONFIG,
  TIME_CONTROL_CONFIG,
} from '@/constants';
import type {
  PieceColor,
  CapturedPieces as CapturedPiecesType,
  PieceType,
  GameResult,
  GameEndReason,
} from '@/types';

export function GamePlayPage() {
  const navigate = useNavigate();
  const {
    game: gameState,
    endGame,
    resetGame: resetGameStore,
    loadSavedGame,
  } = useGameStore();
  const { settings } = useSettingsStore();

  const {
    savedGames,
    loadSavedGames,
    saveCurrentGame,
    loadGame,
    deleteSavedGame,
    autoSave,
  } = useGameStorage();

  const [showResignDialog, setShowResignDialog] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintsUsedCount, setHintsUsedCount] = useState(gameState.hintsUsed);
  const prevHintRef = useRef<{ from: Square; to: Square } | null>(null);

  useEffect(() => {
    if (gameState.status !== 'playing') {
      navigate(ROUTES.GAME_SETTINGS);
    }
    loadSavedGames();
  }, [gameState.status, navigate, loadSavedGames]);

  const playerColor: PieceColor = gameState.playerColor ?? 'w';
  const aiColor: PieceColor = playerColor === 'w' ? 'b' : 'w';
  const aiName = AI_NAMES[gameState.difficulty] ?? 'AI';

  const timeControlConfig = TIME_CONTROL_CONFIG[gameState.timeControl];
  const initialTime = timeControlConfig?.seconds ?? 600;
  const hasTimeControl = gameState.timeControl !== 'none';

  const [timerState, timerActions] = useTimer({
    initialTime,
    onTimeExpired: (color) => {
      if (color === playerColor) {
        handleGameEnd('lose', 'timeout');
      } else {
        handleGameEnd('win', 'timeout');
      }
    },
  });

  const handleGameEnd = useCallback(
    (result: GameResult, reason: GameEndReason) => {
      timerActions.pause();
      if (result !== null) {
        endGame(result, reason);
        setTimeout(() => navigate(ROUTES.GAME_RESULT), 1500);
      }
    },
    [timerActions, endGame, navigate],
  );

  const [aiGameState, aiGameActions] = useAIGame({
    difficulty: gameState.difficulty,
    customDepth: gameState.customDepth,
    playerColor,
    initialFen: gameState.fen,
    initialMoveHistory: gameState.moveHistory,
    onGameEnd: handleGameEnd,
    onAIMove: (move) => {
      if (hasTimeControl) {
        timerActions.switchTurn(playerColor);
      }
      if (settings.autoSave) {
        autoSave({
          ...gameState,
          fen: aiGameState.fen,
          moveHistory: [...aiGameState.moveHistory, move],
        });
      }
    },
  });

  useEffect(() => {
    const hadHint = !!prevHintRef.current;
    const hasHint = !!aiGameState.hintMove;
    if (hasHint && !hadHint) {
      // 힌트가 새로 생성되었을 때 카운트 증가 - 의도된 동작
      setHintsUsedCount((c) => c + 1);
    }
    prevHintRef.current = aiGameState.hintMove;
  }, [aiGameState.hintMove]);

  useEffect(() => {
    aiGameActions.initAI();

    if (hasTimeControl && playerColor === 'w') {
      timerActions.start('w');
    }

    return () => {
      aiGameActions.stopAI();
      timerActions.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturedPieces = useMemo((): CapturedPiecesType => {
    const captured: CapturedPiecesType = { white: [], black: [] };
    aiGameState.moveHistory.forEach((move) => {
      if (move.captured) {
        if (move.color === 'w') {
          captured.white.push(move.captured as PieceType);
        } else {
          captured.black.push(move.captured as PieceType);
        }
      }
    });
    return captured;
  }, [aiGameState.moveHistory]);

  const findKingSquare = useCallback((): Square | null => {
    if (!aiGameState.isCheck) return null;
    const fen = aiGameState.fen;
    const position = fen.split(' ')[0];
    const kingChar = aiGameState.turn === 'w' ? 'K' : 'k';
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
  }, [aiGameState.fen, aiGameState.isCheck, aiGameState.turn]);

  const lastMove = useMemo(() => {
    if (aiGameState.moveHistory.length === 0) return null;
    const last = aiGameState.moveHistory[aiGameState.moveHistory.length - 1];
    return { from: last.from, to: last.to };
  }, [aiGameState.moveHistory]);

  const checkPromotion = useCallback(
    (from: Square, to: Square): boolean => {
      const file = from.charCodeAt(0) - 97;
      const fromRank = Number(from[1]);
      const toRank = Number(to[1]);
      const fen = aiGameState.fen.split(' ')[0];
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
    [aiGameState.fen],
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (
        aiGameState.isGameOver ||
        aiGameState.turn !== playerColor ||
        aiGameState.isAIThinking ||
        isPaused
      ) {
        return;
      }
      aiGameActions.clearHint();
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      if (selectedSquare && legalMoves.includes(square)) {
        const isPromotion = checkPromotion(selectedSquare, square);
        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
        } else {
          if (aiGameActions.makePlayerMove(selectedSquare, square)) {
            if (hasTimeControl) {
              timerActions.switchTurn(aiColor);
            }
          }
        }
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
      const moves = aiGameActions.getLegalMoves(square);
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
      aiGameState,
      playerColor,
      aiColor,
      aiGameActions,
      hasTimeControl,
      timerActions,
      isPaused,
      checkPromotion,
    ],
  );

  const handlePieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square): boolean => {
      if (
        aiGameState.isGameOver ||
        aiGameState.turn !== playerColor ||
        aiGameState.isAIThinking ||
        isPaused
      ) {
        return false;
      }
      aiGameActions.clearHint();
      if (!aiGameActions.isValidMove(sourceSquare, targetSquare)) {
        return false;
      }
      const isPromotion = checkPromotion(sourceSquare, targetSquare);
      if (isPromotion) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        return false;
      }
      const success = aiGameActions.makePlayerMove(sourceSquare, targetSquare);
      if (success && hasTimeControl) {
        timerActions.switchTurn(aiColor);
      }
      return success;
    },
    [
      aiGameState,
      playerColor,
      aiColor,
      aiGameActions,
      hasTimeControl,
      timerActions,
      isPaused,
      checkPromotion,
    ],
  );

  const handlePromotionSelect = useCallback(
    (piece: PieceSymbol) => {
      if (pendingPromotion) {
        if (
          aiGameActions.makePlayerMove(
            pendingPromotion.from,
            pendingPromotion.to,
            piece,
          )
        ) {
          if (hasTimeControl) {
            timerActions.switchTurn(aiColor);
          }
        }
        setPendingPromotion(null);
      }
    },
    [pendingPromotion, aiGameActions, hasTimeControl, timerActions, aiColor],
  );

  const handleUndo = useCallback(() => {
    if (aiGameActions.undoMove()) {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [aiGameActions]);

  const handleHint = useCallback(async () => {
    setIsHintLoading(true);
    await aiGameActions.requestHint();
    setIsHintLoading(false);
  }, [aiGameActions]);

  const handleClearHint = useCallback(() => {
    aiGameActions.clearHint();
  }, [aiGameActions]);

  const handleSave = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const confirmSave = useCallback(
    (name: string) => {
      const stateToSave = {
        ...gameState,
        fen: aiGameState.fen,
        moveHistory: aiGameState.moveHistory,
        turn: aiGameState.turn,
        isCheck: aiGameState.isCheck,
        isCheckmate: aiGameState.isCheckmate,
        isStalemate: aiGameState.isStalemate,
        isDraw: aiGameState.isDraw,
        capturedPieces,
        pgn: aiGameState.moveHistory.map((m) => m.san).join(' '),
      };
      saveCurrentGame(stateToSave, name);
      setShowSaveModal(false);
    },
    [
      saveCurrentGame,
      gameState,
      aiGameState,
      capturedPieces,
    ],
  );

  const handleLoad = useCallback(
    (gameId: string) => {
      const savedGame = loadGame(gameId);
      if (savedGame) {
        loadSavedGame(savedGame.state);
        setShowLoadModal(false);
        loadSavedGames();
        navigate(ROUTES.HOME, { replace: true });
        setTimeout(() => navigate(ROUTES.GAME_PLAY), 0);
      }
    },
    [loadGame, loadSavedGame, loadSavedGames, navigate],
  );

  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (hasTimeControl) {
      timerActions.pause();
    }
  }, [hasTimeControl, timerActions]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    if (hasTimeControl && !aiGameState.isAIThinking) {
      timerActions.resume();
    }
  }, [hasTimeControl, timerActions, aiGameState.isAIThinking]);

  const handleResign = useCallback(() => setShowResignDialog(true), []);

  const confirmResign = useCallback(() => {
    setShowResignDialog(false);
    handleGameEnd('lose', 'resignation');
  }, [handleGameEnd]);

  const handleNewGame = useCallback(() => {
    if (
      aiGameState.moveHistory.length > 0 &&
      !aiGameState.isGameOver
    ) {
      setShowNewGameDialog(true);
    } else {
      resetGameStore();
      navigate(ROUTES.GAME_SETTINGS);
    }
  }, [
    aiGameState.moveHistory.length,
    aiGameState.isGameOver,
    resetGameStore,
    navigate,
  ]);

  const confirmNewGame = useCallback(() => {
    aiGameActions.stopAI();
    timerActions.pause();
    resetGameStore();
    setShowNewGameDialog(false);
    navigate(ROUTES.GAME_SETTINGS);
  }, [aiGameActions, timerActions, resetGameStore, navigate]);

  const handleQuitFromPause = useCallback(() => {
    if (aiGameState.moveHistory.length > 0) {
      setIsPaused(false);
      setShowNewGameDialog(true);
    } else {
      resetGameStore();
      navigate(ROUTES.HOME);
    }
  }, [aiGameState.moveHistory.length, resetGameStore, navigate]);

  const [boardSize, setBoardSize] = useState(400);
  useEffect(() => {
    const updateBoardSize = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 560);
      const maxHeight = window.innerHeight - 400;
      setBoardSize(Math.min(maxWidth, maxHeight));
    };
    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  const hintSquares = aiGameState.hintMove
    ? { from: aiGameState.hintMove.from, to: aiGameState.hintMove.to }
    : null;

  return (
    <div className="max-w-5xl mx-auto relative">
      <PauseOverlay
        isVisible={isPaused}
        onResume={handleResume}
        onSave={() => {
          setIsPaused(false);
          setShowSaveModal(true);
        }}
        onQuit={handleQuitFromPause}
      />

      <GameStatus
        isCheck={aiGameState.isCheck}
        isCheckmate={aiGameState.isCheckmate}
        isStalemate={aiGameState.isStalemate}
        isDraw={aiGameState.isDraw}
        turn={aiGameState.turn}
        className="mb-4"
      />

      {aiGameState.aiError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          ⚠️ {aiGameState.aiError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-lg mb-2">
            <div className="flex items-center justify-between gap-2">
              <PlayerInfo
                color={aiColor}
                name={`${aiName} (${DIFFICULTY_CONFIG[gameState.difficulty].name})`}
                isCurrentTurn={aiGameState.turn === aiColor}
                className="flex-1"
              />
              {hasTimeControl && (
                <Timer
                  timeInSeconds={
                    aiColor === 'w' ? timerState.whiteTime : timerState.blackTime
                  }
                  isActive={
                    timerState.activeColor === aiColor && timerState.isRunning
                  }
                  isExpired={timerState.expiredColor === aiColor}
                  size="lg"
                />
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <CapturedPieces
                pieces={
                  capturedPieces[
                    aiColor === 'w' ? 'white' : 'black'
                  ]
                }
                color={aiColor}
                className="min-h-[32px]"
              />
              {aiGameState.isAIThinking && <AIThinkingIndicator />}
            </div>
          </div>

          <div className="relative">
            <ChessBoard
              fen={aiGameState.fen}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              isCheck={aiGameState.isCheck}
              checkSquare={findKingSquare()}
              playerColor={playerColor}
              boardWidth={boardSize}
              disabled={
                aiGameState.isGameOver ||
                aiGameState.isAIThinking ||
                isPaused
              }
              hintSquares={hintSquares}
            />
            <button
              type="button"
              onClick={handlePause}
              className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow hover:bg-white dark:hover:bg-gray-800 transition-colors"
              title="일시정지"
            >
              ⏸️
            </button>
          </div>

          <div className="w-full max-w-lg mt-2">
            <CapturedPieces
              pieces={
                capturedPieces[
                  playerColor === 'w' ? 'white' : 'black'
                ]
              }
              color={playerColor}
              className="mb-1 min-h-[32px]"
            />
            <div className="flex items-center justify-between gap-2">
              <PlayerInfo
                color={playerColor}
                name={playerColor === 'w' ? '백' : '흑'}
                isCurrentTurn={
                  aiGameState.turn === playerColor &&
                  !aiGameState.isAIThinking
                }
                isPlayer
                className="flex-1"
              />
              {hasTimeControl && (
                <Timer
                  timeInSeconds={
                    playerColor === 'w'
                      ? timerState.whiteTime
                      : timerState.blackTime
                  }
                  isActive={
                    timerState.activeColor === playerColor &&
                    timerState.isRunning
                  }
                  isExpired={timerState.expiredColor === playerColor}
                  size="lg"
                />
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-72 flex flex-col gap-4">
          <MoveHistoryPanel moves={aiGameState.moveHistory} />

          {settings.enableHints && (
            <HintDisplay
              hint={aiGameState.hintMove}
              isLoading={isHintLoading}
              hintsUsed={hintsUsedCount}
              onRequestHint={handleHint}
              onClearHint={handleClearHint}
              disabled={
                aiGameState.isGameOver ||
                aiGameState.turn !== playerColor ||
                aiGameState.isAIThinking
              }
            />
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <GameControls
              canUndo={
                aiGameState.moveHistory.length > 0 && !aiGameState.isAIThinking
              }
              isPlaying={!aiGameState.isGameOver}
              onUndo={handleUndo}
              onHint={settings.enableHints ? handleHint : undefined}
              onSave={handleSave}
              onLoad={() => setShowLoadModal(true)}
              onResign={handleResign}
              onNewGame={handleNewGame}
              hintsEnabled={settings.enableHints}
              saveEnabled
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-sm space-y-1">
            <p className="text-gray-500">
              <span className="font-medium">난이도:</span>{' '}
              {DIFFICULTY_CONFIG[gameState.difficulty].name}
            </p>
            <p className="text-gray-500">
              <span className="font-medium">시간:</span>{' '}
              {timeControlConfig?.name ?? '시간 제한 없음'}
            </p>
            <p className="text-gray-500">
              <span className="font-medium">내 색상:</span>{' '}
              {playerColor === 'w' ? '백 (선공)' : '흑 (후공)'}
            </p>
          </div>
        </div>
      </div>

      <PromotionModal
        isOpen={!!pendingPromotion}
        color={playerColor}
        onSelect={handlePromotionSelect}
        onCancel={() => setPendingPromotion(null)}
      />

      <SaveGameModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={confirmSave}
        defaultName={`${AI_NAMES[gameState.difficulty]}과의 게임`}
      />

      <LoadGameModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        savedGames={savedGames}
        onLoad={handleLoad}
        onDelete={deleteSavedGame}
      />

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

      <ConfirmDialog
        isOpen={showNewGameDialog}
        onClose={() => setShowNewGameDialog(false)}
        onConfirm={confirmNewGame}
        title="새 게임을 시작하시겠습니까?"
        message="현재 진행 중인 게임은 저장되지 않습니다."
        confirmText="새 게임"
        cancelText="취소"
        variant="warning"
      />
    </div>
  );
}
