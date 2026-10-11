/**
 * (b) EXHAUSTIVE combination test — the gate wave-2 authors must keep green.
 *
 * For every packet, enumerate every combination of moves AND sub-choices
 * (2^moves × 2^subChoices). For each:
 *   - the engine's pass verdict must equal the INDEPENDENT `expectPass` oracle;
 *   - every non-pass combination must resolve to a rule with non-empty feedback;
 *   - no combination may throw (rule table is total).
 *
 * The engine and the oracle are derived from different fields (rules + optional
 * simulator vs. expectPass), so agreement across the whole space is real
 * evidence the packet is correct — a rule-table or simulator bug surfaces as a
 * mismatch on some combination.
 */
import { describe, it, expect } from 'vitest';
import { loadAllPackets } from './loadPackets';
import { resolveOutcome, expectedToPass } from '../src/engine/engine';
import type { LevelPacket, Picks } from '../src/content/schema';

const packets = loadAllPackets();

/** Enumerate all 2^n on/off assignments for a list of ids. */
function* bitmasks(ids: string[]): Generator<Record<string, boolean>> {
  const n = ids.length;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    const rec: Record<string, boolean> = {};
    for (let i = 0; i < n; i++) rec[ids[i]!] = Boolean(mask & (1 << i));
    yield rec;
  }
}

describe.each(packets.map((p) => [p.id, p] as [string, LevelPacket]))(
  'combinations · %s',
  (_id, p) => {
    const moveIds = p.moves.map((m) => m.id);
    const subIds = p.subChoices.map((s) => s.id);
    const totalCombos = (1 << moveIds.length) * (1 << subIds.length);

    it(`enumerates ${totalCombos} combinations with engine pass-set == expectPass oracle`, () => {
      let passCount = 0;
      let checked = 0;

      for (const moves of bitmasks(moveIds)) {
        for (const subChoices of bitmasks(subIds)) {
          const picks: Picks = { moves: { ...moves }, subChoices: { ...subChoices } };
          checked++;

          const resolved = resolveOutcome(p, picks); // must not throw
          const oracle = expectedToPass(p, picks);

          expect(
            resolved.isPass,
            `pass mismatch for picks ${JSON.stringify(picks)} ` +
              `(engine=${resolved.isPass} via rule "${resolved.rule.id}", oracle=${oracle})`,
          ).toBe(oracle);

          if (resolved.isPass) {
            passCount++;
          } else {
            // every wrong combination gets real feedback
            expect(resolved.feedback.trim().length).toBeGreaterThan(0);
            expect(resolved.lesson.trim().length).toBeGreaterThan(0);
          }
        }
      }

      expect(checked).toBe(totalCombos);
      // There must be at least one passing combination, else the level is unsolvable.
      expect(passCount).toBeGreaterThan(0);
    });

    it('the pass rule is reachable (its own conditions pass the oracle)', () => {
      const passRule = p.rules.find((r) => r.isPass)!;
      // Build the minimal picks that satisfy the pass rule's requireAll +
      // expectPass sub-choice requirements, and confirm it passes.
      const picks: Picks = { moves: {}, subChoices: {} };
      for (const id of passRule.when.requireAll ?? []) {
        if (p.moves.some((m) => m.id === id)) picks.moves[id] = true;
        else picks.subChoices[id] = true;
      }
      for (const id of p.expectPass.requireSubChoicesAll ?? []) {
        picks.subChoices[id] = true;
      }
      for (const id of p.expectPass.exactSubChoices ?? []) {
        picks.subChoices[id] = true;
      }
      for (const id of p.expectPass.conditions.requireAll ?? []) {
        if (p.moves.some((m) => m.id === id)) picks.moves[id] = true;
        else picks.subChoices[id] = true;
      }
      const resolved = resolveOutcome(p, picks);
      expect(resolved.isPass).toBe(true);
      expect(expectedToPass(p, picks)).toBe(true);
    });
  },
);
