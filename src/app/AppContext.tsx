/**
 * App-wide settings (theme, skin, reduced motion) and progress, persisted to
 * localStorage. Reduced motion defaults to the OS preference but is overridable.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Progress } from '../store/progress';
import { loadProgress, saveProgress } from '../store/progress';

export type Skin = 'plain' | 'tech';
export type Theme = 'dark' | 'light';

interface Settings {
  theme: Theme;
  skin: Skin;
  reducedMotion: boolean;
}

interface AppState extends Settings {
  setTheme: (t: Theme) => void;
  setSkin: (s: Skin) => void;
  setReducedMotion: (r: boolean) => void;
  progress: Progress;
  setProgress: (p: Progress) => void;
}

const SETTINGS_KEY = 'puzzle-ladder:settings:v1';

function osReducedMotion(): boolean {
  if (typeof matchMedia === 'undefined') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function loadSettings(): Settings {
  const base: Settings = { theme: 'dark', skin: 'plain', reducedMotion: osReducedMotion() };
  if (typeof localStorage === 'undefined') return base;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return base;
    return { ...base, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return base;
  }
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const initial = loadSettings();
  const [theme, setTheme] = useState<Theme>(initial.theme);
  const [skin, setSkin] = useState<Skin>(initial.skin);
  const [reducedMotion, setReducedMotion] = useState<boolean>(initial.reducedMotion);
  const [progress, setProgressState] = useState<Progress>(() => loadProgress());

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    document.body.classList.toggle('reduce-motion', reducedMotion);
  }, [theme, reducedMotion]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme, skin, reducedMotion }));
    } catch {
      /* best-effort */
    }
  }, [theme, skin, reducedMotion]);

  const setProgress = (p: Progress): void => {
    setProgressState(p);
    saveProgress(p);
  };

  const value = useMemo<AppState>(
    () => ({
      theme,
      skin,
      reducedMotion,
      setTheme,
      setSkin,
      setReducedMotion,
      progress,
      setProgress,
    }),
    [theme, skin, reducedMotion, progress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
