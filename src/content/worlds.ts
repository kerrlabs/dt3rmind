/** Static world/seam metadata for the map (SPEC §5 / curriculum §2). */
export interface WorldMeta {
  world: number;
  theme: string;
  moves: string;
  rank: string | null;
}

export const WORLDS: WorldMeta[] = [
  { world: 1, theme: 'Shape the Answer', moves: 'M1', rank: 'Shaper' },
  { world: 2, theme: 'Spot the Guess', moves: 'M2, M3, M4', rank: null },
  { world: 3, theme: 'Answer from the Source', moves: 'M5', rank: 'Tool User' },
  { world: 4, theme: 'Name the Check (keystone)', moves: 'M6, M4', rank: 'Checker' },
  { world: 5, theme: 'Have AI Build the Tool', moves: 'M7, M2, M6', rank: null },
  { world: 6, theme: 'Prove It & Fix It', moves: 'M8', rank: 'Builder' },
  { world: 7, theme: 'Decide Where It Matters', moves: 'M9', rank: 'Architect' },
];

export const SEAM_AFTER_WORLD = 4;
export const SEAM_TEXT =
  'The Workshop seam — “You’ve been writing the ask. Now the AI builds real tools you keep.”';
export const CAPSTONE_TEXT =
  'Capstone — an unseen cross-domain job, free-text ask. Earns Certified Practitioner.';
