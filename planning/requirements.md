# Requirements: Automata Playground and Mini Model-Description Parser

Course project for Automata Theory. Web app, Next.js on Vercel, algorithms implemented in the backend (Next.js Route Handlers calling a pure TypeScript engine). No database. No accounts.

Acceptance criteria use EARS style: "WHEN <event> THE SYSTEM SHALL <response>". IDs (R1.2 etc.) are referenced by `tasks.md` and by test names.

## Glossary

- **Automaton**: DFA, NFA, or epsilon-NFA, stored as one canonical JSON object (see `design.md`).
- **Trace**: ordered list of steps, each with a title, a plain-English explanation, structured data, and optional highlights. Every algorithm returns `result` plus `trace`.
- **Step log**: the collapsible UI view of a trace.
- **Engine**: pure TypeScript in `src/engine`, no React or Next.js imports.

---

## R1. Automaton editor (canvas and table, kept in sync)

**Story:** As a student I want to build an automaton by drawing it or by typing its transition table, and see both views stay identical.

1. WHEN the user adds, renames, moves, or deletes a state on the canvas THE SYSTEM SHALL update the transition table immediately, and the reverse.
2. WHEN the user edits a transition (from, symbol, to) in either view THE SYSTEM SHALL update the other view and re-validate.
3. THE SYSTEM SHALL support marking exactly one start state and any number of accepting states, shown with an incoming arrow and a double circle respectively.
4. THE SYSTEM SHALL support the symbol `ε` (typed as `ε`, `eps`, or `epsilon`) as a transition label, only for kind NFA with epsilon moves.
5. WHEN several transitions share the same from and to THE SYSTEM SHALL draw one edge with a merged label (for example `a,b`); self-loops SHALL be drawn as loops.
6. WHEN the automaton is marked DFA AND it has a missing transition or two transitions on the same symbol from one state THE SYSTEM SHALL show a precise validation message naming the state and symbol, and SHALL NOT run DFA-only algorithms until fixed.
7. THE SYSTEM SHALL offer export and import of the canonical JSON, and an auto-layout button.
8. IF the automaton exceeds limits (R17.1) THE SYSTEM SHALL refuse the edit with a clear message.

## R2. DFA / NFA / epsilon-NFA simulation

1. WHEN the user submits a string THE SYSTEM SHALL return accept or reject and a trace with one step per input symbol.
2. FOR a DFA each step SHALL show the current state, the symbol read, and the next state. FOR an NFA each step SHALL show the full set of current states after epsilon-closure, and which transitions were followed.
3. WHEN a DFA has no transition for a symbol THE SYSTEM SHALL report a "stuck" (implicit dead state) result and say so in the explanation.
4. THE SYSTEM SHALL animate the trace on the canvas (highlight active states and the transition used) with play, pause, step-forward, step-back, and speed control.
5. THE SYSTEM SHALL accept the empty string and evaluate it correctly (accept iff the start state, after epsilon-closure, contains an accepting state).
6. THE SYSTEM SHALL support testing several strings at once and show a results table.

## R3. NFA to DFA (subset construction)

1. WHEN the user converts an NFA or epsilon-NFA THE SYSTEM SHALL build the DFA by subset construction and return a trace showing, one row at a time, the subset being processed, the move result for each symbol, the epsilon-closure applied, and whether the resulting subset is new.
2. THE SYSTEM SHALL display the construction as a growing table; the UI SHALL reveal one row per step in the step log.
3. THE SYSTEM SHALL name DFA states by their subsets (for example `{q0,q1}`) and offer a renaming toggle to `A, B, C...`.
4. THE SYSTEM SHALL mark a DFA state accepting iff its subset contains an NFA accepting state.
5. THE SYSTEM SHALL include the empty-set (dead) state only when it is reachable, and explain it when present.
6. THE SYSTEM SHALL produce a DFA language-equivalent to the input NFA (verified by tests, R17.3).
7. IF more than 1024 DFA states would be generated THE SYSTEM SHALL stop with error `LIMIT_EXCEEDED` and say how many states were generated so far.

## R4. DFA minimization (partition refinement)

