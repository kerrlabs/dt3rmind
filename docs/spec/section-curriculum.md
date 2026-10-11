# Section: Curriculum — the rewrite-the-ask ladder (v0.2)

Product: **Puzzle Ladder** — a chess.com-puzzle / Duolingo-level-up learning tool that
takes non-technical adults from "ask the AI nicely and hope" to "ask the AI for tools and
checks that make the right-answer steps exact — and prove it."

Owner thesis (do not dilute): **determinism comes from the tools you force the AI
through, not the words you give it.** The AI stays a guesser; each *step* becomes exact
once a tool owns it. "Don't let it guess the part that has a right answer."

**v0.2 change (binding, per SPEC §10):** every level is now a **real prompt rewrite**. The
learner runs the obvious prompt, watches it fail, adds *moves* (and tempting *tricks*) that
rewrite the ask, sees the deterministic consequence of each combination, and leaves with a
copy-paste pattern for their own AI. In-game tool buttons, clause palettes and board clicks
from v0.1 are replaced by move chips (practice levels) and free-text asks (W5+ and every
boss). The two working prototypes — `level-2-ask-for-the-tool.html` (W2 L3) and
`world-4-ask-for-the-check.html` (W4 L4) — are the reference implementation of this loop;
every level below is specified to their level of concreteness.

Where this file conflicts with SPEC.md, **SPEC.md wins**. SPEC §3 (moves + tricks), §4
(core loop), §5 (ladder), §8 (assessment) and §10 (reconciliation) are binding here.

This section delivers: §0 principles · §1 competencies C1–C14 + move map · §2 world map ·
§3 every level fully specified · §4 Jeff's engine slots · §5 bosses + capstone · §6
misconception→level map · §7 build order and prototype reuse.

---

## §0. Design principles (every level honors these)

Carried forward from v0.1 and still valid:

- **P1 — Lead with a win, then run the failure.** The learner succeeds inside 3 minutes
  (W1 L1 is a guaranteed first win). AI failure is a demo the learner *runs* ("ask it 5
  times, watch it scatter"), never a wall their attempt hits.
- **P2 — A check only counts once it has been SEEN FAILING.** Where a level involves a
  check, the engine will not credit a pass unless the check (or the "prove it can fail"
  move) was observed going red on a planted bad case. This is the vacuous-check guard,
  the thesis applied to the course itself.
- **P3 — Two-sided only.** A real check passes the good case AND fails the bad case. A
  check that passes both ("output is non-empty", "friendly tone") is rejected as vacuous.
- **P4 — Teach "make it checkable" first; save the word "determinism" for W7.** W1–W6
  teach verifiability. W7 is where the learner decides which steps deserve a hard gate.
  Non-technical copy never says "the AI can't be wrong" — it says "wrong answers get
  caught."
- **P5 — One green is a smoke test, not proof.** Proof is a small case set with a boundary
  case and an adversarial case. "Prove it" levels run 3+ cases.
- **P6 — The keystone (asking for a check) gets its own mini-ladder:** spot a check that
  can't fail → pick the stronger check request → fix a check request that lets a bad one
  through → write the full ask with "prove it can fail." This is W4 and it is user-tested
  first.
- **P8 — Pin the failure for reproducibility; live model only once the loop is proven.**
  W1–W4 use recorded AI outputs (one capture per outcome class), so a puzzle is never
  flaky or unsolvable. Jeff's live engine appears as a demo in W2 and runs for real from
  W5.
- **P9 — Pace is designed.** W1–W4 are fast chip-puzzles (instant greens). W5–W7 are the
  workshop: free-text asks, model latency, a real runner. W5 L1 is an explicit "you're
  entering the workshop" beat with a labeled spinner and a "this wait is the model
  thinking, not you failing" affordance.
- **P10 — Separate "your check failed" (the point) from "the system failed" (not your
  fault).** Runner timeouts and environment errors render in a neutral gray lane, never
  red; red is a genuine check failure.
- **P11 — Hints are a 3-step ladder: nudge → show the gap → name the moves.** Exactly 3
  hints per level. Using the third hint caps the level at ★★ but never blocks the green.
- **P14 — Two skins, one objective.** Every move and criterion carries plain-English text
  AND technical-skin text; the outcome model and the ground-truth grader are identical
  across skins. The technical skin shows code; the plain skin shows formulas/plain rules.
- **P15 — Formative vs. summative are separated.** Per-level passes are practice. A world
  is cleared only by its boss (held-out domain, free-text ask); certification needs the
  capstone plus a majority of bosses.

New in v0.2 (the rewrite-the-ask rails):

- **V1 — Every level is a real prompt rewrite.** The learner edits an ask, not a board.
  The full prompt they would paste renders live as chips are added.
- **V2 — Every distinct wrong move-combination has its own recorded consequence and
  one-sentence lesson.** Not "wrong, try again" — the specific thing that combination
  produces (a formula it never ran; a checker that can't fail; a false green) with a
  feedback line that names *why*.
- **V3 — Pass = the result is right AND the AI's report matches reality.** A
  correct-looking report that isn't true is a FAIL (the false-green class). Graded by a
  deterministic ground-truth grader, never by an LLM.
- **V4 — Tricks are disproven by consequence, not by lecture.** Popular prompt advice
  ("be careful", "you are an expert", "think step by step", "remind it of the rules",
  "make sure it's perfect") sits next to the real moves and produces a visible, specific
  non-result.
- **V5 — Every level ends with "Try it in your AI":** a copy-paste template plus one line
  each for ChatGPT (runs code), Copilot in Excel (formula/checker in a cell), and a chat
  AI that can't run code ("ask for the formula/checker and run it yourself; never accept
  'I checked, they all pass'").
- **V6 — Chips in practice levels; free-text asks from W5 and in every boss.** The
  *outcome* is graded by ground truth in both; no LLM ever reads the prompt to decide
  pass/fail.
- **V7 — "Who did the math" is stated in every result** ("the AI (guessing)" vs. "the
  spreadsheet" / "the tool"). That one label carries the thesis.

---

## §1. Competencies C1–C14

IDs are canonical (SPEC §10). Reworded to "gets the AI to…" behaviors where the v0.2 loop
changed what the learner does.

| ID | Competency (observable behavior) | Primary world |
|----|----------------------------------|---------------|
| C1 | **Shapes the answer:** gets the AI to return a fixed format (named fields, a list, a required field) so output is checkable by structure. | W1 |
| C2 | **Spots the guess:** flags, in confident AI prose, the specific claims the AI could only be guessing (math, counts, dates, facts it was never given). | W2 |
| C3 | **Routes a right-answer step to a tool:** gets the AI to produce the tool (formula/script/query) for a step that has one right answer, and to run it, instead of guessing the answer. | W2, W3 |
| C4 | **Grounds a factual claim:** forces the answer to come only from a named source and gets the AI to say "not in the source" instead of inventing. | W3 |
| C5 | **Recognizes a real check:** tells a falsifiable pass/fail check from a vacuous one that can't go red. | W4 |
| C6 | **Repairs a weak check:** tightens a check-request that passes a bad output until it fails that output. | W4 |
| C7 | **Authors the full check ask:** gets the AI to write a checker, prove it can fail on a bad example, run it on everything, and show it. | W4 |
| C8 | **Directs a tool-build from a spec:** describes a tool (inputs, output, one rule) precisely enough that the AI-built tool is right on an input the learner specifies. | W5 |
| C9 | **Proves with a case set:** verifies against several cases including a boundary and an adversarial one, not a single happy path. | W5, W6 |
| C10 | **Checks before trusting:** commits the success check BEFORE seeing the AI's output; reads a green as "my check held," not "the machine said yes." | W5, W6 |
| C11 | **Re-directs on failure:** localizes which case failed and fixes the rule WITHOUT loosening the check or overfitting the one case. | W6 |
| C12 | **Detects the false green:** spots a tool that passed because the check was too weak, and strengthens the check. | W6 |
| C13 | **Risk-tiers:** on an unseen workflow decides which steps need a hard gate vs. a heuristic vs. a human review, justified by the cost of being wrong. | W7 |
| C14 | **Transfers:** on a novel cross-domain job with a free-text ask, runs C2→C13 end to end unaided. | Capstone |

### Competency → move map (SPEC §3)

| Competency | Moves it recruits |
|---|---|
| C1 | M1 (name the shape) |
| C2 | — (the "spot it" judgment that motivates M2) |
| C3 | M2 (ask for the tool), M3 (make it run the tool), M4 (show me the work) |
| C4 | M5 (pin the source) + M2/M3 |
| C5 | M6 (ask for the check), read against a bad case |
| C6 | M6 (tighten the check request) |
| C7 | M6 (ask for the check first and prove it can fail), M4 (show me the work) |
| C8 | M2 + M1 (spec = shape of the tool) |
| C9 | M6 (prove it) across a case set |
| C10 | M6 committed before output |
| C11 | M8 (point at the failure, don't loosen the check) |
| C12 | M6 + M4 (a shown check is how a false green gets caught) |
| C13 | M9 (choose where certainty matters) |
| C14 | all of M1–M9 |

---

## §2. World map

| World | Theme | Moves | Signature "just ask" failure | Competencies | Engine | Genre | Rank on mastery |
|---|---|---|---|---|---|---|---|
| W1 | Shape the Answer | M1 | A rambling answer you can't paste into a sheet | C1 | recorded | chip-puzzle | Shaper |
| W2 | Spot the Guess | M2, M3, M4 | A sum over 2,000 rows scatters 179K–442K across runs | C2, C3 | recorded + 1 live Jeff beat | chip-puzzle | — |
| W3 | Answer from the Source | M5, M2, M3 | Invents a price/policy detail that isn't in the document | C4, C3 | recorded | chip-puzzle | Tool User (W2+W3) |
| W4 | Name the Check *(keystone)* | M6, M4 | 4 of 8 drafts break a rule with no warning; then a checker that's quietly broken | C5, C6, C7 | recorded | chip-puzzle | Checker |
| — | **The Workshop seam** | — | "You've been writing the ask. Now the AI builds real tools you keep." | — | onboarding beat | — | — |
| W5 | Have AI Build the Tool | M7, M2, M6 | A one-off answer you have to re-ask every month | C8, C9, C10 | live AI + sandbox | workshop (free-text) | — |
| W6 | Prove It & Fix It | M8, M6 | Fixing a failure by loosening the check | C11, C12, C9 | live AI + sandbox | workshop (free-text) | Builder (W5+W6) |
| W7 | Decide Where It Matters | M9 | Hard-gating everything (too slow) or nothing (wrong refund sent) | C13 | mixed | judgment + free-text | Architect |
| Cap | Capstone | all | Unseen cross-domain job, free-text ask | C14 | live | workshop (free-text) | Certified Practitioner |

23 levels: W1 (3) · W2 (4) · W3 (3) · W4 (4) · W5 (3) · W6 (3) · W7 (3) + capstone.
Genre switch (P9) is at W5 L1. The move chips are the collectible; disproven tricks show
crossed out ("Busted: 'think step by step'").

---
## §3. The levels

Format per level: title · competency IDs · moves taught · The job · Naive prompt and its
recorded failure · Move chips (plain + technical text) · Sub-choices · Outcome classes
table (combination → what comes back → exact feedback line → lesson, including the pass
class) · Ground-truth grader · Pass + star rule · Hints 1–3 (exact) · "What you do
differently" line · "Try it in your AI" template + per-tool notes.

Shared conventions:
- "Attempts" counts runs in phase 2 (the rewrite phase), not the phase-1 just-ask demo.
- Star rule everywhere: **★** = passed; **★★** = passed within the attempt budget without
  the third hint; **★★★** = also included M4 "show me the work" (where the level offers
  it). Stars never gate progression or cost XP.
- Every result states **Who did the math/work** (V7). Every pass requires the AI's report
  to match reality (V3).

---

## WORLD 1 — Shape the Answer  (C1 · move M1)

Teaches that a fixed shape is what makes an answer checkable. No AI math failure yet — the
learner banks a win first (P1). Recorded engine. Each level's chips are "what to add to
your ask" to pin the shape.

### W1 L1 — "The receipt" *(the 3-minute first win)*
- **Competency:** C1 · **Moves:** M1
- **The job:** You pasted a coffee order into your AI and asked it to "summarize this
  order." You need to drop the result into a spreadsheet with columns **item · size ·
  price**. Data preview: a one-line order — *"one large oat latte, four fifty."*
- **Naive prompt:** `"Summarize this coffee order."`
  **Recorded failure:** a friendly paragraph — *"Sure! You got a large oat latte, and that
  comes to four fifty. Enjoy!"* You can't paste a sentence into three columns, and "four
  fifty" is words, not a number.
- **Move chips:**
  | id | real? | plain text | technical text | label |
  |---|---|---|---|---|
  | shape | ✓ | "Answer in exactly this format: item, size, price — one value each." | "Return JSON with exactly these keys: item (string), size (string), price (number)." | Name the shape |
  | price_num | ✓ | "Write price as a number like 4.50, not words." | "price must be a numeric type, not a string." | Make price a number |
  | polite | ✗ | "Please make it nice and friendly." | "Please make it nice and friendly." | Make it friendly |
  | expert | ✗ | "You are an expert barista." | "You are an expert barista." | You are an expert |
- **Sub-choices:** none.
- **Outcome classes:**
  | Moves chosen | What comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | none / only tricks | paragraph; price = "four fifty" | "**Still a sentence.** 'Friendly' and 'expert' changed the words, not the shape. You still can't paste this into three columns." | Tone doesn't make an answer checkable. |
  | shape, no price_num | 3 fields, but price = "four fifty" | "**Almost — the shape is right, but price is still words.** A column of 'four fifty' can't be summed. Pin price to a number." | A field being present isn't the same as being usable. |
  | shape + price_num (**pass**) | `item: oat latte · size: large · price: 4.50` | "**That's a receipt.** Three named fields, and a price you can add up. You could paste this straight into a sheet." | A fixed shape is what makes an answer checkable. |
- **Ground-truth grader (deterministic):** output has exactly the fields {item, size,
  price} AND `price` parses as a number. (Planted bad seed: `price:"four fifty"` → RED
  first, so the learner sees the check go red before green — P2.)
- **Pass + stars:** pass = grader green. ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a (no
  show-the-work move here) — W1 L1 awards ★★ max by design to keep the first win fast;
  surfaced as "two of two" so it doesn't read as a miss.
- **Hints:** 1) "A receipt always lists the same few things. What are they?" 2) "The AI
  gave you the words but not the shape. Which chip asks for item, size and price as
  separate values?" 3) "Add **Name the shape** and **Make price a number**. Leave the
  friendly/expert chips out."
- **What you do differently:** *Naive:* "Summarize this order" → a sentence you can't
  check. *Rewrite:* "Answer in exactly this format…" → three fields you can paste and add.
- **Try it in your AI:**
  > "Give me the answer in exactly this format: [field 1], [field 2], [field 3] — one value
  > each. Write any amount as a number like 4.50, not words."
  - **ChatGPT:** paste your text, it returns the fields; ask for a table and copy it.
  - **Copilot in Excel:** ask it to put each field in its own column so you can total price.
  - **Chat AI that can't run code:** still works — a shape is just how you tell it to
    answer; copy the fields into your sheet.

### W1 L2 — "One shape, many orders"  *(C1 generalization · M1)*
- **The job:** The same receipt shape has to handle 3 orders, including one with **two
  items** (*"a latte and a muffin, nine twenty-five"*).
- **Naive prompt:** `"Use the same format for these three orders."`
  **Recorded failure:** order #2 comes back with `item: "latte and muffin"` — two things
  jammed into one value, so you can't price them separately.
- **Move chips:**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | list | ✓ | "When an order has more than one item, make item a list, one entry per item." | "item should be an array of strings when there are multiple items." | Make item a list |
  | shape | ✓ | "Keep the same three fields for every order." | "Same keys on every object." | Same shape every time |
  | careful | ✗ | "Be careful with orders that have more than one item." | "Be careful with multi-item orders." | Be careful |
- **Outcome classes:**
  | Moves | Comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | shape only / careful | #2 item = "latte and muffin" | "**One slot, two items.** 'Be careful' didn't give the AI anywhere to put the second item. The shape has to allow more than one." | A warning isn't a structure. |
  | list (+ shape) (**pass**) | #2 item = ["latte","muffin"], each priced | "**The shape bends without breaking.** A list holds one item or many, so every order fits the same three columns." | Design the shape for the hard case, not the easy one. |
- **Grader:** every order parses with fields {item, size, price}; multi-item order's `item`
  is a list of length ≥2; each item has a numeric price. Planted bad seed: #2 as a joined
  string → RED.
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "What happens when someone orders two things at once?" 2) "Order #2 came
  back as one glued-together value. Which chip lets one field hold more than one thing?"
  3) "Add **Make item a list**."
