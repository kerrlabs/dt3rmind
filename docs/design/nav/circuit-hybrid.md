# World map concept — "Circuit Hybrid"

A two-tier navigation for the Dt3rmind world map, replacing the stacked world cards in
`src/pages/WorldMap.tsx`. Mockup: `circuit-hybrid.html` (serve the folder and open it; light/dark
toggle top-right). Extends concept B (`circuit.html` / `circuit.md`) — same tokens, glowing passed
line, dashed locked line, hex bosses, shield keystone, terminal capstone — and answers its two
weaknesses: it was too sparse and only drew Worlds 1–2 with a "continue above" placeholder.

## The problem with concept B

A single serpentine of all 31 level nodes is **tall** (it needed vertical scrolling), it buried the
world structure (you couldn't see "7 worlds" at a glance), and the mockup only ever drew the first
two worlds. The product's own shape is two-level — *worlds*, each a bundle of *levels* behind a boss
gate — so the map should be two-level too.

## Concept: zoom from worlds to levels

**One board, two views, a CSS zoom between them.** The glowing data line is still the thesis — a
reasoning pipeline you climb — but you see it at two altitudes.

### 1. World view (default)

One circuit board, all seven worlds + the Workshop seam gate + the capstone terminal, as big nodes
on a single data line that **climbs bottom to top** and fits in one 1400×900 screen (no scroll). Each
world node **is its tool**: W1 form/shape, W2 calculator, W3 source/magnifier, W4 checker shield
(drawn as the keystone shield), W5 wrench, W6 fix ("the green that lied"), W7 risk dial, then the
capstone terminal. Each node shows the world name, its signature tool, progress, and the rank earned
there.

- The line **glows through completed worlds** (green→sky gradient, gentle animated flow).
- It **pulses into the current world** (W2 in the sample).
- It is **dashed and dim beyond** the current world.
- The **Workshop seam** is a visible switch/gate in the line, placed on the right-hand turn between
  W4 and W5.
- The **capstone** is the terminal at the top of the line.
- Current rank sits on the top-bar rank chip and in each world node's screen-reader label.

### 2. Level view (click/Enter a world)

Activating a world node **zooms in** (CSS `scale`+`opacity` transition; instant under
`prefers-reduced-motion`) to that world's own sub-circuit:

- The line **enters from the world below** (an "Enter from World N−1" rail tag, bottom-left).
- It runs through that world's 3–4 **numbered level nodes as parallel branches** off the entry rail —
  because an unlocked world allows any level order, every branch fans out and **all feed the boss
  gate** on the right.
- The **boss hex is the gate** the line must pass to continue; an "Boss opens World N+1" rail tag
  marks the exit upward.
- Levels show number, title, stars, and passed / current ("you are here") / locked state.
- A **breadcrumb** ("Worlds › World 2 · Spot the Guess"), a **Back to worlds** button, and
  **Prev / Next world** arrows sit above the board. **Every world's level view works**, not just W2.

Keyboard: **Enter** on a world opens it, **Escape** returns to the world view, Prev/Next arrows move
between worlds without going back out.

## Sample state in the mockup

So every state is visible: **W1 complete** (3/3 levels + boss passed, rank Shaper, stars shown),
**W2 in progress** (l1 "Why it guesses" and l2 "Highlight the guess" passed, **current = l3 "Ask for
the tool, not the answer" — you are here**, l4 and boss locked), **W3–W7 + keystone + seam + capstone
locked**. Real titles are the 31 from `content/levels/*.json` in packet order.

## How it maps to the product

| Product concept | On the Circuit Hybrid |
|---|---|
| 7 worlds × 3–4 levels (31 packets) | World view: 7 world nodes. Level view: that world's level nodes as branches |
| World theme / signature tool | The world node **is** the tool (icon + "Form / shape", "Calculator · who did the math", …) |
| Any level order inside an unlocked world | Level nodes are **parallel branches** off one entry rail, all converging on the boss gate |
| World unlock on boss clear | Boss is a **hex gate**; clearing it lights the exit segment to the next world |
| Keystone (`w4-l4`) | Shield shape on both the world node (W4) and the level node (4.4) |
| Workshop seam (after world 4) | A **gate / switch in the line** between W4 and W5 in the world view |
| Capstone (after W7 boss) | A **terminal** (rounded cap) at the top of the world view |
| Ranks (Shaper … Architect) | Rank pill on completed world nodes and the boss that earns it; announced in SR labels |
| Moves deck + rank/XP | Top bar preserved verbatim from the app (`.top`, `.badge`, XP, rank chip) |

## States legend

Colour is **never the only signal** — every state carries a shape and/or icon and a screen-reader label:

| State | Shape | Fill / border | Extra signal |
|---|---|---|---|
| Passed | rounded square | solid green border, `--ok-sub` fill | check glyph + "★" count, lit line |
| Current | rounded square | amber (`--warn`) ring | "You are here" pill, `aria-current="step"` |
| Locked | rounded square | **dashed** dim border | lock icon, "Locked" sub-label, `aria-disabled` |
| Boss | **hexagon** (larger) | purple border | "Boss gate" sub-label |
| Keystone | **shield** | sky border | "Keystone" sub-label |
| Capstone | **terminal** (rounded cap) | — | "Terminal" sub-label |

## Accessibility

- Each view's nodes are a real **ordered list** (`<ol>`) of links in reading order; the SVG line is
  decorative (`aria-hidden`). A screen reader reads a clean sequence, e.g. *"World 2, level 3, Ask for
  the tool, not the answer, current level, you are here, not yet passed."* Every node has an `sr-only`
  or `aria-label` with world, level/boss, title, state, star count, and (bosses) the rank earned.
- **Keyboard**: Enter opens a world, Escape returns, Prev/Next move between worlds. Focus is moved
  into the opened view (first actionable node) and back to the current world on return. Visible
  `:focus-visible` 3px sky outline, inherited from the app.
- **Colour-independent**: shape + icon + text label distinguish every state (table above).
- **`prefers-reduced-motion`**: the view-zoom transition and the line-flow animation are both
  disabled; the glow colour stays, nothing moves.
- **Contrast**: text uses `--text`/`--muted` on `--bg`/`--card` (the app's AA-tested Okabe–Ito
  tokens). Accent colours are used only for borders/lines, never as a background behind small text.
- Locked links carry `aria-disabled="true"`.

## Mobile behaviour (≤ 640px)

The SVG board is swapped for a **single-column vertical rail** with the same DOM semantics, so the
a11y story is identical. World view: one row per world (numbered tile, name, tool, progress,
"Open ›"), the spine coloured by progress (green passed → amber current → dim locked), with the
Workshop seam gate inline between W4 and W5 and the capstone at the bottom. Tapping a world's "Open"
switches the rail to that world's **level rail** (levels + boss, breadcrumb, Back to worlds). Boss
and keystone keep their hex/shield clip-path at tile size. Verified at 390 × 844.

## Scaling to future content

Nothing is hand-placed. **World view** positions come from a fixed serpentine of `worldCount + seam +
capstone` nodes; adding an 8th world extends the zigzag by one step. **Level view** positions are
generated per world from its level count — branches fan evenly between the entry rail and the boss,
so a 3-level world and a 4-level world differ only in branch count. A world with more levels just
adds branches; the entry→branch→boss topology is invariant.

## React implementation plan

**Components** (new, under `src/pages/` + `src/components/map/`):

- `CircuitMap.tsx` — page; holds `view` state (`'worlds' | { world: n }`), renders `WorldView` or
  `LevelView`, owns the breadcrumb + Prev/Next/Back controls and the Enter/Escape key handlers.
  Replaces `WorldMap.tsx`. Keep the existing top bar / moves deck / rank-XP components unchanged.
- `WorldView.tsx` — the 9-node climbing line (7 worlds + seam + capstone). Reads `WORLDS`
  (`src/content/worlds.ts`) for names/tools/ranks and the progress store for each world's rollup
  state (passed / current / locked) and star totals.
- `LevelView.tsx` — one world's sub-circuit; reads `PACKETS` filtered to that world
  (`src/content/packets.ts`, already sorted by order) and per-level state.
- `useWorldState(progress)` / `useLevelState(progress, world)` — pure hooks deriving node state
  **from the existing store**: reuse `isLevelUnlocked` from `src/store/progress.ts` (World 1 open;
  levels in an unlocked world any order; next world unlocks on that world's boss; capstone after W7
  boss) plus stars per level. These are the single source of "passed / current / locked".
- `CircuitLine.tsx` — renders each view's SVG: one dim backbone path + lit sub-paths for passed
  segments (walk segments while `state === 'passed'`), the tool-junction icons, the seam gate.
- `CircuitNode.tsx` — one node (shape by kind: level / boss / keystone / capstone / world; styling by
  state); is the `<a>`/`<button>`.

**Geometry**: world-view node points are a static serpentine table (x alternating between rails,
y stepping up). Level-view branch points are generated: `entry → levelPoint[i] → boss`, with
`levelPoint[i].y` spread evenly across the usable band for `i` in `0..levelCount-1`. The SVG `path`
`d` strings are built by joining cubic segments between consecutive points; lit vs dim is a
per-segment class driven by the store.

**View transition**: toggle an `.active` class; CSS does the `scale`+`opacity` zoom, gated by
`prefers-reduced-motion`. No animation library.

**Theme**: already handled — the mockup uses the app's own CSS custom properties verbatim, so it
inherits dark/light with no extra work.

### Effort estimate

~**2–2.5 days**. The two layout generators + lit-segment derivation are the only real work
(~1 day); the view switch, breadcrumb, keyboard handling and focus management are ~half a day;
wiring the progress store and preserving the top bar/moves deck is mechanical (~half a day);
mobile rail + a11y pass + screenshots, ~half a day. Slightly more than concept B's single-view
~1.5–2 days because of the second view and the zoom/focus plumbing.

## Risks

- **Focus management on view switch** must be correct for keyboard/SR users (move focus into the
  opened world, restore it to the originating node on Escape). The mockup does this; in React it is
  a `useRef` + `useEffect`, cheap but must not be skipped.
- **Lit-segment accuracy**: the "glow stops exactly at the last passed node" boundary must come from
  the store, not be approximated (the mockup hard-codes the sample). Straightforward once wired.
- **Level-view branch crowding**: a future world with 5+ levels tightens the branch fan; the band
  may need a minimum row height or a two-column branch layout. Low risk at the current 3–4.
- **Locked-world preview**: the mockup lets you open a locked world to *see* its (locked) levels. If
  product wants locked worlds non-openable, gate `openWorld` on `isWorldUnlocked`; trivial either way.
- **Deep-link / routing**: with two views, consider a route param (`/map` vs `/map/world/2`) so the
  level view is linkable and the browser back button maps to "Back to worlds". Not in the mockup;
  worth deciding before build.
