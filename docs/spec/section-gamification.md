# Section: Level-Up & Progression System

*Puzzle Ladder — gamified course on making AI deterministic with tools.*
Scope: the full progression layer — map, XP/rating, rank titles, scoring, streaks,
hints, retries, unlockables, badges, boss levels, social, and anti-patterns. Every
number below is a chosen default with a rationale, not a placeholder.

---

## 0. Design principle: the progression serves the thesis, not the DAU chart

The thesis — *determinism comes from the tools you force the AI through, not the
words you give it; don't let it guess the part that has a right answer* — has a
direct consequence for gamification that most ed-games get wrong: **the reward must
be bound to the learner's own check going green, never to time-on-task.** A chess
puzzle is satisfying because the win is self-evident and lands in under a second
([chess.com, how puzzles work](https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com)).
Our win is the same shape (red → green) *only if the learner authored the check and
understands what green means* — a point the UX reviewer calls the single
highest-risk component. So the progression system is engineered to reward
**authorship of a check that has been seen failing**, which is also the course's own
non-negotiable fix #1 (a check only counts if it's been seen failing).

The literature backs the restraint. A 2024 systematic review ("The ghost effect")
and a 2026 study both find gamification helps at *moderate* levels but shows an
**inverted-U** — diminishing or negative returns when overused, because point/badge
rewards start to substitute for the intrinsic desire to understand
([Frontiers 2024](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1474733/full),
[Frontiers 2026](https://www.frontiersin.org/journals/sociology/articles/10.3389/fsoc.2026.1740629/full)).
The **overjustification effect** (Deci 1971; Lepper, Greene & Nisbett 1973; Deci,
Koestner & Ryan 1999 meta-analysis of 128 experiments) is specific: *expected
tangible rewards* cut intrinsic motivation by about **d = −0.40**, while *verbal
praise / informational feedback* raised it by about **d = +0.31**
([summary](https://yukaichou.com/behavioral-analysis/overjustification-effect-lepper-greene-intrinsic-motivation/)).
The operational rule we take from this: **make rewards informational, not
transactional.** XP and stars should *tell the learner what they proved* ("your
check caught 3 of 3 planted bad answers"), not pay them for showing up.

---

## 1. What we borrow (and refuse) from each reference product

| Product | Mechanic | Keep | Refuse / adapt |
|---|---|---|---|
| **chess.com Puzzles** | Glicko-style **puzzle rating** (goes up on solve, down on miss; change scales with puzzle-vs-you gap) ([ratings](https://support.chess.com/en/articles/12488563-why-did-my-puzzle-rating-change)) | A visible, matched **difficulty rating** so the climb is legible | Rating that can *drop* — demoralizing for anxious novices (§3) |
| **chess.com Puzzle Rush / Streak** | Timed survival; 3 strikes ends it; Rush Streak 20/30 badges ([Rush](https://www.chess.com/blog/Nightwish85/rush-streak)) | A **no-timer "survival" drill mode** for replay (post-certification only) | The timer during learning — latency + anxiety kill it at the sandbox rungs |
| **chess.com Puzzle Points/Tiers** | Points (15 easy / 20 hard / 25 extra-hard) → Wood…tiers, *separate from rating* ([points](https://support.chess.com/en/articles/9681952-what-are-puzzle-points-on-chess-com)) | **Points decoupled from rating**: points only go up (safe), rating is private/optional | — |
| **Duolingo** | XP as the common currency; **crown levels** per skill; path; **hearts** (mistakes cost lives); **leagues** (30-person weekly, now scored on path progress not raw XP) ([leagues](https://duolingo.deconstructoroffun.com/mechanics/leagues), [2026 Score change](https://views.terabox.com/hub/how-duolingo-leagues-work-and-how-to-reach-the-diamond-rank)) | XP as connective currency; **per-skill mastery crowns**; path metaphor | **Hearts/lives** (punishing the exact mistakes we want learners to make freely) and **leagues** for novices (§6) |
| **Duolingo streaks** | Daily streak via loss aversion (~2× pain of gain); 600+ A/B tests; **streak freeze/repair** as "mercy infrastructure" ([streak design](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/)) | A **gentle, repairable** streak with graduation | The day-30 shift from Accomplishment → Loss-Avoidance; broken long streaks suppress engagement *below baseline* (Silverman & Barasch 2023) |
| **Brilliant.org** | **Problem-first / active learning** — you manipulate before you're told; learn by doing, not watching | Problem-first framing: *see the AI fail, then fix it* is already this shape | — |
| **Khan Academy** | **Mastery ladder**: Not started → Attempted (<70%) → Familiar (70–99%) → Proficient (100%) → Mastered (held on a later mixed test) ([mastery](https://www.khanacademy.org/khan-for-educators/k4e-us-demo/xb78db74671c953a7:using-assignments-on-khan-academy/xb78db74671c953a7:strategies-for-using-assignments-with-students/a/using-khan-academy-s-skills-report)) | **Mastery requires later, mixed re-demonstration** — exactly the panel's "certification needs held-out transfer" fix | "Mastered on first green" — one green is not proof |
| **Codewars** | **8 kyu → 1 kyu → 1–8 dan** martial-arts ranks; rank advances only on *harder-than-you* kata; **honor** points separate from rank ([ranks](https://docs.codewars.com/gamification/ranks)) | Two-track model: a **rank** (proof of level) + a safe **honor-style** point counter | The punishing exponential (1 kyu needs 13,147 pts; 1 dan 35,759) — fine for devs, not novices |
| **Exercism** | Mentored, **no points/ranks at all** — exercises + human feedback | Proof that progression *can* be non-competitive; informs our "anxious novice" default | — |

**The synthesis:** a Khan-style **mastery spine** (the real measure), wrapped in a
chess-style **matched-difficulty puzzle feel**, titled with a Codewars-style **rank
arc**, with Duolingo's **XP/path legibility** — but with every *loss* mechanic
(rating drop, hearts, punishing streaks, novice leaderboards) stripped out or made
opt-in, because our audience is non-technical adults, many mandated and anxious.

---

## 2. Progression map — Worlds → Units → Levels

The map honors two panel findings at once: (a) the determinism concepts are
naturally **themes, not a strict sequence** (UX reviewer), and (b) the ladder must
**not change genre mid-climb** (click-puzzle → laggy sandbox) without a designed
transition. We resolve both with **5 Worlds** (themed, the "two mountains" the UX
reviewer says a linear ladder lacks) on a recommended linear **path**, each World
ending in a **Boss Level**. The 7 approach-rungs map onto the Worlds below; the
hard genre shift (visual → real AI code) is isolated to the World 3→4 seam and gets
its own onboarding beat.

```
PATH (recommended order, but Worlds 1–3 unlock as a themed set after W1)

  WORLD 1 ─ SHAPE IT          rungs 1   "Make the answer fit a form."
    U1.1 Pick the fields       U1.2 Reject the ramble      U1.3 Two skins intro
    ★ BOSS: a free-text answer vs a form — force the form, check passes

  WORLD 2 ─ DON'T GUESS        rungs 2–3 "Pull the right-answer step out of the AI."
    U2.1 Spot the guess        U2.2 Calculator/lookup rung  U2.3 Grounding (source) rung  ← panel fix #7
    ★ BOSS: AI confidently returns 179K–442K for a sum; route through SQLite → exact (Jeff's engine)

  WORLD 3 ─ NAME THE CHECK     rung 4   "A rule is only real if a check fails on it."  ← THE KEYSTONE
    U3.1 Recognize a check     U3.2 Pick the better of two   U3.3 Edit a near-miss check   U3.4 Author one
    ★ BOSS: write a plain-English check; it must catch all planted bad answers AND pass the good one
    (this is the course's whole-product-in-miniature; it is a 4-unit MINI-LADDER, per adult-learning fix #1)

        ══ SEAM: "You've been the inspector. Now you'll hire the builder." (designed genre transition) ══

  WORLD 4 ─ DIRECT THE BUILD   rungs 5–6 "Have the AI build the tool; your check proves it."
    U4.1 Describe the tool     U4.2 Watch red→green on your own example   U4.3 Fix by re-directing
    ★ BOSS: a planted failing case; tighten the spec until it passes without breaking the greens

  WORLD 5 ─ DECIDE WHERE IT MATTERS  rung 7 (capstone judgment)
    U5.1 Hard gate vs heuristic  U5.2 Risk-tier a real workflow   U5.3 Transfer task (held-out)
    ★ BOSS / CERTIFICATION: a novel workflow, unseen; learner risk-tiers it, forces the right steps
      deterministic, and authors the checks — graded on a HELD-OUT transfer task, not a rehearsed one
```

**Why 5 worlds, not 7 flat rungs:** worlds create the themed-drill replay surface
the UX reviewer wants, let Worlds 1–3 open as a set for self-directed practice, and
quarantine the single risky genre shift to one labeled seam. Each World is a
coherent *concept*, each Unit a 2–5 minute puzzle, each Boss a transfer check.

---

## 3. The two-track model: Mastery (the truth) + XP (the vibe)

The hardest-won lesson from the reference teardown is Codewars' and chess.com's
shared move: **separate the thing that measures skill from the thing that feels
good.** We run two parallel tracks, and only one of them can go down.

### Track A — Mastery per skill (Khan-style, this is certification)
Each of the 5 Worlds carries a **mastery crown** per its core skill. States, adapted
from Khan Academy's ladder:

| State | How reached | Meaning |
|---|---|---|
| **Not started** | — | — |
| **Attempted** | engaged, <2 stars on the boss | struggling — route to hints/worked example |
| **Familiar** | boss passed once (one green) | *formative only — one green is not proof* |
| **Proficient** | boss passed + a **spaced re-check** 2–7 days later on a *variant* | the check held up on a case they hadn't seen |
| **Mastered** | Proficient **and** the skill reappears green inside a later World's **mixed transfer boss** | the panel's "held-out transfer" bar (assessment fix #3) |

Mastery is the only track that gates **certification**. It cannot be bought with
time; it requires re-demonstration on unseen cases. This is the direct antidote to
the UX reviewer's "the machine said yes" failure mode — *green has to be their green,
twice, on cases they didn't rehearse.*

### Track B — XP + Puzzle Points (safe, monotonic, informational)
XP is Duolingo's connective currency and chess.com's points tier, merged and made
**one-directional** (it never drops — removing the loss-aversion sting for novices).
XP is **informational**: the award line always names what was proved.

Award schedule (tuned so a 5-minute session yields a satisfying ~40–80 XP):

| Event | XP | Informational line shown |
|---|---|---|
| Unit solved (first time) | 20 | "Fields locked — the AI can't ramble now." |
| Boss solved (first green) | 50 | "Your check caught the planted answer." |
| **Check seen failing** (planted violation turns it red before green) | **+15 bonus** | "You watched it fail — that's why green means something." |
| Spaced re-check held (→ Proficient) | 30 | "Held up 3 days later on a new case." |
| Transfer boss (→ Mastered) | 100 | "You did it on a workflow you'd never seen." |
| Hint used | 0 (no penalty) | — |
| Wrong attempt | 0 (never negative) | the failing case is shown, framed as data |

The **+15 "seen failing" bonus is the single most important number in the system**:
it pays the learner specifically for the behavior the thesis and panel fix #1
demand, and it is impossible to earn with a vacuous check.

### Puzzle Rating (chess.com-style) — OFF by default, opt-in for the technical skin
A matched-difficulty **rating** (Glicko-style) exists but is **hidden for the
beginner skin**. Research is blunt here: leaderboards and ranking systems are
"strongly associated to many negative effects" in learning environments
([ResearchGate, Dark Side of Gamification](https://www.researchgate.net/publication/326876949_The_Dark_Side_of_Gamification_An_Overview_of_Negative_Effects_of_Gamification_in_Education)),
and social comparison triggers catch-up effort in top performers but *disengagement*
in those at the bottom ([dev.to on Duolingo](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4)) —
i.e. exactly the anxious novices we must not lose. So rating is a power-user feature
of the **technical skin** (where the audience is developers who read Elo as fun),
used to feed a matched-difficulty **drill queue**, never shown as a thing that falls.

---

## 4. Rank / level-up titles — themed to the thesis

Titles are the Codewars-style arc, but every title is a **role in the determinism
story**, so leveling up *is* internalizing the thesis. The owner's suggested arc
(Guesser → Tool User → Checker → Builder → Architect) is adopted and completed:

| Rank | Earned at | What it says you can now do |
|---|---|---|
| **Guesser** | start | You ask the AI nicely and hope. (Everyone starts here — named honestly, not shamed.) |
| **Shaper** | World 1 Mastered | You make the answer fit a form so it can't ramble. |
| **Tool User** | World 2 Mastered | You pull the right-answer steps out of the AI and hand them to a tool. |
| **Checker** | World 3 Mastered | You can write a plain-English check that actually fails on a bad answer. *(the keystone rank)* |
| **Builder** | World 4 Mastered | You direct the AI to build a real tool and prove it works. |
| **Architect** | World 5 Mastered (transfer boss) | You decide **where** determinism matters and force only those steps. |

Two refinements:
- **"Guesser" is the hero's starting title, not an insult** — the whole product
  reframes guessing as the default everyone (and every AI) does, which is why the
  thesis matters. This matches the adult-learning fix: *lead with a win, don't open
  with "you're bad at this."*
- A **"Senior Architect"** prestige title is reserved for completing the **technical
  skin** of World 5 — the only place the two skins are honestly distinguished as
  different achievements (adult-learning fix #5: stop pretending the two skins are
  one concept).

Within a rank, a thin **1–5 "belt" progress ring** (Codewars' wheel) shows
distance to the next rank, filled by XP — a visible climb without a droppable number.

---

## 5. Stars, scoring, hints, retries, streaks

### Stars per level (the per-puzzle legible win)
Each Unit and Boss scores **1–3 stars**, bound to *proof quality*, not speed:

- ★ — solved with the structural hint revealed (you got there with scaffolding)
- ★★ — solved unaided
- ★★★ — solved unaided **and** your check caught every planted bad case while
  passing every good one (the "no false green, no false red" bar)

Stars are shown as *filled relative to a fixed max* (not a ranking vs others). 3-star
on a boss is what unlocks the **spaced re-check** that leads to Proficient. Speed is
never scored — it would punish the sandbox rungs where model latency is outside the
learner's control (UX reviewer: *novices read infra failure as personal failure*).

### Hint ladder (first-class system, per-tier — UX reviewer's #3 recommendation)
Chess.com's retention engine *is* its hint/retry/solution system; our plan had none.
Defined, graded, **zero XP penalty**, same 3-step shape at every rung:

1. **Nudge** — a question, not an answer. *"What would a wrong answer look like here?
   Could your check catch it?"*
2. **Structural reveal** — show the *shape* of the solution with the content blanked.
   Beginner skin: the empty slots light up. Technical skin: the function/check
   signature appears, body blank (a *constrained editor*, per UX reviewer #6 — not a
   free drag canvas that teaches a wrong mental model of what a check is).
3. **Worked example on a twin** — the full solution demonstrated on a *different*
   instance, then the learner does theirs. Never hands them their own answer.

Using a hint caps that attempt at ★ but **never costs XP or rating** and never breaks
a streak. Hints are *more* available at the keystone World 3, not less.

### Retry rules — NO hearts, NO lives, NO lockout
Duolingo's hearts punish mistakes; our thesis *requires* learners to make and watch
mistakes (seen-failing is the point). So: **unlimited retries, no lives, no cooldown.**
A wrong attempt returns the **failing case as data**, visually distinguished as
*"your check did its job / your check missed this"* vs *"the system had a problem"*
(timeout, model error) — the UX reviewer's explicit ask so novices don't read infra
failure as personal failure. On a sandbox rung, a system failure auto-retries and
never counts against the learner.

### Streaks — gentle, repairable, and they GRADUATE
A streak exists (habit formation is real: Duolingo's streak drove DAU up ~4.5× in
four years), but engineered against its own dark side. Research shows streaks shift
from *Accomplishment* to *Loss-Avoidance* around day 30 and that a broken long streak
suppresses engagement **below baseline**
([Silverman & Barasch 2023, via streak-design analysis](https://yukaichou.com/gamification-analysis/streak-design-gamification-motivation-burnout/)).
Our rules:

- Streak counts **days you proved something** (a green on a *new or re-check* unit) —
  not days you opened the app. You cannot streak-farm by re-solving a solved puzzle.
- **2 streak-freezes banked automatically**, auto-spent on a missed day (Duolingo's
  "mercy infrastructure"). Missing a day with a freeze is invisible — no guilt screen.
- **Graduation:** past a 14-day streak the UI *stops counting up daily* and converts
  to a permanent **"Consistent" status badge** — removing the day-N anxiety exactly
  when loss-aversion would otherwise take over (the graduation principle).
- No streak is ever shown next to the learning content, and breaking one shows a
  **recovery CTA**, never a loss animation.

---

## 6. Unlockables, badges, boss levels, social

### Unlockables (progression gates that teach, not loot boxes)
Unlocks are **capability gates**, so each unlock is a small competence statement:

| Unlock | Gated behind | Why it's a teaching gate, not a carrot |
|---|---|---|
| World 2–3 as a free-choice themed set | World 1 Mastered | lets self-directed learners drill a weakness (UX reviewer #5) |
| The **real-model engine** (Jeff's A-vs-B, live Bedrock) | World 2 Boss | the live model appears only *after* the loop is proven on a pinned failure (UX reviewer #2: pin the AI failure first, live variance later) |
| **Technical skin** of any solved World | that World Mastered on beginner skin | the skin switch is a *reward for understanding*, not a free toggle a novice picks blind |
| **Build Sandbox** (write-your-own-check free play) | World 3 Mastered | you can't free-play authoring until you can author |
| **Survival / Daily Puzzle** modes | Architect rank | endless-mode replay surface, opened only once the course is done |
| Cosmetic board/skin themes | XP thresholds (250/750/1500) | purely cosmetic — the *only* place cosmetic-only rewards live, so they never gate learning |

### Badges — evidence badges, not attendance badges
Per the overjustification finding (informational feedback *helps*, +0.31; tangible
transactional rewards *hurt*, −0.40), every badge **names a proof**, not a quota:

- **"Seen It Fail"** — watched a check go red on a planted violation (World 1). *The
  foundational badge; everyone earns it early, because it's the whole thesis.*
- **"No False Green"** — authored a check that passed the good answer AND caught all
  planted bad ones, first try (World 3 keystone).
- **"Caught the Confident Wrong"** — forced the aggregation rung through a tool after
  the live model returned a wrong total (World 2 boss, Jeff's engine).
- **"Tightened It"** — fixed a failing case by narrowing the spec without breaking a
  passing one (World 4).
- **"Knew Where It Mattered"** — correctly risk-tiered a workflow's steps on the
  transfer boss (World 5 capstone).
- **"Held Up"** — a check survived its spaced re-check unchanged (ties to Proficient).

Explicitly **no** streak-length badges, no "100 puzzles" volume badges, no login
badges — those reward sessions, not learning, and are the overjustification trap.

### Boss levels — one per World, each a transfer check
A Boss is **not** a harder puzzle of the same instance; it's the same skill on a
**fresh, unrehearsed case** — this is what makes it evidence rather than recall.
Boss design rules (from the panel):
- The Boss **always ships with a planted violation** the learner's solution must
  catch (panel fix #1 enforced at the gate, not just taught).
- World 2's Boss is the **marquee demo**: the live model (Agent A, temp 0.7) returns
  a scattered wrong sum (real Bedrock: 0/10 correct, 179K–442K); the learner routes
  the step through the SQL/SQLite tool (Agent B: 10/10 exact) and the check flips
  green. This is the thesis made physical and uses Jeff's existing engine.
- World 5's Boss is the **certification**: a workflow the learner has never seen,
  graded on held-out transfer — the only gate that confers **Architect** and the
  completion certificate. "One green" anywhere else is formative; this is summative.

### Social features — minimal, and the right ones omitted for anxious novices
The evidence is directional: leaderboards drive top performers and *disengage* the
bottom; novices under social comparison tend toward disengagement, not catch-up. So:

**Omit for the beginner skin (anxious / mandated novices):**
- ❌ Live leaderboards / Duolingo-style leagues — the clearest novice-harm mechanic.
- ❌ Head-to-head, public ratings, "friends passed you" nudges.
- ❌ Any ranking that shows the learner *below* others.

**Keep (non-comparative, or opt-in):**
- ✅ **Share a win** — a learner can share "I made the AI prove its own math" with the
  specific artifact (their check + the red→green). Shares *outward*, never ranks inward.
- ✅ **Cohort progress, anonymized & aggregate** — "you and 4 teammates reached
  Checker this week" (belonging, not competition) — useful for the mandated-cohort case.
- ✅ **Leagues/weekly ladder: technical skin only, opt-in** — developers who *want*
  the chess.com competitive surface get it; it's off by default and never shown to a
  beginner-skin learner.
- ✅ **Mentor/review hooks (Exercism-style)** — optional human "does your check
  actually hold?" review for teams, the highest-signal social feature and
  non-comparative.

---

## 7. Anti-patterns to avoid (explicit guardrails)

1. **Rewarding time, not proof.** No XP for minutes, logins, or video-watching. Every
   reward names a proof. (Overjustification: tangible rewards for already-wanted
   behavior cut intrinsic motivation ~d=−0.40.)
2. **The vacuous green.** Never let a check that was *never seen failing* count. The
   +15 "seen failing" bonus and the Boss planted-violation gate both enforce this. A
   learner seeing someone-else-shaped green "learns nothing except the machine said
   yes" (UX reviewer).
3. **A translator that interprets.** If the plain-English-check→test translator does
   any interpretive lifting, the learner loses authorship of the win and dopamine
   decouples from mastery. Keep the translation legible and the learner's wording
   visible in the generated check. (UX reviewer: *single highest-risk component.*)
4. **Droppable scores for novices.** No rating decay, no hearts, no lives, no
   negative XP on the beginner skin. Loss mechanics disengage the bottom of the
   distribution — our exact audience.
5. **Streak as the point.** The day-30 Loss-Avoidance flip and below-baseline crash
   after a broken long streak are designed out via freezes + graduation to status.
6. **Leaderboards for beginners.** Strongly associated with negative learning effects;
   confined to opt-in technical skin.
7. **Genre whiplash with no transition.** The visual→sandbox shift is quarantined to
   one labeled World 3→4 seam with its own onboarding beat; latency/system failure is
   visually separated from "your check failed" so infra pain isn't read as personal.
8. **Opening with failure.** Lead with a win in the first 3 minutes (World 1 U1.1 is a
   guaranteed early green); show the AI failing as a **demo you run**, not a wall the
   learner hits (adult-learning fix #2–3).
9. **Cosmetic-as-progression.** Cosmetics are quarantined to a pure XP cosmetic track
   and never gate a skill, so dressing up never masquerades as learning.
10. **Mastery on one green.** Certification requires spaced re-check + held-out
    transfer. One green is formative, never summative (assessment fix #3).

---

## Sources
- chess.com: [puzzle mechanics](https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com), [rating (Glicko)](https://support.chess.com/en/articles/12488563-why-did-my-puzzle-rating-change), [points/tiers](https://support.chess.com/en/articles/9681952-what-are-puzzle-points-on-chess-com), [Puzzle Rush/Streak](https://www.chess.com/blog/Nightwish85/rush-streak)
- Duolingo: [leagues (30-person, Score>XP)](https://duolingo.deconstructoroffun.com/mechanics/leagues), [leagues 2026](https://views.terabox.com/hub/how-duolingo-leagues-work-and-how-to-reach-the-diamond-rank), [why it works & when it doesn't](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4), [streak design/graduation](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/)
- Khan Academy: [mastery levels](https://www.khanacademy.org/khan-for-educators/k4e-us-demo/xb78db74671c953a7:using-assignments-on-khan-academy/xb78db74671c953a7:strategies-for-using-assignments-with-students/a/using-khan-academy-s-skills-report)
- Codewars: [kyu/dan ranks + score tables](https://docs.codewars.com/gamification/ranks)
- Evidence: [overjustification effect](https://yukaichou.com/behavioral-analysis/overjustification-effect-lepper-greene-intrinsic-motivation/) (Deci 1971; Lepper/Greene/Nisbett 1973; Deci/Koestner/Ryan 1999, k=128), ["ghost effect" review, Frontiers 2024](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1474733/full), [inverted-U, Frontiers 2026](https://www.frontiersin.org/journals/sociology/articles/10.3389/fsoc.2026.1740629/full), [Dark Side of Gamification / leaderboards](https://www.researchgate.net/publication/326876949_The_Dark_Side_of_Gamification_An_Overview_of_Negative_Effects_of_Gamification_in_Education), [streak loss-aversion / below-baseline](https://yukaichou.com/gamification-analysis/streak-design-gamification-motivation-burnout/)
