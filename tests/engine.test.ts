/**
 * Engine unit tests: condition matching, first-match-wins ordering, stars, XP,
 * and the W4 simulator's signature outcomes (false green, vacuous, pass).
 */
import { describe, it, expect } from 'vitest';
import { loadAllPackets } from './loadPackets';
import {
  conditionsMatch,
  resolveOutcome,
  computeStars,
  computeXp,
  emptyPicks,
} from '../src/engine/engine';
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

describe('conditionsMatch', () => {
  const picks: Picks = { moves: { a: true, b: false }, subChoices: { c: true } };
  it('requireAll', () => {
    expect(conditionsMatch({ requireAll: ['a', 'c'] }, picks)).toBe(true);
    expect(conditionsMatch({ requireAll: ['a', 'b'] }, picks)).toBe(false);
  });
  it('requireAny', () => {
    expect(conditionsMatch({ requireAny: ['b', 'c'] }, picks)).toBe(true);
    expect(conditionsMatch({ requireAny: ['b'] }, picks)).toBe(false);
  });
  it('forbidAny', () => {
    expect(conditionsMatch({ forbidAny: ['b'] }, picks)).toBe(true);
    expect(conditionsMatch({ forbidAny: ['a'] }, picks)).toBe(false);
  });
  it('empty conditions always match', () => {
    expect(conditionsMatch({}, picks)).toBe(true);
  });
});

describe('w2-l3 (rule table) outcomes mirror the prototype', () => {
  const p = byId('w2-l3');
  it('naive (no chips) scatters and fails', () => {
    const r = resolveOutcome(p, emptyPicks(p));
    expect(r.isPass).toBe(false);
    expect(r.rule.id).toBe('naive');
    expect(r.doer).toBe('ai-guessing');
  });
  it('any trick (incl. "just the number") -> tricks branch, not naive', () => {
    expect(resolveOutcome(p, pick(p, ['just'])).rule.id).toBe('tricks');
    expect(resolveOutcome(p, pick(p, ['care'])).rule.id).toBe('tricks');
  });
  it('tool without run -> formula_only (guessed total)', () => {
    const r = resolveOutcome(p, pick(p, ['tool']));
    expect(r.rule.id).toBe('formula_only');
    expect(r.isPass).toBe(false);
  });
  it('tool + run -> pass, spreadsheet did the math', () => {
    const r = resolveOutcome(p, pick(p, ['tool', 'run']));
    expect(r.isPass).toBe(true);
    expect(r.doer).toBe('spreadsheet');
  });
  it('tool + run + a trick -> blocked by anti-gaming (not a pass)', () => {
    const r = resolveOutcome(p, pick(p, ['tool', 'run', 'care', 'expert']));
    expect(r.isPass).toBe(false);
    expect(r.rule.id).toBe('right-moves-plus-tricks');
  });
});

describe('w4-l4 (simulator) signature outcomes', () => {
  const p = byId('w4-l4');
  it('naive -> 4 of 8 broken, no pass', () => {
    const r = resolveOutcome(p, emptyPicks(p));
    expect(r.isPass).toBe(false);
    expect((r.output as { actualGood?: number }).actualGood ?? 4).toBeLessThan(8);
  });
  it('checker without run -> false promise, no pass', () => {
    const r = resolveOutcome(p, pick(p, ['check'], ['greet', 'name', 'step']));
    expect(r.isPass).toBe(false);
    expect(r.rule.id).toBe('notRun');
  });
  it('check + run + 3 rules but NO prove -> false green (bug), no pass', () => {
    const r = resolveOutcome(p, pick(p, ['check', 'run'], ['greet', 'name', 'step']));
    expect(r.isPass).toBe(false);
    expect(r.rule.id).toBe('bug');
    expect(r.claim).toContain('8 of 8');
  });
  it('checker testing only tone -> vacuous, no pass', () => {
    const r = resolveOutcome(p, pick(p, ['check', 'run', 'prove'], ['friendly', 'pro']));
    expect(r.isPass).toBe(false);
    expect(r.rule.id).toBe('vague');
  });
  it('check + prove + run + 3 real rules -> pass', () => {
    const r = resolveOutcome(p, pick(p, ['check', 'prove', 'run'], ['greet', 'name', 'step']));
    expect(r.isPass).toBe(true);
  });
  it('extra vague criteria do not break a real pass', () => {
    const r = resolveOutcome(
      p,
      pick(p, ['check', 'prove', 'run'], ['greet', 'name', 'step', 'friendly']),
    );
    expect(r.isPass).toBe(true);
  });
});

describe('stars and xp', () => {
  const p = byId('w2-l3');
  it('no stars on a non-pass', () => {
    expect(computeStars(p, emptyPicks(p), { attempts: 1, hints: 0 }, false)).toBe(0);
  });
  it('two stars within budget, no third-star move', () => {
    const picks = pick(p, ['tool', 'run']);
    expect(computeStars(p, picks, { attempts: 1, hints: 0 }, true)).toBe(2);
  });
  it('three stars when show-the-work move included', () => {
    const picks = pick(p, ['tool', 'run', 'show']);
    expect(computeStars(p, picks, { attempts: 1, hints: 0 }, true)).toBe(3);
  });
  it('over budget or 3 hints caps the second star', () => {
    const picks = pick(p, ['tool', 'run', 'show']);
    expect(computeStars(p, picks, { attempts: 9, hints: 0 }, true)).toBe(2);
    expect(computeStars(p, picks, { attempts: 1, hints: 3 }, true)).toBe(2);
  });
  it('W1 L1 caps at two stars by design (showMove null)', () => {
    const w1 = byId('w1-l1');
    const picks = pick(w1, ['shape', 'price_num']);
    expect(computeStars(w1, picks, { attempts: 1, hints: 0 }, true)).toBe(2);
  });
  it('xp adds seen-failing and boss bonuses', () => {
    expect(computeXp(p, { seenFailing: true })).toBe(35); // 20 + 15
    expect(computeXp(p, { seenFailing: false })).toBe(20);
    const boss = byId('w4-l4');
    expect(computeXp(boss, { seenFailing: true })).toBe(85); // 20 + 15 + 50
  });
});
