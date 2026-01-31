// src/utils/aiDifficulty.ts

import type { Difficulty } from '@/types';

export interface AIDifficultySettings {
  depth: number;
  movetime: number;
  weakening: {
    enabled: boolean;
    mistakeChance: number;
    blunderChance: number;
    randomMoveChance: number;
  };
  thinkingTimeMin: number;
  thinkingTimeMax: number;
}

export const AI_DIFFICULTY_SETTINGS: Record<Difficulty, AIDifficultySettings> = {
  beginner: {
    depth: 1,
    movetime: 500,
    weakening: {
      enabled: true,
      mistakeChance: 0.4,
      blunderChance: 0.15,
      randomMoveChance: 0.1,
    },
    thinkingTimeMin: 500,
    thinkingTimeMax: 1500,
  },
  intermediate: {
    depth: 5,
    movetime: 1000,
    weakening: {
      enabled: true,
      mistakeChance: 0.15,
      blunderChance: 0.05,
      randomMoveChance: 0,
    },
    thinkingTimeMin: 800,
    thinkingTimeMax: 2000,
  },
  advanced: {
    depth: 12,
    movetime: 2000,
    weakening: {
      enabled: false,
      mistakeChance: 0,
      blunderChance: 0,
      randomMoveChance: 0,
    },
    thinkingTimeMin: 1000,
    thinkingTimeMax: 3000,
  },
  custom: {
    depth: 8,
    movetime: 1500,
    weakening: {
      enabled: false,
      mistakeChance: 0,
      blunderChance: 0,
      randomMoveChance: 0,
    },
    thinkingTimeMin: 800,
    thinkingTimeMax: 2500,
  },
};

export function createCustomDifficulty(depth: number): AIDifficultySettings {
  return {
    ...AI_DIFFICULTY_SETTINGS.custom,
    depth,
    movetime: Math.min(depth * 200, 3000),
  };
}

export function getRandomThinkingTime(settings: AIDifficultySettings): number {
  const { thinkingTimeMin, thinkingTimeMax } = settings;
  return Math.floor(
    Math.random() * (thinkingTimeMax - thinkingTimeMin) + thinkingTimeMin
  );
}

export function shouldWeakenMove(
  settings: AIDifficultySettings
): 'best' | 'mistake' | 'blunder' | 'random' {
  if (!settings.weakening.enabled) return 'best';

  const rand = Math.random();
  if (rand < settings.weakening.randomMoveChance) return 'random';
  if (
    rand <
    settings.weakening.randomMoveChance + settings.weakening.blunderChance
  )
    return 'blunder';
  if (
    rand <
    settings.weakening.randomMoveChance +
      settings.weakening.blunderChance +
      settings.weakening.mistakeChance
  )
    return 'mistake';
  return 'best';
}
