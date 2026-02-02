// src/utils/sounds.ts

import { useSettingsStore } from '@/stores';

// 사운드 URL (public 폴더에 배치)
const SOUND_URLS = {
  move: '/sounds/move.mp3',
  capture: '/sounds/capture.mp3',
  check: '/sounds/check.mp3',
  castle: '/sounds/castle.mp3',
  promote: '/sounds/promote.mp3',
  gameStart: '/sounds/game-start.mp3',
  gameEnd: '/sounds/game-end.mp3',
  victory: '/sounds/victory.mp3',
  defeat: '/sounds/defeat.mp3',
  draw: '/sounds/draw.mp3',
  illegal: '/sounds/illegal.mp3',
  timerWarning: '/sounds/timer-warning.mp3',
  hint: '/sounds/hint.mp3',
} as const;

type SoundType = keyof typeof SOUND_URLS;

// 오디오 캐시
const audioCache: Map<SoundType, HTMLAudioElement> = new Map();

// 오디오 로드
function loadSound(type: SoundType): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (audioCache.has(type)) {
    return audioCache.get(type)!;
  }

  try {
    const audio = new Audio(SOUND_URLS[type]);
    audio.preload = 'auto';
    audioCache.set(type, audio);
    return audio;
  } catch (error) {
    console.warn(`Failed to load sound: ${type}`, error);
    return null;
  }
}

// 사운드 재생
export function playSound(type: SoundType): void {
  const { settings } = useSettingsStore.getState();

  // 사운드 비활성화 확인
  if (!settings.sound.enabled) return;

  // 개별 사운드 설정 확인
  const soundTypeMapping: Record<
    SoundType,
    keyof typeof settings.sound | null
  > = {
    move: 'moveSound',
    capture: 'captureSound',
    check: 'checkSound',
    castle: 'moveSound',
    promote: 'moveSound',
    gameStart: 'gameEndSound',
    gameEnd: 'gameEndSound',
    victory: 'gameEndSound',
    defeat: 'gameEndSound',
    draw: 'gameEndSound',
    illegal: 'moveSound',
    timerWarning: 'timerWarningSound',
    hint: null, // 항상 재생
  };

  const settingKey = soundTypeMapping[type];
  if (settingKey && !settings.sound[settingKey]) return;

  const audio = loadSound(type);
  if (!audio) return;

  // 볼륨 설정
  audio.volume = settings.sound.volume / 100;

  // 재생
  audio.currentTime = 0;
  audio.play().catch((error) => {
    // 사용자 상호작용 전 재생 시도 시 오류 발생 가능
    console.warn('Sound play failed:', error);
  });
}

// 사운드 미리 로드
export function preloadSounds(): void {
  (Object.keys(SOUND_URLS) as SoundType[]).forEach((type) => {
    loadSound(type);
  });
}

// 체스 이동에 맞는 사운드 재생
export function playMoveSound(move: {
  captured?: string;
  san?: string;
  flags?: string;
}): void {
  if (move.san?.includes('+') || move.san?.includes('#')) {
    playSound('check');
  } else if (move.captured) {
    playSound('capture');
  } else if (move.flags?.includes('k') || move.flags?.includes('q')) {
    playSound('castle');
  } else if (move.flags?.includes('p')) {
    playSound('promote');
  } else {
    playSound('move');
  }
}

// 게임 결과에 맞는 사운드 재생
export function playGameEndSound(result: 'win' | 'lose' | 'draw'): void {
  switch (result) {
    case 'win':
      playSound('victory');
      break;
    case 'lose':
      playSound('defeat');
      break;
    case 'draw':
      playSound('draw');
      break;
  }
}
