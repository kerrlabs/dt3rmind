# Dt3rmind — features and demo script

For Jeff. What the app does today, where to see each piece, and the click-by-click script for the
3-minute pitch. Full spoken pitch, fallback plan and judge Q&A: [`PITCH.md`](./PITCH.md).

**Run it:** `npm install && npm run dev` (or `npm run build && npm run preview`). Clear progress in
Settings before a demo so stars and rank-ups show fresh.

---

## What it teaches (one line)

Stop asking the AI for the answer. Ask it for the tool and the check that make the answer exact —
*don't let it guess the part that has a right answer.* Same principle as your Agent A vs Agent B demo.

## Features

| Feature | What it is | Where to see it |
|---|---|---|
| **Rewrite-the-ask levels** | Every level: a realistic job, the naive prompt fails visibly, the learner adds "moves" to rewrite the prompt, sees the consequence, and passes only when the result is right **and** the AI's report is honest. | Any level, e.g. `#/level/w2-l3` |
| **The move set** | 9 reusable moves (ask for the tool, make it run it, show me the work, pin the source, ask for the check first and prove it can fail, make it reusable, point at the failure, choose where certainty matters). Collected as badges. | Move deck on the map |
| **Busted tricks** | Popular advice ("think step by step", "be careful", "you're an expert", "make sure it's perfect") is offered as a chip and disproven by its recorded consequence, then shown as busted. | Any level's chips; move deck |
| **"Who did the math"** | Every result says who produced it: the AI (guessing), the spreadsheet, the checker. | Result panel |
| **Try it in your AI** | Each level ends with a copy-paste prompt pattern plus notes for ChatGPT, Copilot in Excel, and AIs that can't run code. | Bottom of a passed level |
| **Circuit map** | Two-tier navigation: a world view (one glowing line through 7 worlds, each drawn as its tool, Workshop seam gate, capstone terminal) and a per-world level view (levels branch and converge on the boss gate). | `#/` and `#/world/2` |
| **Progression** | 7 worlds, 23 levels, 7 bosses, a capstone. Ranks Guesser → Shaper → Tool User → Checker → Builder → Architect. Stars, XP, keystone level (World 4). Bosses unlock the next world; levels inside a world play in any order. | Map header, rank-up card |
| **Two skins** | Plain English (chips, spreadsheets) and Technical (pandas/SQL/Python checks) on the same level. | Toggle in each level header |
| **Honest by construction** | Outcomes are recorded and deterministic; no AI ever decides pass or fail. Every move combination of every level is tested (530 tests). | `npx vitest run` |
| **Accessible** | Screen-reader labels, keyboard play, visible focus, reduced motion, color-blind-safe palette (Okabe–Ito), dark and light themes, phone layout. | Settings; any screen |

**Not built yet (Phase 2):** live free-text asks against a real model (your provider layer and
engine), in-browser sandbox for AI-written code, certification. World 2 is the obvious first place to
plug in your live Agent A vs Agent B run.

---

## Demo script (3:00)

Two tabs open before you start: **Tab 1** `#/level/w2-l3`, **Tab 2** `#/level/w4-l4`. Your Bedrock
output (`Agent A … 0/10`, `Agent B … 10/10`) on a third tab or slide. Keep the Dt3rmind logo on screen
when the name is said ("Determined").

| Time | Do | Show | Say |
|---|---|---|---|
| 0:00 | Tab 1: **Ask the AI 5 times** | 5 red dots, 179K–442K; "Correct: 0 of 5"; "Who did the math: the AI (guessing)" | "Your manager asks for West revenue in Q3. You paste the sheet. Five asks, five answers, none right." |
| 0:35 | Add **Think step by step**, run | Still scattered | "The AI isn't adding your rows — it's predicting what a total looks like. Asking nicely doesn't change *who does the math*." |
| 1:05 | Remove the trick. Add **Ask for a formula, not the number**, **Make it run the formula**, **Show me the formula**. Run | All 5 on 227,421.36; two different formulas, same number; "Who did the math: the spreadsheet" | "Stop asking for the answer. Ask for the tool." |
| 1:40 | Tab 2: **Run it** (plain) | 8 drafts, 4 break a rule, no warning | "Eight customer replies. Four are wrong and it didn't tell you." |
| 1:55 | Add **Ask for a checker first** (tick greeting, name, next step) + **Run the checker on every draft**. Run | "Checker: 8 of 8 pass" — but Sofia's card shows ✗ next step | "It checked for the word *next*. 'Arrives *next* week' matched. A green that's lying." |
| 2:10 | Add **Make it prove the checker can fail** (+ **Show me the checker**). Run | Log: it tested a bad example, found the bug, fixed it; 8 of 8 real; PASSED; rank-up card | "Until it proves the check can fail, you don't have a check. You have a promise." |
| 2:20 | Third tab | 0/10 vs 10/10 | "Not a mock. Jeff ran this on AWS Bedrock. Same model, same data." |
| 2:40 | Switch to `#/` | The circuit map | "Seven worlds, 23 levels and a boss for each. You climb from Guesser to Architect and collect the moves that work." |
| 2:52 | Point at the Try-it card | Copy-paste pattern | "You leave with one move: don't let it guess the part that has a right answer." |

**Notes**
- On a fresh profile the World 4 rank-up card reads "Tool User" (ranks follow XP) — don't say "Checker" on stage.
- If the live app fails: the standalone prototypes in `docs/prototypes/` open with no server.

---

## Questions for you

1. OK to call you my partner and show your Bedrock numbers?
2. Keep this as a standalone branch, or move it under `apps/dt3rmind/` on a branch off your `main` so it can merge?
3. Anything in the levels that misrepresents how your engine works?
