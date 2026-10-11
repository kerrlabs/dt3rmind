/**
 * Pure state derivation for the Circuit map. Everything the two views draw —
 * node state (passed / current / locked), per-world rollups, stars, boss state,
 * the "you are here" world and level, the capstone — comes from the progress
 * store via these functions. The single source of "passed / current / locked"
 * is `isLevelUnlocked` from the store; nothing here hard-codes sample state.
 *
 * Not React hooks (no hook rules needed): plain selectors so the same logic is
 * unit-testable without rendering. Named use*State for readability at call sites.
 */
import type { LevelPacket } from '../content/schema';
import type { Progress } from '../store/progress';
import { isLevelUnlocked } from '../store/progress';
import type { WorldMeta } from '../content/worlds';

/** 'open' = playable but not the single "you are here" level. */
export type NodeState = 'passed' | 'current' | 'open' | 'locked';

export interface LevelNode {
  id: string;
  /** 1-based level number within the world (packet.order). */
  order: number;
  title: string;
  state: NodeState;
  stars: number;
  starMax: number;
  isBoss: boolean;
  isKeystone: boolean;
}

export interface WorldNode {
  world: number;
  name: string;
  tool: string;
  meta: WorldMeta;
  state: NodeState;
  /** True when this is the player's current ("you are here") world. */
  isCurrent: boolean;
  passedLevels: number;
  totalLevels: number;
  stars: number;
  /** Boss packet state within this world (null if no boss authored). */
  bossState: NodeState | null;
  bossPassed: boolean;
  rank: string | null;
  /** The current level title inside this world when it is the current world. */
  currentLevelTitle: string | null;
}

export interface CapstoneNode {
  id: string;
  title: string;
  state: NodeState;
  rank: string;
  /** True if a capstone packet is authored at all. */
  exists: boolean;
}

/** Star ceiling for a packet (mirrors LevelPlayer's rule). */
export function starMaxOf(p: LevelPacket): number {
  return p.stars.showMove === null && p.stars.thirdStar === null ? 2 : 3;
}

/** The non-boss, non-keystone practice levels + keystone, sorted by order. */
function worldLevels(packets: LevelPacket[], world: number): LevelPacket[] {
  return packets
    .filter((p) => p.world === world && p.id !== 'capstone')
    .slice()
    .sort((a, b) => a.order - b.order);
}

/** The primary boss of a world (lowest-order boss), or undefined. */
function worldBoss(packets: LevelPacket[], world: number): LevelPacket | undefined {
  return packets
    .filter((p) => p.world === world && p.isBoss)
    .sort((a, b) => a.order - b.order)[0];
}

/**
 * The "current" world: the lowest unlocked world whose boss has not been
 * passed. If every unlocked world's boss is passed, the highest unlocked world
 * is current (nothing left to climb below the lock line).
 */
function currentWorldNumber(
  worlds: number[],
  packets: LevelPacket[],
  progress: Progress,
): number | null {
  let highestUnlocked: number | null = null;
  for (const w of worlds) {
    const anyLevel = packets.find((p) => p.world === w && p.id !== 'capstone');
    if (!anyLevel) continue;
    const unlocked = isLevelUnlocked(anyLevel, packets, progress);
    if (!unlocked) continue;
    highestUnlocked = w;
    const boss = worldBoss(packets, w);
    const bossPassed = boss ? Boolean(progress.passed[boss.id]) : false;
    if (!bossPassed) return w; // first unlocked world still to clear
  }
  return highestUnlocked;
}

/**
 * Derive the ordered world nodes (one per authored world), the current-world
 * marker, and the capstone node.
 */
