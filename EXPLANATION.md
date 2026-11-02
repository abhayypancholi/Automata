# Automata Theory Playground - Complete Walkthrough

## Overview

This is a full-stack web application for learning automata theory. It provides interactive tools for working with finite automata, regular expressions, formal languages, and a mini parser for model descriptions. Every algorithm shows step-by-step explanations.

## How to Use

### Getting Started

1. **Install and run:**
```bash
pnpm install
pnpm dev
```
Open http://localhost:3000

2. **Navigate the features:**
   - Home page shows feature cards - click any to explore
   - Each page has its own focused tool
   - Use the top navigation bar to switch between tools

### Key Pages and How to Use Them

#### 1. Simulate Page (`/simulate`)
**What it does:** Tests if strings are accepted by your DFA/NFA

**How to use:**
1. Build an automaton using the canvas or table editor:
   - **Canvas:** Click to add states, drag to connect with transitions, right-click for options
   - **Table:** Use the grid to define transitions, checkboxes for start/accepting
2. Enter one or more test strings (one per line)
3. Click "Simulate"
4. See accept/reject results with step-by-step trace

**Tips:**
- Both canvas and table stay synchronized - edit in either
- Click "Show steps" to see detailed execution trace
- Use prev/next buttons to step through the simulation
- For NFA: type `ε`, `eps`, or `epsilon` for epsilon transitions

#### 2. NFA to DFA Page (`/nfa-to-dfa`)
**What it does:** Converts NFAs to equivalent DFAs using subset construction

**How to use:**
1. Build an NFA (can include ε-transitions)
2. Click "Convert to DFA"
3. Watch the algorithm build the DFA one subset at a time
4. See the growing table showing each subset processed

**What you'll see:**
- Each step shows: current subset being processed, symbols tried, epsilon closures computed
- New subsets discovered are marked
- Final DFA with states named like `{q0,q1}`

#### 3. Minimize Page (`/minimize`)
**What it does:** Minimizes a DFA using partition refinement

**How to use:**
1. Build or import a DFA
2. Click "Minimize"
3. Watch partitions refine iteration by iteration

**What you'll see:**
- π0, π1, π2... partitions shown
- For each split, see which states split and why (witness symbol)
- Final minimized DFA with state mapping

#### 4. Regex Page (`/regex`)
**What it does:** Converts between regular expressions and automata

**Two tabs:**

**Thompson Construction (Regex → NFA):**
1. Enter a regular expression: e.g., `(a|b)*abb`
2. Click "Convert to NFA"
3. See the NFA built piece by piece
4. Continue to DFA and Minimize if desired

**Supported patterns:**
- Literals: `a`, `b`, `0`, `1`
- Union: `a|b`
- Concatenation: `ab`
- Kleene star: `a*`
- Plus: `a+` (one or more)
- Optional: `a?`
- Groups: `(ab)*`
- Character classes: `[01]`, `[abc]`
- Empty: `()` (epsilon)

**Arden's Method (Automaton → Regex):**
1. Build an automaton
2. Switch to "Arden" tab
3. Click "Convert to Regex"
4. See state equations solved step by step

**What you'll see:**
- Equations: `q0 = a·q1 | b·q2 | ε`
- Arden's rule applications: `X = A·X | B` becomes `X = A*·B`
- Simplifications with identities (ε* = ε, ∅·r = ∅, etc.)

#### 5. Language Page (`/language`)
**What it does:** Identifies language class (Chomsky hierarchy)

**Three input modes:**

**Automaton mode:**
- Build DFA/NFA → answers "Regular (Type 3)"

**Grammar mode:**
- Enter grammar rules (one per line):
```
S -> aSb | ε
```
- Get classification: Type 0, 1, 2, or 3
- System explains it's an upper bound (grammar form, not language class)

**Named language mode:**
- Select from library (aⁿbⁿ, aⁿbⁿcⁿ, wwᴿ, palindromes, etc.)
- See class, proof sketch, and machine (if exists)

#### 6. Pumping Page (`/pumping`)
**What it does:** Demonstrates the pumping lemma

**Two modes:**

**Non-regular mode:**
1. Select a named language (e.g., aⁿbⁿ)
2. Choose pumping length p (2-8)
3. Click "Generate"
4. See ALL possible decompositions xyz with |xy| ≤ p, |y| ≥ 1
5. For each, see the smallest i where xyⁱz fails

**Regular mode:**
1. Build a DFA
2. Enter a test string (length ≥ number of states)
3. See the repeated state, decomposition, and proof that pumping works

#### 7. Numbers Page (`/numbers`)
**What it does:** Base conversions using finite-state transducers

**How to use:**
1. Select conversion (binary → octal or binary → hex)
2. Enter binary string
3. Click "Convert"
4. See transducer states, output, and reversed result

