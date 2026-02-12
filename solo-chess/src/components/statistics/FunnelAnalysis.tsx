// src/components/statistics/FunnelAnalysis.tsx
// 퍼널 분석 – 게임 진행, 난이도 성장, 참여도 퍼널
// 각 단계의 전환율과 이탈률을 시각화하여 플레이 패턴 인사이트를 제공

import { useMemo, useState } from 'react';
import type { GameRecord } from '@/types';
import type { Statistics } from '@/types/statistics';
import { cn } from '@/utils';

/* ═══════════════════ Types ═══════════════════ */

interface FunnelAnalysisProps {
  gameRecords: GameRecord[];
  statistics: Statistics;
  className?: string;
}

type FunnelView = 'journey' | 'difficulty' | 'engagement';

interface FunnelStep {
  label: string;
  value: number;
  icon: string;
  color: string;
  description: string;
}

interface FunnelData {
  title: string;
  description: string;
  steps: FunnelStep[];
}

/* ═══════════════════ Constants ═══════════════════ */

const JOURNEY_COLORS = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#22c55e', // green-500
  '#16a34a', // green-600
  '#15803d', // green-700
];

const DIFFICULTY_COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#dc2626', // red-600
];

const ENGAGEMENT_COLORS = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#22c55e', // green-500
  '#f59e0b', // amber-500
];

/* ═══════════════════ Utility ═══════════════════ */

function computeConversionRate(from: number, to: number): number {
  return from > 0 ? (to / from) * 100 : 0;
}

function formatRate(rate: number): string {
  return rate >= 100 ? '100%' : `${rate.toFixed(1)}%`;
}

/* ═══════════════════ Main Component ═══════════════════ */

