/**
 * W4 BOSS "The refund promise with no ticket" simulator.
 *
 * This is the boss variant of `w4-check`. Behaviorally it is the same keystone
 * loop, EXCEPT the false-green bug fires on the TICKET-NUMBER slot (`name`),
 * not the next-step slot — because every line of the boss copy says the trap is
 * the missing ticket number: Omar's reply "we've opened a ticket and your
 * refund is on its way" names a refund and the word "ticket", but has no ticket
 * number. A checker written without the "prove it can fail" move only looks for
 * the word "ticket", so Omar's reply matches and produces a FALSE GREEN.
 *
 * Behavioral contract:
 *  - Base drafts: 4 of 8 break a rule on a plain ask.
 *  - Reminding OR asking for a checker swaps to the "reminded" draft set
 *    (7 of 8 good; Omar still carries the fake "we've opened a ticket" text).
 *  - A checker written without "prove it can fail" has the TICKET BUG: it only
 *    looks for the word "ticket", so Omar's "we've opened a ticket" matches and
 *    produces a false green.
 *  - A checker that tests only untestable criteria ("apologetic"/"professional")
 *    can't fail and passes everything (vacuous).
 *  - A checker not run never grades anything -> "all pass" claim, 1 still bad.
 *  - A trick move (remind/apologetic/double) added alongside the real moves does
 *    NOT change who checks the work: it never produces a real green, so brute-
 *    force clicking every chip cannot clear the boss.
 *  - PASS iff all 8 replies are genuinely good AND the AI's report matches
 *    reality: that needs check + prove + run + all 3 real rules AND no trick.
 *
 * The 8-customer fixtures live in the packet's catch-all rule output under
 * `customers` / `baseDrafts` / `remindedDrafts`. The trap row carries
 * `fakeTicket: true` on the `name` slot (vs. w4-check's `fakeStep` on `step`).
 */
import type { LevelPacket, OutcomeRule, Picks } from '../schema';
import type { SimulatorResult } from './index';

interface DraftFlags {
  greet: boolean;
  name: boolean;
  step: boolean;
  fakeTicket?: boolean;
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

interface BossFixtures {
  customers: Customer[];
  baseDrafts: DraftFlags[];
  remindedDrafts: DraftFlags[];
}

/** The real, testable criteria ids (sub-choices). Order matters for display. */
const REAL_CRITERIA = ['greet', 'name', 'step'] as const;
/** The trick MOVE ids: picking any of these can never produce a real green. */
const TRICK_MOVES = ['remind', 'apologetic', 'double'] as const;

function on(picks: Picks, id: string): boolean {
  return Boolean(picks.moves[id] || picks.subChoices[id]);
}

function readFixtures(packet: LevelPacket): BossFixtures {
  const carrier = packet.rules.find((r) => r.output && 'customers' in r.output);
  if (!carrier) {
    throw new Error(
      `w4-boss-refund simulator: no rule in "${packet.id}" carries customers/baseDrafts fixtures.`,
    );
  }
  return carrier.output as unknown as BossFixtures;
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

  // Which draft set the AI starts from.
  const base =
    on(picks, 'remind') || hasCheck ? fx.remindedDrafts : fx.baseDrafts;

  const drafts: SimDraft[] = base.map((d) => ({
    greet: d.greet,
    name: d.name,
    step: d.step,
    fakeTicket: Boolean(d.fakeTicket),
    revised: false,
    verdict: null,
  }));

  const isGood = (d: SimDraft): boolean => d.greet && d.name && d.step;

  // No real checker in the ask: naive / remind / tricks path.
  if (!hasCheck) {
    const claim = on(picks, 'apologetic') || on(picks, 'double')
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
  // The TICKET bug: checking for "a ticket number" (name) without proving the
  // checker can fail -> it only word-matches "ticket", so the fake passes.
  const ticketBug = picks.subChoices['name'] && !hasProve;

  const verdictFor = (d: SimDraft): boolean => {
    if (vagueOnly) return true; // untestable criteria pass everything
    for (const id of realC) {
      if (id === 'name') {
        const looks = d.name || (ticketBug && d.fakeTicket);
        if (!looks) return false;
      } else if (!d[id as 'greet' | 'step']) {
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
    } else if (picks.subChoices['name']) {
      log.push(
        'Tested the checker on a bad example ("We\'ve opened a ticket and your refund is on its way."): it <b>PASSED</b>. Bug: it only looked for the word "ticket". Fixed it to require a ticket number like #RF-0000. Retested: <b>FAILS</b> the bad example, as it should.',
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
        d[id as 'greet' | 'name' | 'step'] = true;
        if (id === 'name') d.fakeTicket = false;
      }
      d.revised = true;
      v = verdictFor(d);
    }
    d.verdict = v;
  }
  const nRev = drafts.filter((d) => d.revised).length;
  log.push(
    `Ran the checker on all 8 replies. ${
      nRev ? `${nRev} failed and were rewritten.` : 'None failed.'
    }`,
  );

  const passCount = drafts.filter((d) => d.verdict).length;
  const kind = vagueOnly
    ? 'vague'
    : realC.length < 3
      ? 'partial'
      : ticketBug
        ? 'bug'
        : 'ok';

  const good = drafts.filter(isGood).length;
  // Picking a trick move alongside the real moves never earns a real green.
  const isPass = good === 8 && kind === 'ok' && !hasTrick;

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

export { REAL_CRITERIA, TRICK_MOVES };