1. WHEN the user minimizes a DFA THE SYSTEM SHALL first complete it (add an explicit dead state if any transition is missing) and remove unreachable states, each as its own trace step.
2. THE SYSTEM SHALL compute and display the partitions π0, π1, π2, ... until two consecutive partitions are equal. π0 SHALL be {accepting, non-accepting} (empty blocks omitted).
3. FOR each refinement step THE SYSTEM SHALL show which block was split and why (the pair of states and the symbol on which they go to different blocks of the previous partition).
4. THE SYSTEM SHALL build and display the minimized DFA, with a state-to-block mapping, and offer a toggle to hide the dead state in the drawing.
5. THE SYSTEM SHALL return a DFA that is language-equivalent to the input and has the minimum possible number of states (verified against an independent table-filling reference in tests).
6. IF the input is already minimal THE SYSTEM SHALL say so and show the stable partition.

## R5. Regular expression to finite automaton

1. WHEN the user enters a regular expression THE SYSTEM SHALL parse it using the regex-parsing library (design section 2) behind an adapter, and convert it to an epsilon-NFA by Thompson's construction, with one trace step per syntax-tree node showing the fragment built.
2. THE SYSTEM SHALL support: literals, concatenation, union `|`, Kleene star `*`, plus `+`, optional `?`, grouping `( )`, character classes of literals and ranges (`[01]`, `[0-9a-f]`), and the empty group `()` meaning epsilon.
3. WHEN the expression uses any other feature (anchors, backreferences, lookaround, `.`, counted repetition, flags) THE SYSTEM SHALL reject it with error `UNSUPPORTED_REGEX_FEATURE` naming the feature and its position.
4. THE SYSTEM SHALL let the user continue the pipeline: epsilon-NFA to DFA (R3) to minimal DFA (R4), reusing the same engine functions.
5. THE SYSTEM SHALL display regexes in textbook notation as an option (`+` for union), while the canonical machine-readable form uses `|`.

## R6. Finite automaton to regular expression (Arden's theorem)

1. WHEN the user converts an automaton THE SYSTEM SHALL write one equation per state (`q = Σ (a·q') [+ ε if accepting]`) and solve the system, showing each substitution and each application of Arden's rule (`X = A·X + B` gives `X = A*·B`) as a trace step.
2. THE SYSTEM SHALL simplify results using the standard identities (`∅` absorbing for concatenation, `ε` identity for concatenation, `∅` identity for union, `ε* = ε`, `∅* = ε`, `r|r = r`) and list which identity was applied.
3. THE SYSTEM SHALL return a regex whose language equals the automaton's language (verified by round trip in tests, R17.3).
4. THE SYSTEM SHALL accept NFA and epsilon-NFA inputs (treating `ε` as a symbol in the equations).

## R7. Language identification (curated)

1. WHEN the user supplies a regex or a finite automaton THE SYSTEM SHALL answer "Regular (Type 3)" with the reason.
2. WHEN the user supplies a grammar as text THE SYSTEM SHALL classify the **grammar form**: right-linear or left-linear (Type 3), context-free (Type 2), context-sensitive / non-contracting (Type 1), or unrestricted (Type 0), and SHALL state clearly that this is an **upper bound on the language's class**, because a grammar of a higher type can still generate a simpler language.
3. THE SYSTEM SHALL provide a library of named languages (at least: aⁿbⁿ, aⁿbⁿcⁿ, wwᴿ, ww, palindromes, a*b*, strings with equal numbers of a and b, strings with even number of a, binary divisible by n, aⁿbᵐ with n ≤ m, aᵖ for prime p). Each entry SHALL show its class, a proof sketch, and a machine that recognises it where one exists (DFA, PDA description, or LBA/TM description in text).
4. WHEN a language is not regular and a pumping-lemma demonstration is available THE SYSTEM SHALL link to R8.
5. THE SYSTEM SHALL NOT claim to decide the class of an arbitrary language; its answers SHALL be limited to the cases above and the UI SHALL say so.

## R8. Pumping lemma demonstration

1. FOR a named non-regular language from R7 and a chosen p (2 to 8) THE SYSTEM SHALL build the witness string s with |s| ≥ p, list **every** decomposition s = xyz with |xy| ≤ p and |y| ≥ 1, and for each show the smallest i in 0..5 such that x yⁱ z is not in the language.
2. THE SYSTEM SHALL conclude "no decomposition can be pumped for this p" only when every decomposition fails, and SHALL state that this demonstrates the standard proof for this particular p; the general proof (for all p) SHALL be shown as written text.
3. FOR a regular language (any DFA) THE SYSTEM SHALL show the pumping length p = number of states, take a string of length ≥ p, find the repeated state, show xyz, and show that xyⁱz stays in the language for i = 0..5.
4. IF the user picks a string shorter than p THE SYSTEM SHALL explain why the lemma does not apply.

