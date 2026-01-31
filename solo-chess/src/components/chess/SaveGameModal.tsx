// src/components/chess/SaveGameModal.tsx

import { useState, useCallback } from 'react';
import { Modal, Button } from '@/components/common';
import { cn } from '@/utils';

interface SaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
}

export function SaveGameModal({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
}: SaveGameModalProps) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('게임 이름을 입력해주세요.');
      return;
    }

    if (trimmedName.length > 50) {
      setError('게임 이름은 50자 이하로 입력해주세요.');
      return;
    }

    onSave(trimmedName);
    setName('');
    setError(null);
  }, [name, onSave]);

  const handleClose = useCallback(() => {
    setName('');
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="게임 저장"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="game-name" className="block text-sm font-medium mb-1">
            게임 이름
          </label>
          <input
            id="game-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            placeholder="예: 첫 번째 승리 직전"
            className={cn(
              'w-full px-3 py-2 border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'dark:bg-gray-700 dark:border-gray-600',
              error && 'border-red-500',
            )}
            autoFocus
          />
          {error && (
            <p className="mt-1 text-sm text-red-500">{error}</p>
          )}
        </div>

        <p className="text-sm text-gray-500">
          저장된 게임은 나중에 이어서 플레이할 수 있습니다.
        </p>
      </div>
    </Modal>
  );
}
