# Puzzle Ladder — Product Spec (v0.2)

A gamified, chess.com-puzzle-style course that takes non-technical adults from "ask the AI nicely and hope"
to "ask the AI for tools and checks that make the right-answer steps exact — and prove it."
Scales to a technical skin of the same levels.

**v0.2 change (2026-10-11):** the core interaction is now **rewrite the ask**. v0.1 levels taught the idea with
in-game buttons ("add calculator tool", a check-card palette) that don't exist in ChatGPT or Copilot, so learners
left without knowing what to type differently. Every level now has the learner rewrite a real prompt, see the
consequence of each choice, and leave with a copy-paste pattern for their own AI. Two prototypes prove the loop
(§4).

This document is the canonical spec. It makes the cross-cutting decisions and resolves conflicts between
the five detailed sections, which carry the full depth:

| Section | File | Owns |
|---|---|---|
| Curriculum | `section-curriculum.md` | Competencies C1–C14, 7 worlds / 23 levels + capstone, scenarios, planted violations, hints, both skins |
| Gamification | `section-gamification.md` | Two-track progression (Mastery + XP), ranks, streaks, hints, retries, badges, bosses, social, anti-patterns, cited research |
| Visual / UX | `section-visual-ux.md` | Map, motion specs, tokens, a11y, mascot |
| Assessment | `section-assessment.md` | Pass criteria, anti-gaming detectors, certification, misconception catalog, analytics, pilot |
| Architecture | `section-architecture.md` | Level packet schema, recorded-AI engine, Pyodide sandbox, check engine, persistence, providers, review of Jeff's repo |

`section-curriculum.md` was rewritten for v0.2 (all 23 levels in the rewrite-the-ask loop; v0.1 kept as
`section-curriculum-v0.1.md`). The other four sections were written before v0.2. Where they describe tool
buttons or card palettes as the main interaction, **this file wins** (see §10 Reconciliation).

---

## 1. Thesis and the claim we're allowed to make

> **Determinism comes from the tools you force the AI through, not the words you give it.**
> The AI stays a guesser. Each step that has a right answer becomes exact once a tool owns it.
> *Don't let it guess the part that has a right answer.*

In learner terms: **stop asking the AI for the answer. Ask it for the thing that produces the answer, and
for the check that proves it.**

Product copy says the learner can "get AI to hand you tools and checks instead of guesses." It never says a
green check means "the AI can't be wrong" — a check proves only what it checks.

## 2. Who it's for

- **Primary:** non-technical adults (analysts, ops, managers, clinical-adjacent staff) who already use chat AI.
  ~8th-grade reading level, no syntax required in the default skin.
- **Secondary:** developers, via the **technical skin** — same scenario, same moves, but the moves ask for
  scripts/functions/tests and the output shows code. Completing the technical skin of World 7 earns "Senior Architect."

## 3. The move set — what learners actually do differently

The curriculum *is* this list. Each move is a sentence the learner adds to a real prompt, and each world
drills one or two of them.

| # | Move | What you add to your ask | Taught in |
|---|---|---|---|
| M1 | **Name the shape** | "Answer in exactly this format: [fields/table]." | W1 |
| M2 | **Ask for the tool, not the answer** | "Don't calculate it yourself. Write a formula/script/query that does." | W2 |
| M3 | **Make it run the tool** | "Run it on my file and give me the result it produces." | W2 |
| M4 | **Show me the work** | "Show me the formula / checker / code so I can check it." | W2, W4 (third star everywhere) |
| M5 | **Pin the source** | "Use only the attached file. If it isn't there, say 'not found'." | W3 |
| M6 | **Ask for the check first, and prove it can fail** | "Before you start, write a checker that fails anything missing [rules]. Test it on a bad example and show me it fails. Then run it on everything." | W4 (keystone) |
| M7 | **Make it reusable** | "Turn it into something I can rerun next month." | W5 |
| M8 | **Point at the failure, don't loosen the check** | "Case [X] failed because [Y]. Fix the tool. Don't change the checker." | W6 |
| M9 | **Choose where certainty matters** | Decide which steps of a workflow need M2–M6 and which can stay plain prompting. | W7 |

### The tricks (decoys every level offers)

Popular prompting advice is offered next to the real moves. Each produces a specific, recorded consequence so
the learner *sees* why it doesn't work. This is the misconception catalog made playable.

