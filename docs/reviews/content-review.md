# Puzzle Ladder — Independent Content Review

**Reviewer role:** adversarial content review (instructional design + AI literacy). I did not
author this content; the brief was to find what is wrong.
**Scope:** all 31 packets in `content/levels/*.json` (23 levels, 7 bosses, capstone), read
against `docs/spec/SPEC.md` (binding), `docs/spec/section-curriculum.md`, `docs/AUTHORING.md`,
`src/content/schema.ts`, the `w4-check` simulator, and `src/engine/engine.ts`.
**Date:** 2026-10-11.
**MCP note:** `playwright-mcp` was unavailable this session; not needed for a content review.

Checks performed per packet (per brief): (1) loop fidelity — a real naive failure, real moves
vs tricks with distinct consequences, pass = right result AND honest report, usable "Try it in
your AI"; (2) move taught matches SPEC §3/§5; (3) learner copy at ~8th grade, no emojis in UI,
no jargon, no factual/number errors; (4) every wrong outcome teaches a specific lesson; (5) does
the level require the skill or can it be beaten by picking everything / by elimination;
(6) bosses genuinely new domain + decoys. Plus cross-level progression, repetition, curriculum gaps.

---

## Summary verdict

The ladder is in strong shape. The loop is faithfully encoded, the two prototypes (W2 L3, W4 L4)
are ported cleanly, feedback is specific (no generic "try again" anywhere), and the move/competency
map matches the spec at nearly every level. The thesis ("who did the math") is carried honestly in
most results. This is publishable with fixes.

Two findings rise to **Critical** and both are internal-consistency defects a tester will hit, not
pedagogy quibbles:

1. **`w4-boss` reuses the `w4-check` simulator, so its false-green mechanic fires on the "next step"
   slot while every line of boss copy says the trap is the missing *ticket number*.** The engine and
   the narrative describe two different bugs. This is the keystone world's boss.
2. **`w3-boss` preview shows an 8-row table ending at Zone 8, but the job text, the `more` note, and
   the naive feedback all assert a 10-row table ending at Zone 10.** The learner is told facts the
   data on screen contradicts.

The highest-leverage systemic issue (Important) is an **anti-gaming inconsistency**: roughly half the
chip levels can be passed by selecting *every* chip, because trick rules are ordered after the pass
rule and `expectPass` omits `forbidAny` on the tricks — yet the W5/W6/W7 bosses and W4 L1–L2 *do*
forbid their tricks. The ladder is internally inconsistent about whether "click everything" is a win.
SPEC §8 anticipates this ("chip combinations are memorizable… practice levels are formative only"), so
it is defensible for practice rungs — but it also applies to the **W4 L4 keystone**, which weakens the
one rung the spec says to user-test first.

### Counts by severity

| Severity | Count |
|---|---|
| Critical | 2 |
| Important | 9 |
| Minor | 11 |

---

## Per-packet findings

Legend: ✅ = no material issue found in that packet beyond cross-cutting items.

### World 1 — Shape the Answer

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `w1-l1` | Minor | `pass` rule `doer: "ai-guessing"`. Defensible (W1 teaches shape, not who-computes), and the fields are still AI-produced, so it is arguably honest. But it reads oddly next to W1 L2/L3 which flip to `source`. | Keep as-is OR set all three W1 pass rules to the same `doer` for consistency; `ai-guessing` is the honest one here since no tool/source produced the value. |
| `w1-l2` | Important | `pass` rule `doer: "source"` — but nothing was routed to a source or tool. The AI just produced a better-shaped answer. V7 ("who did the work") is a load-bearing thesis label; calling a well-shaped guess "source" is inaccurate. | Set `doer: "ai-guessing"`. The win is a better shape, not a sourced value. Same issue in `w1-l3`. |
| `w1-l3` | Important | Same as above: `pass` `doer: "source"` with no source involved. | Set `doer: "ai-guessing"`. |
| `w1-l2` | Minor | Numbers are consistent (latte 4.50 + muffin 4.75 = 9.25 ✓). No action. | — |
| `w1-boss` | Minor | `pass` requires `required`+`list` but not `shape`; `thirdStar` requires `shape`. Matches the curriculum boss grader ("required + list fields correct"). The emoji `🔴` appears only in a *failure* `claim`/output as the thing being disproven, not in UI chrome — acceptable, but it is a visible emoji; SPEC §7 bans emojis "in applications." | Confirm the renderer treats the `🔴` in the `malformed` claim as quoted content, not UI. Consider replacing with the word "red flag" to honor the no-emoji rule strictly. `doer: "source"` on the pass is defensible here (a schema/system accepts it). |

