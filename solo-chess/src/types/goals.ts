// src/types/goals.ts
// 목표/알림 시스템 타입 정의

// 목표 주기
export type GoalPeriod = 'daily' | 'weekly' | 'oneTime';

// 목표 측정 지표
export type GoalMetric =
  | 'gamesPlayed'      // 게임 수
  | 'gamesWon'         // 승리 수
  | 'playTime'         // 플레이 시간(분)
  | 'winStreak'        // 연승
  | 'winWithoutHints'  // 힌트 없이 승리
  | 'checkmateWins'    // 체크메이트 승리
  | 'puzzlesSolved'    // 퍼즐 풀이
  | 'advancedWins';    // 고급 난이도 승리

// 목표 상태
export type GoalStatus = 'active' | 'completed' | 'expired';

// 목표 템플릿
export interface GoalTemplate {
  id: string;
  metric: GoalMetric;
  period: GoalPeriod;
  defaultTarget: number;
  minTarget: number;
  maxTarget: number;
  step: number;            // 목표값 조절 단위
  title: string;
  description: string;
  icon: string;
  color: string;
  unit: string;            // 단위 표시 (예: "게임", "분", "회")
}

// 사용자 설정 목표
export interface UserGoal {
  id: string;
  templateId: string;
  metric: GoalMetric;
  period: GoalPeriod;
  targetValue: number;
  currentValue: number;
  status: GoalStatus;
  isEnabled: boolean;      // 활성화 여부
  createdAt: number;
  completedAt: number | null;
  lastResetAt: number;     // 마지막 리셋 시점 (daily/weekly)
  notifiedCompletion: boolean; // 달성 알림 발송 여부
}

// 알림 아이템
export interface GoalNotification {
  id: string;
  goalId: string;
  type: 'goalCompleted' | 'goalProgress' | 'dailyReminder' | 'streakAlert';
  title: string;
  message: string;
  icon: string;
  timestamp: number;
  isRead: boolean;
}

// 목표 진행 요약
export interface GoalProgressSummary {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;
  todayCompletedCount: number;
}

// ═══════ 목표 템플릿 사전정의 ═══════

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // 일일 목표
  {
    id: 'daily-games',
    metric: 'gamesPlayed',
    period: 'daily',
    defaultTarget: 3,
    minTarget: 1,
    maxTarget: 20,
    step: 1,
    title: '오늘의 게임',
    description: '오늘 게임을 플레이하세요',
    icon: '🎮',
    color: '#3b82f6',
    unit: '게임',
  },
  {
    id: 'daily-wins',
    metric: 'gamesWon',
    period: 'daily',
    defaultTarget: 2,
    minTarget: 1,
    maxTarget: 10,
    step: 1,
    title: '오늘의 승리',
    description: '오늘 게임에서 승리하세요',
    icon: '🏆',
    color: '#22c55e',
    unit: '승',
  },
  {
    id: 'daily-playtime',
    metric: 'playTime',
    period: 'daily',
    defaultTarget: 30,
    minTarget: 5,
    maxTarget: 120,
    step: 5,
    title: '오늘의 플레이 시간',
    description: '오늘 체스를 플레이하세요',
    icon: '⏱️',
    color: '#8b5cf6',
    unit: '분',
  },
  {
    id: 'daily-checkmate',
    metric: 'checkmateWins',
    period: 'daily',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 5,
    step: 1,
    title: '오늘의 체크메이트',
    description: '체크메이트로 승리하세요',
    icon: '♚',
    color: '#f59e0b',
    unit: '회',
  },
  {
    id: 'daily-no-hints',
    metric: 'winWithoutHints',
    period: 'daily',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 5,
    step: 1,
    title: '독립 승리',
    description: '힌트 없이 승리하세요',
    icon: '💪',
    color: '#ec4899',
    unit: '회',
  },
  {
    id: 'daily-puzzles',
    metric: 'puzzlesSolved',
    period: 'daily',
    defaultTarget: 3,
    minTarget: 1,
    maxTarget: 20,
    step: 1,
    title: '오늘의 퍼즐',
    description: '퍼즐을 풀어보세요',
    icon: '🧩',
    color: '#06b6d4',
    unit: '문제',
  },
  // 주간 목표
  {
    id: 'weekly-games',
    metric: 'gamesPlayed',
    period: 'weekly',
    defaultTarget: 15,
    minTarget: 5,
    maxTarget: 50,
    step: 5,
    title: '주간 게임',
    description: '이번 주 게임을 플레이하세요',
    icon: '📅',
    color: '#6366f1',
    unit: '게임',
  },
  {
    id: 'weekly-wins',
    metric: 'gamesWon',
    period: 'weekly',
    defaultTarget: 10,
    minTarget: 3,
    maxTarget: 30,
    step: 1,
    title: '주간 승리',
    description: '이번 주 목표 승리 수를 달성하세요',
    icon: '🎯',
    color: '#10b981',
    unit: '승',
  },
  {
    id: 'weekly-streak',
    metric: 'winStreak',
    period: 'weekly',
    defaultTarget: 3,
    minTarget: 2,
    maxTarget: 10,
    step: 1,
    title: '주간 연승',
    description: '이번 주 연승 기록을 세우세요',
    icon: '🔥',
    color: '#f97316',
    unit: '연승',
  },
  {
    id: 'weekly-advanced',
    metric: 'advancedWins',
    period: 'weekly',
    defaultTarget: 1,
    minTarget: 1,
    maxTarget: 10,
    step: 1,
    title: '고급 도전',
    description: '고급 난이도에서 승리하세요',
    icon: '🌳',
    color: '#ef4444',
    unit: '승',
  },
];

// 기본 활성 목표 템플릿 ID들
export const DEFAULT_ACTIVE_GOALS = [
  'daily-games',
  'daily-wins',
  'daily-playtime',
];
