# Automata Theory Playground - Full Context Guide

**Last Updated:** November 12, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅

---

## 🎯 Project Overview

A web-based educational platform for learning automata theory, formal languages, and computational theory. Built with Next.js 15, TypeScript, React, and a custom computation engine.

**Live URL:** https://automata-beta-olive.vercel.app  
**Local Dev:** http://localhost:3000

---

## 📁 Project Structure

```
d:\AT/
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── (pages)/             # Feature pages
│   │   │   ├── simulate/        # DFA/NFA simulation
│   │   │   ├── nfa-to-dfa/      # Subset construction
│   │   │   ├── minimize/        # DFA minimization
│   │   │   ├── regex/           # Thompson & Arden
│   │   │   ├── language/        # Chomsky classification
│   │   │   ├── pumping/         # Pumping lemma
│   │   │   ├── numbers/         # Base conversions
│   │   │   └── parser/          # Grammar parsing
│   │   ├── api/                 # REST API routes
│   │   │   ├── simulate/
│   │   │   ├── nfa-to-dfa/
│   │   │   ├── minimize/
│   │   │   ├── regex-to-nfa/
│   │   │   ├── fa-to-regex/
│   │   │   ├── pumping/
│   │   │   ├── identify-language/
│   │   │   ├── convert-number/
│   │   │   ├── parse/
│   │   │   └── check-units/
│   │   └── globals.css          # Tailwind + custom styles
│   ├── components/              # React components
│   │   ├── editor/
│   │   │   ├── AutomatonEditor.tsx    # Main editor wrapper
│   │   │   ├── TableEditor.tsx        # Table-based editor
│   │   │   ├── CanvasEditor.tsx       # Visual graph editor
│   │   │   ├── StateNode.tsx          # Canvas node component
│   │   │   └── SelfLoopEdge.tsx       # Custom edge for self-loops
│   │   ├── trace/
│   │   │   ├── Stepper.tsx            # Step navigation
│   │   │   ├── StepLog.tsx            # Step details
│   │   │   └── StepView.tsx           # Step visualization
│   │   ├── Layout.tsx           # App layout
│   │   └── LoadingView.tsx      # Loading spinner
│   ├── engine/                  # Core computation engine
│   │   ├── automaton/           # DFA/NFA operations
│   │   ├── convert/             # NFA→DFA conversion
│   │   ├── minimize/            # DFA minimization
│   │   ├── regex/               # Regex ↔ NFA
│   │   ├── language/            # Classification, pumping
│   │   ├── parser/              # Grammar parsing
│   │   ├── numbers/             # Base conversions
│   │   ├── lexer/               # Tokenization
│   │   ├── simulate/            # Automaton simulation
│   │   ├── units/               # Dimensional analysis
│   │   └── errors.ts            # Error types
│   └── lib/
│       ├── store.ts             # Zustand global state
│       ├── toFlowGraph.ts       # ReactFlow conversion
│       └── apiClient.ts         # API utilities
├── planning/                    # Design docs
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   └── engineering-rules.md
├── coverage/                    # Test coverage reports
├── README.md                    # Main documentation
├── PROJECT_CONTEXT.md           # THIS FILE - Full context guide
├── FRONTEND_TEST_CHECKLIST_V2.md  # Manual testing guide
└── package.json                 # Dependencies
```

---

## 🔧 Technology Stack

### Frontend
- **Framework:** Next.js 15.1.6 (App Router, React 19)
- **Language:** TypeScript 5.8.3
- **Styling:** Tailwind CSS 3.4.17
- **State:** Zustand 5.0.2
- **Graph UI:** ReactFlow (@xyflow/react 12.3.8)
- **Validation:** Zod 3.24.1

### Backend
- **Runtime:** Next.js API Routes (Node.js)
- **Validation:** Zod schemas
- **Testing:** Vitest 5.0.5
- **Coverage:** v8

### Development
- **Package Manager:** pnpm 9.15.0
- **Linting:** ESLint 9
- **Testing:** Vitest + @testing-library/react
- **Deployment:** Vercel

---

## 🚀 Quick Start

### Prerequisites
```bash
# Required
Node.js 18+ 
pnpm 9.15+
```

### Setup
```bash
# Clone repository
git clone <repo-url>
cd AT

# Install dependencies
pnpm install

# Start dev server
pnpm dev
# → http://localhost:3000

# Run tests
pnpm test

# Type check
pnpm tsc --noEmit

# Build production
pnpm build
```

