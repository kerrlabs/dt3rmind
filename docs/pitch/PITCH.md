# Dt3rmind — 3-minute demo pitch

Audience: HackMidwest judging panel + a mixed technical/non-technical crowd.
Voice: Carl — direct, pragmatic, dry, anti-hype. Name: **Dt3rmind** (say it "Determined"; keep the spelled logo on screen whenever you say it, because the spoken name collides with Determined AI and Determind AI). Tagline: *Ask for the tool, not the answer.*
Every number below is from the build or Jeff's real run. Nothing invented.

---

## 1. Spoken script (≈3:00, ~400 words of speech)

> Timestamps are where to be, not a stopwatch. `[CLICK]` cues are inline.
> Read the opening slowly. Let the five wrong numbers land before you explain them.

**0:00 — The scene**
Your manager asks a simple question: what was West region revenue in Q3? You've got the sales sheet — two thousand rows. So you paste it into your AI and ask. `[CLICK — run the plain ask, Level 2]`
Here's what comes back. Run it five times, you get five different numbers. A hundred and seventy-nine thousand. Four hundred and forty-two thousand. `[CLICK]` None of them right. Same question, same data, five answers.

**0:35 — The uncomfortable truth**
Here's the part nobody tells you. The AI isn't adding up your rows. It's predicting what a total *looks like* — the same way it predicts the next word. And the fix everybody reaches for — "be careful," "think step by step," "you're an expert" — `[CLICK — add a trick]` watch. Still wrong. Asking nicely doesn't change *who does the math*.

**1:05 — Demo beat 1: change who does the math**
So we stop asking for the answer. We ask for the tool. `[CLICK — add "ask for the formula"]` `[CLICK — add "make it run it"]` Now the AI writes a formula, and the spreadsheet runs it. `[CLICK — run]` Two hundred twenty-seven thousand, four hundred twenty-one, thirty-six. Five times out of five. Who did the math? `[CLICK — point]` The spreadsheet. The AI never touched a number.

**1:40 — Demo beat 2: the false green**
Now the harder lesson. `[CLICK — World 4]` Eight customer emails, three rules each — greeting, name, a next step. You ask the AI to write a checker and run it on every draft. Green. Eight of eight pass. `[CLICK]` Except Sofia's reply says "a replacement arrives next week." That's not a next step — it tells her nothing to do. The checker searched for the word "next." *Next* week matched. A green that's lying to you. `[CLICK — add "prove it can fail"]` Until you make it prove the check can fail first, you don't have a check. You have a promise.

**2:20 — The proof**
And this isn't a mock. `[CLICK — Jeff's run]` My partner Jeff ran this live on AWS Bedrock. AI reading the data: zero of ten correct. AI writing a query an engine runs: ten of ten, exact. Same model. Same data.

**2:40 — The game, in one breath**
That's the whole product: seven worlds, twenty-three levels and a boss for each, you climb from Guesser to Architect, you collect the moves that work as badges and watch the popular tricks get busted on screen.

**2:52 — The close**
You leave with one move you can paste into ChatGPT tomorrow: *don't let it guess the part that has a right answer.* `Dt3rmind`. That's the ask — come try to break it.

---

**Word count of spoken script: 398 words.**

---

## 2. Demo run sheet (click-by-click)

Run the app before you start (`npm run dev` in the repo, or `npm run build && npm run preview`). Open two tabs on the dev URL: Tab 1 `#/level/w2-l3`, Tab 2 `#/level/w4-l4` (deep links open the level even if the map shows it locked). Clear progress in Settings first so stars and the rank-up show fresh. Keep the two standalone prototypes in `docs/prototypes/` as a no-server backup. Jeff's run output on a third tab or a screenshot ready.

### Beat 1 — Level 2 (Tab 1) — target 0:00–1:40

| # | You click | What appears | Say / timing |
|---|---|---|---|
| 1 | **"Ask the AI 5 times"** (plain, no moves) | Scatter: 5 red dots spread 179K–442K; "Different answers: 5 / Correct: 0 of 5"; "Who did the math: the AI (guessing)" | opening scene, let it sit (~0:30) |
| 2 | One trick chip, e.g. **"Think step by step"**, then **"Ask with my rewrite"** | Still red, still scattered, still "AI (guessing)" | "asking nicely changes nothing" (~0:50) |
| 3 | Deselect the trick. Add **"Ask for a formula, not the number"** + **"Make it run the formula"** | Live prompt updates in blue | "ask for the tool" (~1:10) |
| 4 | (optional 3rd star) Add **"Show me the formula"** | formula shows in each run row | — |
| 5 | **"Ask with my rewrite"** | 5 green squares locked on 227,421.36; "Correct: 5 of 5"; **"Who did the math: the spreadsheet"**; PASSED bar | land "the spreadsheet" and point at the label (~1:35) |

> If you added "Show me the formula," note aloud the two runs used **different formulas** and got the identical number — that's the point.

### Beat 2 — World 4 (Tab 2) — target 1:40–2:20

