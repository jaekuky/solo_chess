// src/types/chess.ts

// 체스 기물 타입
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

// 기물 색상
export type PieceColor = 'w' | 'b';

// 체스판 위치 (a1 ~ h8)
export type Square =
  | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8'
  | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8'
  | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8'
  | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8'
  | 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8'
  | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8'
  | 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';

// 기물 정보
export interface Piece {
  type: PieceType;
  color: PieceColor;
}

// 이동 정보
export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
  san: string; // Standard Algebraic Notation (예: Nf3, O-O)
  lan: string; // Long Algebraic Notation (예: g1f3)
}

// 잡힌 기물 목록
export interface CapturedPieces {
  white: PieceType[]; // 백이 잡은 기물들 (흑 기물)
  black: PieceType[]; // 흑이 잡은 기물들 (백 기물)
}
