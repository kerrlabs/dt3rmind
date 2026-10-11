/**
 * Layout geometry for the Circuit map, computed (never hand-placed per level).
 *
 * World view: a serpentine of (worldCount + 1 seam + 1 capstone) nodes climbing
 * bottom→top across a fixed number of rail columns; adding a world extends the
 * zigzag by one step. Positions are percentages of the board so the same points
 * drive both the absolutely-positioned DOM nodes and the SVG viewBox paths.
 *
 * Level view: entry rail (bottom-left) → level branch points fanned evenly up a
 * usable band → boss gate (right) → exit upward. A 3-level and a 4-level world
 * differ only in branch count.
 *
 * Coordinates are in viewBox units (VBW×VBH); DOM nodes convert to percentages.
 */

export const VBW = 1320;
export const VBH = 620;

export interface Pt {
  x: number;
  y: number;
}

/** A world-view slot: a world node, the seam gate, or the capstone terminal. */
export interface WorldSlot {
  kind: 'world' | 'seam' | 'capstone';
  world?: number;
  pt: Pt;
}

/**
 * Boustrophedon-grid positions for the world view. `worldCount` world nodes
 * plus a seam gate (inserted on the segment after `seamAfterWorld`) plus a
 * capstone cap. Nodes fill a grid row by row from the bottom; each row runs the
 * opposite direction to the one below (left→right, then right→left), so the
 * connecting line snakes without any diagonal long-range crossings. Rows are
 * spaced for the two-line labels above/below each node, so nothing collides.
 */
export function worldLayout(worldCount: number, seamAfterWorld: number): {
  slots: WorldSlot[];
  /** Ordered path points (includes seam + capstone) for drawing the backbone. */
  points: Pt[];
} {
  // Ordered slot kinds bottom→top: W1..Wk, seam (after seamAfterWorld), capstone.
  const order: WorldSlot[] = [];
  for (let w = 1; w <= worldCount; w++) {
    order.push({ kind: 'world', world: w, pt: { x: 0, y: 0 } });
    if (w === seamAfterWorld) order.push({ kind: 'seam', pt: { x: 0, y: 0 } });
  }
  order.push({ kind: 'capstone', pt: { x: 0, y: 0 } });
  const n = order.length;

  // Grid: at most `cols` per row; enough rows to hold every node. Three columns
  // keeps 9 nodes (7 worlds + seam + capstone) to 3 roomy rows.
  const cols: number = 3;
  const rows = Math.max(Math.ceil(n / cols), 1);

  // Column x anchors and row y anchors, with margins for labels.
  const xLeft = 210;
  const xRight = VBW - 210; // 1110
  const colXs = Array.from({ length: cols }, (_, c) =>
    cols === 1 ? (xLeft + xRight) / 2 : xLeft + ((xRight - xLeft) * c) / (cols - 1),
  );
  const yBottom = VBH - 128; // 492 — leave room for the rank pill below a node
  const yTop = 104;
  const rowYs = Array.from({ length: rows }, (_, r) =>
    rows === 1 ? (yBottom + yTop) / 2 : yBottom - ((yBottom - yTop) * r) / (rows - 1),
  );

  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const posInRow = i % cols;
    // Even rows run left→right; odd rows right→left (boustrophedon).
    const col = row % 2 === 0 ? posInRow : cols - 1 - posInRow;
    order[i]!.pt = { x: colXs[col]!, y: rowYs[row]! };
  }

  return { slots: order, points: order.map((s) => s.pt) };
}

/** Convert a viewBox point to CSS left/top percentages. */
export function toPct(pt: Pt): { left: string; top: string } {
  return { left: `${(pt.x / VBW) * 100}%`, top: `${(pt.y / VBH) * 100}%` };
}

/**
 * Build an SVG cubic path `d` string through the given points, smoothing each
 * joint. Used for both the dim backbone and the lit sub-path.
 */
export function pathThrough(points: Pt[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    // Vertical-biased control points so the climb reads as a pipeline.
    const c1 = { x: a.x, y: (a.y + b.y) / 2 };
    const c2 = { x: b.x, y: (a.y + b.y) / 2 };
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
  }
  return d;
}

/** Level-view fixed anchors. */
export interface LevelLayout {
  entry: Pt;
  boss: Pt;
  exit: Pt;
  /** One branch point per level, fanned up the usable band. */
  branches: Pt[];
}

/**
 * Generate level-view geometry for `levelCount` levels. The entry sits bottom
 * centre-left; branches fan evenly up a vertical band and all converge on the
 * boss on the right; the exit leaves the boss upward.
 */
export function levelLayout(levelCount: number): LevelLayout {
  const entry: Pt = { x: 180, y: 540 };
  const boss: Pt = { x: 1140, y: 300 };
  const exit: Pt = { x: 1140, y: 70 };

  const bandTop = 120;
  const bandBottom = 520;
  const colX = 560; // branch column, left of the boss so lines converge rightward

  const branches: Pt[] = [];
  const n = Math.max(levelCount, 1);
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? (bandTop + bandBottom) / 2 : bandTop + (bandBottom - bandTop) * (i / (n - 1));
    // Slight x stagger so branch nodes don't stack on one vertical line.
    const x = colX + (i % 2 === 0 ? 0 : 110);
    branches.push({ x, y });
  }
  return { entry, boss, exit, branches };
}

/** Build the entry→branch and branch→boss segment path for one level. */
export function branchPaths(layout: LevelLayout, i: number): { into: string; out: string } {
  const p = layout.branches[i]!;
  const { entry, boss } = layout;
  const into = `M ${entry.x} ${entry.y} C ${entry.x + 170} ${entry.y} ${p.x - 150} ${p.y} ${p.x} ${p.y}`;
  const out = `M ${p.x} ${p.y} C ${p.x + 170} ${p.y} ${boss.x - 180} ${boss.y} ${boss.x} ${boss.y}`;
  return { into, out };
}

/** The boss→exit (upward) path. */
export function exitPath(layout: LevelLayout): string {
  const { boss, exit } = layout;
  return `M ${boss.x} ${boss.y} C ${boss.x} ${boss.y - 110} ${exit.x} ${exit.y + 110} ${exit.x} ${exit.y}`;
}
