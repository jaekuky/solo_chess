// src/components/goals/GoalPanel.tsx
// 목표 관리 패널 – 일일/주간 목표 진행도 표시, 목표 추가/삭제/수정

import { useState, useEffect, useMemo } from 'react';
import { Button, Modal } from '@/components/common';
import { useGoalStore } from '@/stores/goalStore';
import { GOAL_TEMPLATES, type GoalTemplate, type UserGoal } from '@/types/goals';
import { cn } from '@/utils';

interface GoalPanelProps {
  className?: string;
  compact?: boolean; // 홈페이지용 컴팩트 모드
}

export function GoalPanel({ className, compact = false }: GoalPanelProps) {
  const {
    goals,
    isInitialized,
    initializeDefaults,
    addGoal,
    removeGoal,
    updateGoalTarget,
    toggleGoal,
    refreshAllGoals,
    getProgressSummary,
  } = useGoalStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [editTarget, setEditTarget] = useState(0);

  // 초기화
  useEffect(() => {
    if (!isInitialized) {
      initializeDefaults();
    }
    refreshAllGoals();
  }, [isInitialized, initializeDefaults, refreshAllGoals]);

  const summary = getProgressSummary();
  const dailyGoals = goals.filter((g) => g.isEnabled && g.period === 'daily');
  const weeklyGoals = goals.filter((g) => g.isEnabled && g.period === 'weekly');

  // 추가 가능한 템플릿
  const availableTemplates = useMemo(() => {
    const existingIds = new Set(goals.map((g) => g.templateId));
    return GOAL_TEMPLATES.filter((t) => !existingIds.has(t.id));
  }, [goals]);

  // 편집 모달 열기
  const openEdit = (goal: UserGoal) => {
    setEditingGoal(goal);
    setEditTarget(goal.targetValue);
  };

  const saveEdit = () => {
    if (editingGoal) {
      updateGoalTarget(editingGoal.id, editTarget);
      setEditingGoal(null);
    }
  };

  // ─── 컴팩트 모드 (홈페이지) ───
  if (compact) {
    const activeGoals = [...dailyGoals, ...weeklyGoals].slice(0, 4);
    if (activeGoals.length === 0) return null;

    return (
      <div className={cn('space-y-3', className)}>
        {/* 요약 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            오늘의 목표
          </h3>
          <span className="text-xs text-gray-500">
            {summary.completedGoals}/{summary.totalGoals} 달성
          </span>
        </div>

        {/* 전체 진행 바 */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(summary.completionRate, 100)}%`,
            }}
          />
        </div>

        {/* 목표 미니 카드들 */}
        <div className="grid grid-cols-2 gap-2">
          {activeGoals.map((goal) => (
            <MiniGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    );
  }

  // ─── 전체 모드 ───
  return (
    <div className={cn('space-y-6', className)}>
      {/* 진행 요약 */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-blue-100 dark:border-gray-700">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              strokeWidth="6"
              fill="none"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              className="stroke-blue-500 transition-all duration-700"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - summary.completionRate / 100)}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800 dark:text-gray-200">
            {summary.completionRate.toFixed(0)}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            목표 달성률
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {summary.completedGoals}개 달성 / {summary.totalGoals}개 목표
          </p>
          {summary.todayCompletedCount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              오늘 {summary.todayCompletedCount}개 달성!
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddModal(true)}
        >
          + 목표 추가
        </Button>
      </div>

      {/* 일일 목표 */}
      {dailyGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span>☀️</span> 일일 목표
          </h4>
          <div className="space-y-2">
            {dailyGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEdit(goal)}
                onToggle={() => toggleGoal(goal.id)}
                onRemove={() => removeGoal(goal.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 주간 목표 */}
      {weeklyGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span>📅</span> 주간 목표
          </h4>
          <div className="space-y-2">
            {weeklyGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEdit(goal)}
                onToggle={() => toggleGoal(goal.id)}
                onRemove={() => removeGoal(goal.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 비활성 목표 */}
      {goals.filter((g) => !g.isEnabled).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-3">
            비활성 목표
          </h4>
          <div className="space-y-2 opacity-50">
            {goals
              .filter((g) => !g.isEnabled)
              .map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEdit(goal)}
                  onToggle={() => toggleGoal(goal.id)}
                  onRemove={() => removeGoal(goal.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* 목표 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="🎯 목표 추가"
        size="lg"
      >
        <div className="space-y-4">
          {availableTemplates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              모든 목표가 이미 추가되어 있습니다.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                추적할 목표를 선택하세요.
              </p>

              {/* 일일 목표 */}
              {availableTemplates.filter((t) => t.period === 'daily')
                .length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    일일 목표
                  </p>
                  <div className="space-y-1.5">
                    {availableTemplates
                      .filter((t) => t.period === 'daily')
                      .map((template) => (
                        <TemplateRow
                          key={template.id}
                          template={template}
                          onAdd={() => {
                            addGoal(template.id);
                            setShowAddModal(false);
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* 주간 목표 */}
              {availableTemplates.filter((t) => t.period === 'weekly')
                .length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    주간 목표
                  </p>
                  <div className="space-y-1.5">
                    {availableTemplates
                      .filter((t) => t.period === 'weekly')
                      .map((template) => (
                        <TemplateRow
                          key={template.id}
                          template={template}
                          onAdd={() => {
                            addGoal(template.id);
                            setShowAddModal(false);
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-2 border-t dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(false)}
            >
              닫기
            </Button>
          </div>
        </div>
      </Modal>

      {/* 목표값 편집 모달 */}
      <Modal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="목표값 수정"
        size="sm"
      >
        {editingGoal && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getTemplateForGoal(editingGoal)?.icon}{' '}
                {getTemplateForGoal(editingGoal)?.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getTemplateForGoal(editingGoal)?.description}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
                목표값
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditTarget((prev) =>
                      Math.max(
                        getTemplateForGoal(editingGoal)?.minTarget ?? 1,
                        prev - (getTemplateForGoal(editingGoal)?.step ?? 1)
                      )
                    )
                  }
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-lg font-bold transition-colors"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {editTarget}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    {getTemplateForGoal(editingGoal)?.unit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditTarget((prev) =>
                      Math.min(
                        getTemplateForGoal(editingGoal)?.maxTarget ?? 100,
                        prev + (getTemplateForGoal(editingGoal)?.step ?? 1)
                      )
                    )
                  }
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingGoal(null)}
              >
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={saveEdit}>
                저장
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ═══════ Sub-components ═══════ */

function getTemplateForGoal(goal: UserGoal): GoalTemplate | undefined {
  return GOAL_TEMPLATES.find((t) => t.id === goal.templateId);
}

// 개별 목표 카드
function GoalCard({
  goal,
  onEdit,
  onToggle,
  onRemove,
}: {
  goal: UserGoal;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const template = getTemplateForGoal(goal);
  if (!template) return null;

  const progress = goal.targetValue > 0
    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    : 0;
  const isCompleted = goal.status === 'completed';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
      )}
    >
      {/* 아이콘 */}
      <span
        className={cn('text-2xl flex-shrink-0', isCompleted && 'animate-pulse')}
      >
        {isCompleted ? '✅' : template.icon}
      </span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {template.title}
          </span>
          <span
            className="text-xs font-bold tabular-nums ml-2 flex-shrink-0"
            style={{ color: isCompleted ? '#22c55e' : template.color }}
          >
            {goal.currentValue}/{goal.targetValue}
            <span className="text-gray-400 font-normal ml-0.5">
              {template.unit}
            </span>
          </span>
        </div>

        {/* 진행 바 */}
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: isCompleted ? '#22c55e' : template.color,
            }}
          />
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
          title="목표값 수정"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
          title={goal.isEnabled ? '비활성화' : '활성화'}
        >
          {goal.isEnabled ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
          title="삭제"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// 미니 목표 카드 (홈 컴팩트)
function MiniGoalCard({ goal }: { goal: UserGoal }) {
  const template = getTemplateForGoal(goal);
  if (!template) return null;

  const progress = goal.targetValue > 0
    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    : 0;
  const isCompleted = goal.status === 'completed';

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2.5 rounded-lg border transition-all',
        isCompleted
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
      )}
    >
      <span className="text-lg">{isCompleted ? '✅' : template.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {template.title}
          </span>
          <span
            className="text-[10px] font-bold tabular-nums ml-1"
            style={{ color: isCompleted ? '#22c55e' : template.color }}
          >
            {goal.currentValue}/{goal.targetValue}
          </span>
        </div>
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: isCompleted ? '#22c55e' : template.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 템플릿 선택 행
function TemplateRow({
  template,
  onAdd,
}: {
  template: GoalTemplate;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
    >
      <span className="text-xl flex-shrink-0">{template.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {template.title}
        </p>
        <p className="text-xs text-gray-500">
          {template.description} (기본: {template.defaultTarget}{template.unit})
        </p>
      </div>
      <span
        className="text-xs font-medium px-2 py-1 rounded-full"
        style={{
          backgroundColor: `${template.color}15`,
          color: template.color,
        }}
      >
        + 추가
      </span>
    </button>
  );
}
