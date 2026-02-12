// src/stores/goalStore.ts
// 목표 관리 Zustand 스토어

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  type UserGoal,
  type GoalNotification,
  type GoalMetric,
  type GoalPeriod,
  type GoalProgressSummary,
  GOAL_TEMPLATES,
  DEFAULT_ACTIVE_GOALS,
} from '@/types/goals';
import { storage } from '@/utils/storage';

/* ═══════ 유틸리티 ═══════ */

function generateId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStartOfDay(timestamp: number = Date.now()): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getStartOfWeek(timestamp: number = Date.now()): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=일 ~ 6=토
  const diff = day === 0 ? 6 : day - 1; // 월요일 기준
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

function needsReset(goal: UserGoal): boolean {
  const now = Date.now();
  if (goal.period === 'daily') {
    return getStartOfDay(goal.lastResetAt) < getStartOfDay(now);
  }
  if (goal.period === 'weekly') {
    return getStartOfWeek(goal.lastResetAt) < getStartOfWeek(now);
  }
  return false;
}

/** 게임 기록 기반으로 metric 현재값 계산 */
function computeMetricValue(
  metric: GoalMetric,
  period: GoalPeriod,
  resetTimestamp: number
): number {
  const records = storage.getGameRecords();
  const cutoff = resetTimestamp;
  const periodRecords = records.filter((r) => r.playedAt >= cutoff);

  switch (metric) {
    case 'gamesPlayed':
      return periodRecords.length;
    case 'gamesWon':
      return periodRecords.filter((r) => r.result === 'win').length;
    case 'playTime':
      return Math.floor(
        periodRecords.reduce((sum, r) => sum + r.duration, 0) / 60
      ); // 분
    case 'winStreak': {
      // 현재 기간 내 최대 연승
      let maxStreak = 0;
      let current = 0;
      const sorted = [...periodRecords].sort(
        (a, b) => a.playedAt - b.playedAt
      );
      for (const r of sorted) {
        if (r.result === 'win') {
          current++;
          maxStreak = Math.max(maxStreak, current);
        } else {
          current = 0;
        }
      }
      return maxStreak;
    }
    case 'winWithoutHints':
      return periodRecords.filter(
        (r) => r.result === 'win' && r.hintsUsed === 0
      ).length;
    case 'checkmateWins':
      return periodRecords.filter(
        (r) => r.result === 'win' && r.endReason === 'checkmate'
      ).length;
    case 'advancedWins':
      return periodRecords.filter(
        (r) => r.result === 'win' && r.difficulty === 'advanced'
      ).length;
    case 'puzzlesSolved':
      // 퍼즐은 별도 추적이 어려우므로 learning store에서 가져오는 게 이상적
      // 여기서는 간단히 0 반환 (별도 업데이트로 처리)
      return 0;
    default:
      return 0;
  }
}

/* ═══════ Store Interface ═══════ */

interface GoalStore {
  goals: UserGoal[];
  notifications: GoalNotification[];
  isInitialized: boolean;

  // 초기화
  initializeDefaults: () => void;

  // 목표 CRUD
  addGoal: (templateId: string, targetValue?: number) => void;
  removeGoal: (goalId: string) => void;
  updateGoalTarget: (goalId: string, targetValue: number) => void;
  toggleGoal: (goalId: string) => void;

  // 진행도 업데이트
  refreshAllGoals: () => void;
  incrementMetric: (metric: GoalMetric, amount?: number) => void;

