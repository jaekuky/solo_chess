// src/pages/LobbyPage.tsx
// 멀티플레이어 게임 로비 페이지

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LoadingSpinner, Modal } from '@/components/common';
import { AuthForm } from '@/components/auth';
import { useAuthStore } from '@/stores/authStore';
import { useMultiplayerStore, type LobbyGame } from '@/stores/multiplayerStore';
import { ROUTES } from '@/constants';

// 시간 포맷팅
function formatTimeControl(seconds: number | null): string {
  if (!seconds) return '무제한';
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}분`;
  }
  return `${seconds}초`;
}

// 상대 시간 포맷팅
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
}

// 게임방 카드 컴포넌트
function GameRoomCard({
  game,
  onJoin,
  isJoining,
}: {
  game: LobbyGame;
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 아바타 */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
            {game.hostUsername.charAt(0).toUpperCase()}
          </div>

          {/* 정보 */}
          <div>
            <p className="font-semibold">{game.hostUsername}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                ⭐ {game.hostRating}
              </span>
              <span>•</span>
              <span>⏱️ {formatTimeControl(game.timeControl)}</span>
            </div>
          </div>
        </div>

        {/* 참가 버튼 */}
        <div className="flex flex-col items-end gap-1">
          <Button size="sm" onClick={onJoin} disabled={isJoining}>
            {isJoining ? <LoadingSpinner size="sm" /> : '참가'}
          </Button>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(game.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// 새 게임 만들기 모달
function CreateGameModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (timeControl?: number) => void;
  isCreating: boolean;
}) {
  const [timeControl, setTimeControl] = useState<number | undefined>(300); // 기본 5분

  const timeOptions = [
    { value: undefined, label: '무제한' },
    { value: 60, label: '1분' },
    { value: 180, label: '3분' },
    { value: 300, label: '5분' },
    { value: 600, label: '10분' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 게임 만들기">
      <div className="space-y-6">
        {/* 시간 설정 */}
        <div>
          <label className="block text-sm font-medium mb-3">시간 제한</label>
          <div className="grid grid-cols-3 gap-2">
            {timeOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setTimeControl(option.value)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  timeControl === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 안내 */}
        <p className="text-sm text-gray-500 text-center">
          게임을 만들면 다른 플레이어가 참가할 때까지 대기합니다.
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button
            className="flex-1"
            onClick={() => onCreate(timeControl)}
            disabled={isCreating}
          >
            {isCreating ? <LoadingSpinner size="sm" /> : '게임 만들기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function LobbyPage() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

  // 인증 상태
  const { user, profile, isLoading: authLoading, initialize, signOut } = useAuthStore();

  // 멀티플레이어 상태
  const {
    lobbyGames,
    isLoadingLobby,
    isCreatingGame,
    error,
    fetchLobbyGames,
    subscribeLobby,
    unsubscribeLobby,
    createGame,
    joinGame,
    clearError,
  } = useMultiplayerStore();

  // 인증 초기화
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 로비 데이터 로드 및 구독
  useEffect(() => {
    if (user) {
      fetchLobbyGames();
      subscribeLobby();

      return () => {
        unsubscribeLobby();
      };
    }
  }, [user, fetchLobbyGames, subscribeLobby, unsubscribeLobby]);

  // 게임 생성
  const handleCreateGame = async (timeControl?: number) => {
    if (!user) return;

    const result = await createGame(user.id, timeControl);
    if (result.success && result.gameId) {
      setShowCreateModal(false);
      // TODO: 대기 화면으로 이동하거나 게임 화면으로 이동
      navigate(`${ROUTES.MULTIPLAYER_GAME}/${result.gameId}`);
    }
  };

  // 게임 참가
  const handleJoinGame = async (gameId: string) => {
    if (!user) return;

    setJoiningGameId(gameId);
    const result = await joinGame(gameId, user.id);
    setJoiningGameId(null);

    if (result.success) {
      navigate(`${ROUTES.MULTIPLAYER_GAME}/${gameId}`);
    }
  };

  // 로딩 중
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 로그인 안 됨 → 인증 폼 표시
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">멀티플레이어</h1>
          <p className="text-gray-500">
            다른 플레이어와 실시간으로 대결하세요
          </p>
        </div>
        <AuthForm />
      </div>
    );
  }

  // 로그인 됨 → 로비 표시
  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">게임 로비</h1>
          <p className="text-gray-500 text-sm">
            대기 중인 게임에 참가하거나 새 게임을 만드세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 프로필 정보 */}
          <div className="text-right">
            <p className="font-medium">{profile?.username || '플레이어'}</p>
            <p className="text-sm text-gray-500">⭐ {profile?.rating || 1200}</p>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-500">
            ✕
          </button>
        </div>
      )}

      {/* 새 게임 만들기 버튼 */}
      <div className="mb-6">
        <Button
          size="lg"
          className="w-full py-4"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ 새 게임 만들기
        </Button>
      </div>

      {/* 게임 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">대기 중인 게임</h2>
          <button
            onClick={fetchLobbyGames}
            className="text-sm text-primary-600 hover:text-primary-700"
            disabled={isLoadingLobby}
          >
            {isLoadingLobby ? '로딩 중...' : '새로고침'}
          </button>
        </div>

        {isLoadingLobby && lobbyGames.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : lobbyGames.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-4xl mb-3">🎮</p>
            <p className="text-gray-500">대기 중인 게임이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">
              새 게임을 만들어 다른 플레이어를 기다려보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lobbyGames.map((game) => (
              <GameRoomCard
                key={game.id}
                game={game}
                onJoin={() => handleJoinGame(game.id)}
                isJoining={joiningGameId === game.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI 대전 링크 */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-500 mb-2">
          혼자 연습하고 싶으신가요?
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(ROUTES.GAME_SETTINGS)}
        >
          🤖 AI와 대전하기
        </Button>
      </div>

      {/* 새 게임 만들기 모달 */}
      <CreateGameModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGame}
        isCreating={isCreatingGame}
      />
    </div>
  );
}
