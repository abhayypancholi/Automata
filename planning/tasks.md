# Tasks

Rules: follow `engineering-rules.md` for every task (read, plan, tests first, implement, gates, self-review, report, STOP). Do tasks strictly in order. Do not start a task until the human says "continue".

Gate command for every task: `pnpm typecheck && pnpm lint && pnpm test`.

Order of work (as chosen): **core engine first (T1 to T14), UI after (T15 onward).**

---

## Phase A: Foundation

- [ ] **T0. Scaffold**
  - Create the Next.js app (TypeScript, App Router, Tailwind, ESLint, `src/` dir, pnpm). Install the dependencies in `design.md` section 2 (exact pinned versions, after reading their types). Set `strict` and `noUncheckedIndexedAccess`, path alias `@/`. Add scripts: `typecheck`, `lint`, `test`, `test:cov`, `check` (all three gates). Vitest config with 90% line-coverage threshold on `src/engine/**`. Create the folder skeleton from `design.md` section 3 with empty `index.ts` placeholders only where needed.
  - Tests required: one trivial engine test proving Vitest runs; one test importing the `@/` alias.
  - Done when: `pnpm check` is green, `pnpm dev` serves the default page, `pnpm build` succeeds.
  - Reqs: R17.4, R17.5.

- [ ] **T1. Automaton core: types, validation, normalization, oracles**
  - Implement `types.ts`, `errors.ts`, `trace.ts`, `validate.ts`, `normalize.ts`, `equivalence.ts` (product-automaton BFS over reachable pairs of subset-states; works for DFA and NFA via on-the-fly subset construction and ε-closure; returns `{ equivalent: true } | { equivalent: false, counterexample: string }` with a shortest counterexample), `enumerate.ts` (all strings up to length n over an alphabet, in length-then-lexicographic order), and a test-only module with `fast-check` arbitraries for small random DFAs and NFAs, and a naive reference acceptor.
  - Tests required: validation errors for each case in design section 4 with exact messages; normalization is idempotent; `equivalent` returns true for an automaton and a renamed copy, false with a correct shortest counterexample for hand-built different languages; enumerator order and count (`Σ^0..Σ^n`); reference acceptor agrees with `equivalent` on random pairs (self-consistency).
  - Reqs: R1.6, R17.2, R17.3.

- [ ] **T2. Simulation**
  - Implement `simulate.ts` per design 6.1 with trace.
  - Tests required: hand-derived DFA example (derivation in a comment), NFA with ε example, empty string cases (accepting and non-accepting start), stuck DFA, symbol not in alphabet error with position, trace length equals input length + 1, determinism.
  - Oracle: for random automata and all strings up to length 5, `simulate` accept equals the naive reference acceptor.
  - Reqs: R2.1, R2.2, R2.3, R2.5.

## Phase B: Conversions

- [ ] **T3. Epsilon-closure and subset construction**
  - Implement per design 6.2.
  - Tests required: closure with ε cycles; closure of empty set; a hand-derived NFA to DFA example (including the `∅` state case and a case where it is unreachable); accepting rule; `LIMIT_EXCEEDED` using the classic "n-th symbol from the end is 1" NFA with large n (the construction needs 2^n states); step count equals the number of (subset, symbol) pairs plus 2; the Appendix A class examples once the human has filled them in (if still empty, say so in the report and continue).
  - Oracle: `equivalent(nfa, dfa)` and brute-force membership up to length 6 on random NFAs (with and without ε) via `fast-check`.
  - Reqs: R3.1 to R3.7.

- [ ] **T4. DFA minimization**
  - Implement per design 6.3, plus the **test-only** independent table-filling reference in `__reference__/tableFilling.ts`.
  - Tests required: hand-derived example with π0, π1, π2 spelled out; already-minimal DFA (`alreadyMinimal: true`); DFA with unreachable states; incomplete DFA (dead state added); all-accepting and none-accepting DFAs; single-state DFA; split witnesses are valid (the witness pair really goes to different blocks of the previous partition on that symbol).
  - Oracle: `equivalent(input, minimal)`; minimal state count equals the table-filling reference's class count on random DFAs; minimizing twice changes nothing.
  - Reqs: R4.1 to R4.6.

