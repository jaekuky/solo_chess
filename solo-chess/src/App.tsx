// src/App.tsx

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { useSettingsStore } from '@/stores';
import { preloadSounds } from '@/utils/sounds';
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

function App() {
  const { settings } = useSettingsStore();

  // 접근성 클래스 적용
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle(
      'high-contrast',
      settings.accessibility.highContrast
    );
    root.classList.toggle('large-text', settings.accessibility.largeText);
    root.classList.toggle('reduce-motion', settings.accessibility.reduceMotion);
  }, [settings.accessibility]);

  // 사운드 미리 로드
  useEffect(() => {
    preloadSounds();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
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
      </Layout>
    </BrowserRouter>
  );
}

export default App;
