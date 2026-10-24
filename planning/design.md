# Design: Automata Playground and Mini Parser

## 1. Architecture

```
Browser (React UI, Zustand store)
   | fetch JSON
   v
Next.js Route Handlers  /api/*      (thin: validate with zod, call engine, map errors)
   | plain function calls
   v
src/engine/**                       (pure TypeScript, no React/Next imports, fully unit-tested)
```

- UI never contains algorithm logic. It sends the canonical `Automaton` (or text input) to an endpoint and renders `{ result, trace }`.
- Route Handlers use the Node.js runtime, are stateless, and hold no secrets.
- The Zustand store holds the single source of truth for the automaton being edited. The canvas and the table are two projections of it (R1).

## 2. Stack and dependencies (the only allowed ones)

Install exact current stable versions (`pnpm view <pkg> version`), pinned, after reading each package's types.

| Purpose | Package |
|---|---|
| Framework | `next` (App Router), `react`, `react-dom`, `typescript` |
| Styling | `tailwindcss`, `next-themes` (light/dark) |
| State | `zustand` |
| Validation | `zod` |
| Canvas for automata | `@xyflow/react` (custom state nodes, custom edges incl. self-loops and merged labels) |
| Auto layout | `@dagrejs/dagre` |
| Regex parsing | `regexp-tree` (parse only; our adapter converts its AST to our own `RegexNode` and rejects unsupported nodes) |
| Parse-tree rendering | `d3-hierarchy` for layout plus our own SVG, or `react-d3-tree` if its types are sound (decide in the task, justify in the report) |
| Tests | `vitest`, `@vitest/coverage-v8`, `fast-check` |
| Lint/format | `eslint` (next config), `prettier` |
| Package manager | `pnpm` |

Everything else (simulation, closure, subset construction, minimization, Thompson, Arden, transducers, tokenizer DFA, parser, unit checker) is written by us in `src/engine`.

## 3. Folder structure

```
src/
  engine/
    automaton/   types.ts validate.ts normalize.ts equivalence.ts enumerate.ts
    simulate/    simulate.ts
    convert/     epsilonClosure.ts subsetConstruction.ts
    minimize/    minimize.ts
    regex/       parseRegex.ts (adapter) thompson.ts arden.ts simplify.ts print.ts
    numbers/     transducer.ts convert.ts validators.ts divisibility.ts
    language/    grammarParse.ts classifyGrammar.ts namedLanguages.ts pumping.ts
    lexer/       tokenDefs.ts buildLexer.ts lex.ts
    parser/      grammar.ts firstFollow.ts parse.ts derivation.ts ast.ts
    units/       dimension.ts unitTable.ts check.ts
    errors.ts    trace.ts
  app/
    api/<endpoint>/route.ts
    (pages)/simulate nfa-to-dfa minimize regex language pumping numbers parser
  components/    editor/ (CanvasEditor, TableEditor) trace/ (StepLog, Stepper) ...
  lib/           apiClient.ts store.ts schemas.ts
  examples/      *.json  (typed, validated by a test)
```

Tests live next to the code (`x.ts` and `x.test.ts`). Test-only reference implementations live in `src/engine/__reference__/` and are never imported by production code.

## 4. Core types (canonical)

```ts
type StateId = string;
type Symbol = string;               // single character, or 'ε'
const EPS = 'ε';

interface Transition { from: StateId; symbol: Symbol; to: StateId }

interface Automaton {
  kind: 'DFA' | 'NFA';              // NFA may contain ε transitions
  states: StateId[];                // unique, non-empty names
  alphabet: Symbol[];               // never contains ε
  start: StateId;
  accepting: StateId[];
  transitions: Transition[];        // sorted canonically by (from, symbol, to)
  layout?: Record<StateId, { x: number; y: number }>;   // UI only, ignored by engine
}

interface TraceStep<D = unknown> {
  index: number;
  title: string;                    // short, imperative or descriptive
  explanation: string;              // plain English for a student
  data: D;                          // typed per algorithm (discriminated union per feature)
  highlight?: { states?: StateId[]; transitions?: Transition[]; tableRows?: number[] };
}
interface Trace<D = unknown> { steps: TraceStep<D>[] }

type EngineError = {
  code: ErrorCode;                  // e.g. INVALID_AUTOMATON, LIMIT_EXCEEDED, UNSUPPORTED_REGEX_FEATURE,
                                    // UNEXPECTED_CHARACTER, UNCLOSED_PAREN, UNEXPECTED_CLOSE_PAREN, MISSING_OPERAND,
                                    // MISSING_EQUALS, MISSING_UNIT, UNKNOWN_UNIT, UNIT_MISMATCH,
                                    // UNDECLARED_IDENTIFIER, RESERVED_NAME, ...
  message: string;
  line?: number; column?: number; offset?: number; length?: number;   // 1-based line/column
  expected?: string[]; hint?: string; related?: { line: number; column: number; note: string };
};
type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };
```

