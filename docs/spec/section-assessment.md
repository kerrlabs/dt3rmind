# Section: Assessment & Learning Measurement

How mastery is measured on the Puzzle Ladder, and how "level up" is earned
*honestly* — i.e. a green check certifies the **learner's** competency, not the
AI's compliance. This section operationalizes the thesis ("determinism comes
from the tools you force the AI through") into scored, gameable-resistant
behaviors. Every number below is a starting value to calibrate in the pilot
(§10); none is TBD.

> Scope note: the `@kirocrew-computer` MCP server was declared but not
> configured for this run. It is irrelevant to assessment design — no desktop
> automation is needed — so this deliverable is complete with the tools present.

---

## 1. Operationalized construct — what "direct AI deterministically" means

The assessment review is correct that "deterministic" is used three incompatible
ways and cannot be scored until pinned to behaviors. The product certifies **one
construct, decomposed into six observable competencies (C1–C6)**. These are the
only things any check, star, or certificate is allowed to claim.

| ID | Competency (observable behavior) | Owning level | Primary evidence artifact |
|---|---|---|---|
| C1 | Writes a **falsifiable** plain-English pass/fail condition | L3 | The learner-authored check text |
| C2 | **Predicts fabrication** — flags where AI will guess/invent | L2 | Flag selections vs. planted item |
| C3 | **Directs a tool-build** from a spec so a step becomes deterministic | L4 | The learner's spec/instruction to the AI |
| C4 | **Verifies before trusting** — authors the check *before* seeing output | L5 | Edit-lock timestamp log |
| C5 | **Re-directs on failure** — localizes a failing case and tightens the spec | L6 | Diff between failing and passing spec |
| C6 | **Judges where determinism is needed** — tiers hard-gate vs. heuristic | L7 | Tiering decisions vs. expert key |

"Reproducible output," "schema-constrained," and "check-gated" are *mechanisms*
C1–C6 use, not competencies themselves. Product copy may only claim a learner
"can do C1–C6," never "makes AI deterministic" as an unqualified phrase.

---

## 2. Per-level PASS criteria (beyond "reached green")

Reaching green is **necessary but never sufficient**. Each level has an
additional author-side criterion. A level is PASSED only when both hold.

**Universal rule — the two-sided check (load-bearing):** every check a learner
authors or accepts must be run against a **planted-bad seed** and a
**planted-good seed** for that puzzle. A check PASSES validation only if it
goes **RED on the bad seed and GREEN on the good seed**. A check that is green
on both is *vacuous* and is rejected before the puzzle can advance. This is the
"a check only counts if it's been seen failing" rule from the panel, made
mechanical. The learner is shown the red→green transition on the two seeds as
proof their check discriminates.

| Level | "Reached green" (floor) | PASS criterion (author-side) | Pass threshold |
|---|---|---|---|
| L1 Shape the answer | Output matches requested shape/schema | Learner selected a schema that **excludes** ≥1 planted malformed output | Correct on the malformed decoy |
| L2 Spot the guess | — (recognition, no tool yet) | Flags ≥**4 of 5** planted fabrications and **≤1 of 5** false alarms on grounded claims (d′-scored, §4) | ≥4 hits, ≤1 FA |
| L3 Name the check | Learner's check passes good seed | Check is **two-sided valid** (red on bad seed) AND non-trivial (not on the vacuous-pattern blocklist, §3) | Two-sided valid |
| L4 Build the tool | AI-built tool passes learner's check | Tool passes a **hidden adversarial input** the learner never saw (prevents happy-path-only specs) | Hidden input correct |
| L5 Prove it works | red→green on learner's own example | **Check authored & edit-locked BEFORE** output rendered (sequence enforced + logged); ≥1 negative case included | Pre-output lock honored |
| L6 Re-direct on failure | Previously-red case goes green | Fix is a **spec tightening**, not a widened/weakened check (check still red on original bad seed after fix) | Bad seed still red |
| L7 Decide where it matters | — (judgment, scored vs. key) | Tiers ≥**6 of 8** unseen scenarios correctly (hard-gate vs. heuristic) vs. expert key | ≥6/8, κ vs. key ≥0.6 |

