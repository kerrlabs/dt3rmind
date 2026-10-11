/**
 * Level packet schema — the contract every level is authored against.
 *
 * A packet is pure data (authored as JSON in content/levels/<world>-<level>.json)
 * plus, when a level's outcome logic is too intricate for declarative rule tables
 * (e.g. World 4's sub-choice interactions and the "false green" step-bug), an
 * optional named simulator hook referenced by id (see src/content/simulators).
 *
 * Wave-2 authors: read docs/AUTHORING.md. Every field here is used by the engine
 * (src/engine), the schema validator, and the exhaustive combination test.
 */

/** Okabe–Ito-safe category used only to tag a move chip visually. */
export type MoveKind = 'real' | 'trick';

/**
 * Skinned text. Plain = non-technical skin, tech = technical skin.
 * `tech` may be null to mean "this chip is plain-skin only" (some W4 tricks).
 * A `{criteria}` placeholder, if present, is replaced at render time with the
 * learner's selected sub-choice labels (used by W4's checker moves).
 */
export interface SkinnedText {
  plain: string;
  tech: string | null;
}

/** A chip the learner can add to the ask. Real moves teach; tricks are decoys. */
export interface Move {
  id: string;
  kind: MoveKind;
  label: string;
  text: SkinnedText;
}

/**
 * A sub-choice the learner picks after selecting a move that opens them
 * (W4: "what should the checker test?"). `real:false` sub-choices model
 * untestable criteria (e.g. "friendly tone") that pass everything.
 */
export interface SubChoice {
  id: string;
  kind: MoveKind;
  label: string;
  /** Optional prompt shown above the sub-choice chip row. */
  group?: string;
}

/**
 * Conditions over the learner's picks. All present clauses must hold for the
 * rule to match. Any clause may be omitted. IDs reference move ids and/or
 * sub-choice ids (both share one namespace at match time).
 */
export interface RuleConditions {
  /** Every id listed must be picked. */
  requireAll?: string[];
  /** At least one id listed must be picked. */
  requireAny?: string[];
  /** None of the ids listed may be picked. */
  forbidAny?: string[];
  /** At most `n` of these ids may be picked (e.g. tolerate one over-tag). */
  atMost?: { ids: string[]; n: number };
  /** At least `n` of these ids must be picked. */
  atLeast?: { ids: string[]; n: number };
}

/** The visual renderer that draws a result on the right panel. */
export type RendererType =
  | 'numeric-scatter'
  | 'item-grid'
  | 'text-answer'
  | 'table';

/** Who produced the result — the thesis-carrying label (SPEC §4, V7). */
export type Doer = 'ai-guessing' | 'tool' | 'spreadsheet' | 'checker' | 'source';

/**
 * One recorded outcome. Rules are evaluated in array order; the first whose
 * conditions match wins. Every distinct wrong combination should resolve to a
 * rule with non-empty feedback (enforced by the combination test).
 */
export interface OutcomeRule {
  id: string;
  when: RuleConditions;
  /** True only for the single intended pass rule(s). */
  isPass: boolean;
  /** The AI's claim text ("All 8 pass", "about 231,880"). */
  claim: string;
  /** Who did the work in this outcome. */
  doer: Doer;
  /** HTML-safe feedback (may contain <b>/<i>/<br>). Must be non-empty. */
  feedback: string;
  /** One-sentence takeaway. */
  lesson: string;
  /**
   * Renderer payload: recorded outputs for this outcome. Shape depends on
   * `renderer`. Kept as an opaque record; renderers type-narrow it.
   */
  output: Record<string, unknown>;
}

/** The 3-step hint ladder: nudge -> show the gap -> name the moves. */
export interface Hints {
  nudge: string;
  gap: string;
  moves: string;
}

/** "Try it in your AI" transfer card. */
export interface TryIt {
  template: SkinnedText;
  /** Per-tool notes (ChatGPT, Copilot in Excel, chat-AI-that-can't-run-code). */
  notes: string[];
}

/**
 * Star rule. ★ = pass. ★★ = pass within attemptBudget without the 3rd hint.
 * ★★★ = also includes the designated show-the-work move, OR a stated bonus
 * condition expressed as RuleConditions. If `thirdStar` is null the level
 * awards ★★ max by design (W1 L1), surfaced as "two of two".
 */
export interface StarRule {
  attemptBudget: number;
  /** Move id that earns the third star when present (usually "show"/M4). */
  showMove: string | null;
  /** Alternative/extra third-star condition over picks. */
  thirdStar: RuleConditions | null;
}

/** XP awarded on pass (SPEC §6 / gamification §3). */
export interface Xp {
  /** Base for solving the level. Default 20. */
  level: number;
  /** +15 where the level makes the learner see a check fail (P2). */
  seenFailing: number;
  /** +50 on a boss/keystone. */
  boss: number;
}

/**
 * The declarative expected-pass condition, used by the exhaustive combination
 * test as an INDEPENDENT oracle (not derived from the rules), so a rule-table
 * bug can be caught. For simulator-backed levels this still declares the
 * intended pass set and the simulator must agree.
 */
export interface ExpectPass {
  /** A pick-combination passes iff it satisfies these conditions. */
  conditions: RuleConditions;
  /**
   * Required sub-choice behavior for levels with sub-choices: the pass set is
   * further constrained to combinations where exactly these sub-choice ids are
   * on (if `exactSubChoices` is set) or where these are all on (requireAll).
   */
  exactSubChoices?: string[];
  requireSubChoicesAll?: string[];
  forbidSubChoicesAny?: string[];
}

/** The data/doc preview shown under the job text. */
export interface JobPreview {
  /** Columns for a table preview, or null for prose/doc preview. */
  columns?: string[];
  /** Rows (array of cell arrays) for a table preview. */
  rows?: string[][];
  /** Trailing note, e.g. "… 1,996 more rows". */
  more?: string;
  /** Prose/doc text when not a table. */
  text?: string;
}

/** A full level packet. */
export interface LevelPacket {
  /** Stable id, matches filename stem, e.g. "w2-l3". */
  id: string;
  world: number;
  order: number;
  title: string;
  kicker: string;
  /** Canonical competency IDs (C1–C14). */
  competencies: string[];
  /** Canonical move IDs taught (M1–M9). */
  movesTaught: string[];
  isBoss: boolean;

  job: {
    text: string;
    preview: JobPreview;
  };

  naivePrompt: string;
  /** The base ask line shown before any chips (the live-prompt seed). */
  basePrompt: string;

  moves: Move[];
  subChoices: SubChoice[];
  /** Group label for the sub-choice row (W4). */
  subChoiceGroup?: string;

  /** Evaluated in order; first match wins. Must cover every combination. */
  rules: OutcomeRule[];

  /** Which result renderer to use. */
  renderer: RendererType;

  /**
   * Optional named simulator. When set, the engine calls the registered
   * simulator to compute the outcome and grade, instead of (or in addition to)
   * the rule table. Rules are still authored for feedback/lesson lookup.
   */
  simulatorId?: string;

  attemptBudget: number;
  stars: StarRule;
  xp: Xp;
  hints: Hints;
  whatYouDoDifferently: {
    naive: string;
    rewrite: string;
  };
  tryIt: TryIt;

  /** Independent pass oracle for the combination test. */
  expectPass: ExpectPass;
}

/** The runtime "which chips are on" state the engine resolves against. */
export interface Picks {
  /** move id -> picked. */
  moves: Record<string, boolean>;
  /** sub-choice id -> picked. */
  subChoices: Record<string, boolean>;
}