- [ ] **T5. Regex adapter and Thompson construction**
  - Implement `parseRegex.ts` (adapter around `regexp-tree`; verify its API in `node_modules` first), `thompson.ts`, `print.ts` per design 6.4.
  - Tests required: one test per supported construct (literal, concat, union, star, plus, optional, group, class with range, empty group); one test per unsupported feature (anchor, backreference, lookahead, `.`, `{2,3}`, negated class, flags) asserting `UNSUPPORTED_REGEX_FEATURE`; printer round trip (`parse(print(ast))` equals `ast`); textbook printer uses `+` for union.
  - Oracle: for a corpus of 30 regexes and a `fast-check` generator of random regexes in the supported subset, the NFA accepts exactly the strings that JS `new RegExp('^(?:' + src + ')$')` accepts, for all strings up to length 6 over the alphabet; additionally `equivalent(nfa, minimize(subset(nfa)))`.
  - Reqs: R5.1 to R5.5.

- [ ] **T6. Arden's theorem (FA to regex) and simplifier**
  - Implement `arden.ts` and `simplify.ts` per design 6.5. Decide and document the equation convention in the file header. Trace step per substitution and per Arden application, listing identities used.
  - Tests required: hand-derived example (write the equations and solution in a comment); automaton with no accepting state gives `∅`; automaton accepting only ε; self-loop-only; each simplification identity has its own test.
  - Oracle (round trip): for random NFAs and DFAs, `equivalent(a, regexToNfa(ardenRegex(a)))`; for the 30-regex corpus, `regex -> NFA -> DFA -> min -> regex -> NFA` is equivalent to the original.
  - Reqs: R6.1 to R6.4.

## Phase C: Number systems and language theory

- [ ] **T7. Number systems**
  - Implement `transducer.ts`, `convert.ts`, `validators.ts`, `divisibility.ts` per design 6.6 (LSB-first binary to octal/hex, as specified in R9.1).
  - Tests required: binary to octal and hex for strings whose length is and is not a multiple of the group size; `0`, `1`, all zeros, long strings; octal and hex to binary; octal to hex and back; leading-zero handling both modes; the transducer table size (7 states octal, 15 hex); validators accept/reject lists for each base with and without prefix; divisibility DFA for n = 1, 2, 3, 5, 7, 64.
  - Oracle: for all binary strings up to length 12, converted output equals `BigInt('0b' + s).toString(8|16)` (normalized); every validator's minimized DFA agrees with a direct predicate on all strings up to length 5 over a representative alphabet; divisibility DFA agrees with `BigInt` modulo for all binary strings up to length 14 and n in 1..20.
  - Reqs: R9.1 to R9.6.

- [ ] **T8. Language identification**
  - Implement `grammarParse.ts`, `classifyGrammar.ts`, `namedLanguages.ts` per design 6.7.
  - Tests required: classification of hand-picked grammars for each type including left-linear, right-linear, and a mixed one that is Type 2 only; a regular language written with a Type 2 grammar still reports Type 2 with the "upper bound" wording; `S -> ε` rule; malformed grammar errors with line/column; every named language: membership true/false lists (at least 6 each) written by hand, and `machine` (when present) agrees with `membership` on all strings up to length 8 over its alphabet.
  - Reqs: R7.1 to R7.5.

- [ ] **T9. Pumping lemma engine**
  - Implement `pumping.ts` per design 6.8.
  - Tests required: aⁿbⁿ with p = 3: count of decompositions equals the hand-computed number (derive it in a comment), every one fails; a wrong witness (not in language or too short) returns an error; regular mode on a hand-built DFA with a hand-derived x, y, z; string shorter than p returns the "lemma does not apply" explanation; wwᴿ and aⁿbⁿcⁿ with p = 2..5.
  - Oracle: for regular mode, `xy^i z` acceptance equals `w` acceptance for i in 0..5 on random DFAs and random accepted/rejected strings of length ≥ p.
  - Reqs: R8.1 to R8.4.

## Phase D: Part Two engine

- [ ] **T10. Tokenizer built from the Part One pipeline**
  - Implement `tokenDefs.ts`, `buildLexer.ts`, `lex.ts` per design 6.9, reusing T5 and T3 functions (import them; do not copy).
  - Tests required: every token class with positive examples including `0b1010`, `0o17`, `0xFF`, `0xff`, `1e-3`, `2.5`, `dv/dt`; `dx/dtau` fallback; maximal munch (`**` vs `*`, `0x1G`); comments and newlines; line/column correctness over multi-line input; `UNEXPECTED_CHARACTER` position; the built lexer DFA has tags and is deterministic; the DFA is built **once** and reused.
  - Oracle: for random sequences of valid tokens joined with spaces, lexing returns exactly those tokens and texts.
  - Reqs: R10.1 to R10.6.