---

## 🎨 Key Features & Status

| Feature | Status | API Route | Frontend Page |
|---------|--------|-----------|---------------|
| **Automaton Editor** | ✅ | - | All pages |
| **Table Editor** | ✅ | - | `/src/components/editor/TableEditor.tsx` |
| **Canvas Visualization** | ✅ | - | `/src/components/editor/CanvasEditor.tsx` |
| **DFA/NFA Simulation** | ✅ | `/api/simulate` | `/simulate` |
| **NFA → DFA** | ✅ | `/api/nfa-to-dfa` | `/nfa-to-dfa` |
| **DFA Minimization** | ✅ | `/api/minimize` | `/minimize` |
| **Regex → NFA (Thompson)** | ✅ | `/api/regex-to-nfa` | `/regex` |
| **FA → Regex (Arden)** | ✅ | `/api/fa-to-regex` | `/regex` |
| **Pumping Lemma** | ✅ | `/api/pumping` | `/pumping` |
| **Language Classification** | ✅ | `/api/identify-language` | `/language` |
| **Grammar Parsing** | ✅ | `/api/parse` | `/parser` |
| **Number Base Conversion** | ✅ | `/api/convert-number` | `/numbers` |
| **Unit Checking** | ✅ | `/api/check-units` | Used in parser |

**Test Coverage:** 91.04% lines (exceeds 90% target)

---

## 📊 Data Flow

### 1. User Interaction
```
User Input (Table/Canvas/JSON)
    ↓
AutomatonEditor Component
    ↓
Zustand Store (useAutomatonStore)
    ↓
Local State Updates
```

### 2. API Requests
```
Frontend Page
    ↓
fetch('/api/[feature]', { automaton })
    ↓
API Route Handler (route.ts)
    ↓
Zod Validation
    ↓
Engine Function (e.g., minimize())
    ↓
Result → JSON Response
    ↓
Frontend Updates State
```

### 3. Visualization
```
Store Automaton
    ↓
toFlowGraph() converter
    ↓
ReactFlow nodes/edges
    ↓
Canvas renders with:
    - StateNode components
    - SelfLoopEdge components
    - Smooth Bezier edges
```

---

## 🗂️ Core Files Explained

### State Management (`src/lib/store.ts`)
```typescript
// Zustand store for automaton state
interface AutomatonStore {
  automaton: Automaton;
  addState: (name: string) => void;
  deleteState: (name: string) => void;
  renameState: (old: string, new: string) => void;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  renameSymbol: (old: string, new: string) => void;
  addTransition: (t: Transition) => void;
  removeTransition: (t: Transition) => void;
  setStart: (state: string) => void;
  toggleAccepting: (state: string) => void;
  importAutomaton: (data: unknown) => void;
  exportAutomaton: () => Automaton;
  setKind: (kind: 'DFA' | 'NFA') => void;
}
```

### Engine Error Handling (`src/engine/errors.ts`)
```typescript
// All engine functions return Result<T>
type Result<T> = 
  | { ok: true; value: T } 
  | { ok: false; error: EngineError };

// Error codes mapped to HTTP status
// 422: Invalid input, limit exceeded
// 500: Internal error
```

### API Response Format (`src/app/api/helpers.ts`)
```typescript
// Success
{ ok: true, result: { ...data } }

// Error
{ ok: false, error: { code, message, line?, column? } }
```

---

## 🐛 Recent Fixes & Changes

### Session 1: Initial Implementation
- Built all 12 features
- Created computation engine
- Set up API routes
- Added table and canvas editors

### Session 2: Frontend Fixes (Nov 11-12, 2026)
1. ✅ Fixed transition input (no premature state creation)
2. ✅ Fixed symbol editing (local state control)
3. ✅ Fixed trace viewer (play/pause functionality)
4. ✅ Fixed canvas (self-loops, curved edges)
5. ✅ Created 6 missing API routes
6. ✅ Fixed data format (data.result consistency)
7. ✅ Fixed minimize API (correct response shape)
8. ✅ Removed light/dark mode toggle
9. ✅ Added canvas usage guide
10. ✅ Fixed regex alphabet validation

**TypeScript Errors:** 0  
**API Tests:** 23/23 passing ✅

---

## 🧪 Testing

