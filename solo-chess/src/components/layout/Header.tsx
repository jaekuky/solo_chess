// src/components/layout/Header.tsx

import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/common';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';

export function Header() {
  const location = useLocation();

  const navItems = [
    { path: ROUTES.HOME, label: '홈', icon: '🏠' },
    { path: ROUTES.LEARN, label: '학습', icon: '📚' },
    { path: ROUTES.HISTORY, label: '기록', icon: '📊' },
    { path: ROUTES.SETTINGS, label: '설정', icon: '⚙️' },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <span className="text-2xl">♟️</span>
            <span className="font-bold text-lg hidden sm:block">
              Solo Chess
            </span>
          </Link>

          {/* 네비게이션 */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <span className="sm:hidden">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}

            {/* 테마 토글 */}
            <ThemeToggle className="ml-2" />
          </nav>
        </div>
      </div>
    </header>
  );
}
