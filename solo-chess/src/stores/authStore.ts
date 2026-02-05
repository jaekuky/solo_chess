// src/stores/authStore.ts
// 인증 상태 관리 스토어

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // 인증 상태 초기화
  initialize: () => Promise<void>;

  // 이메일/비밀번호 로그인
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;

  // Google OAuth 로그인
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;

  // 회원가입
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ success: boolean; error?: string }>;

  // 로그아웃
  signOut: () => Promise<void>;

  // 프로필 조회
  fetchProfile: (userId: string) => Promise<void>;

  // 프로필 업데이트
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;

  // 에러 초기화
  clearError: () => void;

  // 내부 상태 설정
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      error: null,

      // 인증 상태 초기화 (앱 시작 시 호출)
      initialize: async () => {
        try {
          set({ isLoading: true });

          // 현재 세션 확인
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) throw error;

          if (session?.user) {
            set({ user: session.user, session });
            await get().fetchProfile(session.user.id);
          }

          // 인증 상태 변경 리스너 설정
          supabase.auth.onAuthStateChange(async (event, session) => {
            set({ user: session?.user ?? null, session });

            if (event === 'SIGNED_IN' && session?.user) {
              await get().fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              set({ profile: null });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // 로그인
      signIn: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ error: error.message });
            return { success: false, error: error.message };
          }

          if (data.user) {
            await get().fetchProfile(data.user.id);
          }

          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : '로그인 실패';
          set({ error: message });
          return { success: false, error: message };
        } finally {
          set({ isLoading: false });
        }
      },

      // Google OAuth 로그인
      signInWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });

          if (error) {
            set({ error: error.message });
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Google 로그인 실패';
          set({ error: message });
          return { success: false, error: message };
        } finally {
          set({ isLoading: false });
        }
      },

      // 회원가입
      signUp: async (email, password, username) => {
        try {
          set({ isLoading: true, error: null });

          // 사용자명 중복 체크 (테이블이 없어도 회원가입 진행)
          try {
            const { data: existingUser, error: checkError } = await supabase
              .from('profiles')
              .select('username')
              .eq('username', username)
              .maybeSingle();

            // 테이블 관련 오류가 아닌 경우에만 중복 체크
            if (!checkError && existingUser) {
              set({ error: '이미 사용 중인 사용자명입니다.' });
              return { success: false, error: '이미 사용 중인 사용자명입니다.' };
            }
          } catch (checkErr) {
            // 테이블이 없거나 기타 오류 - 중복 체크 건너뛰고 진행
            console.warn('Username check skipped:', checkErr);
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
              },
            },
          });

          if (error) {
            set({ error: error.message });
            return { success: false, error: error.message };
          }

          // 회원가입 성공 시 profiles 테이블에 직접 레코드 생성
          // (트리거가 작동하지 않는 경우를 대비)
          if (data.user) {
            try {
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: data.user.id,
                  username: username,
                  rating: 1200,
                  games_played: 0,
                  games_won: 0,
                  games_lost: 0,
                  games_drawn: 0,
                }, {
                  onConflict: 'id',
                  ignoreDuplicates: true,
                });

              if (profileError) {
                console.warn('Profile creation skipped:', profileError.message);
              }
            } catch (profileErr) {
              console.warn('Profile creation error:', profileErr);
            }
          }

          // 이메일 확인이 필요한 경우
          if (data.user && !data.session) {
            return {
              success: true,
              error: '이메일로 전송된 인증 링크를 확인해주세요.',
            };
          }

          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : '회원가입 실패';
          set({ error: message });
          return { success: false, error: message };
        } finally {
          set({ isLoading: false });
        }
      },

      // 로그아웃
      signOut: async () => {
        try {
          set({ isLoading: true });
          await supabase.auth.signOut();
          set({ user: null, session: null, profile: null });
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // 프로필 조회 (없으면 자동 생성)
      fetchProfile: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (error) {
            // 테이블이 없거나 조회 실패 시 조용히 처리
            console.warn('Profile fetch skipped:', error.message);
            return;
          }

          if (data) {
            set({ profile: data });
          } else {
            // 프로필이 없으면 자동 생성 (Google OAuth 등 외부 로그인 대응)
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const username = user.user_metadata?.username || 
                                 user.user_metadata?.name || 
                                 user.email?.split('@')[0] || 
                                 `Player_${userId.slice(0, 8)}`;

                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles')
                  .upsert({
                    id: userId,
                    username: username,
                    rating: 1200,
                    games_played: 0,
                    games_won: 0,
                    games_lost: 0,
                    games_drawn: 0,
                  }, {
                    onConflict: 'id',
                  })
                  .select()
                  .single();

                if (!insertError && newProfile) {
                  set({ profile: newProfile });
                } else {
                  console.warn('Profile auto-creation failed:', insertError?.message);
                }
              }
            } catch (createErr) {
              console.warn('Profile auto-creation error:', createErr);
            }
          }
        } catch (error) {
          console.warn('Profile fetch error:', error);
        }
      },

      // 프로필 업데이트
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) {
          return { success: false, error: '로그인이 필요합니다.' };
        }

        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

          if (error) {
            return { success: false, error: error.message };
          }

          set({ profile: data as Profile });
          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : '프로필 업데이트 실패';
          return { success: false, error: message };
        }
      },

      // 에러 초기화
      clearError: () => set({ error: null }),

      // 내부 상태 설정
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
    }),
    { name: 'AuthStore' }
  )
);
