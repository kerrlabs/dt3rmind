# Section: Visual System & Moment-to-Moment Experience

**Role:** Visual/UX & motion designer.
**Goal:** make Puzzle Ladder visually appealing and feel like a *game* — fast, legible, satisfying — without ever letting the "feel" lie about mastery.

**Grounding:** the shipped prototype `inputs/level-2-dont-let-ai-do-math.html` already contains the product in miniature — a **pipeline board** where the AI's answer flows left→right, fails a check (red + shake), the learner drops a **calculator tool** into the pipeline, the flow *re-routes down through the tool*, and the check flips green with stars + a "Lesson unlocked" reveal. This section generalizes that one board into the whole visual language.

**References studied:**
- chess.com puzzles — instant, self-evident win state; correct = green square flash + advance, wrong = red shake + "incorrect", retry/hint/solution ladder. ([chess.com/puzzles](https://www.chess.com/puzzles)) The lesson we take: the win must be legible in <1s and *owned* by the solver.
- Brilliant — interactive, manipulable visuals where you *do* the concept rather than read it; immediate state change on every interaction.
- Duolingo — a **path map** of nodes (lesson bubbles on a winding trail), bite-size units, loud celebration moments (confetti, level-up chime, streak), and a mascot that reacts.
- Jeff's `ai-determinism-demo` ([github.com/kerrlabs/ai-determinism-demo](https://github.com/kerrlabs/ai-determinism-demo)) — the **scatter → lock-on** visualization (Agent A's answers scatter across runs; Agent B's lock onto the ground-truth line) and the **Okabe–Ito** color-blind-safe palette, with correctness encoded by **icon + color, not color alone**. We adopt both directly.

---

## 1. Design principles

1. **The board is the hero. Chrome is quiet.** The pipeline board is the one thing on screen that moves and matters. Everything else (header, buttons, copy) sits back in low-contrast neutrals so the eye goes to the flow.
2. **Green must be *their* green.** (From the UX review — the #1 risk.) The win animation only fires on a check the learner authored and has seen fail. Celebration intensity is reserved for authored wins; a borrowed/demo green gets a muted acknowledgment, never confetti. The feel must track mastery, not activity.
3. **Fail is a provocation, not a wall.** The AI's wrong answer is staged and *reproducible* (recorded, not live, at the puzzle tier). It animates as "confidently wrong" — fast, certain, then caught — so it reads as *the AI's* mistake the learner is about to fix, not as the learner's failure or as system noise.
4. **One genre, one pace.** (UX review warned tiers 1–3 are instant click-puzzles and 4–7 are a laggy sandbox — "two games stapled together.") The board visual is *identical* across all tiers so the mental model never breaks; the only thing that changes at the sandbox tiers is an explicit, designed **"AI is working" waiting state** that keeps the board alive instead of a dead spinner.
5. **Correctness = icon + color + motion, never color alone.** ✓/✗ glyphs, fill, position change, and a text label all carry the pass/fail signal. A fully color-blind user and a grayscale screenshot both read correctly.
6. **Every state is a diff.** When anything changes (tool snaps in, flow re-routes, check flips), *animate the change* so the learner sees cause→effect. Nothing teleports.
7. **Reduced-motion is a first-class skin, not a degradation.** Same information, same win legibility, delivered through instant state + color/icon instead of travel/shake. The prototype already does this (`prefers-reduced-motion` kills shake/flow/think).
8. **8th-grade copy, 44px touch targets, keyboard-first.** Non-technical adults on laptops and tablets. No jargon in the UI; "schema" is a *form*, "tool call" is *routing through a tool*.

---

## 2. The reusable "board" (core visual metaphor)

The board is a **left-to-right pipeline** of fixed node slots. It is the same object at every rung; what changes is which slots are filled and which tool snaps into the middle.

```
   INPUT         AI          [ TOOL SLOT ]        CHECK          OUTPUT
  ┌──────┐    ┌──────┐       ┌─────────┐        ┌──────┐       ┌──────┐
  │ ?    │──▶ │  AI  │ ─ ─ ▶ │  (open) │ ─ ─ ▶  │ ✓/✗  │ ─ ─ ▶ │ out  │
  └──────┘    └──────┘       └─────────┘        └──────┘       └──────┘
   question   stochastic      deterministic      pass/fail      the answer
              (guesses)       step owner          gate          the learner trusts
```

**Node anatomy (all nodes share one template):**
- 52×52 rounded square (14px radius), 2px border, a single centered **line-art icon** (not emoji in production — the prototype uses emoji as placeholders; ship the Okabe-styled line icons), and a 10px caption below in `--muted`.
- Three visual states per node, driven by one `data-state` attribute: **idle** (neutral border, muted icon), **active** (accent border + soft glow, icon full-strength — this is the "thinking"/"running" pulse), **resolved-pass** (green border + green fill tint) / **resolved-fail** (red border + red fill tint).

**The flow line** is the connective tissue and the main motion carrier:
- Default path: a straight dashed neutral line INPUT→AI→CHECK→OUTPUT (the "AI guesses directly" route).
- Tool path: when a tool snaps into the slot, a second curved path lights up that **detours the flow down through the tool node** and back up — visually proving the step was taken out of the AI's hands. The direct path dims to 15% opacity. (This exact re-route is in the prototype: `pDirect` dims, `pTool` lights to accent.)
- A bright gradient "pulse" packet travels the active path on each run (`#flowLine` with `stroke-dasharray` animating `stroke-dashoffset`), so the learner *watches data move* through the pipeline rather than seeing a result blink into existence.

### How each tool type looks when it snaps in (one shape, one icon, one accent per rung)

Each rung's tool drops into the **same center slot** with the same snap-in motion (scale 0.4→1, cubic-bezier overshoot `(.2,1.4,.4,1)`), but carries a distinct icon + micro-behavior so the *kind* of determinism is legible at a glance:

| Rung | Tool | Icon (line-art) | Slot behavior when it snaps in |
|---|---|---|---|
| 1 | **Form / schema** | a form with field rows | Node expands into **named field slots**; the AI's free-prose output visibly "pours into" the slots, trimming to shape. Teaches "it can only return these fields." |
| 2 | **Calculator / lookup** | a calculator keypad | The number in OUTPUT **recomputes** — the wrong scattered number is replaced by one exact value with a count-up animation to the correct figure (prototype does this with `countUp`). |
| 3 | **Source lookup / grounding** | a magnifier over a document | A small **"source" chip** appears attached to the OUTPUT ("from: sales.db row 42") — the answer gains a provenance tag it did not have when the AI invented it. |
| 4 | **Check (learner-authored)** | a shield with a checkmark | The CHECK node, previously greyed, **lights up with the learner's own rule text** printed on it; this is the first rung where the check node is the star, not the tool slot. |
| 5 | **AI-built tool + test** | a wrench assembling a gear | The tool slot shows a **"being built"** state (gear assembling), then resolves into a concrete tool icon; the learner's check runs against it. |
| 6 | **Fix / tighten** | a wrench adjusting the shield | The failing case is **highlighted red on the board**; adjusting the tool/check visibly moves that one case from the red column to the green column. |
| 7 | **Risk dial (capstone)** | a dial/gauge | Each step shows a **toggle: hard gate (lock icon) vs. flexible (open icon)**; the learner marks which steps need determinism — the board annotates each node with its chosen mode. |

---

## 3. World map / level path screen

Duolingo-style winding path, but the nodes are **rungs of the ladder** and the theme bands make the determinism concepts into **themed sets** (UX review rec #5: linear onboarding + themed drilling for replay). The path climbs upward — you are literally *climbing a ladder*.

```
┌─────────────────────────────────────────────────────────────┐
│  PUZZLE LADDER            ◆ 1240   🔥 5-day   ⚙  (settings)   │  ← top bar: rating, streak
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   THEME: DECIDE WHERE IT MATTERS   ┌──────┐                   │  ← capstone theme band (locked)
│                            ·  ·  · │  7 🔒 │                   │
│                         ·          └──────┘                   │
│   THEME: VERIFY & FIX           ┌──────┐   ┌──────┐           │
│                       ·  ·  ·  · │  6   │ · │  5 ◐ │ ← current │  ← ◐ = in progress (ring fills w/ %)
│                    ·             └──────┘   └──────┘           │
│   THEME: BUILD THE CHECK      ┌──────┐                        │
│                     ·  ·  ·  · │ 4 ★★★│                        │  ← ★ earned (0–3) sit under solved nodes
│                  ·             └──────┘                        │
│   THEME: GROUND THE ANSWER  ┌──────┐  ┌──────┐                │
│                   ·  ·  ·  · │ 3 ★★☆│ ·│  G1  │ ← themed drill │  ← side nodes = optional drill puzzles
│                ·            └──────┘  └──────┘                │
│   THEME: SHAPE & SPOT     ┌──────┐ ┌──────┐ ┌──────┐          │
│                           │ 1 ★★★│·│ 2 ★★★│·│  G0  │          │
│                           └──────┘ └──────┘ └──────┘          │
│                               ▲ start here                     │
├─────────────────────────────────────────────────────────────┤
│  [ Daily puzzle ]   [ Continue climbing ▶ ]   [ Skin: Visual ]│  ← persistent actions + skin toggle
└─────────────────────────────────────────────────────────────┘
```

- **Node states:** locked (🔒, dimmed, no path glow), available (accent ring, gentle pulse), in-progress (◐ ring fills to % complete), solved (filled + star count 0–3 beneath). Solved nodes keep a quiet green check; stars show *quality* of the solve (see §5 win moment).
- **Themed sets** group rungs by determinism concept so a learner can **re-drill a weakness** (UX review: linear ladder has no replay; themes create it). The main path is the recommended line; side nodes (`G0`, `G1`...) are generated drill variants of the same concept for replay/daily-puzzle.
- **Rating (◆) + streak (🔥)** live in the top bar on every screen — the visible "climb" chess.com monetizes and the UX review flagged as missing. Rating is a simple solved-count-weighted-by-tier number, never LLM-derived.
- **Skin toggle** is on the map, not mid-puzzle (UX review: switching skins mid-board is a jarring context swap). Changing skin re-renders the whole map; the board metaphor is identical in both skins so the mental model survives.

---

## 4. Level screen layout (ASCII wireframes)

Single-column, board-centered, max-width 640px (matches prototype). The board owns the vertical center; prompt above, controls below, lesson reveal slides in at the bottom.

**4a. Puzzle tiers (1–4) — the fast click-puzzle layout**

```
┌───────────────────────────────────────────────┐
│ [2] PUZZLE LADDER          ☆☆☆    [?] hint     │  ← rung badge, star tracker, hint button
│     Don't let AI do the math                    │
├───────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐ │
│  │  What is 6,847 × 2,913 ?                    │ │  ← the question card
│  └───────────────────────────────────────────┘ │
│                                                 │
│   📝 ─────▶ 🤖 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶ 🎯        │  ← THE BOARD (idle: direct dashed path)
│  question   AI(guesses)                 answer  │
│                      │                          │
│                   ┌──┴──┐                        │  ← tool slot (empty until added)
│                   │ 🧮? │                        │
│                   └─────┘                        │
│                                                 │
│   result:  ——                                    │  ← fills after "Ask the AI"
│                                                 │
│   THE CHECK · answer = 6847 × 2913               │
│   ┌───────────────────────────────────────────┐ │  ← check bar: fills red on fail, green on pass
│   │                                             │ │
│   └───────────────────────────────────────────┘ │
│                                                 │
│   [ ▶ Ask the AI ]     [ 🔧 Add calculator ]     │  ← primary accent / secondary outline
├───────────────────────────────────────────────┤
│  ╭─ ✦ LESSON UNLOCKED ────────────────────────╮ │  ← slides open (max-height) only after win
│  │ You took the step that has a right answer    │ │
│  │ out of the AI's hands...                     │ │
│  ╰──────────────────────────────────────────────╯ │
└───────────────────────────────────────────────┘
```

**4b. Sandbox tiers (5–7) — same board, adds an authoring panel + designed wait state**

```
┌───────────────────────────────────────────────┐
│ [5] Have the AI build the tool    ☆☆☆  [?]hint │
├───────────────────────────────────────────────┤
│  ┌─ YOUR CHECK (plain English) ───────────────┐ │  ← learner authors here; scaffolded (rec #1)
│  │ > the total must equal the sum of all rows  │ │     chips/pick-from-valid, NOT free syntax
│  │ [+ add a rule]        seen fail? ● yes       │ │  ← "seen fail" dot: grey until check caught plant
│  └─────────────────────────────────────────────┘ │
│                                                 │
│   📝 ──▶ 🤖 ──▶ ┌────────┐ ──▶ 🛡 ──▶ 🎯          │  ← board: tool slot shows build state
│  question  AI   │ 🔧 ...  │   check  answer      │
│                 │building │                      │  ← DESIGNED WAIT (not a dead spinner):
│                 └────────┘                       │     gear assembles, flow pulse loops,
│                 "AI is writing the tool…"         │     status line narrates (12–40s honest)
│                                                 │
│   CASES          ✓ pass            ✗ fail        │  ← cases split into two columns (rec #7:
│   ┌─────────────────────┐ ┌─────────────────┐   │     distinguishes YOUR check failing from
│   │ row-sum = 1,284,003 │ │ (none yet)       │   │     the SYSTEM failing — see §9)
│   └─────────────────────┘ └─────────────────┘   │
│                                                 │
│   [ ▶ Build & run ]   [ ⚠ system error? retry ] │
└───────────────────────────────────────────────┘
```

Key difference from the puzzle tiers: the **authoring panel** (top) and the **cases split** (bottom) are the only new surfaces; the board in the middle is pixel-identical to 4a. The "AI is writing the tool" state is a *designed, narrated wait* — the gear assembles, the flow pulse loops, a status line steps through honest sub-steps ("reading your check… writing the tool… running it on your example") — so a 12–40s model latency reads as the board working, not as a hang.

---

## 5. The key moments (motion specs: duration, easing, sequence)

All timings have a reduced-motion equivalent (right column). Easing names: `standard` = `cubic-bezier(.3,0,.2,1)`; `overshoot` = `cubic-bezier(.2,1.4,.4,1)`; `decelerate` = `cubic-bezier(0,0,.2,1)`.

### 5a. The FAIL moment ("AI is confidently wrong")
The AI must look *certain*, then get *caught*. The staged wrong answer is recorded/deterministic so the puzzle is reproducible (UX review rec #2).

| Step | t (ms) | Motion | Easing | Reduced-motion |
|---|---|---|---|---|
| AI node "thinks" | 0–850 | opacity pulse 0.35↔1, 0.7s loop; border → warn | — | border→warn, static, 1 beat |
| Flow packet travels INPUT→AI→OUTPUT | 0–1000 | gradient dash sweeps the direct path | standard | skip travel |
| Wrong number lands | 850 | count-up to the wrong value, 500ms | decelerate | number appears instantly |
| Check bar fills red | 850–1450 | width 0→100%, red tint | standard | fill instant |
| Board SHAKE | 850–1310 | translateX ±7→±5px, 450ms | — (keyframe) | **no shake**; red border + ✗ only |
| ✗ glyph + "FAILED — off by N" | 1310 | fade in | — | present immediately |
| Tool button pulses to invite fix | 1310→ | box-shadow pulse 1.4s loop | — | static highlighted |

The shake is short and *diegetic* — it's the pipeline rejecting a bad value, not an error dialog. Sound (if on): a soft "clunk", not a harsh buzzer.

### 5b. The FIX moment (tool snaps in, flow re-routes) — *the signature animation*
This is the thesis made physical: the step leaves the AI's hands.

| Step | t (ms) | Motion | Easing |
|---|---|---|---|
| Tool node snaps into slot | 0–450 | scale 0.4→1 + opacity 0→1 | **overshoot** (the satisfying "click") |
| Direct path dims | 0–300 | opacity 1→0.15 | standard |
| Tool path lights to accent | 0–300 | stroke neutral→accent, opacity→1 | standard |
| Flow packet re-runs the NEW curved path | 200–1200 | gradient sweep down-through-tool-and-back | standard |
| AI node border → accent (now "supervised") | 200 | border color | standard |
| OUTPUT recomputes to exact value | 1100–1800 | count-up to correct number, 700ms | decelerate |
| Check bar flips green | 1100 | tint red→green, ✓ glyph | standard |

Reduced-motion: tool appears in place, direct path dims instantly, correct number + green ✓ appear immediately. The *information* (routed through tool → now exact) is identical; only the travel is removed.

### 5c. The WIN moment (check goes green — scaled by authorship)
Two tiers of celebration, deliberately. **Borrowed green** (demo/early rungs) = modest. **Authored green** (learner's own check, after it was seen failing) = full celebration. This keeps dopamine coupled to mastery (principle #2).

- **Modest (borrowed):** green ✓, check bar green, a single 150ms scale-pop (1→1.06→1, overshoot) on the OUTPUT node. No stars, no confetti.
- **Full (authored):** the above, **plus** stars fill left→right (3 pops, 90ms stagger, overshoot, warn/gold color), **plus** a brief particle burst from the CHECK node (12–16 particles, 600ms, decelerate, radial), **plus** the "✦ Lesson unlocked" panel slides open (max-height 0→260px, 500ms, standard). Sound (if on): rising 3-note arpeggio.
- Reduced-motion: stars set to filled state instantly; no particles; panel appears expanded (no slide). The win is still unmistakable via color + icon + the unlocked panel.

### 5d. The LEVEL-UP moment (rung solved → next rung unlocks on the map)
Fires on return to the world map after a solve.

| Step | t (ms) | Motion | Easing |
|---|---|---|---|
| Solved node settles to filled + stars | 0–400 | scale-pop + star fill | overshoot |
| Rating counter ◆ ticks up | 200–900 | count-up by earned points | decelerate |
| Path segment to next node draws in | 400–1000 | dash draws along the trail | standard |
| Next node unlocks | 1000 | 🔒 fades, accent ring pulses on | decelerate |
| Streak 🔥 increments (if first solve today) | 1000 | flame scale-pop | overshoot |

Reduced-motion: node + rating + unlock update to final state with a single 200ms cross-fade; no path-draw, no counting.

### 5e. The BOSS-LEVEL moment (end-of-theme transfer task — "certification", not a formative green)
The assessment review is explicit: *one green example is not proof; certification needs held-out transfer tasks.* So a "boss" is visually distinct from a normal rung — it is a **held-out puzzle the learner has not seen**, solved with the skill but on new data, and it earns a **crest/badge** rather than stars.

- **Entry:** a full-screen "theme complete — prove it" transition. The theme band on the map pulses, then a short gate animation (a crest outline draws in, 800ms, decelerate) before the puzzle loads. Darkened vignette focuses attention; the board gets a subtle gold frame to signal "this one counts."
- **During:** no hint ladder beyond a single structural nudge (certification, not practice). The board is the standard board — same metaphor — so the learner isn't fighting a new UI under pressure.
- **Win:** the crest *fills with gold* (900ms, overshoot) and locks onto the theme band on the map; a distinct, heavier sound (if on) — a short fanfare, clearly different from the per-rung arpeggio. This badge is the thing a learner screenshots.
- **Fail/retry:** no shame styling. The crest stays outline; copy reframes ("not yet — try the fix on this one"), routing back into the fix-moment loop with the hint ladder re-enabled.
- Reduced-motion: crest draws as a 200ms fade to filled; vignette is a static dim; no fanfare animation.

---

## 6. Design tokens

### 6a. Color roles — color-blind-safe (Okabe–Ito base), with icon+shape backup

The brand problem that killed Jeff's live-model demo trust was mistaking color for meaning. We use the **Okabe–Ito** 8-color palette (designed for all common color-vision types) and **always pair color with an icon/shape** so correctness is never color-only (principle #5).

| Role | Okabe–Ito hex | Used for | Non-color backup |
|---|---|---|---|
| `--ok` (pass) | `#009E73` bluish-green | check passed, green route, exact value | ✓ glyph + bar fully filled |
| `--danger` (fail) | `#D55E00` vermilion | check failed, wrong value, shake | ✗ glyph + "FAILED" label + shake |
| `--accent` (active/tool) | `#0072B2` blue | active flow, tool nodes, primary button | glow + motion + icon |
| `--warn` (stars/attention) | `#E69F00` orange | stars, streak, "thinking", invite-to-fix | star shape, flame shape |
| `--info2` | `#56B4E9` sky blue | secondary data, source chips | — |
| `--accent2` | `#CC79A7` reddish-purple | risk-dial "flexible/heuristic" marks | open-lock icon |
| `--yellow` | `#F0E442` | highlight a specific failing case on the board | pointer caret |

> Note: the shipped prototype uses a teal/green/red set (`#4fd1c5` / `#4ade80` / `#f87171`) that is *not* fully color-blind-safe (the ok/danger pair is risky for deuteranopia). **Recommendation: migrate to the Okabe–Ito roles above** for production, keeping the prototype's structure. Pass/fail already carries ✓/✗ + shake + label, so the migration is low-risk.

### 6b. Neutrals — dark theme (default) & light theme

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0d1117` | `#f6f8fb` |
| `--bg-elevated` | `#161c2b` | `#ffffff` |
| `--card` | `#1a2130` | `#ffffff` |
| `--border` | `#2a3444` | `#d8dee8` |
| `--text` | `#e8ecf4` | `#1a2130` |
| `--text-strong` | `#ffffff` | `#06101f` |
| `--muted` | `#8a97ab` | `#5c6779` |
| pass/fail subtle tints | 10–14% of role on bg | 90% white + role tint |

Dark is default (focus on the glowing board, less eye strain for long sessions); light is a full first-class theme (classrooms, projectors, bright rooms). Both must hit WCAG AA — the Okabe–Ito roles clear 4.5:1 for text on both `--bg` values when used as text; as fills they carry an icon so the ratio applies to the glyph.

### 6c. Type scale (Inter, system fallback)

| Token | Size / weight / tracking | Use |
|---|---|---|
| `display` | 30px / 900 / -0.01em | the result number (count-up) |
| `h1` | 16px / 800 | rung title |
| `h2` | 14px / 800 | panel/section headers |
| `body` | 14px / 400 / 1.6 line | questions, lesson copy |
| `label` | 11px / 700 / 0.08em uppercase | node captions, "THE CHECK", status |
| `micro` | 10px / 700 / 0.1em uppercase | kicker ("PUZZLE LADDER"), node captions |

Reading level target: ~8th grade for all body copy. Result number is the biggest thing on screen because it's the payload the learner is judging.

### 6d. Spacing & geometry

- 4px base unit; node size 52px; node radius 14px; card radius 10–14px; board height ~132px.
- Max content width 640px (single-column, tablet-friendly).
- Touch targets ≥ 44px (buttons are 44px+ tall).
- Flow line stroke 3px (idle dashed) / 4px (active gradient packet).

---

## 7. Sound design (optional, OFF by default)

Sound is **off by default** (classrooms, open offices, accessibility) with a clear toggle. When on, it's sparse, short, and *mapped to meaning* — never decorative. All ≤ 500ms, soft, no harsh buzzers.

| Event | Sound | Why |
|---|---|---|
| Ask the AI | soft "whoosh" (packet travels) | motion has an audio twin |
| Fail | low "clunk" (pipeline rejects) | *not* a punishing buzzer — it's the system catching, which is good |
| Tool snaps in | tactile "click" | the satisfying LEGO-snap, reinforces agency |
| Authored win | rising 3-note arpeggio | reserved for *their* green |
| Level-up | 2-note bright confirm | map progression |
| Boss crest | short fanfare (clearly heavier) | certification earns a distinct, bigger sound |

Rules: every sound has a visual equivalent (never audio-only information); respects OS "reduce sound"/mute; one global volume + mute in settings; no sound during the "AI is working" wait (would get annoying on repeat).

---

## 8. Accessibility (WCAG 2.1 AA)

- **Color-blind-safe:** Okabe–Ito palette; correctness = icon + shape + label + motion, never color alone (§5, §6a). Verified against deuteran/protan/tritan and grayscale.
- **Reduced motion:** `prefers-reduced-motion: reduce` already honored in the prototype; every moment in §5 has a reduced-motion equivalent that preserves information and win legibility. No parallax, no auto-playing travel, no shake.
- **Keyboard:** full play without a mouse. Tab order = question → Ask → tool slot → Add tool → check panel → next. Space/Enter activate; the tool "snap-in" is also an Enter action on the focused slot. Visible focus ring (2px accent, 2px offset) on every interactive element. Arrow keys move between nodes on the board for inspection.
- **Screen-reader narration of the board** (the board is visual; it must be fully describable): each node is a labelled region with `aria-label` and a live `data-state`. An `aria-live="polite"` region narrates the pipeline as it runs, e.g.:
  - idle: *"Pipeline: question goes into the AI, which guesses, then to the answer. Tool slot is empty."*
  - after Ask + fail: *"The AI answered 19,843,652. Your check failed: the answer should equal 6,847 times 2,913. Off by 95,641."*
  - after tool: *"Calculator tool added. The answer now routes through the calculator. Result: 19,939,311. Check passed — exact."*
  Narration is authored per rung (not auto-generated) so it reads as plain English, not DOM soup.
- **Targets & motion safety:** ≥44px targets; no flashing >3Hz (particle burst is slow, radial, <2Hz); shake amplitude small and one-shot.
- **Text:** resizable to 200% without loss; AA contrast on both themes; no information conveyed by placement alone (every column/node is labelled).
- **Captions:** any future voiced narration or video demo ships with captions + transcript.

---

## 9. The latency / failure state (UX review rec #7 — distinguish "your check failed" from "the system failed")

This is a visual-design responsibility because novices read infra failure as personal failure. Two visually distinct states:

- **Your check failed (the point):** happens *on the board* — red route, ✗ on the CHECK node, the failing case in the red column. Framed as progress: "your check caught it — now fix the tool." This is a *good* event in the loop.
- **The system failed (not your fault):** happens *off the board* — a muted banner above the board (not red route, not shake, no ✗ on the check node), neutral icon, copy "the AI service hiccuped — not your check. Try again," plus a Retry button. The board holds its last good state; nothing the learner built is lost.

Keeping these two visually separate is what prevents the quit-at-the-hinge failure the UX review predicted.

---

## 10. Mascot / character — recommendation: **YES, a minimal "pipeline guide," not a Duolingo-style persona.**

**Recommendation: ship a small, restrained mascot — but as a *guide/reactor*, not a cartoon personality, and never on the board.**

Why yes:
- Non-technical adults are the audience; a friendly reactor lowers the intimidation of "AI/tools/checks" and gives the celebration moments a face to land on (Duolingo's owl works because it *reacts*).
- It carries the hint ladder gracefully (UX review rec #3): the guide offers "want a nudge?" rather than a cold hint button, which reads as help, not failure.

Why restrained (and the guardrails):
- **It must never compete with the board.** The board is the hero (principle #1). The mascot lives in the margin/corner and in transition screens, never overlapping the pipeline.
- **No manipulative/guilt mechanics** (Duolingo's guilt-trip streak notifications are an anti-pattern for an adult professional tool). The streak is a quiet encouragement, not a pressure.
- **Form:** a simple geometric character evoking the thesis — e.g. a little **"routing node" sprite** (a rounded square with eyes, matching the node shape) that physically *reroutes* alongside the flow during the fix moment. It embodies "route the step through a tool" rather than being arbitrary decoration. Two expressions only: neutral/curious and delighted (on authored wins). It does **not** talk during puzzles; it reacts.
- Reduced-motion: the mascot holds still and simply changes expression; no bouncing.

Alternative considered: **no mascot, celebrate through the board only.** Cleaner and more "serious tool," but loses the warmth that helps the non-technical majority past the fear, and leaves the hint ladder feeling like a failure admission. The restrained-guide middle path captures the warmth without the childishness — recommended.

---

## 11. Build notes (handoff)

- The prototype's structure (SVG flow paths, node `transition`, `countUp`, `prefers-reduced-motion` guard, max-height lesson reveal) is the correct skeleton — generalize it, don't rewrite it. Swap the teal set for the Okabe–Ito roles (§6a) and emoji icons for line-art icons.
- One board component, `data-state`-driven, reused at every rung; rung config supplies icons, caption text, the staged wrong answer (recorded for reproducibility), the correct value, and the authored narration string.
- Themes/rating/streak are view-state on top of a solved-rung store; none of it is LLM-derived (pass/fail stays deterministic — the thesis applies to the course itself).