- [ ] **T11. Grammar, FIRST/FOLLOW, parser, parse tree, derivation**
  - Implement `grammar.ts` (grammar as data, original and LL forms), `firstFollow.ts`, `ast.ts`, `parse.ts` (recursive descent), `derivation.ts` per design section 7. Errors in this task may use basic messages; precise messages come in T12.
  - Tests required: FIRST/FOLLOW for the expression nonterminals checked against hand-derived sets (derivation in comments); precedence and associativity (`1 - 2 - 3`, `2 ^ 3 ^ 2`, `-2 ^ 2`, `a * b + c`); function calls with 0, 1, 2 arguments; parameter declarations; flags like `(clock-driven)`; multi-line programs parse line by line; leftmost derivation for a small equation matches a hand-derived derivation exactly.
  - Oracle: pretty-print(ast) then re-parse gives an identical AST (round trip) on randomly generated expression trees via `fast-check`.
  - Reqs: R11.1 to R11.4.

- [ ] **T12. Helpful errors and annotations**
  - Implement the error classification layer: `UNCLOSED_PAREN` (with `related` pointing to the opening paren), `UNEXPECTED_CLOSE_PAREN`, `MISSING_OPERAND`, `MISSING_EQUALS`, `MISSING_UNIT`, `UNKNOWN_UNIT` (unit-name check can be a stub list here, completed in T13; mark that dependency in the report), `UNEXPECTED_CHARACTER`, double operator; `expected` sets taken from FIRST/FOLLOW; error renderer producing source line plus caret (pure function returning strings, UI renders it); comment annotations attached per design section 7.
  - Tests required: every invalid fixture in `requirements.md` Appendix B asserts exact code, line, column, and the `expected` list; the caret renderer output for three fixtures matches hand-written strings; annotations: trailing comment, full-line comment above, free comment, multiple comments; comments never change the AST apart from annotations.
  - Reqs: R12.1 to R12.4.

- [ ] **T13. Unit checker**
  - Implement `dimension.ts`, `unitTable.ts`, `check.ts` per design section 8.
  - Tests required: dimension arithmetic; `nameOf` for volt, ohm, siemens, farad, hertz; format strings; every rule in R13.3 to R13.8 with a passing and a failing example; the valid fixture in Appendix B passes; `dv/dt = I + tau : volt` gives `UNIT_MISMATCH`; forward references work; reserved names rejected; `mV` versus `V` is not an error; `exp(v)` with dimensional `v` errors; `abs(v)` preserves; `v^2`, `v^-1`, `v^0.5` (error) behavior.
  - Oracle: for random well-typed expressions built by a generator that tracks dimensions, the checker's computed dimension equals the generator's.
  - Reqs: R13.1 to R13.9.

## Phase E: API

- [ ] **T14. Route Handlers, schemas, error mapping**
  - Implement all endpoints in `design.md` section 5 as thin handlers: parse JSON, zod-validate (with the R17.1 limits and 100 KB body cap), call the engine, map `EngineError` to status codes (design section 11), return the common envelope. One shared helper for the envelope and error mapping. No algorithm logic in handlers.
  - Tests required: for each endpoint, call the exported handler with a `Request`: success example, malformed body (400), limit exceeded (422), unsupported feature (422), oversized body; envelope shape asserted with a zod schema for responses; determinism (same request twice gives identical JSON).
  - Done when: also `curl` examples for three endpoints against `pnpm dev` are pasted in the report with real output.
  - Reqs: R15.1 to R15.5, R17.1, R17.6.

---

## Phase F: UI (engine and API are finished and green before this starts)

- [ ] **T15. App shell, theme, store, API client**
  - Layout, nav, light/dark with `next-themes`, design tokens (Tailwind), Zustand store for the automaton with actions (add/rename/delete state, set start, toggle accepting, add/remove symbol, add/update/remove transition, import/export, load example, set kind), `apiClient.ts` (typed fetch wrappers with zod-parsed responses and uniform error handling), shared `ResultPanel`, `ErrorView`, `LoadingView`, `EmptyView`.
  - Tests required: store action unit tests (every action, invariants such as renaming a state updates all transitions and start/accepting); API client parses success and error envelopes (mock `fetch` in tests only).
  - Reqs: R1.1 to R1.3, R16.2, R16.4.

