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

  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

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
