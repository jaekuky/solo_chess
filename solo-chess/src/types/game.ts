// src/types/game.ts

import type { PieceColor, Move, CapturedPieces } from './chess';

// AI 난이도
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'custom';

// 시간 제한 설정
export type TimeControl = 'none' | '10min' | '5min' | '3min' | '1min';

// 게임 상태
export type GameStatus =
  | 'idle'        // 게임 시작 전
  | 'playing'     // 게임 진행 중
  | 'paused'      // 일시 정지
  | 'ended';      // 게임 종료

// 게임 결과
export type GameResult =
  | 'win'         // 플레이어 승리
  | 'lose'        // 플레이어 패배
  | 'draw'        // 무승부
  | null;         // 아직 결과 없음

// 게임 종료 사유
export type GameEndReason =
  | 'checkmate'   // 체크메이트
  | 'stalemate'   // 스테일메이트
  | 'resignation' // 기권
  | 'timeout'     // 시간 초과
  | 'draw_agreement' // 무승부 합의
  | 'insufficient_material' // 기물 부족
  | 'fifty_move_rule' // 50수 규칙
  | 'threefold_repetition' // 3회 반복
  | null;

// 타이머 상태
export interface TimerState {
  whiteTime: number; // 백의 남은 시간 (초)
  blackTime: number; // 흑의 남은 시간 (초)
  isRunning: boolean;
  activeColor: PieceColor | null;
}

// 게임 설정
export interface GameSettings {
  difficulty: Difficulty;
  customDepth?: number; // 커스텀 난이도일 때 AI 탐색 깊이
  playerColor: PieceColor | 'random';
  timeControl: TimeControl;
}

// 게임 상태 (전체)
export interface GameState {
  // 게임 식별
  gameId: string;

  // 체스 상태
  fen: string; // 현재 보드 상태
  pgn: string; // 기보 기록
  moveHistory: Move[];
  capturedPieces: CapturedPieces;

  // 현재 턴
  turn: PieceColor;
  playerColor: PieceColor;

  // 게임 진행 상태
  status: GameStatus;
  result: GameResult;
  endReason: GameEndReason;

  // 설정
  difficulty: Difficulty;
  customDepth?: number;

  // 타이머
  timeControl: TimeControl;
  timer: TimerState | null;

  // 게임 체크 상태
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;

  // UI 상태
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;

  // 힌트
  hintMove: { from: string; to: string } | null;
  hintsUsed: number;

  // 타임스탬프
  startedAt: number | null;
  endedAt: number | null;
}

// 저장된 게임 (진행 중인 게임 저장용)
export interface SavedGame {
  gameId: string;
  name: string;
  state: GameState;
  savedAt: number;
  previewFen: string;
}

// 게임 기록 (완료된 게임 저장용)
export interface GameRecord {
  gameId: string;
  playerColor: PieceColor;
  difficulty: Difficulty;
  result: GameResult;
  endReason: GameEndReason;
  pgn: string;
  moveCount: number;
  duration: number; // 게임 시간 (초)
  hintsUsed: number;
  playedAt: number;
}
