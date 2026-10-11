# The Climb — world-map navigation concept (C)

A chess-progression take on the Puzzle-Path idea. The learner is a chess piece
climbing an isometric board from the **bottom-left square to the far top-right
corner**. Each world is a **band** of the board; clearing that band's boss lands
you on a **promotion square** where your piece is literally promoted to the next
rank. The hook is the chess promotion metaphor: *levelling up promotes your
piece.* The board is drawn flat and two-tone (theme tokens, no wood texture) so
it stays legible at small sizes.

## How it maps to the product

| Product concept | In The Climb |
| --- | --- |
| 7 worlds | 7 diagonal **bands** of the board, climbing BL → TR |
| 31 level packets | 31 numbered tiles on a single snaking path (bands snake L→R / R→L) |
| World boss | the **promotion guard** at the top of each band (purple tile) |
| Rank earned on boss clear | a **promotion square** milestone: Guesser → Shaper → Tool User → Checker → Builder → Architect, each shown as your piece being promoted (pawn → knight → bishop → rook → queen → king) |
| Keystone (w4-l4) | amber "keystone" tile, labelled, inside World 4's band |
| Workshop seam (after W4) | a dashed **rank-line river** cutting across the board between the W4 and W5 bands, with the seam text along it |
| Capstone | the **far-corner square** (step 31), gold, with the king glyph — "Certified Practitioner" |
| Rank / XP / moves | kept in the top bar (rank chip with current piece glyph, XP meter, moves range) |

Unlock logic is unchanged and is expressed purely as tile state (below); the map
never needs its own rules engine — it reads `isLevelUnlocked` from the store.

## Tile states (shape + icon + label, never colour alone)

- **passed** — green index chip + filled/empty **stars** (`★★☆`); star cap per
  level honoured (some levels are 2-star max via `thirdStar: null`).
- **current** — sky ring + an explicit **"You are here"** flag above the tile;
  `aria-current="step"`.
- **unlocked / ready** — neutral tile, "Ready".
- **locked** — dimmed, padlock icon in the legend, "Locked", `aria-disabled`.
- **boss** — wider purple tile, "Boss" badge, guards the promotion square.
- **keystone** — amber border, star badge, "Keystone".
- **capstone** — gold, king badge, "Capstone · king".

## Accessibility

- The path is a real `<ol>` of `<button>`s in **packet order**, so a screen
  reader reads "World 2, Spot the Guess, step 3. Ask for the tool, not the
  answer. You are here, in progress." The isometric board is decoration
  (`aria-hidden` SVG with one descriptive `aria-label`).
- Visible keyboard focus ring on every tile; tab order follows DOM = play order.
- State is carried by **icon + shape + text**, never colour alone; locked tiles
  also carry `aria-disabled`.
- `prefers-reduced-motion` removes hover lift/transition.
- Text meets WCAG AA against the token backgrounds (Okabe–Ito dark + light);
  the only accent-on-white uses are bars/borders/coloured text, not text on a
  saturated fill.
- Theme toggle flips `body.light` and reports state via `aria-pressed`.

## Mobile (≤ 720px)

The isometric board is hidden and the **same ordered data** renders as a
single-column vertical ladder with a connecting rail, grouped by world band
("World 3 · Answer from the source · promotes to Tool User") with the Workshop
seam as an inline call-out after the World 4 boss. Nothing is lost — identical
tiles, states, stars and badges, just stacked. Verified at 390 × 844.

## React implementation plan

**Components**
- `ClimbMap` — top-level; reads `PACKETS` (packets.ts) + `progress` store, derives
  each tile's state from `isLevelUnlocked` / stars, renders board + overlays or
  the mobile ladder behind a `matchMedia('(max-width: 720px)')` hook.
- `BoardSvg` — memoised SVG squares + path connector + seam line + decorative
  piece glyphs. Pure function of band/column counts.
- `LevelTile` — one `<button>`, props `{ packet, index, state, stars, kind }`.
- `PromotionMarker`, `SeamMarker`, `YouAreHere` — absolutely-positioned overlays.
- `MobileLadder` — the stacked `<ol>`.

**Generating the winding path from packet order (no hand-placed coordinates)**
1. `PACKETS` already sort by `(world, order)`.
2. Group by world → that's the band index `bi`.
3. Within a band of `n` tiles, spread evenly across `COLS` columns; **snake**
   odd bands right-to-left so the path is continuous.
4. `iso(band, col)` maps to a viewBox point: `x = originX + col·colStep +
   band·drift`, `y = originY − band·bandStep − col·skew`. The band drift is what
   makes the whole climb travel bottom-left → top-right.
5. Promotion squares sit at each band's last tile where `WORLDS[bi].rank` is set;
   the seam line is drawn between the `SEAM_AFTER_WORLD` and next band.

Because positions are **computed from order**, adding levels or worlds needs no
layout edits — see scaling.

**Scaling to future content**
- More levels in a world → the band just spreads more tiles across the same
  columns (or wraps to a second row within the band if `n > COLS`).
- More worlds → more bands; bump `COLS`/`bandStep` or let the board scroll
  vertically (it already does on mobile). No per-tile coordinates to maintain.

**Estimated effort:** ~1.5–2 days. Half a day for `iso`/layout + `BoardSvg`,
half for tile/overlay components and store wiring, half for the mobile ladder +
a11y pass + snapshot/axe tests.

## Risks / open questions

- **Isometric label legibility.** Dense worlds (W2, W4 have 5 tiles) crowd a
  band; the current layout spreads 5 across 6 columns, which is fine, but a
  future 6+-tile world needs the in-band wrap rule implemented, not just
  designed.
- **Decorative piece glyphs** are simple hand-drawn SVG silhouettes, not the
  real brand/art pieces — fine for a concept, needs art direction for ship.
- **Promotion markers can overlap** a neighbouring band's diamond at tight
  `bandStep` values; the shipped component should collision-nudge markers rather
  than rely on a fixed gap.
- **Vertical length.** Seven bands make a tall page on desktop; consider a
  "snap to current band" scroll on load so the learner lands on their position
  rather than the capstone.
- **SVG board vs. HTML tiles are two coordinate systems** kept in sync by a
  shared `iso()` + percentage mapping. A single source-of-truth layout function
  (exported, unit-tested) is essential so they can't drift.
