// src/pages/ReplayPage.tsx

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { MoveHistoryPanel } from '@/components/chess';
import { Button } from '@/components/common';
import { useGameHistory, useReplay } from '@/hooks';
import { useSettingsStore } from '@/stores';
import { ROUTES, DIFFICULTY_CONFIG } from '@/constants';
import { formatDuration } from '@/utils';
import { storage } from '@/utils/storage';
import type { GameRecord } from '@/types';
import { cn } from '@/utils';

const BOARD_STYLES = {
  classic: { light: '#f0d9b5', dark: '#b58863' },
  modern: { light: '#eeeed2', dark: '#769656' },
  wood: { light: '#e8c99b', dark: '#a17a4d' },
  blue: { light: '#dee3e6', dark: '#8ca2ad' },
  green: { light: '#ffffdd', dark: '#86a666' },
};

const END_REASON_LABELS: Record<string, string> = {
  checkmate: '체크메이트',
  resignation: '기권',
  timeout: '시간 초과',
  stalemate: '스테일메이트',
  draw_agreement: '무승부 합의',
  insufficient_material: '기물 부족',
  fifty_move_rule: '50수 규칙',
  threefold_repetition: '3회 반복',
};

export function ReplayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { getRecord, loadRecords, gameRecords } = useGameHistory();

  const [boardSize, setBoardSize] = useState(400);

  // 게임 기록을 동기적으로 계산
  const gameRecord = useMemo(() => {
    if (!gameId) return null;
    return (
      getRecord(gameId) ??
      storage.getGameRecords().find((r) => r.gameId === gameId) ??
      null
    );
  }, [gameId, getRecord]);

  useEffect(() => {
    if (gameId) {
      loadRecords();
    }
  }, [gameId, loadRecords]);

  useEffect(() => {
    if (gameId && gameRecords.length > 0 && !gameRecord) {
      navigate(ROUTES.HISTORY);
    }
  }, [gameId, gameRecords.length, gameRecord, navigate]);

  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 500);
      const maxHeight = window.innerHeight - 300;
      setBoardSize(Math.min(maxWidth, maxHeight));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!gameRecord) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">게임 기록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <ReplayContent gameRecord={gameRecord} boardSize={boardSize} />
  );
}

function ReplayContent({
  gameRecord,
  boardSize,
}: {
  gameRecord: GameRecord;
  boardSize: number;
}) {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  const {
    currentMoveIndex,
    fen,
    currentMove,
    isPlaying,
    playbackSpeed,
    goToStart,
    goToEnd,
    goToMove,
    nextMove,
    prevMove,
    togglePlay,
    setSpeed,
    getTotalMoves,
    lastMoveSquares,
  } = useReplay({ gameRecord });

  const boardColors =
    BOARD_STYLES[settings.boardStyle as keyof typeof BOARD_STYLES] ??
    BOARD_STYLES.classic;

  const customSquareStyles = lastMoveSquares
    ? {
        [lastMoveSquares.from]: {
          backgroundColor: 'rgba(155, 199, 0, 0.41)',
        },
        [lastMoveSquares.to]: {
          backgroundColor: 'rgba(155, 199, 0, 0.41)',
        },
      }
    : {};

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          prevMove();
          break;
        case 'ArrowRight':
          nextMove();
          break;
        case 'ArrowUp':
          goToStart();
          break;
        case 'ArrowDown':
          goToEnd();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevMove, nextMove, goToStart, goToEnd, togglePlay]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.HISTORY)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← 기록으로
        </button>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-1 rounded text-sm font-medium',
              gameRecord.result === 'win' && 'bg-green-100 text-green-700',
              gameRecord.result === 'lose' && 'bg-red-100 text-red-700',
              gameRecord.result === 'draw' && 'bg-gray-100 text-gray-700',
            )}
          >
            {gameRecord.result === 'win' && '승리'}
            {gameRecord.result === 'lose' && '패배'}
            {gameRecord.result === 'draw' && '무승부'}
          </span>
          <span className="text-sm text-gray-500">
            vs {DIFFICULTY_CONFIG[gameRecord.difficulty].name}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 체스판 */}
        <div className="lg:col-span-2">
          <div className="flex justify-center">
            <Chessboard
              options={{
                position: fen,
                boardStyle: { width: boardSize, height: boardSize },
                boardOrientation:
                  gameRecord.playerColor === 'w' ? 'white' : 'black',
                squareStyles: customSquareStyles,
                lightSquareStyle: { backgroundColor: boardColors.light },
                darkSquareStyle: { backgroundColor: boardColors.dark },
                allowDragging: false,
                animationDurationInMs: 200,
              }}
            />
          </div>

          {/* 재생 컨트롤 */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="mb-4">
              <input
                type="range"
                min={-1}
                max={Math.max(-1, getTotalMoves() - 1)}
                value={currentMoveIndex}
                onChange={(e) => goToMove(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>시작</span>
                <span>
                  {currentMoveIndex + 1} / {getTotalMoves()}
                </span>
                <span>끝</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToStart}
                title="처음으로"
              >
                ⏮️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => prevMove()}
                title="이전 (←)"
              >
                ⏪
              </Button>
              <Button
                variant={isPlaying ? 'secondary' : 'primary'}
                onClick={togglePlay}
                className="px-6"
              >
                {isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nextMove()}
                title="다음 (→)"
              >
                ⏩
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToEnd}
                title="마지막으로"
              >
                ⏭️
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-gray-500">속도:</span>
              {(['slow', 'normal', 'fast'] as const).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setSpeed(speed)}
                  className={cn(
                    'px-2 py-1 rounded text-xs',
                    playbackSpeed === speed
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200',
                  )}
                >
                  {speed === 'slow' && '느리게'}
                  {speed === 'normal' && '보통'}
                  {speed === 'fast' && '빠르게'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-3">게임 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">날짜</span>
                <span>
                  {new Date(gameRecord.playedAt).toLocaleDateString(
                    'ko-KR',
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">내 색상</span>
                <span>
                  {gameRecord.playerColor === 'w' ? '♔ 백' : '♚ 흑'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">난이도</span>
                <span>
                  {DIFFICULTY_CONFIG[gameRecord.difficulty].name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">총 수</span>
                <span>{gameRecord.moveCount}수</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">게임 시간</span>
                <span>{formatDuration(gameRecord.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">종료 사유</span>
                <span>
                  {gameRecord.endReason
                    ? END_REASON_LABELS[gameRecord.endReason] ??
                      gameRecord.endReason
                    : '-'}
                </span>
              </div>
              {gameRecord.hintsUsed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">사용한 힌트</span>
                  <span>{gameRecord.hintsUsed}</span>
                </div>
              )}
            </div>
          </div>

          <MoveHistoryPanel
            moves={gameRecord.moves}
            currentMoveIndex={currentMoveIndex}
            onMoveSelect={goToMove}
            onNavigate={(dir) => {
              if (dir === 'first') goToStart();
              else if (dir === 'prev') prevMove();
              else if (dir === 'next') nextMove();
              else if (dir === 'last') goToEnd();
            }}
            isReplayMode
          />

          {currentMove && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">
                  {Math.floor(currentMoveIndex / 2) + 1}.
                  {currentMove.color === 'w' ? '' : '..'}
                </span>{' '}
                <span className="font-mono">{currentMove.san}</span>
                {currentMove.captured && (
                  <span className="ml-2 text-red-500">
                    ({currentMove.captured} 잡음)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        키보드: ← 이전 | → 다음 | ↑ 처음 | ↓ 끝 | 스페이스 재생/일시정지
      </div>
    </div>
  );
}
