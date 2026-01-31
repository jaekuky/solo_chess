// src/components/chess/PromotionModal.tsx

import type { PieceSymbol } from 'chess.js';
import type { PieceColor } from '@/types';
import { cn } from '@/utils';

interface PromotionModalProps {
  isOpen: boolean;
  color: PieceColor;
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

const PROMOTION_PIECES: {
  piece: PieceSymbol;
  name: string;
  symbol: Record<PieceColor, string>;
}[] = [
  { piece: 'q', name: '퀸', symbol: { w: '♕', b: '♛' } },
  { piece: 'r', name: '룩', symbol: { w: '♖', b: '♜' } },
  { piece: 'b', name: '비숍', symbol: { w: '♗', b: '♝' } },
  { piece: 'n', name: '나이트', symbol: { w: '♘', b: '♞' } },
];

export function PromotionModal({
  isOpen,
  color,
  onSelect,
  onCancel,
}: PromotionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-center mb-4">
          승격할 기물을 선택하세요
        </h3>
        <div className="flex gap-2">
          {PROMOTION_PIECES.map(({ piece, name, symbol }) => (
            <button
              key={piece}
              type="button"
              onClick={() => onSelect(piece)}
              className={cn(
                'w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-all',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'border-2 border-transparent hover:border-primary-500'
              )}
              title={name}
            >
              <span className="text-4xl">{symbol[color]}</span>
              <span className="text-xs text-gray-500 mt-1">{name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          취소
        </button>
      </div>
    </div>
  );
}