  // 알림
  addNotification: (notification: Omit<GoalNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;

  // 조회
  getActiveGoals: () => UserGoal[];
  getDailyGoals: () => UserGoal[];
  getWeeklyGoals: () => UserGoal[];
  getProgressSummary: () => GoalProgressSummary;
  getNewlyCompleted: () => UserGoal[];

  // 리셋
  resetAllGoals: () => void;
}

/* ═══════ Store Implementation ═══════ */

export const useGoalStore = create<GoalStore>()(
  devtools(
    persist(
      (set, get) => ({
        goals: [],
        notifications: [],
        isInitialized: false,

        // ─── 기본 목표 초기화 ───
        initializeDefaults: () => {
          const state = get();
          if (state.isInitialized) return;

          const now = Date.now();
          const defaults: UserGoal[] = DEFAULT_ACTIVE_GOALS.map(
            (templateId) => {
              const template = GOAL_TEMPLATES.find(
                (t) => t.id === templateId
              );
              if (!template) return null;

              const resetAt =
                template.period === 'daily'
                  ? getStartOfDay(now)
                  : getStartOfWeek(now);

              return {
                id: generateId(),
                templateId: template.id,
                metric: template.metric,
                period: template.period,
                targetValue: template.defaultTarget,
                currentValue: 0,
                status: 'active' as const,
                isEnabled: true,
                createdAt: now,
                completedAt: null,
                lastResetAt: resetAt,
                notifiedCompletion: false,
              };
            }
          ).filter(Boolean) as UserGoal[];

          set({ goals: defaults, isInitialized: true });
        },

        // ─── 목표 추가 ───
        addGoal: (templateId, targetValue) => {
          const template = GOAL_TEMPLATES.find((t) => t.id === templateId);
          if (!template) return;

          // 동일 템플릿 중복 방지
          const existing = get().goals.find(
            (g) => g.templateId === templateId
          );
          if (existing) return;

          const now = Date.now();
          const resetAt =
            template.period === 'daily'
              ? getStartOfDay(now)
              : template.period === 'weekly'
                ? getStartOfWeek(now)
                : now;

          const goal: UserGoal = {
            id: generateId(),
            templateId: template.id,
            metric: template.metric,
            period: template.period,
            targetValue: targetValue ?? template.defaultTarget,
            currentValue: computeMetricValue(
              template.metric,
              template.period,
              resetAt
            ),
            status: 'active',
            isEnabled: true,
            createdAt: now,
            completedAt: null,
            lastResetAt: resetAt,
            notifiedCompletion: false,
          };

          // 이미 달성했는지 확인
          if (goal.currentValue >= goal.targetValue) {
            goal.status = 'completed';
            goal.completedAt = now;
          }

          set((state) => ({ goals: [...state.goals, goal] }));
        },

        // ─── 목표 삭제 ───
        removeGoal: (goalId) => {
          set((state) => ({
            goals: state.goals.filter((g) => g.id !== goalId),
          }));
        },

        // ─── 목표값 변경 ───
        updateGoalTarget: (goalId, targetValue) => {
          set((state) => ({
            goals: state.goals.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    targetValue,
                    status:
                      g.currentValue >= targetValue ? 'completed' : 'active',
                    completedAt:
                      g.currentValue >= targetValue
                        ? g.completedAt ?? Date.now()
                        : null,
                  }
                : g
            ),
          }));
        },

        // ─── 목표 활성화/비활성화 ───
        toggleGoal: (goalId) => {
          set((state) => ({
            goals: state.goals.map((g) =>
              g.id === goalId ? { ...g, isEnabled: !g.isEnabled } : g
            ),
          }));
        },

        // ─── 전체 목표 진행도 갱신 ───
        refreshAllGoals: () => {
          const now = Date.now();

          set((state) => ({
            goals: state.goals.map((goal) => {
              if (!goal.isEnabled) return goal;

              // 리셋 필요 여부 확인
              if (needsReset(goal)) {
                const newResetAt =
                  goal.period === 'daily'
                    ? getStartOfDay(now)
                    : getStartOfWeek(now);

                const newValue = computeMetricValue(
                  goal.metric,
                  goal.period,
                  newResetAt
                );

                return {
                  ...goal,
                  currentValue: newValue,
                  status:
                    newValue >= goal.targetValue
                      ? ('completed' as const)
                      : ('active' as const),
                  completedAt:
                    newValue >= goal.targetValue ? now : null,
                  lastResetAt: newResetAt,
                  notifiedCompletion: false,
                };
              }

              // 현재값 갱신
              const newValue = computeMetricValue(
                goal.metric,
                goal.period,
                goal.lastResetAt
              );

              const wasCompleted = goal.status === 'completed';
              const isNowCompleted = newValue >= goal.targetValue;

              return {
                ...goal,
                currentValue: newValue,
                status: isNowCompleted
                  ? ('completed' as const)
                  : ('active' as const),
                completedAt:
                  isNowCompleted && !wasCompleted
                    ? now
                    : goal.completedAt,
                // 새로 달성된 경우 알림 플래그 리셋
                notifiedCompletion: wasCompleted
                  ? goal.notifiedCompletion
                  : false,
              };
            }),
          }));
        },

        // ─── 특정 metric 증가 (퍼즐 등 수동 추적용) ───
        incrementMetric: (metric, amount = 1) => {
          set((state) => ({
            goals: state.goals.map((goal) => {
              if (goal.metric !== metric || !goal.isEnabled) return goal;

              const newValue = goal.currentValue + amount;
              const isNowCompleted = newValue >= goal.targetValue;

              return {
                ...goal,
                currentValue: newValue,
                status: isNowCompleted
                  ? ('completed' as const)
                  : goal.status,
                completedAt:
                  isNowCompleted && goal.status !== 'completed'
                    ? Date.now()
                    : goal.completedAt,
              };
            }),
          }));
        },

        // ─── 알림 추가 ───
        addNotification: (notification) => {
          const newNotification: GoalNotification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            isRead: false,
          };

          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(
              0,
              50
            ), // 최대 50개
          }));
        },

        // ─── 알림 읽음 처리 ───
        markNotificationRead: (notificationId) => {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          }));
        },

        // ─── 알림 전체 삭제 ───
        clearNotifications: () => {
          set({ notifications: [] });
        },

        // ─── 읽지 않은 알림 수 ───
        getUnreadCount: () => {
          return get().notifications.filter((n) => !n.isRead).length;
        },

        // ─── 활성 목표 조회 ───
        getActiveGoals: () => {
          return get().goals.filter((g) => g.isEnabled);
        },

        getDailyGoals: () => {
          return get().goals.filter(
            (g) => g.isEnabled && g.period === 'daily'
          );
        },

        getWeeklyGoals: () => {
          return get().goals.filter(
            (g) => g.isEnabled && g.period === 'weekly'
          );
        },

        // ─── 진행 요약 ───
        getProgressSummary: () => {
          const goals = get().goals.filter((g) => g.isEnabled);
          const completed = goals.filter(
            (g) => g.status === 'completed'
          ).length;
          const todayStart = getStartOfDay();
          const todayCompleted = goals.filter(
            (g) =>
              g.status === 'completed' &&
              g.completedAt &&
              g.completedAt >= todayStart
          ).length;

          return {
            totalGoals: goals.length,
            completedGoals: completed,
            activeGoals: goals.length - completed,
            completionRate:
              goals.length > 0 ? (completed / goals.length) * 100 : 0,
            todayCompletedCount: todayCompleted,
          };
        },

        // ─── 새로 달성된 (알림 미발송) 목표 조회 ───
        getNewlyCompleted: () => {
          return get().goals.filter(
            (g) =>
              g.isEnabled &&
              g.status === 'completed' &&
              !g.notifiedCompletion
          );
        },

        // ─── 전체 리셋 ───
        resetAllGoals: () => {
          set({ goals: [], notifications: [], isInitialized: false });
        },
      }),
      {
        name: 'solo-chess-goals',
      }
    ),
    { name: 'GoalStore' }
  )
);
