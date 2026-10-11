# Puzzle Ladder — Independent Engineering + UX Review

**Reviewer:** code-review agent (adversarial, independent)
**Date:** 2026-10-11
**Scope reviewed:** `docs/spec/SPEC.md` (§4, §6–§9), `docs/AUTHORING.md`, `README.md`, all of `src/`, `tests/`, `package.json`, all 29 packets in `content/levels/`.
**Constraints honored:** read-only on `src/ content/ docs/spec`; new files only under `tests/review/` and `docs/reviews/`; no `npm install`; read-only commands only.
**MCP note:** `playwright-mcp` was unavailable (failed to start) this session. No other servers were needed. Browser-driven UX verification was therefore done with a jsdom + react-dom render harness (details below), not Playwright.

---

## Verdict

**Ship-quality engine; the test gate is strong on logic but has real holes on the UI and on a11y. No Critical correctness bugs found in the reviewed scope.** The rule/simulator engine, stars/XP math, first-pass-only XP, unlock gating and rank thresholds all match SPEC §6/§8. The exhaustive combination test is genuinely independent and genuinely exhaustive **for the move/sub-choice space it enumerates** — but it cannot see UI, a11y, or the attempt/hint state that stars depend on, and the project's own test runner silently skips `.tsx` tests under `tests/`. The largest latent risks are (1) `dangerouslySetInnerHTML` on seven surfaces that is safe *only because* the MVP has no free-text input — a property that SPEC §8 says changes at W5/boss/capstone; (2) three high-severity runtime advisories in `react-router-dom`; (3) several WCAG 2.1 AA gaps the code shows plainly.

Counts: **0 Critical · 6 Important · 9 Minor.**

---

## Test & build results (this session)

| Command | Result |
|---|---|
| `npm run build` (`tsc -b && vite build`) | **PASS** — 76 modules, `dist/assets/index-*.js` 393.54 kB (gzip 113.65 kB), CSS 11.53 kB. Exit 0. |
| `npx vitest run` (project config) | **PASS** — 4 files, **437 tests** (schema 342, combinations 62, engine 21, progress 12). Exit 0. |
| `npm audit --omit=dev` | **3 high** (react-router-dom / react-router / @remix-run/router — runtime). |
| `npm audit` (all) | **8 total: 2 critical, 4 high, 2 moderate.** The 2 critical (tinypool RCE) + 2 moderate (vitest mocker, esbuild dev-server) + 1 high set are **dev-only** (vitest/vite/esbuild). The **3 high in react-router-dom ship in the bundle.** |
| `tests/review/levelPlayer.render.test.tsx` (my harness, review config) | **PASS** — 6 render tests across w2-l3 and w4-l4 (see UI section). |

> **First-run caveat worth recording:** running `npx vitest run` from a *different* working directory pulls `vitest@5.0.3` from the npm cache (not the pinned `2.1.2`), finds no tests, and exits 1. Always run the gate from the repo root. Not a defect, but a foot-gun for CI if the working dir isn't pinned.

---

## Findings

| # | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| 1 | Important | `vite.config.ts:16` | `test.include` is `['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts']` — note `tests/**` matches only `.ts`, **not `.tsx`**. Any UI/component test placed under `tests/` is **silently never collected**. The gate will stay green while the UI is untested. Proven: my `tests/review/levelPlayer.render.test.tsx` is invisible to the project runner and only runs under an explicit override config. | Add `'tests/**/*.test.tsx'` to `include`. One-line change; converts the UI-test gap from "silently impossible" to "merely absent". |
| 2 | Important | `src/pages/LevelPlayer.tsx:191,201,214,226,246,250`; `src/ui/renderers.tsx:135` | **7 `dangerouslySetInnerHTML` sinks.** All current inputs are author-controlled packet strings (`feedback`, `lesson`-adjacent, `job.text`, hints, `whatYouDoDifferently`, `tryIt.notes`, simulator `log`), so there is **no XSS today** — the learner only toggles fixed chips, never types. BUT SPEC §8 says W5/bosses/capstone take a **free-text ask run against a live model**, and §4 renders model output. The moment live/model/learner text reaches any of these sinks (or the renderers' `log`), this becomes stored/reflected XSS. There is no sanitizer, no allowlist, no `DOMPurify`. | Before Phase 2: (a) restrict HTML to an explicit tag allowlist (`<b> <i> <br>`) via a tiny sanitizer or `DOMPurify`; (b) never route model/learner text through `dangerouslySetInnerHTML` — render it as text. Add a test that feeds `<img src=x onerror=...>` through `feedback`/`log` and asserts it is inert. |
| 3 | Important | `package.json:19` / `npm audit` | `react-router-dom@6.26.2` pulls `@remix-run/router <=1.23.2` with **3 high-severity runtime advisories** (XSS via open redirect, protocol-relative `//` redirect). These are in the shipped bundle, not dev-only. The app uses `HashRouter` with only three static routes and no redirect logic, so exploitability is low *today*, but it is a shipping dependency with known highs. | Bump to `react-router-dom@6.30.6` (fix version). It is "outside the stated range" per npm but within 6.x; verify the three routes + `MemoryRouter` tests still pass. Pin exactly. |
| 4 | Important | `src/engine/engine.ts:148-170` (`computeStars`) + `tests/combinations.test.ts` | The exhaustive combination test asserts the **pass set** matches the oracle, but **does not test stars or XP across attempts/hints**. `computeStars` depends on `state.attempts` and `state.hints`, which the combination test never varies. Star correctness rests entirely on `engine.test.ts`'s handful of hand-picked cases. SPEC §8 makes stars a graded, user-visible signal (and Distinction requires ≥70% at ★★★). A regression in the budget/hint logic would pass the gate. | Add a focused table test over `{attempts ≤/> budget} × {hints <3/=3} × {showMove on/off}` for a representative packet, asserting the exact star count. Cheap, closes the biggest math-coverage gap. |
| 5 | Important | `src/pages/LevelPlayer.tsx` (whole result region) + `src/styles.css` | **A11y: results are not announced reliably, and the pass/fail is color+icon only in places.** The check bar text ("PASSED"/"FAILED") lives in a `div` that is not an `aria-live` region (the `.fb` feedback below it is `role="status" aria-live="polite"`, good; the big check bar is not). Focus is **not moved** to the result or the compare panel after a run, so a keyboard/SR user gets no cue the outcome changed and must hunt for it. The compare/try-it section appears on pass with no focus management or `aria-live`. | Make the check bar an `aria-live="assertive"` region (or move focus to a results heading on run). On pass, move focus to the "What you do differently" heading (`tabIndex={-1}` + `.focus()`), gated on `reducedMotion` for the scroll. |
| 6 | Important | `src/store/progress.ts:103-118` (`isLevelUnlocked`) | Unlock gating uses the **global** sorted order and requires the *immediately prior* level to be passed. With sparse content (only 29 of the planned 23+capstone authored, and worlds enumerated 1–7 in the map), the "prior level" can be in a **different world** than the learner expects, and the **first authored level of a later world is gated behind the last authored level of the previous world** even when SPEC §5 gates progression on **bosses**, not per-level. SPEC §6: "Boss passes advance the world; per-level passes are practice." The current linear per-level chain contradicts that — it makes every practice level a hard gate. | Gate world entry on the **previous world's boss pass** (per SPEC §5/§6), and leave practice levels within a world unlocked once the world is entered. At minimum, document that the current linear gate is an MVP simplification and add a test pinning the intended behavior. |
| 7 | Minor | `src/pages/LevelPlayer.tsx:300-306` | `copyTemplate` silently no-ops when `navigator.clipboard` is undefined (older/insecure-context browsers). The brief flags a copy fallback; there is none — the button shows nothing changed and the user gets no text. | Fallback to a hidden `<textarea>` + `document.execCommand('copy')`, or show a "select and copy" affordance when `navigator.clipboard` is absent. |
| 8 | Minor | `src/pages/LevelPlayer.tsx:233-238` | The "Add to your ask" counter expression `realMovesCollected.length + packet.moves.filter(trick&&picked).length || 'pick any'` is a confusing `||` short-circuit: when the sum is `0` it renders `'pick any'`, otherwise a bare number followed by `' added'` **only when `realMovesCollected.length` is truthy**. Trick-only selections show `"<n>"` with no "added" suffix. Minor UX inconsistency / off-label count. | Compute the count once into a named variable and render a single clear label. |
| 9 | Minor | `src/content/simulators/w4-check.ts:118-130` | The simulator "fixes" failing drafts by setting every tested flag true (`d[id]=true`), so a run with the three real criteria always reaches `good===8`. This is faithful to the prototype, but it means **`partial` (some-but-not-all criteria) can never be the pass path** by construction, and the independence of the combination test for W4 leans on `expectPass` requiring all three sub-choices. The cross-check holds (verified: 4,096 combos agree), but a future author who adds a 4th real criterion must update `REAL_CRITERIA`, the sub-choices, AND `expectPass` in lockstep or the oracle and simulator diverge silently in the *feedback* (not pass) dimension. | Add a build-time assertion that `REAL_CRITERIA` ⊆ declared real sub-choice ids for the packet, so drift fails loudly. |
| 10 | Minor | `src/styles.css` / `src/app/AppContext.tsx:70-73` | Reduced-motion is wired (`body.reduce-motion`) and defaults to OS, good. But the shake animation is triggered via a 500 ms `setTimeout` + class in `LevelPlayer` regardless of `reducedMotion` — the CSS must be the thing that neutralizes it. If any `.shake` rule lacks a `.reduce-motion` override, motion-sensitive users still get the shake. Verify every motion rule has a reduce-motion counterpart. | Audit `styles.css` for every `@keyframes`/`transition`/`animation` and ensure a `body.reduce-motion` override zeroes it. Consider gating the JS `setTimeout` too. |
| 11 | Minor | `src/pages/LevelPlayer.tsx:258-261` | The star display `aria-label={\`${stars} of 3 stars\`}` always says "of 3" even for W1 L1, which is **★★-max by design** ("two of two" per AUTHORING). SR users are told the ceiling is 3 when it is 2. | Derive the denominator from the packet (`showMove===null && thirdStar===null ? 2 : 3`). |
| 12 | Minor | `index.html` / `src/main.tsx:12` | `document.getElementById('root')!` non-null assertion with no guard. If the mount node is missing the app throws with a crypter error. Low impact (controlled HTML), but a defensive check or a typed helper is cheap. | Guard and throw a clear error, or render into a known-present node. |
| 13 | Minor | `vite.config.ts` / bundle | Bundle is a **single 394 kB JS chunk (114 kB gzip)**, all packets inlined via `import.meta.glob({eager:true})`. Fine for MVP, but every packet (incl. all 29 levels' recorded outputs) ships on first load and grows linearly with the curriculum. SPEC Phase 2/3 adds many more levels + live code. | Before Phase 2, lazy-load packets per level (`import.meta.glob` without `eager`, or route-level `React.lazy`), and code-split the router. Not needed for MVP sign-off. |
| 14 | Minor | `src/content/schema.ts` (`atMost`/`atLeast`) + oracle | `conditionsMatch` supports `atMost`/`atLeast`, but `expectedToPass` (the oracle) **only** reads `conditions` (which can carry them) — fine — yet **no authored packet uses `atMost`/`atLeast`**, so this branch is **entirely untested** by the real content. Dead-but-reachable logic that a future author will rely on untested. | Add a unit test for `atMost`/`atLeast` in `conditionsMatch` (engine.test.ts covers `requireAll/Any/forbidAny` but not these two). |
| 15 | Minor | `README.md` vs `SPEC.md`/`package.json` | README/`package.json` describe "Wave 1 foundation: schema, engine, three reference packets," but `content/levels/` already holds **29 packets** (all 7 worlds + bosses + capstone). Docs understate the actual content state; a reviewer or author can't tell what is load-bearing vs stub. | Update README to the real inventory, or mark the extra packets as draft/wave-2 scaffolding. |

---

## Is the combination test genuinely exhaustive and independent?

**Yes, with two bounded caveats — a logic bug in the pass set could not pass it, but a UI, stars, or feedback-text bug can.**

- **Exhaustive over the chip space:** `tests/combinations.test.ts` enumerates all `2^moves × 2^subChoices` assignments per packet (W4 = 4,096, Level 2 = 128 — matching SPEC §8's cited numbers), asserts `resolveOutcome` never throws (rule table total), and that every non-pass has non-empty feedback + lesson. Confirmed running: 62 combination tests across 29 packets, all green.
- **Genuinely independent:** the engine's pass verdict is derived from `rules` (+ the `w4-check` simulator), while the oracle `expectedToPass` is derived from a *separately authored* `expectPass` block. They share no code path. For W4 the simulator decides pass (`good===8 && kind==='ok'`), and the oracle decides pass from `check+prove+run + {greet,name,step}` — different fields, and they agree across all 4,096. A rule-table or simulator pass bug would surface as a mismatch. This is a real, well-designed cross-check.
- **Could a bug still pass it?** Yes, three classes:
  1. **Stars/XP-by-state bugs** — the combination test fixes `attempts`/`hints` implicitly to the pass branch and never varies them (Finding #4).
  2. **Feedback-correctness bugs** — the test checks feedback is *non-empty*, not *correct*. The simulator could match the wrong rule for feedback (right pass verdict, wrong lesson) and the test is blind to it. (The W4 rule ordering in AUTHORING is relied on by convention, not asserted.)
  3. **UI/integration bugs** — nothing in the project gate renders a component (Finding #1). My added render harness is the only thing exercising LevelPlayer, and it is not in the project `include`.

---

## UI verification (jsdom + react-dom, no Playwright, no @testing-library)

`@testing-library/*` is **not** in `package.json`/`package-lock.json` (0 matches), and the brief forbids `npm install`, so I did **not** use RTL. Instead I wrote `tests/review/levelPlayer.render.test.tsx` using only installed deps (`react`, `react-dom/client`, `react-router-dom`, the jsdom env vitest already runs) and drove the real `LevelPlayer` through the full loop with native DOM click events. Results (6/6 pass):

**w2-l3 (numeric-scatter):**
- renders job + phase-1 "Ask the AI 5 times" action, no pass state;
- just-ask → "Who did the math: the AI (guessing)"; add `tool`+`run` → "Run my rewrite" → **PASSED**, "Who did the math: the spreadsheet", compare panel + try-it card + "Copy the pattern" + "Moves collected" all render;
- `tool` without `run` → **FAILED**, no compare panel (the keystone W2 lesson holds in the UI).

**w4-l4 (item-grid simulator):**
- just-ask shows the naive "of 8" broken outcome, no pass;
- `check+run+greet+name+step` but **no `prove`** → **FAILED** (the false-green is correctly *not* a pass in the UI, matching the simulator);
- `check+prove+run+greet+name+step` → **PASSED**, compare + try-it render.

This confirms the engine→renderer→progress wiring for both reference levels end-to-end. It is **not** a substitute for real-browser/visual verification (styling, focus ring, SR announcement, reduced-motion, color-contrast rendering) — those remain unverified here because Playwright was unavailable and jsdom has no layout/paint. See the a11y findings (#5, #10, #11), which are code-level and do not need a browser to flag.

---

## Accessibility (WCAG 2.1 AA, as far as code shows)

Good, already present:
- Okabe–Ito palette with icon/shape pairing in the renderers (check/cross SVGs alongside color) — color is not the *sole* signal in the result grid/scatter.
- `aria-pressed` on toggle buttons (moves, skin, theme); `role="group"` on the skin/theme cluster; `aria-label` on the belt and star groups; `.fb` result is `role="status" aria-live="polite"`.
- Reduced-motion defaults to OS and is overridable; `body.reduce-motion` class is applied.

Gaps (findings above):
- **#5** — the big PASSED/FAILED check bar is not an aria-live region; **no focus management** on run or on pass. This is the most impactful a11y gap: a keyboard/SR user running a level gets no reliable cue the result changed.
- **#11** — star `aria-label` hardcodes "of 3" even on ★★-max levels.
- **#10** — reduced-motion depends entirely on CSS overriding every animation; the shake is JS-triggered unconditionally — audit needed.
- The hint reveal uses `aria-live="polite"` (good), but hint text is injected via `dangerouslySetInnerHTML` (safe today, Finding #2).
- Keyboard operability of the map's `.lvl` links uses `aria-disabled` + `tabIndex=-1` for locked levels — correct pattern — but `aria-disabled` links are still in the a11y tree as links; a locked level should also prevent navigation (it currently can still be focused-and-activated via Enter if tabindex is restored by AT). Low risk; note for Phase 2.

**Theming / tokens:** dark default + light via `body.light`, Inter, Okabe–Ito tokens as CSS vars — matches SPEC §7. I did not measure rendered contrast ratios (no browser); the token values are the SPEC's color-blind-safe set, but AA contrast of e.g. muted text on panel backgrounds should be measured in-browser before sign-off.

---

## Security / quality

- **`dangerouslySetInnerHTML` (Finding #2):** safe today only because there is no free-text/model input in the MVP. This is the single most important thing to fix *before* Phase 2 wires in live model output (SPEC §8). No sanitizer exists.
- **Dependency advisories (Finding #3):** 3 high in `react-router-dom` ship at runtime; the rest (tinypool critical, vitest mocker, esbuild) are dev-only and do not reach production. Classified above.
- **Dependency pins:** runtime deps are pinned to exact versions (good). The react-router highs are the only runtime concern.
- **No `eval`, no `Function`, no network calls** in the reviewed MVP source. The Pyodide/live-model paths (SPEC §9) are **not implemented** yet — the biggest future security surface (running AI-written code) is deferred; flag it now so the sandbox threat model is designed before W5.
- **localStorage** persistence is guarded for SSR/disabled storage and survives corrupt JSON (tested). No sensitive data stored. Fine.
- **Bundle size (Finding #13):** 394 kB single chunk; acceptable for MVP, will not scale.

---

## Spec gaps — what SPEC requires that the app does not do

These are **expected** omissions (SPEC phases W5–W7 to Phase 2/3), listed so sign-off is honest about MVP scope, not as defects:

1. **Spaced re-check for Mastery** (SPEC §6: Mastery advances "plus a spaced re-check") — **not implemented.** Progress tracks XP + stars + passed, but there is no Mastery track (Practiced→Proficient→Mastered) and no spaced re-check at all. Ranks currently read **XP**, not Mastery — SPEC §6 says ranks/certs read Mastery. This is a real divergence from the two-track model, even if acceptable for MVP.
2. **Boss re-sit 24h cooldown on a different variant** (SPEC §10 reconciliation) — **not implemented.** Unlimited retries exist; no cooldown, no variant.
3. **Belt ring** — the belt *bar* exists (XP within rank); the SPEC's belt *ring* visual is a bar here. Cosmetic.
4. **Busted tricks** — implemented (deck shows "Busted: …"). ✓
5. **Map seam + capstone node** — the Workshop seam text and capstone text render on the map; the capstone packet exists but there is **no capstone node wiring / free-text ask / live grading** (Phase 2). Worlds 5–7 show "Content coming in wave 2" unless packets are present (29 packets exist but the live-AI/Pyodide engine for W5–W7 is absent).
6. **Technical skin** — the `tech` text path and skin toggle exist and are exercised; "Senior Architect" rank for the technical W7 is **not** modeled in `RANKS` (tops out at Architect). Minor.
7. **Certification / evidence hash** (SPEC §8) — **not implemented** (Phase 2).
8. **Anti-gaming domain/decoy switch on bosses** — bosses add XP + crest but there is no domain/decoy variation or free-text grading yet (Phase 2).
9. **Live AI + Pyodide sandbox, provider timeouts, Jeff's read-only SELECT guard** (SPEC §9) — **not implemented** (Phase 2). The biggest security design work is still ahead.

---

## Top 10 fixes, ranked

1. **(Finding #1) Add `tests/**/*.test.tsx` to `vite.config.ts` include** — otherwise every UI test is silently skipped; this is the keystone that makes all other UI/a11y work verifiable. One line.
2. **(Finding #2) Sanitize / allowlist all `dangerouslySetInnerHTML`, and never route model/learner text through it** — must land before Phase 2 wires live model output, or it is stored XSS. Add an inert-payload test.
3. **(Finding #3) Bump `react-router-dom` to 6.30.6** to clear the 3 high runtime advisories; re-run the gate.
4. **(Finding #5) Fix result a11y: aria-live on the check bar + focus management on run/pass** — highest-impact a11y gap; blocks a WCAG AA claim.
5. **(Finding #6) Gate world entry on boss pass, not every prior practice level** — current linear gate contradicts SPEC §5/§6; add a pinning test.
6. **(Finding #4) Add stars/XP-by-state table tests** — closes the biggest math-coverage hole the combination test can't see.
7. **(Finding #11) Make the star denominator packet-derived** ("of 2" on ★★-max levels) — SR-correctness, cheap.
8. **(Finding #7) Clipboard copy fallback** for insecure-context / older browsers.
9. **(Finding #9) Build-time assert `REAL_CRITERIA` ⊆ declared real sub-choices** so W4-style authoring drift fails loudly.
10. **(Finding #10) Audit reduced-motion coverage** across every CSS animation and the JS shake trigger.

---

## Files added by this review (under `tests/review/`, non-invasive)

- `tests/review/levelPlayer.render.test.tsx` — jsdom render harness (6 tests, all pass) exercising w2-l3 and w4-l4 end-to-end.
- `tests/review/vitest.review.config.ts` — review-only config that includes `.tsx` so the harness can run (demonstrating Finding #1). Does not alter project behavior.

Run them with: `npx vitest run --config tests/review/vitest.review.config.ts`

---

## Fixes applied (engineering fixer)

Date: 2026-10-11. Owner: engineering fixer (owns `src/`, `tests/`, build config,
`docs/AUTHORING.md`, `README.md`). Did **not** touch `content/levels/*.json` or
`src/content/simulators/*` (concurrent fixers own those).

Verification after all changes: `npx vitest run` → **508 passed (8 files)**, exit 0;
`npm run build` (`tsc -b && vite build`) → **exit 0**, 79 modules, `index.js` 413 kB
(gzip 117 kB).

| Finding # | Change |
|---|---|
| **#1** (vitest `.tsx` gap) | `vite.config.ts` `test.include` now adds `tests/**/*.test.tsx`. The review harness `tests/review/levelPlayer.render.test.tsx` is **folded into the normal suite** (its header comment updated); the review-only `tests/review/vitest.review.config.ts` is **deleted** as redundant. The harness grew 6 new assertions (aria-live bar, focus-to-compare, star denominator ×2, sanitized feedback). |
| **#2** (XSS sinks) | New dependency-free allowlist sanitizer `src/ui/sanitizeHtml.ts` — permits only `b i em strong br code mark`, strips **all** attributes, discards `<script>`/`<style>` contents. **All 7 `dangerouslySetInnerHTML` sinks** routed through it (6 in `LevelPlayer.tsx`, 1 in `renderers.tsx`). New `tests/sanitizeHtml.test.ts` (8 tests) with inert `<img onerror>` + `<script>` + `javascript:` payloads. |
| **#3** (react-router highs) | `react-router-dom` bumped **6.26.2 → 6.30.6** (`--save-exact`). `npm audit --omit=dev` now shows **no high/critical runtime advisories** (the 3 highs cleared). Two **moderate** runtime advisories remain (fixed only in breaking v7); documented in `README.md` with the non-exploitability rationale (HashRouter, 3 static routes, no redirects/SSR). Dev-only highs/criticals (vitest/vite/esbuild/tinypool) also documented as non-shipping. |
| **#4** (stars/XP state coverage) | New `tests/starsXp.test.ts` (45 tests): full `{attempts ≤/> budget} × {hints <3/=3} × {show-move on/off}` sweep for a non-boss (w2-l3) **and** a boss (w4-l4), exact star assertions; ★★-max cap (w1-l1); boss vs non-boss XP; first-pass-only XP via `recordPass`; plus the previously-untested `atMost`/`atLeast` conditions (**Finding #14**). |
| **#5** (result a11y) | Check bar is now `role="status" aria-live="assertive"`, focusable (`tabIndex=-1`) with an explicit `aria-label`. Focus moves to the check bar on every run and to the "What you do differently" heading (now an `<h2 tabIndex=-1>`) on pass; scroll is gated on `reducedMotion` and `scrollIntoView` is feature-detected (jsdom-safe). Visible focus: `[tabindex]:focus-visible` added to `styles.css`. |
| **#6** (unlock gating) | `isLevelUnlocked` rewritten to the **lead decision**: World 1 open; within an unlocked world ALL levels + the boss are playable in any order; World N+1 unlocks when World N's **primary boss** is passed; the capstone (authored as a second boss in W7) gates on the W7 boss. Old linear per-level chain removed. `tests/progress.test.ts` `isLevelUnlocked` block **replaced** with pinning tests (the old test asserted the now-removed, spec-contradicting behavior). |
| **#7** (star denominator) | Denominator is packet-derived (`showMove===null && thirdStar===null ? 2 : 3`) in `LevelPlayer` (top-bar `aria-label` + glyph count + boss rank-up line) and `WorldMap` (per-level stars + new `aria-label`). ★★-max levels now say "of 2". |
| **#8** (clipboard fallback) | `copyTemplate` rewritten: async Clipboard API → `document.execCommand('copy')` via an offscreen textarea → leave text selected + a `role="status"` message telling the user to press Ctrl/Cmd+C. Also fixed the confusing `|| 'pick any'` counter short-circuit (review's Finding #8 text) with a named `addedCount`. |
| **#9** (simulator/packet drift) | New `tests/simulatorCriteria.test.ts`: asserts every criteria id a simulator depends on ⊆ the packet's declared sub-choices, reading packets via the existing loader and importing each simulator's own exported criteria constants (`w4-check`, `w4-l4-check`, `w4-boss-refund`). Simulators with no registered criteria are reported as skipped, not failed, so the concurrent simulator fixer's work does not collide. |
| **#10** (reduced motion) | `styles.css`: the in-app `body.reduce-motion` toggle now has its own override (mirroring the OS media query) zeroing every `@keyframes`/`transition`/`scroll-behavior` incl. `::before`/`::after` — previously only the OS media query neutralized motion, so the manual toggle did nothing on an OS with no preference. The JS shake timer is also gated on `reducedMotion` in `LevelPlayer` (`triggerShake`). |
| #11 (also #7) | Covered under #7. |
| #12 (root mount guard) | `main.tsx` guards `#root` with a clear thrown error instead of a bare non-null assertion. |
| #14 (atMost/atLeast untested) | Covered under #4 (`tests/starsXp.test.ts`). |
| #15 (README understates content) | `README.md` corrected to **29 packets** (all worlds + bosses + capstone), with the three reference levels still called out. |

**Spec-gap items requested if small:** both already present — the Workshop seam renders on the
map (`WorldMap` via `SEAM_TEXT`), and busted tricks render on the move deck
(`app.progress.bustedTricks` → "Busted: …"). No change needed.

**Not done (out of scope / deferred, with reasons):**
- **Finding #13 (bundle code-split):** left as-is. The review itself marks it "not needed for
  MVP sign-off"; lazy-loading packets is a Phase-2 concern and would change the loader contract.
- **Two residual moderate runtime advisories (react-router):** not patched — the only fix is a
  **breaking react-router v7 major**, which is a migration, not a bump, and the advisories are
  not exploitable in this app (HashRouter, static routes, no SSR/redirects). Documented in
  `README.md` instead.
- **`content/levels/*.json` and `src/content/simulators/*`:** untouched by design (owned by the
  content/simulator fixers). I registered the three in-use simulators' criteria in the new
  drift-guard test by **reading** their exported constants only.

No failures were attributable to the content fixer's in-progress JSON during the final runs
(all 29 packets passed schema + combination tests).
