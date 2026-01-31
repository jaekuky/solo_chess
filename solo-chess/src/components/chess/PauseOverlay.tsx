// src/components/chess/PauseOverlay.tsx

import { Button } from '@/components/common';
import { cn } from '@/utils';

interface PauseOverlayProps {
  isVisible: boolean;
  onResume: () => void;
  onSave: () => void;
  onQuit: () => void;
  className?: string;
}

export function PauseOverlay({
  isVisible,
  onResume,
  onSave,
  onQuit,
  className,
}: PauseOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center',
        'bg-black/60 backdrop-blur-sm',
        'animate-fade-in',
        className,
      )}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl text-center max-w-sm mx-4">
        <span className="text-5xl block mb-4">⏸️</span>
        <h3 className="text-xl font-bold mb-2">게임 일시정지</h3>
        <p className="text-gray-500 mb-6">
          잠시 쉬어가세요. 준비되면 계속할 수 있습니다.
        </p>

        <div className="space-y-3">
          <Button onClick={onResume} size="lg" className="w-full">
            ▶️ 계속하기
          </Button>
          <Button onClick={onSave} variant="secondary" className="w-full">
            💾 저장하기
          </Button>
          <Button
            onClick={onQuit}
            variant="ghost"
            className="w-full text-red-500"
          >
            🚪 나가기
          </Button>
        </div>
      </div>
    </div>
  );
}
