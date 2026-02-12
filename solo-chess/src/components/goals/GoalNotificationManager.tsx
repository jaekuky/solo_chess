// src/components/goals/GoalNotificationManager.tsx
// 목표 달성 감지 및 토스트 알림 발송

import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/common';
import { useGoalStore } from '@/stores/goalStore';
import { useStatisticsStore } from '@/stores';
import { GOAL_TEMPLATES } from '@/types/goals';

/**
 * 이 컴포넌트는 렌더링하지 않으며, 다음 역할을 수행합니다:
 * 1. 게임 결과 변경 시 목표 진행도를 자동 갱신
 * 2. 새로 달성된 목표에 대해 토스트 알림 표시
 * 3. 주기적으로 일일/주간 리셋 확인
 */
export function GoalNotificationManager() {
  const toast = useToast();
  const {
    goals,
    refreshAllGoals,
    getNewlyCompleted,
    addNotification,
  } = useGoalStore();

  const { statistics } = useStatisticsStore();

  // 이전 총 게임 수 추적 (게임 완료 감지용)
  const prevTotalGamesRef = useRef(statistics.totalGames);

  // 알림 발송 처리
  const processNotifications = useCallback(() => {
    const newlyCompleted = getNewlyCompleted();

    for (const goal of newlyCompleted) {
      const template = GOAL_TEMPLATES.find(
        (t) => t.id === goal.templateId
      );
      if (!template) continue;

      // 토스트 알림 표시
      toast.success(
        `🎯 목표 달성! ${template.icon} ${template.title} (${goal.targetValue}${template.unit})`,
        4000
      );

      // 알림 기록 추가
      addNotification({
        goalId: goal.id,
        type: 'goalCompleted',
        title: '목표 달성!',
        message: `${template.icon} ${template.title}: ${goal.targetValue}${template.unit} 달성`,
        icon: template.icon,
      });

      // 알림 발송 완료 표시
      useGoalStore.setState((state) => ({
        goals: state.goals.map((g) =>
          g.id === goal.id ? { ...g, notifiedCompletion: true } : g
        ),
      }));
    }
  }, [getNewlyCompleted, toast, addNotification]);

  // 게임 완료 감지 → 목표 갱신
  useEffect(() => {
    const currentTotal = statistics.totalGames;

    if (currentTotal > prevTotalGamesRef.current) {
      // 새 게임이 완료됨
      refreshAllGoals();

      // 약간의 지연 후 알림 처리 (상태 업데이트 대기)
      const timer = setTimeout(() => {
        processNotifications();
      }, 300);

      prevTotalGamesRef.current = currentTotal;
      return () => clearTimeout(timer);
    }

    prevTotalGamesRef.current = currentTotal;
  }, [statistics.totalGames, refreshAllGoals, processNotifications]);

  // 주기적 리셋 확인 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllGoals();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshAllGoals]);

  // 마운트 시 초기 갱신
  useEffect(() => {
    refreshAllGoals();
  }, [refreshAllGoals]);

  // 목표 상태 변경 시 알림 확인
  useEffect(() => {
    processNotifications();
  }, [goals, processNotifications]);

  // 렌더링 없음
  return null;
}
