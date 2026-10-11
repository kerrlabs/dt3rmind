# Puzzle Ladder

A gamified, chess.com-puzzle-style course that takes non-technical adults from "ask the AI
nicely and hope" to "ask the AI for tools and checks that make the right-answer steps exact —
and prove it." See `docs/spec/SPEC.md` (v0.2) for the product spec.

This repo is the **wave-1 foundation**: the level-packet schema, a pure engine, four result
renderers, the app shell (world map + level player + settings), plus the full set of authored
level packets. `content/levels/` holds **31 packets** — all seven worlds, their bosses, and the
capstone (the capstone's live free-text/grading engine is Phase 2). The three load-bearing
reference levels are called out below; the rest are wave-2 content on the same contract.
Wave-2 authors add level content on top — see `docs/AUTHORING.md`.

## Stack

Vite + React + TypeScript (strict) + Vitest. Plain CSS with Okabe–Ito color-blind-safe tokens
(dark default + light toggle). Fully client-side static app; progress is persisted in
`localStorage`. No backend in this wave.

## Commands

```bash
npm install        # install pinned dependencies

npm run build      # typecheck (tsc --strict) + production build to dist/
npm run dev        # local dev server (do not run headless; it stays in the foreground)
npm run preview    # preview the production build

npx vitest run     # run the full test suite once (schema + combinations + engine + store)
npm run typecheck  # tsc project typecheck only
```

## What's here

```
content/levels/        level packets (JSON) — 31 packets (W1–W7 + bosses + capstone)
src/content/           schema.ts (the contract), packets loader, simulators/, worlds.ts
src/engine/            pure engine: rule resolution, stars, XP, pass oracle
src/store/             progress store (XP, stars, ranks, move deck) + localStorage
src/ui/                result renderers + shared helpers
src/pages/             WorldMap, LevelPlayer, Settings
src/app/               AppContext (theme/skin/reduced-motion/progress)
tests/                 schema, exhaustive combination, engine, and store tests
docs/                  spec, curriculum, prototypes, AUTHORING.md
```

## The three reference levels

- **w1-l1 — "The receipt"**: the 3-minute first win; simplest packet (rule table, text-answer).
- **w2-l3 — "Ask for the tool, not the answer"**: Level 2 prototype as a packet (rule table,
  numeric-scatter).
- **w4-l4 — "Ask for the check first"** (keystone/boss): World 4 prototype as a packet
  (simulator-backed, item-grid; models the "false green").

Each behaves identically to its HTML prototype in `docs/prototypes/` for every move
combination; the combination test proves it.

## Accessibility

WCAG 2.1 AA target: Okabe–Ito palette (color always paired with icon/shape/label), keyboard
play, reduced-motion respected (OS preference + manual toggle in Settings), live-region
narration of results.

Specifics wired in the engineering pass:

- The run result is announced via an **`aria-live="assertive"`** check bar; focus moves to the
  result on every run and to the "What you do differently" heading on a pass.
- **Reduced motion** is honored two ways — the OS `prefers-reduced-motion` media query *and* an
  in-app `body.reduce-motion` toggle both zero every `@keyframes`/`transition` and smooth
  scroll; the JS shake timer is also gated so motion-sensitive users get no shake.
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
  **deliberately deferred** — this app uses `HashRouter` with three static routes, no redirect
  logic, and no SSR, so neither advisory is exploitable here. Revisit with the v7 upgrade.
- **`npm audit` (all, incl. dev):** the remaining **1 high + 2 critical** are **dev-only**
  (`vitest` / `vite` / `esbuild` / `tinypool`) and never ship in the production bundle.
