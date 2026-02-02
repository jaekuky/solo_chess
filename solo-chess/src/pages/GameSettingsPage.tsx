// src/pages/GameSettingsPage.tsx

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { useGameStore, useSettingsStore } from '@/stores';
import type { Difficulty, TimeControl, PieceColor } from '@/types';
import {
  DIFFICULTY_CONFIG,
  TIME_CONTROL_CONFIG,
  ROUTES,
  AI_NAMES,
} from '@/constants';
import { cn } from '@/utils';

type ColorOption = PieceColor | 'random';

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function OptionButton({
  selected,
  onClick,
  children,
  className,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border-2 transition-all text-left',
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        className
      )}
    >
      {children}
    </button>
  );
}

export function GameSettingsPage() {
  const navigate = useNavigate();
  const { startNewGame } = useGameStore();
  const { settings, setDefaultDifficulty, setDefaultTimeControl } =
    useSettingsStore();

  const [difficulty, setDifficulty] = useState<Difficulty>(
    settings.defaultDifficulty
  );
  const [customDepth, setCustomDepth] = useState(8);
  const [playerColor, setPlayerColor] = useState<ColorOption>('random');
  const [timeControl, setTimeControl] = useState<TimeControl>(
    settings.defaultTimeControl
  );

  const handleStartGame = useCallback(() => {
    const finalPlayerColor: PieceColor =
      playerColor === 'random'
        ? Math.random() > 0.5
          ? 'w'
          : 'b'
        : playerColor;
    setDefaultDifficulty(difficulty);
    setDefaultTimeControl(timeControl);
    startNewGame({
      difficulty,
      customDepth: difficulty === 'custom' ? customDepth : undefined,
      playerColor: finalPlayerColor,
      timeControl,
    });
    navigate(ROUTES.GAME_PLAY);
  }, [
    difficulty,
    customDepth,
    playerColor,
    timeControl,
    setDefaultDifficulty,
    setDefaultTimeControl,
    startNewGame,
    navigate,
  ]);

  const handleQuickStart = useCallback(() => {
    const finalPlayerColor: PieceColor =
      Math.random() > 0.5 ? 'w' : 'b';
    startNewGame({
      difficulty: settings.defaultDifficulty,
      playerColor: finalPlayerColor,
      timeControl: settings.defaultTimeControl,
    });
    navigate(ROUTES.GAME_PLAY);
  }, [settings.defaultDifficulty, settings.defaultTimeControl, startNewGame, navigate]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">새 게임 설정</h2>
        <p className="text-gray-500">
          AI와의 대전 설정을 선택하세요.
        </p>
      </div>

      <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">빠른 게임 시작</h3>
            <p className="text-sm text-gray-500">
              {AI_NAMES[settings.defaultDifficulty]}과 바로 대결합니다
            </p>
          </div>
          <Button onClick={handleQuickStart} size="lg">
            🎮 시작
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-semibold mb-4">AI 난이도</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => {
              const config = DIFFICULTY_CONFIG[level];
              return (
                <OptionButton
                  key={level}
                  selected={difficulty === level}
                  onClick={() => setDifficulty(level)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {level === 'beginner' && '🌱'}
                      {level === 'intermediate' && '🌿'}
                      {level === 'advanced' && '🌳'}
                      {level === 'custom' && '⚙️'}
                    </span>
                    <div>
                      <p className="font-medium">
                        {config.name}
                        <span className="ml-2 text-xs text-gray-400">
                          ({AI_NAMES[level]})
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </OptionButton>
              );
            })}
          </div>
          {difficulty === 'custom' && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">AI 강도 (탐색 깊이)</label>
                <span className="rounded bg-gray-200 px-2 py-1 font-mono text-sm dark:bg-gray-700">
                  {customDepth}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={customDepth}
                onChange={(e) => setCustomDepth(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>약함 (1)</span>
                <span>중간 (10)</span>
                <span>강함 (20)</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                ⚠️ 높은 값은 AI 응답 시간이 길어질 수 있습니다.
              </p>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">기물 색상</h3>
          <div className="grid grid-cols-3 gap-3">
            <OptionButton
              selected={playerColor === 'w'}
              onClick={() => setPlayerColor('w')}
              className="text-center"
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">♔</span>
                <p className="font-medium">백 (선공)</p>
              </div>
            </OptionButton>
            <OptionButton
              selected={playerColor === 'random'}
              onClick={() => setPlayerColor('random')}
              className="text-center"
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">🎲</span>
                <p className="font-medium">랜덤</p>
              </div>
            </OptionButton>
            <OptionButton
              selected={playerColor === 'b'}
              onClick={() => setPlayerColor('b')}
              className="text-center"
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">♚</span>
                <p className="font-medium">흑 (후공)</p>
              </div>
            </OptionButton>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">시간 제한</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(TIME_CONTROL_CONFIG) as TimeControl[]).map((tc) => {
              const config = TIME_CONTROL_CONFIG[tc];
              return (
                <OptionButton
                  key={tc}
                  selected={timeControl === tc}
                  onClick={() => setTimeControl(tc)}
                >
                  <div className="text-center">
                    <p className="font-medium">{config.name}</p>
                    <p className="text-xs text-gray-500">
                      {config.description}
                    </p>
                  </div>
                </OptionButton>
              );
            })}
          </div>
        </section>

        <div className="pt-4">
          <Button onClick={handleStartGame} size="lg" className="w-full">
            🎮 {AI_NAMES[difficulty]}과 대결하기
          </Button>
        </div>
      </div>
    </div>
  );
}