Rationale for the specific numbers: L2's 4/5-hit, ≤1-FA bar is set so chance
performance (flagging at random on a 5-item, ~50%-base-rate set) fails — a
coin-flipper lands near 2–3 hits with 2–3 false alarms, well under the bar. L7's
6/8 is one standard "clearly above chance on an 8-item two-choice test" line
(binomial p≈.145 for ≥6/8 at chance, tightened by also requiring κ≥0.6 so a
learner who just always-picks-hard-gate fails on the heuristic items).

---

## 3. Anti-gaming rules — each with a detection mechanism

The review names four construct-irrelevant paths to green. Each gets a *running
check*, because an unenforced rule is not a rule.

**G1 — Vacuous / tautological checks** ("output is a string", "response
non-empty", "contains a number").
- *Detection:* **two-sided seed test** (§2) rejects any check green on the
  planted-bad seed. Plus a static **vacuous-pattern blocklist** (regex/AST over
  the normalized check: bare type assertions, length>0, "is not empty", presence
  of *any* digit/word without a value constraint, `assert true`). Blocklist hit →
  the check is flagged and the learner is shown the bad seed passing it.
- *Build-order note:* this detector is built **first** (it is the thesis in code).

**G2 — AI weakens the check** (L4–L6: AI satisfies an underspecified check by
loosening it rather than meeting the intent).
- *Detection:* the learner's check is **frozen** (content-hashed) at authoring
  time. The AI may edit the *tool*, never the check. On every re-run the frozen
  check is re-validated against the **original bad seed**; if it ever goes green
  on the bad seed, the attempt is void. In L6 specifically, a "fix" is accepted
  only if the frozen check is still red on the original bad seed *and* now green
  on the previously-failing case — i.e. the spec tightened, the check did not
  loosen.

**G3 — Brute-force retries** (permute phrasings until green with no model).
- *Detection + penalty:* **retry budget of 3** per puzzle before a mandatory
  20-second "predict first" interstitial ("what will change and why?"), whose
  free-text answer is logged (not scored, but used in analytics §9 to flag
  mashers). Stars are **capped at 1** once retries exceed 3 (§5). A **solve-time
  floor**: solves under 8 seconds that follow a reverted attempt are tagged
  `suspect_fast` and excluded from mastery evidence. Item-bank **rotation**: the
  seed pair and hidden adversarial input are drawn from a bank of ≥5 per puzzle,
  reshuffled per attempt, so a memorized phrasing does not generalize.

**G4 — Hint abuse** (lean on scaffolds instead of acquiring the skill).
- *Detection + penalty:* three-tier graduated hints (nudge → worked analog →
  near-answer). Taking the **near-answer hint caps the puzzle at 1 star** and
  marks the competency `scaffolded`, not `mastered`, for that attempt. A
  competency is only credited toward certification from an attempt where **no
  tier-3 hint was used**. Hint depth per competency is a tracked analytic (§9).

**G5 — Memorized scaffolds across skins** (learn the *shape* "always add a
schema" without knowing *when*).
- *Detection:* this is exactly what **L7 (C6) and the held-out boss task (§6)**
  test — unseen scenarios where the right move is sometimes *not* to add a gate.
  A learner who reflexively hard-gates everything fails the heuristic items.

---

## 4. Scoring the recognition skill (C2 / L2) deterministically — d′

L2 asks a novice to tell "guessing" from "knowing" in confident prose. Scoring
raw hit-count rewards a learner who flags everything. Use **signal-detection
d′** so hits are credited only net of false alarms, computed deterministically
from the item bank:

- Each L2 item has 5 claims: 2–3 **planted fabrications** (unsupported by the
  provided source) and 2–3 **grounded** claims (traceable to the source).
- `hit rate H = flagged fabrications / total fabrications`;
  `false-alarm rate F = flagged grounded / total grounded`.
- `d′ = z(H) − z(F)` with a standard 0.5/n log-linear correction so z stays
  finite at ceiling/floor.
- **Pass bar: d′ ≥ 1.5** on a rolling window of the last 10 items (≈ 93% hit at
  7% FA — clearly above the chance d′≈0). Reported to the learner as a plain
  "spotting score," never as "d-prime."

This makes C2 a measured discrimination, not a button-count, and makes "flag
everything" (F→1) score *worse*, not better.

---

## 5. Star rubric (1 / 2 / 3 stars)

Stars are the per-puzzle *quality* signal (the "chess.com rating" feel) and are
**separate from pass/fail**. A puzzle can be passed at 1 star. Stars gate only
the aspirational cert tier (§7), never level progression.

| Stars | Earned when (ALL hold) |
|---|---|
| ★ (1) | Passed the level's PASS criterion (§2) by any honest route. May have used a tier-3 hint and/or >3 retries. |
| ★★ (2) | Passed on **first or second attempt**, **no tier-3 hint**, and the authored check is two-sided valid with **no vacuous-pattern flags**. |
| ★★★ (3) | ★★ conditions **plus** one *quality* bonus specific to the competency: L3/L5 — check also catches a **second, non-obvious** planted edge case (a "strong check" seed); L4 — tool passes **all 3** hidden adversarial inputs, not just the required 1; L2 — d′ ≥ 2.0; L6 — fix is minimal (spec diff touches only the failing dimension); L7 — 8/8 with correct justification tags. |

Deterministic throughout: every bonus is a seeded, pre-authored condition, never
an LLM judgment. "No decision about pass/fail made by an LLM" holds — the model
may *generate* candidate distractor claims offline during authoring, but at play
time scoring reads only seed outcomes and the vacuous-pattern blocklist.

---

## 6. Formative vs. summative split

Per-rung greens are **formative** and must be labeled so in the UI
("practice — not your certificate"). Certification requires **summative,
held-out transfer** the learner has never seen.

**Formative (every puzzle):** immediate two-sided feedback, elaborative "why
this check is weak/strong" explanation on a vacuous or happy-path-only check,
retries, hints, stars. Purpose: learning. Does **not** by itself certify.

**Summative — boss levels (held-out transfer tasks):** one at the end of each
*phase* (a phase = a group of levels), plus a final capstone. Design:

- **Novel problem, held-out domain.** The boss presents a fresh real-world task
  in a domain the ladder did **not** train on (e.g. trained on sales
  aggregation → boss is scheduling-conflict detection, or invoice-total
  checking). No scaffolds, no hints, no retries-for-stars (one retry allowed,
  flagged).
- **The learner must, unaided:** (1) name where the AI will guess (C2), (2)
  author a two-sided check (C1), (3) direct a tool-build (C3), (4) run it
  against a **hidden adversarial input bank of ≥10** (C4), (5) interpret a
  failure and re-direct (C5), and on the capstone (6) tier three sub-steps for
  where a hard gate is warranted (C6).
- **Scored on authored artifacts, not on reaching green.** Weighted rubric per
  boss (points, deterministic):

  | Dimension | Pts | Scored by |
  |---|---|---|
  | Check is two-sided valid (red on bad seed) | 30 | seed test |
  | Check catches the hidden adversarial input | 25 | hidden bank |
  | Fabrication prediction matches planted sites | 15 | overlap vs. key |
  | Re-direct tightens spec (bad seed stays red) | 15 | frozen-check re-test |
  | Tiering vs. expert key (capstone only) | 15 | key + κ |

  **Boss PASS = ≥70/100 with the two-sided-valid dimension non-zero** (you
  cannot pass a boss with a vacuous check regardless of other points). AI
  output passing is necessary but, alone, worth 0 points — it is the floor to
  even be scored.

- **Reproducibility:** boss seeds and hidden banks are fixed per attempt
  (drawn from a ≥3-variant pool so a re-sit differs). Jeff's real-model engine
  (Agent A guesser vs. Agent B formula-writer, seed 42) is the natural backend
  for the aggregation/calculation boss, where B's exact-SQL path demonstrates
  the determinism win against A's scatter.

---

## 7. Certification levels

Three honest tiers. None uses the word "deterministic" unqualified; each names
the C-competencies it licenses.

1. **Completion** — passed every level's formative PASS criterion. Claims:
   "practiced C1–C6." Not a competency certificate.
2. **Certified Practitioner** — Completion **plus** passed **every phase boss
   (≥70)** and the **capstone (≥70)**. Claims: "can, on a held-out task,
   author a falsifiable check, direct a tool-build, verify against adversarial
   input, and re-direct on failure (C1–C5), and judge where it matters (C6)."
   This is the product's headline claim and it rests on summative evidence only.
3. **Certified with Distinction** — Certified Practitioner with **capstone ≥90**
   and **≥70% of levels at ★★★**. Aspirational; stars finally pay off here.

A certificate carries its evidence hash (which seed banks, which boss variants)
so a claim is auditable. **Re-sit policy:** a failed boss may be re-sat after a
24-hour cooldown on a *different* variant; three consecutive fails route the
learner back to the owning level's formative practice, not to another boss.

---

## 8. Misconception catalog — top 10 wrong beliefs, and which level corrects each

Each misconception is a *testable* wrong belief a non-technical learner will
form. "Corrected at" names the level whose planted design directly refutes it;
"detection" is how the system knows the learner still holds it.

| # | Misconception (the wrong belief) | Corrected at | How that level refutes it | Detection it persists |
|---|---|---|---|---|
| 1 | **"Green means correct."** A passing check proves the answer is right. | L3 | Learner is shown a **vacuous check going green on a wrong output** before authoring their own two-sided check. | Learner's check is green on the bad seed. |
| 2 | **"Temperature 0 makes it deterministic/correct."** | L2 + the "how AI fails" rung | A temp-0 run still **fabricates** on a grounded-lookup item (same wrong fact every time) — determinism of *output* ≠ *truth*. | Learner skips a check because "temp is 0." Probed in boss justification. |
| 3 | **"A more detailed prompt makes it reliable."** (words fix it) | L4 | Two careful prompts to the Guesser still scatter; only routing the step **through a tool** makes it exact. | Learner's L4 spec adds prose, not a tool/structure. |
| 4 | **"The AI knows when it's unsure / it would tell me."** | L2 | Planted fabrications are stated in maximally **confident** prose; confidence is decoupled from correctness. | High false-alarm *and* miss pattern (flags by tone, not grounding). |
| 5 | **"If it worked on my example, it works."** (one green = proof) | L5 | The learner's one-example green **fails a hidden adversarial input** in L4/boss. | Passes own example, fails hidden input. |
| 6 | **"The check and the tool are the same thing."** | L5/L6 | Check is **frozen**; only the tool changes. Learner sees the fix tighten the tool while the check stays put. | Learner tries to edit the check to pass (blocked, logged). |
| 7 | **"Harder/vaguer checks are better checks."** (strict-sounding English = strong) | L3 | A verbose vague check is shown **passing the bad seed**; a short precise one catches it. Strength = discrimination, not wordiness. | Authored checks grow longer without improving two-sided validity. |
| 8 | **"More retries = I'm learning."** (mashing feels like progress) | L5/L6 (predict-first) | The predict-first interstitial forces a hypothesis before each retry; random permutation stops advancing stars. | >3 retries with no predict-answer change. |
| 9 | **"Everything should be hard-gated."** (determinism is always better) | L7 | Heuristic items where a hard gate is **wrong/overkill** (open-ended summary, tone) score against the learner if gated. | Reflexive hard-gate on heuristic items; low κ. |
| 10 | **"The AI did the thinking, so I directed it deterministically."** (credit misattribution) | L4/boss | Scoring credits the **learner's artifacts** (check, spec, tiering), worth 0 for the AI's output passing alone. | Thin/empty specs that lean on AI inference; caught by hidden input. |

These ten double as the item-design spec for L2 and for boss distractors: every
boss embeds at least misconceptions #1, #5, and #10 as scored traps.

---

## 9. Learning analytics — what to collect, and the metrics that prove the course works

**Collected per attempt (event stream, deterministic, no PII beyond pseudonymous
learner id):**

- `check_text`, `check_hash`, two-sided result (red-on-bad? green-on-good?),
  vacuous-flag hits.
- `retries`, `solve_time_ms`, `suspect_fast` tag, predict-first answers.
- `hint_depth` reached (0–3), per competency.
- Per level: pass/fail, star count, competency credit = `mastered` /
  `scaffolded` / `none`.
- L2: hits, false alarms, `d′`.
- Boss: per-dimension points, hidden-input outcome, overall pass, variant id.
- Timestamps for edit-lock sequencing (C4) and cooldowns.

**Course-health metrics (does the instrument work, not just "did learners
pass"):**

| Metric | Definition | Target that signals "the course works" |
|---|---|---|
| **Pre/post transfer gain** | Boss-equivalent task given **before** training and after; score delta | Mean gain ≥ **+30 points** (0–100); ≥70% of learners improve |
| **Held-out transfer rate** | % of certified learners passing a **different-domain** task not used in training | ≥ **70%** |
| **2-week retention** | Re-administer a capstone-equivalent 14 days post-cert, no practice | ≥ **80%** of post-score retained (≤20% decay) |
| **Vacuous-check rate over time** | Share of authored checks that are vacuous, by level attempt n | Falls from L1→L7; <**10%** by L5 (learning, not just gating) |
| **Gaming signal** | % of passes tagged `suspect_fast` or `scaffolded`-only | <**15%** of credited competencies |
| **Discrimination (item validity)** | Point-biserial of each boss dimension vs. total | ≥ **0.2** per dimension; drop/revise items below |
| **Pass-criterion vs. green gap** | % who reach green but fail the author-side criterion | **>25% is healthy** — proves "green ≠ learned" is biting |

The last metric is the key construct-validity check: if nearly everyone who
reaches green also passes the author criterion, the author criterion is not
doing work (likely too easy or vacuous-detection too weak). A visible gap is the
instrument *measuring the learner, not the AI* — exactly what the assessment
review demanded.

**No "predicts real-world performance" claim ships** until the held-out
transfer rate and a transfer *correlation* (ladder score vs. different-domain
task score, target r ≥ 0.4) are measured in the pilot.

---

## 10. Pilot study plan (~20 non-technical users)

**Goal:** establish that (a) non-technical adults can reach Certified
Practitioner, (b) the gates measure the learner not the AI, (c) the numeric
thresholds above are calibrated, and (d) there is real transfer.

**Participants:** n = **20** non-technical adults (non-coders; mix of
spreadsheet-comfortable and not). Screen out anyone who writes code
professionally. Target split ~50/50 on self-rated "comfort with pass/fail
thinking" to see if that moderates load (L3 is the risk rung).

**Design:** single-cohort, **pre/post + delayed-retention**, within-subject.

1. **Pre-test (day 0):** a boss-equivalent held-out task, scored on the §6
   rubric. Baseline — expect low (most will reach green with a vacuous check;
   that *is* the baseline competency gap).
2. **Training:** full ladder, self-paced, over up to 10 days. All analytics (§9)
   logged. **Think-aloud** on a 6-person subset through L3–L5 (the keystone and
   hinge) to catch where the plain-English-check scaffold breaks.
3. **Post-test (immediately after capstone):** a **different-domain** boss task.
4. **Retention (day +14):** another capstone-equivalent, cold, no practice.

**Success thresholds (pilot passes if):**

| # | Threshold | Rationale |
|---|---|---|
| P1 | ≥ **70%** (≥14/20) reach **Certified Practitioner** | Product is learnable by the target population |
| P2 | Mean **pre→post gain ≥ +30** points; ≥14/20 improve | Training causes the gain |
| P3 | Held-out (different-domain) transfer **≥70%** of certified | It is competency, not ladder-memorization (refutes G5) |
| P4 | Day-14 retention **≥80%** of post-score | Durable, not crammed |
| P5 | **Pass-criterion-vs-green gap ≥25%** somewhere in L3–L6 | The author-side gates are biting (construct validity) |
| P6 | Vacuous-check rate **<10% by L5** | The keystone skill (C1) is actually acquired |
| P7 | **<15%** of credited competencies tagged gaming/scaffolded-only | Anti-gaming controls hold |
| P8 | **≥80%** complete without a facilitator unblocking a UI/comprehension dead-end | Scaffolding is sufficient unaided |

**If a threshold misses:** P1/P8 → scaffold L3 harder (more worked
weak-vs-strong-check examples) and re-pilot that rung; P5 miss (gap too small) →
strengthen vacuous detection and raise two-sided seed difficulty; P6 miss →
L3 is under-taught, add the "how AI fails" concept rung earlier (per the
instructional-design review's reorder); P3 miss → the ladder is teaching shape
not judgment, weight L7/C6 more and diversify boss domains.

**Instrumentation to validate the instrument:** compute item point-biserials
(§9) and inter-rater agreement on the expert tiering key (κ ≥ 0.7 between two
experts) *before* trusting L7 scoring. Rotate any boss dimension with
point-biserial < 0.2.