## R9. Number systems as finite-state machines

1. THE SYSTEM SHALL convert binary to octal and binary to hexadecimal using a **finite-state machine with output** (a Mealy transducer). The machine SHALL read the binary string **from the least significant bit (right to left)**, keep the bits of the current group (3 for octal, 4 for hex) in its state, emit one digit whenever a group completes, and, at end of input, flush a partial group padded with leading zeros. The UI SHALL display the emitted digits reversed so the final number reads normally. The explanation SHALL state why right-to-left is used (groups are aligned from the right, and the machine cannot know the string length in advance).
2. THE SYSTEM SHALL convert octal and hexadecimal to binary with a one-state transducer that emits 3 or 4 bits per digit; and octal to or from hexadecimal by composing through binary.
3. THE SYSTEM SHALL show the transducer's transition table (state, input bit, next state, output) and a step trace per input symbol.
4. THE SYSTEM SHALL validate whether a string is a legal binary, octal, or hexadecimal number using a regular expression **and** the DFA built from it by the Part 1 pipeline (R5, R3, R4), with optional prefixes `0b`, `0o`, `0x`.
5. THE SYSTEM SHALL build a "binary divisible by n" DFA for n from 1 to 64 (states are remainders, transition `δ(r, b) = (2r + b) mod n`, reading most significant bit first), show its table, and test strings.
6. THE SYSTEM SHALL include a short explanation page stating that decimal conversion is not finite-state in general, with a plain-language argument (unbounded carries/remainders need unbounded memory), and SHALL mark any stronger claim as "known result, cite your textbook" and not present it as proven by the tool.

## R10. Tokenizer (Part Two)

1. THE SYSTEM SHALL define token classes by regular expressions and build the tokenizer using the same regex-to-NFA-to-DFA pipeline as R5 and R3 (no hand-written lexer shortcuts).
2. THE SYSTEM SHALL recognise: identifiers, decimal numbers (integers, decimals, optional exponent such as `1e-3`), binary/octal/hex literals (`0b1010`, `0o17`, `0xFF`, case-insensitive hex digits), operators `+ - * / ^ **`, punctuation `( ) , : =`, the derivative token `d<ident>/dt` (for example `dv/dt`), comments starting with `#` to end of line, and newlines.
3. THE SYSTEM SHALL use maximal munch with a fixed priority order for ties, and SHALL return tokens with type, text, offset, line, and column.
4. WHEN a character matches no token THE SYSTEM SHALL return error `UNEXPECTED_CHARACTER` with position (R12).
5. THE SYSTEM SHALL handle the edge case where a derivative token is followed by identifier characters (for example `dx/dtau` is IDENT `dx`, `/`, IDENT `dtau`, not DIFF then `au`).
6. THE SYSTEM SHALL show the token table and, optionally, the token-recognising DFA.

## R11. Grammar and parser (Part Two)

1. THE SYSTEM SHALL define the language by a context-free grammar (given in `design.md` section 8) and display both the original CFG and the LL(1)-friendly form used by the parser (left recursion removed), with FIRST and FOLLOW sets.
2. THE SYSTEM SHALL parse a multi-line program into a parse tree and show: the tree (rendered with the tree library), a **leftmost derivation** step by step, and the token stream used.
3. THE SYSTEM SHALL parse each line independently so that an error on one line does not hide results from the others.
4. THE SYSTEM SHALL handle operator precedence and associativity: unary minus, `^`/`**` (right associative, binds tighter than unary minus on its left operand), `*` `/`, then `+` `-`.
5. THE SYSTEM SHALL include a page demonstrating that balanced parentheses are not regular: it SHALL link to the pumping demo for { (ⁿ )ⁿ } and show that the tokenizer (finite automaton) can only recognise parentheses as tokens while the parser (stack/recursion) matches them.

## R12. Helpful errors and annotations

