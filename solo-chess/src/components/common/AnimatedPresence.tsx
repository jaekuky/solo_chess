// src/components/common/AnimatedPresence.tsx

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/utils';
import { useSettingsStore } from '@/stores';

type AnimationType = 
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'none';

interface AnimatedPresenceProps {
  children: ReactNode;
  show: boolean;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  className?: string;
  onAnimationEnd?: () => void;
}

const ANIMATION_CLASSES: Record<AnimationType, { enter: string; exit: string }> = {
  'fade': {
    enter: 'animate-fade-in',
    exit: 'animate-fade-out',
  },
  'slide-up': {
    enter: 'animate-slide-up',
    exit: 'animate-fade-out',
  },
  'slide-down': {
    enter: 'animate-slide-down',
    exit: 'animate-fade-out',
  },
  'slide-left': {
    enter: 'animate-slide-in-left',
    exit: 'animate-fade-out',
  },
  'slide-right': {
    enter: 'animate-slide-in-right',
    exit: 'animate-fade-out',
  },
  'scale': {
    enter: 'animate-scale-in',
    exit: 'animate-fade-out',
  },
  'none': {
    enter: '',
    exit: '',
  },
};

export function AnimatedPresence({
  children,
  show,
  animation = 'fade',
  duration = 300,
  delay = 0,
  className,
  onAnimationEnd,
}: AnimatedPresenceProps) {
  const { settings } = useSettingsStore();
  const [shouldRender, setShouldRender] = useState(show);
  
  // 모션 감소 설정 확인
  const reduceMotion = settings.accessibility.reduceMotion;
  const effectiveAnimation = reduceMotion ? 'none' : animation;
  
  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRender(true);
    } else if (shouldRender) {
      const timer = setTimeout(() => {
        setShouldRender(false);
        onAnimationEnd?.();
      }, reduceMotion ? 0 : duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, shouldRender, duration, reduceMotion, onAnimationEnd]);
  
  if (!shouldRender) return null;
  
  const animationClass = show
    ? ANIMATION_CLASSES[effectiveAnimation].enter
    : ANIMATION_CLASSES[effectiveAnimation].exit;
  
  return (
    <div
      className={cn(animationClass, className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
