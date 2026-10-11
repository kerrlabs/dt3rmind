/**
 * Generic level engine — PURE (no DOM, no React). This is what the exhaustive
 * combination test exercises headlessly.
 *
 * Flow (SPEC §4): just-ask phase -> rewrite phase -> run -> resolve outcome by
 * rules (or a named simulator) -> feedback -> stars/XP.
 */
import type {
  LevelPacket,
  OutcomeRule,
  Picks,
  RuleConditions,
} from '../content/schema';
import { getSimulator } from '../content/simulators';

/** Does a single id resolve to "picked" across moves + sub-choices? */
function isOn(picks: Picks, id: string): boolean {
  return Boolean(picks.moves[id] || picks.subChoices[id]);
}

/** Evaluate rule conditions against the current picks. */
export function conditionsMatch(cond: RuleConditions, picks: Picks): boolean {
  if (cond.requireAll && !cond.requireAll.every((id) => isOn(picks, id))) {
    return false;
  }
  if (cond.requireAny && !cond.requireAny.some((id) => isOn(picks, id))) {
    return false;
  }
  if (cond.forbidAny && cond.forbidAny.some((id) => isOn(picks, id))) {
    return false;
  }
  const count = (ids: string[]) => ids.filter((id) => isOn(picks, id)).length;
  if (cond.atMost && count(cond.atMost.ids) > cond.atMost.n) return false;
  if (cond.atLeast && count(cond.atLeast.ids) < cond.atLeast.n) return false;
  return true;
}

/** The outcome of a run, after rule resolution and/or simulation. */
export interface Resolved {
  rule: OutcomeRule;
  isPass: boolean;
  /** Renderer payload. Rules supply `output`; a simulator may override it. */
  output: Record<string, unknown>;
  /** Who did the work (thesis label). */
  doer: OutcomeRule['doer'];
  claim: string;
  feedback: string;
  lesson: string;
}

/**
 * Resolve the outcome for a set of picks. First matching rule wins. If the
 * packet names a simulator, it runs and may override pass/output/claim while
 * the matched rule still supplies feedback + lesson as a fallback.
 */
export function resolveOutcome(packet: LevelPacket, picks: Picks): Resolved {
  const rule = packet.rules.find((r) => conditionsMatch(r.when, picks));
  if (!rule) {
    throw new Error(
      `No outcome rule matched for packet "${packet.id}". Rule tables must be ` +
        `total — add a catch-all rule (empty conditions) as the last entry.`,
    );
  }

  let isPass = rule.isPass;
  let output = rule.output;
  let claim = rule.claim;
  let doer = rule.doer;

  if (packet.simulatorId) {
    const sim = getSimulator(packet.simulatorId);
    const simResult = sim(packet, picks, rule);
    isPass = simResult.isPass;
    output = simResult.output;
    if (simResult.claim !== undefined) claim = simResult.claim;
    if (simResult.doer !== undefined) doer = simResult.doer;
  }

  return {
    rule,
    isPass,
    output,
    doer,
    claim,
    feedback: rule.feedback,
    lesson: rule.lesson,
  };
}

/**
 * The independent pass oracle used by the combination test. Mirrors
 * `expectPass` WITHOUT consulting the rule table, so a rule bug is detectable.
 */
export function expectedToPass(packet: LevelPacket, picks: Picks): boolean {
  const ep = packet.expectPass;
  if (!conditionsMatch(ep.conditions, picks)) return false;

  if (ep.exactSubChoices) {
    const onSubs = packet.subChoices
      .filter((s) => picks.subChoices[s.id])
      .map((s) => s.id)
      .sort();
    const want = [...ep.exactSubChoices].sort();
    if (onSubs.length !== want.length) return false;
    if (!onSubs.every((id, i) => id === want[i])) return false;
  }
  if (
    ep.requireSubChoicesAll &&
    !ep.requireSubChoicesAll.every((id) => picks.subChoices[id])
  ) {
    return false;
  }
  if (
    ep.forbidSubChoicesAny &&
    ep.forbidSubChoicesAny.some((id) => picks.subChoices[id])
  ) {
    return false;
  }
  return true;
}

/** Context the engine needs to score stars/XP for a passing run. */
export interface RunState {
  /** Phase-2 runs so far (not counting the phase-1 just-ask demo). */
  attempts: number;
  /** Hints revealed (0–3). */
  hints: number;
}

/**
 * Stars: ★ pass; ★★ pass within attempt budget AND <3 hints;
 * ★★★ also includes the show-the-work move or the stated bonus condition.
 * Returns 0 for a non-pass. Honors `showMove: null` (★★ max by design).
 */
export function computeStars(
  packet: LevelPacket,
  picks: Picks,
  state: RunState,
  isPass: boolean,
): number {
  if (!isPass) return 0;
  let stars = 1;
  const withinBudget = state.attempts <= packet.stars.attemptBudget;
  if (withinBudget && state.hints < 3) stars += 1;

  const hasShow = packet.stars.showMove
    ? Boolean(picks.moves[packet.stars.showMove])
    : false;
  const hasBonus = packet.stars.thirdStar
    ? conditionsMatch(packet.stars.thirdStar, picks)
    : false;
  if (hasShow || hasBonus) stars += 1;

  // showMove null => ★★ max by design (W1 L1).
  if (packet.stars.showMove === null && packet.stars.thirdStar === null) {
    stars = Math.min(stars, 2);
  }
  return stars;
}

/** XP for a passing run. Seen-failing is credited when the packet flags it. */
export function computeXp(
  packet: LevelPacket,
  opts: { seenFailing: boolean } = { seenFailing: true },
): number {
  let xp = packet.xp.level;
  if (opts.seenFailing) xp += packet.xp.seenFailing;
  if (packet.isBoss) xp += packet.xp.boss;
  return xp;
}

/** Empty picks for a packet (all chips off). */
export function emptyPicks(packet: LevelPacket): Picks {
  const moves: Record<string, boolean> = {};
  const subChoices: Record<string, boolean> = {};
  for (const m of packet.moves) moves[m.id] = false;
  for (const s of packet.subChoices) subChoices[s.id] = false;
  return { moves, subChoices };
}
