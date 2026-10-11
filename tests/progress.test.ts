/**
 * (c) Progress store unit tests: XP first-pass-only, best-stars, move/trick
 * collection, rank thresholds, unlock gating, and localStorage round-trip.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadAllPackets } from './loadPackets';
import {
  emptyProgress,
  recordPass,
  rankForXp,
  isLevelUnlocked,
  loadProgress,
  saveProgress,
  STORAGE_KEY,
} from '../src/store/progress';

const packets = loadAllPackets();
const w1 = packets.find((p) => p.id === 'w1-l1')!;
const w2 = packets.find((p) => p.id === 'w2-l3')!;
const w4 = packets.find((p) => p.id === 'w4-l4')!;

describe('recordPass', () => {
  it('adds XP only on the first pass of a level', () => {
    let prog = emptyProgress();
    prog = recordPass(prog, w2, 2, 35);
    expect(prog.xp).toBe(35);
    prog = recordPass(prog, w2, 3, 35); // re-solve: no XP farm
    expect(prog.xp).toBe(35);
  });
  it('keeps the best star count', () => {
    let prog = emptyProgress();
    prog = recordPass(prog, w2, 3, 35);
    prog = recordPass(prog, w2, 1, 35);
    expect(prog.stars['w2-l3']).toBe(3);
  });
  it('collects real moves and busts tricks', () => {
    let prog = emptyProgress();
    prog = recordPass(prog, w2, 2, 35);
    expect(prog.moves).toEqual(expect.arrayContaining(['tool', 'run', 'show']));
    expect(prog.bustedTricks).toEqual(expect.arrayContaining(['care', 'steps', 'expert', 'just']));
  });
  it('marks the level passed', () => {
    const prog = recordPass(emptyProgress(), w1, 2, 35);
    expect(prog.passed['w1-l1']).toBe(true);
  });
});

describe('rankForXp', () => {
  it('starts at Guesser', () => {
    expect(rankForXp(0).name).toBe('Guesser');
  });
  it('advances with XP and reports the next threshold', () => {
    const r = rankForXp(130);
    expect(r.name).toBe('Tool User');
    expect(r.nextMinXp).toBe(220);
  });
  it('top rank has no next threshold', () => {
    expect(rankForXp(10000).nextMinXp).toBeNull();
  });
});

describe('isLevelUnlocked (boss-gated, SPEC §5/§6)', () => {
  const w1boss = packets.find((p) => p.id === 'w1-boss')!;
  const w2l1 = packets.find((p) => p.id === 'w2-l1')!;
  const w2boss = packets.find((p) => p.id === 'w2-boss')!;
  const w3l1 = packets.find((p) => p.id === 'w3-l1')!;
  const capstone = packets.find((p) => p.id === 'capstone')!;
  const w7boss = packets.find((p) => p.id === 'w7-boss')!;

  it('World 1 is fully open (all levels + boss) with no progress', () => {
    const prog = emptyProgress();
    for (const p of packets.filter((x) => x.world === 1)) {
      expect(isLevelUnlocked(p, packets, prog)).toBe(true);
    }
  });

  it('every level AND the boss of an unlocked world is playable in any order', () => {
    // W2 unlocked by passing the W1 boss; then all W2 levels + its boss open,
    // without passing any W2 practice level first.
    const prog = recordPass(emptyProgress(), w1boss, 2, 85);
    for (const p of packets.filter((x) => x.world === 2)) {
      expect(isLevelUnlocked(p, packets, prog)).toBe(true);
    }
  });

  it('a later world stays locked until the previous world BOSS is passed', () => {
    const prog = emptyProgress();
    expect(isLevelUnlocked(w2l1, packets, prog)).toBe(false); // W1 boss not passed
    // Passing a W1 practice level is NOT enough — only the boss advances.
    const afterPractice = recordPass(prog, packets.find((p) => p.id === 'w1-l1')!, 2, 35);
    expect(isLevelUnlocked(w2l1, packets, afterPractice)).toBe(false);
    const afterBoss = recordPass(afterPractice, w1boss, 2, 85);
    expect(isLevelUnlocked(w2l1, packets, afterBoss)).toBe(true);
  });

  it('W3 unlocks on the W2 boss, not on the last W2 practice level', () => {
    const prog = recordPass(emptyProgress(), w1boss, 2, 85);
    expect(isLevelUnlocked(w3l1, packets, prog)).toBe(false);
    const afterW2Boss = recordPass(prog, w2boss, 2, 85);
    expect(isLevelUnlocked(w3l1, packets, afterW2Boss)).toBe(true);
  });

  it('the capstone unlocks only after the W7 boss is passed', () => {
    // Build progress with every boss EXCEPT the W7 boss passed.
    let prog = emptyProgress();
    for (const b of packets.filter((p) => p.isBoss && p.id !== 'capstone' && p.id !== 'w7-boss')) {
      prog = recordPass(prog, b, 2, 85);
    }
    expect(isLevelUnlocked(capstone, packets, prog)).toBe(false);
    const afterW7 = recordPass(prog, w7boss, 2, 85);
    expect(isLevelUnlocked(capstone, packets, afterW7)).toBe(true);
  });
});

describe('persistence', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips through localStorage', () => {
    const prog = recordPass(emptyProgress(), w4, 3, 85);
    saveProgress(prog);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    const loaded = loadProgress();
    expect(loaded.xp).toBe(85);
    expect(loaded.passed['w4-l4']).toBe(true);
  });
  it('returns empty progress when storage is empty', () => {
    expect(loadProgress()).toEqual(emptyProgress());
  });
  it('survives corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadProgress()).toEqual(emptyProgress());
  });
});
