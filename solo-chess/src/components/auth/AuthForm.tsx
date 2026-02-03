// src/components/auth/AuthForm.tsx
// 로그인/회원가입 폼 컴포넌트

import { useState } from 'react';
import { Button, LoadingSpinner } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';

type AuthMode = 'login' | 'signup';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { signIn, signUp, signInWithGoogle, isLoading, error, clearError } = useAuthStore();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
    setLocalError('');
    setSuccessMessage('');
    clearError();
  };

  const toggleMode = () => {
    resetForm();
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // 유효성 검사
    if (!email.trim() || !password.trim()) {
      setLocalError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (mode === 'signup') {
      if (!username.trim()) {
        setLocalError('사용자명을 입력해주세요.');
        return;
      }

      if (username.length < 3) {
        setLocalError('사용자명은 최소 3자 이상이어야 합니다.');
        return;
      }

      if (password.length < 6) {
        setLocalError('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }

      if (password !== confirmPassword) {
        setLocalError('비밀번호가 일치하지 않습니다.');
        return;
      }

      const result = await signUp(email, password, username);
      if (result.success) {
        if (result.error) {
          // 이메일 확인 필요
          setSuccessMessage(result.error);
        }
      }
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === 'login'
              ? '계정에 로그인하여 멀티플레이어 게임을 즐기세요'
              : '새 계정을 만들어 다른 플레이어와 대결하세요'}
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1"
              >
                사용자명
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="닉네임 (최소 3자)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? '최소 6자 이상' : '비밀번호'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              disabled={isLoading}
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1"
              >
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                disabled={isLoading}
              />
            </div>
          )}

          {/* 에러 메시지 */}
          {(localError || error) && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {localError || error}
            </div>
          )}

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full py-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : mode === 'login' ? (
              '로그인'
            ) : (
              '회원가입'
            )}
          </Button>
        </form>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
              또는
            </span>
          </div>
        </div>

        {/* Google 로그인 버튼 */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Google 아이콘 */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Google로 계속하기
          </span>
        </button>

        {/* 모드 전환 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
              disabled={isLoading}
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