Canonical normalization (`normalize.ts`): sort states naturally, sort alphabet, sort transitions, dedupe transitions. Every algorithm normalizes its input and its output so tests are stable. `validateAutomaton` returns precise errors (duplicate state, unknown state in a transition, symbol not in alphabet, start not in states, DFA with duplicate or missing transitions when `kind: 'DFA'` and completeness is required).

## 5. API contracts

All endpoints: `POST`, JSON in, JSON out, `Content-Type: application/json`, 100 KB max body, zod-validated. Success: `{ ok: true, result, trace }`. Failure: `{ ok: false, error: EngineError }` with status 400 (bad shape), 422 (valid shape, unsupported or limit exceeded), 500 (bug; never leak stack traces).

| Endpoint | Request | Result |
|---|---|---|
| `/api/simulate` | `{ automaton, inputs: string[] }` | per-input accept/reject plus trace per input |
| `/api/nfa-to-dfa` | `{ automaton }` | `{ dfa, table }` |
| `/api/minimize` | `{ automaton }` (DFA) | `{ minimal, partitions, mapping, alreadyMinimal }` |
| `/api/regex-to-nfa` | `{ regex }` | `{ nfa, ast }` |
| `/api/fa-to-regex` | `{ automaton }` | `{ regex, regexTextbook }` |
| `/api/identify-language` | `{ kind: 'regex'\|'automaton'\|'grammar'\|'named', ... }` | `{ class, certainty, reasons }` |
| `/api/pumping` | `{ mode: 'nonregular'\|'regular', ... }` | decompositions and verdicts |
| `/api/convert-number` | `{ from, to, value }` | `{ output, transducer }` |
| `/api/validate-number` | `{ base, value }` | `{ valid, regex, dfa }` |
| `/api/divisibility-dfa` | `{ n, tests?: string[] }` | `{ dfa, results }` |
| `/api/tokenize` | `{ source }` | `{ tokens }` or error list |
| `/api/parse` | `{ source }` | `{ lines: [{ ast, tree, derivation, annotations, errors }], units }` |

## 6. Algorithm specifications

Each must have the header comment from `engineering-rules.md` section 4.

### 6.1 Simulation (`simulate.ts`)
- Normalize and validate. Start configuration = epsilon-closure of start (for DFA, just start).
- For each input symbol: if symbol not in alphabet, error `SYMBOL_NOT_IN_ALPHABET` (position of the symbol). DFA: follow the transition, or become `stuck` if none. NFA: next = epsilon-closure of the union of moves on the symbol over all current states.
- Accept iff after the last symbol the current set contains an accepting state (DFA: not stuck and current state accepting).
- Trace step data: `{ symbolIndex, symbol, from: StateId[], to: StateId[], transitionsUsed: Transition[], stuck?: boolean }`, plus an initial step "Start".

