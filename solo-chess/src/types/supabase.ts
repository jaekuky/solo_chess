// src/types/supabase.ts
// Supabase 데이터베이스 타입 정의

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GameStatus = 'waiting' | 'playing' | 'finished' | 'abandoned';
export type GameResult = 'white_win' | 'black_win' | 'draw' | null;
export type PlayerColor = 'white' | 'black';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          rating: number;
          games_played: number;
          games_won: number;
          games_lost: number;
          games_drawn: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          rating?: number;
          games_played?: number;
          games_won?: number;
          games_lost?: number;
          games_drawn?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          rating?: number;
          games_played?: number;
          games_won?: number;
          games_lost?: number;
          games_drawn?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          white_player_id: string | null;
          black_player_id: string | null;
          status: GameStatus;
          result: GameResult;
          fen: string;
          pgn: string;
          moves: Json;
          time_control: number | null;
          white_time_remaining: number | null;
          black_time_remaining: number | null;
          current_turn: PlayerColor;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          white_player_id?: string | null;
          black_player_id?: string | null;
          status?: GameStatus;
          result?: GameResult;
          fen?: string;
          pgn?: string;
          moves?: Json;
          time_control?: number | null;
          white_time_remaining?: number | null;
          black_time_remaining?: number | null;
          current_turn?: PlayerColor;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          white_player_id?: string | null;
          black_player_id?: string | null;
          status?: GameStatus;
          result?: GameResult;
          fen?: string;
          pgn?: string;
          moves?: Json;
          time_control?: number | null;
          white_time_remaining?: number | null;
          black_time_remaining?: number | null;
          current_turn?: PlayerColor;
          created_at?: string;
          updated_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      game_status: GameStatus;
      game_result: GameResult;
      player_color: PlayerColor;
    };
  };
}

// 편의를 위한 타입 별칭
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Game = Database['public']['Tables']['games']['Row'];
export type GameInsert = Database['public']['Tables']['games']['Insert'];
export type GameUpdate = Database['public']['Tables']['games']['Update'];
