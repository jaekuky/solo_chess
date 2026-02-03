// src/components/layout/Layout.tsx

import type { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { PageTransition } from '@/components/common';
import { useResponsive } from '@/hooks';
import { cn } from '@/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isMobile } = useResponsive();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* 헤더 (모바일에서는 단순화) */}
      <Header />
      
      {/* 메인 콘텐츠 */}
      <main className={cn(
        'flex-1 w-full max-w-5xl mx-auto px-4 py-6',
        isMobile && 'pb-24' // 모바일 네비게이션 공간 확보
      )}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      
      {/* 모바일 하단 네비게이션 */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}