- **What you do differently:** *Naive:* "same format" → two items glued together. *Rewrite:*
  "make item a list when there's more than one" → every order fits.
- **Try it in your AI:**
  > "Use this format for all of them. When a field can have more than one value, make it a
  > list so nothing gets glued together."
  - **ChatGPT:** ask for all rows in one table; a cell with "a; b" means it ignored the list.
  - **Copilot in Excel:** ask for one row per item so each has its own price.
  - **Chat AI that can't run code:** eyeball order #2 — if two items share one cell, re-ask.

### W1 L3 — "The field that must be there"  *(C1 constraint · M1)*
- **The job:** Make `price` **required**, so an order can never come back silently
  priced-unknown.
- **Naive prompt:** `"Make sure every order has a price."`
  **Recorded failure:** on the item it's unsure about, the AI quietly drops `price`
  altogether and the paragraph still reads fine — the gap is invisible until you try to
  total the column.
- **Move chips:**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | required | ✓ | "price must be filled on every item. If it's unknown, say 'unknown', never leave it blank." | "price is a required field; emit a placeholder, never omit the key." | Make price required |
  | shape | ✓ | "Keep item, size, price on every item." | "All three keys on every object." | Same shape every time |
  | perfect | ✗ | "Make sure it's perfect." | "Make sure it's perfect." | Make it perfect |
- **Outcome classes:**
  | Moves | Comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | shape only / perfect | one item has no price field | "**It dropped the price and told you nothing.** 'Perfect' is a wish, not a rule. A missing field is the one you never notice." | A silently missing field is the dangerous one. |
  | required (+ shape) (**pass**) | every item has a price or an explicit "unknown" | "**No silent gaps.** Now a missing price shows up as 'unknown' instead of just vanishing, so you'd catch it." | 'Required' turns an invisible miss into a visible one. |
- **Grader:** `price` present on every item; a planted unsure item returns "unknown"
  rather than omitting the key. Planted bad seed: price key dropped on one item → RED.
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "Which field would hurt most if it quietly went missing?" 2) "One item
  came back with no price at all — and nothing warned you. Which chip forbids that?" 3)
  "Add **Make price required** so an unknown price shows up instead of disappearing."
- **What you do differently:** *Naive:* "make sure every order has a price" → one silently
  dropped. *Rewrite:* "price is required; say 'unknown' if you don't know" → the gap shows.
- **Try it in your AI:**
  > "This field is required on every row. If you don't know it, write 'unknown' — never
  > leave it out."
  - **ChatGPT:** scan the column for blanks; a blank means it ignored "required".
  - **Copilot in Excel:** add a rule that flags empty cells in that column.
  - **Chat AI that can't run code:** count the rows and the prices — if they don't match,
    one went missing.

**World 1 boss → §5.**

---

## WORLD 2 — Spot the Guess  (C2, C3 · moves M2, M3, M4)

Build the model of *how* AI fails, then teach the move that fixes it: route the
right-answer step to a tool. Jeff's engine appears here — recorded for the demo rungs, one
**live** beat in L3 (SPEC §5). L3 is the existing prototype `level-2-ask-for-the-tool.html`.

### W2 L1 — "Why it guesses" *(pre-C2, model-building, formative-only · no new move)*
- **The job:** Press "Ask the AI the same hard sum 5 times." Watch 5 different confident
  answers appear for one unchanged question. Data: `6,847 × 2,913`.
- **Naive prompt:** `"What is 6,847 × 2,913?"` (run 5×)
  **Recorded failure:** five different products, each stated confidently (seeded from a
  real run so they're realistic but reproducible). None is right.
- **Move chips:** none — this rung's only control is a single checkbox: **"I see — it's
  guessing, not calculating."** Checking it unlocks L2.
- **Outcome classes:**
  | Action | Comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | run 5× | 5 different wrong products | "**Same question, five answers.** The AI is predicting what a product *looks like*, not multiplying. Asking again just rolls the dice again." | The AI guesses; it does not compute. |
  | check the box (**pass**) | — | "**Exactly.** Now you'll learn the move that takes the math out of its hands." | — |
- **Grader (meta, labeled demo):** the 5 answers are not all equal (trivially true by
  seed). Shown explicitly as a **demo, not a graded check**, with a one-line callout: "see
  how this 'check' can't go red? That's a bad check — you'll learn to spot those in World
  4." (Turns the one unavoidable vacuous check into a teaching moment.)
- **Stars:** formative only — no stars, labeled "warm-up." Who did the math: **the AI
  (guessing)**.
- **Hints:** 1) "Did it give you the same answer twice?" 2) "Look at the last three digits
  of runs 2 and 4 — they don't match." 3) "There's nothing to fix here yet. Check the box;
  the next level gives you the move."
- **What you do differently:** *Naive:* ask again, hope. *Rewrite (next level):* stop
  asking it to do the math at all.
- **Try it in your AI:**
  > Ask your AI a long multiplication (like 6,847 × 2,913) three times in a row. If the
  > answers differ, you've just watched it guess.
  - **ChatGPT:** without its code tool on, it will often differ. Turn code on and the
    answers lock — that's the preview of World 2's move.
  - **Copilot in Excel:** `=6847*2913` in a cell is always exact — that's the contrast.
  - **Chat AI that can't run code:** expect it to differ. That's the whole point.

### W2 L2 — "Highlight the guess" *(C2 · no new move; names what M2 will fix)*
- **The job:** An AI answer is shown: *"Our Q3 revenue was $412,000 across 1,208 orders,
  up 14% from Q2."* Tap the **three** claims the AI could only be guessing — the numbers it
  would have to compute from data it was never given.
- **Naive prompt:** (none — a judgment rung). The paragraph is the AI's unprompted output;
  the four "safe" fragments are the brand name, the quarter label, "revenue", "orders".
- **Move chips:** tap-to-tag. Plain skin: tap a sentence fragment to mark it "needs a
  source/tool." Technical skin: tag each claim `{computed | retrieved | opinion | given}`;
  the grader requires the computed ones tagged `computed`.
- **Outcome classes:**
  | What the learner tagged | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | tagged ≤2 of the 3 computed claims | — | "**You let a guess through.** '$412,000', '1,208 orders' and 'up 14%' are all numbers the AI would have to *calculate*. It was handed none of the data to do that." | Confident numbers are the guesses to catch. |
  | over-tagged (tagged ≥2 safe claims too) | — | "**Too wide.** The brand name and the quarter aren't guesses — they were given. Flag only what the AI had to compute." | Not everything is a guess; aim at the computed claims. |
  | tagged exactly the 3 computed, ≤1 safe (**pass**) | — | "**You spotted all three guesses.** Every one is a number that needs a tool or a source. Next, you hand them off." | A right-answer number without a tool is a guess. |
- **Grader:** learner tagged ≥ the 3 planted un-knowable claims AND tagged ≤1 of the 4 safe
  claims (two-sided: catches misses and over-tagging). Item bank rotates across plays so
  brute-clicking scores against a random baseline (anti-gaming).
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "Which of these numbers would the AI have to *calculate* to know?" 2) "The
  brand name and the quarter were given to it — dim those; what's left is computed." 3)
  "The three guesses are the dollar total, the order count, and the percent change."
- **What you do differently:** *Naive:* read the confident paragraph and believe the
  numbers. *Rewrite (next level):* mark every computed number and route it to a tool.