### 6.2 Epsilon-closure and subset construction
- `epsilonClosure(set)`: iterative DFS/BFS over ε transitions, handles cycles (visited set), returns a sorted array.
- Subset construction (Sipser style): start subset = closure({start}). Worklist in discovery order, symbols in sorted alphabet order. For each subset S and symbol a: `T = closure(move(S, a))`. If T is empty, record it as the dead subset `∅`. If T is unseen, add to worklist and mark `isNew`. Accepting iff S intersects accepting.
- Trace: one step for the initial closure, then one step **per (subset, symbol)** pair with `{ subset, symbol, moveResult, closureResult, target, isNew }`, plus a final step with the finished DFA.
- Limit: more than 1024 subsets generated gives `LIMIT_EXCEEDED`.
- Output DFA state names: `{q0,q1}`; `∅` shown as `∅`. The DFA returned is **complete over the alphabet** only when `∅` is reachable (then it includes the `∅` state with self-loops).

### 6.3 Minimization (partition refinement, Moore style)
1. Validate DFA. If transitions are missing, **complete** by adding `dead` (name collision safe, e.g. `∅` or `dead`, then `dead_1`) with self-loops. Trace step lists added transitions.
2. Remove unreachable states (BFS from start). Trace step lists removed states.
3. π0 = [F, Q\F] (omit empty). Block order: block containing the lexicographically smallest state first (deterministic).
4. Repeat: for each block, split states by **signature** = tuple over sorted alphabet of the index of the block (in the current partition) of δ(q, a). Keep stable block order. Trace step per iteration with `{ iteration, partition, splits: [{ block, into, witness: { p, q, symbol, pBlock, qBlock } }] }`.
5. Stop when the new partition equals the previous (same blocks as sets). Then build the quotient DFA: state per block, name = the block's states joined (`{A,B}`) or `[A,B]`, with rename toggle; start = block of start; accepting = blocks of F; δ per block from any representative.
6. `alreadyMinimal` = number of blocks equals number of reachable states after completion.
7. Result is a **complete** minimal DFA; UI can hide the dead state in the drawing.