### Run Tests
```bash
# All tests
pnpm test

# Specific suite
pnpm test src/engine/automaton
pnpm test src/app/api

# Coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### Test Structure
- **Engine Tests:** `/src/engine/**/*.test.ts`
- **API Tests:** `/src/app/api/**/*.test.ts`
- **Component Tests:** `/src/app/(pages)/**/*.test.tsx`
- **Coverage Report:** `/coverage/index.html`

### Manual Testing
See `FRONTEND_TEST_CHECKLIST_V2.md` for comprehensive frontend testing guide.

---

## 📝 API Documentation

### POST `/api/simulate`
```typescript
Request: {
  automaton: Automaton;
  inputs: string[]; // Max 20
}

Response: {
  ok: true;
  result: {
    results: Array<{
      input: string;
      accepted: boolean;
      trace: TraceStep[];
    }>;
  };
}
```

### POST `/api/nfa-to-dfa`
```typescript
Request: {
  automaton: Automaton;
}

Response: {
  ok: true;
  result: {
    dfa: Automaton;
    table: Array<{ subset: string; states: string[]; accepting: boolean }>;
    trace: TraceStep[];
  };
}
```

### POST `/api/minimize`
```typescript
Request: {
  automaton: Automaton; // Must be DFA
}

Response: {
  ok: true;
  result: {
    minimal: Automaton;
    alreadyMinimal: boolean;
    mapping: Record<string, string>;
    trace: TraceStep[];
  };
}
```

### POST `/api/regex-to-nfa`
```typescript
Request: {
  regex: string; // Max 200 chars
  alphabet?: string[]; // Optional, auto-detected
}

Response: {
  ok: true;
  result: {
    nfa: Automaton;
    trace: TraceStep[];
  };
}
```

### POST `/api/fa-to-regex`
```typescript
Request: {
  automaton: Automaton;
}

Response: {
  ok: true;
  result: {
    regex: string; // Canonical form
    regexTextbook: string; // Textbook notation
    trace: TraceStep[];
  };
}
```

### POST `/api/pumping`
```typescript
// Non-regular mode
Request: {
  mode: 'non-regular';
  languageId: string;
  p: number; // 1-50
}

// Regular mode
Request: {
  mode: 'regular';
  automaton: Automaton;
  string: string;
}

Response: {
  ok: true;
  result: {
    decompositions: Array<{ x: string; y: string; z: string }>;
    explanation: string;
  };
}
```

### POST `/api/identify-language`
```typescript
// Automaton mode
Request: {
  kind: 'automaton';
  automaton: Automaton;
}

// Grammar mode
Request: {
  kind: 'grammar';
  grammar: string;
}

// Named language mode
Request: {
  kind: 'named';
  languageId: string;
}

Response: {
  ok: true;
  result: {
    class: 'Type 0' | 'Type 1' | 'Type 2' | 'Type 3';
    certainty: string;
    reasons: string[];
  };
}
```

### POST `/api/convert-number`
```typescript
Request: {
  input: string;
  from: 'binary' | 'octal' | 'hex';
  to: 'binary' | 'octal' | 'hex';
}