- **Try it in your AI:**
  > When the AI gives you numbers, ask yourself: was it handed the data to compute this, or
  > is it guessing? Reply "Which of these numbers did you calculate vs. look up?"
  - **ChatGPT:** ask it to label each number "calculated" or "given" — it often admits it
    guessed.
  - **Copilot in Excel:** any number it states that isn't a cell/formula result is a guess.
  - **Chat AI that can't run code:** treat every total, count or percentage as unverified
    until a tool produces it.

### W2 L3 — "Ask for the tool, not the answer" *(C3 · M2, M3, M4 — THE PROTOTYPE)*
- **Competency:** C3 · **Moves:** M2 (ask for the tool), M3 (make it run it), M4 (show the
  work). **Reuse `level-2-ask-for-the-tool.html` verbatim** — board/flow/scatter/shake/
  stars/compare/try-it beats, moves, outcome model and template are the canonical spec.
- **The job:** Your manager asks *"What was West region revenue in Q3?"* over a 2,000-row
  `sales.csv`. Preview: order_id · date · region · category · revenue (4 rows shown, "…
  1,996 more"). True answer: **227,421.36**.
- **Naive prompt:** `"Here's my sales data. What was West region revenue in Q3?"`
  **Recorded failure:** 5 asks → 5 different numbers (179K–442K spread, Jeff's real data),
  none right, nothing to check. Who did the math: **the AI (guessing)**.
- **Move chips (exact text from the prototype):**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | tool | ✓ | "Don't calculate it yourself. Write a spreadsheet formula that adds up revenue where region is West and the date is in Q3." | "Don't calculate it yourself. Write a pandas script that filters region == 'West' and Q3 dates, then sums revenue." | Ask for a formula, not the number |
  | run | ✓ | "Run the formula on my file and give me the result it produces." | "Execute the script on sales.csv and report the value it outputs." | Make it run the formula |
  | show | ✓ | "Show me the formula so I can check it." | "Show me the code so I can review it." | Show me the formula |
  | care | ✗ | "Please be very careful and double-check your math." | (same) | Be careful, double-check |
  | steps | ✗ | "Think step by step." | (same) | Think step by step |
  | expert | ✗ | "You are an expert data analyst." | (same) | You are an expert |
  | just | ✗ | "Reply with just the number." | (same) | Just the number |
- **Sub-choices:** none.
- **Outcome classes (the prototype's `outcome()` function, exact feedback):**
  | Moves | Comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | naive / only "just the number" | 5 scattered wrong numbers | "**Nothing changed.** 'Just the number' makes it shorter, not right. Add a move that changes *who does the math*." | Brevity isn't accuracy. |
  | any trick(s), no tool | 5 numbers, closer, still scattered | "**Closer, but still guessing.** 'Be careful', 'think step by step' and 'you're an expert' change how the AI *talks*, not who does the math. Which move takes the math out of its hands?" | Tricks change the voice, not the calculator. |
  | tool, no run | a formula + "the total is about 231,880" | "**Half-way there.** You got a formula, but the AI *still guessed* the total instead of running it. Getting a formula isn't enough — something has to **run** it." | A tool nobody runs is still a guess. |
  | tool + run (**pass**) | same exact 227,421.36 on all 5 runs | "**Same exact answer, 5 out of 5.** The AI didn't get better at math — you asked it for a tool and had the tool do the math." (+ if show: "Runs used two different formulas and got the identical number.") | The tool does the math; the AI only writes it. |
- **Grader:** `distinct answers == 1 AND all 5 == 6847×2913-style exact total (227,421.36)`.
  Who did the math flips to **the spreadsheet** only in the pass class.
- **Pass + stars:** pass = one answer, exactly right, 5/5. ★★ in ≤2 attempts, no 3rd hint.
  ★★★ also includes **show** (M4).
- **Hints (exact, from the prototype):** 1) "Who does the adding up in your current ask? If
  the answer is 'the AI', your rewrite needs to change that." 2) "Spreadsheets add up 2,000
  rows perfectly every time. The AI is good at *writing* formulas. What if you asked for the
  formula instead of the number?" 3) "Add **Ask for a formula, not the number** and **Make
  it run the formula**. Leave the politeness tricks out — they don't change who does the
  math."
- **What you do differently:** *Naive:* "What was West Q3 revenue?" → 5 different wrong
  numbers, nothing to check. *Rewrite:* "write a formula, run it, show it" → identical exact
  answer every run, and a formula you can reuse next quarter.
- **Try it in your AI (exact template):**
  > "Don't calculate this yourself. Write a spreadsheet formula that [what you need, e.g.
  > adds up revenue where region is West in Q3]. Run it on my file and give me the result it
  > produces. Show me the formula so I can check it."
  - **ChatGPT:** upload the file. It writes and runs code itself, so "run it" really happens.
  - **Copilot in Excel:** ask for the formula, then put it in a cell. Excel does the math.
  - **Chat AI that can't run code:** ask for the formula only, then paste it into your
    spreadsheet yourself. Never take its number.
- **Live Jeff beat:** after the pass, an optional "see it on a real model" button runs
  Jeff's Agent A vs Agent B live on seed-42 data (A scatters, B's SQL executes exact) — the
  *puzzle* already passed on recorded data, so a live hiccup never blocks the green (P8/P10).

### W2 L4 — "Right-answer or open?" *(C3 judgment · M2, foreshadows M9)*
- **The job:** Five steps of a weekly report are listed. Decide which to hand to a tool and
  which to leave to the AI: (1) compute the revenue total; (2) write a friendly subject
  line; (3) count overdue invoices; (4) suggest a discount %; (5) look up today's date.
- **Naive prompt:** `"Do all five of these for me."`
  **Recorded failure (demo):** the AI does all five itself and gets the three right-answer
  ones wrong — a scattered total, an off-by-two invoice count, yesterday's date.
- **Move chips:** per step, tap **"has one right answer → tool"** or **"open → leave to the
  AI."** Plain skin: two bins. Technical skin: annotate each step `deterministic: true/false`
  and attach a tool id.
- **Outcome classes:**
  | Choice pattern | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | left a right-answer step (total / count / date) to the AI | that step comes back wrong | "**You left a right-answer step to the guesser.** The total, the invoice count and today's date each have exactly one correct value — those go to a tool." | A step with one right answer is never the AI's job. |
  | routed an open step (subject line / discount) to a tool | tool can't produce it / rejects it | "**Over-tooled.** A friendly subject line has no single right answer — a calculator can't write it. Not every step needs a gate." | Don't gate the open steps; it just slows you down. |
  | 3 right-answer → tools, 2 open → AI (**pass**) | each step handled by the right owner | "**Right owner for each step.** The three exact steps go to tools; the two judgment steps stay with the AI. That's the whole game — and it's how World 7 thinks about a whole workflow." | Match the owner to whether the step has one right answer. |
- **Grader:** the 3 right-answer steps are binned to tools AND the 2 open steps are left to
  the AI (two-sided — binning the subject line to a tool fails too). Planted bad seed:
  everything routed to tools → RED (teaches over-tooling fails).
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "If two careful people did this step, would they get the exact same answer?
  If yes, it's a tool step." 2) "The total and the invoice count are clearly tool steps —
  that leaves three. Which of those three is also exact?" 3) "Today's date is a lookup → a
  tool. The subject line and the discount are judgment → leave them to the AI."
- **What you do differently:** *Naive:* "do all five" → the exact ones come back wrong.
  *Rewrite:* send the total, count and date to tools; leave the subject line and discount to
  the AI.
- **Try it in your AI:**
  > "For each step, tell me: does it have exactly one right answer? If yes, write me a tool
  > (formula/script) for it. If it's a judgment call, just do your best and say so."
  - **ChatGPT:** ask it to split the task into "needs a tool" vs "judgment" before doing any
    of it.
  - **Copilot in Excel:** the exact steps become formulas; the wording stays prose.
  - **Chat AI that can't run code:** get the formulas for the exact steps and run them
    yourself; trust its prose only for the open steps.

**World 2 boss → §5.**

---
## WORLD 3 — Answer from the Source  (C4, C3 · move M5 + M2/M3)

Catching a guess (W2) is a dead end without a move to *fix* it: force the answer to come
from a named source, and teach **abstention** — "not in the source" beats a confident
invention. Recorded engine.

### W3 L1 — "Only from the sheet" *(C4 · M5, M2, M3)*
- **The job:** *"What's the price of the oat latte?"* The AI has a 6-row menu pasted in.
  Preview: a tiny menu table (drip $3.50, oat latte $4.75, cappuccino $4.25, …). True
  answer: **$4.75**.
- **Naive prompt:** `"What's the price of the oat latte?"`
  **Recorded failure:** it answers **$5.25** — plausible, confident, and not on the menu.
  Who did the work: **the AI (guessing)**.
- **Move chips:**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | source | ✓ | "Use only the menu I pasted. Find the oat latte row and read its price. If it isn't there, say 'not on the menu'." | "Look the item up in the menu table and return that row's price; don't compute or invent." | Pin it to the menu |
  | run | ✓ | "Read the exact value from that row, don't round or estimate." | "Return the retrieved cell value verbatim." | Read the real value |
  | expert | ✗ | "You know coffee prices well." | (same) | You know coffee prices |
  | typical | ✗ | "Give a typical price for a drink like this." | (same) | Give a typical price |
- **Outcome classes:**
  | Moves | Comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | none / "typical" / "expert" | an invented price ($5.25) | "**It made up a number.** 'Typical' and 'you know prices' invite a guess. The real price is written down one row away — point it at that row." | A plausible number isn't the written one. |
  | source (+ run) (**pass**) | $4.75, from the oat latte row | "**Straight from the menu.** It read the row instead of guessing. Same answer every time, and you can see where it came from." | Pin the answer to the source and the guess disappears. |
- **Grader:** `answer == menu.lookup("oat latte").price` (exact, from the data). Planted bad
  seed: the invented $5.25 → RED.
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ also includes a "show me which row you
  used" chip (M4-flavored) — adds the citation.
- **Hints:** 1) "Where is the *real* price written down?" 2) "It answered $5.25, but that
  row isn't on the menu. Which chip forces it to read the actual row?" 3) "Add **Pin it to
  the menu** and **Read the real value**."
- **What you do differently:** *Naive:* "what's the oat latte price?" → an invented number.
  *Rewrite:* "use only the menu, read the oat latte row" → the real $4.75, every time.
- **Try it in your AI:**
  > "Use only the document I gave you. Find the exact line that answers this and read its
  > value. If it isn't in the document, say 'not in the document' — don't guess."
  - **ChatGPT:** upload the file and ask it to quote the exact line it used.
  - **Copilot in Excel:** use a lookup (`VLOOKUP`/`XLOOKUP`) so the value comes from a cell.
  - **Chat AI that can't run code:** ask it to quote the source line; if it can't quote it,
    it guessed.

### W3 L2 — "When the answer isn't there" *(C4 abstention · M5)*
- **The job:** *"What's the price of the matcha?"* — but matcha isn't on the menu. Make the
  AI say **"not on the menu"** instead of inventing a price.
- **Naive prompt:** `"What's the price of the matcha?"`
  **Recorded failure:** it confidently answers **$5.00** for an item that doesn't exist.
- **Move chips:**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | source | ✓ | "Use only the menu. Find the matcha row." | "Look matcha up in the menu table." | Pin it to the menu |
  | abstain | ✓ | "If the item isn't on the menu, answer 'not on the menu' — don't make up a price." | "If the lookup returns nothing, return 'not on the menu'; never emit a number." | Say 'not found' if it's missing |
  | helpful | ✗ | "Be helpful and give your best guess." | (same) | Give your best guess |
  | round | ✗ | "A round number like $5 is fine." | (same) | A round number is fine |
- **Outcome classes:**
  | Moves | Comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | none / "best guess" / "round number" | an invented $5.00 | "**It invented a price for an item that doesn't exist.** 'Best guess' and 'a round number is fine' are permission to make something up." | 'Helpful' without a source means 'invent'. |
  | source only, no abstain | still returns a guess when the row is missing | "**Half the move.** You pointed it at the menu, but didn't tell it what to do when the item isn't there — so it filled the gap with a guess." | Pinning the source isn't enough; name the empty case. |
  | source + abstain (**pass**) | "not on the menu" | "**The honest answer.** This is the first time a win means the AI said *less*. 'Not on the menu' is worth more than a confident wrong price." | Teaching it to say 'I don't know' is a real move. |
