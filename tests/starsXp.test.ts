/**
 * (4,5,14) Stars / XP table tests — closes the coverage hole the exhaustive
 * combination test cannot see: it fixes attempts/hints to the pass branch and
 * never varies them (engineering review Finding #4). This sweeps the full
 * {attempts ≤/> budget} × {hints <3/=3} × {show-move on/off} grid for a
 * representative non-boss level and a boss, asserting the EXACT star count, and
 * pins first-pass-only XP math plus the untested atMost/atLeast conditions
 * (Finding #14).
 */
import { describe, it, expect } from 'vitest';
import { loadAllPackets } from './loadPackets';
import {
  computeStars,
  computeXp,
  conditionsMatch,
  emptyPicks,
} from '../src/engine/engine';
import { recordPass, emptyProgress } from '../src/store/progress';
import type { LevelPacket, Picks } from '../src/content/schema';

const packets = loadAllPackets();
const byId = (id: string): LevelPacket => {
  const p = packets.find((x) => x.id === id);
  if (!p) throw new Error(`missing packet ${id}`);
  return p;
};
function pick(p: LevelPacket, moves: string[], subs: string[] = []): Picks {
  const picks = emptyPicks(p);
  for (const m of moves) picks.moves[m] = true;
  for (const s of subs) picks.subChoices[s] = true;
  return picks;
}

/**
 * Expected stars for the canonical rubric (SPEC §8):
 *   ★ pass; +★ if within attemptBudget AND hints < 3; +★ if the show-move is on.
 */
function expectStars(
  budget: number,
  attempts: number,
  hints: number,
  show: boolean,
): number {
  let s = 1;
  if (attempts <= budget && hints < 3) s += 1;
  if (show) s += 1;
  return s;
}

describe('stars table · w2-l3 (budget 2, showMove "show")', () => {
  const p = byId('w2-l3');
  const budget = p.stars.attemptBudget; // 2

  const attemptsCases = [1, budget, budget + 1, budget + 5];
  const hintsCases = [0, 2, 3];
  const showCases = [false, true];

  for (const attempts of attemptsCases) {
    for (const hints of hintsCases) {
      for (const show of showCases) {
        const want = expectStars(budget, attempts, hints, show);
        it(`attempts=${attempts} hints=${hints} show=${show} => ${want}★`, () => {
          const picks = pick(p, show ? ['tool', 'run', 'show'] : ['tool', 'run']);
          expect(computeStars(p, picks, { attempts, hints }, true)).toBe(want);
        });
      }
    }
  }

  it('non-pass always scores 0 regardless of state', () => {
    expect(computeStars(p, emptyPicks(p), { attempts: 1, hints: 0 }, false)).toBe(0);
  });
});

describe('stars table · w4-l4 boss (budget 3, showMove "show")', () => {
  const p = byId('w4-l4');
  const budget = p.stars.attemptBudget; // 3
  const base = ['check', 'prove', 'run'];
  const subs = ['greet', 'name', 'step'];

  for (const attempts of [1, budget, budget + 1]) {
    for (const hints of [0, 3]) {
      for (const show of [false, true]) {
        const want = expectStars(budget, attempts, hints, show);
        it(`attempts=${attempts} hints=${hints} show=${show} => ${want}★`, () => {
          const picks = pick(p, show ? [...base, 'show'] : base, subs);
          expect(computeStars(p, picks, { attempts, hints }, true)).toBe(want);
        });
      }
    }
  }
});

describe('stars · ★★-max level (w1-l1, showMove null)', () => {
  const p = byId('w1-l1');
  it('caps at 2 even with every star condition met', () => {
    const picks = pick(p, ['shape', 'price_num']);
    expect(computeStars(p, picks, { attempts: 1, hints: 0 }, true)).toBe(2);
  });
  it('still awards 1★ when over budget', () => {
    const picks = pick(p, ['shape', 'price_num']);
    expect(computeStars(p, picks, { attempts: 99, hints: 3 }, true)).toBe(1);
  });
});

describe('xp · non-boss vs boss, seen-failing', () => {
  const nb = byId('w2-l3');
  const boss = byId('w4-l4');
  it('non-boss: level + seenFailing', () => {
    expect(computeXp(nb, { seenFailing: true })).toBe(nb.xp.level + nb.xp.seenFailing);
    expect(computeXp(nb, { seenFailing: false })).toBe(nb.xp.level);
  });
  it('boss: level + seenFailing + boss bonus', () => {
    expect(computeXp(boss, { seenFailing: true })).toBe(
      boss.xp.level + boss.xp.seenFailing + boss.xp.boss,
    );
  });
});

describe('xp · first-pass-only via recordPass (no farming)', () => {
  const p = byId('w2-l3');
  it('awards XP only on the first pass; re-solving adds nothing', () => {
    let prog = emptyProgress();
    const award = computeXp(p, { seenFailing: true });
    prog = recordPass(prog, p, 3, award);
    expect(prog.xp).toBe(award);
    prog = recordPass(prog, p, 1, award); // re-solve
    expect(prog.xp).toBe(award); // unchanged
    expect(prog.stars[p.id]).toBe(3); // but best stars kept
  });
});

describe('conditionsMatch · atMost / atLeast (Finding #14)', () => {
  const picks: Picks = {
    moves: { a: true, b: true, c: false },
    subChoices: { d: true },
  };
  it('atMost: passes at/under n, fails over n', () => {
    expect(conditionsMatch({ atMost: { ids: ['a', 'b', 'c'], n: 2 } }, picks)).toBe(true);
    expect(conditionsMatch({ atMost: { ids: ['a', 'b', 'd'], n: 2 } }, picks)).toBe(false);
  });
  it('atLeast: passes at/over n, fails under n', () => {
    expect(conditionsMatch({ atLeast: { ids: ['a', 'b'], n: 2 } }, picks)).toBe(true);
    expect(conditionsMatch({ atLeast: { ids: ['a', 'c'], n: 2 } }, picks)).toBe(false);
  });
  it('atMost + atLeast compose', () => {
    expect(
      conditionsMatch(
        { atLeast: { ids: ['a', 'b', 'd'], n: 2 }, atMost: { ids: ['a', 'b', 'c', 'd'], n: 3 } },
        picks,
      ),
    ).toBe(true);
  });
});