### World 2 — Spot the Guess

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `w2-l1` | ✅ | `6,847 × 2,913 = 19,945,311` verified correct; none of the 5 recorded decoys accidentally equals the truth (checked). The in-level note that the "all equal?" check is itself vacuous is a nice touch and matches curriculum. | — |
| `w2-l2` | Minor | `movesTaught: []` with `competencies: ["C2"]` — matches curriculum (judgment rung, no new move). Over-tag guard (`atLeast` 2 safe) is ordered before `pass`; elimination is blocked. Good. | — |
| `w2-l3` | Minor | Faithful port of the prototype. `pass` (`tool`+`run`) is not guarded against tricks, so `tool`+`run`+any trick still passes — correct behavior (the real moves should win), but note the `tricks` rule's feedback is then unreachable for a learner who already has tool+run. Acceptable. | — |
| `w2-l4` | ✅ | `overtooled` (requireAny subject/discount) precedes `pass`; `expectPass` forbids them. Cannot be beaten by routing everything to tools. Clean. | — |
| `w2-boss` | ✅ | Genuinely new domain (clinic), new decoys ("you're a clinician", "round the numbers"). `tricks` and `overflag` precede `pass`; `expectPass` forbids all four decoys. New domain + new decoys requirement met. Fabricated-count narrative is consistent. | — |

### World 3 — Answer from the Source

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `w3-l1` | Minor | The `source_no_run` ("half the move") recorded wrong answer is *"around $4.75 to $5.00"* — it literally contains the true value `$4.75`. The brief flags "no recorded wrong value that accidentally equals the truth." It is shown as a FAIL (a range, not an exact read), so the lesson still lands, but surfacing the correct number inside the "wrong" answer is confusing. | Change the loose range to one that excludes the truth, e.g. *"around $5.00"* or *"somewhere between $4 and $6"*. The decoy $5.25 in `naive` is safely off-menu — fine. |
| `w3-l2` | ✅ | Abstention taught cleanly; `source` without `abstain` produces an invented $4.80, `pass` yields "not on the menu". New-case lesson matches curriculum. | — |
| `w3-l3` | Minor | Numbers verified: espresso $3.00 (row 6) is the true min across {3.50, 4.75, 4.25, 4.00, 5.00, 3.00} ✓. The `naive` decoy pairs "oat latte / $3.50" and the feedback correctly notes $3.50 is the drip's price — good, that's a real planted mismatch, not an accidental truth. | — |
| `w3-boss` | **Critical** | **Data contradiction.** `preview.rows` lists **8 rows, Zone 1–Zone 8**. But `job.text` says "a **10-row** shipping-rate table"; `preview.more` says "10 rows (Zone 1–10)"; and the `naive` feedback says "The table stops at **Zone 10**." The learner sees Zone 8 as the last row while every piece of copy claims Zone 10. A tester asked "is Zone 12 on the table?" sees a table that stops at 8, not 10. | Make the data and the copy agree. Either add Zone 9 and Zone 10 rows (rates ~13.90, 15.10) so the table truly ends at Zone 10, or change the job text / `more` / `naive` feedback to say "8 rows (Zone 1–8)" and keep Zone 12 as the missing zone. The abstain lesson is unaffected either way — this is purely a copy-vs-data mismatch. |
| `w3-boss` | Minor | Otherwise a valid new domain (shipping) with new decoys ("estimate it from the pattern"). The `source_no_abstain` guess "$14.00" plausibly extends the pattern — good adversarial design. | — |