- **Grader:** on a missing item, `answer == "not on the menu"` and **no number is emitted**.
  Planted bad seed: $5.00 for matcha → RED.
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "What's the honest answer when the thing just isn't there?" 2) "You pinned
  it to the menu, but it still guessed — because you never said what to do on a miss." 3)
  "Add **Say 'not found' if it's missing** alongside **Pin it to the menu**."
- **What you do differently:** *Naive:* "what's the matcha price?" → an invented $5.00.
  *Rewrite:* "use only the menu; say 'not on the menu' if it's missing" → the honest answer.
- **Try it in your AI:**
  > "Answer only from the document. If the answer isn't in it, reply 'not in the document.'
  > Do not fill the gap with a guess."
  - **ChatGPT:** test it on something you *know* isn't in the file — it should abstain.
  - **Copilot in Excel:** a lookup returns #N/A when it's missing; show that instead of a
    number.
  - **Chat AI that can't run code:** if it answers a question the document can't support,
    the abstain instruction didn't take — re-ask.

### W3 L3 — "Cite it or it didn't happen" *(C4 + C3 · M5, M1)*
- **The job:** *"Which drink is cheapest, and how much?"* The answer must carry **both** the
  value and the **source row** it came from, so a reader can verify it.
- **Naive prompt:** `"Which drink is cheapest and how much?"`
  **Recorded failure:** it names a drink with no price, or pairs the right price with the
  wrong drink — *"The cheapest is the oat latte at $3.50"* (that $3.50 is the drip coffee).
- **Move chips:**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | shape | ✓ | "Answer in this format: drink, price, and which menu row it came from." | "Return {drink, price, source_row}." | Name the shape (drink, price, row) |
  | source | ✓ | "Fill all three fields from the same menu row — the price must belong to that drink." | "Bind all three fields to the one retrieved row object." | Fill it from one row |
  | min | ✓ | "Pick the row with the lowest price." | "source_row = argmin(price)." | Pick the lowest-price row |
  | confident | ✗ | "Be confident in your answer." | (same) | Be confident |
- **Outcome classes:**
  | Moves | Comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | none / "be confident" | drink and price that don't match | "**The price doesn't belong to that drink.** It stitched a cheap price onto the wrong name. 'Be confident' just made the mismatch sound sure." | A confident pair can still be mismatched. |
  | shape only, no source bind | three fields, but filled from different rows | "**Right shape, wrong wiring.** The three fields came from different places, so the price still isn't the drink's. Fill them all from one row." | A shape is only as good as where you fill it from. |
  | shape + source + min (**pass**) | drink + its real price + the row number | "**Checkable.** The price belongs to the drink, it's the lowest on the menu, and you can see the exact row. Anyone can verify it in one glance." | Cite the row and the answer verifies itself. |
- **Grader:** `price == menu[source_row].price AND drink == menu[source_row].name AND price
  == min(menu.price)` (three-way; catches mismatched pairs). Planted bad seed:
  `{oat latte, 3.50, row 1}` where row 1 is a $3.50 drip → RED.
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ also includes a "show me the row text"
  chip (M4).
- **Hints:** 1) "Does the price actually belong to the drink it named?" 2) "The three
  fields came from different rows — that's how the price ended up on the wrong drink. Pin
  them to one row." 3) "Add **Name the shape**, **Fill it from one row**, and **Pick the
  lowest-price row**."
- **What you do differently:** *Naive:* "which is cheapest?" → a mismatched price and name.
  *Rewrite:* "give drink, price and the row, all from one row, lowest price" → a cited,
  verifiable answer.
- **Try it in your AI:**
  > "Give me the answer and the exact line in the document it came from, together. The value
  > and its source must be from the same place."
  - **ChatGPT:** ask for a tiny table: answer | source line. If it can't fill the source,
    don't trust the answer.
  - **Copilot in Excel:** have the lookup return the row number too, so the source is visible.
  - **Chat AI that can't run code:** make it quote the source line next to the answer; a
    quote you can check beats a number you can't.

**World 3 boss → §5. On mastery of W2+W3 the learner ranks up to Tool User.**

---

## WORLD 4 — Name the Check  *(KEYSTONE, P6)*  (C5, C6, C7 · moves M6, M4)

The single hardest skill: getting the AI to build a check that can actually catch a bad
answer — and proving it can. A four-rung mini-ladder (SPEC §10): spot a check that can't
fail → pick the stronger check request → fix a check request that lets a bad one through →
write the full ask with "prove it can fail." Recorded engine, so attention stays 100% on
check quality. L4 **reuses `world-4-ask-for-the-check.html` verbatim.**

### W4 L1 — "Can this check even fail?" *(recognize · C5 · M6)*
- **The job:** You asked the AI to summarize an order and want to be sure the summary
  **includes the price**. Three ways to ask it to check its own work are offered. Pick the
  one request that would actually catch a summary with no price. Data: a planted garbage
  summary — *"Thanks for your order!"* (no price at all).
- **Naive prompt (the trap being examined):** `"Check that the summary includes the price."`
  — too loose; the AI reports "looks good" on the garbage summary.
  **Recorded failure:** two of the three check requests pass the garbage summary.
- **Move chips (pick one of three check requests):**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | nonempty | ✗ | "Check that the summary isn't blank." | "assert len(out) > 0" | Check it isn't empty |
  | isstring | ✗ | "Check that the summary is text." | "assert isinstance(out, str)" | Check it's text |
  | hasprice | ✓ | "Check that the summary contains a number labeled 'price'." | "assert re.search(r'price[:=]\\s*\\$?\\d', out)" | Check for a labeled price |
- **Sub-choices:** a **"try to break it"** control runs each candidate against the garbage
  summary and shows which stay green.
- **Outcome classes:**
  | Pick | Result on the garbage summary | Feedback (exact) | Lesson |
  |---|---|---|---|
  | nonempty | passes garbage | "**That check can't fail here.** 'Thanks for your order!' isn't blank, so this passes it — and it has no price. A check that says yes to garbage checks nothing." | Non-empty isn't a check. |
  | isstring | passes garbage | "**Still green on garbage.** 'Is it text?' is true of every reply, good or bad. It never says no." | A check that's always true is vacuous. |
  | hasprice (**pass**) | fails garbage, passes a real summary | "**This one can say no.** It fails the summary with no price and passes one that has it. That's the whole job of a check — to go red on a bad answer." | A real check references the thing that matters, so it can fail. |
- **Grader (meta):** learner selected the only check that **fails** the garbage seed and
  **passes** a good seed (two-sided). nonempty/isstring pass garbage → vacuous.
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a (recognition rung).
- **Hints:** 1) "A good check says NO to a bad answer. Which of these ever says no?" 2) "Hit
  'try to break it' — watch 'isn't blank' and 'is text' both pass 'Thanks for your order!'"
  3) "Only the price check looks at the thing you actually care about (a labeled price), so
  it's the only one that can fail."
- **What you do differently:** *Naive:* "check it includes the price" → the AI says "looks
  good" at garbage. *Rewrite:* ask for a check that looks for a labeled price — the one that
  can go red.
- **Try it in your AI:**
  > "Write me a check for this that would FAIL a bad answer. Then show me it failing a bad
  > example — if it can't fail, it isn't a check."
  - **ChatGPT:** ask it to run the check on an obviously-bad input first; if it stays green,
    reject it.
  - **Copilot in Excel:** a check formula should return FALSE on a bad row — test it on one.
  - **Chat AI that can't run code:** ask "what bad answer would this check still pass?" — if
    the answer is "lots", the check is too loose.

### W4 L2 — "Which check is stronger?" *(pick · C5→C6 · M6)*
- **The job:** You want the AI to **flag refunds over $100** in a list. Two non-vacuous
  check requests are offered. Pick the stronger. Data: a 5-row seed — 3 rows over $100, 2
  under (one is $40).
- **Naive prompt (the weaker request):** `"Check that it mentions a dollar amount."`
  **Recorded failure:** the weaker check passes the $40 row — a false green on a row that
  shouldn't be flagged.
- **Move chips (pick A or B):**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | mentions | ✗ | "Flag any line that mentions a dollar amount." | "assert '$' in line" | Flags any dollar amount |
  | threshold | ✓ | "Flag every line where the amount is over $100, and flag none that are $100 or under." | "assert (amount > 100) == flagged" | Flags only amounts over $100 |
- **Sub-choices:** a **test-bench** runs both against the 5-row seed and shows pass/fail per
  row.
- **Outcome classes:**
  | Pick | Bench result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | mentions | flags the $40 row too | "**False green on the $40 row.** 'Mentions a dollar amount' is true of a $40 line — so it flags one it shouldn't. Saying yes too often is as broken as saying no too rarely." | A check must say no when it should, too. |
  | threshold (**pass**) | flags the 3 over, leaves the 2 under | "**Right in both directions.** It catches every refund over $100 and leaves the small ones alone. That's a two-sided check." | A strong check is correct on good *and* bad cases. |
- **Grader (meta):** learner picked the request that fires on all over-$100 rows and on none
  of the under-$100 rows. Planted bad case: the $40 row that "mentions a dollar amount"
  wrongly passes → A's false green.
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "Does it only say yes when it should — and no when it shouldn't?" 2) "Watch
  the $40 row: 'mentions a dollar amount' flags it, but $40 isn't over $100." 3) "Pick
  **Flags only amounts over $100** — it's the one that's right on every row."
- **What you do differently:** *Naive:* "check it mentions a dollar amount" → flags a $40
  line. *Rewrite:* "flag over $100, flag none under" → correct on every row.
- **Try it in your AI:**
  > "Write a check that flags X and does NOT flag not-X. Show me it on an example of each —
  > one that should be flagged and one that shouldn't."
  - **ChatGPT:** make it run both examples; a check that flags the wrong one is too loose.
  - **Copilot in Excel:** the check column should be TRUE on the over rows and FALSE on the
    under rows — eyeball both.
  - **Chat AI that can't run code:** ask it for a borderline example and whether the check
    fires — that reveals the threshold.

### W4 L3 — "Fix the check that lets a bad one through" *(repair · C6 · M6)*
- **The job:** You asked the AI to check that *"the appointment date is in the future."* The
  check it wrote is `the answer contains a date`. A planted bad answer has a date — **in the
  past** (last year). Tighten the check request until it fails that bad answer.
- **Naive prompt (the weak check being repaired):** `"Check that it contains a date."`
  **Recorded failure:** the past-date answer passes it — the check let a bad one through.
- **Move chips (add a clause to the check request):**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | hasdate | ✓ (given) | "The answer contains a date." | "a date is present" | Contains a date *(already there)* |
  | future | ✓ | "AND the date is after today." | "AND date > today" | …and the date is after today |
  | formatted | ✗ | "AND the date looks nicely formatted." | "AND it matches a date format" | …and it's nicely formatted |
  | polite | ✗ | "AND the wording is polite." | (same) | …and the wording is polite |
- **Outcome classes:**
  | Clauses added | Result on past-date seed | Feedback (exact) | Lesson |
  |---|---|---|---|
  | none (hasdate only) / +formatted / +polite | still passes the past date | "**Your check still lets the bad one through.** The bad answer *has* a date — a nicely-formatted, politely-worded one, in the past. 'Has a date' can't be enough." | If the bad answer satisfies the check, the check isn't tight enough. |
  | +future (**pass**) | fails the past date, passes a future date | "**Now it catches it.** Adding 'after today' is what tells a good date from a bad one. It fails last year's date and passes next week's." | Tighten a check until the bad case fails it. |
- **Grader (meta):** the edited check **fails** the past-date seed AND **passes** a
  future-date seed (two-sided, P3). Un-repaired check passes the bad seed → RED on the
  meta-check ("your check let a bad one through").
