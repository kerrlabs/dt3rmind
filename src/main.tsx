import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './app/AppContext';
import { WorldMap } from './pages/WorldMap';
import { LevelPlayer } from './pages/LevelPlayer';
import { Settings } from './pages/Settings';
import './styles.css';

// HashRouter so the built static app works from any path (no server rewrites).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<WorldMap />} />
          <Route path="/level/:id" element={<LevelPlayer />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  </StrictMode>,
);
