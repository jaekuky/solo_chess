-- ============================================
-- Solo Chess 멀티플레이어 Supabase 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 기존 테이블 삭제 (필요한 경우)
-- DROP TABLE IF EXISTS games;
-- DROP TABLE IF EXISTS profiles;

-- ============================================
-- ENUM 타입 생성
-- ============================================

-- 게임 상태 enum
CREATE TYPE game_status AS ENUM ('waiting', 'playing', 'finished', 'abandoned');

-- 게임 결과 enum
CREATE TYPE game_result AS ENUM ('white_win', 'black_win', 'draw');

-- 플레이어 색상 enum
CREATE TYPE player_color AS ENUM ('white', 'black');

-- ============================================
-- profiles 테이블 (사용자 프로필)
-- ============================================

CREATE TABLE profiles (
  -- 기본 키 (Supabase Auth의 user id와 연결)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 사용자 정보
  username VARCHAR(50) NOT NULL UNIQUE,
  avatar_url TEXT,
  
  -- 레이팅 및 통계
  rating INTEGER DEFAULT 1200 NOT NULL,
  games_played INTEGER DEFAULT 0 NOT NULL,
  games_won INTEGER DEFAULT 0 NOT NULL,
  games_lost INTEGER DEFAULT 0 NOT NULL,
  games_drawn INTEGER DEFAULT 0 NOT NULL,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 제약조건
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT rating_positive CHECK (rating >= 0),
  CONSTRAINT games_positive CHECK (
    games_played >= 0 AND 
    games_won >= 0 AND 
    games_lost >= 0 AND 
    games_drawn >= 0
  )
);

-- profiles 테이블 인덱스
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_rating ON profiles(rating DESC);

-- ============================================
-- games 테이블 (게임 데이터)
-- ============================================

CREATE TABLE games (
  -- 기본 키
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 플레이어 정보 (NULL이면 아직 참가자 없음)
  white_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  black_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- 게임 상태
  status game_status DEFAULT 'waiting' NOT NULL,
  result game_result,
  
  -- 체스 데이터
  fen VARCHAR(100) DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' NOT NULL,
  pgn TEXT DEFAULT '' NOT NULL,
  moves JSONB DEFAULT '[]'::jsonb NOT NULL,
  current_turn player_color DEFAULT 'white' NOT NULL,
  
  -- 시간 제어 (초 단위, NULL이면 시간 제한 없음)
  time_control INTEGER,
  white_time_remaining INTEGER,
  black_time_remaining INTEGER,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  
  -- 제약조건
  CONSTRAINT different_players CHECK (
    white_player_id IS NULL OR 
    black_player_id IS NULL OR 
    white_player_id != black_player_id
  ),
  CONSTRAINT time_control_positive CHECK (time_control IS NULL OR time_control > 0)
);

-- games 테이블 인덱스
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_black_player ON games(black_player_id);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_games_waiting ON games(status) WHERE status = 'waiting';

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- profiles 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 프로필 조회 가능
CREATE POLICY "프로필 공개 조회" ON profiles
  FOR SELECT USING (true);

-- 자신의 프로필만 수정 가능
CREATE POLICY "자신의 프로필만 수정" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 자신의 프로필만 생성 가능
CREATE POLICY "자신의 프로필만 생성" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- games 테이블 RLS 활성화
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 게임 조회 가능
CREATE POLICY "게임 공개 조회" ON games
  FOR SELECT USING (true);

-- 인증된 사용자만 게임 생성 가능
CREATE POLICY "인증된 사용자 게임 생성" ON games
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 게임 참가자만 게임 수정 가능
CREATE POLICY "게임 참가자만 수정" ON games
  FOR UPDATE USING (
    auth.uid() = white_player_id OR 
    auth.uid() = black_player_id OR
    (status = 'waiting' AND (white_player_id IS NULL OR black_player_id IS NULL))
  );

-- ============================================
-- 트리거 함수: updated_at 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블에 트리거 적용
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- games 테이블에 트리거 적용
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 트리거 함수: 새 사용자 프로필 자동 생성
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'Player_' || LEFT(NEW.id::text, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 적용
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 실시간 기능 활성화
-- ============================================

-- games 테이블 실시간 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- ============================================
-- 유용한 함수들
-- ============================================

-- 대기 중인 게임 찾기
CREATE OR REPLACE FUNCTION find_waiting_game(player_id UUID)
RETURNS UUID AS $$
DECLARE
  game_id UUID;
BEGIN
  -- 이미 대기 중인 게임이 있는지 확인
  SELECT id INTO game_id
  FROM games
  WHERE status = 'waiting'
    AND white_player_id != player_id
    AND black_player_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  RETURN game_id;
END;
$$ LANGUAGE plpgsql;

-- 플레이어 레이팅 업데이트 함수
CREATE OR REPLACE FUNCTION update_player_rating(
  p_player_id UUID,
  p_opponent_rating INTEGER,
  p_result VARCHAR(10) -- 'win', 'loss', 'draw'
)
RETURNS INTEGER AS $$
DECLARE
  v_player_rating INTEGER;
  v_expected DECIMAL;
  v_score DECIMAL;
  v_k INTEGER := 32; -- K-factor
  v_new_rating INTEGER;
BEGIN
  -- 현재 레이팅 가져오기
  SELECT rating INTO v_player_rating
  FROM profiles
  WHERE id = p_player_id;
  
  -- 예상 승률 계산 (Elo 공식)
  v_expected := 1.0 / (1.0 + POWER(10.0, (p_opponent_rating - v_player_rating) / 400.0));
  
  -- 실제 점수
  v_score := CASE p_result
    WHEN 'win' THEN 1.0
    WHEN 'loss' THEN 0.0
    WHEN 'draw' THEN 0.5
  END;
  
  -- 새 레이팅 계산
  v_new_rating := GREATEST(0, v_player_rating + ROUND(v_k * (v_score - v_expected)));
  
  -- 레이팅 및 통계 업데이트
  UPDATE profiles
  SET 
    rating = v_new_rating,
    games_played = games_played + 1,
    games_won = games_won + CASE WHEN p_result = 'win' THEN 1 ELSE 0 END,
    games_lost = games_lost + CASE WHEN p_result = 'loss' THEN 1 ELSE 0 END,
    games_drawn = games_drawn + CASE WHEN p_result = 'draw' THEN 1 ELSE 0 END
  WHERE id = p_player_id;
  
  RETURN v_new_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 완료!
-- ============================================
-- 이 SQL을 Supabase SQL Editor에서 실행하면
-- 멀티플레이어 체스 게임을 위한 데이터베이스가 준비됩니다.
-- ============================================