export function useWorldState(
  packets: LevelPacket[],
  progress: Progress,
  worldMetas: WorldMeta[],
  capstoneRank: string,
): { worlds: WorldNode[]; capstone: CapstoneNode } {
  const worldNumbers = Array.from(new Set(packets.map((p) => p.world)))
    .filter((w) => packets.some((p) => p.world === w && p.id !== 'capstone'))
    .sort((a, b) => a - b);

  const current = currentWorldNumber(worldNumbers, packets, progress);

  const worlds: WorldNode[] = worldNumbers.map((w) => {
    const meta =
      worldMetas.find((m) => m.world === w) ??
      ({ world: w, theme: `World ${w}`, tool: '', toolKey: 'form', moves: '', rank: null } as WorldMeta);
    const levels = worldLevels(packets, w);
    const boss = worldBoss(packets, w);
    const anyLevel = levels[0];
    const unlocked = anyLevel ? isLevelUnlocked(anyLevel, packets, progress) : false;
    const bossPassed = boss ? Boolean(progress.passed[boss.id]) : false;

    const passedLevels = levels.filter((p) => progress.passed[p.id]).length;
    const stars = levels.reduce((sum, p) => sum + (progress.stars[p.id] ?? 0), 0);

    let state: NodeState;
    if (bossPassed) state = 'passed';
    else if (unlocked) state = 'current';
    else state = 'locked';

    const bossState: NodeState | null = !boss
      ? null
      : bossPassed
        ? 'passed'
        : unlocked
          ? 'current'
          : 'locked';

    // Within the current world, the current level is the first unpassed,
    // unlocked, non-boss level (any order allowed, so lowest order wins).
    let currentLevelTitle: string | null = null;
    if (w === current) {
      const next = levels.find(
        (p) => !p.isBoss && !progress.passed[p.id] && isLevelUnlocked(p, packets, progress),
      );
      currentLevelTitle = next ? next.title : boss && !bossPassed ? boss.title : null;
    }

    return {
      world: w,
      name: meta.theme,
      tool: meta.tool,
      meta,
      state,
      isCurrent: w === current,
      passedLevels,
      totalLevels: levels.filter((p) => !p.isBoss).length,
      stars,
      bossState,
      bossPassed,
      rank: meta.rank,
      currentLevelTitle,
    };
  });

  const capPacket = packets.find((p) => p.id === 'capstone');
  const capUnlocked = capPacket ? isLevelUnlocked(capPacket, packets, progress) : false;
  const capPassed = capPacket ? Boolean(progress.passed[capPacket.id]) : false;
  const capstone: CapstoneNode = {
    id: 'capstone',
    title: capPacket?.title ?? '',
    state: capPassed ? 'passed' : capUnlocked ? 'current' : 'locked',
    rank: capstoneRank,
    exists: Boolean(capPacket),
  };

  return { worlds, capstone };
}

/**
 * Derive the ordered level nodes (practice levels + keystone in order, then the
 * boss last) for one world, with each node's state. The boss is always last so
 * the DOM order reads "level 1 … level n, boss".
 */
export function useLevelState(
  packets: LevelPacket[],
  progress: Progress,
  world: number,
): { levels: LevelNode[]; boss: LevelNode | null } {
  const all = worldLevels(packets, world);
  const practice = all.filter((p) => !p.isBoss);
  const bossPacket = worldBoss(packets, world);

  const toNode = (p: LevelPacket): LevelNode => {
    const unlocked = isLevelUnlocked(p, packets, progress);
    const passed = Boolean(progress.passed[p.id]);
    let state: NodeState;
    if (passed) state = 'passed';
    else if (unlocked) state = 'current';
    else state = 'locked';
    return {
      id: p.id,
      order: p.order,
      title: p.title,
      state,
      stars: progress.stars[p.id] ?? 0,
      starMax: starMaxOf(p),
      isBoss: p.isBoss,
      isKeystone: Boolean(p.isKeystone),
    };
  };

  const levels = practice.map(toNode);
  const boss = bossPacket ? toNode(bossPacket) : null;
  // Exactly one "you are here": the first playable unpassed level, else the boss.
  const playable = [...levels, ...(boss ? [boss] : [])].filter((n) => n.state === 'current');
  for (const n of playable.slice(1)) n.state = 'open';
  return { levels, boss };
}

/** The ordered list of world numbers that have authored (non-capstone) content. */
export function authoredWorldNumbers(packets: LevelPacket[]): number[] {
  return Array.from(new Set(packets.map((p) => p.world)))
    .filter((w) => packets.some((p) => p.world === w && p.id !== 'capstone'))
    .sort((a, b) => a - b);
}
