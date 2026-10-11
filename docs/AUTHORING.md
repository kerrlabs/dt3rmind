# Authoring a level packet

This is the wave-2 contract. A level is a JSON file in `content/levels/<world>-<level>.json`
(e.g. `content/levels/w3-l1.json`). The filename stem **must** equal the packet `id`.
Drop a file in and it loads automatically — no code edits, no registry.

You need two things to author a level: this guide and the curriculum
(`docs/spec/section-curriculum.md`), which gives you the scenario, planted violations,
exact feedback and hints per level. This guide tells you how to encode that into the schema.

The schema is the executable source of truth: `src/content/schema.ts`. If this doc and the
schema ever disagree, the schema wins — but keep them in sync.

---

## The loop you are authoring for

Every level runs the same shape (SPEC §4):

1. **Just ask** — the learner runs the naive prompt; it visibly fails (phase 1).
2. **Rewrite the ask** — the learner toggles move chips (and sub-choices); the full prompt
   renders live (phase 2).
3. **Run** — the outcome is a deterministic function of the chosen chips.
4. **Resolve** — the engine finds the first matching outcome rule (or calls a simulator).
5. **Feedback** — the matched rule's feedback + lesson render; stars + XP on pass.
6. **Compare + Try it in your AI** — shown on pass.

Your job is to encode: the job, the chips, every distinct consequence, the pass condition,
hints, stars, and the transfer template.

---

## Every field

### Identity
| Field | Type | Notes |
|---|---|---|
| `id` | string | Must equal the filename stem (`w2-l3`). |
| `world` | number | 1–7. |
| `order` | number | Position within the world (used for unlock gating + sort). |
| `title` | string | Level title. |
| `kicker` | string | Small eyebrow, e.g. `"World 2 · Spot the Guess · Level 3"`. |
| `competencies` | string[] | Canonical IDs C1–C14. |
| `movesTaught` | string[] | Canonical IDs M1–M9. |
| `isBoss` | boolean | Bosses add the `+boss` XP bonus and show the rank-up crest. |

### The job
```json
"job": {
  "text": "The scenario the learner reads (HTML-safe: <b>, <i>, <br> allowed).",
  "preview": {
    "columns": ["order_id", "date", "..."],   // table preview, OR
    "rows": [["10001", "2025-07-03", "..."]],
    "more": "… 1,996 more rows",
    "text": "prose/doc preview when not a table"
  }
}
```
Use `columns`+`rows` for a data table, or `text` for a prose/doc preview. `more` is the
right-aligned note in the panel header.

- `naivePrompt` — the obvious prompt shown in the compare panel's "just prompting" column.
- `basePrompt` — the ask line the live prompt starts from before any chips (usually equal to
  `naivePrompt`).

### Moves (the chips)
```json
"moves": [
  {
    "id": "tool",
    "kind": "real",                 // "real" (teaches) or "trick" (decoy)
    "label": "Ask for a formula, not the number",
    "text": {
      "plain": "Don't calculate it yourself. Write a formula that …",
      "tech":  "Don't calculate it yourself. Write a pandas script that …"
    }
  }
]
```
- `kind: "real"` chips are collected into the learner's deck on pass; `kind: "trick"` chips
  are shown crossed out ("Busted: …").
- `text.tech` may be `null` for a plain-only chip (some W4 tricks). The player falls back to
  `plain`.
