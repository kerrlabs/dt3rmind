# Executive Summary — Dt3rmind

*Last verified against the codebase: 2026-10-21. Figures below are read from live source,
the authored packet JSON, `npm test`, and `npm run build` — not from narrative docs.*

## What it is

**Dt3rmind** (pronounced "Determined") is a gamified, chess.com-puzzle-style web course that
teaches **non-technical adults how to direct AI reliably**. Its single thesis drives every
level: *determinism comes from the tools you force the AI through, not the words you give it.*
Rather than teaching cleverer prompting, it teaches people to stop asking AI for the **answer**
and instead ask for the **tool and the check** that make an answer exact — and to prove it.

It was built as a HackMidwest project with a three-minute judging pitch.

## The problem it dramatizes

Ask an AI to total 2,000 rows of sales data and you get five different wrong numbers
(179K–442K) because the model *predicts what a total looks like* rather than computing it. Ask
it to write a formula and let a spreadsheet run it, and you get the exact answer every time. The
proof point is a real AWS Bedrock run: an AI reading data scored **0/10 correct**, while an AI
writing SQL executed by SQLite scored **10/10 exact** — same model, same data.

## Product shape (verified from `content/levels/` and `src/content/worlds.ts`)

- **7 worlds**, each with 3 practice levels plus a boss. World 2 also carries an extra level
  (`w2-l4`); World 4 adds a **keystone** (`w4-l4`); the **capstone** is authored as a second,
  higher-order boss in World 7. **Total: 31 fully authored level packets.**
- Progression is XP-driven through named ranks (`src/store/progress.ts`): **Guesser → Shaper
  (40 XP) → Tool User (120) → Checker (220) → Builder (400) → Architect (650)**, with the
  capstone awarding **Certified Practitioner**.
- The curriculum teaches **9 concrete "moves"** (M1–M9) — sentences a learner adds to a real
  prompt, e.g. "ask for the tool, not the answer" (M2) and "ask for the check first and prove it
  can fail" (M6, the keystone skill). Popular prompting "tricks" are offered as decoys that
  visibly fail.
- A standout mechanic is the **"false green"** (W4 keystone): a checker reports 8/8 pass but is
  secretly broken — it matched the word "next" in "arrives next week" — teaching that an unproven
  check is a promise, not proof.
- A **technical skin** of the same levels targets developers (scripts/functions/tests instead of
  plain language); the packet schema carries `plain` and `tech` text for every chip.

## Technical architecture (accurate as of this review)

| Layer | Details |
|---|---|
| **Frontend (shipped)** | Vite + React 18 + TypeScript (strict) + Vitest. Fully client-side static SPA, HashRouter, progress in `localStorage`, **no backend wired into the SPA** in this wave. |
| **Content** | **31 JSON level packets** driving a pure, deterministic engine (rule resolution, stars, XP, independent pass oracle). The map/layout is computed from packets — adding content needs no layout edits. |
| **Engine & simulators** | Pure engine in `src/engine/engine.ts`; **3 simulators** (`w4-l4-check`, `w4-check`, `w4-boss-refund`) back the levels whose logic exceeds a declarative rule table. `expectedToPass` is an independent oracle, so an engine/simulator bug surfaces as a test disagreement. |
| **Python harness (`app/`)** | FastAPI + SSE with OpenAI/Bedrock/mock providers and a seeded sales dataset (`data/`, seed 42). This powers the real "Agent A vs Agent B" determinism beat and is the natural live engine for Phase 2; it is **not imported by the React app today**. |
| **Quality gate** | `npm run build` is clean: **82 modules**, JS ≈ 434 kB (gzip ≈ 123 kB), CSS ≈ 19 kB. `npm test` runs **12 test files / 530 tests, all passing**, including an exhaustive combination test over every move/sub-choice assignment per packet. |
| **Accessibility** | WCAG 2.1 AA target: Okabe–Ito color-blind-safe palette (color always paired with icon/shape), keyboard play, reduced-motion support (OS + in-app toggle), `aria-live` result narration, packet-derived star counts. |
| **Security** | All author HTML is sanitized through a dependency-free allowlist (`b i em strong br code mark`, all attributes stripped) before `dangerouslySetInnerHTML`. `react-router-dom` pinned to 6.30.6; **no high/critical advisories in the shipped runtime bundle** (remaining highs/criticals are dev-only tooling). |

## Status and maturity

- **The playable foundation and the full curriculum are complete and tested**: schema, pure
  engine, three simulators, four renderers, two-tier world-map UI, and all 31 level packets
  build and pass.
- The project's own test gate is strong on logic and now also collects UI tests — the earlier
  review's finding that `tests/**/*.test.tsx` was silently skipped has been fixed in
  `vite.config.ts`. Test count has grown from 437 (4 files) at that review to **530 (12 files)**.
- **Phase 2 (planned, not built)**: Worlds 5–7, bosses, and the capstone are authored on the same
  contract but are intended to run **live-model free-text prompts with AI-written code executed in
  a browser sandbox**. That is where the FastAPI harness and sandbox safety become load-bearing.

## Honest positioning

The team is candid that the **learning outcome is unproven** — the mechanics are validated (every
move combination is verified at build time) but the product has not yet been tested with real
learners. The stated next step is a handful of non-technical testers using the moves in their own
AI *without being told*. There is no business model yet; the honest shape is a self-serve course
or a team AI-onboarding tool.

## Key risks

1. **Unvalidated pedagogy** — the central claim (durable behavior change) has not been tested on
   humans.
2. **Phase-2 sandbox safety** — safely executing novice-directed AI code in-browser is the hardest
   unbuilt component.
3. **Naming collision** — "Dt3rmind" is spoken "Determined," colliding with Determined AI and
   Determind AI (mitigated by always showing the spelled logo).
4. **Single-bundle growth** — all packets ship on first load (≈123 kB gzip today); per-level
   lazy-loading is a known Phase-2 optimization.