- [ ] **T16. Automaton editor: table and canvas in sync**
  - Build `TableEditor`, `CanvasEditor` (`@xyflow/react`, custom node and edge, merged labels, self-loops, curved opposite edges), dagre auto-layout button, import/export JSON, inline validation messages from `validateAutomaton`. Both views read and write only the store.
  - Tests required: component tests (Vitest + Testing Library; install it in this task and justify) for table edits updating the store, and a store-to-canvas projection function (`toFlowGraph(automaton)`) unit-tested for node and edge counts, merged labels, and self-loop flags; keyboard operability of the table.
  - Done when: manual check list in the report (add state on canvas appears in table and the reverse; epsilon typing; DFA validation message) with screenshots or exact descriptions.
  - Reqs: R1.1 to R1.8, R16.3.

- [ ] **T17. Step log component and Simulation page**
  - `StepLog` (collapsed by default, "Show steps (N)"), `Stepper` (prev/next/play/pause/speed/jump), feature `StepView` registry keyed by `data.kind`. `/simulate` page: input string(s), run through `/api/simulate`, animated highlight on canvas, results table for multiple strings.
  - Tests required: `StepLog` collapsed/expanded behavior, stepper bounds (cannot go before first or after last), play advances and stops at the end (fake timers); page-level test with a mocked API client for accept and reject.
  - Reqs: R2.1 to R2.6, R16.1.

- [ ] **T18. Pages: NFA to DFA, Minimize, Regex and Arden**
  - `/nfa-to-dfa` (growing table that reveals one row per step, rename toggle), `/minimize` (partition list per iteration, split reasons, hide-dead-state toggle, mapping table), `/regex` (regex input, Thompson fragments per step, continue-to-DFA/min buttons, Arden tab with equations and substitutions, canonical/textbook regex display toggle).
  - Tests required: per page a test with the mocked client for the happy path and for an error response (error view shown), plus one test per `StepView` rendering a fixture step.
  - Reqs: R3.2, R3.3, R4.3, R4.4, R5.4, R5.5, R6.1, R16.1.

- [ ] **T19. Pages: Numbers, Language, Pumping, Parser**
  - `/numbers` (converter with transducer table and trace, validators with regex and DFA, divisibility DFA, decimal limitation explainer), `/language` (regex/automaton/grammar/named inputs, result with reasons and the "upper bound" notice), `/pumping` (non-regular and regular modes, full decomposition table with verdicts, general proof text), `/parser` (tabs: Tokens, Parse tree, Derivation, Units, Annotations; inline errors with caret; per-line status; balanced-parentheses demonstration section linking to `/pumping`).
  - Tests required: same pattern as T18; plus a test that the parser page shows the exact caret text from the error renderer for two fixtures.
  - Reqs: R7, R8, R9, R10 to R13 UI parts, R11.5, R16.1.

- [ ] **T20. Examples library**
  - Create typed example JSON files in `src/examples` for every page (R14.2), including the Appendix A class examples (verbatim) and Appendix B programs. `ExamplePicker` on each page. One test loads every example, validates its shape with zod, runs the corresponding engine function, and asserts the expected property (oracle-based where possible, hand-derived value otherwise).
  - Reqs: R14.1 to R14.3.

- [ ] **T21. Polish, accessibility, README, deploy**
  - Responsive pass at 360 px, focus states, contrast check in both themes, reduced-motion respect for animation, empty/loading/error/limit states verified on every page, README (what it is, feature list mapped to the syllabus, how to run, how to test, architecture diagram, known limitations from R18, the LSB-first explanation for R9.1). Deploy to Vercel; record the URL.
  - Tests required: `pnpm build` passes; a Playwright or equivalent smoke test is optional; if skipped, list manual smoke steps and run them against the deployed URL.
  - Reqs: R16.3, R16.4, R17.5, R17.6.

- [ ] **T22. Final audit**
  - Produce a **traceability matrix** (markdown table): every acceptance criterion (R1.1 to R17.6) mapped to the test file and test name or the page and manual check that proves it. Any criterion without evidence is listed under "Gaps" with the fix applied or a reason. Run the full gates plus coverage; paste summary. List all deviations from the spec made along the way.
  - Done when: zero unexplained gaps and `pnpm check` plus `pnpm build` are green.

---

## Stretch (only after T22, and only if the human asks)

- Non-self-embedding check for CFGs (Chomsky's theorem: non-self-embedding implies regular) as an extra Language Identification hint, implemented on a cleaned grammar (no useless symbols, ε-productions, or unit productions) with its own oracle tests.
- Visual DFA for the tokenizer in `/parser`.
- Export step logs as PDF or Markdown for the course report.
