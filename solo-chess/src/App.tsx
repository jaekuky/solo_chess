// src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/constants';
import {
  HomePage,
  GameSettingsPage,
  GamePlayPage,
  GameResultPage,
  ReplayPage,
  LearnPage,
  RulesPage,
  PuzzlePage,
  StrategyPage,
  HistoryPage,
  SavedGamesPage,
  SettingsPage,
} from '@/pages';
import { Header, Footer, Navigation } from '@/components/layout';
import { useSettingsStore } from '@/stores';
import { useEffect } from 'react';

function App() {
  const { settings } = useSettingsStore();

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement;

    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', settings.theme === 'dark');
    }
  }, [settings.theme]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
        <Header />
        <Navigation />

        <main className="flex-1 container mx-auto px-4 py-6">
          <Routes>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.GAME_SETTINGS} element={<GameSettingsPage />} />
            <Route path={ROUTES.GAME_PLAY} element={<GamePlayPage />} />
            <Route path={ROUTES.GAME_RESULT} element={<GameResultPage />} />
            <Route path={`${ROUTES.REPLAY}/:gameId`} element={<ReplayPage />} />
            <Route path={ROUTES.LEARN} element={<LearnPage />} />
            <Route path={ROUTES.RULES} element={<RulesPage />} />
            <Route path={ROUTES.PUZZLE} element={<PuzzlePage />} />
            <Route path={ROUTES.STRATEGY} element={<StrategyPage />} />
            <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
            <Route path={ROUTES.SAVED_GAMES} element={<SavedGamesPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
