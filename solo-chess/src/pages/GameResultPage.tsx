// src/pages/GameResultPage.tsx

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { MoveHistory } from '@/components/chess';
import { useGameStore, useStatisticsStore } from '@/stores';
import { ROUTES, DIFFICULTY_CONFIG } from '@/constants';
import { cn } from '@/utils';

export function GameResultPage() {
  const navigate = useNavigate();
  const { game, resetGame } = useGameStore();
  const { recordGameResult } = useStatisticsStore();
  const hasRecorded = useRef(false);

  useEffect(() => {
    if (game.status !== 'ended' || !game.result) {
      navigate(ROUTES.HOME);
    }
  }, [game.status, game.result, navigate]);

  useEffect(() => {
    if (
      game.status === 'ended' &&
      game.result &&
      game.startedAt &&
      game.endedAt &&
      !hasRecorded.current
    ) {
      hasRecorded.current = true;
      const duration = Math.floor((game.endedAt - game.startedAt) / 1000);
      const moveCount = game.moveHistory.length;
      recordGameResult(
        game.result,
        game.difficulty,
        duration,
        moveCount,
        game.hintsUsed,
        game.endReason === 'checkmate'
      );
    }
  }, [
    game.status,
    game.result,
    game.startedAt,
    game.endedAt,
    game.moveHistory.length,
    game.difficulty,
    game.hintsUsed,
    game.endReason,
    recordGameResult,
  ]);

  if (game.status !== 'ended' || !game.result) {
    return null;
  }

  const resultConfig = {
    win: {
      title: '승리!',
      emoji: '🎉',
      bgColor: 'bg-win/10',
      textColor: 'text-win',
      message: '축하합니다! 훌륭한 플레이였습니다.',
    },
    lose: {
      title: '패배',
      emoji: '😔',
      bgColor: 'bg-lose/10',
      textColor: 'text-lose',
      message: '아쉽네요. 다음엔 더 잘할 수 있을 거예요!',
    },
    draw: {
      title: '무승부',
      emoji: '🤝',
      bgColor: 'bg-draw/10',
      textColor: 'text-draw',
      message: '팽팽한 승부였습니다!',
    },
  };

  const config = resultConfig[game.result];

  const endReasonMessages: Record<string, string> = {
    checkmate: '체크메이트',
    stalemate: '스테일메이트',
    resignation: '기권',
    timeout: '시간 초과',
    draw_agreement: '무승부 합의',
    insufficient_material: '기물 부족',
    fifty_move_rule: '50수 규칙',
    threefold_repetition: '3회 반복',
  };

  const duration =
    game.startedAt && game.endedAt
      ? Math.floor((game.endedAt - game.startedAt) / 1000)
      : 0;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  const handleNewGame = () => {
    resetGame();
    navigate(ROUTES.GAME_SETTINGS);
  };

  const handleReplay = () => {
    // 6단계에서 구현
  };

  const handleHome = () => {
    resetGame();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div
        className={cn(
          'text-center py-8 rounded-xl mb-6',
          config.bgColor
        )}
      >
        <span className="text-6xl block mb-4">{config.emoji}</span>
        <h2 className={cn('text-3xl font-bold mb-2', config.textColor)}>
          {config.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {config.message}
        </p>
        {game.endReason && (
          <p className="mt-2 text-sm text-gray-500">
            {endReasonMessages[game.endReason] ?? game.endReason}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-semibold mb-4">게임 통계</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold">{game.moveHistory.length}</p>
            <p className="text-sm text-gray-500">총 수</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold">
              {formatDuration(duration)}
            </p>
            <p className="text-sm text-gray-500">게임 시간</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold">
              {DIFFICULTY_CONFIG[game.difficulty].name}
            </p>
            <p className="text-sm text-gray-500">난이도</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold">{game.hintsUsed}</p>
            <p className="text-sm text-gray-500">힌트 사용</p>
          </div>
        </div>
      </div>

      {game.moveHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">기보</h3>
            <button
              type="button"
              onClick={handleReplay}
              className="text-sm text-primary-600 hover:underline"
            >
              복기하기 →
            </button>
          </div>
          <MoveHistory moves={game.moveHistory} maxHeight="150px" />
        </div>
      )}

      <div className="space-y-3">
        <Button onClick={handleNewGame} className="w-full" size="lg">
          🎮 새 게임
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={handleReplay}
            variant="secondary"
            className="flex-1"
          >
            📋 복기
          </Button>
          <Button onClick={handleHome} variant="secondary" className="flex-1">
            🏠 홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}
