# Dt3rmind

A gamified, chess.com-puzzle-style course that takes non-technical adults from "ask the AI
nicely and hope" to "ask the AI for tools and checks that make the right-answer steps exact —
and prove it." See `docs/spec/SPEC.md` (v0.2) for the product spec.

The thesis, which every level drills: **determinism comes from the tools you force the AI
through, not the words you give it.** The AI stays a guesser; each step that has a right answer
becomes exact once a tool owns it. *Don't let it guess the part that has a right answer.*

This repo is the playable foundation: the level-packet schema, a pure engine, four result
renderers, three outcome simulators, the app shell (two-tier world map + level player +
settings), and the **full authored curriculum**. `content/levels/` holds **31 packets** — all
seven worlds, each world's boss, World 4's keystone, and the capstone. The three load-bearing
reference levels are called out below; everything else is authored content on the same contract.
Authors add or revise level content on top — see `docs/AUTHORING.md`.

Routes (HashRouter): `#/` world view · `#/world/:n` that world's levels · `#/level/:id` the level
player · `#/settings`. The map is derived entirely from packets + progress; `worlds.ts` adds a
`tool`/`toolKey` per world for the node glyph. Adding a world or a level needs no layout edits —
positions are computed.

## Stack

Vite + React 18 + TypeScript (strict) + Vitest. Plain CSS with Okabe–Ito color-blind-safe tokens
(dark default + light toggle). Fully client-side static app; progress is persisted in
`localStorage`. No backend is wired into the shipped SPA in this wave.

> The repo also contains a Python/FastAPI harness (`app/`) with OpenAI/Bedrock/mock providers and
> a seeded sales dataset (`data/`, seed 42). It powers the real "Agent A guesses vs Agent B writes
> SQL" determinism beat referenced in the pitch and is the natural live engine for Phase 2; it is
> not imported by the React app today.

## Commands

```bash
npm install        # install pinned dependencies

npm run build      # typecheck (tsc -b) + production build to dist/
npm run dev        # local dev server (do not run headless; it stays in the foreground)
npm run preview    # preview the production build

npm test           # run the full Vitest suite once (alias: npx vitest run)
npm run typecheck  # tsc project typecheck only (tsc -b --noEmit)
```

## What's here

```
content/levels/        level packets (JSON) — 31 packets (W1–W7 + bosses + capstone)
src/content/           schema.ts (the contract), packets loader, simulators/, worlds.ts
src/engine/            pure engine: rule resolution, stars, XP, pass oracle
src/store/             progress store (XP, ranks, stars, moves, busted tricks) + localStorage
src/ui/                result renderers + shared helpers + HTML sanitizer
src/pages/             CircuitMap (two-tier world map), LevelPlayer, Settings
                       mapState.ts (state derivation), mapGeometry.ts (layout), MapGlyphs.tsx
src/app/               AppContext (theme/skin/reduced-motion/progress)
tests/                 schema, exhaustive combination, engine, store, keystone, sanitizer,
                       and UI render/switch tests (incl. tests/review/)
docs/                  spec, curriculum, prototypes, reviews, pitch, AUTHORING.md
```

## The curriculum (verified from `content/levels/`)

Seven worlds, each with three practice levels plus a boss; World 4 adds a keystone level
(`w4-l4`); the capstone is authored as a second, higher-order boss in World 7.

| World | Theme | Moves | Rank on mastery |
|---|---|---|---|
| W1 | Shape the Answer | M1 | Shaper |
| W2 | Spot the Guess | M2, M3, M4 | — |
| W3 | Answer from the Source | M5 | Tool User |
| W4 | Name the Check *(keystone)* | M6, M4 | Checker |
| W5 | Have AI Build the Tool | M7, M2, M6 | — |
| W6 | Prove It & Fix It | M8 | Builder |
| W7 | Decide Where It Matters | M9 | Architect |

Ranks are XP-driven (`src/store/progress.ts`): Guesser → Shaper (40) → Tool User (120) →
Checker (220) → Builder (400) → Architect (650). The capstone awards **Certified Practitioner**.

**Unlock gating** (`isLevelUnlocked`): World 1 is open; within an unlocked world every level and
the boss are playable in any order (practice levels never hard-gate); **World N+1 unlocks when
World N's boss is passed.** The keystone (`w4-l4`) grants the boss XP bonus and rank-up crest but
is *not* a gate. The capstone, as a second boss in W7, unlocks only after W7's regular boss.

