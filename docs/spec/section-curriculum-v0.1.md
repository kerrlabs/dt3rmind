# Section: Curriculum — the full level-by-level ladder

Product: **Puzzle Ladder** — a chess.com-puzzle / Duolingo-level-up learning tool that
takes non-technical adults to the point where they can direct AI to build a tool that
performs a step *deterministically* and then prove it works.

Owner thesis (do not dilute): **determinism comes from the tools you force the AI
through, not the words you give it.** The AI stays stochastic; each *step* becomes
deterministic once a tool owns it. "Don't let it guess the part that has a right answer."

This section delivers: (1) the competency list; (2) the worlds/units in order; (3) a full
spec for every level; (4) where Jeff's real-model engine slots in; (5) held-out transfer
("boss") tasks per world. It is written to be built as-is — no TBD, every check has a
planted violation, every level has both skins and a 3-hint ladder.

---

## 0. Design principles the panel forced (every level honors these)

These are the non-negotiable rails. They are referenced by ID in the level specs below.

- **P1 — Lead with a win, then demo the failure.** The learner succeeds inside 3 minutes
  (World 1 L1 is a guaranteed green). AI failure is a demo the *system* runs ("watch what
  happens with no tool"), never a wall the learner's own attempt hits — until they have a
  competence buffer (World 3+). (adult-learning, instructional-design)
- **P2 — A check only counts once it has been SEEN FAILING.** Every level ships a planted
  violation (a seeded bad output) that MUST turn the check red before any green is
  credited. The engine refuses to award stars on a check that was never observed red.
  This is the vacuous-check detector, and it is the thesis applied to the course itself.
  (assessment, AI-engineer)
- **P3 — Two-sided checks only.** A real check passes the good seed AND fails the bad
  seed. A check that passes both is rejected as vacuous ("output is non-empty",
  "answer is a string"). (assessment C1)
- **P4 — Rename the spine to "make it checkable" (verifiability); reserve the word
  "determinism" for the capstone.** Levels 1–6 teach *verifiability*; the final world is
  where the learner decides which steps deserve a hard, reproducible gate. Non-technical
  copy never says "impossible to be wrong" — it says "wrong answers get caught."
  (AI-engineer)
- **P5 — One green is a smoke test, not proof.** Proof is a small case set with at least
  one boundary case and one adversarial case. "Prove it" levels run 3+ cases, not one.
  (AI-engineer, assessment)
- **P6 — The keystone (authoring a check) gets its own mini-ladder,** not one rung:
  recognize a check → pick the stronger of two → repair a near-miss → author one from
  scratch. This is World 4 and it is the #1 risk; it is also the first thing to user-test.
  (adult-learning, instructional-design, assessment)
- **P7 — Check-before-output sequencing is enforced at the engine.** On "prove it" and
  authoring levels the learner commits their check BEFORE the AI's output is revealed, and
  the edit field locks. This kills the dominant gaming path (let the AI infer a check,
  then rubber-stamp its own green). (assessment C4)
- **P8 — Pin the AI's failure for reproducibility; introduce the live model only once the
  loop is proven.** Early worlds use recorded/seeded wrong answers so a puzzle can never
  be unsolvable or flaky. Jeff's live engine appears only from World 2 onward, and even
  there the *puzzle* success condition is a deterministic check, never the model's mood.
  (UX, constraints)
- **P9 — Genre/pace is designed, not stumbled into.** Worlds 1–4 are fast click-puzzles
  (instant greens). Worlds 5–7 are the build-and-verify sandbox (model latency, a real
  runner). The hand-off at World 5 L1 is an explicit "you're entering the workshop now"
  beat with a visible spinner state and a "this wait is the model thinking, not you
  failing" affordance — so the dopamine cadence doesn't crater silently. (UX)
- **P10 — Distinguish "your check failed" (the point) from "the system failed" (not your
  fault).** Runner timeouts / env errors render in a neutral gray lane, never red; red is
  reserved for a genuine check failure the learner caused or must fix. (UX)
- **P11 — Hints are a first-class system: nudge → structural reveal → worked move.** Every
  level has exactly 3 hints on this ladder; using a hint costs one star, never blocks the
  green. (UX)
- **P12 — Score check QUALITY, not just green.** Stars reward: did your check catch the
  planted bad case (★), did it also pass the good case without over-fitting (★★), did it
  survive a held-out case you never saw (★★★). This shifts reward from
  performance (flip the light) to mastery (build a strong check). (instructional-design,
  assessment)
- **P13 — Worlds are themes, not just a line.** The spine is linear for onboarding, but
  each world is a drillable theme with extra puzzles and a daily-puzzle queue, so a learner
  can grind a weakness (chess.com's actual retention engine). (UX)
- **P14 — Two skins per level, one objective.** Non-technical "skin" = click-together /
  pick-from-valid-options / one slot to fill, no syntax. Technical "skin" = write the real
  schema / tool arg / assertion. The *check that defines success is identical across
  skins* — that is what keeps it one objective and not two courses. The technical skin uses
  a constrained slot-editor (fill-the-slot, pick-from-valid), never free drag-and-drop, so
  relationships (scope, order, types) can't be mis-taught. (UX, instructional-design)
- **P15 — Formative vs summative are separated and labeled.** Per-level greens are
  formative. Certification requires the held-out transfer "boss" task at each world's end
  and a final cross-domain capstone; a learner is never certified on formative greens.
  (assessment)

---

## 1. Competency list

Observable, measurable behaviors (assessment lens: a competency is a claim about the
*learner*, not an activity completed). Each maps to levels and a check that can go red.

| ID | Competency (observable behavior) | Primary world |
|----|----------------------------------|---------------|
| C1 | **Shapes the answer:** given a rambling task, specifies the fields/shape the answer must have, so output is checkable by structure. | W1 |
| C2 | **Spots the guess:** given confident AI prose, flags the specific claims the AI cannot know (math, counts, dates, facts) above chance on held-out items. | W2 |
| C3 | **Routes a right-answer step to a tool:** chooses, for a given step, whether it has one right answer (→ tool) or is open (→ leave to the model), and places the tool in the pipeline. | W2, W3 |
| C4 | **Grounds a factual claim:** forces an answer to come from a named source/lookup and recognizes when the AI should abstain ("not in the source") instead of inventing. | W3 |
| C5 | **Recognizes a real check:** distinguishes a falsifiable pass/fail check from a vacuous one (one that can't go red). | W4 |
| C6 | **Repairs a weak check:** given a near-miss check that passes a bad output, tightens it until it fails the bad output. | W4 |
| C7 | **Authors a two-sided check:** writes, from scratch and in plain language, a check that passes a good output and fails a planted bad one. | W4 |
| C8 | **Directs a tool-build from a spec:** describes a tool precisely enough that AI-generated code behaves correctly on an input the learner specifies. | W5 |
| C9 | **Proves with a case set:** verifies a tool against multiple cases including one boundary and one adversarial case, not a single happy-path example. | W5, W6 |
| C10 | **Verifies before trusting (sequence):** commits the success check BEFORE seeing the AI's output; reads a green as "my check held," not "the machine said yes." | W5, W6 |
| C11 | **Re-directs on failure:** localizes which case failed and tightens the spec/check so it passes WITHOUT weakening the check or overfitting the one case. | W6 |
| C12 | **Detects the false green:** identifies when a tool passed because the check was too weak (not because the tool is right), and strengthens the check. | W6 |
| C13 | **Risk-tiers:** on an unseen scenario, decides which steps need a hard deterministic gate vs. a heuristic/human review, and justifies it by cost of being wrong. | W7 |
| C14 | **Transfers:** on a novel, unscaffolded, cross-domain task, performs C2→C13 end-to-end: names the guess, authors the check, directs the build, proves on hidden cases, re-directs, and tiers. | Capstone |

---

## 2. World map (7 worlds, 3–5 levels each = 26 levels)

Ordered by **cognitive demand on the learner** (learning taxonomy), not by kind of tool
(the panel's #1 ordering fix). A "how AI fails" concept precedes "spot the guess";
check-authoring is its own world; grounding is its own rung; one-green is never proof.

| # | World (theme) | Learner arc | Competencies | Skin genre | Live engine? |
|---|---------------|-------------|--------------|-------------|--------------|
| W1 | **Shape the Answer** | 3-min first win; structure makes output checkable | C1 | click-puzzle | no (seeded) |
| W2 | **Spot the Guess** | how AI fails → catch the guess → route it to a tool | C2, C3 | click-puzzle | yes (demo) |
| W3 | **Make it Answer from the Source** | grounding + abstention; stop invented facts | C4, C3 | click-puzzle | yes (demo) |
| W4 | **Name the Check** *(keystone)* | recognize → pick → repair → author a two-sided check | C5, C6, C7 | click-puzzle | no (seeded) |
| W5 | **Have AI Build the Tool** | direct a build from a spec; prove on a case set | C8, C9, C10 | **workshop** | yes (Jeff) |
| W6 | **Prove It & Fix It** | catch the false green; re-direct without weakening | C11, C12, C9 | **workshop** | yes (Jeff) |
| W7 | **Decide Where It Matters** | risk-tier: hard gate vs. heuristic vs. human | C13 | judgment-puzzle | mixed |
| — | **Capstone** | held-out cross-domain transfer, unscaffolded | C14 | workshop | yes (Jeff) |

Every world ends with a **held-out "boss" transfer task** (section 4 of each world below,
and the roll-up in §5). Boss greens are the only thing that advance the world; per-level
greens are formative (P15).

The genre switch (P9) is at **W5 L1**, flagged in-product as entering "the workshop."

---

## WORLD 1 — Shape the Answer  (C1)

Goal: a guaranteed win in the first 3 minutes (P1), teaching that structure is what makes
an answer *checkable*. No AI failure shown yet — the learner banks a win first.

### W1 L1 — "The receipt" *(the 3-minute first win)*
- **Competency:** C1
- **Task:** The AI was asked "summarize this coffee order." It replied in a friendly
  paragraph. Your job: drag the three fields a receipt must have (**item, size, price**)
  onto the answer slots so the order becomes a filled form.
- **AI's wrong-by-default behavior:** returns prose ("Sure! You got a large latte, that's
  four fifty…") — pleasant, but you can't check it field-by-field.
- **Tool/scaffold the learner adds:** a **form/schema** block with 3 named slots.
- **Deterministic check:** `output has exactly fields {item, size, price} AND price is a
  number`. Runs instantly on the seeded output.
- **Planted violation (P2):** the pre-filled bad seed has `price: "four fifty"` (words, not
  a number). The check goes RED first; the learner sees it fail, then sees the schema force
  a numeric price → GREEN. (Guaranteed solvable: the right drag is one of three slots.)
- **Hint ladder (P11):** (1) "A receipt always lists the same things — what are they?"
  (2) highlights the 3 empty slots and the word "price". (3) shows item→size→price filled,
  learner presses run.
- **Non-technical skin:** drag 3 labeled chips into 3 slots.
- **Technical skin:** write the JSON shape `{"item": str, "size": str, "price": number}`
  in a slot-editor (pick types from a dropdown; no free syntax).

### W1 L2 — "One shape, many orders"
- **Competency:** C1 (generalization)
- **Task:** Same schema must handle 3 different orders (incl. a 2-item order). Choose
  whether `item` is one value or a list.
- **AI wrong-by-default:** flattens a 2-item order into one string ("latte and muffin").
- **Scaffold:** change the `item` slot to a **list/array** type.
- **Check:** `every order's items parse as a list AND each has a numeric price`.
- **Planted violation:** seed order #2 returns items as a single joined string → RED until
  the list type is applied.
- **Hints:** (1) "What happens when someone orders two things?" (2) highlights the
  single-string seed. (3) shows the list-type toggle.
- **Non-technical skin:** toggle a slot from "one" to "a list."
- **Technical skin:** change `str` → `array[str]` and re-run.

### W1 L3 — "The field that must be there"  *(required vs optional)*
- **Competency:** C1 (constraint)
- **Task:** Make `price` **required** so an order can never come back priced-unknown.
- **AI wrong-by-default:** omits `price` entirely on an item it's unsure about, and the
  paragraph reads fine.
- **Scaffold:** mark `price` **required** in the schema.
- **Check:** `price present on every item (missing = fail)`.
- **Planted violation:** seed drops `price` on one item → RED until required is set.
- **Hints:** (1) "Which field would hurt most if it were silently missing?" (2) highlights
  the item with no price. (3) shows the "required" toggle on `price`.
- **Non-technical skin:** flip a "must be filled" switch on the field.
- **Technical skin:** move `price` into the `required` array of the schema.

**World 1 boss (held-out, §5):** a *new* domain (a help-desk ticket, never seen) — the
learner must specify the shape, required fields, and a list field unaided, and their schema
must reject a planted malformed ticket.

---

## WORLD 2 — Spot the Guess  (C2, C3)

Goal: build the mental model of *how AI fails* (a concept beat, per the panel) BEFORE
asking the learner to catch it; then teach the move — route the right-answer step to a
tool. This is where Jeff's engine first appears as a **demo** (P8): the system runs the AI,
the learner watches it scatter.

### W2 L1 — "Why it guesses" *(concept rung — no scoring, builds the model)*
- **Competency:** pre-C2 (model-building; the panel's required "how AI fails" rung)
- **Task:** Press "Ask the AI the same hard multiplication 5 times." Watch 5 *different*
  confident answers appear. One short line explains: the AI predicts likely text, it does
  not compute.
- **AI wrong-by-default:** 5 different wrong products for `6,847 × 2,913` (seeded from a
  real run so they're realistic but reproducible — P8).
- **Scaffold:** none yet; this rung's "tool" is the *insight*. A single checkbox — "I see:
  it's guessing, not calculating" — unlocks L2.
- **Deterministic check:** `the 5 answers are not all equal` (trivially true by seed) — this
  rung is formative-only and labeled "warm-up," so it doesn't pretend to certify (P15).
- **Planted violation / honesty note:** because this check *can't meaningfully fail*, it is
  explicitly marked a **demo, not a graded check**, and shows the learner a counter-example
  of a vacuous check ("see how this check can't go red? that's a bad check — you'll learn to
  spot those in World 4"). Turns the one unavoidable weak check into a teaching moment.
- **Hints:** (1) "Did it give the same answer twice?" (2) circles two differing digits.
  (3) reveals the one-line explanation.
- **Non-technical skin:** watch 5 answer cards flip up.
- **Technical skin:** same, plus the model name + temperature shown (temp 0.7).

### W2 L2 — "Highlight the guess"
- **Competency:** C2
- **Task:** An AI answer paragraph is shown ("Our Q3 revenue was $412,000 across 1,208
  orders, up 14% from Q2"). Click the **three** claims the AI could only be guessing (the
  numbers it would have to compute from data it was never given).
- **AI wrong-by-default:** states computed figures (total, count, % change) as fact with no
  source.
- **Scaffold:** a **highlighter** — selecting a claim tags it "needs a source/tool."
- **Deterministic check:** `learner tagged ≥ the 3 planted un-knowable claims AND tagged
  ≤1 of the 4 safe claims` (two-sided: catches both misses and over-tagging).
- **Planted violation:** the "correct answer key" seed tags only 1 claim → RED (demonstrates
  under-detection fails the check), so the learner sees what an inadequate answer looks like
  before submitting their own.
- **Hints:** (1) "Which numbers would the AI have to *calculate* to know?" (2) dims the
  safe sentence fragments. (3) reveals one of the three with a label "computed — not given."
- **Non-technical skin:** click sentences to highlight.
- **Technical skin:** tag each claim with a type `{computed | retrieved | opinion | given}`;
  check requires the computed ones tagged `computed`.
- **Anti-gaming:** item bank rotates (assessment C2) so brute-force clicking is scored
  against a random baseline across held-out items.

### W2 L3 — "Hand it to the calculator" *(the prototype level)*
- **Competency:** C3
- **Task:** Route the multiplication step through a calculator tool so the number is exact.
  (This is the existing working prototype `level-2-dont-let-ai-do-math.html` — adopt its
  board, flow animation, red-shake, tool-drop, star + "lesson unlocked" beat verbatim.)
- **AI wrong-by-default:** confident `19,843,652` (seeded guess) for `6,847 × 2,913`.
- **Scaffold:** drop the **calculator tool** node into the pipeline; the AI decides *when*
  to call it, the tool decides the number.
- **Deterministic check:** `answer == 6847 * 2913` (exact).
- **Planted violation:** the direct (no-tool) path returns the seeded guess → RED + shake;
  routing through the tool → exact → GREEN + ★★★.
- **Hints:** (1) "Which step here has exactly one right answer?" (2) pulses the calculator
  node. (3) shows the re-routed path.
- **Non-technical skin:** one "Add calculator tool" button (prototype as-is).
- **Technical skin:** register a tool `multiply(a:int,b:int)->int` and show the model
  emitting a tool-call instead of a literal.

### W2 L4 — "Right-answer or open?" *(the C3 judgment)*
- **Competency:** C3
- **Task:** Five steps of a task are listed (compute a total; draft a friendly subject line;
  count overdue invoices; suggest a discount %; look up today's date). Sort each into
  **"has one right answer → tool"** or **"open → leave to the AI."**
- **AI wrong-by-default:** (demo) the AI tries to do all five itself and gets the three
  right-answer ones wrong.
- **Scaffold:** two bins; dropping a step into "tool" attaches the matching tool.
- **Deterministic check:** `the 3 right-answer steps are binned to tools AND the 2 open
  steps are left to the AI` (two-sided — binning the subject line to a tool fails too).
- **Planted violation:** a seed that routes *everything* to tools → RED (over-tooling fails,
  teaching that not every step needs the gate — foreshadows W7).
- **Hints:** (1) "If two careful people did this step, would they get the same answer?"
  (2) groups the obvious two. (3) reveals one tricky one (the date lookup → tool).
- **Non-technical skin:** drag 5 cards into 2 bins.
- **Technical skin:** annotate each step `deterministic:true/false` and attach a tool id.

**World 2 boss (held-out):** a fresh paragraph in a new domain (a clinic's monthly note).
Learner must (1) highlight every un-knowable claim and (2) route each right-answer step to
the correct tool, unaided; the planted bad case is a paragraph with one *correct-looking but
fabricated* count that only a source lookup (foreshadowing W3) would catch.

---

## WORLD 3 — Make it Answer from the Source  (C4, C3)

Goal: the grounding rung the AI-engineer review said was missing. Catching a guess (W2) is
a dead end without a move to *fix* it — force the answer to come from a named source, and
teach **abstention** ("not in the source" beats a confident invention).

### W3 L1 — "Only from the sheet"
- **Competency:** C4
- **Task:** "What's the price of the oat latte?" The AI is given a 6-row menu. Route the
  question through a **lookup tool** that can only return a value found in the menu.
- **AI wrong-by-default:** invents `$5.25` (plausible, not on the menu — the real price is
  `$4.75`).
- **Scaffold:** a **source-lookup tool** bound to the menu table.
- **Deterministic check:** `answer == menu.lookup("oat latte").price` (exact, from data).
- **Planted violation:** direct path returns the invented price → RED; lookup path →
  `$4.75` → GREEN.
- **Hints:** (1) "Where is the *real* price written down?" (2) highlights the menu row.
  (3) shows the lookup node wired to the menu.
- **Non-technical skin:** connect the question to the menu table with one click.
- **Technical skin:** define `lookup(item)->row` over a tiny table; show the retrieved row
  as the citation.

### W3 L2 — "When the answer isn't there" *(abstention)*
- **Competency:** C4 (abstention — the AI-engineer's "teach it to say I don't know")
- **Task:** "What's the price of the matcha?" — but matcha isn't on the menu. Make the tool
  return **"not on the menu"** instead of a guess.
- **AI wrong-by-default:** confidently invents a matcha price rather than abstaining.
- **Scaffold:** add an **abstain branch**: lookup-miss → return "not in source."
- **Deterministic check:** `on a missing item, answer == "not on the menu" (no number
  emitted)`.
- **Planted violation:** seed where the AI returns `$5.00` for matcha → RED; the abstain
  branch → "not on the menu" → GREEN. This is the first time GREEN means *the AI said less*,
  a key reframing.
- **Hints:** (1) "What's the honest answer when it's just not there?" (2) shows the empty
  lookup result. (3) reveals the abstain branch.
- **Non-technical skin:** pick the "if not found → say 'not on the menu'" card.
- **Technical skin:** add the `if row is None: return "not on the menu"` branch.

### W3 L3 — "Cite it or it didn't happen"
- **Competency:** C4 + C3 (grounding a multi-field answer)
- **Task:** Answer "which drink is cheapest and how much?" so the answer carries **both**
  the value and the **source row** it came from.
- **AI wrong-by-default:** names a drink with no price, or a price with the wrong drink
  (mismatched pair).
- **Scaffold:** a **grounded-answer schema** `{drink, price, source_row}` fed by the lookup.
- **Deterministic check:** `price == menu[source_row].price AND drink == menu[source_row].name
  AND price == min(menu.price)` (three-way, catches mismatched pairs).
- **Planted violation:** seed with `{drink: "oat latte", price: 3.50, source_row: 1}` where
  row 1 is a $3.50 drip coffee, not an oat latte → RED (the pair doesn't reconcile) until the
  schema is fed from the lookup.
- **Hints:** (1) "Does the price actually belong to that drink?" (2) highlights the
  mismatch. (3) wires `source_row` from the lookup result.
- **Non-technical skin:** connect each answer field to its source cell.
- **Technical skin:** bind the three fields to the retrieved row object.

**World 3 boss (held-out):** a new source (a 10-row shipping-rate table) and a question
whose answer is **not** in the table — the learner must build grounding + abstention so the
tool returns "not in source" rather than inventing a rate; the planted bad case is a
convincingly-wrong rate the ungrounded model offers.

---

## WORLD 4 — Name the Check  *(KEYSTONE — the #1 risk, its own mini-ladder, P6)*  (C5, C6, C7)

Goal: the single hardest skill — turning a goal ("flag the risky ones") into a *falsifiable*
pass/fail check. The panel was unanimous: this is where non-technical learners quit, and it
needs its own graded ladder of **recognize → pick → repair → author**, with worked examples
of weak vs. strong and explicit non-examples of vacuous checks. This world is seeded (no live
model, P8) so the learner's attention is 100% on check quality, and **check-before-output
sequencing is irrelevant here because there is no AI output to peek at — the learner reasons
only about the check**.

### W4 L1 — "Can this check even fail?" *(recognize — C5)*
- **Competency:** C5
- **Task:** Three checks are shown for "the summary includes the price." Pick the one that
  **can go red**. (A: "output is not empty"; B: "output is a string"; C: "output contains a
  number labeled price".)
- **AI wrong-by-default:** n/a (this is a judgment rung); instead the system shows a
  tempting vacuous check passing a *garbage* output to make the failure mode vivid.
- **Scaffold:** a **"try to break it" button** — runs each candidate check against a planted
  garbage output and shows which ones still go green (the vacuous ones).
- **Deterministic check (meta):** `learner selected the only check that fails the garbage
  seed` (C is correct; A and B pass garbage → they're vacuous).
- **Planted violation (P2):** the garbage output ("Thanks for your order!") is the planted
  bad case; a real check (C) MUST go red on it. Selecting A or B = your chosen check passed
  garbage = wrong.
- **Hints:** (1) "A good check says NO to a bad answer. Which of these ever says no?"
  (2) runs the garbage output through A and B so the learner sees them stay green.
  (3) reveals that only C references the thing that matters (a labeled price).
- **Non-technical skin:** pick 1 of 3 cards; "try to break it" animates each.
- **Technical skin:** same three as assertions (`len(out)>0`, `isinstance(out,str)`,
  `re.search(r'price[:=]\s*\d', out)`); learner picks the falsifiable one.

### W4 L2 — "Which check is stronger?" *(pick — C5/C6)*
- **Competency:** C5 → C6
- **Task:** Two non-vacuous checks for "flag refunds over $100." A: "mentions a dollar
  amount." B: "flags every line where amount > 100 and flags none ≤ 100." Pick the stronger
  and say in one tap *why* (it's two-sided).
- **Scaffold:** a **test-bench** that runs both checks against a 5-row seed (3 over $100,
  2 under) and shows each check's pass/fail per row.
- **Deterministic check (meta):** `learner picked B AND B is shown catching the over-$100
  rows while not firing on the under-$100 rows`.
- **Planted violation:** A passes a row that is $40 ("mentions a dollar amount" — true but
  wrong) → the bench shows A's false green on row 4; B stays correct. Picking A = accepting a
  false green.
- **Hints:** (1) "Does it only say yes when it should — and no when it shouldn't?"
  (2) highlights the $40 row that A wrongly passes. (3) shows B's clean per-row result.
- **Non-technical skin:** pick A or B; bench shows a green/red grid.
- **Technical skin:** read both predicates; pick the one with correct both-direction
  behavior.

### W4 L3 — "Fix the check that lets a bad one through" *(repair — C6)*
- **Competency:** C6
- **Task:** You're given a near-miss check for "the date is in the future": `check: output
  contains a date`. A planted bad output has a date — *in the past*. Tighten the check until
  it fails that bad output.
- **AI wrong-by-default:** n/a; the *given check* is the thing that's wrong (bundles the
  skill cleanly — repairing a check, not reading code).
- **Scaffold:** a **check-editor** with pickable clauses ("contains a date" → add "AND the
  date is after today").
- **Deterministic check (meta):** `the edited check FAILS the past-date seed AND PASSES a
  future-date seed` (two-sided, P3).
- **Planted violation:** the past-date output is the planted bad case; the un-repaired check
  passes it (RED on the meta-check: "your check let a bad one through"). Only after adding the
  "after today" clause does the meta-check go green.
- **Hints:** (1) "The bad answer has a date too — so 'has a date' can't be enough. What else
  is true of a *good* answer?" (2) highlights that the bad date is in the past. (3) reveals
  the "after today" clause to add.
- **Non-technical skin:** add a clause card to the check.
- **Technical skin:** edit the assertion to `date > today`.

### W4 L4 — "Write it yourself" *(author — C7, the keystone of the keystone)*
- **Competency:** C7
- **Task:** Goal in the learner's words: "make sure the email has a greeting, the customer's
  name, and a next step." Write a check, from scratch, in plain language (assembled from a
  constrained clause palette so it's always machine-runnable — P14), that passes a good email
  and fails a planted bad one.
- **AI wrong-by-default:** n/a; the learner authors. (Optional: show two *example* AI emails,
  one good one bad, to check against.)
- **Scaffold:** a **clause palette** (has-field, contains-text, matches-pattern, count,
  comparison) + a live two-pane bench showing the check's verdict on the good seed and the
  bad seed as the learner builds.
- **Deterministic check (meta):** `the authored check PASSES the good seed AND FAILS the bad
  seed` — AND the vacuous-check detector confirms it went red on the bad seed at least once
  (P2/P3). A check that passes both seeds is rejected with "this check can't tell them
  apart."
- **Planted violation:** the bad seed email is missing the next-step line; a weak check
  ("email is non-empty") passes it → the detector blocks the green and says "your check
  passed the bad email — tighten it." This is the vacuous-check detector doing its job live.
- **Hints:** (1) "Name the three things a GOOD email has that the BAD one is missing."
  (2) shows the bad email with the missing next-step line called out. (3) reveals one clause
  (`contains a next-step phrase`) and lets the learner add the other two.
- **Non-technical skin:** stack clause cards; bench updates live.
- **Technical skin:** write three assertions; same bench.
- **Anti-gaming (assessment C7):** the good/bad seeds rotate from a bank; a memorized clause
  set won't pass a fresh pair unless it actually encodes the three requirements.

**World 4 boss (held-out):** a brand-new goal in plain English ("flag any support reply that
promises a refund without a ticket number"), a hidden good/bad seed pair the learner never
sees before submitting — the authored check must pass the good and fail the bad on the hidden
pair. This is the make-or-break certification gate and the first thing to user-test (P6).

---

## WORLD 5 — Have AI Build the Tool  *(the genre switch to the workshop, P9)*  (C8, C9, C10)

Goal: the payoff — a non-technical learner directs the AI to write a real tool and proves it
on a *case set*, not one example. This is where **Jeff's live engine** runs (§4). The world
opens with the explicit "you're entering the workshop" beat (P9) and the latency/error
affordances (P10). Check-before-output sequencing is enforced from here on (P7).

### W5 L1 — "Describe the tool" *(the workshop on-ramp — C8)*
- **Competency:** C8
- **Task:** You need a tool that computes **total sales for a given month** from the seeded
  sales data. You don't write code — you describe it: inputs (month), output (one dollar
  total), and the rule (sum the `amount` of rows in that month). The AI writes the code;
  you run it.
- **AI wrong-by-default:** if asked to just "tell me March sales," the LLM (Agent A, temp
  0.7) returns a plausible-but-wrong total from eyeballing rows (Jeff's measured A: 0/10
  exact). The *tool* AI writes (Agent B pattern: writes SQL, SQLite executes) returns exact.
- **Scaffold:** a **spec form** (inputs / output / one-line rule) that becomes the AI's build
  prompt; the generated tool runs in the safe runner (§4) against the seeded data.
- **Deterministic check:** `tool(March) == SELECT SUM(amount) WHERE month='March'` — the
  canonical SQL answer over seed 42 (exact, reproducible). The learner **commits this check
  before seeing the tool's output** (P7, C10).
- **Planted violation:** the first thing shown is Agent A's eyeballed guess for March → RED
  against the committed check; then the learner's spec drives a built tool → exact → GREEN.
  (Jeff's key insight: Agent B may write *different* SQL than canonical yet produce the same
  exact total — the check is value-equality, not SQL-text equality.)
- **Hints:** (1) "What does the tool take in, and what single number should it give back?"
  (2) pre-fills input=month, output=total, leaves the rule. (3) reveals the rule phrasing
  "add up the amount for every row in that month."
- **Non-technical skin:** fill 3 spec fields; press "Have the AI build it."
- **Technical skin:** write the tool signature + docstring; inspect the generated SQL.
- **Latency UX (P10):** model-generation shows a labeled "the AI is writing your tool…"
  spinner; a runner error renders gray ("the workshop hiccuped — try again"), never red.

### W5 L2 — "Prove it on more than one month" *(C9 — one green isn't proof, P5)*
- **Competency:** C9, C10
- **Task:** Run the tool against a **case set**: a normal month, a month with **zero** sales
  (boundary), and a month whose data includes a **refund / negative amount** (adversarial).
- **AI wrong-by-default:** a naive tool counts the refund as positive or crashes on the empty
  month.
- **Scaffold:** a **case-set runner** showing a green/red chip per case.
- **Deterministic check:** `tool(normal)==canonical AND tool(empty)==0 AND
  tool(refund_month)==canonical_net` — all three must be green (P5).
- **Planted violation:** the empty-month case returns `null`/error on the first build → RED
  on that chip; the learner re-specs ("return 0 when there are no rows") → all green.
- **Hints:** (1) "What should the total be for a month with no sales?" (2) highlights the
  empty-month red chip. (3) reveals the "return 0 when empty" rule to add to the spec.
- **Non-technical skin:** three case cards, each with an expected number; run all.
- **Technical skin:** add the three cases as parametrized assertions.

### W5 L3 — "The check you can't peek your way past" *(C10 sequencing enforced)*
- **Competency:** C10
- **Task:** Author the success check and **lock it** before the AI output is revealed; then
  build and run. Teaches that a green means *your* check held (UX: "their green," not "the
  machine said yes").
- **AI wrong-by-default:** without the lock, learners rubber-stamp whatever the AI returned;
  the engine prevents it by hiding the output until the check is committed (P7).
- **Scaffold:** a **commit-then-reveal** control; the check field greys out on commit.
- **Deterministic check:** `committed_check passes the built tool's output on the hidden case
  set` — and the engine logs that the check was committed *before* output time (C4/C10
  sequence evidence).
- **Planted violation:** a seeded "tempting" AI output that looks right but is off by a
  rounding error; a check committed as "total is about right" can't catch it (and is rejected
  as un-falsifiable), while "total == exact canonical" catches it → RED then GREEN.
- **Hints:** (1) "Decide what 'correct' means before you see the answer — what exact number
  must it equal?" (2) shows that "about right" can't be run. (3) reveals the exact-equality
  check.
- **Non-technical skin:** write the check, press "Lock & build."
- **Technical skin:** same with a real assertion; the lock is enforced server-side.

**World 5 boss (held-out):** a new metric on the same seeded data — "average order value for
a given weekday" — the learner specs the tool, commits a check, and must pass a **hidden**
case set including a weekday with a single order (boundary) and one with a refund
(adversarial), all unaided.

---

## WORLD 6 — Prove It & Fix It  (C11, C12, C9)

Goal: the two skills that separate real verification from theater — catching the **false
green** (a tool that passed because the check was weak) and **re-directing** on a genuine
failure without weakening the check or overfitting the one case.

### W6 L1 — "The green that lied" *(C12 — detect the false green)*
- **Competency:** C12
- **Task:** A tool is shown passing its check. But a new, held-out case is run — and the tool
  is wrong on it, even though the check stayed green. Find *why the check didn't catch it*,
  and strengthen the check.
- **AI wrong-by-default:** the built tool handles the one happy case and nothing else; the
  original check only tested that one case.
- **Scaffold:** a **"second case" reveal** + the editable check from W4.
- **Deterministic check (meta):** `strengthened check now goes RED on the held-out bad case`
  (the whole point: the check must newly fail where it falsely passed).
- **Planted violation:** the held-out case *is* the planted violation; a green on it before
  strengthening is the false green the learner must expose. The meta-check requires the
  learner's new check to turn that case red.
- **Hints:** (1) "The tool passed but it's wrong here — so the check never looked at this.
  What is this case doing that the check ignores?" (2) highlights the untested dimension
  (e.g., negative amounts). (3) reveals the clause that would have caught it.
- **Non-technical skin:** add the missing clause; watch the previously-green case go red.
- **Technical skin:** add the assertion that fails the held-out case.

### W6 L2 — "Point at the broken case" *(C11 — localize, don't let AI narrate)*
- **Competency:** C11
- **Task:** The case-set runner shows 1 of 4 cases red. Identify *which* case failed and
  re-direct the build to fix it. The AI's own explanation of the fix is **suppressed on the
  first attempt** (assessment C5 anti-gaming) — the learner must localize it themselves.
- **AI wrong-by-default:** when asked to "just fix it," the AI rewrites the tool to pass the
  failing case by special-casing it (overfit) — which then breaks another case.
- **Scaffold:** a **failing-case inspector** (shows input + expected vs. actual) and a
  re-spec box.
- **Deterministic check:** `after re-direct, ALL cases green AND no previously-green case
  regressed` (guards against overfit — the panel's "rewrites to pass by overfitting" risk).
- **Planted violation:** a tempting one-line "if month=='Feb' return 980" overfit fix passes
  Feb but the regression guard turns another case red → the learner must re-spec the *rule*,
  not the case.
- **Hints:** (1) "Which case is red, and what did it expect vs. get?" (2) shows the overfit
  trap ("fixing only Feb breaks March"). (3) reveals that the rule, not the case, is wrong.
- **Non-technical skin:** click the red case, adjust the rule, re-run all.
- **Technical skin:** read the diff, fix the rule, confirm no regression.

### W6 L3 — "Prove it like you mean it" *(C9 consolidation — adversarial case set)*
- **Competency:** C9, C11
- **Task:** Before you can mark the tool "done," you must add your *own* boundary case and
  your *own* adversarial case to the set, and all must pass.
- **AI wrong-by-default:** n/a; the learner now authors the proof.
- **Scaffold:** the case-set runner, now with "add a case you think could break it."
- **Deterministic check:** `the learner-added adversarial case is non-trivial (differs from
  existing cases on an untested dimension — engine-checked) AND all cases pass`.
- **Planted violation:** if the learner adds a duplicate/trivial case, the engine flags it
  ("this case can't fail differently from one you already have") — the vacuous-check idea
  applied to case design.
- **Hints:** (1) "What input have we NOT tried that could trip it up?" (2) lists the
  dimensions already covered so the gap is visible. (3) suggests one untested dimension
  (e.g., a month spanning a year boundary).
- **Non-technical skin:** pick an untested dimension from a prompt list, set the expected
  value.
- **Technical skin:** write a new parametrized adversarial assertion.

**World 6 boss (held-out):** a built tool with a **planted false green** on a hidden
dimension (e.g., it silently drops rows from a timezone edge). The learner must detect the
false green, localize the failing case, re-direct without overfitting, and add a passing
adversarial case — all on a tool and data pair they've never seen.

---

## WORLD 7 — Decide Where It Matters  *(the capstone judgment)*  (C13)

Goal: the top-of-Bloom's judgment the whole course builds toward and where the word
**"determinism"** finally earns its place (P4) — deciding which steps need a hard,
reproducible gate vs. a heuristic vs. a human review, justified by the cost of being wrong.
The panel wanted risk-tiering to *inform* the ladder, so it is foreshadowed in W2 L4 and
W5–6 (over-tooling and false-greens) and consolidated here.

### W7 L1 — "What does it cost to be wrong?"
- **Competency:** C13 (framing)
- **Task:** Six steps from a real workflow (e.g., a billing assistant: compute the invoice
  total; greet the customer; pick a payment-plan recommendation; look up the account balance;
  draft the apology wording; decide whether to issue a refund). Sort each into **hard gate /
  heuristic / human review** and justify by one tap: "what happens if this is wrong?"
- **AI wrong-by-default:** (demo) a one-tier-fits-all pipeline that hard-gates the greeting
  (wasteful) and leaves the refund decision to the model (dangerous).
- **Scaffold:** three bins with a cost-of-wrong prompt on each card.
- **Deterministic check:** `each step is binned to match the expert key (hard gate: total,
  balance; heuristic: recommendation, apology wording; human: refund decision; the greeting
  may be heuristic or ungated)` — scored against an expert key, not self-report (assessment
  C6 fix).
- **Planted violation:** a seed that leaves the invoice-total to the model (no gate) → RED
  (a right-answer step with no tool is the exact failure W2 taught).
- **Hints:** (1) "If this step is wrong, who gets hurt and how badly?" (2) groups the two
  clear hard-gates. (3) reveals the refund as the human-review step (high cost, judgment).
- **Non-technical skin:** drag 6 cards into 3 bins.
- **Technical skin:** annotate each step `{gate: hard|heuristic|human}` with a one-line
  rationale.

### W7 L2 — "The gate that was too expensive"
- **Competency:** C13 (over-determinism — the other direction)
- **Task:** A pipeline hard-gates *everything*, including the open/creative steps, making it
  brittle and slow. Relax the gates that don't need to be hard, without un-gating a
  right-answer step.
- **AI wrong-by-default:** n/a; the given pipeline is over-gated.
- **Scaffold:** per-step gate toggles with a "cost of this gate" meter.
- **Deterministic check:** `the two right-answer steps stay hard-gated AND at least the two
  open steps are relaxed AND no right-answer step was un-gated` (two-sided — relaxing a
  total's gate fails).
- **Planted violation:** a seed that relaxes the invoice-total gate to save time → RED
  (you can't trade away the gate on a step with a right answer).
- **Hints:** (1) "Which of these steps has one right answer? Those keep the hard gate."
  (2) highlights the two that must stay. (3) shows which open steps are safe to relax.
- **Non-technical skin:** flip gate switches; the meter shows cost dropping.
- **Technical skin:** edit the per-step gate config.

### W7 L3 — "Your call, defended" *(C13 on an unseen scenario)*
- **Competency:** C13 (transfer within the world)
- **Task:** A **new** workflow the learner hasn't seen (a hospital discharge-instructions
  assistant). Tier every step and write one sentence defending the single highest-risk
  choice.
- **Deterministic check:** `tiering matches the expert key on the two highest-cost steps
  (dosage calc → hard gate; "which step is riskiest" selection matches)`. The one-sentence
  defense is stored for the human-reviewed portion of certification but does not gate the
  green (no LLM judges pass/fail — P-constraint).
- **Planted violation:** the expert key marks "dosage calculation" as a hard gate; a seed
  that leaves it heuristic → RED.
- **Hints:** (1) "In THIS workflow, which single step would do the most harm if wrong?"
  (2) narrows to the two clinical steps. (3) confirms dosage as the non-negotiable hard gate.
- **Non-technical skin:** tier the steps, pick the riskiest, write one sentence.
- **Technical skin:** same, plus specify the gate mechanism for the hard-gated step.

**World 7 boss (held-out):** a fresh, higher-stakes workflow (a loan-approval assistant).
The learner tiers every step against a hidden expert key and must correctly hard-gate the
two right-answer/high-cost steps (the eligibility calculation and the rate lookup) and route
the subjective step to human review. This is the judgment half of certification.

---

## 4. Where Jeff's real-model engine slots in

Repo: `github.com/kerrlabs/ai-determinism-demo` — FastAPI + SSE; providers OpenAI / Bedrock /
mock; seeded sales dataset (seed 42); **Agent A** (LLM computes from raw rows, temp 0.7,
scatters/wrong) vs **Agent B** (LLM writes SQL, SQLite executes, exact). React redesign:
"the Guesser" vs "the Formula Writer," six views, Okabe–Ito color-blind-safe palette.
Measured on real Bedrock: **A 0/10 exact (179K–442K spread), B 10/10 exact.** Key insight:
B writes *different* SQL than canonical yet lands the same exact answer.

How it maps onto this curriculum, and why there:

- **W2 L1 ("Why it guesses") → Agent A, 5 live runs.** The scatter of 5 different confident
  wrong products is Agent A behavior, captured from a real run and replayed seeded (P8) so
  the puzzle is reproducible. This is the engine's cheapest, highest-impact appearance: the
  "Guesser" scattering is the whole motivation for the ladder.
- **W2 L3 (calculator) & W3 (lookup) → the A-vs-B contract in miniature.** Routing the
  math/lookup step through a tool IS the move from Agent A to Agent B, shown on a tiny board
  before the learner meets the full engine.
- **W5 (Have AI Build the Tool) → the engine runs live, as the backbone.** The learner's
  spec form becomes the build prompt; the generated tool is the **Formula Writer (Agent B)
  writing SQL that SQLite executes** against seed-42 data. The deterministic check is
  **value-equality against the canonical SQL answer**, NOT SQL-text equality — this is
  exactly Jeff's insight (B's different SQL, same exact total) turned into the grading rule,
  so a correct-but-differently-written tool still goes green.
- **W5–W6 case sets → the seeded dataset's natural edges.** Empty month, refund/negative
  amount, year-boundary, single-order weekday are all expressible over seed 42, giving
  reproducible boundary/adversarial cases with no live-model flakiness in the *check*.
- **W6 (false green / re-direct) → A-vs-B as the teaching contrast.** The false green is an
  Agent-A-style tool that eyeballs and happens to match one case; strengthening the check and
  re-directing pushes it to a B-style executed answer.
- **Capstone → the engine end-to-end** on a held-out metric over the same data.

Integration contract (what the engine must expose to the puzzle layer):

1. **Seeded replay for demo rungs** (W2 L1): a frozen capture of N Agent-A runs so the
   scatter is identical every play (reproducibility constraint). The mock provider already
   supports deterministic replay; use it for all demo rungs.
2. **A safe runner for built tools** (W5+): the AI-engineer review flags this as the hardest
   component. Scope it down to a **whitelisted, pure surface — read-only SQL (SELECT only)
   over the seeded SQLite, no I/O, no network, time/row limits**. The learner never gets
   arbitrary code execution; Agent B emits SQL, the runner executes `SELECT`-only against the
   seed DB. This makes "AI writes the actual tool" true and safe without an untrusted-code
   sandbox.
3. **Value-equality grader** over the canonical answer per case (not text match).
4. **Latency/error channel** (P10): the SSE stream distinguishes "model generating,"
   "runner executing," and "runner error" so the UI can render the gray not-your-fault lane.
5. **Check-before-output gate** (P7): the API accepts and locks the learner's check before
   it streams the tool's output, and logs the ordering as C10 evidence.

Everything in Worlds 1, 4, and 7 is seeded (no live model) so the engine's cost/latency only
appears where it earns its keep (W2 demo, W3 demo, W5, W6, capstone).

---

## 5. Held-out transfer tasks (the "boss" / certification layer, P15)

Per-level greens are **formative** and labeled so. A world is only cleared by its **boss** —
a held-out transfer task in a domain/shape the learner did not train on, scored on the
authored artifacts (did the check catch the planted bad case? did the tiering match the key?),
never on merely reaching green. Each boss carries a hidden good/bad seed pair the learner
never sees before submitting (assessment C3/C4 anti-gaming).

| World | Boss transfer task | Held-out element | Pass criterion (deterministic) |
|-------|--------------------|------------------|--------------------------------|
| W1 | Shape a help-desk **ticket** (new domain) | unseen domain + fields | schema rejects a planted malformed ticket; required/list fields correct |
| W2 | Triage a **clinic monthly note** | new domain; a plausible fabricated count | every un-knowable claim tagged; right-answer steps routed; fabricated count flagged |
| W3 | Answer from a **shipping-rate table**; target not in it | new source + missing-value | tool returns "not in source," never a rate; grounded answer cites the row |
| W4 | Author a check for "refund promised without a ticket #" | hidden good/bad seed pair | authored check PASSES hidden good, FAILS hidden bad; not vacuous |
| W5 | Build "avg order value per weekday" tool | hidden case set (boundary+adversarial) | tool == canonical on all hidden cases incl. single-order day + refund |
| W6 | Fix a tool with a **planted false green** (timezone edge drops rows) | hidden failing dimension | learner exposes false green, re-directs w/o overfit, adds passing adversarial case |
| W7 | Risk-tier a **loan-approval assistant** | new high-stakes workflow + hidden expert key | eligibility calc + rate lookup hard-gated; subjective step → human review |

### Final capstone (C14 — cross-domain certification)
A novel, unscaffolded, **cross-domain** task the learner has never seen (e.g., a volunteer-
shift scheduler, deliberately far from sales/billing/clinical). The learner must, end to end
and unaided:

1. **Name the guess** — identify where the AI will fabricate (C2).
2. **Route right-answer steps to tools** and ground factual ones (C3, C4).
3. **Author a two-sided check** before seeing output (C7, C10), check-before-output enforced.
4. **Direct the AI to build the tool** on Jeff's safe runner (C8).
5. **Prove on a hidden case set** with a boundary and an adversarial case (C9).
6. **Expose and fix a planted false green / failing case** without overfitting (C11, C12).
7. **Risk-tier the whole workflow** against a hidden expert key (C13).

**Certification is granted only on the capstone + a majority of world bosses**, never on
formative greens (P15). Scoring is on authored artifacts via deterministic checks and expert
keys; **no LLM decides pass/fail** anywhere (hard constraint). The one-sentence rationales
(W7, capstone) are retained for human review but do not gate the automated result.

**Transfer-validity caveat (assessment lens, honored):** the product must NOT claim "predicts
real-world performance" until a cohort has been run through the ladder and measured on tasks
in a *different domain* than training, with the correlation reported. Until that study exists,
product copy says "builds the skill," not "predicts on-the-job transfer."

---

## 6. Build-order recommendation (de-risk the keystone first)

Per the adult-learning and UX reviews, the first thing to build and user-test is **not** the
W5 workshop hinge but **World 4 L4 (author a two-sided check), both skins** — a non-technical
user defining a check, seeing it catch a planted bad case, red→green, with the vacuous-check
detector live. If real users can't clear W4 L4, the ladder above it is unreachable and the
course must adapt there. Build order: **W4 L4 → W1 (first-win on-ramp) → W2 L3 (adopt the
prototype) → W5 L1 (prove the engine hinge) → fill the rest.**