| # | You click | What appears | Say / timing |
|---|---|---|---|
| 6 | **"Have the AI draft all 8"** (plain, no moves) | 8 draft cards animate in; 4 marked bad (Lena, Chen, Aisha, Sofia); Sofia's "arrives next week" highlighted; FAILED bar | "4 of 8 broke a rule, no warning" (~1:50) |
| 7 | Add **"Ask for a checker first"**; in the sub-choices tick **a greeting / the customer's name / a next step** (leave tone off). Add **"Run the checker on every draft"**. **Do NOT** add "prove it can fail" yet. Run. | "Checker: 8 of 8 pass" — **false green**; Sofia still broken | "it checked for the word *next* — *next week* matched" (~2:05) |
| 8 | Add **"Make it prove the checker can fail"**. Run. | Log shows it tested a bad example, found the bug, fixed it; 8 of 8 genuinely pass; PASSED + honest report; rank-up to Checker | "now the green is real" (~2:18) |

### Beat 3 — Jeff's proof — target 2:20–2:40

| # | You show | Say |
|---|---|---|
| 9 | Jeff's Bedrock output: `Agent A ... (0/10 correct); Agent B ... (10/10 correct)` | "not a mock — real model, AWS Bedrock, zero of ten vs ten of ten" |

Then speak the game-layer line and the close over the final World 4 screen (ranks, moves collected visible).

---

## 3. Fallback plan (if the live demo breaks)

The prototypes are **self-contained HTML with recorded outputs** — no network, no API, no backend. They work offline on your laptop. So the real risks are: projector/HDMI dies, laptop won't wake, or a browser tab is wrong. Plan for the screen, not the code.

**Have these ready as full-screen screenshots, in this order, in a slide deck or an image viewer:**

1. Level 2 — plain ask, 5 scattered red dots, "0 of 5 correct, Who did the math: the AI (guessing)."
2. Level 2 — rewritten, 5 green squares on 227,421.36, "Who did the math: the spreadsheet."
3. World 4 — plain ask, 4 bad drafts, Sofia's "arrives next week" highlighted.
4. World 4 — false green: "Checker: 8 of 8 pass" with Sofia still broken.
5. World 4 — real pass after "prove it can fail," rank-up to Checker.
6. Jeff's terminal output: 0/10 vs 10/10.

**What to say if it's screenshots:** "I'm going to walk you through this on screenshots so I don't burn your time fighting a projector — the live version is on my laptop right after and you're welcome to drive it yourself." Then narrate the same six beats in the same order. The story doesn't need the animation; it needs the two numbers (five wrong vs. one right) and the false green.

**If even screenshots fail:** tell it as a story in 30 seconds — paste a sheet, ask for a total, get five different wrong numbers; ask for a formula and make the spreadsheet run it, get one exact number every time; then "the same thing with checking — a green check that was lying because the checker looked for the wrong word." End on the one-line takeaway.

**Do not** try to debug anything live. If a click doesn't do what you expect, switch to the screenshot of that state and keep moving.

---

## 4. Likely judge questions (crisp, honest answers)

**"Isn't this just prompt engineering?"**
The opposite. Prompt engineering tries to word the request so the model guesses better. We stop the guessing entirely by handing the computation to a tool — a formula, a query, a checker an engine runs. The words stop mattering once the tool owns the step.

**"What about temperature 0 — doesn't that make it deterministic?"**
No. Temperature 0 makes it *repeat the same guess*, not compute the right answer. Jeff's engine beat (Agent B) is exact regardless of temperature because SQLite does the math, not the model. We never claim we make the AI deterministic — we claim the tool you force it through is.

**"Who is this for?"**
Primarily non-technical adults who already use chat AI — analysts, ops, managers. No syntax required in the default skin. There's a technical skin of the same levels for developers, where the moves ask for scripts, functions and tests.

**"How do you know it works? What's the learning outcome?"**
Honestly: we've built it and tested the mechanics, not learners yet. Every move combination is verified at build time — Level 2 is 128 combinations, World 4 is 4,096 with exactly 64 passing. The learning claim is unproven; our next step is five non-technical testers doing a real task in their own AI, and success is them using these moves *without being told*.

**"Is the AI in the demo real, or scripted?"**
The two teaching prototypes use recorded real-model outputs so they're reproducible on stage. The proof that it's real is Jeff's live Bedrock run: 0/10 vs 10/10 on Claude Sonnet, same data, seed 42.

**"What's next / do the later levels use a live AI?"**
Yes. Worlds 1–4 are recorded for speed and reproducibility. Worlds 5–7 and the bosses run free-text prompts against a live model, with AI-written code executed in a sandbox in the browser. That's phase 2.

**"Business model?"**
No pricing today — this is a hackathon build. The honest shape is a self-serve course or a team/onboarding tool for orgs rolling out AI. We'd rather prove it teaches before we charge for it.

**"Couldn't the model just get good enough at math to not need this?"**
Maybe for a sum. But the lesson isn't "AI can't add" — it's "don't let it guess the part that has a right answer." The false-green email demo isn't about arithmetic; it's about proving a check works before you trust it. That doesn't go away as models improve.

---

## 5. Shortest versions

**One sentence:**
Dt3rmind is a puzzle game that teaches anyone to stop asking AI for the answer and start asking it for the tool and the check that make the answer exact — because determinism comes from the tools you force the AI through, not the words you give it.

**15 seconds:**
Paste a sheet, ask your AI for a total, and you get five different wrong numbers — because it's predicting what a total looks like, not adding. Dt3rmind is a puzzle game that teaches you the fix: ask for the formula, make a tool run it, and ask for the check first and prove it can fail. Seven worlds, twenty-three levels, Guesser to Architect — and you leave with a move you can paste into ChatGPT tomorrow.
