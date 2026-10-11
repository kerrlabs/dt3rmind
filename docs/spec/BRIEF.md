# Brief: "Puzzle Ladder" — gamified course on making AI deterministic with tools

## Product goal
A gamified, chess.com-puzzle-style learning tool (with Duolingo/Brilliant-style "level up") that takes
NON-TECHNICAL adults to the point where they direct AI to write code/tools that perform steps
deterministically — and prove it works. Scales up to harder, technical lessons via a second "skin".
Must be ENGAGING, INFORMATIVE, and VISUALLY APPEALING.

## Thesis (owner-confirmed, do not dilute)
"Determinism comes from the tools you force the AI through, not the words you give it."
The AI stays stochastic; each STEP becomes deterministic once a tool owns it.
"Don't let it guess the part that has a right answer."

## Inputs (read these in ./inputs/)
- APPROACH.md — original ladder approach
- PITCH-FOR-JEFF.md — revised pitch, tools-per-rung ladder, panel fixes baked in
- review-*.md — five expert reviews (instructional design, adult learning, AI engineer, UX/gamification, assessment)
- level-2-dont-let-ai-do-math.html — working prototype of one level (pipeline "board" that re-routes
  through a tool; red check + shake -> tool drops in -> green + stars + "lesson unlocked")

## Key panel findings that the spec must honor
1. A check only counts if it's been SEEN FAILING (planted violation per check; vacuous-check detection).
2. Authoring a plain-English pass/fail check is the hard keystone skill — scaffold it heavily; it is the #1 risk.
3. One green example is not proof; per-rung greens are formative, certification needs held-out transfer tasks.
4. Lead with a win in the first 3 minutes; show AI failure as a demo, not a wall.
5. Don't let the loop change genre/pace mid-ladder (instant puzzles vs laggy sandbox) without designing for it.
6. Safe execution of novice-directed AI code is the hardest technical component.
7. Add a grounding (source/lookup) rung; risk-tiering ("where does certainty matter?") is the capstone judgment.

## Related existing work: Jeff's repo
https://github.com/kerrlabs/ai-determinism-demo — FastAPI + SSE, providers OpenAI/Bedrock/mock,
seeded sales dataset (seed 42), Agent A (LLM computes from raw rows, temp 0.7, scatters/wrong) vs
Agent B (LLM writes SQL, SQLite executes, exact). React redesign branch reframes for non-technical
("the Guesser" vs "the Formula Writer"), six views (scatter, histogram, running average, the why,
human vs AI, scorecard), Okabe–Ito color-blind-safe palette. Real Bedrock result: A 0/10 correct
(179K–442K), B 10/10 exact. Key insight: B writes different SQL than canonical yet same exact answer.
This is the natural real-model engine for the aggregation/calculation rungs.

## Constraints
- No emojis required; non-technical copy at ~8th-grade reading level.
- Accessibility: WCAG 2.1 AA, reduced-motion, color-blind-safe, keyboard play.
- Puzzles must be REPRODUCIBLE (live-model variance must not make a puzzle unsolvable/flaky).
- No decision about pass/fail made by an LLM — checks are deterministic.
- Be concrete. No TBD/TODO. Pick and justify; list alternatives briefly.