## The three reference levels

- **w1-l1 — "The receipt"**: the 3-minute first win; simplest packet (rule table, text-answer,
  ★★-max by design).
- **w2-l3 — "Ask for the tool, not the answer"**: the Level-2 prototype as a packet (rule table,
  numeric-scatter).
- **w4-l4 — "Ask for the check first"** (keystone): the World-4 prototype as a packet
  (simulator-backed `w4-l4-check`, item-grid; models the "false green").

Each behaves identically to its HTML prototype in `docs/prototypes/` for every move combination;
the exhaustive combination test proves it.

## Engine & simulators

The engine (`src/engine/engine.ts`) is pure (no DOM, no React): it resolves the first matching
outcome rule for the learner's picks, optionally hands off to a named simulator, then computes
stars and XP. Three simulators back the levels whose outcome logic is too intricate for a
declarative rule table: `w4-l4-check`, `w4-check`, and `w4-boss-refund` (`src/content/simulators/`).

`expectedToPass` is an **independent** pass oracle authored per packet (`expectPass`), not derived
from the rules — so a rule-table or simulator bug surfaces as a disagreement in the exhaustive
combination test.

## Testing

```bash
npm test     # 12 test files, 530 tests
```

Coverage spans the schema validator, the exhaustive combination test (every
`2^moves × 2^subChoices` assignment per packet, cross-checked against the independent oracle),
the pure engine (rule resolution, stars, XP), the progress store (XP/ranks/unlock gating),
the keystone contract, the HTML sanitizer, and jsdom UI render/switch tests. The Vitest `include`
globs now collect `tests/**/*.test.tsx`, so component tests under `tests/` are no longer silently
skipped.

Always run the suite from the repo root. Running `npx vitest` from another directory can resolve a
different cached Vitest, find no tests, and exit non-zero.

## Accessibility

WCAG 2.1 AA target: Okabe–Ito palette (color always paired with icon/shape/label), keyboard play,
reduced-motion respected (OS preference + manual toggle in Settings), live-region narration of
results.

Specifics wired in the engineering pass:

- The run result is announced via an **`aria-live="assertive"`** check bar; focus moves to the
  result on every run and to the "What you do differently" heading on a pass.
- **Reduced motion** is honored two ways — the OS `prefers-reduced-motion` media query *and* an
  in-app `body.reduce-motion` toggle both zero every `@keyframes`/`transition` and smooth scroll;
  the JS shake timer is also gated so motion-sensitive users get no shake.
- Star counts are **packet-derived**: a ★★-max level announces "of 2 stars", not "of 3".

## Security

- **All author/packet HTML is sanitized** before it reaches `dangerouslySetInnerHTML`
  (`src/ui/sanitizeHtml.ts`): a dependency-free allowlist permits only
  `b i em strong br code mark` and strips every attribute. This closes the door before SPEC §8
  wires live model / learner free-text through those surfaces in Phase 2. Covered by
  `tests/sanitizeHtml.test.ts` (includes an inert `<img onerror>` / `<script>` payload).

## Dependencies & security advisories

Runtime deps are pinned to exact versions. `react-router-dom` is pinned to **6.30.6**, which
cleared the three **high**-severity runtime advisories flagged in the engineering review
(open-redirect / protocol-relative redirect in `@remix-run/router`).

Current `npm audit` posture:

- **`npm audit --omit=dev` (runtime, shipped):** **no high or critical advisories.** Two
  **moderate** advisories remain in `react-router` (open-redirect via backslash in `<Link>`
  CVE-2025-68470 bypass, and `deserializeErrors()` constructor injection in SSR hydration).
  Both are only fixed in **react-router 7.x**, a breaking major migration, so they are
  **deliberately deferred** — this app uses `HashRouter` with static routes, no redirect logic,
  and no SSR, so neither advisory is exploitable here. Revisit with the v7 upgrade.
- **`npm audit` (all, incl. dev):** the remaining high/critical advisories are **dev-only**
  (`vitest` / `vite` / `esbuild` / `tinypool`) and never ship in the production bundle.

## Build output

`npm run build` is clean: **82 modules**, `dist/assets/index-*.js` ≈ **434 kB** (gzip ≈ 123 kB),
CSS ≈ **19 kB**. All packets are inlined via `import.meta.glob({ eager: true })`, so the whole
curriculum ships on first load; lazy-loading packets per level is a known Phase-2 optimization.
