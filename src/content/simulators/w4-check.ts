/**
 * W4 "Ask for the check first" simulator — a faithful, pure-TS port of
 * `simulate()` + the grader in docs/prototypes/world-4-ask-for-the-check.html.
 *
 * Behavioral contract (must match the prototype for every move combination):
 *  - Base drafts: 4 of 8 break a rule on a plain ask.
 *  - Reminding OR asking for a checker swaps to the "reminded" draft set
 *    (7 of 8 good; Sofia still carries the fake "next week" step).
 *  - A checker written without the "prove it can fail" move has the STEP BUG:
 *    it only looks for the word "next", so Sofia's "arrives next week" matches
 *    and produces a FALSE GREEN.
 *  - A checker that tests only untestable criteria ("friendly"/"pro") can't
 *    fail and passes everything (vacuous).
 *  - A checker not run never grades anything -> "all pass" claim, 1 still bad.
 *  - PASS iff all 8 drafts are genuinely good AND the AI's report matches
 *    reality (kind === 'ok'): that needs check + prove + run + all 3 real rules.
 *
 * The 8-customer fixtures live in the packet's catch-all rule output under
 * `customers` / `baseDrafts` / `remindedDrafts` so the content stays data-first.
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

/** The real, testable criteria ids (sub-choices). Order matters for display. */
const REAL_CRITERIA = ['greet', 'name', 'step'] as const;
const VAGUE_CRITERIA = ['friendly', 'pro'] as const;

function on(picks: Picks, id: string): boolean {
  return Boolean(picks.moves[id] || picks.subChoices[id]);
}

function readFixtures(packet: LevelPacket): W4Fixtures {
  // Fixtures are carried on the first rule that declares them (the catch-all).
  const carrier = packet.rules.find(
    (r) => r.output && 'customers' in r.output,
  );
  if (!carrier) {
    throw new Error(
      `W4 simulator: no rule in "${packet.id}" carries customers/baseDrafts fixtures.`,
    );
  }
  return carrier.output as unknown as W4Fixtures;
}

export function w4CheckSimulator(
  packet: LevelPacket,
  picks: Picks,
  _matchedRule: OutcomeRule,
): SimulatorResult {
  const fx = readFixtures(packet);
  const hasCheck = on(picks, 'check');
  const hasProve = on(picks, 'prove');
  const hasRun = on(picks, 'run');

  // Which draft set the AI starts from.
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

  // No real checker in the ask: naive / remind / tricks path.
  if (!hasCheck) {
    const claim =
      (on(picks, 'perfect') || on(picks, 'double'))
        ? '"All 8 are perfect."'
        : 'Nothing. It just handed them over.';
    return {
      isPass: false, // never passes without a checker
      doer: 'ai-guessing',
      claim,
      output: { drafts, customers: fx.customers, log: [], kind: 'naive' },
    };
  }

  const realC = REAL_CRITERIA.filter((id) => picks.subChoices[id]);
  const vagueOnly = realC.length === 0;
  const stepBug = picks.subChoices['step'] && !hasProve;

  const verdictFor = (d: SimDraft): boolean => {
    if (vagueOnly) return true; // untestable criteria pass everything
    for (const id of realC) {
      if (id === 'step') {
        const looks = d.step || (stepBug && d.fakeStep);
        if (!looks) return false;
      } else if (!d[id]) {
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
      log.push(
        'Tested the checker on a bad example: it <b>FAILS</b>, as it should.',
      );
    }
  }

  // Checker written but never run.
  if (!hasRun) {
    return {
      isPass: false,
      doer: 'checker',
      claim: '"I checked them. All 8 pass." (It never ran the checker.)',
      output: { drafts, customers: fx.customers, log, kind: 'notRun' },
    };
  }

  // Run the checker: fix exactly what the checker tests for.
  for (const d of drafts) {
    let v = verdictFor(d);
    if (!v) {
      for (const id of realC) {
        d[id] = true;
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
  const isPass = good === 8 && kind === 'ok';

  return {
    isPass,
    doer: 'checker',
    claim: `Checker: ${passCount} of 8 pass`,
    output: {
      drafts,
      customers: fx.customers,
      log,
      kind,
      actualGood: good,
    },
  };
}

export { REAL_CRITERIA, VAGUE_CRITERIA };
