// src/components/layout/Navigation.tsx

import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/constants';

const navItems = [
  { path: ROUTES.HOME, label: '홈', icon: '🏠' },
  { path: ROUTES.GAME_SETTINGS, label: '게임', icon: '🎮' },
  { path: ROUTES.LEARN, label: '학습', icon: '📚' },
  { path: ROUTES.HISTORY, label: '기록', icon: '📊' },
];

export function Navigation() {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <ul className="flex gap-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
