/** Static world/seam metadata for the map (SPEC §5 / curriculum §2). */

/** Signature-tool icon key per world, drawn by CircuitNode. */
export type ToolKey =
  | 'form'
  | 'calculator'
  | 'magnifier'
  | 'shield'
  | 'wrench'
  | 'fix'
  | 'dial';

export interface WorldMeta {
  world: number;
  theme: string;
  /** Short tool caption shown under the world node, e.g. "Calculator · who did the math". */
  tool: string;
  /** Icon key for the world node glyph. */
  toolKey: ToolKey;
  moves: string;
  rank: string | null;
}

export const WORLDS: WorldMeta[] = [
  { world: 1, theme: 'Shape the Answer', tool: 'Form · shape', toolKey: 'form', moves: 'M1', rank: 'Shaper' },
  { world: 2, theme: 'Spot the Guess', tool: 'Calculator · who did the math', toolKey: 'calculator', moves: 'M2, M3, M4', rank: null },
  { world: 3, theme: 'Answer from the Source', tool: 'Source · magnifier', toolKey: 'magnifier', moves: 'M5', rank: 'Tool User' },
  { world: 4, theme: 'Name the Check', tool: 'Keystone · checker shield', toolKey: 'shield', moves: 'M6, M4', rank: 'Checker' },
  { world: 5, theme: 'Have AI Build the Tool', tool: 'Wrench · build', toolKey: 'wrench', moves: 'M7, M2, M6', rank: null },
  { world: 6, theme: 'Prove It & Fix It', tool: 'Fix · the green that lied', toolKey: 'fix', moves: 'M8', rank: 'Builder' },
  { world: 7, theme: 'Decide Where It Matters', tool: 'Risk dial', toolKey: 'dial', moves: 'M9', rank: 'Architect' },
];

export const SEAM_AFTER_WORLD = 4;
export const SEAM_TEXT =
  'The Workshop seam — “You’ve been writing the ask. Now the AI builds real tools you keep.”';
/** Short seam caption for the gate chip drawn on the line. */
export const SEAM_SHORT = 'Workshop seam';
export const SEAM_SUB = 'Past this gate the AI builds tools you keep.';
export const CAPSTONE_TEXT =
  'Capstone — an unseen cross-domain job, free-text ask. Earns Certified Practitioner.';
export const CAPSTONE_TITLE = 'The volunteer-shift scheduler';
export const CAPSTONE_RANK = 'Certified Practitioner';
