# Puzzle Ladder

A gamified, chess.com-puzzle-style course that takes non-technical adults from "ask the AI
nicely and hope" to "ask the AI for tools and checks that make the right-answer steps exact —
and prove it." See `docs/spec/SPEC.md` (v0.2) for the product spec.

This repo is the **wave-1 foundation**: the level-packet schema, a pure engine, four result
renderers, the app shell (world map + level player + settings), and three reference levels.
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
content/levels/        level packets (JSON) — w1-l1, w2-l3, w4-l4
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
