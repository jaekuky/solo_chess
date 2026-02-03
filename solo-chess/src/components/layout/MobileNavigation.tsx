// src/components/layout/MobileNavigation.tsx

import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: ROUTES.HOME, label: '홈', icon: '🏠' },
  { path: ROUTES.GAME_SETTINGS, label: '게임', icon: '🎮' },
  { path: ROUTES.LEARN, label: '학습', icon: '📚' },
  { path: ROUTES.HISTORY, label: '기록', icon: '📊' },
  { path: ROUTES.SETTINGS, label: '설정', icon: '⚙️' },
];

export function MobileNavigation() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t dark:border-gray-800 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== ROUTES.HOME && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
