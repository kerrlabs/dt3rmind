/**
 * W4 L4 keystone simulator — identical to `w4-check` EXCEPT it closes the
 * anti-gaming hole on the keystone: picking a trick MOVE alongside the real
 * moves can never produce a real green, so brute-force "click everything"
 * cannot clear the rung SPEC §7 says to user-test first.
 *
 * `w4-check.ts` is a shared reference port and is intentionally not edited; the
 * keystone owns this variant so the trick-move guard is scoped to it. The
 * step-bug / false-green behavior is unchanged from `w4-check`.
 *
 * NOTE: the untestable sub-choices ("friendly"/"pro") are NOT tricks here — a
 * vacuous criterion is a real pedagogical path (it makes the checker vacuous),
 * so they are deliberately not guarded. Only the trick MOVES are.
 */
import type { LevelPacket, OutcomeRule, Picks } from '../schema';
import type { SimulatorResult } from './index';

interface DraftFlags {
  greet: boolean;
  name: boolean;
  step: boolean;
  fakeStep?: boolean;
}
interface Customer {
  name: string;
  topic: string;
  step: string;
  fake?: string;
}
interface SimDraft extends DraftFlags {
  revised: boolean;
  verdict: boolean | null;
}

interface W4Fixtures {
  customers: Customer[];
  baseDrafts: DraftFlags[];
  remindedDrafts: DraftFlags[];
}

const REAL_CRITERIA = ['greet', 'name', 'step'] as const;
/** Trick MOVE ids on the keystone: picking any can never earn a real green. */
const TRICK_MOVES = ['remind', 'perfect', 'double'] as const;

function on(picks: Picks, id: string): boolean {
  return Boolean(picks.moves[id] || picks.subChoices[id]);
}

function readFixtures(packet: LevelPacket): W4Fixtures {
  const carrier = packet.rules.find((r) => r.output && 'customers' in r.output);
  if (!carrier) {
    throw new Error(
      `w4-l4-check simulator: no rule in "${packet.id}" carries customers/baseDrafts fixtures.`,
    );
  }
  return carrier.output as unknown as W4Fixtures;
}

export function simulator(
  packet: LevelPacket,
  picks: Picks,
  _matchedRule: OutcomeRule,
): SimulatorResult {
  const fx = readFixtures(packet);
  const hasCheck = on(picks, 'check');
  const hasProve = on(picks, 'prove');
  const hasRun = on(picks, 'run');
  const hasTrick = TRICK_MOVES.some((id) => picks.moves[id]);

  const base =
    on(picks, 'remind') || hasCheck ? fx.remindedDrafts : fx.baseDrafts;

  const drafts: SimDraft[] = base.map((d) => ({
    greet: d.greet,
    name: d.name,
    step: d.step,
    fakeStep: Boolean(d.fakeStep),
    revised: false,
    verdict: null,
  }));

  const isGood = (d: SimDraft): boolean => d.greet && d.name && d.step;

  if (!hasCheck) {
    const claim = on(picks, 'perfect') || on(picks, 'double')
      ? '"All 8 are perfect."'
      : 'Nothing. It just handed them over.';
    return {
      isPass: false,
      doer: 'ai-guessing',
      claim,
      output: { drafts, customers: fx.customers, log: [], kind: 'naive' },
    };
  }

  const realC = REAL_CRITERIA.filter((id) => picks.subChoices[id]);
  const vagueOnly = realC.length === 0;
  const stepBug = picks.subChoices['step'] && !hasProve;

  const verdictFor = (d: SimDraft): boolean => {
    if (vagueOnly) return true;
    for (const id of realC) {
      if (id === 'step') {
        const looks = d.step || (stepBug && d.fakeStep);
        if (!looks) return false;
      } else if (!d[id as 'greet' | 'name']) {
        return false;
      }
    }
    return true;
  };

  const log: string[] = [];
  if (hasProve) {
    if (vagueOnly) {
      log.push(
        'Tested the checker on a bad example: it <b>PASSED</b> it. A tone can’t be measured, so this checker can’t fail.',
      );
    } else if (picks.subChoices['step']) {
      log.push(
        'Tested the checker on a bad example ("A replacement arrives next week."): it <b>PASSED</b>. Bug: it only looked for the word "next". Fixed it to look for an action the customer takes. Retested: <b>FAILS</b> the bad example, as it should.',
      );
    } else {
      log.push('Tested the checker on a bad example: it <b>FAILS</b>, as it should.');
    }
  }

  if (!hasRun) {
    return {
      isPass: false,
      doer: 'checker',
      claim: '"I checked them. All 8 pass." (It never ran the checker.)',
      output: { drafts, customers: fx.customers, log, kind: 'notRun' },
    };
  }

  for (const d of drafts) {
    let v = verdictFor(d);
    if (!v) {
      for (const id of realC) {
        d[id as 'greet' | 'name' | 'step'] = true;
        if (id === 'step') d.fakeStep = false;
      }
      d.revised = true;
      v = verdictFor(d);
    }
    d.verdict = v;
  }
  const nRev = drafts.filter((d) => d.revised).length;
  log.push(
    `Ran the checker on all 8 drafts. ${
      nRev ? `${nRev} failed and were rewritten.` : 'None failed.'
    }`,
  );

  const passCount = drafts.filter((d) => d.verdict).length;
  const kind = vagueOnly
    ? 'vague'
    : realC.length < 3
      ? 'partial'
      : stepBug
        ? 'bug'
        : 'ok';

  const good = drafts.filter(isGood).length;
  // Keystone anti-gaming: a trick move alongside the real moves is never a pass.
  const isPass = good === 8 && kind === 'ok' && !hasTrick;

  return {
    isPass,
    doer: 'checker',
    claim: `Checker: ${passCount} of 8 pass`,
    output: { drafts, customers: fx.customers, log, kind, actualGood: good },
  };
}

export { REAL_CRITERIA, TRICK_MOVES };