### World 4 — Name the Check (keystone)

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `w4-l1` | ✅ | Single-select recognize rung; `pass` forbids the two vacuous checks, so "pick everything" fails. `tech` text uses real assertions (`re.search(r'price[:=]...')`) that genuinely distinguish. Clean. | — |
| `w4-l2` | ✅ | `pass` forbids `mentions`; selecting both fails. Row-by-row bench ($40 false-positive) is the right planted case. Clean. | — |
| `w4-l3` | Minor | `pass` requires `future` but does **not** forbid `formatted`/`polite`, so `future`+`formatted`+`polite` passes. The clauses are additive and harmless (AND-ed), so this is pedagogically fine, but it is the inconsistency pattern (see cross-cutting #1): L1 and L2 forbid their decoys, L3 does not. | For consistency with L1/L2, consider `forbidAny: ["formatted","polite"]` in `expectPass` so the learner must isolate the one clause that separates past from future — matching the "pick the one that works" discipline of the earlier rungs. |
| `w4-l4` | Minor | Faithful port of the prototype; the 8-customer fixtures map correctly to the "4 of 8 broke a rule (Lena, Chen, Aisha, Sofia)" claim (indices 2,4,6,7). `prove` is correctly required for a real green; without it the `bug` rule fires the false green on Sofia's "arrives next week". `pass` does not forbid the trick moves or the vague sub-choices, so **select-all passes the keystone** — defensible per SPEC §8 but see cross-cutting #1. | Optionally `forbidSubChoicesAny: ["friendly","pro"]` is NOT wanted (they're harmless extras per AUTHORING), but consider forbidding the trick *moves* in `expectPass` so brute-force clicking can't clear the keystone. |
| `w4-boss` | **Critical** | **The boss's false-green mechanic and its narrative describe different bugs.** The boss reuses `simulatorId: "w4-check"`, whose hardcoded `stepBug` logic keys off the sub-choice id `step` and the fixture field `fakeStep` (the "arrives next week" / word-"next" bug). In the boss the sub-choice ids are *relabeled* — `greet`→"the refund amount", `name`→"a ticket number", `step`→"a clear next step" — but all boss copy says the false green is the **ticket number** word-match: the `bug` rule feedback reads *"The AI's checker just looked for the word 'ticket', and 'we've opened a ticket' matched"*, the `gap` hint says *"catches the word-matching 'ticket' bug"*, and the Copilot note points at `#RF-`. Mechanically, though, the simulator still traps on the `step` ("next step") slot via `fakeStep`, not on the "ticket number" (`name`) slot. The story the learner reads and the rule the engine runs do not match. A sharp tester who selects the "next step" criterion but omits "ticket number" will see behavior the feedback can't explain. | Either (a) write a boss-specific simulator whose bug fires on the `name` ("ticket number") slot and whose `fakeTicket` fixture field carries the "we've opened a ticket, no number" trap, OR (b) rewrite all boss copy so the false green is about the **next step** (keep the generic simulator) — e.g. Omar's draft has a ticket number but "your refund is on its way" is a non-actionable next step that the word-matching checker accepts. Option (a) is truer to the stated job; option (b) is the smaller change. Until fixed, the keystone boss teaches a bug the engine isn't actually running. |
| `w4-boss` | Minor | Separately, the sub-choice *labels* are semantically reordered relative to their ids (`greet`="refund amount"), which is legal but makes the packet hard to audit and is the root cause of the Critical above. If you keep the generic simulator, add a comment in the packet documenting the id→label remap. | — |

