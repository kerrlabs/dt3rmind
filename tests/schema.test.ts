/**
 * (a) Schema validation of every packet in content/levels.
 * Structural + referential integrity the engine and renderers depend on.
 */
import { describe, it, expect } from 'vitest';
import { loadAllPackets } from './loadPackets';
import { registeredSimulatorIds } from '../src/content/simulators';
import type { LevelPacket, RuleConditions } from '../src/content/schema';

const packets = loadAllPackets();
const RENDERERS = ['numeric-scatter', 'item-grid', 'text-answer', 'table'];
const DOERS = ['ai-guessing', 'tool', 'spreadsheet', 'checker', 'source'];
const KINDS = ['real', 'trick'];

function allConditionIds(c: RuleConditions): string[] {
  return [...(c.requireAll ?? []), ...(c.requireAny ?? []), ...(c.forbidAny ?? [])];
}

describe('packet discovery', () => {
  it('finds the three wave-1 packets', () => {
    const ids = packets.map((p) => p.id).sort();
    expect(ids).toEqual(['w1-l1', 'w2-l3', 'w4-l4']);
  });
});

describe.each(packets.map((p) => [p.id, p] as [string, LevelPacket]))(
  'packet %s',
  (_id, p) => {
    it('has required top-level fields', () => {
      expect(typeof p.id).toBe('string');
      expect(typeof p.world).toBe('number');
      expect(typeof p.order).toBe('number');
      expect(p.title).toBeTruthy();
      expect(p.kicker).toBeTruthy();
      expect(Array.isArray(p.competencies)).toBe(true);
      expect(Array.isArray(p.movesTaught)).toBe(true);
      expect(typeof p.isBoss).toBe('boolean');
      expect(p.job?.text).toBeTruthy();
      expect(p.naivePrompt).toBeTruthy();
      expect(p.basePrompt).toBeTruthy();
      expect(RENDERERS).toContain(p.renderer);
    });

    it('has valid moves', () => {
      expect(p.moves.length).toBeGreaterThan(0);
      const ids = new Set<string>();
      for (const m of p.moves) {
        expect(m.id).toBeTruthy();
        expect(ids.has(m.id)).toBe(false);
        ids.add(m.id);
        expect(KINDS).toContain(m.kind);
        expect(m.label).toBeTruthy();
        expect(typeof m.text.plain).toBe('string');
        expect(m.text.plain.length).toBeGreaterThan(0);
        // tech may be null (plain-only chip) but if present must be non-empty
        if (m.text.tech !== null) expect(m.text.tech.length).toBeGreaterThan(0);
      }
    });

    it('has valid sub-choices (unique ids, kinds)', () => {
      const ids = new Set<string>();
      for (const s of p.subChoices) {
        expect(ids.has(s.id)).toBe(false);
        ids.add(s.id);
        expect(KINDS).toContain(s.kind);
        expect(s.label).toBeTruthy();
      }
    });

    it('has at least one rule and a total rule table (catch-all last)', () => {
      expect(p.rules.length).toBeGreaterThan(0);
      const last = p.rules[p.rules.length - 1]!;
      const lastCond = allConditionIds(last.when);
      expect(lastCond.length).toBe(0); // final rule is an unconditional catch-all
    });

    it('rules reference only declared move/sub-choice ids', () => {
      const known = new Set<string>([
        ...p.moves.map((m) => m.id),
        ...p.subChoices.map((s) => s.id),
      ]);
      for (const r of p.rules) {
        for (const id of allConditionIds(r.when)) {
          expect(known.has(id), `rule "${r.id}" references unknown id "${id}"`).toBe(true);
        }
      }
    });

    it('every rule has non-empty feedback, lesson, claim and valid doer', () => {
      const ruleIds = new Set<string>();
      for (const r of p.rules) {
        expect(ruleIds.has(r.id)).toBe(false);
        ruleIds.add(r.id);
        expect(r.feedback.trim().length).toBeGreaterThan(0);
        expect(r.lesson.trim().length).toBeGreaterThan(0);
        expect(r.claim.trim().length).toBeGreaterThan(0);
        expect(DOERS).toContain(r.doer);
        expect(typeof r.isPass).toBe('boolean');
        expect(r.output).toBeTypeOf('object');
      }
    });

    it('declares exactly one pass rule', () => {
      const passRules = p.rules.filter((r) => r.isPass);
      expect(passRules.length).toBe(1);
    });

    it('has a complete hint ladder', () => {
      expect(p.hints.nudge).toBeTruthy();
      expect(p.hints.gap).toBeTruthy();
      expect(p.hints.moves).toBeTruthy();
    });

    it('has star rule, xp, try-it and expectPass', () => {
      expect(p.stars.attemptBudget).toBeGreaterThan(0);
      if (p.stars.showMove !== null) {
        const moveIds = new Set(p.moves.map((m) => m.id));
        expect(moveIds.has(p.stars.showMove)).toBe(true);
      }
      expect(p.xp.level).toBeGreaterThanOrEqual(0);
      expect(p.tryIt.template.plain).toBeTruthy();
      expect(p.tryIt.notes.length).toBeGreaterThanOrEqual(3);
      expect(p.expectPass.conditions).toBeDefined();
    });

    it('references only registered simulators', () => {
      if (p.simulatorId) {
        expect(registeredSimulatorIds()).toContain(p.simulatorId);
      }
    });

    it('expectPass references only declared ids', () => {
      const known = new Set<string>([
        ...p.moves.map((m) => m.id),
        ...p.subChoices.map((s) => s.id),
      ]);
      const ep = p.expectPass;
      for (const id of allConditionIds(ep.conditions)) {
        expect(known.has(id)).toBe(true);
      }
      for (const id of [
        ...(ep.exactSubChoices ?? []),
        ...(ep.requireSubChoicesAll ?? []),
        ...(ep.forbidSubChoicesAny ?? []),
      ]) {
        expect(known.has(id)).toBe(true);
      }
    });
  },
);
