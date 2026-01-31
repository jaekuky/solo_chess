// src/components/chess/GameControls.tsx

import { cn } from '@/utils';

interface GameControlsProps {
  canUndo: boolean;
  canRedo?: boolean;
  isPlaying: boolean;
  onUndo: () => void;
  onRedo?: () => void;
  onHint?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onResign: () => void;
  onNewGame: () => void;
  onPause?: () => void;
  hintsEnabled?: boolean;
  saveEnabled?: boolean;
  pauseEnabled?: boolean;
  className?: string;
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: string;
  label: string;
  variant?: 'default' | 'danger';
  className?: string;
}

function ControlButton({
  onClick,
  disabled,
  icon,
  label,
  variant = 'default',
  className,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center p-2 rounded-lg transition-all',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'default' && 'hover:bg-gray-100 dark:hover:bg-gray-700',
        variant === 'danger' &&
          'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600',
        className
      )}
      title={label}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

export function GameControls({
  canUndo,
  canRedo = false,
  isPlaying,
  onUndo,
  onRedo,
  onHint,
  onSave,
  onLoad,
  onResign,
  onNewGame,
  onPause,
  hintsEnabled = true,
  saveEnabled = true,
  pauseEnabled = false,
  className,
}: GameControlsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 flex-wrap',
        className
      )}
    >
      <ControlButton
        onClick={onUndo}
        disabled={!canUndo || !isPlaying}
        icon="↩️"
        label="무르기"
      />
      {onRedo && (
        <ControlButton
          onClick={onRedo}
          disabled={!canRedo}
          icon="↪️"
          label="다시"
        />
      )}
      {hintsEnabled && onHint && (
        <ControlButton
          onClick={onHint}
          disabled={!isPlaying}
          icon="💡"
          label="힌트"
        />
      )}
      {pauseEnabled && onPause && (
        <ControlButton
          onClick={onPause}
          disabled={!isPlaying}
          icon="⏸️"
          label="일시정지"
        />
      )}
      {saveEnabled && onSave && (
        <ControlButton
          onClick={onSave}
          disabled={!isPlaying}
          icon="💾"
          label="저장"
        />
      )}
      {onLoad && (
        <ControlButton
          onClick={onLoad}
          icon="📂"
          label="불러오기"
        />
      )}
      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />
      <ControlButton
        onClick={onResign}
        disabled={!isPlaying}
        icon="🏳️"
        label="기권"
        variant="danger"
      />
      <ControlButton onClick={onNewGame} icon="🔄" label="새 게임" />
    </div>
  );
}