- If the move's text contains `{criteria}`, it is replaced at render time with the learner's
  selected sub-choice labels (see W4's `check` move).

### Sub-choices (optional)
Only levels that open a second decision use these (W4: "what should the checker test?").
```json
"subChoiceGroup": "What should the checker test? (it fails any draft that misses one)",
"subChoices": [
  { "id": "greet", "kind": "real", "label": "a greeting" },
  { "id": "friendly", "kind": "trick", "label": "a friendly tone" }  // vacuous criterion
]
```
Sub-choices render only when the move that opens them is picked. Currently the player opens
the sub-choice row when the move with id `check` is on; if you need a different opener, say so
and we will generalize it (it is a one-line change).

### Outcome rules — the heart
Rules are evaluated **in array order; the first whose conditions match wins.** The final rule
**must** be an unconditional catch-all (`"when": {}`) so the table is total.

```json
"rules": [
  {
    "id": "pass",
    "when": { "requireAll": ["tool", "run"] },   // conditions over move/sub ids
    "isPass": true,
    "claim": "Result from running it: 227,421.36",   // what the AI tells the learner
    "doer": "spreadsheet",                            // who did the work (thesis label)
    "feedback": "<b>Same exact answer, 5/5.</b> …",   // HTML-safe, MUST be non-empty
    "lesson": "The tool does the math; the AI only writes it.",
    "output": { /* renderer payload — see renderers */ }
  },
  { "id": "naive", "when": {}, "isPass": false, "...": "catch-all" }
]
```

**Conditions** (`RuleConditions`) — any combination, all present clauses must hold:
- `requireAll: [...]` — every id must be picked.
- `requireAny: [...]` — at least one must be picked.
- `forbidAny: [...]` — none may be picked.

Move ids and sub-choice ids share one namespace at match time, so `requireAll: ["check","greet"]`
means the `check` move AND the `greet` sub-choice.

**`doer`** is one of `ai-guessing | tool | spreadsheet | checker | source`. It drives the
"Who did the math/work" label that carries the thesis — set it honestly (only the pass class
should usually flip away from `ai-guessing`).

**Exactly one rule** must have `isPass: true`.

### Renderer + its output payload
`"renderer"` is one of:

| Renderer | For | `output` shape (per rule) |
|---|---|---|
| `numeric-scatter` | runs vs. truth line (Level 2) | `{ truth: number, values: number[], formulas?: {plain:[],tech:[]}, showNote?: string }` |
| `item-grid` | items marked per rule with a checker verdict (World 4) | simulator-produced; the catch-all rule carries fixtures `{customers, baseDrafts, remindedDrafts}` |
| `text-answer` | a single answer card | `{ fields?: [{key,value,numeric?}], answer?: string, highlights?: string[], source: string }` |
| `table` | rows with per-row pass/fail | `{ columns: string[], rows: [{cells:string[], pass:boolean}], source?: string }` |

Every renderer prints the `doer` label. For `numeric-scatter`, a value counts as "correct"
when it is within 0.005 of `truth`; make the pass class's values all exactly `truth`.

### Simulator hook (only when rule tables can't express it)
If the outcome depends on interactions a flat rule table can't capture — e.g. W4, where the
same chips produce a *false green* vs. a *real green* depending on whether the "prove it can
fail" move exposed a checker bug — add a named simulator:

```json
"simulatorId": "w4-check"
```

Then:
1. Implement the simulator in `src/content/simulators/<name>.ts` as a pure function
   `(packet, picks, matchedRule) => { isPass, output, claim?, doer? }`.
2. Name the file `src/content/simulators/<simulatorId>.ts` and `export const simulator: Simulator`. It is auto-discovered by filename; do NOT edit `index.ts`.
3. Still author full rules — the engine matches a rule for **feedback + lesson** even when a
   simulator decides pass/output. Order rules so the first match corresponds to the simulator's
   outcome for that combination.

The W4 simulator (`src/content/simulators/w4-check.ts`) is the reference. It reads its
8-customer fixtures from the catch-all rule's `output` (`customers`, `baseDrafts`,
`remindedDrafts`), so the content stays data-first.

### Attempt budget, stars, XP
```json
"attemptBudget": 2,
"stars": { "attemptBudget": 2, "showMove": "show", "thirdStar": null },
"xp": { "level": 20, "seenFailing": 15, "boss": 0 }
```
- ★ = pass. ★★ = pass within `attemptBudget` **and** fewer than 3 hints. ★★★ = also includes
  the `showMove` (M4 "show me the work") **or** satisfies `thirdStar` conditions.
- Set `showMove: null` **and** `thirdStar: null` to cap a level at ★★ by design (W1 L1, the
  fast first win) — surfaced to the learner as "two of two", not a miss.
