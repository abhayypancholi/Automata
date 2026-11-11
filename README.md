# Automata Theory Playground

A web-based interactive platform for learning and experimenting with automata theory, formal languages, and computational models. Built for students taking automata theory courses, this tool provides step-by-step visualizations and explanations for every algorithm.

## Features

This playground covers core automata theory topics mapped to typical course syllabi:

### Part 1: Finite Automata and Regular Languages

- **Automaton Editor** - Build DFAs, NFAs, and ε-NFAs using an interactive canvas or transition table. Both views stay synchronized. (R1)
- **Simulation** - Step through string acceptance with animated state transitions and detailed trace logs. (R2)
- **NFA to DFA Conversion** - Subset construction with growing table showing each subset discovered. (R3)
- **DFA Minimization** - Partition refinement (Moore's algorithm) with split witnesses at each iteration. (R4)
- **Regular Expressions** - Thompson's construction for regex → NFA, with support for `*`, `+`, `?`, `|`, concatenation, and character classes. (R5)
- **Arden's Theorem** - Convert automata to regular expressions using state elimination and algebraic simplification. (R6)
- **Language Identification** - Classify languages by their position in the Chomsky hierarchy. (R7)
- **Pumping Lemma** - Interactive demonstrations for regular and non-regular languages with decomposition tables. (R8)

### Part 2: Number Systems and Context-Free Languages

- **Number System Conversions** - Binary ↔ Octal ↔ Hex using finite-state transducers with LSB-first processing. Includes validators and divisibility DFAs. (R9)

  **Note on LSB-first representation:** Binary-to-octal and binary-to-hex conversions read input from right to left (least significant bit first) because the machine cannot know the string length in advance and groups must align from the right. The output is then reversed for normal reading order. This is a fundamental property of finite-state transducers for base conversion.

- **Tokenizer** - Lexical analysis built entirely from Part 1 algorithms (regex → NFA → DFA), recognizing identifiers, numbers, operators, and derivative tokens like `dv/dt`. (R10)
- **Parser** - Recursive descent parser for a mini expression language with operator precedence, showing parse trees and leftmost derivations. (R11)
- **Error Messages** - Precise error reporting with line/column positions, source context with carets, and suggested fixes. (R12)
- **Unit Checker** - Dimensional analysis for physical equations (V = IR, dv/dt = I/C, etc.) with SI unit support. (R13)

### Additional Features

- **Examples Library** - One-click examples for every feature, including textbook cases and class examples. (R14)
- **Light & Dark Themes** - System-aware theme with manual toggle. (R16.2)
- **Step-by-Step Explanations** - Every result shows the final answer first, then a collapsible step log with prev/next/play controls. (R16.1)
- **Keyboard Accessible** - Full keyboard operability with visible focus states. (R16.3)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React UI + Zustand State)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Canvas      │  │ Table Editor │  │ Step Log     │      │
│  │ (ReactFlow) │  │              │  │ (Stepper)    │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬────────────────────────────────────────────────┘
             │ fetch /api/* (JSON)
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Route Handlers                                     │
│  (Thin: validate with Zod, call engine, map errors)        │
└────────────┬────────────────────────────────────────────────┘
             │ function calls
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Engine (Pure TypeScript, fully tested)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ automaton/  │  │ convert/     │  │ minimize/    │      │
│  │ simulate/   │  │ regex/       │  │ numbers/     │      │
│  │ language/   │  │ lexer/       │  │ parser/      │      │
│  │ units/      │  │ ...          │  │ ...          │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Principles:**
- UI never implements algorithm logic
- Engine is pure TypeScript with no React/Next.js dependencies
- All conversions return deterministic, traceable results
- Every algorithm has oracle-based tests for correctness

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 6
- **Styling:** Tailwind CSS 4, next-themes for dark mode
- **State:** Zustand for automaton editor state
- **Validation:** Zod for API schemas and type safety
- **Canvas:** @xyflow/react for automaton visualization
- **Layout:** @dagrejs/dagre for auto-layout
- **Regex Parsing:** regexp-tree (adapted to our AST)
- **Testing:** Vitest with 90% coverage threshold, fast-check for property tests
- **Deployment:** Vercel serverless

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd automata-playground

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run all checks (typecheck + lint + test)
pnpm check
```

**Test Coverage:** The engine has 88.91% line coverage (90.57% statement coverage) with comprehensive oracle tests verifying language equivalence for all conversions.

## Project Structure

```
src/
├── engine/              # Pure TypeScript algorithms (no React)
│   ├── automaton/       # Types, validation, equivalence
│   ├── simulate/        # DFA/NFA simulation
│   ├── convert/         # ε-closure, subset construction
│   ├── minimize/        # Partition refinement
│   ├── regex/           # Parsing, Thompson, Arden, simplification
│   ├── numbers/         # Transducers, validators, divisibility
│   ├── language/        # Grammar classification, named languages, pumping
│   ├── lexer/           # Tokenizer built from regex→NFA→DFA
│   ├── parser/          # Recursive descent, AST, derivations
│   └── units/           # Dimensional analysis
├── app/
│   ├── api/             # Route handlers (thin validation layer)
│   └── (pages)/         # Feature pages
├── components/
│   ├── editor/          # Canvas and table editors
│   └── trace/           # Step log and stepper components
├── examples/            # JSON example files + schemas
└── lib/                 # API client, Zustand store, utilities
```

## API Endpoints

All endpoints accept JSON POST requests and return structured responses:

- `/api/simulate` - Run DFA/NFA on input string(s)
- `/api/nfa-to-dfa` - Subset construction
- `/api/minimize` - DFA minimization
- `/api/regex-to-nfa` - Thompson's construction
- `/api/fa-to-regex` - Arden's theorem
- `/api/identify-language` - Classify by Chomsky hierarchy
- `/api/pumping` - Pumping lemma demonstrations
- `/api/convert-number` - Base conversions via transducers
- `/api/validate-number` - Number format validation
- `/api/divisibility-dfa` - Binary divisibility DFA generator
- `/api/tokenize` - Lexical analysis
- `/api/parse` - Parse expressions with unit checking

Success responses: `{ ok: true, result, trace }`  
Error responses: `{ ok: false, error: { code, message, line?, column? } }`

## Known Limitations

Per requirement R18 (non-goals):

- **No numeric solving:** The parser analyzes equations dimensionally but does not evaluate them numerically.
- **No persistence:** No user accounts or server-side project storage. Export/import automata as JSON files.
- **No arbitrary language classification:** Language identification is limited to regex, automata, typed grammars, and a curated library. It does not decide arbitrary languages.
- **No PDA/TM simulators:** Pushdown automata and Turing machines are referenced in text but not simulated interactively.
- **Not full Brian 2:** The parser supports a minimal subset for teaching purposes, not the complete Brian 2 simulator language.

## Limits

To ensure reasonable performance on Vercel serverless:

- Maximum 30 states and 10 alphabet symbols per automaton
- Regex length ≤ 200 characters
- Program source ≤ 5,000 characters
- Trace steps ≤ 2,000 per operation
- Request body ≤ 100 KB

Exceeding limits returns a clear `LIMIT_EXCEEDED` error.

## Accessibility

- **Keyboard navigation:** All interactive elements are keyboard accessible with visible focus rings
- **Screen readers:** Semantic HTML with proper ARIA labels
- **Color independence:** Information conveyed by shape and text, not color alone (double circles for accepting states, arrows for start states)
- **Contrast:** WCAG AA compliant in both light and dark modes
- **Reduced motion:** Respects `prefers-reduced-motion` for animations
- **Responsive:** Works on screens as narrow as 360px

## Contributing

This is a course project. For academic use, please cite appropriately.

## License

[Specify license]

## Acknowledgments

Built for automata theory coursework. Algorithms based on:
- Hopcroft & Ullman, *Introduction to Automata Theory, Languages, and Computation*
- Sipser, *Introduction to the Theory of Computation*
- Kozen, *Automata and Computability*

Regular expression parsing uses the `regexp-tree` library by Dmitry Soshnikov.

## Deployed Application

**Live Demo:** [https://automata-beta-olive.vercel.app](https://automata-beta-olive.vercel.app)

Deployed on Vercel serverless infrastructure. Performance measured at <1s for typical inputs within limits.
