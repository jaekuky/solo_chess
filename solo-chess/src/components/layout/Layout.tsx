// src/components/layout/Layout.tsx

import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      <Header />
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <Footer />
    </div>
  );
}