- **Stars:** ★★ in ≤2 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "The bad answer has a date too — so 'has a date' can't be enough. What else
  is true of a *good* answer here?" 2) "Look again: the bad date is in the past. The check
  never looks at *when*." 3) "Add **…and the date is after today**. Skip 'formatted' and
  'polite' — they don't separate a past date from a future one."
- **What you do differently:** *Naive:* "check it contains a date" → a past date sails
  through. *Rewrite:* "…and the date is after today" → the past date fails.
- **Try it in your AI:**
  > "Your check passed this bad answer: [paste it]. That means the check is too loose.
  > Tighten it so it FAILS this one, and show me it now failing."
  - **ChatGPT:** paste the bad answer and demand the check go red on it before you trust it.
  - **Copilot in Excel:** add the missing condition (e.g. `>TODAY()`) to the check formula.
  - **Chat AI that can't run code:** ask "what is true of the bad answer that your check
    ignores?" — that gap is the clause to add.

### W4 L4 — "Ask for the check first" *(author · C7 · M6 keystone + M4 — THE PROTOTYPE)*
- **Competency:** C7 · **Moves:** M6 (ask for the check, prove it can fail, run it), M4
  (show the check). **Reuse `world-4-ask-for-the-check.html` verbatim** — drafts grid,
  per-rule marks, false-green model, criteria sub-choices, outcome classes, hints, stars,
  rank-up, compare and try-it beats are the canonical spec.
- **The job:** 8 customer emails to answer today. The AI drafts the replies. Every reply
  **must** have: a greeting · the customer's name · a clear next step. You don't have time
  to read all 8 — how do you *know* they're right? Preview: 8 customers (Maria…Sofia); the
  trap is Sofia's draft, where *"A replacement arrives next week"* looks like a next step
  but tells her nothing to do.
- **Naive prompt:** `"Draft replies to these 8 customer emails."`
  **Recorded failure:** 4 of 8 break a rule (Aisha/Chen/Lena/Sofia-style misses), the AI
  says nothing, and the only way to find out is to read all 8.
- **Move chips (exact from the prototype):**
  | id | real? | plain | technical | label |
  |---|---|---|---|---|
  | check | ✓ | "Before you write anything, write a checker that fails any draft missing [criteria]." | "Before drafting, write a Python function check(draft, customer) that returns False if the draft is missing [criteria]." | Ask for a checker first |
  | prove | ✓ | "Test the checker on a bad example first and show me it fails." | "Run check() on a known-bad draft first and show me it returns False." | Make it prove the checker can fail |
  | run | ✓ | "Then run the checker on every draft and rewrite any that fail until they pass." | "Execute check() on every draft, regenerate any that fail, and report final pass/fail." | Run the checker on every draft |
  | show | ✓ | "Show me the checker and the results." | "Show me the code and the results table." | Show me the checker |
  | remind | ✗ | "Remember: always include a greeting, the customer's name, and a next step." | (plain only) | Remind it of the rules |
  | perfect | ✗ | "Make sure every email is perfect." | (plain only) | Make sure they're perfect |
  | double | ✗ | "Double-check your work before answering." | (plain only) | Double-check your work |
- **Sub-choices — "What should the checker test?"** (fails any draft missing one):
  | id | real? | label |
  |---|---|---|
  | greet | ✓ | a greeting |
  | name | ✓ | the customer's name |
  | step | ✓ | a next step |
  | friendly | ✗ | a friendly tone *(can't be tested — passes everything)* |
  | pro | ✗ | a professional tone *(can't be tested)* |
- **Outcome classes (the prototype's `simulate()`, exact feedback):**
  | Moves / criteria | What comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | naive | 4 of 8 broken, no warning | "**4 of 8 broke a rule, and the AI didn't mention it.** Look at Sofia's: 'arrives next week' *sounds* like a next step but gives her nothing to do. Asking more nicely won't tell you which drafts are wrong." | A rule you don't check is a rule you don't know was broken. |
  | remind only | 1 still broken | "**Better, but still 1 broken, and you'd only know by reading all 8.** Telling the AI the rule isn't the same as *checking* the rule." | Reminding ≠ checking. |
  | perfect / double | confident "all perfect", isn't | "**'Make sure they're perfect' just got you a confident claim.** It said all 8 are fine. They aren't. Trying harder buys a claim, not proof." | Effort isn't evidence. |
  | check, no run | "I checked them, all pass" (didn't) | "**It wrote a checker, then said 'all pass' without running it.** A checker nobody runs is just a promise. Make it **run** the checker on every draft." | A checker that isn't run proves nothing. |
  | checker tests only tone | passes all 8, including broken | "**Your checker can't fail.** 'Friendly tone' isn't something a checker can measure, so it passed everything, broken drafts included. A check has to test something clearly there or not." | A vacuous criterion can't catch anything. |
  | checker misses a real rule | says all pass; a miss remains | "**The checker said all pass, but [name] still breaks a rule.** Your checker never tests for [missing rule]. A check only proves what it actually checks." | A check only covers what it tests. |
  | check + run, no prove (step bug) | **false green** — 8/8 "pass", Sofia wrong | "**False green.** The checker said 8 of 8 pass, but Sofia's draft has no real next step — it just looked for the word 'next', and 'arrives next week' matched. Your checker never failed anything, so nobody noticed it was broken. What move catches a broken checker *before* you trust it?" | A check never seen failing can be silently broken. |
  | check + prove + run, 3 real rules (**pass**) | 8/8 right, report honest | "**8 of 8 correct, and the AI's report matches reality.** The checker proved it could fail, caught the broken drafts, and they were rewritten. You can trust this without reading all 8." | Ask for the check first, prove it can fail, run it — then a green is real. |
- **Grader:** `(all 8 drafts have greeting+name+step) AND (the AI's claim matches reality)`.
  The "prove it can fail" move is **required** — without it the step-checker has the "next"
  bug and produces a false green, which fails V3. P2 enforced: the check must be observed
  failing the bad example.
- **Pass + stars:** pass = 8/8 right AND honest report. ★★ in ≤3 attempts, no 3rd hint.
  ★★★ also includes **show** (M4). (+15 XP "seen failing", +50 keystone; rank → Checker.)
- **Hints (exact, from the prototype):** 1) "You can't read all 8. What if the AI built
  something that reads them for you, and that you could see go wrong?" 2) "Ask for a
  **checker first** that tests the three rules, and make it **run** on every draft. Skip the
  tone rules: a checker can't measure 'friendly'." 3) "Add **Ask for a checker first**
  (greeting, name, next step), **Run the checker on every draft**, and **Make it prove the
  checker can fail**. That last one catches a checker that's quietly broken."
- **What you do differently:** *Naive:* "draft replies to these 8" → 4 broke a rule, no
  warning, read all 8 to find out. *Rewrite:* "write a checker, prove it can fail, run it on
  every draft, show it" → read one short checker instead of 8 emails.
- **Try it in your AI (exact template):**
  > "Before you write anything, write a checker that fails any [draft / summary / row]
  > missing [rule 1], [rule 2] or [rule 3]. Test it on a bad example first and show me it
  > fails. Then do the work, run the checker on every result, and redo any that fail. Show me
  > the checker and the results."
  - **ChatGPT with file or code tools:** it can write and run the checker itself, so "run
    it" really happens.
  - **Copilot in Excel:** put the drafts in a column and ask for checker formulas, e.g.
    `=ISNUMBER(SEARCH(B2, A2))` for "uses the name".
  - **A chat AI that can't run code:** it can't truly check its own work. Ask for the
    checker, then run it yourself in a spreadsheet. Never accept "I checked, they all pass."

**World 4 boss → §5. On mastery the learner ranks up to Checker. W4 L4 is user-tested
first (P6).**

---
## THE WORKSHOP SEAM  *(onboarding beat, P9)*

A full-screen beat between W4 and W5, not a graded level:
> **"You've been writing the ask. Now the AI builds real tools you keep."**
> Up to here, the AI's outputs were recorded, so a puzzle could never flake. From here the
> AI runs live: you'll type the ask in your own words (no chips), the AI writes a real tool,
> and a safe runner runs it on real data. It takes a few seconds — **that wait is the model
> thinking, not you failing.** If the workshop hiccups you'll see a gray "try again," never
> a red fail. Reds from here are your check doing its job.

From W5 on: **free-text asks** (V6). The moves become a **checklist the learner is graded
on BY OUTCOME** (ground truth), never by an LLM reading the prompt. The checklist is shown
beside the ask box as a self-check ("did your ask include: the tool? run it? a check that
proves it can fail?"), but the pass/fail comes only from the deterministic grader on the
tool's actual output. Check-before-output sequencing (P7) is enforced: the success check is
committed and locked before the AI's output is revealed.

---

## WORLD 5 — Have AI Build the Tool  (C8, C9, C10 · moves M7, M2, M6)

The payoff: a non-technical learner directs the AI to write a real, reusable tool and
proves it on a case set. Jeff's live engine runs here (§4). Latency/error affordances per
P10. Free-text asks; moves are the graded checklist.

### W5 L1 — "Describe the tool" *(workshop on-ramp · C8 · M2, M7)*
- **The job:** You need a tool that gives **total sales for any month** from the seeded
  sales data — not just this month, every month, without re-asking. Preview: the seed-42
  sales table (date · amount · …).
- **Naive ask (shown as the failing baseline):** `"What were March sales?"`
  **Live failure (Agent A, temp 0.7):** a plausible-but-wrong total from eyeballing rows
  (Jeff's measured A: 0/10 exact). Who did the math: **the AI (guessing)**.
- **Free-text ask + checklist (self-check, graded by outcome):**
  - [ ] **Ask for the tool, not the answer** (M2) — "write me a tool/formula/query, don't
    compute it yourself."
  - [ ] **Say the shape of the tool** (C8) — inputs (a month), output (one dollar total),
    the one rule (sum `amount` for rows in that month).
  - [ ] **Make it reusable** (M7) — "so I can run it for any month next time."
  - [ ] **Run it** (M3) — "run it on my data and give me the number it produces."
  - *(Tricks still available and still inert: "be careful", "you're an expert", "just the
    number".)*
- **Sub-choice (committed before output, P7/C10):** the success check — pick
  **"the total equals what the data actually sums to for that month"** (exact) vs. the
  tempting **"the total is about right"** (rejected as un-runnable).
- **Outcome classes:**
  | Ask contains | What comes back | Feedback (exact) | Lesson |
  |---|---|---|---|
  | no tool (just "what were March sales?") | Agent A's eyeballed guess | "**That's the guesser again.** You asked for the answer, so it predicted one. Ask for the *tool* that produces it." | A number without a tool is a guess, even live. |
  | tool, no shape (vague "make a tool") | a tool that sums the wrong thing / wrong column | "**The tool runs but computes the wrong thing.** You didn't say what goes in, what comes out, or the rule. A tool is only as right as the spec you gave it." | A build is only as good as its spec. |
  | tool + shape, no reuse | right for March, hard-coded to March | "**Right once, useless next month.** It built a March-only tool. Say 'for any month' so you keep it." | A one-off answer isn't a tool. |
  | "about right" check committed | — (rejected at commit) | "**That check can't run.** 'About right' has no number to compare to. Pick the exact total so a wrong answer actually fails." | A check needs a value, not a vibe. |
  | tool + shape + reuse + run + exact check (**pass**) | exact month total via Agent-B SQL | "**The tool does the math, and it's reusable.** You described it, the AI built it, the runner ran it, and it matches the data exactly — for any month you pass it." | Describe the tool well and the AI builds something you keep. |
- **Grader (value-equality, SPEC §4/§9):** `tool(month) == SELECT SUM(amount) WHERE
  month=? ` over seed 42 — **value equality, not SQL-text equality** (Agent B's different
  SQL, same exact total, still passes). Committed check must be the exact-equality one.
  Planted bad case shown first: Agent A's guess for March → RED against the committed check.
- **Pass + stars:** pass = tool's output matches the canonical total AND the learner
  committed the exact check before output. ★★ in ≤3 attempts, no 3rd hint. ★★★ also asked
  to **show the tool/SQL** (M4).
- **Hints:** 1) "What does the tool take in, and what single number should it give back?"
  2) "Pre-fill: input = a month, output = the total — now say the rule in one line." 3)
  "Say: 'add up the amount for every row in that month, for any month I give you, and run
  it.'"
- **What you do differently:** *Naive:* "what were March sales?" → an eyeballed guess.
  *Rewrite:* "build me a reusable tool: input a month, output the total, sum amount for that
  month, run it" → an exact total you can rerun for any month.
- **Try it in your AI:**
  > "Don't compute this. Build me a reusable tool: it takes [input], returns [one output],
  > by [the one rule]. Run it on my data and give me the result. I'll want to run it again
  > next month."
  - **ChatGPT:** upload the data; it writes and runs the code, and you can save the code.
  - **Copilot in Excel:** ask for a formula that takes the month from a cell, so you change
    one cell next month.
  - **Chat AI that can't run code:** ask for the formula/query and run it yourself; keep it
    for reuse.
- **Latency UX (P10):** a labeled "the AI is writing your tool…" spinner; a runner error
  renders gray ("the workshop hiccuped — try again"), never red.

### W5 L2 — "Prove it on more than one month" *(C9, C10 · M6)*
- **The job:** One green isn't proof. Run your tool against a **case set**: a normal month,
  a month with **zero** sales (boundary), and a month that includes a **refund / negative
  amount** (adversarial).
- **Naive ask:** `"Looks right, ship it."` (after one green)
  **Live failure:** the empty month returns `null`/error; the refund month counts the
  refund as positive.
- **Free-text ask + checklist:**
  - [ ] **Prove it on a case set** (M6/C9) — "run it on a normal month, an empty month, and
    a month with a refund."
  - [ ] **Say the expected value for each** — normal = canonical, empty = 0, refund month =
    net.
  - [ ] **Fix the rule, not the case** (foreshadows M8) — "if a month has no rows, return
    0; subtract refunds."
- **Sub-choice:** commit the three expected values before running (P7).
- **Outcome classes:**
  | Ask | Case-set result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | one case only ("ship it") | — (blocked) | "**One green is a smoke test, not proof.** You've tested one easy month. What happens on a month with no sales?" | Proof needs more than the happy path. |
  | 3 cases, empty expected = null | empty month red | "**The empty month broke it.** Your tool returned nothing for a month with no sales — a total of 'nothing' isn't 0. Fix the rule: no rows → 0." | A boundary case is where tools quietly break. |
  | 3 cases, refund counted positive | refund month red | "**The refund inflated the total.** A refund is a negative amount; counting it as a sale is wrong. Say 'subtract refunds' in the rule." | An adversarial case catches the wrong assumption. |
  | 3 cases, all expected, rule fixed (**pass**) | 3/3 green | "**Proven, not hoped.** Normal, empty and refund months all match. Now you'd trust it on a month you haven't seen." | A case set with a boundary and an adversarial case is proof. |
- **Grader:** `tool(normal)==canonical AND tool(empty)==0 AND tool(refund_month)==net` — all
  three green (P5). Planted bad case: empty month returns null on first build → RED chip.
- **Pass + stars:** pass = all 3 cases green. ★★ in ≤3 attempts, no 3rd hint. ★★★ also
  showed the fixed rule (M4).
- **Hints:** 1) "What should the total be for a month with no sales?" 2) "The empty-month
  chip is red — your tool returned nothing, not 0." 3) "Add to the rule: 'return 0 when
  there are no rows, and subtract any refunds.'"
- **What you do differently:** *Naive:* one green → ship. *Rewrite:* a normal, an empty and
  a refund month, each with an expected value → caught two bugs before shipping.
- **Try it in your AI:**
  > "Before we trust this, run it on three cases: a normal one, an edge case ([empty / zero
  > / boundary]), and a tricky one ([a refund / a negative / an unusual value]). Tell me the
  > expected result for each and show me all three."
  - **ChatGPT:** have it build a tiny test with the three cases and run them.
  - **Copilot in Excel:** make three test rows with known answers and check the formula on
    each.
  - **Chat AI that can't run code:** work the three cases by hand and compare — don't let it
    self-report "all fine."

