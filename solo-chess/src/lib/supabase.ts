// src/lib/supabase.ts
// Supabase 클라이언트 설정

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public', any> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// 실시간 구독을 위한 채널 생성 헬퍼
export const createGameChannel = (gameId: string) => {
  return supabase.channel(`game:${gameId}`, {
    config: {
      broadcast: {
        self: true,
      },
      presence: {
        key: gameId,
      },
    },
  });
};

// 게임 상태 브로드캐스트 타입
export type GameBroadcast = {
  type: 'broadcast';
  event: 'game_move' | 'game_state' | 'player_joined' | 'player_left';
  payload: {
    gameId: string;
    playerId: string;
    move?: string;
    fen?: string;
    timestamp: number;
  };
};

export default supabase;