### World 5 — Have AI Build the Tool

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `w5-l1` | Important | Curriculum W5 L1 specifies **★★★ = "show the tool/SQL" (M4)**. This packet has **no `show` chip** and `stars.showMove: null`, `thirdStar: null`, so it caps at ★★. The specified third-star path is dropped. (This recurs across all of W5 — see cross-cutting #3.) | Add a `show` real move ("Show me the tool/formula so I can check it") and set `stars.showMove: "show"`, matching W2 L3 and the curriculum's "third star everywhere = M4". |
| `w5-l1` | Minor | `competencies: ["C8","C10"]`; curriculum lists W5 L1 as C8 (+ M2, M7). C10 is exercised by the commit sub-choice, so including it is defensible — just ahead of the curriculum's mapping. | No change required; optionally align to curriculum. |
| `w5-l2` | Minor | Numbers consistent: refund-month net 46,235.80 vs over-counted 46,475.80 differ by exactly 2×$120 = $240 ✓ (counting a −$120 refund as +$120). `thirdStar` = `fixrule` (not M4 show) — again diverges from the curriculum's "third star = show the work". | Align third-star to an M4 "show the rule" move if you want curriculum fidelity; the `fixrule` bonus is reasonable but off-spec. |
| `w5-l3` | Minor | Rounding-error trap (48,210.60 vs 48,210.59) is a clean adversarial case. `thirdStar` = `exactval`, again not M4. Same divergence. | As above. |
| `w5-boss` | Important | **Preview vs stated average conflict.** The only Wednesday row in the preview is `-120.00` (a refund), but the `pass` output states refund-weekday (Wednesday) average = **61.25** (positive). A single −120 order would average −120. The job says the hidden case set differs from the preview, so this is not provably wrong, but the on-screen Wednesday = −120 primes the learner to expect a negative average, directly conflicting with the 61.25 shown on pass. | Either change the previewed Wednesday row to a value consistent with a 61.25 average (e.g. show two Wednesday rows, 242.50 and −120.00 → avg 61.25), or add a second non-refund Wednesday row so the preview no longer implies a negative average. Keep single-order Thursday = 309.00 (self-consistent). |
| `w5-boss` | Minor | New metric (average, not sum) is genuinely new for the world; `round` and `shipit` are new decoys; `expectPass` forbids them. Boss "new domain/decoy" intent met. | — |

### World 6 — Prove It & Fix It

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `w6-l1` | ✅ | False-green exposure taught cleanly; `pass` requires `runnew`+`strengthen`; tricks (`trust`,`rerun`) can't substitute. `showMove: "showcheck"` correctly offers the M4 third star here. Good. | — |
| `w6-l2` | Minor | Overfit trap (hard-code Feb → March breaks 1,310→1,190) and loosen trap (±200 band) are both well-formed; `expectPass` forbids `hardcode`/`loosen` sub-choices. The loosened band 980±200 = 780–1,180 admits the wrong 1,120 ✓ consistent. | — |
| `w6-l3` | Minor | Clean "add an untested dimension" rung; `dup` is rejected. March normal total = 48,210.60 here. | See cross-cutting #4 (monthly-total scale inconsistency with w6-l2). |
| `w6-l2` | Important | **Monthly-total scale contradicts the rest of the dataset.** This level's seed-42 monthly totals are **~905–1,310** (Jan 1,040 / Feb 980 / Mar 1,310 / Apr 905). But W5 L1–L2, W6 L1, and W6 L3 put the *same* seed-42 monthly total around **48,210.60** for March and ~46K for May. March cannot be both 1,310 and 48,210.60. The dataset is described identically ("seed-42 sales") across these levels. | Rescale W6 L2's four months to the same magnitude as the rest (e.g. keep March at 48,210.60 and set the others proportionally), or state explicitly that W6 L2 uses a different/smaller slice. Right now a learner moving W5→W6 sees March's total change by ~37×. |
| `w6-boss` | ✅ | Strong boss: new domain (daily-active-users over an event log), new dimension (00:00 UTC timezone edge), four distinct failure rules (patch/loosen/no-root/no-strengthen) each with a specific lesson. `expectPass` forbids `patchday`/`loosen`. Best-constructed boss in the ladder. | — |

### World 7 — Decide Where It Matters

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `w7-l1` | ✅ | Six-step billing tiering; `overgated` precedes `pass`; `expectPass` forbids the three over-gate decoys. "Default heuristic, chip to move off it" model is clear. Matches curriculum. | — |
| `w7-l2` | Minor | `pass` requires relaxing recommend+apology but not greeting; the hint says "you can relax the greeting too." Fine, but `pass` matching without forbidding `relax_greet` means relaxing all three opens is a pass while the copy centers on two — slight mismatch between the required set and the narrative. | Optionally mention in the pass feedback that the greeting may also be relaxed, so the required-set and the story align. |
| `w7-l3` | Minor | `pass` requires `dosage_gate`+`dosage_risk`; `appt_gate` is a real move but not required for pass (curriculum grades "the two highest-cost steps"). Consistent with the spec's "match on the two highest-cost steps." The word "determinism" is correctly withheld until W7 per P4. | — |
| `w7-boss` | ✅ | New high-stakes domain (loan approval); two genuinely new decoys ("automate the final decision", "let the model decide the rate"), each with its own fail rule and lesson; `expectPass` forbids all three decoys. New-domain/new-decoy requirement met. | — |

### Capstone

| Packet | Severity | Issue | Fix |
|---|---|---|---|
| `capstone` | ✅ (design) | Genuinely cross-domain (volunteer-shift scheduler), free-text framing stated, 8 real moves spanning M2–M9 all required, two tricks forbidden. Partial-credit fail rules (`nocheck`, `nofix`, `notier`) each teach a precise lesson and map to the curriculum's capstone steps. The pass output is honest ("matches the roster", not a hardcoded number). Strong. | — |
| `capstone` | Minor | `movesTaught` lists `M2,M3,M5,M6,M8,M9` but omits **M1** (shape) and **M4** (show the work), though the capstone claims "all of M1–M9" (SPEC §5 "Cap: all"). The chips cover shaping implicitly (route names to roster rows) but M1 and M4 aren't represented as moves. | Either add explicit M1/M4 coverage (a "shape the summary" and a "show me the tool and the check" move) or adjust the SPEC §5 "all" claim to the subset actually exercised. Low stakes since the capstone is summative. |
| `capstone` | Minor | `competencies: ["C14"]` only. Correct per the curriculum (C14 = transfer, recruits all), but the fail rules exercise C7/C12/C13 explicitly; listing only C14 is fine for certification tagging. | No change. |

---

## Cross-cutting findings

**X1 (Important) — Anti-gaming is inconsistent: "select every chip" passes roughly half the levels.**
Because trick rules are ordered *after* the pass rule and `expectPass` omits `forbidAny` on the
tricks, selecting all chips still matches the pass rule in: `w1-l1`, `w1-l2`, `w1-l3`, `w1-boss`,
`w2-l3`, `w3-l1`, `w3-l2`, `w3-l3`, `w3-boss`, `w4-l3`, and `w4-l4` (the keystone). By contrast
`w2-l2`, `w2-l4`, `w2-boss`, `w4-l1`, `w4-l2`, and every W5/W6/W7 boss *do* forbid their decoys, so
brute-force fails there. The engine and the `expectPass` oracle agree in all cases (the combination
test is green), so this is a **pedagogy** decision, not a build bug — and SPEC §8 explicitly makes
practice rungs formative ("chip combinations are memorizable"). The issue is the *inconsistency*: a
learner who clicks everything clears W1, most of W3, and W4 L3–L4 without demonstrating the
discrimination the level teaches, while the same strategy fails elsewhere. Decide a single policy
(recommended: forbid decoys everywhere a decoy exists, since the real moves are additive and the
cost is one `forbidAny` per packet) and apply it uniformly. If brute-force is intentionally allowed
on practice rungs, at minimum close it on the **W4 L4 keystone**, the rung SPEC §7 says to user-test
first.

**X2 (Important) — The "who did the work" (V7 / `doer`) label is used loosely in World 1.**
`w1-l2` and `w1-l3` set the pass `doer` to `"source"` though no source or tool is involved — the AI
simply returned a better-shaped guess. The `doer` label is the single thing SPEC §4 says "carries the
thesis," so an inaccurate one teaches the wrong lesson (that shaping sources a value). Set both to
`ai-guessing`. `w1-l1` already does this correctly.

**X3 (Important) — World 5's third-star path diverges from the curriculum.**
The curriculum makes **M4 "show me the work" the third star everywhere it is offered**, and lists it
for W5 L1–L3. None of W5 offers a `show` move: `w5-l1` caps at ★★ (`showMove`/`thirdStar` both null),
`w5-l2` uses `thirdStar: fixrule`, `w5-l3` uses `thirdStar: exactval`. The workshop levels never let
the learner earn the third star by asking the AI to show the tool — the exact habit W5 is meant to
build. Add a `show` move to each and set `showMove: "show"`.

**X4 (Important) — Seed-42 "monthly total" has two incompatible magnitudes.**
Across W5 L1/L2, W6 L1, and W6 L3 a month's total is ~**48,210.60** (March) / ~46K (May). In W6 L2 the
monthly totals are ~**905–1,310**. Same dataset, same "monthly total" metric, ~37× apart. Rescale W6 L2
to match, or label it a different slice. (This is distinct from the W5-boss average, which is a
different metric.)

**X5 (Minor) — "Never accept 'I checked, they all pass'" transfer line is present and consistent.**
Verified: all 31 packets carry ≥3 `tryIt.notes`, and the third note consistently carries the
no-code "never accept 'I checked…'" rule (AUTHORING requirement). This is done well — noting it as a
positive, not a defect.

**X6 (Minor) — Reading level and jargon.** Plain-skin copy holds at roughly 8th grade throughout; the
`tech` skin appropriately carries code/jargon. No emojis in UI chrome; the only emoji (`w1-boss` `🔴`)
is inside a disproven failure claim, but SPEC §7's rule is absolute — prefer the words "red flag".

**X7 (Minor) — Difficulty progression is sound.** W1 (shape, ★★ caps, guaranteed win) → W2 (spot the
guess, first real failure) → W3 (grounding/abstention) → W4 (keystone, 3-attempt budget) → W5–W7
(free-text framing, 3-attempt budgets, bosses forbid decoys) escalates cleanly. Attempt budgets rise
from 2 (W1–W4 practice) to 3 (bosses, W4 L4, W5+) as specified. No regressions in difficulty ordering.

**X8 (Minor) — Repetition is controlled but the refund/negative-amount case recurs heavily.** The
"refund = negative amount" adversarial case appears in W5 L2, W5 boss, W6 L1, W6 L2, and W6 L3. It is
the natural seed-42 edge and the reuse is pedagogically coherent, but by W6 L3 it is familiar enough
that the "untested dimension" lesson leans entirely on the year-boundary case to feel novel. Consider
rotating in a second adversarial dimension (e.g. a duplicate order id, a null channel) somewhere in W5–W6
so "adversarial" doesn't become synonymous with "refund".

**X9 (Minor) — Curriculum coverage vs §6 misconception map.** Every trick in SPEC §3 and the §6
misconception→level map is represented by a chip in the level it is mapped to (spot-checked:
"think step by step" → `w2-l3 steps`; "typical/round" → `w3-l1 typical`, `w3-l2 round`; "tone check" →
`w4-l1`/`w4-l4 friendly`; "everything hard-gated" → `w2-l4`, `w7-l2`). No orphaned misconceptions found.

---

## Top 10 fixes, ranked

1. **`w4-boss`: reconcile the simulator mechanic with the ticket-number narrative (Critical).** Write a
   boss-specific simulator that traps on the "ticket number" slot, or rewrite the boss copy so the false
   green is about a non-actionable *next step*. The keystone world's boss currently teaches a bug the
   engine doesn't run.
2. **`w3-boss`: make the table data match the copy (Critical).** Add Zone 9–10 rows (so it is truly a
   10-row table ending at Zone 10) or change the job text / `more` / `naive` feedback to "8 rows
   (Zone 1–8)." Right now the on-screen table contradicts three pieces of copy.
3. **X1: pick one anti-gaming policy and apply it uniformly (Important).** At minimum forbid the trick
   moves in `expectPass` on the **W4 L4 keystone**; ideally forbid decoys on every level that has them,
   so "click everything" is never a win.
4. **X4 / `w6-l2`: rescale the monthly totals to match seed-42 (Important).** March must not be 1,310 in
   one level and 48,210.60 in the next.
5. **X3 / W5: add the M4 "show the tool" third-star path to W5 L1–L3 (Important).** Restores the
   curriculum's "third star = show the work" and the exact habit the workshop teaches.
6. **X2 / `w1-l2`, `w1-l3`: fix the `doer` label from `source` to `ai-guessing` (Important).** The
   thesis-carrying label must be accurate; no source is involved in these two passes.
7. **`w5-boss`: fix the Wednesday preview so it doesn't imply a negative average (Important).** Show a
   Wednesday pair that averages the stated 61.25, or add a non-refund Wednesday row.
8. **`w3-l1`: change the "half the move" decoy so it doesn't contain the true value (Minor).** Replace
   "around $4.75 to $5.00" with a range/number that excludes $4.75.
9. **`w4-l3`: forbid `formatted`/`polite` in `expectPass` for consistency with W4 L1–L2 (Minor).** Make
   the learner isolate the one clause that separates past from future.
10. **`w1-boss` emoji + `capstone` move coverage (Minor).** Replace the `🔴` with "red flag" to honor
    SPEC §7's absolute no-emoji rule; add explicit M1/M4 moves to the capstone or soften the SPEC §5
    "all of M1–M9" claim to the subset actually exercised.

---

*End of review. All findings are content/consistency issues; the build gate (schema + exhaustive
combination test + engine) is internally consistent with the authored `expectPass` oracles, so none of
these fail CI today — they are correctness and pedagogy defects a build cannot catch.*

---

## Fixes applied (content fixer)

Applied 2026-10-11. Verified with `npx vitest run` (508 passed, 8 files, 0 failed) and
`npm run build` (`tsc -b && vite build`, exit 0). Full tails at the handoff.

**Anti-gaming policy (X1 / #3) — applied uniformly.** The lead decision "picking every chip must
never pass" was applied to every packet whose pass path did not already forbid its trick MOVES. In
each, a non-pass rule `right-moves-plus-tricks` was inserted immediately before the `pass` rule
(when: the pass's required real moves + `requireAny` the trick moves), and `expectPass.conditions.forbidAny`
was extended with those trick move ids. Feedback follows the "you found the moves that do the work,
but you also kept [trick] — take it out so you know exactly which part matters" pattern, adapted per
level. Packets already guarded (`w2-l2` via `atMost`, `w2-l4`, `w2-boss`, `w4-l1`, `w4-l2`, `w5-l3`,
`w5-boss`, `w7-l1`, `w7-l2`, `w7-boss`, `capstone`) were left as-is. The W4 untestable sub-choices
(`friendly`/`pro`) were deliberately NOT forbidden — a vacuous criterion is a real pedagogical path,
not a trick.

| Finding id | What changed |
|---|---|
| **#1 `w4-boss` (Critical)** | New simulator `src/content/simulators/w4-boss-refund.ts` whose false-green fires on the **ticket-number (`name`) slot** via a `fakeTicket` fixture — matching every line of the boss copy (the "we've opened a ticket, no number" word-match bug). `simulatorId` switched `w4-check` → `w4-boss-refund`. Omar's trap fixture moved from `fakeStep` (step slot) to `fakeTicket` (name slot); the four broken replies (Priya, Marcus, Hana, Omar) now match the naive feedback and the per-customer data. Added the anti-gaming rule + `forbidAny:[remind,apologetic,double]`. The simulator also returns `isPass:false` whenever a trick move is picked. |
| **#2 `w3-boss` (Critical)** | Data-vs-copy contradiction resolved by making the data match the copy: added **Zone 9 (13.90)** and **Zone 10 (15.10)** so the table truly is 10 rows ending at Zone 10, as the job text / `more` / `naive` feedback all assert. Added the anti-gaming rule + `forbidAny:[typical,estimate,expert]`. |
| **#3 / X1 (anti-gaming)** | `right-moves-plus-tricks` + `forbidAny` added to: `w1-l1` (polite,expert), `w1-l2` (careful), `w1-l3` (perfect), `w1-boss` (emoji,friendly), `w2-l3` (care,steps,expert,just), `w3-l1` (expert,typical), `w3-l2` (helpful,round), `w3-l3` (confident), `w4-l3` (formatted,polite), `w4-l4` (remind,perfect,double), `w4-boss` (remind,apologetic,double), `w5-l1` (care,expert,just), `w5-l2` (ship,careful), `w6-l1` (trust,rerun), `w6-l2` (narrate,confident), `w6-l3` (done), `w7-l3` (warn_gate). Keystone `w4-l4` gets a dedicated simulator `src/content/simulators/w4-l4-check.ts` (identical to `w4-check` but a trick move can never earn a real green), since `w4-check.ts` was off-limits to edit. |
| **#4 / X4 `w6-l2` (Important)** | Rescaled the four monthly totals from ~905–1,310 to the seed-42 magnitude used elsewhere: Jan **41,180.20**, Feb **38,920.40** (got **39,160.40**, a $120 refund double-counted = +240), Mar **48,210.60**, Apr **44,905.30**. Updated job text, preview, the `hardcode` sub-choice label, and the pass/hardcoded/loosened/naive rule outputs. The loosened band widened ±200 → **±300** so it still admits the 240 over-count. March is now 48,210.60 in both W5/W6-L1/W6-L3 and here. |
| **#5 / X3 (W5 third star)** | Added an M4 "show the tool/code" move and set `stars.showMove:"show"` on `w5-l1` ("Show me the tool"), `w5-l2` ("Show me the rule", replacing the off-spec `thirdStar:fixrule`), and `w5-l3` ("Show me the tool", replacing `thirdStar:exactval`). The third star across W5 is now the curriculum's M4 path. |
| **#6 / X2 (`doer`)** | `w1-l2` and `w1-l3` pass-rule `doer` changed `source` → `ai-guessing` (no source/tool is involved — a better-shaped guess). All three W1 pass doers are now `ai-guessing`, consistent (addresses finding #1-minor too). |
| **#7 `w5-boss` (Important)** | Added a second Wednesday preview row so the preview no longer implies a negative average: Wednesday **242.50** and **−120.00** average **61.25**, matching the pass output. |
| **#8 `w3-l1` (Minor)** | The `source_no_run` "half the move" decoy "around $4.75 to $5.00" (which contained the true value $4.75) changed to **"around $5.00"** so no recorded wrong value equals the truth. |
| **#9 `w4-l3` (Minor)** | `expectPass` now forbids `formatted`/`polite` and a `right-moves-plus-tricks` rule was inserted, so the learner must isolate the one clause ("after today") that separates a past date from a future one — matching the discipline of W4 L1/L2. |
| **#10 `w1-boss` emoji (Minor)** | The `🔴` emoji in the `malformed` rule's claim and output was replaced with "[red flag]" / plain text to honor SPEC §7's absolute no-emoji rule. |
| **#10 `capstone` coverage (Minor)** | `movesTaught` now lists **M1,M2,M3,M4,M5,M6,M8,M9** (SPEC §5 "Cap: all"). M1 (shape) made explicit in the `tool` move ("Return the summary in a fixed shape…") and M4 (show the work) in the `build` move ("Show me the tool and the check…"). |

**Declared test touch (not content):** `tests/engine.test.ts` had one assertion — *"tool + run beats
tricks regardless of trick chips (first-match)"* — that encoded the **pre-policy** `w2-l3` behavior the
lead's anti-gaming decision reverses. Updated that single assertion to *"tool + run + a trick → blocked
by anti-gaming (not a pass)"* so CI reflects the new policy. This is the only test change; it implements
the lead's stated decision rather than altering test intent against it. Flagging it explicitly per the
"don't modify tests" guardrail.

**Not changed (out of scope / engineer-owned):** `src/content/simulators/w4-check.ts`,
`src/content/simulators/index.ts`, and all `src/` UI / `tests/review/` / `package.json` /
`vite.config.ts` files were left to the concurrent engineer. The W5 third-star finding was applied to
W5 L1–L3 only (the review scoped it there); `w5-boss` keeps its `proveset` third star. Repetition (X8)
and reading-level (X6) notes were positive/no-action and left as noted.
