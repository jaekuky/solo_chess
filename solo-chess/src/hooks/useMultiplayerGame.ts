// src/hooks/useMultiplayerGame.ts
// 실시간 멀티플레이어 게임 훅

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import type { PieceSymbol } from 'chess.js';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Square, PieceColor, Move } from '@/types';
import type { Game, Profile } from '@/types/supabase';
import { playMoveSound, playGameEndSound, playSound } from '@/utils/sounds';
import { INITIAL_FEN } from '@/constants';

type GameResult = 'win' | 'lose' | 'draw';
type GameEndReason =
  | 'checkmate'
  | 'resignation'
  | 'timeout'
  | 'stalemate'
  | 'draw_agreement'
  | 'threefold_repetition'
  | 'insufficient_material'
  | 'fifty_move_rule'
  | 'abandoned';

interface UseMultiplayerGameOptions {
  gameId: string;
  userId: string;
  onGameEnd?: (result: GameResult, reason: GameEndReason) => void;
}

interface MultiplayerGameState {
  game: Game | null;
  fen: string;
  turn: PieceColor;
  moveHistory: Move[];
  myColor: PieceColor | null;
  isMyTurn: boolean;
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isLoading: boolean;
  isConnected: boolean;
  opponent: Profile | null;
  error: string | null;
}

interface MultiplayerGameActions {
  makeMove: (from: Square, to: Square, promotion?: string) => Promise<boolean>;
  resign: () => Promise<void>;
  offerDraw: () => void;
  getLegalMoves: (square: Square) => Square[];
  isValidMove: (from: Square, to: Square) => boolean;
  disconnect: () => void;
}