1. WHEN tokenizing or parsing fails THE SYSTEM SHALL return an error object with: code, message, line, column, offset, length, the offending text, the **set of expected tokens** (derived from the parser's FIRST/FOLLOW logic), and a short hint.
2. THE SYSTEM SHALL render the error with the source line and a caret/underline at the exact location.
3. THE SYSTEM SHALL give specific messages (not a generic "unexpected token") for at least: unclosed `(` (naming where it was opened), unexpected `)`, missing operand (for example `1 +`), missing `=`, missing unit after `:`, two operators in a row, unknown unit name, unknown character.
4. THE SYSTEM SHALL store comments as annotations attached to the nearest equation (trailing comment on the same line, or full-line comments immediately above), keep them in the AST, and show them next to the equation in the output; they SHALL NOT affect parsing.

## R13. Unit checking (Part Two)

1. THE SYSTEM SHALL represent a physical dimension as integer exponents over the seven SI base dimensions (length, mass, time, current, temperature, amount, luminous intensity) and know at least these units and their dimensions: metre/meter (m), kilogram (kg), second (s), ampere/amp (A), kelvin (K), mole (mol), candela (cd), hertz (Hz), newton (N), pascal (Pa), joule (J), watt (W), coulomb (C), volt (V), farad (F), ohm, siemens (S), plus explicit SI-prefixed forms from a table (at least m, u, n, p, k, M prefixes on common units, e.g. mV, ms, nA, uF, kohm, Mohm). Scale factors are ignored: `mV` and `V` have the same dimension.
2. THE SYSTEM SHALL support declarations `name : unit` (parameter) and `name = expr : unit` (equation) and `dname/dt = expr : unit` (differential equation, where the unit after the colon is the unit of `name`), plus an optional flag list in parentheses after the unit (`(constant)`, `(shared)`, `(linked)`, `(clock-driven)`, `(event-driven)`), which is parsed and shown but does not change checking.
3. WHEN `+` or `-` combines operands of different dimensions THE SYSTEM SHALL report `UNIT_MISMATCH` naming both dimensions and the operator position.
4. THE SYSTEM SHALL compute dimensions through `*`, `/`, and `^`/`**` (exponent must be an integer literal, optionally negative); a non-integer or non-literal exponent on a dimensional base SHALL be an error.
5. THE SYSTEM SHALL require dimensionless arguments for `exp, log, sin, cos, tan, tanh`, and preserve the dimension through `abs`.
6. WHEN the right-hand side dimension differs from the declared one (for a differential equation: declared unit divided by second) THE SYSTEM SHALL report `UNIT_MISMATCH` with expected and actual dimensions written both as base-unit products (for example `m^2 kg s^-3 A^-1`) and, when it matches a named unit, that name.
7. WHEN an identifier is used but never declared THE SYSTEM SHALL report `UNDECLARED_IDENTIFIER`. Reserved unit names SHALL NOT be usable as variable names (error `RESERVED_NAME`).
8. THE SYSTEM SHALL resolve declarations in a first pass so equations may reference variables declared on later lines.
9. THE SYSTEM SHALL NOT evaluate equations numerically (see R18).

## R14. Examples library

1. FOR every feature page THE SYSTEM SHALL ship a set of built-in examples that load with one click, each with a short description of what it demonstrates.
2. THE SYSTEM SHALL ship at least: 3 DFAs, 3 NFAs (one with epsilon moves), 3 regexes, 2 minimization cases (one already minimal), 2 Arden cases, the named languages in R7, the Part Two sample programs (valid, and one invalid per error type in R12.3, and unit-mismatch cases).
3. Expected results for examples SHALL be asserted by tests (oracle-based where possible).

## R15. API

1. THE SYSTEM SHALL expose the engine through Next.js Route Handlers under `/api/*` (list in `design.md` section 5). The UI SHALL obtain every algorithmic result by calling these endpoints.
2. THE SYSTEM SHALL validate every request body with a schema and return HTTP 400 with a structured error for invalid input, 422 for valid-but-unsupported input (for example limit exceeded or unsupported regex feature), and 200 with `ok: true` for success.
3. Every successful response SHALL have the shape `{ ok: true, result, trace }`; every failure `{ ok: false, error }`.
4. THE SYSTEM SHALL be stateless (no database, no server-side session) so it deploys on Vercel serverless.
5. THE SYSTEM SHALL reject request bodies larger than 100 KB.

## R16. Explanation UX, theme, accessibility

1. Every feature page SHALL show the **final answer** first and a **collapsible step log** below it, with previous, next, play, and jump-to-step controls; the step shown SHALL also be reflected in the visuals (highlighted states or table rows).
2. THE SYSTEM SHALL provide a clean, minimal design with light and dark mode (following the system setting by default, with a manual toggle).
3. THE SYSTEM SHALL be usable at 360 px width and up, keyboard operable, with visible focus, and no information conveyed by color alone.
4. THE SYSTEM SHALL show designed loading, empty, error, and limit-exceeded states.

## R17. Quality, limits, determinism

1. Limits: at most 30 states and 10 alphabet symbols per input automaton; regex length at most 200 characters; program source at most 5,000 characters; trace at most 2,000 steps (exceeding returns `LIMIT_EXCEEDED`).
2. THE SYSTEM SHALL produce deterministic output: identical input yields identical result and identical step order.
3. Every conversion SHALL be covered by oracle tests: language equivalence (product-automaton check), brute-force membership over all strings up to length 6, and `fast-check` property tests on random small automata.
4. Engine line coverage SHALL be at least 90%, enforced in the test configuration.
5. THE SYSTEM SHALL build with zero TypeScript errors and zero ESLint errors.
6. A typical request SHALL complete in under 1 second on Vercel for inputs within limits.

## R18. Non-goals

No numeric solving or simulation of equations; no user accounts or saved projects on a server; no decision procedure for arbitrary languages (R7.5); no pushdown-automaton or Turing-machine simulators (text descriptions only); no support for the full Brian 2 language beyond R10 to R13; no mobile app.

---

## Appendix A. Examples from class notes (Abhay fills this in before starting)

Paste here, exactly as written in your notes, the examples your professor used. The agent must turn each into a test and a one-click example (R14), and must not "improve" them.

- **DFA/NFA simulation examples**: Find a DFA for the following language: L = { w | w belongs to {0, 1, 2, 3}* and the sum of the symbols of w is always even }

- **NFA to DFA examples**: Derive the NFA and the minimized DFA for integer constants (Decimal, Hexadecimal starting with 0x/0X, Octal starting with 0).

- **Minimization examples**: Give minimized DFAs for each of the following:
  - (a) L = { w | w belongs to {0, 1}* and w does not contain the substring 101 }
  - (b) L = { w | w belongs to {a, b, c, d}* and no symbol appears consecutively in w }

- **Regex to automaton and Arden examples**: Convert this DFA [from L = { w | w belongs to {0, 1, 2, 3}* and the sum of the symbols of w is always even }] into a regular expression using the algebraic method.

- **"Binary divisible by n" example from class**: Give minimized DFA for: L = { a^m b^n | m is divisible by 3 and n is divisible by 5 }

- **Octal/hex conversion examples**: Write a regular expression for integer constants with the following conventions:
  - A simple sequence of decimal digits (0–9) is always an integer constant.
  - A sequence of hexadecimal digits (0–9, A–F) preceded by "0x" or "0X" is an integer constant.
  - A sequence of octal digits (0–7) preceded by "0" is an integer constant.

- **Grammar/derivation examples**: Find a grammar for each of the following languages:
  - (a) L = { a^m b^n c^p | m = n + p; m, n, p >= 0 }
  - (b) L = { a^m b^n c^p | n = m + p; m, n, p >= 0 }

- **Pumping Lemma examples (from MTE)**: Use the Pumping Lemma to prove that the following language is not regular: L = { a^n b^(2n) c^(3n) | n >= 1 }

## Appendix B. Part Two sample programs (acceptance fixtures)

Valid:

```
# leaky integrate-and-fire neuron
dv/dt = (I - v)/tau : volt      # membrane potential
tau : second (constant)
I : volt
```

Invalid (each is tested as a program where the first line is the broken line and the declarations `tau : second` and `I : volt` follow it, so only the intended error appears; each must produce the specified error code and position):

```
dv/dt = (I - v/tau : volt          -> UNCLOSED_PAREN (opened at 1:9)
dv/dt = I - v) / tau : volt        -> UNEXPECTED_CLOSE_PAREN at the ')'
dv/dt = I + : volt                 -> MISSING_OPERAND
dv/dt (I - v)/tau : volt           -> MISSING_EQUALS
dv/dt = (I - v)/tau                -> MISSING_UNIT (units are mandatory in this mini language)
dv/dt = I * + / tau : volt         -> MISSING_OPERAND / unexpected operator
dv/dt = (I - v)/tau : volts        -> UNKNOWN_UNIT
dv/dt = I @ v : volt               -> UNEXPECTED_CHARACTER
dv/dt = I + tau : volt             -> UNIT_MISMATCH (volt + second)
```
