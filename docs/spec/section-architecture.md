# Section: Architecture — the puzzle engine and the build-and-verify sandbox

Product: **Puzzle Ladder**. This section is the technical spec: how to build on Jeff's
repo, the level-content schema, the two execution engines (early-world deterministic
puzzle engine; later-world live-AI sandbox), the check engine, persistence, provider
abstraction, cost/latency controls, telemetry, and the MVP/phase cut.

It is written to be built as-is. Every choice is made; alternatives are named and
dismissed in one line. It honors the panel rails from `section-curriculum.md` (P1–P15)
and the five reviews in `inputs/`.

**MCP note:** `@kirocrew-computer` was declared but not configured this session; no
computer-use tools were available. Not needed for this task — all work was repo clone,
file reads, and authoring.

---

## 0. The one architectural idea the reviews force

The AI engineer and assessment reviews converge on a single structural requirement that
dominates every component below:

> **Determinism lives in two layers that must never be conflated: the GENERATOR (the LLM
> — always stochastic) and the GATE (the check + the tool it writes — can be
> deterministic). The product's integrity is the strict separation of these layers.**

Three consequences drive the architecture:

1. **The check (gate) is never an LLM at decision time.** No pass/fail verdict is ever
   produced by a model. Checks compile to executable predicates that run deterministically.
   This is non-negotiable (brief constraint; AI-engineer risk #2 and #3; assessment rec 2).
2. **Every check must be provable-failable: it ships with a planted violation and the
   engine refuses to credit a check it has not observed go red** (P2/P3; assessment "the
   non-negotiable column"). This is a first-class engine capability, not level content.
3. **Check-authoring is committed before output is revealed, and the commit is logged**
   (P7; assessment C4). The sequence is enforced in the engine state machine, not by UI
   convention.

Everything else is in service of these three.

---

## 1. Build on Jeff's repo vs. greenfield — RECOMMENDATION: **fork-and-extend Jeff's repo as one of two engines, build the ladder shell greenfield around it.**

### What Jeff's repo actually is (verified by reading the clone)

Cloned read-only from `https://github.com/kerrlabs/ai-determinism-demo` @ `761553d`.
**The remote has exactly one branch, `main`** (`git ls-remote --heads` returns only
`refs/heads/main`). There is **no `react-redesign` branch** — that work is already
*merged into main* as a single squashed commit ("React+TS+Tailwind redesign:
non-technical narrative (Guesser vs Formula-Writer), 6 views, CVD-safe palette, custom
SVG charts, served by existing FastAPI"). So the "redesign branch" in the brief is live
on main; nothing is missing.

Structure:
- **Backend** (`app/`): FastAPI + SSE. `providers.py` (OpenAI / Bedrock / Mock behind one
  `LLMProvider.complete(system, user, temperature)` interface), `agents.py` (Agent A =
  model computes over raw rows, temp 0.7, scatters; Agent B = model writes SQL, SQLite
  executes, exact), `harness.py` (runs N times, scores vs. ground truth, streams
  `RunEvent`s), `questions.py` (5 seeded questions + canonical `truth_sql`), `data.py`
  (seed 42, 2000 rows, byte-reproducible), `config.py` (pydantic-settings), `server.py`
  (`/api/config`, `/api/questions`, `/api/stream` SSE).
- **Frontend** (`frontend/`): React 19 + TS + Tailwind 4 + Vite 8, shadcn-style UI
  primitives (`components/ui/*`), six views (`ScatterView`, `DistributionView`,
  `ConvergenceView`, `MechanismView`, `HumanVsAiView`, `ScorecardView`), `useRunStream`
  hook over the SSE endpoint, `lib/{api,types,scale,utils}.ts`. Builds to
  `../frontend-dist`, which `server.py` auto-mounts.
- **Legacy** (`web/`): the original vanilla-JS UI, kept as a fallback mount.

### The decision

Jeff's repo is **not a learning-platform skeleton** — it is a *single, excellent,
real-model demonstration of the thesis for one competency* (aggregation/calculation:
C3 "route a right-answer step to a tool"). It is the natural live engine for exactly the
rungs the brief names (World 2+ aggregation/calculation). It is **not** a ladder, has no
levels, no checks, no progression, no auth, no persistence, no sandbox for *novice-directed
code* (its only "sandbox" is a hard-coded SQL path for one dataset).

Therefore:

| Component | Decision | Why |
|---|---|---|
| **Provider abstraction** (`providers.py`) | **Reuse verbatim**, extend | Already exactly the mock/OpenAI/Bedrock shape the brief asks for. Don't rebuild it. |
| **The A-vs-B harness** (`agents.py` + `harness.py` + SSE) | **Reuse as the "live aggregation engine"** behind World 2+ calculation rungs | It is the real-model proof the brief calls "the natural real-model engine for the aggregation/calculation rungs." Wrap it; don't reimplement. |
| **Seeded dataset** (`data.py`, seed 42) | **Reuse**, generalize to per-level datasets | Byte-reproducibility is already correct and is a hard brief constraint. |
| **Frontend React/Tailwind/Vite stack + UI primitives** | **Adopt the stack and the `ui/` primitives**; the six demo *views* become *one level renderer* among many | The toolchain, CVD-safe palette, and shadcn primitives are reusable; the specific six-view demo layout is for one level, not a ladder. |
| **Ladder shell** (map, worlds, levels, XP, hints, auth, persistence, check engine, sandbox) | **Build greenfield** in the same monorepo | None of it exists in Jeff's repo. |
| **FastAPI app shape** (`server.py` static-mount + `/api`) | **Keep the pattern**, add routers | Good bones; just add `/api/levels`, `/api/attempts`, `/api/checks`, `/api/sandbox`. |

**One-line alternatives dismissed:** *Pure greenfield* — throws away a working,
real-Bedrock-validated engine that is literally the hardest-to-get-right proof in the
product (A 0/10, B 10/10); rejected. *Build everything inside Jeff's repo as-is* — its
structure is a one-page demo, not a multi-world app; forcing a ladder into it fights the
grain; rejected. **Chosen: a monorepo that absorbs Jeff's `app/` as the `engines/aggregation`
package and his frontend stack as the UI foundation, with the ladder built around it.**

### Target repo layout (greenfield shell, Jeff's code absorbed)

```
puzzle-ladder/
  app/
    main.py                 # FastAPI entry; mounts routers + built SPA (keeps Jeff's static-mount trick)
    config.py               # extends Jeff's pydantic-settings (adds DB url, sandbox mode, cost caps)
    routers/
      levels.py             # GET /api/levels, /api/levels/{id}  (serves compiled level packets, no answers)
      attempts.py           # POST/GET attempts, XP, stars, check-commit sequencing
      checks.py             # POST /api/checks/compile, /api/checks/run  (check engine)
      sandbox.py            # POST /api/sandbox/run  (live-AI build-and-verify; later worlds)
      stream.py             # Jeff's SSE /api/stream, now parameterized by level
    engines/
      aggregation/          # <-- Jeff's app/ lands here almost verbatim
        agents.py providers.py harness.py questions.py data.py
      puzzle/               # deterministic early-world engine (recorded AI, scripted)
      check/                # plain-English -> executable predicate compiler + planted-violation runner
      sandbox/              # untrusted-code execution adapter (see §4)
    models/                 # SQLModel tables: learner, attempt, check_commit, event
    content/levels/*.yaml   # declarative level packets (see §2)  -- the course IS data
  frontend/                 # Jeff's React/TS/Tailwind/Vite, extended
    src/
      ui/                   # Jeff's shadcn primitives (reused)
      renderers/            # one component per level "board" archetype (pipeline, slot-fill, check-author, sandbox)
      map/ progress/ hints/ # ladder shell
      lib/                  # api, types, sandbox-worker bridge
```

---

## 2. Level content format — a declarative level packet (the course is data, not code)

A level is a **declarative YAML file** compiled to a signed JSON "packet" the client
loads. The schema below covers every field the curriculum section's level specs reference:
task, available tools, check definition, planted violations, hints, skins, and the
competency/anti-gaming metadata the assessment review demands. **Answers and planted-bad
seeds are stripped from the client packet** and resolved server-side (same discipline as
Jeff's `/api/questions` omitting `truth_sql`).

### Why YAML authored, JSON served
YAML for human authoring (comments, readability — authors are instructional designers, not
engineers). A build step validates against a JSON Schema, resolves the two skins, computes
derived fields, and emits a versioned JSON packet. The client never parses YAML.
*Alternative dismissed:* a DB-backed CMS — premature; files + git give review, diff, and
the "nothing ships until the row is complete" gate (assessment traceability table) for
free.

### Schema (annotated example — World 2, a calculation rung, non-technical + technical skins)

```yaml
# content/levels/w2l3-dont-let-ai-do-math.yaml
schema_version: 1
id: w2l3_calc_revenue
world: 2
order: 3
competency: C3            # must match a row in the curriculum competency table
title: "Don't let AI do the math"
spine_word: verifiability # P4: never "determinism" before the capstone world
reading_level: 8          # enforced by a build-time readability lint on all copy

engine: aggregation       # which engine renders/runs this level:
                          #   puzzle    -> deterministic early-world engine (recorded AI)
                          #   aggregation -> Jeff's live A/B SQL engine
                          #   sandbox   -> live-AI build-and-verify (later worlds)

# ---- The task shown to the learner (both skins share ONE objective) ----
task:
  scenario: >
    A sales report needs the total revenue for the West region in Q3.
  question_ref: q2_revenue_west_q3   # for engine=aggregation, points into Jeff's question set
  success_statement: "The number is exact and the same every time."

# ---- Tools the learner may place/choose (P14: constrained, never free-form) ----
tools_available:
  - id: ask_ai_directly
    label: "Let the AI add it up"       # the guessing path (the planted-failure route)
    deterministic: false
  - id: sql_tool
    label: "Give the AI a calculator (database)"
    deterministic: true
    binds_engine: aggregation            # selecting this routes through Agent B

# ---- The check that DEFINES success (identical across skins; P14) ----
check:
  id: chk_exact_and_stable
  # Authored by the LEVEL in early worlds; AUTHORED BY THE LEARNER in World 4+.
  # Stored as a structured predicate spec (see §5), never free prose at runtime.
  predicate:
    kind: numeric_exact_and_stable       # a check-engine primitive (see §5 catalog)
    params:
      tolerance: 0.0
      stability_runs: 5                   # same answer across N runs (reproducibility)
      truth_ref: q2_revenue_west_q3       # server resolves ground truth; never sent to client
  plain_english: "Every run gives the same dollar amount, and it matches the real total."

# ---- Planted violations: a check that is NEVER seen red earns no stars (P2/P3) ----
planted_violations:
  - id: pv_guess
    description: "The AI's own arithmetic (Agent A) scatters and is usually wrong."
    source: recorded                      # see §3 recording format; or 'live' for aggregation engine
    must_fail_check: chk_exact_and_stable # engine asserts this seed turns the check RED
  good_seed:
    id: gs_sql
    source: engine                        # Agent B's executed result
    must_pass_check: chk_exact_and_stable # engine asserts this seed turns the check GREEN
# -> two-sided proof (P3): the check MUST fail pv_guess AND pass gs_sql, else build fails.

# ---- Hints: exactly 3, nudge -> structural reveal -> worked move (P11) ----
hints:
  - cost_stars: 1
    kind: nudge
    text: "Which part of this has exactly one right answer?"
  - cost_stars: 1
    kind: structural
    text: "The adding-up step has a right answer. The AI shouldn't guess it."
  - cost_stars: 1
    kind: worked_move
    text: "Place the calculator tool between the question and the answer."

# ---- Skins: same objective, two presentations (P14) ----
skins:
  non_technical:
    board: pipeline                        # renderer archetype
    interaction: place_tool_in_slot        # one slot, pick-from-valid; no syntax
  technical:
    board: slot_editor
    interaction: write_sql_select          # constrained editor, not free text
    scaffold: "SELECT ... FROM sales WHERE region = ? AND quarter = ?"

# ---- Scoring (P12): stars reward check QUALITY, not just green ----
scoring:
  star_1: "check caught the planted bad answer"
  star_2: "check also passed the good answer without over-fitting"
  star_3: "check survived a held-out case the learner never saw"
  held_out_case_ref: q2_heldout_eastq1     # server-side only

# ---- Telemetry contract: which events this level must emit (see §7) ----
telemetry:
  require: [check_committed_before_output, planted_seen_red, hint_used, attempt_result]
```

### Build-time validation (the "nothing ships incomplete" gate)
A `validate_levels.py` CI step enforces, for every packet:
1. `competency` resolves to a real curriculum row.
2. `check.predicate.kind` is a known check-engine primitive.
3. **The planted violation actually turns the check red and the good seed turns it green**
   — run the compiler + runner at build time against both seeds. A level whose check is
   vacuous (passes both, or fails to fail the planted bad) **fails the build.** This is the
   vacuous-check detector applied to authored content (assessment rec 4; P3).
4. All learner-facing copy passes an 8th-grade readability lint.
5. Both skins resolve and reference the same `check.id`.

---

## 3. The puzzle engine — early worlds (Worlds 1–4): deterministic, recorded AI

Early worlds must be **instant, reproducible, and never flaky** (P8, P9; UX "pin the AI
failure"). A live model cannot be in the critical path of a World-1 puzzle: it adds
latency, cost, and — fatally — it won't fail the *same* way twice, so a puzzle could
become unsolvable or the "planted" failure could accidentally come out right.

### Design: the AI's turns are **recorded fixtures**, the board is client-side state

For engine `puzzle`, there is **no model call at play time**. The level packet carries, or
the server resolves, a small set of **recorded AI responses** — real outputs captured once
from a real provider (via Jeff's `providers.py` against OpenAI/Bedrock) and frozen. The
"watch the AI guess wrong" beat (P1) replays a recorded scatter; the "tool forces it right"
beat replays the recorded good output. The learner's action (place a tool, fill a slot)
selects *which recorded branch* plays. The check runs client-side and deterministically.

### Recording format (how a recorded AI response is captured and stored)

```yaml
# content/recordings/q2_revenue_west_q3.rec.yaml   (generated, checked in)
captured_from: {provider: bedrock, model: "anthropic.claude-...", temperature: 0.7}
captured_at: "2026-10-10"
question_ref: q2_revenue_west_q3
truth: 227421.36
branches:
  guess:         # Agent A, the planted failure (several real wrong runs, replayed in order)
    - {answer: 179240.11, raw: "...FINAL ANSWER: 179240.11"}
    - {answer: 441992.0,  raw: "...FINAL ANSWER: 441992"}
  tool:          # Agent B, the deterministic good path
    - {answer: 227421.36, sql: "SELECT ROUND(SUM(revenue),2) ... AS answer", raw: "```sql ... ```"}
```

Recordings are produced by a `capture.py` harness that calls Jeff's `run_agent_a`/
`run_agent_b` N times and writes the fixture. This is how the brief's constraint
("puzzles must be REPRODUCIBLE; live-model variance must not make a puzzle flaky") is met
while the failures stay *real* (captured from a real model), answering the UX reviewer's
"savvy learners will smell a staged rail": these are genuine model outputs, just frozen.

### Why not call the live model with temperature 0 for early worlds?
Temperature 0 is **not** reproducible across model/provider versions (AI-engineer review:
"not bit-reproducible across model versions, batching, hardware"). A frozen fixture is the
only true guarantee. *Alternative dismissed.*

### The genre hand-off (P9)
Worlds 1–4 run entirely on this engine: instant, offline-capable, zero model cost. The
explicit "entering the workshop" transition at World 5 L1 is where engine flips to
`sandbox`/`aggregation` and real latency appears — designed, with a spinner-state and the
"this wait is the model thinking, not you failing" affordance (P9, P10).

---

## 4. The live-AI sandbox — later worlds (Worlds 5–7): the hardest component

Later worlds let the learner **direct the AI to write real code**, then prove it with
their own check (C8–C12). Running LLM-generated code authored at the behest of a
non-technical user is an **untrusted-code-execution problem** — the single hardest build
in the product (AI-engineer hard-risk #1; UX "safe execution is the hardest technical
component"; brief finding #6). It gets a real threat model, not a bullet.

### Decision: **in-browser Pyodide (Python-on-WASM) Web Worker for MVP; server-side gVisor/Firecracker container as the Phase-2 scale/power path.** Pick: **Pyodide for MVP.**

| Option | Isolation | Latency | Cost | Verdict |
|---|---|---|---|---|
| **Pyodide (CPython→WASM) in a sandboxed Web Worker** | Runs in the learner's own browser tab; **no server execution of untrusted code at all**; WASM memory-safe; worker has no DOM, and with no network/FS bridge exposed it cannot touch either | ~1–3s cold load (cached after), then fast | **~$0** server compute for execution | **CHOSEN for MVP** |
| Server containers (gVisor/Firecracker microVM, no-net, read-only FS, seccomp, cgroለimits) | Strong kernel-level isolation | network round-trip + container spin | real per-run compute + ops burden | **Phase 2**, only when a level needs packages/compute Pyodide can't do |
| Raw server `exec`/subprocess with regex guards | None worth the name | — | — | **Rejected outright** — this is the Jeff `_is_safe_select` pattern (good for SQL) misapplied to arbitrary Python; a blocklist cannot contain Turing-complete code |

**Why Pyodide for MVP:** it moves the untrusted code **off our servers entirely**. The
worst case of a learner (or a prompt-injected model) producing hostile code is confined to
*that learner's own browser tab*, not our infrastructure or other learners. It is free,
scales infinitely (runs on the client), and removes the single largest ops/security
liability from the MVP. The brief says "pick one, justify" — this is the justified pick.

### Threat model (Pyodide Web Worker sandbox)

Trust boundary: **the model and the learner are both untrusted** with respect to the code
that executes.

| Threat | Control |
|---|---|
| **Arbitrary code execution harming the host** | Code runs in WASM in a Web Worker, not on our server. WASM is memory-safe and has no syscalls; it cannot reach the OS. |
| **Network exfiltration** (secrets, calling out) | The Worker is created with no `fetch`/`XMLHttpRequest` bridge; Pyodide's `js` FFI is **not** exposed to level code (we load Pyodide, then delete `pyodide.registerJsModule` access and run user code in a restricted namespace). A strict CSP (`connect-src 'self'`) on the app is defense-in-depth. |
| **Filesystem / data access** | Pyodide's MEMFS is in-worker and ephemeral; no `nodefs`/real-FS mount. No access to cookies/localStorage (Workers don't have them). |
| **Resource exhaustion / infinite loop** | Hard **wall-clock timeout** enforced by the main thread: if the Worker doesn't post a result in `N` seconds, `worker.terminate()`. Memory capped by the Worker; a runaway allocation kills only the Worker. (All commands in Jeff's repo already use timeouts — same discipline.) |
| **Prompt-injection → code** (model coerced into writing hostile code) | Irrelevant to blast radius because of the isolation above; additionally, generated code is shown to the learner before run (transparency) and only the **check's** verdict is trusted, never the code's self-report. |
| **DoS of our model/API via the sandbox loop** | Cost/latency controls in §6 (per-learner rate limit, run budget) gate the *generation* step, which is the only server-side cost. |
| **False green via a weak check** (the real correctness threat) | Handled by the check engine (§5): planted-violation requirement + held-out adversarial case + check-before-output. This is where "passes but wrong" (AI-engineer risk #3) is contained. |

### Scoped-down surface (AI-engineer rec 5)
MVP sandbox levels restrict the generated tool to **pure functions over
strings/numbers/structured data — no I/O, no imports beyond an allowlist (`math`, `re`,
`datetime`, `json`)**. The level packet declares the function signature the AI must fill;
the learner directs *behavior*, the AI writes the *body*, the check runs it against a
case set. We do **not** promise open-ended "AI writes any tool" in MVP — exactly the
reviewer's recommendation.

### Execution flow (sandbox level)
1. Learner commits their check (locked; P7) → logged.
2. Learner directs the build in plain language → server calls provider (Jeff's
   `providers.py`) to generate a pure function body.
3. Generated code is returned to the client and shown.
4. Client Web Worker loads Pyodide, runs the function against the **case set** (good +
   boundary + adversarial, P5), under timeout.
5. Check predicate evaluates each case's output deterministically → red/green per case.
6. Stars per §scoring; a green on only the happy case ≠ full stars (P5, P12).

### What is server-side vs client-side
- **Server:** code *generation* (model call), ground-truth/case-set resolution, attempt
  recording, cost accounting. Never executes untrusted code in MVP.
- **Client (Worker):** Pyodide execution of generated code + deterministic check eval.

---

## 5. The check engine — plain-English → executable predicate, with human-confirm, vacuous detection, planted-violation runner

This is the **load-bearing component** (keystone skill C5–C7; "build the vacuous-check
detector first", assessment rec 2). It must satisfy the brief's hard rule: **no LLM makes
a pass/fail decision.**

### The honest answer to the oracle problem (AI-engineer risk #2, stated explicitly)
A novice's free-text check ("make sure the summary is accurate") has **no sound
deterministic translation.** The product does not pretend otherwise. It resolves the
tension by **constraining what a check can be** rather than interpreting free prose:

**A check is authored by composing from a fixed catalog of deterministic predicate
primitives via a guided, slot-filling UI — never as raw free text that an LLM then
interprets.** The "plain English" the learner sees is a *rendering* of the structured
predicate, not the source of truth. This makes translation **formal, not LLM-as-judge**
(answering AI-engineer rec 4 unambiguously: *formal*).

### Predicate primitive catalog (the only things a check can assert)

| `kind` | Asserts | Example rung |
|---|---|---|
| `numeric_exact_and_stable` | value matches truth within tolerance AND is identical across N runs | calculation (W2) |
| `numeric_tolerance` | within ± tolerance of truth | measurement |
| `schema_shape` | output has exactly these fields/types | structure (W1) |
| `enum_in_set` | value ∈ allowed set | classification |
| `string_matches` | regex / exact / contains (bounded) | format |
| `grounded_in_source` | every claimed fact appears in the named source span; else must abstain | grounding (W3, C4) |
| `cases_all_pass` | a function's output equals expected for every case in a set (incl. boundary+adversarial) | sandbox (W5+) |
| `abstains_when_absent` | returns "not in source" rather than inventing | grounding/abstention |

Each primitive is a pure Python function `(output, params, truth) -> {passed: bool,
detail: str}`. **Deterministic by construction.** Adding a competency = adding a primitive,
reviewed like code.

### Authoring UX → predicate (the guided path, C7)
The learner builds a check by: (1) picking what to check (a field, the number, a fact),
(2) picking the relation from the valid primitives for that type, (3) filling bounded
slots (tolerance, the set, the source). The UI renders the plain-English sentence live.
**No free-text-to-code step exists**, so there is nothing for an LLM to misinterpret.

### Human-confirm step
Before a check is committed, the learner sees the rendered sentence AND the two seeds it
will be run against, and confirms "this should PASS the good one and FAIL the bad one."
This is the human-in-the-loop gate (assessment C4; AI-engineer rec 6) — the human confirms
*intent*, the engine enforces *execution*.

### Vacuous-check detection (the thesis applied to the course)
On commit, the engine runs the composed predicate against **both** the planted-bad seed
and the good seed:
- If it does **not** go red on the planted bad → **rejected as vacuous** with a specific
  message ("this check passes even the wrong answer — tighten it"). No stars. (P2/P3,
  assessment "non-negotiable column", exploit #3.)
- If it goes red on the good seed → it's over-fit/wrong-direction → flagged.
- Only a **two-sided** check (red on bad, green on good) is credited.

### Planted-violation runner
A single service `check.run(predicate, output, truth) -> verdict` used in three places:
(1) build-time level validation (§2), (2) commit-time vacuous detection, (3) play-time
scoring. One code path → the check behaves identically in authoring, CI, and play.

### Check-before-output sequencing (P7, C4) — enforced in the state machine
Attempt state machine for "prove it" / authoring levels:
`VIEW_TASK → COMMIT_CHECK (edit locks, timestamp logged) → REVEAL_OUTPUT → RUN_CHECK →
SCORE`. The server **rejects** a RUN_CHECK whose `check_commit` timestamp is not strictly
before `output_revealed_at`. This kills the dominant gaming path (let the AI shape a
check, then rubber-stamp its green — assessment exploit #1).

---

## 6. Progress / XP persistence

### Store: **SQLite via SQLModel for MVP; Postgres same schema for Phase 2.**
Jeff already ships SQLite + the pattern of a deterministic seeded DB. Reuse it. The ORM is
SQLModel (Pydantic-native, pairs with the existing pydantic-settings). *Alternative
dismissed:* client-only localStorage — loses cross-device progress, is trivially editable
(a learner could fake XP, breaking the "informational reward" integrity from
`section-gamification.md`), and makes the telemetry/analytics in §7 impossible.

### Tables (minimum viable, authored to the gamification section's rules)
```
learner(id, handle, created_at, settings_json)          # settings: reduced_motion, skin_pref, cvd_mode
attempt(id, learner_id, level_id, started_at, result,   # result: solved|failed|abandoned
        stars, hints_used, skin, planted_seen_red bool)  # planted_seen_red gates credit (P2)
check_commit(id, attempt_id, predicate_json,            # the authored predicate (audit + analytics)
             committed_at, output_revealed_at,          # the sequencing proof (P7/C4)
             vacuous_rejected bool)
progress(learner_id, world, level, best_stars, rating,  # rating = Elo-equivalent (gamification §)
         streak_days, last_played_at)
event(id, learner_id, level_id, kind, payload_json, ts) # telemetry firehose (§7)
```

### Rules baked into persistence (not UI)
- **Stars are only written when `planted_seen_red = true`** for that attempt (P2 enforced at
  the data layer, not trusted to the client).
- `rating` and `streak` follow the defaults in `section-gamification.md`; this section only
  provides the columns, not the formulas (owned there).
- **Formative vs summative** separated: certification is a distinct `transfer_result` row
  (held-out boss task), never computed from `attempt` greens (P15, assessment rec 5).

### API
`GET /api/progress/{learner}` (map state), `POST /api/attempts` (open), `PATCH
/api/attempts/{id}` (commit check / record result — server enforces the state machine from
§5). Auth: MVP = a signed anonymous handle cookie (no PII; non-technical adults, low
friction); Phase 2 = real accounts if cohorts/transfer-studies need identity.

---

## 7. Provider abstraction (mock / OpenAI / Bedrock)

**Reuse Jeff's `providers.py` as the project-wide abstraction** — it is already exactly
the required shape: one `LLMProvider.complete(system, user, temperature) -> str` with
`OpenAIProvider`, `BedrockProvider`, `MockProvider`, selected by a `LLM_PROVIDER` setting.

Two extensions:
1. **A `generate_code` convenience** on top of `complete` for sandbox levels (same
   interface, a system prompt that constrains to a pure-function body + the allowlist from
   §4). No new provider type.
2. **Capture mode** — the recording harness (§3) calls the real providers once to freeze
   fixtures. The `MockProvider` stays the offline/CI/dev default (and is what makes the
   test suite deterministic), exactly as Jeff uses it. CI runs with `LLM_PROVIDER=mock`;
   early-world play needs **no** provider at all (fixtures).

Keep Jeff's crucial discipline: **the mock truth-hint (`<<MOCK_TRUTH>>` / `<<MOCK_SQL>>`)
is injected only for `MockProvider` and never sent to a real provider** — this is a
genuinely important detail (see §8 review) and the pattern carries forward unchanged.

---

## 8. Cost & latency controls

Only one thing costs money or time: the **generation** model call in sandbox/aggregation
levels (Worlds 5–7, and live-aggregation in W2+). Early worlds are free fixtures.

| Control | Mechanism |
|---|---|
| **No model in the hot path for Worlds 1–4** | Recorded fixtures (§3). Zero cost, instant. This is the biggest lever. |
| **Per-learner generation budget** | `event`-table counter + a cap (default: N code-gens / rotating window). Over cap → "take a breather" state, not an error. |
| **Cache identical generations** | Keyed on `(level_id, learner_directive_normalized, model)`. A learner re-running the same directive re-uses the prior generation (and its shown code) — cheaper and more reproducible for the learner. |
| **Short, bounded prompts** | Sandbox prompts are a fixed template + the learner's bounded directive; no raw dataset dumped (contrast Jeff's Agent A, which dumps 2000 rows — fine for the demo, avoided for the scaled sandbox). |
| **Streaming for perceived latency** | Reuse Jeff's SSE so generation/first-token appears incrementally; pair with the P9/P10 spinner affordance. |
| **Timeouts everywhere** | Generation call timeout (server) + Pyodide execution timeout (client Worker). A timeout renders in the neutral gray lane (P10), never as the learner's red. |
| **Model tiering** | Cheapest capable model for code-gen (configurable via `llm_model`); the brief's real-Bedrock result shows a small model suffices for the SQL/pure-function translation task. |

---

## 9. Telemetry for learning analytics

Every attempt emits structured `event` rows (fire-and-forget, never blocks play). The
analytics exist to answer the assessment review's measurement questions — *does green
certify the competency, or just a path to green?*

**Required events** (each level's packet declares its `telemetry.require` set, §2):
- `check_committed_before_output` — with both timestamps (proves P7/C4 held).
- `planted_seen_red` — the learner's check was observed failing the planted bad (P2).
- `vacuous_rejected` — a composed check that couldn't fail (the keystone-difficulty signal;
  this is the #1 metric to watch per the panel).
- `hint_used` — which rung of hint, cost paid (P11).
- `attempt_result` — stars, skin, which case(s) failed (good/boundary/adversarial, P5).
- `skin_switch`, `abandon_at_state` — genre-handoff and drop-off diagnostics (P9).

**Analytics these enable (and the brief/panel ask for):**
- **Where do learners author vacuous checks?** (per-level `vacuous_rejected` rate) — the
  keystone-risk dashboard; the first thing to user-test (P6).
- **Does check-authoring quality predict transfer?** correlate authored-predicate strength
  (did it catch the adversarial case, star_3 rate) against the held-out boss-task result —
  the only honest basis for any future transfer claim (assessment: do not publish transfer
  claims without this study).
- **Genre-handoff drop-off** at World 5 L1 (P9) and **hint-dependency** curves per rung.

Privacy: no PII in MVP (anonymous handles); events are learning signals, not tracking.

---

## 10. Review of Jeff's code — quality & guardrails (specific file references)

Read in full: `app/{agents,harness,providers,questions,server,data,config}.py`. Overall:
**clean, well-documented, correctly-reasoned demo code with unusually good instincts about
the exact failure modes this product cares about.** It is a strong foundation to absorb.

**Strengths (keep and propagate):**
- **The read-only SELECT guard** — `app/agents.py` `_is_safe_select()` + `_FORBIDDEN_SQL`:
  rejects multiple statements (`;`), blocklists `insert|update|delete|drop|alter|create|
  attach|pragma|replace`, and requires the statement to start with `select`. This is a
  genuinely good *defense-in-depth* for the SQL case. **Caveat for scaling:** a
  regex/keyword blocklist is the right tool for *constrained SQL* but **must not** be
  mistaken for a sandbox for arbitrary code (§4) — a blocklist cannot contain
  Turing-complete Python. Jeff's guard is correct *for what it guards*; don't over-generalize it.
- **Separation of truth from the agent** — `app/questions.py`: canonical `truth_sql` defines
  correctness and is **never shown to the agents**; `server.py:get_questions()` deliberately
  omits `truth_sql` from the API ("so the canonical query is never exposed"). This is
  exactly the client/server answer-stripping discipline this spec adopts for level packets
  (§2).
- **Mock-hint isolation** — `app/harness.py` + `agents.py`: the `<<MOCK_TRUTH>>` /
  `<<MOCK_SQL>>` hints are attached **only** when the provider is `MockProvider`
  (`hint = truth if isinstance(provider, MockProvider) else None`), with explicit comments
  that a real provider must never see them or "the demo would be meaningless." Correct and
  important; carried forward in §7.
- **Reproducible data** — `app/data.py`: fixed `SEED = 42`, stable sort, DB rebuilt from
  scratch; byte-for-byte identical. Directly satisfies the brief's reproducibility rule.
- **Robust answer parsing** — `agents.py:_parse_number_from_json()`: prefers an explicit
  `FINAL ANSWER:` line, then JSON, then falls back to the **last** number (not the first —
  avoids catching the "3" in "Q3"). Thoughtful handling of real-model messiness.
- **Determinism measured, not asserted** — `harness.py:_verdict()` counts `distinct_values`
  across runs to *empirically* label each agent deterministic/non-deterministic. Good
  epistemics — it demonstrates the property instead of claiming it.
- **Threaded SSE bridge** — `server.py:_run_in_thread` + `queue.Queue` + `run_in_executor`:
  a correct way to stream a blocking sync harness over async FastAPI. Reusable.

**Weaknesses / things to change when absorbing (specific):**
- **`_execute_sql()` in `agents.py` opens a fresh `sqlite3.connect(DB_PATH)` with no
  explicit read-only mode.** The `_is_safe_select` guard is the only thing preventing
  writes. For the scaled product, open the connection read-only
  (`sqlite3.connect("file:...?mode=ro", uri=True)`) as defense-in-depth so the guard isn't
  load-bearing alone.
- **`_is_safe_select` is substring/keyword-based**, so a column or string literal named
  e.g. `created_at` containing `create` is caught by `\bcreate\b`? No — it's word-bounded,
  but a value like `'drop-ship'` in a `WHERE` would trip `\bdrop\b`. Low impact for the
  fixed schema; note it if the dataset grows text columns. Prefer a real SQL parser
  (`sqlglot`) if SQL authoring becomes learner-facing.
- **No per-call timeout on the provider request** in `providers.py` (OpenAI/Bedrock calls
  can hang). Add a client timeout — matters once generation is in the learner hot path (§8).
- **`run_in_executor(None, ...)`** uses the default threadpool; under concurrent learners
  this needs a bounded executor + the generation rate-limits from §8.
- **Agent A dumps the full 2000-row CSV into the prompt** (`_load_rows_as_text`). Fine for a
  demo; for the scaled sandbox we never dump raw data into prompts (cost + context limits) —
  §8.
- Minor: broad `except Exception` with `# noqa: BLE001` in several spots — acceptable for a
  demo's "surface any provider error," but the product should classify provider errors
  (timeout vs auth vs rate-limit) to drive the P10 gray-lane UX.

**Guardrail verdict:** Jeff's guardrails are correct and well-reasoned *for a bounded SQL
demo*. The product's new guardrail surface (arbitrary novice-directed code) is a different
and harder problem that his repo does not attempt — which is why §4 moves execution to
WASM isolation rather than extending the blocklist.

---

## 11. MVP vs. later phases

### MVP (prove the product in miniature) — the panel's "build this first"
The brief, PITCH, and UX/assessment reviews all point at the **same** first build: the
check-authoring moment, not the full sandbox.

1. **The ladder shell**: map, one world, level packets as data (§2) with the build-time
   two-sided validation gate, SQLite progress + stars + hints (§6), reduced-motion /
   CVD / keyboard a11y from day one (WCAG 2.1 AA, brief constraint).
2. **The puzzle engine with recorded AI** (§3) for Worlds 1–4 — zero model cost, instant,
   reproducible. Capture fixtures from Jeff's real providers.
3. **Absorb Jeff's aggregation engine** (§1) behind one or two live W2 calculation levels
   to show a *real* model (the A-vs-B proof) — this is the lowest-risk way to introduce the
   live model because the success condition stays a deterministic check.
4. **The check engine** (§5) end-to-end: primitive catalog, slot-filling authoring UI,
   human-confirm, **vacuous-check detector**, planted-violation runner, check-before-output
   sequencing. *Build this first within the MVP* (assessment rec 2) and user-test it first (P6).
5. **One World-4 keystone level, both skins** — the "entire product in miniature" the pitch
   names: a non-technical user authors a check, sees it catch a planted wrong answer,
   red→green. If this lands, the rest is content.
6. **Telemetry** for `vacuous_rejected`, `planted_seen_red`, `check_committed_before_output`
   (§7) from day one — you cannot tune the keystone without it.

**MVP explicitly excludes** the live-AI code sandbox (Worlds 5–7). The live aggregation
engine (Jeff's) gives a real-model beat without the untrusted-code build.

### Phase 2 — the sandbox
7. **Pyodide Web Worker sandbox** (§4), scoped to pure functions + allowlist, for World 5
   (C8–C10). Full threat model implemented; case-set proving (good/boundary/adversarial, P5).
8. **World 6** (re-direct on failure, false-green detection, C11/C12) and **World 7**
   (risk-tiering, C13) — the latter scored against an expert key, not self-report
   (assessment exploit #4).
9. **Held-out transfer/boss tasks + the summative certification path** (P15); the
   transfer-correlation study before any "predicts real-world performance" claim.

### Phase 3 — scale & depth
10. **Server-side container execution** (gVisor/Firecracker) only if a level needs packages
    or compute Pyodide can't do; Postgres; real accounts/cohorts.
11. **Themed drill sets + daily puzzle + rating-matched queue** (P13, UX rec 5) — the
    replay/retention surface, built on the same level-packet data model.
12. **A puzzle/case generator** to attack the "fixed 7 rungs, climbed once" replayability
    cap (UX "replayability is low as designed").

### Build order rationale
The keystone (check-authoring + vacuous detection) is both the #1 learning risk and the
cheapest thing to prove, and it needs **neither** the sandbox **nor** live code-gen. The
hardest engineering risk (untrusted code execution) is deferred to Phase 2 behind a
WASM-isolation decision that is already made. Jeff's real-model engine is absorbed early to
get an honest live-AI beat at low risk. This sequences highest-learning-value-per-risk
first, exactly as the panel recommends.