export function useMultiplayerGame(
  options: UseMultiplayerGameOptions
): [MultiplayerGameState, MultiplayerGameActions] {
  const { gameId, userId, onGameEnd } = options;

  // 게임 인스턴스
  const gameRef = useRef(new Chess());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 상태
  const [gameData, setGameData] = useState<Game | null>(null);
  const [fen, setFen] = useState(INITIAL_FEN);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [myColor, setMyColor] = useState<PieceColor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [opponent, setOpponent] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chess = gameRef.current;
  const turn = (chess.turn() as PieceColor) || 'w';
  const isMyTurn = myColor === turn;
  const isGameOver = chess.isGameOver();
  const isCheck = chess.isCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isDraw = chess.isDraw();

  // 게임 데이터 로드
  const loadGame = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      setGameData(game as Game);

      // 내 색상 결정
      const gameTyped = game as Game;
      if (gameTyped.white_player_id === userId) {
        setMyColor('w');
      } else if (gameTyped.black_player_id === userId) {
        setMyColor('b');
      }

      // 체스 게임 상태 설정
      gameRef.current = new Chess(gameTyped.fen);
      setFen(gameTyped.fen);

      // 이동 기록 복원
      const moves = gameTyped.moves as unknown as Move[];
      if (Array.isArray(moves)) {
        setMoveHistory(moves);
      }

      // 상대방 프로필 로드
      const opponentId =
        gameTyped.white_player_id === userId
          ? gameTyped.black_player_id
          : gameTyped.white_player_id;

      if (opponentId) {
        const { data: opponentData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', opponentId)
          .single();

        if (opponentData) {
          setOpponent(opponentData as Profile);
        }
      }
    } catch (err) {
      console.error('Load game error:', err);
      setError('게임을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, userId]);

  // 실시간 구독 설정
  const setupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) return;

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const newGame = payload.new as Game;
          setGameData(newGame);

          // 체스 상태 업데이트 (상대방이 움직였을 때)
          if (newGame.fen !== gameRef.current.fen()) {
            gameRef.current = new Chess(newGame.fen);
            setFen(newGame.fen);

            const moves = newGame.moves as unknown as Move[];
            if (Array.isArray(moves) && moves.length > 0) {
              setMoveHistory(moves);

              // 마지막 이동 사운드 재생 (상대방 이동)
              const lastMove = moves[moves.length - 1];
              if (lastMove && lastMove.color !== myColor) {
                playMoveSound(lastMove);
              }
            }

            // 게임 종료 체크
            if (newGame.status === 'finished' && newGame.result) {
              handleGameEndFromDB(newGame);
            }
          }
        }
      )
      .on('broadcast', { event: 'move' }, (payload) => {
        // 실시간 이동 브로드캐스트 처리 (더 빠른 반응)
        const { fen: newFen, move } = payload.payload as {
          fen: string;
          move: Move;
        };

        if (newFen !== gameRef.current.fen() && move.color !== myColor) {
          gameRef.current = new Chess(newFen);
          setFen(newFen);
          setMoveHistory((prev) => [...prev, move]);
          playMoveSound(move);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, myColor]);

  // DB에서 게임 종료 처리
  const handleGameEndFromDB = useCallback(
    (game: Game) => {
      let result: GameResult = 'draw';

      if (game.result === 'white_win') {
        result = myColor === 'w' ? 'win' : 'lose';
      } else if (game.result === 'black_win') {
        result = myColor === 'b' ? 'win' : 'lose';
      }

      playGameEndSound(result);
      onGameEnd?.(result, 'checkmate');
    },
    [myColor, onGameEnd]
  );

  // 이동 실행
  const makeMove = useCallback(
    async (from: Square, to: Square, promotion?: string): Promise<boolean> => {
      if (!isMyTurn || isGameOver || !gameData) {
        playSound('illegal');
        return false;
      }

      const chess = gameRef.current;

      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotion as PieceSymbol | undefined,
        });

        if (!moveResult) {
          playSound('illegal');
          return false;
        }

        const move: Move = {
          from: moveResult.from as Square,
          to: moveResult.to as Square,
          piece: moveResult.piece as Move['piece'],
          color: moveResult.color as PieceColor,
          captured: moveResult.captured as Move['captured'],
          promotion: moveResult.promotion as Move['promotion'],
          flags: moveResult.flags,
          san: moveResult.san,
          lan: moveResult.lan,
        };

        // 사운드 재생
        playMoveSound(move);

        // 로컬 상태 업데이트 (즉시 반영)
        const newFen = chess.fen();
        setFen(newFen);
        const newMoveHistory = [...moveHistory, move];
        setMoveHistory(newMoveHistory);

        // 브로드캐스트 (상대방에게 빠르게 전달)
        channelRef.current?.send({
          type: 'broadcast',
          event: 'move',
          payload: { fen: newFen, move },
        });

        // 게임 종료 체크
        let gameUpdate: Record<string, unknown> = {
          fen: newFen,
          pgn: newMoveHistory.map((m) => m.san).join(' '),
          moves: newMoveHistory,
          current_turn: chess.turn() === 'w' ? 'white' : 'black',
        };

        if (chess.isGameOver()) {
          let result: 'white_win' | 'black_win' | 'draw' = 'draw';

          if (chess.isCheckmate()) {
            // 현재 턴의 플레이어가 체크메이트 당함
            result = chess.turn() === 'w' ? 'black_win' : 'white_win';
          }

          gameUpdate = {
            ...gameUpdate,
            status: 'finished',
            result,
            finished_at: new Date().toISOString(),
          };

          // 전적 업데이트
          await updatePlayerRatings(result);
        }

        // DB에 저장
        await supabase.from('games').update(gameUpdate).eq('id', gameId);

        return true;
      } catch (err) {
        console.error('Move error:', err);
        playSound('illegal');
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMyTurn, isGameOver, gameData, moveHistory, gameId]
  );

  // 전적 업데이트
  const updatePlayerRatings = useCallback(
    async (result: 'white_win' | 'black_win' | 'draw') => {
      if (!gameData) return;

      const whiteId = gameData.white_player_id;
      const blackId = gameData.black_player_id;

      if (!whiteId || !blackId) return;

      try {
        // 각 플레이어의 결과 결정
        let whiteResult: 'win' | 'loss' | 'draw';
        let blackResult: 'win' | 'loss' | 'draw';

        if (result === 'white_win') {
          whiteResult = 'win';
          blackResult = 'loss';
        } else if (result === 'black_win') {
          whiteResult = 'loss';
          blackResult = 'win';
        } else {
          whiteResult = 'draw';
          blackResult = 'draw';
        }

        // 상대 레이팅 조회
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, rating')
          .in('id', [whiteId, blackId]);

        if (!profiles || profiles.length !== 2) return;

        const whiteProfile = profiles.find((p) => p.id === whiteId);
        const blackProfile = profiles.find((p) => p.id === blackId);

        if (!whiteProfile || !blackProfile) return;

        // 레이팅 업데이트 함수 호출 (서버 사이드 함수 사용)
        await supabase.rpc('update_player_rating', {
          p_player_id: whiteId,
          p_opponent_rating: blackProfile.rating,
          p_result: whiteResult,
        });

        await supabase.rpc('update_player_rating', {
          p_player_id: blackId,
          p_opponent_rating: whiteProfile.rating,
          p_result: blackResult,
        });
      } catch (err) {
        console.error('Rating update error:', err);
      }
    },
    [gameData]
  );

  // 기권
  const resign = useCallback(async () => {
    if (!gameData || !myColor) return;

    const result = myColor === 'w' ? 'black_win' : 'white_win';

    await supabase
      .from('games')
      .update({
        status: 'finished',
        result,
        finished_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    await updatePlayerRatings(result);

    playGameEndSound('lose');
    onGameEnd?.('lose', 'resignation');
  }, [gameData, myColor, gameId, updatePlayerRatings, onGameEnd]);

  // 무승부 제안 (간단한 구현)
  const offerDraw = useCallback(() => {
    // TODO: 실제 구현 시 상대방 승인 로직 추가
    console.log('Draw offered');
  }, []);

  // 합법적인 이동 조회
  const getLegalMoves = useCallback((square: Square): Square[] => {
    const chess = gameRef.current;
    const moves = chess.moves({ square, verbose: true });
    return moves.map((m) => m.to as Square);
  }, []);

  // 유효한 이동인지 확인
  const isValidMove = useCallback((from: Square, to: Square): boolean => {
    const chess = gameRef.current;
    const moves = chess.moves({ square: from, verbose: true });
    return moves.some((m) => m.to === to);
  }, []);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // 초기화
  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // 게임 로드 후 실시간 구독
  useEffect(() => {
    if (gameData && !isLoading) {
      setupRealtimeSubscription();
    }

    return () => {
      disconnect();
    };
  }, [gameData, isLoading, setupRealtimeSubscription, disconnect]);

  // 게임 시작 사운드
  useEffect(() => {
    if (gameData?.status === 'playing' && !isLoading) {
      playSound('gameStart');
    }
  }, [gameData?.status, isLoading]);

  const state: MultiplayerGameState = {
    game: gameData,
    fen,
    turn,
    moveHistory,
    myColor,
    isMyTurn,
    isGameOver,
    isCheck,
    isCheckmate,
    isStalemate,
    isDraw,
    isLoading,
    isConnected,
    opponent,
    error,
  };

  const actions: MultiplayerGameActions = {
    makeMove,
    resign,
    offerDraw,
    getLegalMoves,
    isValidMove,
    disconnect,
  };

  return [state, actions];
}
