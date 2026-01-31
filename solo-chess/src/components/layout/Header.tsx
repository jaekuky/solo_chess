// src/components/layout/Header.tsx

import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <span className="text-2xl">♔</span>
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Solo Chess
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.SETTINGS}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="설정"
          >
            <span className="text-xl">⚙️</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