Response: {
  ok: true;
  result: {
    input: string;
    output: string;
    from: string;
    to: string;
    trace?: TraceStep[];
  };
}
```

---

## 🎯 Canvas Features

### Usage Guide (Built-in)
Click "📖 Canvas Usage Guide" in any canvas view to see:
- **Navigation:** Pan, zoom, fit view
- **Node Operations:** Select, move, set start/accepting
- **Edge Drawing:** Smooth Bezier curves, self-loops, multiple edges
- **Tips:** Table view for editing, auto-layout, minimap

### Edge Types
1. **Regular Edges:** Smooth Bezier curves (smoothstep)
2. **Self-Loops:** Custom circular arcs above nodes
3. **Multiple Edges:** Automatically offset when bidirectional

### Node Features
- **Double Circle:** Accepting states
- **Arrow Indicator:** Start state
- **Drag & Drop:** Reposition nodes
- **Click to Select:** Show control buttons

---

## 🔐 Validation & Limits

### Input Limits
- **States:** Max 30 per automaton
- **Alphabet:** Max 10 symbols
- **Transitions:** Unlimited (validated for consistency)
- **Regex:** Max 200 characters
- **Input Strings:** Max 20 for simulation
- **JSON Body:** Max 100 KB
- **Grammar:** Max 5000 characters

### Validation Rules
- State names must be unique
- Start state must exist
- Accepting states must exist
- Transition states must be in state set
- Symbols must be in alphabet (or ε for NFA)

---

## 🚨 Common Issues & Solutions

### Issue: "Reload page" error
**Cause:** Dev server not running  
**Fix:** `pnpm dev`

### Issue: "Alphabet validation error" on regex
**Cause:** Old API version  
**Fix:** Already fixed - alphabet is now optional

### Issue: TypeScript errors
**Check:** `pnpm tsc --noEmit`  
**Fix:** All fixed as of last session

### Issue: Test failures
**Check:** `pnpm test`  
**Status:** All 23 API tests passing

### Issue: Canvas edges look rectangular
**Fix:** Already fixed - using smoothstep edges

---

## 📚 Key Algorithms Implemented

1. **Subset Construction (NFA → DFA)**
   - File: `src/engine/convert/subsetConstruction.ts`
   - Algorithm: Powerset construction with BFS
   - Trace: Shows subset table construction

2. **DFA Minimization**
   - File: `src/engine/minimize/minimize.ts`
   - Algorithm: Partition refinement (Moore's)
   - Trace: Shows partition evolution

3. **Thompson's Construction (Regex → NFA)**
   - File: `src/engine/regex/thompson.ts`
   - Algorithm: Compositional NFA construction
   - Trace: Shows fragment assembly

4. **Arden's Lemma (FA → Regex)**
   - File: `src/engine/regex/arden.ts`
   - Algorithm: State elimination with equations
   - Trace: Shows equation solving steps

5. **Pumping Lemma**
   - File: `src/engine/language/pumping.ts`
   - Implementations: Regular & context-free
   - Trace: Shows decomposition attempts

---

## 🔄 Deployment

### Vercel (Production)
```bash
# Automatic deployment on push to main
git push origin main

# Manual deployment
vercel --prod
```

### Environment Variables
None required - all computation is client-side or API routes.

### Build Configuration
- `next.config.ts`: ESM output, React strict mode
- `vercel.json`: Route configuration
- Build output: `.next/` (gitignored)

---

## 📖 Additional Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview, setup, features |
| `EXPLANATION.md` | Design decisions, architecture |
| `planning/requirements.md` | Feature requirements (R1-R15) |
| `planning/design.md` | System design, API specs |
| `planning/tasks.md` | Implementation tasks (T1-T30) |
| `planning/engineering-rules.md` | Coding standards |
| `FRONTEND_TEST_CHECKLIST_V2.md` | Manual testing guide |
| `DEVIATIONS_FIXED.md` | Completed deviation fixes |
| `COVERAGE_IMPROVEMENT.md` | Test coverage improvements |

---

## 🎓 Learning Resources

### Automata Theory Concepts
- DFA/NFA: Deterministic/Nondeterministic Finite Automata
- ε-transitions: Epsilon (empty string) transitions
- Subset Construction: NFA to DFA conversion
- Minimization: Reducing DFA states
- Regular Expressions: Pattern matching
- Pumping Lemma: Proving non-regularity
- Chomsky Hierarchy: Language classification

### Code References
- ReactFlow Docs: https://reactflow.dev/
- Next.js 15 Docs: https://nextjs.org/docs
- Zustand Docs: https://zustand-demo.pmnd.rs/

---

## 🤝 Handoff Checklist

When switching IDEs or passing to another developer:

- [ ] Clone repository
- [ ] Run `pnpm install`
- [ ] Verify `pnpm dev` starts successfully
- [ ] Run `pnpm test` - all tests pass
- [ ] Run `pnpm tsc --noEmit` - no errors
- [ ] Check deployment: https://automata-beta-olive.vercel.app
- [ ] Read `README.md` for overview
- [ ] Review `FRONTEND_TEST_CHECKLIST_V2.md`
- [ ] Check `planning/` folder for specs
- [ ] Review recent changes in this document

---

## 📞 Support & Contributions

### Known Working State
- **Last Verified:** November 12, 2026
- **Node Version:** 18+
- **pnpm Version:** 9.15.0
- **All Tests:** Passing ✅
- **TypeScript:** No errors ✅
- **Deployment:** Live ✅

### Future Enhancements (Optional)
- [ ] Add custom edge drawing (free-hand)
- [ ] Add more named languages
- [ ] Export automaton as image
- [ ] Add undo/redo functionality
- [ ] Add collaborative editing
- [ ] Add mobile responsive design improvements

---

**End of Context Guide**

This document contains everything needed to understand, run, modify, and deploy the Automata Theory Playground. Keep it updated with major changes!
