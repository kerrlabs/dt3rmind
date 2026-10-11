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

describe('isLevelUnlocked', () => {
  it('first level is always unlocked', () => {
    expect(isLevelUnlocked(w1, packets, emptyProgress())).toBe(true);
  });
  it('later level locked until the prior one is passed', () => {
    const sorted = [...packets].sort((a, b) =>
      a.world !== b.world ? a.world - b.world : a.order - b.order,
    );
    const prev = sorted[sorted.findIndex((p) => p.id === w2.id) - 1]!;
    const prog = emptyProgress();
    expect(isLevelUnlocked(w2, packets, prog)).toBe(false);
    const after = recordPass(prog, prev, 2, 35);
    expect(isLevelUnlocked(w2, packets, after)).toBe(true);
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
