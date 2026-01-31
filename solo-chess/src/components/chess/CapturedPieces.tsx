// src/components/chess/CapturedPieces.tsx

import type { PieceType, PieceColor } from '@/types';
import { PIECE_VALUES } from '@/constants';
import { cn } from '@/utils';

interface CapturedPiecesProps {
  pieces: PieceType[];
  color: PieceColor;
  className?: string;
}

const PIECE_SYMBOLS: Record<PieceType, Record<PieceColor, string>> = {
  p: { w: '♙', b: '♟' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  r: { w: '♖', b: '♜' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

const PIECE_ORDER: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

export function CapturedPieces({
  pieces,
  color,
  className,
}: CapturedPiecesProps) {
  const sortedPieces = [...pieces].sort(
    (a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b)
  );
  const totalValue = pieces.reduce(
    (sum, piece) => sum + (PIECE_VALUES[piece] ?? 0),
    0
  );

  if (pieces.length === 0) {
    return (
      <div
        className={cn(
          'h-8 flex items-center text-gray-400 text-sm',
          className
        )}
      >
        -
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {sortedPieces.map((piece, index) => (
        <span
          key={`${piece}-${index}`}
          className="text-xl opacity-80"
          title={`잡힌 ${color === 'w' ? '백' : '흑'} ${piece}`}
        >
          {PIECE_SYMBOLS[piece][color]}
        </span>
      ))}
      {totalValue > 0 && (
        <span className="ml-2 text-sm text-gray-500">+{totalValue}</span>
      )}
    </div>
  );
}