### W5 L3 — "The check you can't peek past" *(C10 sequencing · M6)*
- **The job:** Decide what "correct" means **before** you see the AI's answer. Commit the
  check, lock it, then build and run. A green then means *your* check held — not "the
  machine said yes."
- **Naive ask:** `"Build it, then I'll check if it looks right."`
  **Live trap:** a tempting output that looks right but is off by a rounding error; "looks
  about right" can't catch it.
- **Free-text ask + checklist:**
  - [ ] **Write the check first and lock it** (C10) — "here's the exact number it must
    equal; don't show me the output until the check is set."
  - [ ] **Make the check exact** — a value, not "about right."
  - [ ] **Build + run against the locked check.**
- **Sub-choice (enforced order):** the ask box for the check greys out on commit; output is
  hidden until then (server-side, P7).
- **Outcome classes:**
  | Ask | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | no lock ("I'll check after") | rubber-stamps a wrong output | "**You checked after seeing the answer — so you graded to match it.** Decide what correct means first, then the answer can't talk you into it." | Peeking turns a check into a rubber stamp. |
  | "about right" check | can't catch the rounding error | "**'About right' can't run.** The output is off by a rounding error and your check waved it through. Commit the exact number." | A fuzzy check passes a precise error. |
  | exact check, locked first (**pass**) | catches the rounding error, then green on a correct build | "**Your check held.** You said the exact number first, locked it, and the first build failed it — then a fixed build passed. That green is yours, not the machine's." | Commit the exact check before you look, and a green means something. |
- **Grader:** committed check passes the built tool's output on the hidden case set, AND the
  engine logs that the check was committed **before** output time (C10 evidence). Planted
  bad case: a near-right output with a rounding error; "about right" is rejected as
  un-falsifiable.
- **Pass + stars:** pass = exact check committed-first + build passes it. ★★ in ≤3
  attempts, no 3rd hint. ★★★ also showed the check (M4).
- **Hints:** 1) "Decide what 'correct' means before you see the answer — what exact number
  must it equal?" 2) "'About right' can't be run — the rounding error slips through it." 3)
  "Commit 'the total equals [exact canonical value]', lock it, then build."
- **What you do differently:** *Naive:* build, then eyeball → you grade to match. *Rewrite:*
  commit the exact check and lock it first → a green you can trust.
- **Try it in your AI:**
  > "First, tell me exactly what the right answer must be — the precise value. Don't show me
  > your output until I've written that down. Then build it and check against my number."
  - **ChatGPT:** write your expected value in the chat first; then ask it to build and
    compare.
  - **Copilot in Excel:** put the expected value in a cell and compare the formula to it.
  - **Chat AI that can't run code:** write the expected number down before you read its
    answer; compare, don't trust.

**World 5 boss → §5.**

---

## WORLD 6 — Prove It & Fix It  (C11, C12, C9 · move M8 + M6)

The two skills that separate real verification from theater: catching the **false green**
and **re-directing** on a real failure without loosening the check. Live engine, free-text.

### W6 L1 — "The green that lied" *(C12 · M6, M4)*
- **The job:** A tool is passing its check. A new, held-out month is run — and the tool is
  wrong on it, *even though the check stayed green*. Find why the check didn't catch it and
  strengthen it.
- **Naive ask:** `"It's green, we're good."`
  **Live reality:** the tool handles the one happy month; the check only ever tested that
  month, so it never looked at the held-out one.
- **Free-text ask + checklist:**
  - [ ] **Run the check on the new case** — "run your check on this month too."
  - [ ] **Show me the check** (M4) — "show me the check so I can see what it looks at."
  - [ ] **Strengthen it so it fails here** (C12) — "add what's needed so the check goes red
    on this wrong answer."
- **Outcome classes:**
  | Ask | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | trust the green | — (held-out case still wrong, check still green) | "**The green lied.** The tool is wrong on this month, but your check never looked at it, so it stayed green. A green only covers what the check tests." | A passing check isn't a correct tool. |
  | run on new case, don't strengthen | check still green on the wrong answer | "**The check passed the wrong answer.** It doesn't test the thing that's wrong here (negative amounts). Add the clause that would catch it." | Find the dimension the check ignores. |
  | strengthen so it fails (**pass**) | previously-green case now red, then fixed | "**You exposed the false green.** Your new check goes red on the wrong answer — now it can actually catch this class of bug." | Strengthen the check until the false green turns red. |
- **Grader (meta):** the strengthened check now goes **RED** on the held-out bad case (the
  whole point — it must newly fail where it falsely passed). Planted violation: the
  held-out case itself; a green on it before strengthening is the false green.
- **Pass + stars:** pass = check now fails the held-out bad case. ★★ in ≤3 attempts, no 3rd
  hint. ★★★ showed the check (M4).
- **Hints:** 1) "The tool passed but it's wrong here — so the check never looked at this.
  What is this case doing that the check ignores?" 2) "This month has a negative amount; the
  check only tested positive months." 3) "Add 'the total must account for refunds' — then
  this case goes red."
- **What you do differently:** *Naive:* "it's green, we're good." *Rewrite:* run the check
  on a new case, see it falsely pass, strengthen it until it catches the bug.
- **Try it in your AI:**
  > "This passed your check but it's actually wrong on [case]. That means the check is too
  > weak. Show me the check, and strengthen it so it FAILS this case — then re-run."
  - **ChatGPT:** make it run the strengthened check on the bad case and show it going red.
  - **Copilot in Excel:** add the missing condition to the check column and confirm the bad
    row flips to FALSE.
  - **Chat AI that can't run code:** ask what the check does and doesn't look at; the gap is
    the fix.

### W6 L2 — "Point at the broken case" *(C11 · M8)*
- **The job:** The case-set runner shows **1 of 4** cases red. Identify which case failed
  and re-direct the build to fix it — without the AI narrating the fix for you (its
  explanation is suppressed on the first attempt).
- **Naive ask:** `"Just fix it."`
  **Live failure:** the AI special-cases the failing month (`if month=='Feb' return 980`),
  which passes Feb but breaks March — an overfit.
- **Free-text ask + checklist:**
  - [ ] **Localize the failure** (C11) — "which case is red, and what did it expect vs.
    get?"
  - [ ] **Fix the rule, not the case** (M8) — "fix the underlying rule; don't hard-code the
    failing month."
  - [ ] **Re-run all cases, no regressions** — "all four must still pass."
- **Outcome classes:**
  | Ask | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | "just fix it" | overfit: Feb passes, March breaks | "**You fixed the case, not the rule.** Hard-coding Feb made Feb green and March red. Point at *why* Feb failed and fix the rule behind it." | Patching one case breaks another. |
  | localize but loosen the check | all green, but the check got weaker | "**You passed it by lowering the bar.** The cases are green because the check now asks for less. Don't loosen the check to pass — fix the tool." | Don't trade the check away for a green. |
  | localize + fix the rule (**pass**) | 4/4 green, no regression, check unchanged | "**Fixed at the root.** You found the real reason Feb failed, fixed the rule, and nothing else broke. That's a fix, not a patch." | Localize, fix the rule, keep the check. |
- **Grader:** after re-direct, **all cases green AND no previously-green case regressed AND
  the check was not weakened** (guards against overfit and against loosening). Planted
  violation: the `if month=='Feb'` overfit passes Feb but the regression guard turns March
  red.
- **Pass + stars:** pass = all green, no regression, check intact. ★★ in ≤3 attempts, no
  3rd hint. ★★★ showed the rule change (M4).
- **Hints:** 1) "Which case is red, and what did it expect vs. get?" 2) "Watch the trap:
  fixing only Feb breaks March. The case isn't the problem — the rule is." 3) "Fix the rule
  (how it handles the month), not the one month, and re-run all four."
- **What you do differently:** *Naive:* "just fix it" → an overfit that breaks another case.
  *Rewrite:* localize the failing case, fix the rule behind it, re-run all → clean.
- **Try it in your AI:**
  > "Case [X] failed: it expected [E] but got [G]. Fix the underlying rule so it passes —
  > don't special-case [X] — and re-run ALL cases to prove nothing else broke."
  - **ChatGPT:** demand it show all cases green after the fix, not just the one that failed.
  - **Copilot in Excel:** re-check every test row, not only the one you fixed.
  - **Chat AI that can't run code:** re-run the whole case set yourself; an overfit shows up
    as a new red elsewhere.