| Trick | What happens | Lesson shown |
|---|---|---|
| "Be careful, double-check your math" / "Think step by step" | Answers get closer but still scatter | Changes how it talks, not who does the math |
| "You are an expert" | No change | Role-play doesn't add a calculator |
| "Just the number" | Shorter, still wrong | Brevity isn't accuracy |
| "Remind it of the rules" | Better hit rate, not 100%, and nothing tells you which one slipped | Telling it the rule isn't checking the rule |
| "Make sure it's perfect" | A confident "all perfect" that isn't true | Trying harder buys a claim, not proof |

## 4. The core loop (every level)

Proven by two prototypes: **`level-2-ask-for-the-tool.html`** (W2 L3) and **`world-4-ask-for-the-check.html`** (W4 L4).

1. **The job.** A realistic task with real-looking data ("What was West revenue in Q3?" over a 2,000-row sheet;
   "Draft replies to 8 customer emails, each needs greeting, name, next step").
2. **Just ask.** The learner runs the obvious prompt. It visibly fails: answers scatter across runs, or 4 of 8
   drafts quietly break a rule. The failure is a demo they run, never a wall.
3. **Rewrite the ask.** The learner adds moves (and possibly tricks) as chips; the full prompt they'd type
   renders live. Some moves open a sub-choice (e.g. "what should the checker test?" — real rules plus
   untestable ones like "friendly tone").
