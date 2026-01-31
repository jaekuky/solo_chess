// src/pages/RulesPage.tsx

import { useState } from 'react';
import { LearningBoard } from '@/components/learning';
import { Button } from '@/components/common';
import { useLearningStore } from '@/stores';
import { PIECE_LESSONS, PIECE_LESSON_ORDER, SPECIAL_RULE_LESSONS } from '@/data';
import type { PieceLesson, SpecialRuleLesson, PieceType } from '@/types';
import { cn } from '@/utils';

type ViewMode = 'overview' | 'piece' | 'special';

export function RulesPage() {
  const {
    progress,
    completePieceLesson,
    completeSpecialRule,
  } = useLearningStore();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedPiece, setSelectedPiece] = useState<PieceLesson | null>(null);
  const [selectedRule, setSelectedRule] = useState<SpecialRuleLesson | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

  // 기물 레슨 선택
  const handleSelectPiece = (piece: PieceType) => {
    const lesson = PIECE_LESSONS.find((p) => p.piece === piece);
    if (lesson) {
      setSelectedPiece(lesson);
      setViewMode('piece');
      setCurrentExampleIndex(0);
    }
  };

  // 특수 규칙 선택
  const handleSelectRule = (ruleId: string) => {
    const rule = SPECIAL_RULE_LESSONS.find((r) => r.id === ruleId);
    if (rule) {
      setSelectedRule(rule);
      setViewMode('special');
      setCurrentStep(0);
    }
  };

  // 기물 레슨 완료
  const handleCompletePieceLesson = () => {
    if (selectedPiece) {
      completePieceLesson(selectedPiece.piece);
      setSelectedPiece(null);
      setViewMode('overview');
    }
  };

  // 특수 규칙 완료
  const handleCompleteSpecialRule = () => {
    if (selectedRule) {
      completeSpecialRule(selectedRule.id);
      setSelectedRule(null);
      setViewMode('overview');
    }
  };

  // 뒤로 가기
  const handleBack = () => {
    setViewMode('overview');
    setSelectedPiece(null);
    setSelectedRule(null);
    setCurrentStep(0);
  };

  // 개요 화면
  if (viewMode === 'overview') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">체스 규칙 배우기</h2>
          <p className="text-gray-500">
            각 기물의 이동 방법과 특수 규칙을 배워보세요.
          </p>
        </div>

        {/* 기물 이동 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">기물 이동 방법</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PIECE_LESSON_ORDER.map((pieceType) => {
              const lesson = PIECE_LESSONS.find(
                (p) => p.piece === pieceType,
              )!;
              const isCompleted =
                progress.completedPieceLessons.includes(pieceType);

              return (
                <button
                  key={pieceType}
                  onClick={() => handleSelectPiece(pieceType)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    'hover:border-primary-300 hover:shadow-md',
                    isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{lesson.symbol.w}</span>
                    <div>
                      <p className="font-medium">{lesson.name}</p>
                      <p className="text-xs text-gray-500">
                        {isCompleted ? '✓ 완료' : `가치: ${lesson.value || '∞'}`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 특수 규칙 */}
        <section>
          <h3 className="text-lg font-semibold mb-4">특수 규칙</h3>
          <div className="space-y-3">
            {SPECIAL_RULE_LESSONS.map((rule) => {
              const isCompleted =
                progress.completedSpecialRules.includes(rule.id);

              return (
                <button
                  key={rule.id}
                  onClick={() => handleSelectRule(rule.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all text-left',
                    'hover:border-primary-300 hover:shadow-md',
                    isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {rule.name}
                        {isCompleted && (
                          <span className="ml-2 text-green-500">✓</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {rule.description}
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 진행률 */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">학습 진행률</span>
            <span className="text-sm text-gray-500">
              {progress.completedPieceLessons.length +
                progress.completedSpecialRules.length}{' '}
              / {PIECE_LESSONS.length + SPECIAL_RULE_LESSONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{
                width: `${((progress.completedPieceLessons.length +
                  progress.completedSpecialRules.length) /
                  (PIECE_LESSONS.length + SPECIAL_RULE_LESSONS.length)) *
                  100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 기물 레슨 화면
  if (viewMode === 'piece' && selectedPiece) {
    const currentExample =
      selectedPiece.examplePositions[currentExampleIndex];

    return (
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 뒤로
          </button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-4xl">{selectedPiece.symbol.w}</span>
            {selectedPiece.name} ({selectedPiece.nameEn})
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 체스판 */}
          <div>
            <LearningBoard
              fen={currentExample.fen}
              highlightSquares={currentExample.highlightSquares}
              boardWidth={400}
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              {currentExample.description}
            </p>

            {/* 예제 네비게이션 */}
            {selectedPiece.examplePositions.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {selectedPiece.examplePositions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentExampleIndex(index)}
                    className={cn(
                      'w-3 h-3 rounded-full transition-colors',
                      index === currentExampleIndex
                        ? 'bg-primary-500'
                        : 'bg-gray-300 hover:bg-gray-400',
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">설명</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedPiece.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">이동 방법</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedPiece.movementDescription}
              </p>
            </div>

            {selectedPiece.specialRules && (
              <div>
                <h3 className="font-semibold mb-2">특수 규칙</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  {selectedPiece.specialRules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">💡 팁</h3>
              <ul className="space-y-2">
                {selectedPiece.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-primary-500">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={handleCompletePieceLesson} className="w-full">
              학습 완료 ✓
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 특수 규칙 레슨 화면
  if (viewMode === 'special' && selectedRule) {
    const step = selectedRule.steps[currentStep];
    const isLastStep = currentStep === selectedRule.steps.length - 1;

    return (
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 뒤로
          </button>
          <h2 className="text-2xl font-bold">{selectedRule.name}</h2>
        </div>

        {/* 진행 표시 */}
        <div className="flex items-center gap-2 mb-6">
          {selectedRule.steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'flex-1 h-1 rounded-full transition-colors',
                index <= currentStep
                  ? 'bg-primary-500'
                  : 'bg-gray-200 dark:bg-gray-700',
              )}
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 체스판 */}
          <div>
            <LearningBoard
              fen={step.fen}
              highlightSquares={step.highlightSquares}
              arrows={
                step.arrowFrom && step.arrowTo
                  ? [{ from: step.arrowFrom, to: step.arrowTo }]
                  : []
              }
              boardWidth={400}
            />
          </div>

          {/* 설명 */}
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
                <p className="text-lg">{step.instruction}</p>
              </div>

              <p className="text-sm text-gray-500">
                단계 {currentStep + 1} / {selectedRule.steps.length}
              </p>
            </div>

            {/* 네비게이션 */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex-1"
              >
                이전
              </Button>

              {isLastStep ? (
                <Button onClick={handleCompleteSpecialRule} className="flex-1">
                  완료 ✓
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1"
                >
                  다음
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
