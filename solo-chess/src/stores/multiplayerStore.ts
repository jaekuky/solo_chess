// src/stores/multiplayerStore.ts
// 멀티플레이어 게임 상태 관리

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase, createGameChannel } from '@/lib/supabase';
import type { Game } from '@/types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// 로비에 표시될 게임 정보
export interface LobbyGame {
  id: string;
  hostUsername: string;
  hostRating: number;
  timeControl: number | null;
  createdAt: string;
}

interface MultiplayerState {
  // 로비 상태
  lobbyGames: LobbyGame[];
  isLoadingLobby: boolean;

  // 현재 게임
  currentGame: Game | null;
  gameChannel: RealtimeChannel | null;

  // 상태
  isCreatingGame: boolean;
  isJoiningGame: boolean;
  error: string | null;
}

interface MultiplayerActions {
  // 로비
  fetchLobbyGames: () => Promise<void>;
  subscribeLobby: () => void;
  unsubscribeLobby: () => void;

  // 게임 생성/참가
  createGame: (
    userId: string,
    timeControl?: number
  ) => Promise<{ success: boolean; gameId?: string; error?: string }>;
  joinGame: (
    gameId: string,
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
  leaveGame: () => Promise<void>;

  // 게임 진행
  subscribeToGame: (gameId: string) => void;
  unsubscribeFromGame: () => void;
  sendMove: (move: string, fen: string) => void;
  updateGameState: (updates: Partial<Game>) => Promise<void>;

  // 에러
  clearError: () => void;
}

type MultiplayerStore = MultiplayerState & MultiplayerActions;

let lobbyChannel: RealtimeChannel | null = null;

export const useMultiplayerStore = create<MultiplayerStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      lobbyGames: [],
      isLoadingLobby: false,
      currentGame: null,
      gameChannel: null,
      isCreatingGame: false,
      isJoiningGame: false,
      error: null,

