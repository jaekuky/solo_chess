// src/components/layout/ResponsiveLayout.tsx

import type { ReactNode } from 'react';
import { useResponsive } from '@/hooks';
import { cn } from '@/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: 'left' | 'right';
  className?: string;
}

export function ResponsiveLayout({
  children,
  sidebar,
  sidebarPosition = 'right',
  className,
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet } = useResponsive();
  
  // 모바일: 단일 컬럼
  if (isMobile) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {children}
        {sidebar && <div className="mt-4">{sidebar}</div>}
      </div>
    );
  }
  
  // 태블릿: 사이드바 하단 또는 축소
  if (isTablet) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {children}
        {sidebar && (
          <div className="grid grid-cols-2 gap-4">{sidebar}</div>
        )}
      </div>
    );
  }
  
  // 데스크탑: 사이드바 옆에 배치
  return (
    <div className={cn(
      'flex gap-6',
      sidebarPosition === 'left' && 'flex-row-reverse',
      className
    )}>
      <div className="flex-1">{children}</div>
      {sidebar && (
        <div className="w-80 flex-shrink-0">{sidebar}</div>
      )}
    </div>
  );
}