### 6.4 Regex parsing adapter and Thompson
- Parse with `regexp-tree` (`parse` with the `/.../` form). Convert only these node types into our `RegexNode` union: `Char` (simple literal; escaped metacharacters allowed), `Alternative` (concatenation), `Disjunction` (union), `Repetition` with quantifier `*`, `+`, `?` only, `Group` (capturing or not, treated as grouping), `CharacterClass` containing only literal chars and ranges (expand to union; negated classes rejected), and the empty group `()` as ε. Anything else: `UNSUPPORTED_REGEX_FEATURE` with node type and position (use the library's location data if available; otherwise report the feature without position and say so).
- Derive the alphabet from the literals used (sorted).
- Thompson construction, node by node, always with fresh states `q0, q1, ...` in creation order. Each fragment has one start and one accept state. Trace step per node: `{ node, fragment: Automaton, description }`.
- `+` as `r r*`; `?` as `(r | ε)`. Output kind `NFA` with ε transitions. At most 2 states per symbol/operator, so at most ~400 states; apply the limit rule from R17.1 to the **input regex length**, and let the NFA be larger than 30 states (the 30-state input limit applies to user-edited automata, not to machine-generated ones; the UI warns when drawing more than 60 states and falls back to table view).
- Printer: canonical (`|`) and textbook (`+`) forms with minimal parentheses.

### 6.5 Arden elimination (`arden.ts`)
- Variables X_q for each state. Equation: `X_q = (Σ over transitions q -a-> p of a·X_p) | (ε if q accepting)`; ε-symbol transitions contribute the symbol `ε`.
- Solve by elimination in the state order of the input (deterministic): pick a variable, write its equation as `X = A·X | B` where A collects self-references; apply Arden `X = A*·B`; substitute into all other equations; simplify with the identities in R6.2, logging each identity applied. Finish when only the start variable remains; its right side (no variables) is the regex.
- **Convention (fixed, document it in the `arden.ts` header):** each state's equation is right-linear, `X_q = a1·X_p1 | a2·X_p2 | ... | (ε if accepting)`, meaning "read the symbol, then continue from the next state". Group a variable's equation as `X = A·X | B` (A = everything that loops back to X itself, B = the rest). Arden's rule then gives `X = A*·B`. Note in the header that when ε is in the language of A the equation has many solutions and `A*·B` is the least one, which is the one we want. Verify the whole construction with the round-trip oracle tests, not by trusting the algebra.
- Remove unreachable states first (they can contribute nothing).

### 6.6 Number-system transducers
- `Transducer` type: states, input alphabet, `transitions: { from, input, to, output: string }[]`, `finalOutput: Record<StateId, string>` (output emitted at end of input from that state), start state.
- Binary to octal/hex, **LSB first**: state = bits read so far in the current group (store as a string like `''`, `'1'`, `'01'`, ordered with the newest bit on the left, i.e. the value-so-far). With group size g, there are 2^g - 1 + ... states: `1 + 2 + 4 (+ 8)` = 7 for octal, 15 for hex. When the g-th bit arrives, emit the digit (value of the g bits) and go to the empty state. At end of input, if the state is non-empty, emit the digit of the partial group (missing high bits are zero). Output string is in LSB-first order; the converter reverses it, then strips leading zeros (keeping a single `0` for zero), with a "keep leading zeros" option.
- Octal/hex to binary: one state, emits the 3 or 4 bit pattern per digit (digit order as read, MSB first is fine here since each digit maps independently).
- Octal to hex and hex to octal: compose via binary.
- Validators: build the regexes `^(0b)?[01]+$`-style (in our own regex dialect, without anchors) and run them through R5, R3, R4 to produce minimized DFAs: binary `[01]+`, octal `[0-7]+`, hex `[0-9a-fA-F]+`, with prefixed variants `0b[01]+`, `0o[0-7]+`, `0x[0-9a-fA-F]+`.
- Divisibility DFA: states `r0..r(n-1)`, start `r0`, accept `r0`, `δ(r,b) = (2r+b) mod n`; the empty string is accepted (value 0). Reading MSB first.

### 6.7 Grammar text format, classification, named languages
- Grammar text: one production per line, `A -> alpha | beta`, symbols separated by spaces or written as single characters (decide: uppercase letters are nonterminals, everything else terminals, `ε` or `eps` is epsilon). First production's left side is the start symbol. Reject malformed lines with line/column errors.
- Classification by **form**, checked from most to least restrictive: Type 3 if every production is right-linear (`A -> a B | a | ε`) or every one is left-linear (`A -> B a | a | ε`), not mixed; Type 2 if every left side is a single nonterminal; Type 1 if `|left| <= |right|` for all productions (exception: `S -> ε` allowed if S never appears on a right side); else Type 0. Output states it is the grammar's type and an upper bound for the language.
- Named languages: array of `{ id, display, latex-free text, class, proofSketch, membership(s): boolean, witness(p): string, machine?: Automaton, machineText?: string }`. `membership` implemented directly (no regex), covering the languages listed in R7.3.

### 6.8 Pumping lemma engine
- Non-regular mode: input language id and p. `s = witness(p)` must satisfy `membership(s)` and `|s| >= p` (assert). Enumerate all `(x, y, z)` with `|xy| <= p`, `|y| >= 1`. For each, find the smallest `i` in `[0, 5]` with `!membership(x y^i z)`. If **every** decomposition has such an i, verdict = "no decomposition pumps (for this p)". If any has none, report the decomposition (this would indicate a wrong witness or a regular language; surface it, do not hide it).
- Regular mode: input DFA, string w with `|w| >= p` where `p = |states|` (after removing unreachable). Run the DFA, find the first repeated state among the first p+1 visited states, produce x, y, z, check `xy^i z` accepted iff `w` accepted for i in 0..5.

### 6.9 Lexer (built with our own pipeline)
- `tokenDefs.ts`: ordered list `{ type, regex }` in our regex dialect: `NUMBER` (`[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?` written in the supported subset, with `.`, `+`, `-` escaped as the adapter requires), `BIN` (`0[bB][01]+`), `OCT` (`0[oO][0-7]+`), `HEX` (`0[xX][0-9a-fA-F]+`), `IDENT` (`[a-zA-Z_][a-zA-Z0-9_]*`), `DIFF` (`d[a-zA-Z_][a-zA-Z0-9_]*/dt`), operators, punctuation, `COMMENT` (`#[^\n]*` expressed with an explicit allowed set, since negated classes are unsupported in our dialect: use a character class listing the allowed printable characters), `NEWLINE`, `WS` (skipped).
- Build: each token regex goes to NFA (Thompson), they are combined with a fresh start and ε transitions, each token's accepting state tagged with its type and priority, converted by subset construction to one DFA (a DFA state accepting several tokens takes the highest-priority one; priority = order in the list, with `BIN/OCT/HEX` before `NUMBER` and `DIFF` before `IDENT`). Minimization is optional and must not merge states with different token tags.
- `lex`: maximal munch. From the current offset run the DFA, remember the last accepting position and tag, stop when stuck; emit that token. If none, `UNEXPECTED_CHARACTER`. Track line/column (1-based). After a `DIFF` match, if the next character is an identifier character, discard the DIFF and re-lex using `IDENT` only for that start position (document this fallback; test `dx/dtau`).
- Number lexing detail: `0x1G` lexes as HEX `0x1` then IDENT `G`; the parser then reports a clear error (two operands in a row).

## 7. Mini-language grammar (Part Two)

Original CFG (shown to the user):

```
Program    -> Line | Program NEWLINE Line
Line       -> ε | Statement | Statement COMMENT | COMMENT
Statement  -> Equation | ParamDecl
Equation   -> Lhs '=' Expr ':' UnitExpr Flags
ParamDecl  -> IDENT ':' UnitExpr Flags
Lhs        -> DIFF | IDENT
Flags      -> ε | '(' FlagList ')'
FlagList   -> Flag | FlagList ',' Flag
Flag       -> IDENT | Flag '-' IDENT
Expr       -> Expr '+' Term | Expr '-' Term | Term
Term       -> Term '*' Factor | Term '/' Factor | Factor
Factor     -> '+' Factor | '-' Factor | Power
Power      -> Atom | Atom '^' Factor | Atom '**' Factor
Atom       -> NUMBER | BIN | OCT | HEX | IDENT | IDENT '(' ArgList ')' | '(' Expr ')'
ArgList    -> ε | Expr | ArgList ',' Expr
UnitExpr   -> UnitExpr '*' UnitTerm | UnitExpr '/' UnitTerm | UnitTerm
UnitTerm   -> UnitAtom | UnitAtom '^' SignedInt | UnitAtom '**' SignedInt
UnitAtom   -> IDENT | NUMBER(1) | '(' UnitExpr ')'
SignedInt  -> NUMBER | '-' NUMBER
```

Parser form (LL(1), recursive descent, hand-written for precise errors): replace left recursion by loops (`Expr -> Term (('+'|'-') Term)*`, same for Term and UnitExpr). Compute and display FIRST/FOLLOW for the parser nonterminals (`firstFollow.ts` computes them from a data representation of the grammar and is tested against hand-derived sets for the expression sub-grammar). The recursive-descent functions use these sets to build the `expected` list in errors.

Details:
- `Power -> Atom ('^'|'**') Factor` makes `^` right associative and lets `2^-1` parse; unary minus on the left (`-2^2`) applies to `2^2` because `Factor -> '-' Factor -> '-' Power`.
- Newlines separate lines. Each line is lexed and parsed independently (R11.3). A comment-only line or blank line produces no AST node.
- Annotation rule (R12.4): trailing comment attaches to that line's statement; full-line comments directly above a statement attach to the next statement; otherwise they are kept as free annotations.
- Leftmost derivation: produced from the **parse tree** (expand the leftmost nonterminal each step), using the original grammar's productions where they differ from the LL form; show the production used at each step.

## 8. Unit system (`units/`)

- `Dimension = [L, M, T, I, Θ, N, J]` integers. Helpers: `mul`, `div`, `pow(dim, intExponent)`, `equal`, `isDimensionless`, `format(dim)` (base-unit product string such as `m^2 kg s^-3 A^-1`) and `nameOf(dim)` (reverse lookup among the named units, preferring common names: volt, ampere, second, hertz, ohm, siemens, farad, coulomb, joule, watt, newton, pascal).
- `unitTable.ts`: explicit table name to dimension, including prefixed forms built from a fixed prefix list over a fixed base list (no guessing from regex), so `ms` is millisecond-style time and `mV` is volt-style.
- Checker (two passes): pass 1 collects declarations (`name : unit`, `name = expr : unit`, `dname/dt = expr : unit`), reporting `RESERVED_NAME` for unit names used as variables and duplicate declarations. Pass 2 type-checks each right-hand side recursively returning a `Dimension`:
  - NUMBER/BIN/OCT/HEX: dimensionless. IDENT: unit constant or declared variable, else `UNDECLARED_IDENTIFIER`.
  - `a + b`, `a - b`: dimensions must be equal else `UNIT_MISMATCH` (message names both, with position of the operator).
  - `a * b`, `a / b`: combine. `a ^ n`: exponent must be an integer literal expression (after folding unary minus); if the base is dimensionless any exponent expression that is dimensionless is allowed, but numeric evaluation is out of scope, so for a dimensional base a non-integer-literal exponent is `UNIT_MISMATCH` with a clear message.
  - Functions: `exp, log, sin, cos, tan, tanh` need a dimensionless argument and return dimensionless; `abs` preserves. Unknown functions are `UNKNOWN_FUNCTION`; wrong arity is `WRONG_ARITY`.
  - Declared check: for `dname/dt`, expected = dim(name) / T; for plain equations, expected = dim(name). Mismatch gives `UNIT_MISMATCH` with expected and actual in base form and by name when available.
- A scale-only difference (mV versus V) is not an error.

## 9. UI design

- Pages: `/` (overview with cards for each feature), `/simulate`, `/nfa-to-dfa`, `/minimize`, `/regex` (regex to automaton and Arden on one page with tabs), `/language`, `/pumping`, `/numbers`, `/parser`.
- Shared layout: header with theme toggle and nav; two-pane feature layout: left = input/editor, right = result; below = Step log.
- `AutomatonEditor` = `CanvasEditor` + `TableEditor` bound to the Zustand store. Canvas via `@xyflow/react`: custom node (circle; double ring if accepting; small incoming arrow marker if start), custom edge (curved when opposite edge exists, loop for self edges, label merged). Table editor: rows = states, columns = alphabet (+ ε for NFA), cell = comma-separated targets (DFA: single target), checkboxes for start/accepting, add/remove state and symbol controls. Both call the same store actions; no direct cross-component state.
- `StepLog`: `<details>`-style disclosure (default collapsed, with a visible "Show steps (N)" summary), inside: step title and explanation, prev/next/play/jump, and a feature-specific `StepView` (subset table, partition list, fragment diagram, equation list, transducer table) selected by a discriminated union on `trace.steps[i].data.kind`.
- Simulation page: input string, run, canvas highlights current states and last transition; scrubbing the step slider moves the highlight.
- Parser page: source textarea, tabs for Tokens, Parse tree, Derivation, Units, Annotations; errors shown inline with caret and a list below; each line's status chip.
- Visual style: neutral palette, one accent color, system font stack, generous spacing, light/dark with sufficient contrast, focus rings; accepting/start states are distinguished by shape (double ring, arrow), never by color alone.
- Examples: `ExamplePicker` dropdown per page loading JSON from `src/examples`.

## 10. Testing strategy (summary)

- Unit tests per module; oracle and property tests per conversion; fixtures for every example in `src/examples` asserted by a single test that loads them all and runs the corresponding engine function.
- API contract tests: call each route handler function directly with `Request` objects (no network) for success, 400, 422 paths.
- Coverage threshold 90% lines on `src/engine/**`, failing the build below.
- A scripted smoke test of the production build (`next build`) in the final task.

## 11. Limits and error mapping

Limits in R17.1 are enforced in zod schemas (shape and size) and in engine entry points (`LIMIT_EXCEEDED`). Error code to HTTP: shape errors 400; `LIMIT_EXCEEDED`, `UNSUPPORTED_REGEX_FEATURE`, `INVALID_AUTOMATON`, and all language errors 422 (they are valid requests we cannot satisfy); unexpected exceptions 500 with a generic message.
