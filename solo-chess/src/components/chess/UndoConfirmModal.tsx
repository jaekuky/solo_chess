// src/components/chess/UndoConfirmModal.tsx

import { Modal, Button } from '@/components/common';

interface UndoConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  undoCount: number;
  maxUndos?: number;
}

export function UndoConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  undoCount,
  maxUndos = Infinity,
}: UndoConfirmModalProps) {
  const remainingUndos =
    maxUndos === Infinity ? '무제한' : maxUndos - undoCount;
  const hasUnlimitedUndos = maxUndos === Infinity;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="무르기"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={onConfirm}>무르기</Button>
        </>
      }
    >
      <div className="text-center">
        <span className="text-4xl block mb-4">↩️</span>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          직전 수를 취소하시겠습니까?
        </p>

        {!hasUnlimitedUndos && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm">
              <span className="text-gray-500">사용한 무르기:</span>{' '}
              <span className="font-medium">{undoCount}회</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">남은 무르기:</span>{' '}
              <span className="font-medium text-primary-600">
                {remainingUndos}회
              </span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
