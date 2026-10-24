# Engineering Rules (read this FIRST, before every task)

These rules apply to every task in `tasks.md`. They exist to prevent mistakes. If a rule here conflicts with a convenience, the rule wins. If this file conflicts with `requirements.md` or `design.md`, STOP and ask the human; do not pick silently.

## 0. Mission

Build the **Automata Playground + Mini Model-Description Parser** (see `requirements.md`). The product's value is that **every result is explained step by step**. A correct final answer with no trace is a failure.

Order of authority: `requirements.md` (what) > `design.md` (how) > `tasks.md` (order) > this file (process).

## 1. Per-task workflow (mandatory, no skipping)

For each task in `tasks.md`:

1. **Read**: re-read the task, the requirement IDs it cites, and the matching `design.md` section. Open existing files you will touch. Never edit a file you have not read in this task.
2. **Plan**: write a plan of at most 8 bullets (files to create/change, functions, tests). Do not start coding until the plan exists.
3. **Tests first (engine tasks)**: write the Vitest tests from the task's "Tests required" list and watch them fail for the right reason.
4. **Implement** the smallest code that satisfies the tests and acceptance criteria. Nothing extra.
5. **Gates**: run `pnpm typecheck && pnpm lint && pnpm test`. All must pass. Paste the final summary lines (not full logs) in your report.
6. **Self-review checklist** (answer each in the report, yes/no + one line):
   - Every acceptance criterion of the cited requirements is met and traceable to a test or screen?
   - No `any`, no `@ts-ignore`, no `TODO`, no placeholder or mock data in `src/engine`?
   - Engine functions are pure and deterministic (same input, same output and same step order)?
   - Edge cases from `design.md` covered (empty input, unreachable states, missing transitions, epsilon cycles, single state)?
   - No dependency added that is not listed in `design.md` section 2 (or justified in the report)?
7. **Report** using the format in section 8, then **STOP and wait** for the human to say "continue". Do not start the next task on your own.

## 2. Reuse policy ("use existing code, don't reinvent")

Most problems here are textbook problems with known solutions. Follow this table exactly:

| Area | Rule |
|---|---|
| Project scaffolding, styling, theming, state, validation, graph canvas, auto layout, tree rendering, regex parsing | **Use the libraries listed in `design.md` section 2.** Do not hand-roll these. |
| Core automata algorithms (simulation, epsilon-closure, subset construction, partition minimization, Thompson construction, Arden elimination, transducers, tokenizer DFA, parser) | **Write them ourselves** following the named textbook algorithm, because libraries return answers but not the intermediate steps we must display. |
| Known test cases | Use **textbook examples** (Hopcroft-Ullman, Sipser, Kozen, or the class notes in `requirements.md` Appendix A) and **oracle-based tests** (section 4). |
| Anything else | Search `node_modules`/well-known packages first. Only write custom code if no maintained package fits, and say why in the report. |

Never copy code from the internet of unknown license. Implement from the algorithm description, and name the algorithm in a comment (for example `// Subset construction (Sipser, Thm 1.39)`). If you are unsure about an exact theorem number, name only the algorithm, never invent a citation.

## 3. Dependency rules

- Before installing any package, check its current stable version with `pnpm view <pkg> version` and install that exact version (pin it, no `^`).
- **Before using any library API, open its type definitions in `node_modules` (or its official docs) and confirm the function signature exists.** Never call an API from memory. Library APIs change; hallucinated APIs are the top cause of bugs in generated code.
- Install nothing that `design.md` section 2 does not list, unless the task requires it and you justify it.
- After install, run `pnpm audit --prod` once per phase and report high/critical findings.

## 4. Correctness protocol for algorithms

For every algorithm in `src/engine`:

1. Put a short comment block at the top: the algorithm name, inputs, outputs, and the invariant that makes it correct.
2. Add a **hand-derived** worked example as a test. Show the derivation in a comment so a human can verify it. Do not paste an expected value you did not derive.
3. Add **oracle tests** (these catch what hand examples miss):
   - `equivalent(A, B)` (product-automaton BFS, see `design.md`) for every conversion: `NFA -> DFA`, `DFA -> minimal DFA`, `regex -> NFA`, `FA -> regex -> NFA`.
   - Brute-force membership: enumerate all strings up to length 6 over the alphabet and compare the automaton with an independent reference (JS `RegExp` anchored with `^...$` for regex-derived automata, or a direct predicate for named languages).
   - Property tests with `fast-check` over randomly generated small DFAs and NFAs (seeded, deterministic seed in CI).
   - Minimality oracle: the minimized DFA's state count must equal an independent table-filling (Myhill-Nerode) reference implemented only inside the test folder.
4. If a test fails, **fix the code**. Weaken or delete a test only if you prove by derivation that the test is wrong, and explain that proof in the report.

## 5. Coding standards

- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. Prefer discriminated unions to flags.
- Engine code (`src/engine/**`) imports nothing from React, Next.js, or the DOM. It is plain TypeScript so tests import it directly.
- Pure functions, no mutation of inputs (copy first), no `Math.random`, no `Date.now` inside the engine. Output ordering is canonical (sorted states, sorted symbols) so tests are stable.
- Errors: engine functions never `throw` for user mistakes. They return `{ ok: false, error }` with a typed error code (see `design.md`). `throw` is only for programmer errors (violated invariants).
- No silent `catch`. No swallowed promises.
- Names are explicit (`epsilonClosure`, not `ec`). One exported concept per file where reasonable.
- Every trace step has a human-readable `title` and `explanation` written in plain English suitable for a student.
- Comments explain why, not what.

## 6. UI rules

- UI never implements automata logic. It calls the API client and renders `result` and `trace`.
- Every result view = **final answer first**, then a collapsible **Step log** (`<details>` or accessible disclosure) with prev/next/play controls.
- Light and dark mode both must look correct. Keyboard operable. Sufficient contrast. No color-only meaning (also use shape, text, or pattern).
- Loading, empty, error, and limit-exceeded states are designed, not left blank.

## 7. Things you must NEVER do

- Never mark a task done when any gate fails.
- Never start the next task without the human's "continue".
- Never invent requirements, features, or pages that are not in `requirements.md`. Suggest them in the report instead.
- Never fake output: no hard-coded answers, no mocked API responses in production code.
- Never delete or rewrite earlier tasks' tests to make new work pass.
- Never commit secrets. There should be no secrets in this project at all.
- Never guess when a requirement is ambiguous. Ask one specific question and stop.
- Never claim something is verified unless you ran it.

## 8. Report format (end of every task)

```
TASK <id> <title>: DONE | BLOCKED
Files changed: <list>
Tests: <passed>/<total>, coverage engine: <x>%
Gates: typecheck OK | lint OK | test OK
Acceptance criteria: R<id>.<n> -> <test name or screen> (one line each)
Self-review checklist: <5 answers>
Assumptions / decisions: <list, or "none">
Open questions for human: <list, or "none">
```

If BLOCKED, say exactly what blocks and what you need.
