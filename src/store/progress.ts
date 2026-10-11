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

/**
 * Unlock gating (SPEC §5/§6, lead decision):
 *   - World 1 is open.
 *   - Within an unlocked world, ALL levels and the boss are playable in any
 *     order (per-level passes are practice; only the boss gates progression).
 *   - World N+1 unlocks when World N's boss has been passed.
 *   - A world may carry more than one boss (the capstone is authored in the
 *     final world as a second, higher-order boss). A later boss in the same
 *     world gates on the earlier boss of that world — so the capstone unlocks
 *     only after the world's regular boss is passed.
 *
 * A world with no authored boss cannot gate the next world (there is nothing
 * to pass); in that case the next world unlocks once ANY level of the current
 * world is passed, so sparse/in-progress content never hard-locks the ladder.
 */
export function isLevelUnlocked(
  packet: LevelPacket,
  all: LevelPacket[],
  progress: Progress,
): boolean {
  // World 1 (and anything at/below it) is open at the WORLD level. A later
  // boss inside the same world (the capstone) may still gate on an earlier one.
  const sameWorld = all.filter((p) => p.world === packet.world);
  const earlierBossSameWorld = sameWorld
    .filter((p) => p.isBoss && p.order < packet.order)
    .sort((a, b) => a.order - b.order)
    .pop();
  if (earlierBossSameWorld) {
    // e.g. the capstone: unlock only after the world's regular boss is passed.
    return Boolean(progress.passed[earlierBossSameWorld.id]);
  }

  if (packet.world <= 1) return true;

  // Collect the worlds that have content, ascending.
  const worlds = Array.from(new Set(all.map((p) => p.world))).sort((a, b) => a - b);

  // Gate on the authored world immediately below this packet's world.
  const prevWorld = worlds.filter((w) => w < packet.world).pop();
  if (prevWorld === undefined) return true; // nothing authored below -> open

  const prevWorldLevels = all.filter((p) => p.world === prevWorld);
  // Gate on the previous world's PRIMARY boss (lowest order). A capstone-style
  // extra boss in that world is not required to advance to the next world.
  const prevBoss = prevWorldLevels
    .filter((p) => p.isBoss)
    .sort((a, b) => a.order - b.order)[0];

  if (prevBoss) {
    return Boolean(progress.passed[prevBoss.id]);
  }
  // No boss authored in the previous world: unlock once any level there passed.
  return prevWorldLevels.some((p) => progress.passed[p.id]);
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