4. **Run it.** The outcome is a deterministic function of the moves chosen. Every *distinct wrong combination*
   has its own consequence and one-sentence lesson:
   - formula without "run it" → the AI still guesses the total ("about 231,880")
   - checker without "run it" → "I checked, all pass" (it didn't)
   - checker testing tone → can't fail, passes everything
   - checker missing a rule → says all pass; the misses are real
   - checker never proven to fail → **false green** (W4: it searched for "next" and "arrives next week" matched)
5. **Pass = the result is right AND what the AI told you matches reality.** A correct-looking report that
   isn't true is a fail.
6. **What you do differently.** Side-by-side: the naive prompt vs. the learner's prompt, with what each produced.
   Moves collected as badges.
7. **Try it in your AI.** A copy-paste pattern with notes for ChatGPT (runs code), Copilot in Excel (formula in a
   cell), and chat AIs that can't run code ("ask for the formula/checker and run it yourself; never accept
   'I checked, they all pass'"). This is the transfer step and appears at the end of every level.

**Who did the math** is stated in every result ("the AI (guessing)" vs. "the spreadsheet"). That one label
carries the thesis.

## 5. The ladder (7 worlds + capstone)

| World | Theme | Moves | Signature "just ask" failure | Competencies | Engine | Rank on mastery |
|---|---|---|---|---|---|---|
| W1 | Shape the Answer | M1 | Rambling answer you can't paste into a sheet | C1 | recorded | Shaper |
| W2 | Spot the Guess | M2, M3, M4 | Sum over 2,000 rows scatters 179K–442K (Jeff's real data) | C2, C3 | recorded + Jeff live beat | — |
| W3 | Answer from the Source | M5 | Invents a policy detail that isn't in the document | C4, C3 | recorded | Tool User (W2+W3) |
| W4 | Name the Check *(keystone)* | M6, M4 | 4 of 8 drafts break a rule, no warning; then a checker that's quietly broken | C5, C6, C7 | recorded | Checker |
| — | **The Workshop seam** | — | "You've been writing the ask. Now the AI builds real tools you keep." | — | onboarding beat | — |
| W5 | Have AI Build the Tool | M7, M2, M6 | A one-off answer you have to re-ask every month | C8, C9, C10 | live AI + sandbox | — |
| W6 | Prove It & Fix It | M8 | Fixing a failure by loosening the check | C11, C12, C9 | live AI + sandbox | Builder (W5+W6) |
| W7 | Decide Where It Matters | M9 | Hard-gating everything (too slow) or nothing (wrong refund sent) | C13 | mixed | Architect |
| Cap | Capstone | all | Unseen cross-domain job, free-text ask | C14 | live | Certified Practitioner |

Level-by-level scenarios, planted violations and hints stay in `section-curriculum.md`; each level's
interaction is re-expressed as rewrite-the-ask (§10).

## 6. Gamification — what "level up" means

Two tracks, never conflated (`section-gamification.md` §3):

- **Mastery (the truth):** per-competency (Practiced → Proficient → Mastered). Advances only on boss / transfer
  evidence plus a spaced re-check. Ranks and certificates read this.
- **XP (the vibe):** monotonic, never drops. Level 20 · **+15 "seen failing"** (the check went red on a bad
  example) · Boss 50 · transfer 100. Drives the belt ring within a rank.

**Ranks:** Guesser (start, named warmly) → Shaper → Tool User → Checker → Builder → Architect → (Senior Architect,
technical skin).

**Moves are the collectible.** Each move earned appears as a badge; the learner's "move deck" is their visible
progress and the thing they take to work. Tricks they've *disproven* are shown crossed out ("Busted: 'think step by step'").

**Each world ends in a Boss:** a new domain, new decoys, and in later worlds a free-text ask (§8). Boss passes
advance the world; per-level passes are practice.

**Kept:** stars, belt ring, 3-step hint ladder (nudge → show the gap → name the moves), evidence badges, gentle
repairable streaks, opt-in puzzle rating in the technical skin, daily puzzle (Phase 3).
**Refused:** hearts/lives, lockouts, leaderboards/leagues, speed scoring, loss-framed streaks, loot boxes.

## 7. Visual system

- **Level screen = two panels plus a verdict.** Left: the job, the data preview, **"What you type"** (live
  prompt, real moves in blue, tricks in purple) and the move chips. Right: **"What comes back"** (scatter of
  answers against a true-answer line, or a grid of drafts each marked against the rules) and a full-width
  check bar. Below on pass: **"What you do differently"** comparison and the **"Try it in your AI"** card.
- **Consequences are visual, not just text:** scattered red dots vs. green squares locked on the truth line;
  draft cards with per-rule marks, "REWRITTEN" tags, and a "checker: pass/fail" badge that can disagree with
  reality (that disagreement is what a false green looks like).
- **The pipeline board** (`section-visual-ux.md` §2) is kept as a secondary explainer — the "Who did the math"
  label and an optional strip showing the ask routing through a tool — not as the main control.
- **Moments:** fail (shake + "Who did the math: the AI (guessing)"), fix (results lock onto the truth line),
  win (stars, moves collected), rank-up (crest), boss (distinct crest).
- **Palette:** Okabe–Ito color-blind-safe (`--ok #009E73`, `--danger #D55E00`, `--accent #0072B2`,
  `--warn #E69F00`, tricks `#CC79A7`); color always paired with an icon/shape/label. Dark default + light, Inter.
  Both v0.2 prototypes already use these.
- **Mascot:** restrained "routing node" guide carrying hints. **A11y:** WCAG 2.1 AA, keyboard play,
  reduced-motion, live-region narration of results.

## 8. Assessment — level-ups are earned honestly

- **Pass criterion (every level):** the outcome is right *and* the AI's report matches reality. Graded by a
  deterministic ground-truth grader (the database total; the three rules per draft), never by an LLM.
- **Seen failing is required where a check is involved:** W4 cannot pass without the "prove it can fail" move,
  because the recorded scenario contains a checker bug only a bad-example test exposes.
- **Every move combination is tested at build time.** The outcome model is a pure function of the chosen
  moves; CI enumerates all combinations and asserts only the intended set passes (prototypes: Level 2, 128
  combinations; World 4, 4,096 combinations, 64 passing — all pass).
- **Stars (canonical):** ★ passed; ★★ passed within the attempt budget (≤2 at W2, ≤3 at W4) without the
  third hint; ★★★ also includes **M4 Show me the work**. Stars never gate progression or cost XP.
- **Anti-gaming:** chip combinations are memorizable, so practice levels are formative only. Bosses and the
  capstone switch domain and decoys, and from W5 on take a **free-text ask** run against the live model;
  the *outcome* is graded by ground truth, so no LLM judges the prompt.
- **Certification:** Completion → Certified Practitioner (every boss ≥70 and capstone ≥70) → Distinction
  (capstone ≥90 and ≥70% of levels at ★★★). Certificates carry an evidence hash.
- **Misconceptions:** the trick catalog (§3) plus "green means correct", "temperature 0 is deterministic",
  "one green is proof", "everything should be hard-gated" — each mapped to the level that breaks it.

## 9. Architecture and build plan

- **Build on Jeff's repo, ladder shell around it.** His Agent A (reads data, guesses) vs. Agent B (writes SQL,
  engine runs it) *is* the M2+M3 lesson on a live model. Keep his read-only SELECT guard and seed-42
  reproducibility; fix the non-read-only SQLite connection and add provider timeouts (`section-architecture.md` §10).
- **The course is data.** Each level packet (YAML → JSON) declares: the job, data preview, naive prompt,
  moves and tricks (plain + technical text), sub-choices, **outcome classes** (one per distinct consequence,
  with recorded outputs, feedback and lesson), the ground-truth grader, hints, stars, the "Try it in your AI"
  template, and telemetry. Build fails if the combination test (§8) fails.
- **Worlds 1–4: recorded AI.** Outputs are captured once from a real model *per outcome class*, not per
  combination, so a few recordings cover thousands of combinations. Instant, free, reproducible.
- **Worlds 5–7, bosses, capstone: live AI.** Free-text asks run against Bedrock/OpenAI via Jeff's provider
  layer; AI-written code runs in a **Pyodide (Python-on-WASM) Web Worker** in the learner's browser. Server
  containers only in Phase 3 if needed.
- **Check engine:** the deterministic predicate catalog now powers (a) the ground-truth graders and (b) the
  "what should the checker test?" sub-choices; untestable criteria ("friendly tone") are modeled as checks
  that cannot fail. Vacuous-check and false-green detection compare the AI's claim to the grader's verdict.
- **Persistence:** SQLite/SQLModel for MVP, same schema on Postgres later.

### Phasing

| Phase | Scope | Proves |
|---|---|---|
| **MVP** | Map + W1–W4 in the rewrite-the-ask loop (the two prototypes become packets) + one live Jeff-engine beat in W2 + stars/XP/moves/hints + a11y + telemetry | Do non-technical adults change what they type, and can they get a working checker out of the AI? |
| Phase 2 | W5–W7, live free-text asks, Pyodide sandbox, bosses + certification | Can they get AI to build and prove a reusable tool? |
| Phase 3 | Accounts/cohorts, daily puzzle, themed drills, rating queue, scenario generator, server containers if needed | Retention and replayability |

**Next user test (before building anything else):** put the two prototypes in front of ~5 non-technical people,
then have each do a real task in their own AI. Success = they use M2/M3 and M6 *outside the game* without being told.

## 10. Reconciliation — conflicts resolved in this spec

| Conflict | Sections | Decision |
|---|---|---|
| **Main interaction** | curriculum, visual, architecture describe tool buttons, a check-card palette and the board as the control | **Superseded by rewrite-the-ask (§4).** Curriculum keeps ownership of scenarios, planted violations and hints; each level's "scaffold" becomes moves + tricks + outcome classes. The board becomes a secondary explainer. |
| Check authoring (W4) | curriculum W4 L1–L4 as recognize/pick/repair/author with clause cards | **Re-expressed as asking the AI for a checker:** L1 spot a checker that can't fail, L2 pick the stronger checker request, L3 fix a checker request that lets a bad one through, L4 the full ask with "prove it can fail" (prototype). |
| 5 vs. 7 worlds | gamification (5) vs. others (7) | **7 worlds + capstone.** Tool User on W2+W3, Builder on W5+W6, Architect on W7. |
| Star rubric | gamification vs. assessment | **§8 rubric** (third star = Show me the work). Hints never cost XP or break streaks. |
| Competency IDs | assessment C1–C6 vs. curriculum C1–C14 | **Curriculum C1–C14 canonical.** aC1 → C5–C7, aC2 → C2, aC3 → C8, aC4 → C10, aC5 → C11, aC6 → C13. |
| Retries | gamification "no cooldown" vs. assessment "24h boss re-sit" | Unlimited free retries in practice; boss re-sit after 24h on a different variant. |
| "Deterministic" wording | assessment vs. owner thesis | **Owner thesis stands**, tied to the mechanism. Never "makes the AI deterministic." |
| Prototype palette | visual flagged v0.1 teal/red | v0.2 prototypes use Okabe–Ito; v0.1 prototypes are retired. |

**Retired prototypes:** `level-2-dont-let-ai-do-math.html` (tool button) and `world-4-write-the-check.html`
(card palette). Kept for reference only.

## 11. Open decisions for the owner

1. **Pilot cohort:** who are the ~5 (then ~20) non-technical testers?
2. **Jeff's role:** co-owner of the engine vs. upstream dependency.
3. **Hosting / auth:** the MVP assumes a FastAPI backend with SQLite; any network-exposed deployment needs
   authentication, which is not yet designed.
4. **Free-text vs. chips in the plain skin:** chips keep early levels reproducible; free text is the real
   skill. Current call: chips in practice levels, free text from W5 and in every boss — confirm.
5. **Name:** "Puzzle Ladder" is a working title.
