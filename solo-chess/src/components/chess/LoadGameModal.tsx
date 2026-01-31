// src/components/chess/LoadGameModal.tsx

import type { SavedGame } from '@/types';
import { Modal, Button } from '@/components/common';
import { formatRelativeTime } from '@/utils';
import { DIFFICULTY_CONFIG } from '@/constants';
import { cn } from '@/utils';

interface LoadGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedGames: SavedGame[];
  onLoad: (gameId: string) => void;
  onDelete: (gameId: string) => void;
}

export function LoadGameModal({
  isOpen,
  onClose,
  savedGames,
  onLoad,
  onDelete,
}: LoadGameModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="저장된 게임 불러오기"
      size="lg"
    >
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {savedGames.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>저장된 게임이 없습니다.</p>
          </div>
        ) : (
          savedGames.map((game) => (
            <div
              key={game.gameId}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg',
                'border border-gray-200 dark:border-gray-700',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'transition-colors',
              )}
            >
              {/* 미니 체스판 프리뷰 (간단한 버전) */}
              <div className="w-16 h-16 bg-board-light rounded overflow-hidden flex-shrink-0">
                <div
                  className="w-full h-full flex items-center justify-center text-2xl"
                  title={game.previewFen}
                >
                  ♔♚
                </div>
              </div>

              {/* 게임 정보 */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{game.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{DIFFICULTY_CONFIG[game.state.difficulty].name}</span>
                  <span>•</span>
                  <span>{game.state.moveHistory.length}수</span>
                  <span>•</span>
                  <span>{formatRelativeTime(game.savedAt)}</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(game.gameId)}
                  title="삭제"
                >
                  🗑️
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onLoad(game.gameId);
                    onClose();
                  }}
                >
                  불러오기
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t dark:border-gray-700">
        <Button variant="secondary" onClick={onClose} className="w-full">
          닫기
        </Button>
      </div>
    </Modal>
  );
}
