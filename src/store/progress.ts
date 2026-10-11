/**
 * Progress store — client-side only, persisted to localStorage. The reducer
 * functions are pure and unit-tested; the React layer wraps them with state.
 *
 * Tracks: XP, rank, per-level stars, moves collected, tricks busted (disproven).
 */
import type { LevelPacket } from '../content/schema';

export interface Progress {
  xp: number;
  /** level id -> best star count (0–3). */
  stars: Record<string, number>;
  /** level id -> passed at least once. */
  passed: Record<string, boolean>;
  /** collected real-move ids (the deck), e.g. "tool", "check". */
  moves: string[];
  /** busted trick ids (seen disproven), e.g. "steps", "remind". */
  bustedTricks: string[];
}

const STORAGE_KEY = 'puzzle-ladder:progress:v1';

export function emptyProgress(): Progress {
  return { xp: 0, stars: {}, passed: {}, moves: [], bustedTricks: [] };
}

/** Rank thresholds by XP. Named warmly; "Guesser" is the hero's start (§4). */
export const RANKS: { name: string; minXp: number }[] = [
  { name: 'Guesser', minXp: 0 },
  { name: 'Shaper', minXp: 40 },
  { name: 'Tool User', minXp: 120 },
  { name: 'Checker', minXp: 220 },
  { name: 'Builder', minXp: 400 },
  { name: 'Architect', minXp: 650 },
];

export function rankForXp(xp: number): { name: string; minXp: number; nextMinXp: number | null } {
  let current = RANKS[0]!;
  let next: { minXp: number } | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    const r = RANKS[i]!;
    if (xp >= r.minXp) {
      current = r;
      next = RANKS[i + 1] ?? null;
    }
  }
  return { name: current.name, minXp: current.minXp, nextMinXp: next ? next.minXp : null };
}

/**
 * Fold a passing run into progress. Idempotent on stars (keeps best), additive
 * on XP only the FIRST time a level is passed (so re-solving can't farm XP).
 */
export function recordPass(
  prev: Progress,
  packet: LevelPacket,
  stars: number,
  xpAward: number,
): Progress {
  const firstPass = !prev.passed[packet.id];
  const bestStars = Math.max(prev.stars[packet.id] ?? 0, stars);

  const realMoveIds = packet.moves.filter((m) => m.kind === 'real').map((m) => m.id);
  const moves = Array.from(new Set([...prev.moves, ...realMoveIds]));

  const trickIds = packet.moves.filter((m) => m.kind === 'trick').map((m) => m.id);
  const bustedTricks = Array.from(new Set([...prev.bustedTricks, ...trickIds]));

  return {
    xp: prev.xp + (firstPass ? xpAward : 0),
    stars: { ...prev.stars, [packet.id]: bestStars },
    passed: { ...prev.passed, [packet.id]: true },
    moves,
    bustedTricks,
  };
}

/** A level unlocks when the lowest-order unpassed prerequisite is cleared. */
export function isLevelUnlocked(
  packet: LevelPacket,
  all: LevelPacket[],
  progress: Progress,
): boolean {
  // First level is always open. Otherwise require the immediately-prior
  // level (by sorted order) to have been passed.
  const sorted = [...all].sort((a, b) =>
    a.world !== b.world ? a.world - b.world : a.order - b.order,
  );
  const idx = sorted.findIndex((p) => p.id === packet.id);
  if (idx <= 0) return true;
  const prevLevel = sorted[idx - 1]!;
  return Boolean(progress.passed[prevLevel.id]);
}

/* ---- persistence (guarded for SSR / disabled storage) ---- */

export function loadProgress(): Progress {
  if (typeof localStorage === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...emptyProgress(), ...parsed };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage full or blocked — progress is best-effort */
  }
}

export { STORAGE_KEY };
