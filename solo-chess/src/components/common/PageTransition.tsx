// src/components/common/PageTransition.tsx

import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/utils';
import { useSettingsStore } from '@/stores';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const { settings } = useSettingsStore();
  
  const reduceMotion = settings.accessibility.reduceMotion;
  
  return (
    <div
      key={location.pathname}
      className={cn(
        !reduceMotion && 'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
}
