// src/pages/SavedGamesPage.tsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ConfirmDialog } from '@/components/common';
import { useGameStorage } from '@/hooks';
import { useGameStore } from '@/stores';
import type { SavedGame } from '@/types';
import { ROUTES, DIFFICULTY_CONFIG } from '@/constants';
import { formatRelativeTime } from '@/utils';
import { cn } from '@/utils';

export function SavedGamesPage() {
  const navigate = useNavigate();
  const { savedGames, loadSavedGames, deleteSavedGame } = useGameStorage();
  const { loadSavedGame } = useGameStore();

  const [selectedGame, setSelectedGame] = useState<SavedGame | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSavedGames();
  }, [loadSavedGames]);

  const handleLoadGame = useCallback(
    (game: SavedGame) => {
      loadSavedGame(game.state);
      navigate(ROUTES.GAME_PLAY);
    },
    [loadSavedGame, navigate],
  );

  const handleDeleteClick = useCallback((gameId: string) => {
    setGameToDelete(gameId);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (gameToDelete) {
      deleteSavedGame(gameToDelete);
      setGameToDelete(null);
    }
    setShowDeleteDialog(false);
  }, [gameToDelete, deleteSavedGame]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">저장된 게임</h2>
          <p className="text-gray-500">
            진행 중이던 게임을 이어서 플레이하세요.
          </p>
        </div>
        <span className="text-sm text-gray-400">
          {savedGames.length}개의 게임
        </span>
      </div>

      {savedGames.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
          <span className="text-6xl block mb-4">📭</span>
          <h3 className="text-lg font-medium mb-2">저장된 게임이 없습니다</h3>
          <p className="text-gray-500 mb-6">
            게임 중 저장 버튼을 눌러 진행 상황을 저장하세요.
          </p>
          <Button onClick={() => navigate(ROUTES.GAME_SETTINGS)}>
            새 게임 시작하기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {savedGames.map((game) => (
            <div
              key={game.gameId}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm',
                'border-2 transition-all cursor-pointer',
                selectedGame?.gameId === game.gameId
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700',
              )}
              onClick={() => setSelectedGame(game)}
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-board-light rounded-lg flex-shrink-0 flex items-center justify-center text-3xl">
                  ♔♚
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{game.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      🎯 {DIFFICULTY_CONFIG[game.state.difficulty].name}
                    </span>
                    <span className="flex items-center gap-1">
                      ♟️ {game.state.moveHistory.length}수
                    </span>
                    <span className="flex items-center gap-1">
                      🎨 {game.state.playerColor === 'w' ? '백' : '흑'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatRelativeTime(game.savedAt)}에 저장됨
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadGame(game);
                    }}
                  >
                    이어하기
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(game.gameId);
                    }}
                    className="text-red-500"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="게임을 삭제하시겠습니까?"
        message="삭제된 게임은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />
    </div>
  );
}
