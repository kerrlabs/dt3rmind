# World map concept B — "The Circuit"

A navigation concept for the Dt3rmind world map, replacing the stacked world cards in
`src/pages/WorldMap.tsx`. Mockup: `circuit.html` (open in a browser; light/dark toggle top-right).

## Concept

The reference (chess.com Puzzle Path) gives us the shape: a winding, numbered path you climb,
chunky tiles, themed props. Concept B keeps that structure but makes **the path itself the
product's argument**. Instead of a decorative road, the winding line is a **glowing data line** —
the same "board pipeline" idea the game teaches — flowing *up* from level 1 at the bottom to the
capstone terminal at the top.

Each world is a **zone the line passes through**, and that world's signature tool sits **on the
line as a junction** the flow detours through (W2's calculator — "who did the math" — is a chip
clamped onto the wire). You are literally watching your reasoning pipeline get built, segment by
segment, as you clear levels.

- **Passed segments glow** (green→sky gradient, a gentle animated flow of dashes).
- **Locked segments are dashed and dim** (the backbone is drawn once, dim; lit segments overlay it).
- The flow animation is **off under `prefers-reduced-motion`** (the glow colour stays; only motion stops).

## How it maps to the product

| Product concept | On the Circuit |
|---|---|
| 7 worlds × 3–4 levels (31 packets) | Level nodes strung along the line in packet order (`world`, then `order`) |
| World theme / signature tool | A **tool junction chip** on the line at each world's entry (form/shape, calculator, source/magnifier, checker shield, wrench, fix, risk dial) |
| World unlock on boss clear | Boss node is a **larger hexagonal junction**; clearing it lights the segment into the next world |
| Keystone (w4-l4) | A **shield node** on the line |
| Workshop seam (after world 4) | A **gate / switch in the line** — the flow passes through a labelled gate before World 5 |
| Capstone (after W7 boss) | A **terminal** (rounded cap) at the very top of the line |
| Ranks (Shaper … Architect) | Earned at bosses; shown on the top bar rank chip and announced in the boss node's screen-reader label |
| Moves deck + rank/XP | Top bar is preserved verbatim from the app (`.top`, `.badge`, XP, rank chip) |

Sample progress state in the mockup (so every state is visible): World 1 fully passed with stars,
World 2 half done (l1 passed, **l2 current — "you are here"**, l3/l4/boss locked), Worlds 3–7 +
keystone + capstone locked.

## States legend

Colour is **never the only signal** — every state carries a shape and/or icon and a screen-reader label:

| State | Shape | Fill / border | Extra signal |
|---|---|---|---|
| Passed | rounded square | solid green border, `--ok-sub` fill | check glyph + "★" count, lit line |
| Current | rounded square | amber (`--warn`) ring | "You are here" pill, `aria-current="step"` |
| Locked | rounded square | **dashed** dim border | lock icon, "Locked" sub-label, `aria-disabled` |
| Boss | **hexagon** (larger) | purple border | "Boss" sub-label |
| Keystone | **shield** | — | "Keystone" sub-label |
| Capstone | **terminal** (rounded cap) | — | "Terminal" sub-label |

## Accessibility

- The path is a real **ordered list** (`<ol>`) of links in DOM/reading order. The SVG line is
  decorative (`aria-hidden`), so a screen reader reads a clean sequence: *"World 2, Level 2,
  Highlight the guess, current level, you are here, not yet passed."* Each node has an `sr-only`
  label with world, level, title, state and star count.
- **Keyboard focus** is visible (`:focus-visible` 3px sky outline, inherited from the app).
- **Colour-independent**: shape + icon + text label distinguish every state (see table above).
- **`prefers-reduced-motion`**: the flow animation is disabled; nothing moves.
- **Contrast**: text uses `--text`/`--muted` on `--bg`/`--card` (the app's AA-tested Okabe–Ito
  tokens). Accent colours are used only for borders/lines, never as a background behind small text.
- Locked links carry `aria-disabled="true"`.

## Mobile behaviour (≤ 640px)

The winding SVG does not shrink to a phone gracefully, so at ≤ 640px the board is swapped for a
**single-column vertical rail**: the same ordered list, a vertical spine coloured by progress
(green passed → amber current → dim locked), numbered tiles on the left, title + state on the
right, with world headers and tool-junction labels inline. Boss/keystone keep their hex/shield
clip-path at tile size. This is the exact same DOM semantics as desktop — only the visual
treatment switches via media query, so the a11y story is identical. Verified at 390 × 844.

## Scaling to future content

The line is generated, not hand-drawn. Positions come from the packet list:

- **Desktop**: a serpentine layout — alternate node `x` between a left rail (~15%) and a right rail
  (~85%), stepping `y` down by a fixed row height per node. Adding levels/worlds just appends nodes
  and grows the board height; the SVG `viewBox` height is `nodeCount × rowHeight`. Tool junctions
  and the seam are inserted at world boundaries. No layout gets hand-tuned per world.
- **Mobile**: the rail is a flat list — unbounded by construction.
- A world with 3 vs 4 levels differs only in node count; nothing is positional-magic.

## React implementation plan

**Components** (new, under `src/pages/` + `src/components/map/`):

- `CircuitMap.tsx` — top-level page, reads `PACKETS` (already sorted by world/order in
  `packets.ts`) and `progress` store (`isLevelUnlocked`, stars per level), replaces `WorldMap.tsx`.
- `useCircuitLayout(packets)` — pure hook returning `{ nodes: {id, x, y, kind, state}, segments,
  junctions, seamAt }`. `kind` from packet id (`*-boss`, `w4-l4` → keystone, `capstone`);
  `state` from the progress store. This is the single place the winding geometry is computed.
- `CircuitLine.tsx` — renders the SVG: one dim backbone path + lit sub-paths for passed segments
  (built by walking segments while `state === 'passed'`), tool-junction chips, the seam gate.
- `CircuitNode.tsx` — one node (shape by `kind`, styling by `state`), is the `<a>`/`<button>`.
- Reuse the existing top bar, moves deck, rank/XP components unchanged.

**Generating the path**: map each node index `i` → `x = i % 2 ? RIGHT : LEFT`, `y = TOP + i *
ROW`. The SVG `path` `d` is produced by joining cubic segments between consecutive node points
(control points pushed horizontally to get the smooth S-curve). Lit vs dim is a per-segment class.

**Theme**: already handled — the mockup uses the app's own CSS custom properties verbatim, so it
inherits dark/light with zero extra work.

**Estimated effort**: ~1.5–2 days. The layout hook and SVG path builder are the only real work
(~half a day); nodes/junctions/seam are straightforward; wiring the progress store and preserving
the top bar/moves deck is mechanical.

## Risks

- **Tall board / scrolling**: 31 nodes make a long vertical board on desktop; needs a sensible
  scroll + a "jump to current" affordance (scroll the current node into view on mount). Minor.
- **SVG path tuning**: the cubic control-point offsets need one pass of eyeballing to avoid the
  curve overshooting at the turns; cheap but not zero.
- **Lit-segment accuracy**: the "glow stops exactly at the last passed node" boundary must be
  derived from the progress store, not approximated (the mockup approximates it for a static
  sample). Straightforward once wired to real state.
- **Reduced-data worlds**: if a future world has 1–2 levels, the serpentine still works but the
  turns get tight; the row height may need a floor. Low risk.