      // 대기 중인 게임 목록 조회
      fetchLobbyGames: async () => {
        try {
          set({ isLoadingLobby: true });

          const { data, error } = await supabase
            .from('games')
            .select(
              `
              id,
              time_control,
              created_at,
              white_player_id
            `
            )
            .eq('status', 'waiting')
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) throw error;

          // 플레이어 ID 목록 추출
          const playerIds = (data || [])
            .map((game: { white_player_id: string | null }) => game.white_player_id)
            .filter((id): id is string => id !== null);

          // 프로필 정보 별도 조회
          let profilesMap: Record<string, { username: string; rating: number }> = {};
          
          if (playerIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, rating')
              .in('id', playerIds);

            if (profiles) {
              profilesMap = profiles.reduce((acc, profile) => {
                acc[profile.id] = { username: profile.username, rating: profile.rating };
                return acc;
              }, {} as Record<string, { username: string; rating: number }>);
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lobbyGames: LobbyGame[] = (data || []).map((game: any) => {
            const profile = game.white_player_id ? profilesMap[game.white_player_id] : null;
            return {
              id: game.id,
              hostUsername: profile?.username || 'Unknown',
              hostRating: profile?.rating || 1200,
              timeControl: game.time_control,
              createdAt: game.created_at,
            };
          });

          set({ lobbyGames });
        } catch (error) {
          console.error('Fetch lobby games error:', error);
          set({ error: '게임 목록을 불러오는데 실패했습니다.' });
        } finally {
          set({ isLoadingLobby: false });
        }
      },

      // 로비 실시간 구독
      subscribeLobby: () => {
        if (lobbyChannel) return;

        lobbyChannel = supabase
          .channel('lobby')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'games',
              filter: 'status=eq.waiting',
            },
            () => {
              // 게임 목록 새로고침
              get().fetchLobbyGames();
            }
          )
          .subscribe();
      },

      // 로비 구독 해제
      unsubscribeLobby: () => {
        if (lobbyChannel) {
          supabase.removeChannel(lobbyChannel);
          lobbyChannel = null;
        }
      },

      // 새 게임 생성
      createGame: async (userId, timeControl) => {
        try {
          set({ isCreatingGame: true, error: null });

          const { data, error } = await supabase
            .from('games')
            .insert({
              white_player_id: userId,
              status: 'waiting',
              time_control: timeControl || null,
              white_time_remaining: timeControl || null,
              black_time_remaining: timeControl || null,
            })
            .select()
            .single();

          if (error) throw error;

          set({ currentGame: data as Game });
          return { success: true, gameId: (data as Game).id };
        } catch (error) {
          const message = error instanceof Error ? error.message : '게임 생성 실패';
          set({ error: message });
          return { success: false, error: message };
        } finally {
          set({ isCreatingGame: false });
        }
      },

      // 게임 참가
      joinGame: async (gameId, userId) => {
        try {
          set({ isJoiningGame: true, error: null });

          // 게임 상태 확인
          const { data: game, error: fetchError } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .single();

          if (fetchError) throw fetchError;

          const gameData = game as Game;

          if (gameData.status !== 'waiting') {
            return { success: false, error: '이미 시작된 게임입니다.' };
          }

          if (gameData.white_player_id === userId) {
            return { success: false, error: '자신의 게임에는 참가할 수 없습니다.' };
          }

          // 게임 참가 및 상태 업데이트
          const { data, error } = await supabase
            .from('games')
            .update({
              black_player_id: userId,
              status: 'playing',
              started_at: new Date().toISOString(),
            })
            .eq('id', gameId)
            .eq('status', 'waiting')
            .select()
            .single();

          if (error) throw error;

          set({ currentGame: data as Game });
          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : '게임 참가 실패';
          set({ error: message });
          return { success: false, error: message };
        } finally {
          set({ isJoiningGame: false });
        }
      },

      // 게임 나가기
      leaveGame: async () => {
        const { currentGame, gameChannel } = get();

        if (gameChannel) {
          supabase.removeChannel(gameChannel);
        }

        if (currentGame && currentGame.status === 'waiting') {
          // 대기 중인 게임이면 삭제
          await supabase.from('games').delete().eq('id', currentGame.id);
        }

        set({ currentGame: null, gameChannel: null });
      },

      // 게임 실시간 구독
      subscribeToGame: (gameId) => {
        const channel = createGameChannel(gameId)
          .on('broadcast', { event: 'game_move' }, (payload) => {
            console.log('Received move:', payload);
            // 이동 처리는 게임 컴포넌트에서 처리
          })
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'games',
              filter: `id=eq.${gameId}`,
            },
            (payload) => {
              set({ currentGame: payload.new as Game });
            }
          )
          .subscribe();

        set({ gameChannel: channel });
      },

      // 게임 구독 해제
      unsubscribeFromGame: () => {
        const { gameChannel } = get();
        if (gameChannel) {
          supabase.removeChannel(gameChannel);
          set({ gameChannel: null });
        }
      },

      // 이동 브로드캐스트
      sendMove: (move, fen) => {
        const { gameChannel, currentGame } = get();
        if (gameChannel && currentGame) {
          gameChannel.send({
            type: 'broadcast',
            event: 'game_move',
            payload: {
              gameId: currentGame.id,
              move,
              fen,
              timestamp: Date.now(),
            },
          });
        }
      },

      // 게임 상태 업데이트
      updateGameState: async (updates) => {
        const { currentGame } = get();
        if (!currentGame) return;

        try {
          const { data, error } = await supabase
            .from('games')
            .update(updates)
            .eq('id', currentGame.id)
            .select()
            .single();

          if (error) throw error;
          set({ currentGame: data as Game });
        } catch (error) {
          console.error('Update game state error:', error);
        }
      },

      // 에러 초기화
      clearError: () => set({ error: null }),
    }),
    { name: 'MultiplayerStore' }
  )
);