### W6 L3 — "Prove it like you mean it" *(C9, C11 · M6)*
- **The job:** Before you can mark the tool "done," add your **own** boundary case and your
  **own** adversarial case, and all must pass.
- **Naive ask:** `"Add a test and we're done."` (adds a duplicate of an existing case)
  **Live reality:** a duplicate case can't fail differently from one you already have — it
  proves nothing new.
- **Free-text ask + checklist:**
  - [ ] **Add an untested dimension** (C9) — "a case that's different from the ones we have
    on a dimension we haven't tried."
  - [ ] **Say its expected value.**
  - [ ] **All cases pass.**
- **Outcome classes:**
  | Ask | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | duplicate/trivial case | engine rejects it | "**That case can't fail differently from one you already have.** A test that can only pass the same way isn't a new test. Try a dimension we haven't tried." | A redundant case adds no proof. |
  | new dimension, wrong expected | that case red | "**Good dimension, wrong expectation.** A year-boundary month is worth testing — but you set the wrong expected total. Fix the number." | A good case needs the right answer attached. |
  | new dimension, correct expected, all pass (**pass**) | all green incl. the new case | "**You proved it like you mean it.** You picked a case that could actually break it (a month spanning the year boundary) and it held." | Design a case that could fail, then show it doesn't. |
- **Grader:** the learner-added adversarial case is non-trivial (differs from existing cases
  on an untested dimension — engine-checked) AND all cases pass. Planted violation: a
  duplicate case is flagged ("can't fail differently").
- **Pass + stars:** pass = non-trivial new case + all green. ★★ in ≤3 attempts, no 3rd
  hint. ★★★ added both a boundary and an adversarial case (M4-flavored thoroughness). On
  mastery of W5+W6 the learner ranks up to **Builder**.
- **Hints:** 1) "What input have we NOT tried that could trip it up?" 2) "Covered so far:
  normal, empty, refund. What about a month that spans a year boundary?" 3) "Add a
  December→January boundary case with its correct total."
- **What you do differently:** *Naive:* "add a test" → a duplicate that proves nothing.
  *Rewrite:* add a case on an untested dimension with its expected value → real proof.
- **Try it in your AI:**
  > "Add one case that could actually break this on a dimension we haven't tested yet, with
  > its correct expected result, and show me the whole set passing."
  - **ChatGPT:** ask it to name the untested dimensions first, then add a case for one.
  - **Copilot in Excel:** add a test row that's unlike the others (a boundary value).
  - **Chat AI that can't run code:** pick the weird input yourself and work out the answer
    before testing.

**World 6 boss → §5.**

---

## WORLD 7 — Decide Where It Matters  (C13 · move M9)

The top-of-the-ladder judgment, and where the word **"determinism"** finally earns its
place (P4): decide which steps need a hard gate vs. a heuristic vs. a human review,
justified by the cost of being wrong. Chip-sort for L1–L2; free-text tiering on an unseen
workflow in L3. Mixed engine.

### W7 L1 — "What does it cost to be wrong?" *(C13 framing · M9)*
- **The job:** Six steps of a billing assistant: (1) compute the invoice total; (2) greet
  the customer; (3) recommend a payment plan; (4) look up the account balance; (5) draft
  the apology wording; (6) decide whether to issue a refund. Sort each into **hard gate /
  heuristic / human review**, judged by "what happens if this is wrong?"
- **Naive ask (demo):** `"One pipeline, treat every step the same."`
  **Recorded failure:** it hard-gates the greeting (wasteful) and leaves the refund to the
  model (dangerous).
- **Move chips:** per step, pick a bin. Technical skin: annotate `{gate: hard|heuristic|
  human}` + a one-line rationale.
- **Outcome classes:**
  | Choice | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | left invoice total / balance ungated | that number comes back wrong | "**A right-answer step with no gate.** The invoice total and the balance each have one correct value — leave either to the model and you ship a wrong number. That's exactly what World 2 taught, now at workflow scale." | Right-answer steps are the hard gates. |
  | hard-gated the greeting / apology | wasteful, brittle | "**Over-gated.** A greeting has no single right answer — gating it just slows everything and catches nothing. Those are heuristic." | Don't hard-gate the open steps. |
  | refund decision left to the model | dangerous | "**The riskiest step went to the guesser.** Issuing a refund is a high-cost judgment call — that's a human review, not a model decision." | Highest-cost judgment → human. |
  | total+balance → hard, recommend+apology → heuristic, refund → human (**pass**) | matches the expert key | "**Right tier for each step.** Exact steps gated hard, open steps left loose, the costly judgment to a person. That's the whole workflow thinking." | Tier by whether it's exact and by the cost of being wrong. |
- **Grader (expert key, not self-report):** hard: total, balance; heuristic: recommendation,
  apology (greeting may be heuristic or ungated); human: refund decision. Planted violation:
  invoice total left to the model (no gate) → RED.
- **Pass + stars:** pass = matches the expert key. ★★ in ≤3 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "If this step is wrong, who gets hurt and how badly?" 2) "The total and the
  balance are clearly hard gates. That leaves four — which of those is a costly judgment?"
  3) "The refund decision is the human-review step: high cost, real judgment."
- **What you do differently:** *Naive:* treat every step the same → wasteful gate on the
  greeting, dangerous gap on the refund. *Rewrite:* gate the exact steps, leave the open
  ones, send the costly judgment to a person.
- **Try it in your AI:**
  > "For each step, tell me the cost of being wrong, then put it in one of three buckets:
  > must be exact (I'll gate it with a tool), best-effort (the AI can do it), or a human
  > decides. Justify each in one line."
  - **ChatGPT:** ask it to tier the workflow before building any of it.
  - **Copilot in Excel:** the "must be exact" steps become formulas; the rest stay prose.
  - **Chat AI that can't run code:** use its tiering as a draft, but you decide the
    high-cost steps.

### W7 L2 — "The gate that was too expensive" *(C13, over-determinism · M9)*
- **The job:** A pipeline hard-gates **everything**, making it brittle and slow. Relax the
  gates that don't need to be hard — without un-gating a right-answer step.
- **Naive ask:** `"Gate it all to be safe."`
  **Given failure:** the over-gated pipeline is slow and still can't improve the creative
  steps.
- **Move chips:** per-step gate toggles with a "cost of this gate" meter.
- **Outcome classes:**
  | Choice | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | relaxed a right-answer step (the total) | wrong number ships | "**You traded away a gate you needed.** The invoice total has one right answer — its gate stays hard no matter how slow. You can't buy speed by un-gating the exact step." | Never relax a right-answer gate. |
  | left everything hard-gated | meter stays maxed, nothing improves | "**Still too expensive.** Hard-gating the wording and the recommendation catches nothing and costs a lot. Relax the open steps." | Gating the open steps is pure cost. |
  | relaxed the open steps, kept the exact ones (**pass**) | meter drops, exact steps safe | "**Right trade.** You relaxed the judgment steps and kept the exact ones gated. Faster, and still correct where correctness has one answer." | Spend your gates where there's a right answer. |
- **Grader:** the two right-answer steps stay hard-gated AND at least the two open steps are
  relaxed AND no right-answer step was un-gated (two-sided). Planted violation: relaxing the
  invoice-total gate to save time → RED.
- **Pass + stars:** pass = grader green. ★★ in ≤3 attempts, no 3rd hint. ★★★ n/a.
- **Hints:** 1) "Which of these steps has one right answer? Those keep the hard gate." 2)
  "The total and the balance must stay — relax the other four." 3) "Relax the wording and
  the recommendation; keep the total and the balance gated."
- **What you do differently:** *Naive:* gate everything → slow and brittle. *Rewrite:* relax
  the open steps, keep the exact ones gated → fast and still correct where it counts.
- **Try it in your AI:**
  > "This is over-engineered — it treats every step as critical. Keep hard checks only on
  > the steps with one right answer; let the judgment steps run loose. Tell me which you
  > relaxed and why."
  - **ChatGPT:** have it identify which gates earn their cost.
  - **Copilot in Excel:** keep formulas on the exact steps; drop needless validation on the
    text.
  - **Chat AI that can't run code:** you decide which steps are truly must-be-exact.

### W7 L3 — "Your call, defended" *(C13 transfer · M9 · free-text)*
- **The job:** A **new** workflow you haven't seen — a hospital discharge-instructions
  assistant (compute the dosage; greet the patient; summarize the diagnosis in plain words;
  look up the next appointment; list warning signs to watch; decide whether to escalate to a
  nurse). Tier every step and write one sentence defending the single highest-risk choice.
- **Naive ask:** `"Treat it like the billing one."`
  **Reality:** the domains differ — here the dosage calculation is the non-negotiable hard
  gate, and getting it wrong can harm a patient.
- **Free-text ask + checklist (graded by outcome against a hidden expert key):**
  - [ ] **Tier every step** (hard / heuristic / human).
  - [ ] **Hard-gate the dosage calculation** (the exact, highest-cost step).
  - [ ] **Pick the single riskiest step and defend it in one sentence** (stored for human
    review; does not gate the automated result — no LLM judges it).
- **Outcome classes:**
  | Choice | Result | Feedback (exact) | Lesson |
  |---|---|---|---|
  | dosage left heuristic/human-only without a hard calc | fails the key | "**The dosage needs a hard gate.** It has one right answer and the highest cost of being wrong — a human reviews it, but the number itself must be computed by a tool, not estimated." | The highest-cost exact step is always hard-gated. |
  | copied the billing tiers blindly | mismatched to this domain | "**Different workflow, different risks.** 'Treat it like billing' misses that a dosage error harms a patient. Tier for *this* job." | Risk-tiering doesn't transfer by copy-paste. |
  | dosage hard-gated, riskiest step named + defended (**pass**) | matches the key on the two highest-cost steps | "**Defended and correct.** You hard-gated the dosage, flagged it as the riskiest, and said why in one line. That's the judgment the whole ladder was building to." | On a new domain, find the exact high-cost step and gate it hard. |
- **Grader:** tiering matches the hidden expert key on the **two highest-cost steps** (dosage
  → hard gate; the riskiest-step selection matches). The one-sentence defense is stored for
  human review but does **not** gate the green (no LLM judges pass/fail). Planted violation:
  dosage left heuristic → RED.
- **Pass + stars:** pass = key match on the two highest-cost steps. ★★ in ≤3 attempts, no
  3rd hint. ★★★ n/a. On mastery the learner ranks up to **Architect**.
- **Hints:** 1) "In THIS workflow, which single step would do the most harm if wrong?" 2)
  "Narrow to the two clinical steps — one of them is a calculation." 3) "The dosage
  calculation is the non-negotiable hard gate; name it the riskiest."
- **What you do differently:** *Naive:* reuse the billing tiers → the dosage goes ungated.
  *Rewrite:* tier for this domain, hard-gate the dosage, name and defend the riskiest step.
- **Try it in your AI:**
  > "New workflow. For each step, tell me the cost of being wrong and bucket it: must be
  > exact (tool-gated) / best-effort / human decides. Name the single riskiest step and
  > defend it in one sentence."
  - **ChatGPT:** make it reason from cost-of-wrong, not from what's easy.
  - **Copilot in Excel:** the exact, high-cost steps are the ones you turn into checked
    formulas.
  - **Chat AI that can't run code:** you own the high-stakes calls; use its tiering as input,
    not as the decision.

**World 7 boss → §5.**

---

## §4. Where Jeff's engine slots in

Repo: `github.com/kerrlabs/ai-determinism-demo` — FastAPI + SSE; providers OpenAI / Bedrock
/ mock; seeded sales dataset (seed 42); **Agent A** (LLM computes from raw rows, temp 0.7,
scatters/wrong) vs **Agent B** (LLM writes SQL, SQLite executes, exact). Measured on real
Bedrock: **A 0/10 exact (179K–442K spread), B 10/10 exact.** Key insight: B writes
*different* SQL than canonical yet lands the same exact total.

