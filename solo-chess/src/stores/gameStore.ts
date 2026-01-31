// src/stores/gameStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  GameState,
  GameSettings,
  GameStatus,
  GameResult,
  GameEndReason,
  Move,
  CapturedPieces,
} from '@/types';
import { INITIAL_FEN } from '@/constants';

// 헬퍼 함수
function getTimeControlSeconds(timeControl: string): number {
  const map: Record<string, number> = {
    '10min': 600,
    '5min': 300,
    '3min': 180,
    '1min': 60,
  };
  return map[timeControl] ?? 600;
}

// 게임 상태 초기값
const initialGameState: GameState = {
  gameId: '',
  fen: INITIAL_FEN,
  pgn: '',
  moveHistory: [],
  capturedPieces: { white: [], black: [] },
  turn: 'w',
  playerColor: 'w',
  status: 'idle',
  result: null,
  endReason: null,
  difficulty: 'beginner',
  timeControl: 'none',
  timer: null,
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  hintMove: null,
  hintsUsed: 0,
  startedAt: null,
  endedAt: null,
};

// 스토어 인터페이스
interface GameStore {
  // 상태
  game: GameState;

  // 게임 시작/종료
  startNewGame: (settings: GameSettings) => void;
  loadSavedGame: (state: GameState) => void;
  resetGame: () => void;
  endGame: (
    result: GameResult,
    reason: GameEndReason,
    stateOverrides?: Partial<Pick<GameState, 'fen' | 'moveHistory' | 'pgn'>>,
  ) => void;

  // 게임 진행
  setStatus: (status: GameStatus) => void;
  updateFen: (fen: string) => void;
  addMove: (move: Move) => void;
  undoMove: () => void;

  // UI 상태
  selectSquare: (square: string | null) => void;
  setLegalMoves: (moves: string[]) => void;
  setLastMove: (move: { from: string; to: string } | null) => void;
  setHintMove: (move: { from: string; to: string } | null) => void;

  // 체크 상태
  setCheckState: (state: {
    isCheck: boolean;
    isCheckmate: boolean;
    isStalemate: boolean;
    isDraw: boolean;
  }) => void;

  // 타이머
  updateTimer: (whiteTime: number, blackTime: number) => void;

  // 잡힌 기물
  setCapturedPieces: (captured: CapturedPieces) => void;

  // 기보
  updateMoveHistory: (moves: Move[]) => void;
  setPgn: (pgn: string) => void;
}

// 스토어 생성
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set) => ({
        game: initialGameState,

        startNewGame: (settings) => {
          const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          const playerColor =
            settings.playerColor === 'random'
              ? Math.random() > 0.5
                ? 'w'
                : 'b'
              : settings.playerColor;

          set({
            game: {
              ...initialGameState,
              gameId,
              playerColor,
              difficulty: settings.difficulty,
              customDepth: settings.customDepth,
              timeControl: settings.timeControl,
              status: 'playing',
              startedAt: Date.now(),
              timer:
                settings.timeControl !== 'none'
                  ? {
                      whiteTime: getTimeControlSeconds(settings.timeControl),
                      blackTime: getTimeControlSeconds(settings.timeControl),
                      isRunning: true,
                      activeColor: 'w',
                    }
                  : null,
            },
          });
        },

        loadSavedGame: (state) => {
          set({
            game: {
              ...state,
              status: 'playing',
              selectedSquare: null,
              legalMoves: [],
              hintMove: null,
            },
          });
        },

        resetGame: () => {
          set({ game: initialGameState });
        },

        endGame: (result, reason, stateOverrides) => {
          set((state) => ({
            game: {
              ...state.game,
              ...stateOverrides,
              status: 'ended',
              result,
              endReason: reason,
              endedAt: Date.now(),
            },
          }));
        },

        setStatus: (status) => {
          set((state) => ({
            game: { ...state.game, status },
          }));
        },

        updateFen: (fen) => {
          set((state) => ({
            game: { ...state.game, fen },
          }));
        },

        addMove: (move) => {
          set((state) => ({
            game: {
              ...state.game,
              moveHistory: [...state.game.moveHistory, move],
              turn: state.game.turn === 'w' ? 'b' : 'w',
            },
          }));
        },

        undoMove: () => {
          set((state) => {
            const newHistory = [...state.game.moveHistory];
            newHistory.pop(); // 사용자의 수 취소
            newHistory.pop(); // AI의 수 취소 (있다면)

            return {
              game: {
                ...state.game,
                moveHistory: newHistory,
              },
            };
          });
        },

        selectSquare: (square) => {
          set((state) => ({
            game: { ...state.game, selectedSquare: square },
          }));
        },

        setLegalMoves: (moves) => {
          set((state) => ({
            game: { ...state.game, legalMoves: moves },
          }));
        },

        setLastMove: (move) => {
          set((state) => ({
            game: { ...state.game, lastMove: move },
          }));
        },

        setHintMove: (move) => {
          set((state) => ({
            game: {
              ...state.game,
              hintMove: move,
              hintsUsed: move ? state.game.hintsUsed + 1 : state.game.hintsUsed,
            },
          }));
        },

        setCheckState: (checkState) => {
          set((state) => ({
            game: { ...state.game, ...checkState },
          }));
        },

        updateTimer: (whiteTime, blackTime) => {
          set((state) => ({
            game: {
              ...state.game,
              timer: state.game.timer
                ? { ...state.game.timer, whiteTime, blackTime }
                : null,
            },
          }));
        },

        setCapturedPieces: (captured) => {
          set((state) => ({
            game: { ...state.game, capturedPieces: captured },
          }));
        },

        updateMoveHistory: (moves) => {
          set((state) => ({
            game: { ...state.game, moveHistory: moves },
          }));
        },

        setPgn: (pgn) => {
          set((state) => ({
            game: { ...state.game, pgn },
          }));
        },
      }),
      {
        name: 'solo-chess-game',
        partialize: (state) => ({
          game:
            state.game.status === 'playing' ? state.game : initialGameState,
        }),
      }
    ),
    { name: 'GameStore' }
  )
);