export function FunnelAnalysis({
  gameRecords,
  statistics,
  className,
}: FunnelAnalysisProps) {
  const [activeView, setActiveView] = useState<FunnelView>('journey');
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // ─── 1. 게임 진행 퍼널 ───
  const journeyFunnel = useMemo<FunnelData>(() => {
    const totalGames = gameRecords.length;
    const openingGames = gameRecords.filter((r) => r.moveCount >= 5).length;
    const middlegameGames = gameRecords.filter((r) => r.moveCount >= 15).length;
    const endgameGames = gameRecords.filter((r) => r.moveCount >= 30).length;
    const completedGames = gameRecords.filter(
      (r) =>
        r.endReason === 'checkmate' ||
        r.endReason === 'stalemate' ||
        r.endReason === 'draw_agreement' ||
        r.endReason === 'insufficient_material' ||
        r.endReason === 'fifty_move_rule' ||
        r.endReason === 'threefold_repetition' ||
        r.endReason === 'timeout'
    ).length;
    const wins = gameRecords.filter((r) => r.result === 'win').length;
    const checkmateWins = gameRecords.filter(
      (r) => r.result === 'win' && r.endReason === 'checkmate'
    ).length;

    return {
      title: '게임 진행 퍼널',
      description: '게임 시작부터 승리까지 각 단계별 도달률을 분석합니다.',
      steps: [
        {
          label: '게임 시작',
          value: totalGames,
          icon: '🎮',
          color: JOURNEY_COLORS[0],
          description: '시작된 전체 게임 수',
        },
        {
          label: '오프닝 완료 (5수+)',
          value: openingGames,
          icon: '♟️',
          color: JOURNEY_COLORS[1],
          description: '오프닝 단계(5수 이상)에 도달한 게임',
        },
        {
          label: '미들게임 진입 (15수+)',
          value: middlegameGames,
          icon: '⚔️',
          color: JOURNEY_COLORS[2],
          description: '미들게임 단계(15수 이상)에 도달한 게임',
        },
        {
          label: '엔드게임 진입 (30수+)',
          value: endgameGames,
          icon: '🏁',
          color: JOURNEY_COLORS[3],
          description: '엔드게임 단계(30수 이상)에 도달한 게임',
        },
        {
          label: '자연 종료',
          value: completedGames,
          icon: '✅',
          color: JOURNEY_COLORS[4],
          description: '기권 없이 자연스럽게 종료된 게임',
        },
        {
          label: '승리',
          value: wins,
          icon: '🏆',
          color: JOURNEY_COLORS[5],
          description: '플레이어가 승리한 게임',
        },
        {
          label: '체크메이트 승리',
          value: checkmateWins,
          icon: '♚',
          color: JOURNEY_COLORS[6],
          description: '체크메이트로 승리한 게임',
        },
      ],
    };
  }, [gameRecords]);

  // ─── 2. 난이도 성장 퍼널 ───
  const difficultyFunnel = useMemo<FunnelData>(() => {
    const { byDifficulty } = statistics;

    const beginnerPlayed = byDifficulty.beginner.gamesPlayed;
    const beginnerWon = byDifficulty.beginner.wins;
    const intermediatePlayed = byDifficulty.intermediate.gamesPlayed;
    const intermediateWon = byDifficulty.intermediate.wins;
    const advancedPlayed = byDifficulty.advanced.gamesPlayed;
    const advancedWon = byDifficulty.advanced.wins;

    return {
      title: '난이도 성장 퍼널',
      description: '초급에서 고급까지 난이도별 도전과 성과를 추적합니다.',
      steps: [
        {
          label: '초급 도전',
          value: beginnerPlayed,
          icon: '🌱',
          color: DIFFICULTY_COLORS[0],
          description: '초급 난이도 게임 플레이 수',
        },
        {
          label: '초급 승리',
          value: beginnerWon,
          icon: '✅',
          color: DIFFICULTY_COLORS[1],
          description: '초급 난이도에서 승리한 횟수',
        },
        {
          label: '중급 도전',
          value: intermediatePlayed,
          icon: '🌿',
          color: DIFFICULTY_COLORS[2],
          description: '중급 난이도 게임 플레이 수',
        },
        {
          label: '중급 승리',
          value: intermediateWon,
          icon: '🏅',
          color: DIFFICULTY_COLORS[3],
          description: '중급 난이도에서 승리한 횟수',
        },
        {
          label: '고급 도전',
          value: advancedPlayed,
          icon: '🌳',
          color: DIFFICULTY_COLORS[4],
          description: '고급 난이도 게임 플레이 수',
        },
        {
          label: '고급 승리',
          value: advancedWon,
          icon: '🏆',
          color: DIFFICULTY_COLORS[5],
          description: '고급 난이도에서 승리한 횟수',
        },
      ],
    };
  }, [statistics]);

  // ─── 3. 참여도 퍼널 ───
  const engagementFunnel = useMemo<FunnelData>(() => {
    const totalGames = gameRecords.length;
    const meaningfulGames = gameRecords.filter(
      (r) => r.moveCount >= 5
    ).length;
    const gamesWithHints = gameRecords.filter((r) => r.hintsUsed > 0).length;
    const winsNoHints = gameRecords.filter(
      (r) => r.result === 'win' && r.hintsUsed === 0
    ).length;
    const longerGames = gameRecords.filter(
      (r) => r.duration >= 300
    ).length; // 5분 이상

    return {
      title: '참여도 퍼널',
      description:
        '플레이어의 깊이 있는 참여 수준을 단계별로 분석합니다.',
      steps: [
        {
          label: '전체 게임',
          value: totalGames,
          icon: '🎮',
          color: ENGAGEMENT_COLORS[0],
          description: '시작된 전체 게임 수',
        },
        {
          label: '의미 있는 게임 (5수+)',
          value: meaningfulGames,
          icon: '📋',
          color: ENGAGEMENT_COLORS[1],
          description: '최소 5수 이상 진행한 게임',
        },
        {
          label: '5분 이상 플레이',
          value: longerGames,
          icon: '⏱️',
          color: ENGAGEMENT_COLORS[2],
          description: '5분 이상 집중하여 플레이한 게임',
        },
        {
          label: '독립 승리 (힌트 미사용)',
          value: winsNoHints,
          icon: '💪',
          color: ENGAGEMENT_COLORS[3],
          description: '힌트 없이 스스로 승리한 게임',
        },
        {
          label: '힌트 활용 게임',
          value: gamesWithHints,
          icon: '💡',
          color: ENGAGEMENT_COLORS[4],
          description: '힌트를 사용한 학습 게임',
        },
      ],
    };
  }, [gameRecords]);

  // ─── 현재 퍼널 데이터 선택 ───
  const currentFunnel = useMemo(() => {
    switch (activeView) {
      case 'journey':
        return journeyFunnel;
      case 'difficulty':
        return difficultyFunnel;
      case 'engagement':
        return engagementFunnel;
    }
  }, [activeView, journeyFunnel, difficultyFunnel, engagementFunnel]);

  // ─── 인사이트 생성 ───
  const insights = useMemo(() => {
    const result: {
      icon: string;
      text: string;
      type: 'positive' | 'negative' | 'neutral';
    }[] = [];

    if (activeView === 'journey') {
      const steps = journeyFunnel.steps;
      const totalGames = steps[0].value;
      if (totalGames === 0) return result;

      // 오프닝 도달률
      const openingRate = computeConversionRate(steps[0].value, steps[1].value);
      if (openingRate < 70) {
        result.push({
          icon: '💡',
          text: `게임의 ${(100 - openingRate).toFixed(0)}%가 오프닝 전에 종료됩니다. 초반 기권을 줄이면 더 많이 배울 수 있어요.`,
          type: 'neutral',
        });
      }

      // 승리 전환율
      const winRate = computeConversionRate(steps[0].value, steps[5].value);
      if (winRate >= 50) {
        result.push({
          icon: '🏆',
          text: `전체 게임 중 ${winRate.toFixed(0)}%를 승리로 마무리하고 있습니다. 훌륭한 성적입니다!`,
          type: 'positive',
        });
      }

      // 체크메이트 비율
      const checkmateOfWins = computeConversionRate(
        steps[5].value,
        steps[6].value
      );
      if (steps[5].value > 0 && checkmateOfWins >= 60) {
        result.push({
          icon: '♚',
          text: `승리의 ${checkmateOfWins.toFixed(0)}%가 체크메이트로 끝납니다. 뛰어난 마무리 능력이에요!`,
          type: 'positive',
        });
      } else if (steps[5].value > 0 && checkmateOfWins < 30) {
        result.push({
          icon: '📚',
          text: `체크메이트 비율이 ${checkmateOfWins.toFixed(0)}%입니다. 엔드게임 연습으로 마무리 능력을 키워보세요.`,
          type: 'neutral',
        });
      }
    }

    if (activeView === 'difficulty') {
      const steps = difficultyFunnel.steps;
      const beginnerWinRate = computeConversionRate(
        steps[0].value,
        steps[1].value
      );
      const hasIntermediate = steps[2].value > 0;
      const hasAdvanced = steps[4].value > 0;

      if (steps[0].value > 0 && beginnerWinRate >= 70 && !hasIntermediate) {
        result.push({
          icon: '🚀',
          text: `초급 승률이 ${beginnerWinRate.toFixed(0)}%로 높습니다. 중급에 도전해보세요!`,
          type: 'neutral',
        });
      }

      if (hasIntermediate && !hasAdvanced) {
        const intermediateWinRate = computeConversionRate(
          steps[2].value,
          steps[3].value
        );
        if (intermediateWinRate >= 50) {
          result.push({
            icon: '🌳',
            text: `중급 승률이 ${intermediateWinRate.toFixed(0)}%입니다. 고급 난이도에 도전할 준비가 되었어요!`,
            type: 'positive',
          });
        }
      }

      if (hasAdvanced && steps[5].value > 0) {
        result.push({
          icon: '🏆',
          text: `고급 난이도에서 ${steps[5].value}번 승리했습니다! 마스터 수준의 실력입니다.`,
          type: 'positive',
        });
      }
    }

    if (activeView === 'engagement') {
      const steps = engagementFunnel.steps;
      const totalGames = steps[0].value;
      if (totalGames === 0) return result;

      const meaningfulRate = computeConversionRate(
        steps[0].value,
        steps[1].value
      );
      if (meaningfulRate >= 90) {
        result.push({
          icon: '✨',
          text: `게임의 ${meaningfulRate.toFixed(0)}%가 의미 있는 대국입니다. 진지하게 플레이하고 있어요!`,
          type: 'positive',
        });
      }

      const selfWinRate = computeConversionRate(
        steps[0].value,
        steps[3].value
      );
      if (selfWinRate > 0) {
        result.push({
          icon: '💪',
          text: `전체 게임 중 ${selfWinRate.toFixed(0)}%를 힌트 없이 승리했습니다.`,
          type: selfWinRate >= 30 ? 'positive' : 'neutral',
        });
      }
    }

    return result.slice(0, 3);
  }, [activeView, journeyFunnel, difficultyFunnel, engagementFunnel]);

  // ─── 빈 상태 ───
  if (gameRecords.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-400 text-sm">
          게임 기록이 없습니다. 게임을 플레이하면 퍼널 분석이 표시됩니다.
        </p>
      </div>
    );
  }

  const maxValue = currentFunnel.steps[0]?.value || 1;

  return (
    <div className={cn('space-y-5', className)}>
      {/* ─── 뷰 선택 탭 ─── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { id: 'journey' as const, label: '게임 진행', icon: '🎯' },
          { id: 'difficulty' as const, label: '난이도 성장', icon: '📈' },
          { id: 'engagement' as const, label: '참여도', icon: '🔥' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveView(tab.id);
              setHoveredStep(null);
            }}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              activeView === tab.id
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 퍼널 설명 ─── */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {currentFunnel.description}
      </p>

      {/* ─── 퍼널 차트 ─── */}
      <div className="space-y-1">
        {currentFunnel.steps.map((step, idx) => {
          const prevValue = idx === 0 ? step.value : currentFunnel.steps[idx - 1].value;
          const conversionFromPrev = computeConversionRate(prevValue, step.value);
          const conversionFromTop = computeConversionRate(maxValue, step.value);
          const barWidth = maxValue > 0 ? Math.max((step.value / maxValue) * 100, 2) : 2;
          const isHovered = hoveredStep === idx;

          return (
            <div key={idx}>
              {/* 전환율 표시 (첫 단계 제외) */}
              {idx > 0 && (
                <div className="flex items-center justify-center py-1">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      className="text-gray-400 dark:text-gray-500"
                    >
                      <path
                        d="M6 2 L6 10 M3 7 L6 10 L9 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        conversionFromPrev >= 70
                          ? 'text-green-600 dark:text-green-400'
                          : conversionFromPrev >= 40
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-500 dark:text-red-400'
                      )}
                    >
                      {formatRate(conversionFromPrev)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">
                      전환
                    </span>
                    {prevValue > step.value && (
                      <span className="text-gray-400 dark:text-gray-500">
                        · {prevValue - step.value}건 이탈
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 퍼널 바 */}
              <div
                className={cn(
                  'relative flex items-center rounded-lg transition-all cursor-default group',
                  isHovered
                    ? 'bg-gray-100 dark:bg-gray-700/80'
                    : 'bg-gray-50/50 dark:bg-gray-800/30'
                )}
                style={{ padding: '8px 12px' }}
                onMouseEnter={() => setHoveredStep(idx)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* 아이콘 */}
                <span className="text-lg mr-3 flex-shrink-0 w-7 text-center">
                  {step.icon}
                </span>

                {/* 바 영역 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {step.label}
                    </span>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-sm font-bold tabular-nums" style={{ color: step.color }}>
                        {step.value.toLocaleString()}
                      </span>
                      {idx > 0 && (
                        <span className="text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
                          ({formatRate(conversionFromTop)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 프로그레스 바 */}
                  <div className="relative w-full h-5 bg-gray-200/60 dark:bg-gray-700/60 rounded-md overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-md transition-all duration-500 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: step.color,
                        opacity: isHovered ? 1 : 0.85,
                      }}
                    />
                    {/* 바 내부 수치 */}
                    {barWidth > 15 && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-semibold text-white/90">
                        {formatRate(conversionFromTop)}
                      </span>
                    )}
                  </div>

                  {/* 호버 시 상세 설명 */}
                  {isHovered && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 animate-fade-in">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 요약 통계 카드 ─── */}
      <div className="grid grid-cols-3 gap-2">
        {(() => {
          const steps = currentFunnel.steps;
          if (steps.length < 2 || steps[0].value === 0)
            return (
              <div className="col-span-3 text-center text-sm text-gray-400 py-4">
                데이터가 부족합니다.
              </div>
            );

          const totalConversion = computeConversionRate(
            steps[0].value,
            steps[steps.length - 1].value
          );

          // 가장 큰 이탈 구간 찾기
          let maxDropIdx = 0;
          let maxDrop = 0;
          for (let i = 1; i < steps.length; i++) {
            const drop = steps[i - 1].value - steps[i].value;
            if (drop > maxDrop) {
              maxDrop = drop;
              maxDropIdx = i;
            }
          }

          // 가장 높은 전환율 구간
          let bestConvIdx = 1;
          let bestConv = 0;
          for (let i = 1; i < steps.length; i++) {
            const conv = computeConversionRate(
              steps[i - 1].value,
              steps[i].value
            );
            if (conv > bestConv && steps[i - 1].value > 0) {
              bestConv = conv;
              bestConvIdx = i;
            }
          }

          return (
            <>
              <SummaryCard
                label="전체 전환율"
                value={formatRate(totalConversion)}
                description={`${steps[0].label} → ${steps[steps.length - 1].label}`}
                color={
                  totalConversion >= 30
                    ? 'green'
                    : totalConversion >= 10
                      ? 'amber'
                      : 'red'
                }
              />
              <SummaryCard
                label="최대 이탈 구간"
                value={`-${maxDrop}`}
                description={`${steps[maxDropIdx - 1]?.label ?? ''} → ${steps[maxDropIdx]?.label ?? ''}`}
                color="red"
              />
              <SummaryCard
                label="최고 전환 구간"
                value={formatRate(bestConv)}
                description={`${steps[bestConvIdx - 1]?.label ?? ''} → ${steps[bestConvIdx]?.label ?? ''}`}
                color="green"
              />
            </>
          );
        })()}
      </div>

      {/* ─── 인사이트 ─── */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2.5 p-3 rounded-lg text-xs leading-relaxed',
                insight.type === 'positive' &&
                  'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
                insight.type === 'negative' &&
                  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
                insight.type === 'neutral' &&
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              )}
            >
              <span className="text-base flex-shrink-0 mt-[-1px]">
                {insight.icon}
              </span>
              <span>{insight.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ Sub-components ═══════════════════ */

function SummaryCard({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: string;
  description: string;
  color: 'green' | 'amber' | 'red';
}) {
  const colorMap = {
    green: 'bg-green-50 dark:bg-green-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
  };

  const textMap = {
    green: 'text-green-700 dark:text-green-300',
    amber: 'text-amber-700 dark:text-amber-300',
    red: 'text-red-700 dark:text-red-300',
  };

  return (
    <div className={cn('rounded-lg p-3 text-center', colorMap[color])}>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
        {label}
      </p>
      <p className={cn('text-lg font-bold mt-0.5', textMap[color])}>{value}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
        {description}
      </p>
    </div>
  );
}