**Reframed for the rewrite-the-ask loop: Agent A is the naive ask; Agent B is the ask with
M2 + M3.** The learner's rewrite is literally the move from A to B.

- **W2 L1 ("Why it guesses") → Agent A, 5 recorded runs.** The scatter of 5 confident wrong
  products is Agent A, captured once and replayed seeded (P8) — the cheapest, highest-impact
  engine appearance.
- **W2 L3 (prototype) & W3 → the A-vs-B contract in miniature.** The naive prompt = Agent A
  guessing the total/price; adding M2 ("ask for the formula") + M3 ("run it") = Agent B. L3
  passes on recorded data; its optional live beat runs A vs B on the real model so a hiccup
  never blocks the green.
- **W5 (Have AI Build the Tool) → the engine runs live, as the backbone.** The learner's
  free-text ask is the build prompt; the built tool is **Agent B writing SQL that SQLite
  executes** against seed-42 data. The grader is **value-equality against the canonical SQL
  answer, NOT SQL-text equality** — Jeff's insight (B's different SQL, same total) is exactly
  the grading rule, so a correct-but-differently-written tool still passes.
- **W5–W6 case sets → the seed-42 dataset's natural edges:** empty month (→0), refund /
  negative amount, year-boundary month, single-order weekday. Reproducible boundary/
  adversarial cases with no live-model flakiness in the *check*.
- **W6 (false green / re-direct) → A-vs-B as the teaching contrast.** The false green is an
  Agent-A-style tool that eyeballs and happens to match one case; strengthening the check and
  re-directing pushes it to a B-style executed answer.
- **Capstone → the engine end to end** on a held-out metric over the same data.

**Integration contract (engine → puzzle layer):**
1. **Seeded replay** for the demo rungs (W2 L1, the recorded outputs of W2 L3 / W3): a frozen
   capture per **outcome class** (not per combination), so a few recordings cover thousands of
   chip combinations.
2. **Safe runner** for built tools (W5+): a whitelisted, pure surface — **read-only SQL
   (SELECT only) over the seeded SQLite, no I/O, no network, time/row limits**. Agent B emits
   SQL; the runner executes it. (The architecture section's Pyodide sandbox is the
   alternative/extension; SELECT-only is the floor.) Fix Jeff's non-read-only connection and
   add provider timeouts.
3. **Value-equality grader** over the canonical answer per case.
4. **Latency/error channel** (P10): SSE distinguishes "model generating," "runner executing,"
   "runner error" so the UI renders the gray not-your-fault lane.
5. **Check-before-output gate** (P7/C10): the API accepts and locks the learner's check before
   streaming the tool's output, and logs the ordering as C10 evidence.

Worlds 1, 4 and 7-L1/L2 are fully recorded/seeded (no live model), so the engine's cost and
latency appear only where they earn it (W2 demo, W3, W5, W6, W7 L3, capstone).

---

## §5. Bosses and capstone

Per-level passes are **formative**. A world is cleared only by its **boss**: a held-out
domain, new tricks, a **free-text ask**, a **hidden ground truth** the learner never sees
before submitting, scored by a deterministic grader or an expert key — **never an LLM** (V3,
SPEC §8). Bosses from W5 on run against the live model; the *outcome* is graded, not the
prompt. Boss re-sit after 24h on a different variant.

| World | Boss job (new domain) | New tricks offered | Free-text ask | Hidden ground truth | Scoring (deterministic) |
|---|---|---|---|---|---|
| W1 | Shape a **help-desk ticket** (never-seen domain) | "add a severity emoji", "make it friendly" | shape it: required fields, a list field (affected systems) | a planted malformed ticket (missing priority, systems as one string) | schema rejects the malformed ticket; required + list fields correct |
| W2 | Triage a **clinic monthly note** | "you're a clinician, you'd know", "round the numbers" | flag every un-knowable claim AND route each right-answer step to a tool | a plausible but **fabricated patient count** | every un-knowable claim flagged; right-answer steps routed; fabricated count caught (not computable from given data) |
| W3 | Answer from a **10-row shipping-rate table**; target zone not in it | "give a typical rate", "estimate it" | pin the answer to the table; abstain if missing | the asked-for zone is **absent** | tool returns "not in the table," never a rate; a present-zone answer cites its row |
| W4 | Author a check for *"flag any support reply that promises a refund without a ticket number"* | "check it sounds apologetic", "check it's polite" | ask for a checker, prove it can fail, run it | a **hidden good/bad seed pair** (bad = refund promised, no ticket #) | authored check PASSES hidden good, FAILS hidden bad; not vacuous; seen failing |
| W5 | Build **"average order value for a given weekday"** on seed-42 data | "looks right, ship it", "round to the nearest dollar" | spec the tool, commit an exact check, prove on cases | hidden case set: a weekday with a **single order** (boundary) + one with a **refund** (adversarial) | tool == canonical on all hidden cases incl. single-order day + refund; exact check committed first |
| W6 | Fix a tool with a **planted false green** (silently drops rows at a **timezone edge**) | "trust the green", "just make Feb pass" | expose the false green, re-direct without overfit, add a passing adversarial case | the hidden **timezone-edge** dimension | learner's strengthened check goes red on the edge case; fix is at the rule (no regression, check not loosened); added adversarial case is non-trivial and passes |
| W7 | Risk-tier a **loan-approval assistant** (new high-stakes workflow) | "automate it all for speed", "let the model decide the rate" | tier every step; defend the riskiest | hidden expert key | eligibility calc + rate lookup hard-gated; subjective step → human review; matches key on the highest-cost steps |

### Capstone (C14 — cross-domain certification)

A novel, unscaffolded, **cross-domain** job far from sales/billing/clinical — e.g. a
**volunteer-shift scheduler**. Free-text asks throughout; chips are gone. End to end, unaided:

1. **Name the guess** — identify where the AI will fabricate (C2).
2. **Route right-answer steps to tools; ground factual ones** (C3, C4) — M2/M3/M5.
3. **Author a two-sided check before seeing output** (C7, C10), check-before-output enforced
   — M6.
4. **Direct the AI to build the tool** on the safe runner (C8) — M2 + spec.
5. **Prove on a hidden case set** with a boundary and an adversarial case (C9) — M6.
6. **Expose and fix a planted false green / failing case without overfitting** (C11, C12) —
   M8.
7. **Risk-tier the whole workflow** against a hidden expert key (C13) — M9.

**Hidden ground truth:** a canonical total per metric, a planted false green on one hidden
dimension, and an expert tiering key. **Scoring:** every gate is a deterministic
grader/expert-key match; the one-sentence rationales are retained for human review but do
not gate the automated result. **No LLM decides pass/fail anywhere.**

**Certification** is granted only on the capstone (≥70) **plus a majority of world bosses**
(each ≥70), never on formative greens (P15). **Distinction:** capstone ≥90 and ≥70% of levels
at ★★★. Certificates carry an evidence hash. **Transfer-validity caveat (honored):** product
copy says "builds the skill," not "predicts on-the-job transfer," until a cohort is measured
on a different domain than training and the correlation is reported.

---

## §6. Misconception → level map

Every trick from SPEC §3 (and the four extra misconceptions in SPEC §8) is disproven by a
specific level's consequence, not a lecture.

| Misconception / trick | Where it's offered | How the consequence disproves it |
|---|---|---|
| "Be careful / double-check your math" | W2 L3 (`care`), W4 L4 (`double`) | Answers get closer but still scatter; a confident "double-checked" claim that's still wrong — changes the voice, not the calculator. |
| "Think step by step" | W2 L3 (`steps`) | Scatter persists; it talks differently, still guesses. |
| "You are an expert" | W1 L1, W2 L3, W3 L1 (`expert`) | No change to who does the math/where the fact comes from. Role-play adds no calculator and no source. |
| "Just the number" | W2 L3 (`just`) | Shorter, still wrong. Brevity isn't accuracy. |
| "Remind it of the rules" | W4 L4 (`remind`) | Hit rate improves (7/8) but not 100%, and nothing tells you which one slipped. Telling ≠ checking. |
| "Make sure it's perfect" | W4 L4 (`perfect`) | A confident "all perfect" that isn't true. Effort buys a claim, not proof. |
| "Give a typical / round number" | W3 L1 (`typical`), W3 L2 (`round`) | Invents a value instead of reading the source — the abstention/grounding fail. |
| "Green means correct" | W4 L4 (false-green class), W6 L1 | A green check on a wrong answer, because the check didn't test the thing that's wrong. |
| "One green is proof" | W5 L2, W6 L3 | The empty-month / untested-dimension case breaks a tool that passed its one happy case. |
| "Temperature 0 is deterministic / trying harder makes it exact" | W2 L1, W2 L3 | Even careful, step-by-step prompts scatter — only routing to a tool makes the step exact. |
| "Everything should be hard-gated" | W2 L4, W7 L2 | Over-tooling / over-gating fails: a gate on an open step catches nothing and costs time. |
| "A tone check is a real check" | W4 L1, W4 L4 (`friendly`/`pro`) | "Friendly tone" passes everything, including broken drafts — it can't fail, so it can't catch. |
| "The AI can check its own work" | W4 L4 (`check` without `run`), V5 no-code note | "I checked, all pass" without running it; a chat AI that can't run code can't truly check itself. |

---

## §7. Build order and prototype reuse

Per the adult-learning and UX reviews, de-risk the keystone first.

**Build order:**
1. **W4 L4 — "Ask for the check first"** (the keystone; user-test this before anything
   above it). *Reuses `world-4-ask-for-the-check.html` verbatim.* If real non-technical
   users can't clear it, the ladder above is unreachable and the course adapts here.
2. **W1 L1 — "The receipt"** (the 3-minute first-win on-ramp; proves the loop feels good
   from move 1).
3. **W2 L3 — "Ask for the tool, not the answer."** *Reuses `level-2-ask-for-the-tool.html`
   verbatim*, plus the optional live Jeff beat (proves the recorded→live seam).
4. **W5 L1 — "Describe the tool"** (proves the live-engine + safe-runner hinge and the
   free-text→outcome grader).
5. **Fill the rest:** W1 L2–L3 → W2 L1/L2/L4 → W3 → W4 L1–L3 → W5 L2–L3 → W6 → W7 →
   bosses → capstone.

**Prototype reuse (which levels inherit which prototype's code):**

| Level | Prototype reused | What's reused |
|---|---|---|
| W2 L3 | `level-2-ask-for-the-tool.html` | Entire packet: scatter plot, moves/tricks, `outcome()` model, run/shake/stars, compare + try-it. New data only for other W2/W3 scatter levels. |
| W2 L1 | `level-2-ask-for-the-tool.html` (scatter + run-5× harness) | The 5-run scatter and the "who did the math" label, stripped to the demo checkbox. |
| W3 L1–L3 | `level-2-ask-for-the-tool.html` (shell) | Same two-panel shell, move chips, outcome model; swap the scatter for a source-lookup/citation view. |
| W4 L4 | `world-4-ask-for-the-check.html` | Entire packet: drafts grid, per-rule marks, criteria sub-choices, `simulate()` false-green model, hints, rank-up, try-it. |
| W4 L1–L3 | `world-4-ask-for-the-check.html` (shell + sub-choice + "try to break it" bench) | The criteria/clause chip row and the two-pane good/bad bench, reduced to pick/repair interactions. |
| W1 L1–L3 | `world-4-ask-for-the-check.html` (chip row + live prompt) OR a lightweight shared shell | Move chips, live-prompt render, outcome classes; a form/schema preview replaces the drafts grid. |
| W5–W7 | neither prototype's UI directly | New **workshop** shell: free-text ask box + checklist + commit-then-reveal + case-set runner + live SSE engine (§4). Reuses the compare + try-it footer and the outcome-class/feedback pattern. |

Everything below W5 is a **data packet** (SPEC §9): the job, data preview, naive prompt,
moves/tricks (plain + technical), sub-choices, outcome classes (recorded output + feedback
+ lesson), the ground-truth grader, hints, stars, the try-it template. The build fails if
the combination test (SPEC §8) doesn't pass — every outcome class must be reachable and
only the intended combinations may pass.
