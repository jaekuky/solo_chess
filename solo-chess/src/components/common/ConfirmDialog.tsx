// src/components/common/ConfirmDialog.tsx

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: { icon: '⚠️', buttonVariant: 'danger' as const },
    warning: { icon: '⚠️', buttonVariant: 'primary' as const },
    info: { icon: 'ℹ️', buttonVariant: 'primary' as const },
  };
  const config = variantConfig[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="text-center">
        <span className="text-4xl mb-4 block">{config.icon}</span>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </Modal>
  );
}