**Important:** Reads right-to-left (LSB first) because groups align from the right!

#### 8. Parser Page (`/parser`)
**What it does:** Parses model description programs with dimensional analysis

**How to use:**
1. Enter program in the text area:
```
# Example
dv/dt = (I - v)/tau : volt
tau : second (constant)
I : volt
```
2. Click "Parse"
3. Switch tabs to see:
   - **Tokens:** Lexical analysis output
   - **Parse Tree:** Syntax tree visualization
   - **Derivation:** Leftmost derivation steps
   - **Units:** Dimensional analysis results

**Supported syntax:**
- Declarations: `name : unit`
- Equations: `name = expr : unit`
- Derivatives: `dv/dt = expr : unit`
- Operators: `+`, `-`, `*`, `/`, `^`, `**`
- Functions: `exp`, `log`, `sin`, `cos`, `tan`, `abs`
- Comments: `# text`

**What it checks:**
- Unit consistency (can't add volts + seconds)
- Dimension propagation through operators
- Forward references (can reference variables declared later)

### Examples Library

Every page has example files you can load:
- Click the "Load Example" dropdown
- Select an example
- It loads into the editor automatically

Examples include:
- Class examples from your course notes
- Textbook patterns
- Edge cases (empty strings, epsilon transitions, etc.)
- Error demonstrations

### Common Workflows

**Workflow 1: Design and Test a DFA**
1. Go to `/simulate`
2. Use canvas to draw states and transitions
3. Mark start (green arrow) and accepting (double circle) states
4. Enter test strings
5. Simulate and verify behavior

**Workflow 2: Understand Subset Construction**
1. Design an NFA on `/nfa-to-dfa`
2. Convert to DFA
3. Watch each subset discovered
4. See which NFA states combine into which DFA states

**Workflow 3: Regex ↔ Automaton Round Trip**
1. Start with regex on `/regex`
2. Thompson → NFA
3. Continue to DFA
4. Continue to Minimize
5. Switch to Arden tab → back to regex
6. Compare with original (may differ but language equivalent)

**Workflow 4: Prove Non-Regularity**
1. Go to `/pumping`
2. Select non-regular mode
3. Choose aⁿbⁿ, pick p=3
4. See all decompositions fail
5. Understand why pumping lemma proves non-regularity

**Workflow 5: Parse and Check Units**
1. Write model description on `/parser`
2. Parse to see syntax tree
3. Check Units tab
4. Fix any dimensional mismatches

## Architecture Deep Dive

### High-Level Structure

```
Browser (React)
    ↓ (fetch JSON)
Next.js API Routes (/api/*)
    ↓ (function calls)
Pure TypeScript Engine (src/engine)
```

**Key principle:** UI never implements algorithm logic. All algorithms live in the engine.

### Directory Structure

```
src/
├── engine/              # All algorithms (pure TypeScript)
│   ├── automaton/       # Core types, validation, equivalence
│   ├── simulate/        # DFA/NFA simulation
│   ├── convert/         # Epsilon-closure, subset construction
│   ├── minimize/        # Partition refinement
│   ├── regex/           # Parsing, Thompson, Arden, simplification
│   ├── numbers/         # Transducers, base conversion
│   ├── language/        # Grammar classification, pumping lemma
│   ├── lexer/           # Tokenizer (built from regex→NFA→DFA)
│   ├── parser/          # Recursive descent parser
│   └── units/           # Dimensional analysis
├── app/
│   ├── api/             # Route handlers (thin validation layer)
│   │   ├── simulate/
│   │   ├── parse/
│   │   └── check-units/
│   └── (pages)/         # Feature pages (UI only)
├── components/
│   ├── editor/          # Canvas & table editors
│   │   ├── AutomatonEditor.tsx
│   │   ├── CanvasEditor.tsx  (ReactFlow)
│   │   └── TableEditor.tsx
│   └── trace/           # Step visualization
│       ├── StepLog.tsx
│       ├── Stepper.tsx
│       └── StepView*.tsx
├── lib/
│   ├── store.ts         # Zustand store (automaton state)
│   ├── apiClient.ts     # Typed fetch wrappers
│   └── schemas.ts       # Zod validation schemas
└── examples/            # JSON example files
```

### Core Concepts

#### 1. Canonical Automaton Format

Everything uses one standard representation:

```typescript
interface Automaton {
  kind: 'DFA' | 'NFA';
  states: string[];           // e.g., ['q0', 'q1', 'q2']
  alphabet: string[];         // e.g., ['0', '1']
  start: string;              // e.g., 'q0'
  accepting: string[];        // e.g., ['q2']
  transitions: Transition[];  // sorted for determinism
}

interface Transition {
  from: string;    // e.g., 'q0'
  symbol: string;  // e.g., '0' or 'ε'
  to: string;      // e.g., 'q1'
}
```

**Why this matters:**
- Every algorithm accepts and returns this format
- Validation is centralized
- Conversions are pipeable (NFA → DFA → Minimize)
- Testing is consistent

#### 2. Result Pattern

All engine functions return:

```typescript
type Result<T> = 
  | { ok: true; value: T }
  | { ok: false; error: EngineError };
```

**Never throws for user mistakes.** Errors are data.

```typescript
// Good ✓
const result = simulate(automaton, input);
if (!result.ok) {
  console.log(result.error.message);
  return;
}
console.log(result.value.accepted);

// Bad ✗
try {
  const result = simulate(automaton, input);
} catch (e) {
  // Won't catch user errors (only programmer errors)
}
```

#### 3. Trace Pattern

Every algorithm returns `{ result, trace }`:

```typescript
interface TraceStep<D> {
  index: number;
  title: string;           // e.g., "Processing subset {q0,q1}"
  explanation: string;     // Plain English for students
  data: D;                 // Typed data for visualization
  highlight?: {            // What to highlight in UI
    states?: string[];
    transitions?: Transition[];
  };
}

interface Trace<D> {
  steps: TraceStep<D>[];
}
```

**Example from subset construction:**

```typescript
{
  index: 3,
  title: "Processing subset {q0,q1}",
  explanation: "Moving on symbol 'a': from {q0,q1}, we reach {q1,q2}",
  data: {
    subset: ['q0', 'q1'],
    symbol: 'a',
    moveResult: ['q1', 'q2'],
    closureResult: ['q1', 'q2'],
    isNew: true
  },
  highlight: {
    states: ['q0', 'q1']
  }
}
```

UI uses this to:
- Show explanations in plain English
- Render step-specific visualizations
- Highlight relevant parts of the canvas
- Provide prev/next navigation

#### 4. Pure Functions

All engine code is **pure**:
- No `Math.random()` → deterministic
- No `Date.now()` → deterministic  
- No mutation of inputs → safe
- No side effects → testable

```typescript
// Pure function example
export function normalize(automaton: Automaton): Automaton {
  // Don't modify input
  return {
    ...automaton,
    states: [...automaton.states].sort(),
    alphabet: [...automaton.alphabet].sort(),
    transitions: sortTransitions(automaton.transitions)
  };
}
```

### Key Algorithms Explained

#### Simulation (`src/engine/simulate/`)

**How it works:**

```typescript
function simulate(automaton: Automaton, input: string) {
  // 1. Start configuration
  let current = epsilonClosure([automaton.start]);
  const trace = [];
  
  // 2. For each symbol
  for (const symbol of input) {
    // Get all states reachable on this symbol
    const next = move(current, symbol);
    // Apply epsilon closure
    current = epsilonClosure(next);
    
    // Record step
    trace.push({
      title: `Read '${symbol}'`,
      explanation: `From ${format(current)}, reading '${symbol}', reach ${format(next)}`,
      data: { /* ... */ }
    });
  }
  
  // 3. Accept if any current state is accepting
  const accepted = current.some(s => automaton.accepting.includes(s));
  
  return { accepted, trace };
}
```

**Key functions:**
- `epsilonClosure(states)`: Follow all ε-transitions from a set of states
- `move(states, symbol)`: Follow all transitions on a symbol
- Both use DFS/BFS to handle cycles

**DFA vs NFA:**
- DFA: `current` is always a single-element set, moves are deterministic
- NFA: `current` can have multiple states, tracks all possibilities

#### Subset Construction (`src/engine/convert/`)

**How it works:**

```typescript
function subsetConstruction(nfa: Automaton) {
  const dfa = { states: [], transitions: [], /* ... */ };
  
  // Start with epsilon-closure of start state
  const startSubset = epsilonClosure([nfa.start]);
  const worklist = [startSubset];
  const processed = new Set();
  
  while (worklist.length > 0) {
    const subset = worklist.shift();
    const subsetName = `{${subset.join(',')}}`;
    
    // For each symbol in alphabet
    for (const symbol of nfa.alphabet) {
      // Move from all states in subset on this symbol
      const moved = subset.flatMap(s => move([s], symbol));
      // Apply epsilon closure
      const target = epsilonClosure(moved);
      const targetName = `{${target.join(',')}}`;
      
      // Record transition
      dfa.transitions.push({
        from: subsetName,
        symbol,
        to: targetName
      });
      
      // If target is new, add to worklist
      if (!processed.has(targetName)) {
        worklist.push(target);
        processed.add(targetName);
      }
    }
  }
  
  return dfa;
}
```

**Why it works:**
- Each DFA state represents a SET of NFA states
- Worklist ensures we explore all reachable subsets
- Epsilon-closure ensures we don't miss ε-transition destinations

**Limit protection:**
```typescript
if (processed.size > 1024) {
  return { ok: false, error: { code: 'LIMIT_EXCEEDED' } };
}
```

#### Minimization (`src/engine/minimize/`)

**How it works (partition refinement):**

```typescript
function minimize(dfa: Automaton) {
  // 1. Complete the DFA (add dead state if needed)
  const complete = completeDFA(dfa);
  
  // 2. Remove unreachable states
  const reachable = removeUnreachable(complete);
  
  // 3. Initial partition: accepting vs non-accepting
  let partition = [
    reachable.states.filter(s => reachable.accepting.includes(s)),
    reachable.states.filter(s => !reachable.accepting.includes(s))
  ].filter(block => block.length > 0);
  
  // 4. Refine until stable
  while (true) {
    const newPartition = [];
    
    for (const block of partition) {
      // Compute signature for each state
      const signatures = block.map(state => 
        alphabet.map(symbol => {
          const target = delta(state, symbol);
          return findBlockIndex(target, partition);
        })
      );
      
      // Group states by signature
      const groups = groupBy(block, signatures);
      newPartition.push(...groups);
    }
    
    // Stop if partition didn't change
    if (same(partition, newPartition)) break;
    partition = newPartition;
  }
  
  // 5. Build minimized DFA (one state per block)
  return buildQuotient(reachable, partition);
}
```

**Key insight:** Two states are equivalent if:
1. Both accepting or both non-accepting
2. For every symbol, they go to equivalent states

We find this by iterative refinement.

#### Thompson Construction (`src/engine/regex/`)

**How it works:** Build NFA fragment for each regex node

```typescript
function thompson(ast: RegexNode): Automaton {
  switch (ast.type) {
    case 'literal':
      // q0 --a--> q1
      return {
        states: ['q0', 'q1'],
        start: 'q0',
        accepting: ['q1'],
        transitions: [{ from: 'q0', symbol: ast.value, to: 'q1' }]
      };
      
    case 'concat':
      // Build left and right, connect left's accepting to right's start with ε
      const left = thompson(ast.left);
      const right = thompson(ast.right);
      return {
        states: [...left.states, ...right.states],
        start: left.start,
        accepting: right.accepting,
        transitions: [
          ...left.transitions,
          ...right.transitions,
          { from: left.accepting[0], symbol: 'ε', to: right.start }
        ]
      };
      
    case 'union':
      // New start with ε to both, both accepting go to new accepting
      const L = thompson(ast.left);
      const R = thompson(ast.right);
      return {
        states: ['qstart', ...L.states, ...R.states, 'qaccept'],
        start: 'qstart',
        accepting: ['qaccept'],
        transitions: [
          { from: 'qstart', symbol: 'ε', to: L.start },
          { from: 'qstart', symbol: 'ε', to: R.start },
          { from: L.accepting[0], symbol: 'ε', to: 'qaccept' },
          { from: R.accepting[0], symbol: 'ε', to: 'qaccept' }
        ]
      };
      
    case 'star':
      // New start, ε to inner start, inner accept ε back to inner start,
      // ε from start to new accept, ε from inner accept to new accept
      const inner = thompson(ast.inner);
      return { /* ... similar pattern */ };
  }
}
```

**Why each fragment has exactly 1 start and 1 accepting:**
- Makes composition simple
- Union/concat just wire up ε-transitions
- No need to track multiple accepting states

#### Arden's Theorem (`src/engine/regex/`)

**How it works:** Solve system of state equations

```typescript
function arden(automaton: Automaton) {
  // 1. Write equations
  // For each state q: X_q = Σ(a·X_p for each q--a-->p) | (ε if q accepting)
  
  const equations = automaton.states.map(q => {
    const terms = automaton.transitions
      .filter(t => t.from === q)
      .map(t => `${t.symbol}·X_${t.to}`);
    
    if (automaton.accepting.includes(q)) {
      terms.push('ε');
    }
    
    return `X_${q} = ${terms.join(' | ')}`;
  });
  
  // 2. Eliminate variables one by one
  let remaining = [...automaton.states];
  
  while (remaining.length > 1) {
    const toEliminate = remaining.pop();
    
    // Extract self-reference: X = A·X | B
    const selfLoop = findSelfLoop(toEliminate);
    const rest = findRest(toEliminate);
    
    // Apply Arden: X = A*·B
    const solution = `${selfLoop}*·${rest}`;
    
    // Substitute into all other equations
    for (const other of remaining) {
      equations[other] = substitute(equations[other], toEliminate, solution);
      equations[other] = simplify(equations[other]);
    }
  }
  
  // 3. Start state's equation is the answer
  return equations[automaton.start];
}
```

**Simplification identities:**
- `∅·r = ∅` (empty absorbs in concat)
- `ε·r = r` (epsilon is identity)
- `∅|r = r` (empty is identity for union)
- `r|r = r` (idempotence)
- `ε* = ε`, `∅* = ε` (special cases)

#### Lexer (`src/engine/lexer/`)

**How it's built:** Uses Part 1 algorithms!

```typescript
function buildLexer() {
  const tokenDefs = [
    { type: 'NUMBER', regex: '[0-9]+' },
    { type: 'IDENT', regex: '[a-z]+' },
    { type: 'PLUS', regex: '\\+' },
    // ...
  ];
  
  // 1. Convert each regex to NFA
  const nfas = tokenDefs.map(def => ({
    ...thompson(parseRegex(def.regex)),
    tag: def.type,      // Tag accepting states
    priority: def.priority
  }));
  
  // 2. Combine NFAs with new start
  const combined = {
    states: ['start', ...nfas.flatMap(n => n.states)],
    start: 'start',
    transitions: [
      // ε from start to each NFA's start
      ...nfas.map(n => ({ from: 'start', symbol: 'ε', to: n.start })),
      // All NFA transitions
      ...nfas.flatMap(n => n.transitions)
    ],
    // Accepting states keep their tags
    accepting: nfas.flatMap(n => n.accepting)
  };
  
  // 3. Convert to DFA
  const dfa = subsetConstruction(combined);
  
  // 4. When DFA state is accepting, check which token tags it contains
  //    Choose highest priority
  
  return dfa;
}
```

**Maximal munch:** Keep reading while DFA accepts, remember last accepting position

```typescript
function lex(source: string, lexerDFA: Automaton) {
  const tokens = [];
  let pos = 0;
  
  while (pos < source.length) {
    let state = lexerDFA.start;
    let lastAccept = null;
    let lastAcceptPos = pos;
    let current = pos;
    
    // Run DFA as far as possible
    while (current < source.length) {
      const symbol = source[current];
      const next = delta(state, symbol);
      
      if (!next) break;  // Stuck
      
      state = next;
      current++;
      
      if (isAccepting(state)) {
        lastAccept = getTag(state);
        lastAcceptPos = current;
      }
    }
    
    if (lastAccept) {
      tokens.push({
        type: lastAccept,
        text: source.slice(pos, lastAcceptPos),
        offset: pos
      });
      pos = lastAcceptPos;
    } else {
      return { error: 'UNEXPECTED_CHARACTER', offset: pos };
    }
  }
  
  return { tokens };
}
```

#### Parser (`src/engine/parser/`)

**Recursive descent with explicit FIRST/FOLLOW:**

```typescript
// Grammar:
// Expr -> Term (('+' | '-') Term)*
// Term -> Factor (('*' | '/') Factor)*
// Factor -> NUMBER | IDENT | '(' Expr ')'

function parseExpr(tokens: Token[]): ASTNode {
  let left = parseTerm(tokens);
  
  while (tokens.peek()?.type === 'PLUS' || tokens.peek()?.type === 'MINUS') {
    const op = tokens.consume();
    const right = parseTerm(tokens);
    left = { type: 'binary', op: op.text, left, right };
  }
  
  return left;
}

function parseTerm(tokens: Token[]): ASTNode {
  let left = parseFactor(tokens);
  
  while (tokens.peek()?.type === 'STAR' || tokens.peek()?.type === 'SLASH') {
    const op = tokens.consume();
    const right = parseFactor(tokens);
    left = { type: 'binary', op: op.text, left, right };
  }
  
  return left;
}

function parseFactor(tokens: Token[]): ASTNode {
  const tok = tokens.peek();
  
  if (tok.type === 'NUMBER') {
    tokens.consume();
    return { type: 'number', value: tok.text };
  }
  
  if (tok.type === 'IDENT') {
    tokens.consume();
    return { type: 'ident', name: tok.text };
  }
  
  if (tok.type === 'LPAREN') {
    tokens.consume();
    const expr = parseExpr(tokens);
    expect(tokens, 'RPAREN');
    return expr;
  }
  
  throw error('MISSING_OPERAND', {
    expected: FIRST_Factor,  // ['NUMBER', 'IDENT', 'LPAREN']
    got: tok.type
  });
}
```

**Error recovery:** Each line parsed independently

```typescript
function parseProgram(source: string) {
  const lines = source.split('\n');
  const results = [];
  
  for (const line of lines) {
    try {
      const tokens = lex(line);
      const ast = parseLine(tokens);
      results.push({ ok: true, ast });
    } catch (err) {
      results.push({ ok: false, error: err });
    }
  }
  
  return results;  // Some lines succeed even if others fail
}
```

#### Unit Checker (`src/engine/units/`)

**Dimensional analysis:**

```typescript
// Dimension = [L, M, T, I, Θ, N, J]  (7 SI base quantities)
type Dimension = [number, number, number, number, number, number, number];

// Volt = kg⋅m²⋅s⁻³⋅A⁻¹
const volt: Dimension = [2, 1, -3, -1, 0, 0, 0];
//                       L  M   T   I  Θ  N  J

// Unit operations
function multiply(d1: Dimension, d2: Dimension): Dimension {
  return d1.map((exp, i) => exp + d2[i]);
}

function divide(d1: Dimension, d2: Dimension): Dimension {
  return d1.map((exp, i) => exp - d2[i]);
}

function power(d: Dimension, n: number): Dimension {
  return d.map(exp => exp * n);
}

// Check expression
function checkExpr(expr: ASTNode, env: Map<string, Dimension>): Dimension {
  switch (expr.type) {
    case 'number':
      return [0, 0, 0, 0, 0, 0, 0];  // Dimensionless
      
    case 'ident':
      if (!env.has(expr.name)) {
        throw error('UNDECLARED_IDENTIFIER');
      }
      return env.get(expr.name);
      
    case 'binary':
      const left = checkExpr(expr.left, env);
      const right = checkExpr(expr.right, env);
      
      if (expr.op === '+' || expr.op === '-') {
        if (!equal(left, right)) {
          throw error('UNIT_MISMATCH', { left, right });
        }
        return left;
      }
      
      if (expr.op === '*') return multiply(left, right);
      if (expr.op === '/') return divide(left, right);
      if (expr.op === '^') {
        if (expr.right.type !== 'number') {
          throw error('UNIT_MISMATCH', 'Exponent must be literal');
        }
        return power(left, expr.right.value);
      }
      
    case 'call':
      const arg = checkExpr(expr.arg, env);
      if (expr.name === 'exp' || expr.name === 'sin') {
        if (!isDimensionless(arg)) {
          throw error('UNIT_MISMATCH', 'Argument must be dimensionless');
        }
        return [0, 0, 0, 0, 0, 0, 0];
      }
      if (expr.name === 'abs') {
        return arg;  // Preserve dimension
      }
  }
}
```

**Two-pass checking:**

```typescript
function check(program: Line[]) {
  // Pass 1: Collect declarations
  const env = new Map();
  
  for (const line of program) {
    if (line.type === 'declaration') {
      env.set(line.name, unitTable[line.unit]);
    }
    if (line.type === 'equation') {
      env.set(line.lhs, unitTable[line.unit]);
    }
  }
  
  // Pass 2: Check equations
  for (const line of program) {
    if (line.type === 'equation') {
      const rhsDim = checkExpr(line.rhs, env);
      const declaredDim = env.get(line.lhs);
      
      if (!equal(rhsDim, declaredDim)) {
        throw error('UNIT_MISMATCH', {
          expected: format(declaredDim),  // "volt"
          actual: format(rhsDim)          // "kg⋅m²⋅s⁻³"
        });
      }
    }
  }
}
```

### UI Layer

#### Zustand Store (`src/lib/store.ts`)

**Central state for automaton editor:**

```typescript
interface AutomatonStore {
  // State
  automaton: Automaton;
  
  // Actions
  addState: (id: string) => void;
  deleteState: (id: string) => void;
  renameState: (oldId: string, newId: string) => void;
  setStart: (id: string) => void;
  toggleAccepting: (id: string) => void;
  addTransition: (from: string, symbol: string, to: string) => void;
  deleteTransition: (from: string, symbol: string, to: string) => void;
  updateTransition: (old: Transition, updated: Transition) => void;
  importAutomaton: (json: string) => void;
  exportAutomaton: () => string;
  loadExample: (automaton: Automaton) => void;
}

const useAutomatonStore = create<AutomatonStore>((set) => ({
  automaton: { /* empty initial state */ },
  
  addState: (id) => set((state) => {
    // Check limit
    if (state.automaton.states.length >= 30) {
      throw new Error('Maximum 30 states');
    }
    
    return {
      automaton: {
        ...state.automaton,
        states: [...state.automaton.states, id]
      }
    };
  }),
  
  renameState: (oldId, newId) => set((state) => ({
    automaton: {
      ...state.automaton,
      states: state.automaton.states.map(s => s === oldId ? newId : s),
      start: state.automaton.start === oldId ? newId : state.automaton.start,
      accepting: state.automaton.accepting.map(s => s === oldId ? newId : s),
      transitions: state.automaton.transitions.map(t => ({
        from: t.from === oldId ? newId : t.from,
        symbol: t.symbol,
        to: t.to === oldId ? newId : t.to
      }))
    }
  })),
  
  // ... other actions
}));
```

**Usage in components:**

```typescript
function TableEditor() {
  const automaton = useAutomatonStore(s => s.automaton);
  const addTransition = useAutomatonStore(s => s.addTransition);
  
  return (
    <table>
      {automaton.states.map(state => (
        <tr key={state}>
          {automaton.alphabet.map(symbol => (
            <td>
              <input 
                value={getTarget(state, symbol)}
                onChange={(e) => addTransition(state, symbol, e.target.value)}
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}
```

#### ReactFlow Canvas (`src/components/editor/CanvasEditor.tsx`)

**Converting automaton to ReactFlow format:**

```typescript
function toFlowGraph(automaton: Automaton) {
  // Nodes
  const nodes = automaton.states.map(id => ({
    id,
    type: 'custom',  // Use custom node component
    data: {
      label: id,
      isStart: automaton.start === id,
      isAccepting: automaton.accepting.includes(id)
    },
    position: automaton.layout?.[id] || { x: 0, y: 0 }
  }));
  
  // Edges - merge transitions with same from/to
  const edgeGroups = groupBy(automaton.transitions, t => `${t.from}-${t.to}`);
  
  const edges = Object.entries(edgeGroups).map(([key, transitions]) => {
    const [from, to] = key.split('-');
    const label = transitions.map(t => t.symbol).join(', ');
    
    return {
      id: key,
      source: from,
      target: to,
      label,
      type: from === to ? 'self' : 'default'  // Self-loop or normal edge
    };
  });
  
  return { nodes, edges };
}
```

**Custom node component:**

```typescript
function StateNode({ data }) {
  return (
    <div className={`
      rounded-full w-12 h-12 flex items-center justify-center
      border-2 border-gray-900 dark:border-gray-100
      ${data.isAccepting ? 'border-double border-4' : ''}
    `}>
      {data.isStart && (
        <div className="absolute -left-6">→</div>
      )}
      <div>{data.label}</div>
    </div>
  );
}
```

#### Stepper Component (`src/components/trace/Stepper.tsx`)

**Controls for step navigation:**

```typescript
function Stepper({ steps, currentStep, onStepChange }) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);  // ms per step
  
  useEffect(() => {
    if (!playing) return;
    
    const timer = setInterval(() => {
      if (currentStep < steps.length - 1) {
        onStepChange(currentStep + 1);
      } else {
        setPlaying(false);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [playing, currentStep, speed]);
  
  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={() => onStepChange(currentStep - 1)}
        disabled={currentStep === 0}
      >
        ← Prev
      </button>
      
      <button onClick={() => setPlaying(!playing)}>
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      
      <button 
        onClick={() => onStepChange(currentStep + 1)}
        disabled={currentStep === steps.length - 1}
      >
        Next →
      </button>
      
      <span>{currentStep + 1} / {steps.length}</span>
      
      <input 
        type="range" 
        min={0} 
        max={steps.length - 1}
        value={currentStep}
        onChange={(e) => onStepChange(parseInt(e.target.value))}
      />
    </div>
  );
}
```

### API Layer

**Route handler pattern:**

```typescript
// src/app/api/simulate/route.ts
export async function POST(request: Request) {
  try {
    // 1. Parse body
    const body = await request.json();
    
    // 2. Validate with Zod
    const validated = SimulateRequestSchema.parse(body);
    
    // 3. Call engine
    const result = simulate(validated.automaton, validated.input);
    
    // 4. Handle errors
    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.error },
        { status: 422 }
      );
    }
    
    // 5. Return success
    return Response.json({
      ok: true,
      result: result.value,
      trace: result.trace
    });
    
  } catch (err) {
    // Zod validation errors
    if (err instanceof ZodError) {
      return Response.json(
        { ok: false, error: { code: 'INVALID_REQUEST', message: err.message } },
        { status: 400 }
      );
    }
    
    // Unexpected errors
    return Response.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
```

**Zod schemas:**

```typescript
const AutomatonSchema = z.object({
  kind: z.enum(['DFA', 'NFA']),
  states: z.array(z.string()).min(1).max(30),
  alphabet: z.array(z.string()).max(10),
  start: z.string(),
  accepting: z.array(z.string()),
  transitions: z.array(z.object({
    from: z.string(),
    symbol: z.string(),
    to: z.string()
  }))
});

const SimulateRequestSchema = z.object({
  automaton: AutomatonSchema,
  inputs: z.array(z.string()).min(1)
});
```

### Testing Strategy

#### Unit Tests

**Every engine function tested:**

```typescript
// src/engine/simulate/simulate.test.ts
describe('simulate', () => {
  it('should accept string in DFA', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q0' },
        { from: 'q0', symbol: '1', to: 'q1' },
        { from: 'q1', symbol: '0', to: 'q0' },
        { from: 'q1', symbol: '1', to: 'q1' }
      ]
    };
    
    const result = simulate(dfa, '01');
    
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
      expect(result.trace.steps).toHaveLength(3);  // Start + 2 symbols
    }
  });
});
```

#### Oracle Tests

**Verify correctness without hard-coding expected values:**

```typescript
it('NFA to DFA conversion preserves language', () => {
  const nfa = buildRandomNFA();
  const result = subsetConstruction(nfa);
  
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  
  const dfa = result.value.dfa;
  
  // Test all strings up to length 6
  for (const str of enumerateStrings(nfa.alphabet, 6)) {
    const nfaAccepts = simulate(nfa, str).value.accepted;
    const dfaAccepts = simulate(dfa, str).value.accepted;
    
    expect(dfaAccepts).toBe(nfaAccepts);  // Language equivalence
  }
});
```

#### Property Tests

**Random inputs with invariants:**

```typescript
import fc from 'fast-check';

it('minimizing twice gives same result', () => {
  fc.assert(
    fc.property(
      arbitraryDFA(),  // Generates random DFA
      (dfa) => {
        const min1 = minimize(dfa).value;
        const min2 = minimize(min1).value;
        
        expect(min2.states.length).toBe(min1.states.length);
      }
    ),
    { numRuns: 100 }  // Try 100 random DFAs
  );
});
```

### Deployment

**Vercel configuration:**

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "installCommand": "pnpm install"
}
```

**Deploy:**
```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel

# Option 2: GitHub integration
# Push to GitHub, connect repo in Vercel dashboard
git push origin main
```

**Environment:**
- Serverless functions auto-created for API routes
- Static pages pre-rendered at build time
- No environment variables needed (everything is frontend + serverless functions)

## Tips for Understanding the Codebase

1. **Start with types** (`src/engine/automaton/types.ts`)
   - Everything flows from the canonical `Automaton` type

2. **Read tests before implementations**
   - Tests show what the function should do
   - `*.test.ts` files are documentation

3. **Trace a single operation end-to-end:**
   - Click "Simulate" → What happens?
   - `SimulatePage.tsx` → `apiClient.simulate()` → `/api/simulate/route.ts` → `engine/simulate/simulate.ts`

4. **Check test coverage for confidence:**
```bash
pnpm test:cov
# Open coverage/index.html
```

5. **Use TypeScript to navigate:**
   - Cmd+Click (Mac) or Ctrl+Click (Windows) on any function
   - See all usages with "Find References"

6. **Engine is dependency-free:**
   - No imports from React, Next.js, or UI libraries
   - Can test with just `vitest`
   - Could be extracted as a standalone npm package

## Common Gotchas

1. **Epsilon transitions:**
   - Only valid for `kind: 'NFA'`
   - Always apply epsilon-closure after moves
   - Symbol `'ε'` is special, never in alphabet

2. **Normalization:**
   - Always normalize before comparison
   - Sorted states/alphabet/transitions = determinism
   - Tests rely on canonical order

3. **Store updates:**
   - Zustand state is immutable
   - Always return new objects: `{ ...state, field: newValue }`
   - Never mutate: `state.field = newValue` ❌

4. **ReactFlow positions:**
   - Stored in `automaton.layout`
   - Engine ignores it (not part of algorithm)
   - Canvas reads/writes it for persistence

5. **API error handling:**
   - 400 = malformed JSON, Zod validation failed
   - 422 = valid format but unsupported (limit exceeded, unsupported regex)
   - 500 = unexpected bug (should never happen)

6. **Test isolation:**
   - Each test creates fresh automaton
   - No shared state between tests
   - `beforeEach(() => vi.clearAllMocks())`

## Next Steps

**Learning path:**
1. Run the app, play with all features
2. Read `src/engine/simulate/simulate.ts` + tests
3. Read `src/engine/convert/subsetConstruction.ts` + tests
4. Try adding a new algorithm (e.g., DFA union)
5. Add a new page using the same pattern

**Extension ideas:**
- More named languages in the library
- PDA simulator (with stack visualization)
- Context-free pumping lemma
- Grammar to PDA conversion
- Export trace as PDF
- Mobile-friendly navigation
- More comprehensive error messages
- Undo/redo for editor

**Performance improvements:**
- Memoize expensive computations
- Web Workers for long-running algorithms
- Incremental DFA construction (show progress)
- Virtualize large trace lists

## Questions?

This is a complete, production-ready application. Every part has been tested and documented. Use it for learning, teaching, or as a reference for building similar tools.

The code demonstrates:
- Clean architecture (separation of concerns)
- Pure functional algorithms
- Comprehensive testing (unit, oracle, property)
- Type safety throughout
- Accessible UI
- Educational focus (traces and explanations)

**Key takeaway:** Complex algorithms become manageable when broken into pure functions with clear types and comprehensive tests.
