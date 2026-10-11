# Concept A — "The Board"

A faithful take on the chess.com Puzzle-Path reference: a vertical zig-zag of
numbered diamond tiles on pedestals climbing from level 1 (bottom) to the capstone
(top), set on a warm dark-wood board with gold/tan tones. Each world's stretch of
the path is decorated with SVG props for its idea and chess pieces; bosses are
larger tiles carrying a piece; the capstone is a medallion. It reads like a physical
board game you progress up.

File: `docs/design/nav/board.html` (self-contained — inline SVG + CSS, no network).

## How it maps to the product
- **31 real packets, in order.** 7 worlds × 3–4 levels + 7 bosses + capstone, titles
  pulled verbatim from `content/levels/*.json`. Numbered 1–23 for the levels; bosses
  are `BOSS` tiles; the capstone is the medallion.
- **Worlds** get a header tab and a signature prop drawn as SVG along their stretch:
  W1 form/shape, W2 calculator, W3 magnifier, W4 checker shield (keystone), W5 wrench,
  W6 bug/fix, W7 risk dial.
- **Workshop seam** is a full-width dashed-gold band with a drawn gate, placed after
  world 4 — exactly where `SEAM_AFTER_WORLD = 4` puts it — carrying `SEAM_TEXT`.
- **Bosses** are larger diamonds carrying a chess piece and a `Boss` tag; the next
  world unlocks when its boss falls (mirrors `isLevelUnlocked`).
- **Keystone** (w4-l4, "Ask for the check first") gets its own amber "Keystone" tag.
- **Ranks → pieces.** The sample state shows rank Tool User, so the player's piece is
  a **bishop**, shown in the HUD and standing (as the "You" marker) on the current
  tile. Full ladder: Guesser → pawn, Shaper → knight, Tool User → bishop,
  Checker → rook, Builder → queen, Architect → king. Boss tiles name the world's
  piece in their label.
- **Moves deck + rank/XP** stay in the top HUD (`Rank`, `XP`, `Moves unlocked`).

Sample progress (so every state is visible): W1 L1 passed 3★, L2 passed 2★, **L3
current (you are here)**, W1 boss and everything after locked.

## States legend
| State | Color (Okabe–Ito, a11y-safe) | Non-color signal |
|---|---|---|
| Passed | green `#009e73` tile + border | check badge + 0–3 gold stars |
| Current | blue `#0072b2` tile + glow | "You are here" tag + player piece on the tile |
| Locked | muted slate border | padlock badge, `not-allowed` cursor |
| Boss | purple `#cc79a7` badge | larger diamond + chess piece + "Boss" tag |
| Keystone | amber `#e69f00` tag | "Keystone" tag |
| Seam / capstone | dashed gold | gate / medallion shape |

Warm wood/gold tones are decoration only; every status is carried by an
Okabe–Ito color **and** an icon/shape/label, never color alone.

## Accessibility
- The path is a single `<ol>` of `<a>` tiles in **play order** (level 1 → capstone),
  so a screen reader reads e.g. "World 2, level 3, Ask for the tool, not the answer.
  Locked." Each tile's `aria-label` includes world, level, title, state and star
  count; the current tile uses `aria-current="step"`.
- Stars and badges are `aria-hidden` with an `.sr-only` "N of 3 stars" text equivalent.
- Keyboard focus is a visible 4px sky-blue ring on each tile.
- `prefers-reduced-motion` disables the bobbing player piece and tile-hover transition.
- Text meets WCAG AA on its surface (cream/tan on dark wood ≥ 4.5:1).

## Mobile behavior
Below 640px the path collapses to a **single centered column**: tiles stack vertically,
each label card drops beneath its tile, the connector rail and pedestals are hidden
(they bled over stacked labels), and the scattered props are dropped. Verified clean at
390×844. The HUD chips wrap. Nothing is lost — only the horizontal zig-zag flattens.

## Implementation plan (React)
Replaces `src/pages/WorldMap.tsx`. Components:
- `BoardPath` — maps `PACKETS` (already world/order-sorted) to steps; interleaves a
  `WorldHeader` on each world change, a `SeamBand` after world `SEAM_AFTER_WORLD`, and a
  `Capstone` at the end.
- `LevelTile` — props `{ packet, state, stars, piece }`; `state` from `progress.ts`
  (`isLevelUnlocked` → locked/unlocked, `getStars` → passed, current = first unlocked
  unpassed). Boss/keystone from `packet.kind`/`order`.
- `PlayerPiece` / `WorldProp` — SVG lookup keyed by rank and by world theme.

**Generating the winding path:** position is derived from packet index, not stored.
`lean = ['l','r','l','c'][i % 4]` (boss forced to `c`) gives the zig-zag; the rail/fill
is pure CSS. No coordinates to hand-author — add a JSON packet and it slots in.

**Scaling to future content:** because layout is index-driven and the DOM is a flat
ordered list, more levels or worlds just add rows — no re-layout. A world with 3 vs 4
levels differs only in row count. The seam position reads from `SEAM_AFTER_WORLD`.

**Effort:** ~1.5–2 days (tile + path + state wiring + the SVG piece/prop set + a11y pass).

## Risks
- **SVG chess pieces/props are the time sink** — six pieces + seven world props drawn
  by hand. Mitigation: a small shared set, reused; keep them simple silhouettes.
- **Long titles** (e.g. "Build it and prove it: average order value by weekday") need a
  2-line clamp in the label card; already wrapping in the mockup.
- **Vertical length** — 31 tiles is a tall scroll; consider collapsing cleared worlds to
  a summary band, or a "jump to current" control, once content grows past ~7 worlds.
- The warm wood palette diverges from the app's cool Okabe–Ito surfaces; it needs a
  board-scoped theme so it doesn't fight the rest of the UI.