- XP: `level` base, `+seenFailing` where the level makes the learner watch a check fail (P2),
  `+boss` on bosses. XP is credited only the first time a level is passed (no farming).

### Hints, compare, try-it
```json
"hints": { "nudge": "a question, not an answer", "gap": "show the gap", "moves": "name the moves" },
"whatYouDoDifferently": { "naive": "…", "rewrite": "…" },   // HTML-safe
"tryIt": {
  "template": { "plain": "copy-paste pattern", "tech": "code-skin pattern" },
  "notes": [ "<b>ChatGPT:</b> …", "<b>Copilot in Excel:</b> …", "<b>A chat AI that can't run code:</b> …" ]
}
```
`notes` must have **at least 3** entries (ChatGPT / Copilot-in-Excel / chat-AI-that-can't-run-code
is the house pattern). The third note always carries the "never accept 'I checked, they all
pass'" transfer rule.

### `expectPass` — the independent pass oracle (REQUIRED)
This is **not** derived from your rules. It is a second, independent statement of the pass
condition that the combination test checks the engine against. Authoring it forces you to
state the pass set twice from different angles; a mismatch anywhere in the whole combination
space fails the build.

```json
"expectPass": {
  "conditions": { "requireAll": ["check", "prove", "run"] },
  "requireSubChoicesAll": ["greet", "name", "step"]   // sub-choice constraints (optional)
}
```
Sub-choice constraints: `exactSubChoices` (exactly these on), `requireSubChoicesAll`
(these all on, extras allowed), `forbidSubChoicesAny` (none of these on).

For W4 the pass needs the three real criteria on; extra vague criteria (friendly/pro) are
harmless, so use `requireSubChoicesAll`, not `exactSubChoices`.

---

## Rule ordering — worked example (W4)

The W4 simulator's verdict depends on subtle interactions. The rules are ordered so the first
match names the right consequence:

```
pass    : check + prove + run + greet + name + step        → real green
bug     : check + run + greet + name + step, NO prove       → false green (step "next" bug)
vague   : check + run, none of greet/name/step              → vacuous checker
partial : check + run, some but not all real criteria       → a miss slips through
notRun  : check, NO run                                      → "all pass" never run
remind  : remind, NO check                                  → reminding ≠ checking
tricks  : perfect|double, NO check                           → a confident false claim
naive   : {} catch-all (carries the fixtures)                → 4 of 8 broke a rule
```

Because `pass` precedes `bug`, and `bug` requires NO `prove`, adding `prove` moves a learner
from the false green to the real green — which is the whole keystone lesson.

---

## Checklist before you commit a packet

- [ ] Filename stem equals `id`.
- [ ] Final rule is an unconditional catch-all (`"when": {}`).
- [ ] Exactly one rule has `isPass: true`.
- [ ] Every rule has non-empty `feedback`, `lesson`, `claim`, and a valid `doer`.
- [ ] All ids referenced in rules / `expectPass` are declared moves or sub-choices.
- [ ] `renderer` output shape matches the renderer (see table above).
- [ ] If `simulatorId` is set, it is registered and you authored feedback rules for every kind.
- [ ] `tryIt.notes` has ≥3 entries; the third is the "never accept 'I checked'" transfer line.
- [ ] `expectPass` states the pass condition independently of the rules.
- [ ] Hints follow nudge → gap → moves (never hand the learner their exact answer in hint 1–2).
- [ ] `npx vitest run` is green (schema + combination + engine + store).

---

## Running the gate

```bash
npm install          # once
npx vitest run       # schema + exhaustive combination + engine + store tests
npm run build        # tsc --strict + vite build
```

The **combination test** enumerates every move × sub-choice combination for your packet
(e.g. W4 = 2^7 × 2^5 = 4,096) and asserts the engine's pass set equals your `expectPass`
oracle, and that every non-pass has non-empty feedback. **This suite is the wave-2 gate: keep
it green.** If it fails, read the mismatch line — it prints the exact picks, the engine's
verdict + the rule that matched, and the oracle's verdict.
