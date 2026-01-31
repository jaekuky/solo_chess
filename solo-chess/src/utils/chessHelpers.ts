// src/utils/chessHelpers.ts

import type { PieceType, PieceColor, Move } from '@/types';

export const PIECE_SYMBOLS: Record<PieceType, Record<PieceColor, string>> = {
  p: { w: '♙', b: '♟' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  r: { w: '♖', b: '♜' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

export const PIECE_NAMES_KO: Record<PieceType, string> = {
  p: '폰',
  n: '나이트',
  b: '비숍',
  r: '룩',
  q: '퀸',
  k: '킹',
};

export const PIECE_NAMES_EN: Record<PieceType, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King',
};

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const COLOR_NAMES: Record<PieceColor, string> = {
  w: '백',
  b: '흑',
};

export function getFenPosition(fen: string): string {
  return fen.split(' ')[0];
}

export function getFenTurn(fen: string): PieceColor {
  const turn = fen.split(' ')[1];
  return turn as PieceColor;
}

export function movesToPgn(moves: Move[]): string {
  let pgn = '';
  moves.forEach((move, index) => {
    if (index % 2 === 0) {
      pgn += `${Math.floor(index / 2) + 1}. `;
    }
    pgn += move.san + ' ';
  });
  return pgn.trim();
}

export function calculateCapturedValue(pieces: PieceType[]): number {
  return pieces.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0);
}

export function calculateMaterialBalance(
  whiteCaptured: PieceType[],
  blackCaptured: PieceType[]
): number {
  const whiteAdvantage = calculateCapturedValue(whiteCaptured);
  const blackAdvantage = calculateCapturedValue(blackCaptured);
  return whiteAdvantage - blackAdvantage;
}

export function squareToIndex(square: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return rank * 8 + file;
}

export function indexToSquare(index: number): string {
  const file = String.fromCharCode(97 + (index % 8));
  const rank = Math.floor(index / 8) + 1;
  return `${file}${rank}`;
}

export function getSquareColor(square: string): 'light' | 'dark' {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return (file + rank) % 2 === 0 ? 'dark' : 'light';
}
