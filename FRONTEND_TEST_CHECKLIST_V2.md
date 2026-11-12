# Automata Theory Playground - Frontend Testing Checklist

## Prerequisites
```bash
# Make sure dev server is running
pnpm dev
# Then open http://localhost:3000
```

---

## 1. ✅ Basic Editor - Table View

### Test Steps:
1. Go to any page (e.g., `/simulate`)
2. Check **Table View** (should be default)
3. Click "Add State" button
4. Click "Add Symbol" button
5. Try editing state names (click on name like "q0")
6. Try editing symbol names (click on symbol like "a")
7. Click on transition cell, type "q1" → Press Enter or click away
8. Check if state "q1" is auto-created

### Expected Results:
- [ ] States are added (q0, q1, q2...)
- [ ] Symbols are added (a, b, c...)
- [ ] Can rename states inline
- [ ] Can rename symbols inline (up to 3 characters)
- [ ] Typing in transition cell doesn't auto-create until Enter/blur
- [ ] Can type full state names (like "q0", "q10") without premature creation
- [ ] Datalist autocomplete shows existing states

**Issue if any:**
```
[Write any problems here]
```

---

## 2. ✅ Canvas View & Usage Guide

### Test Steps:
1. Switch to **Canvas** tab
2. Click "📖 Canvas Usage Guide" to expand guide
3. Read through all 4 sections (Navigation, Node Operations, Edge Drawing, Tips)
4. Try **Pan**: Click empty space and drag
5. Try **Zoom**: Use scroll wheel
6. Try **Select node**: Click on a state circle
7. Try **Move node**: Drag a selected node
8. Try **Set as Start**: Select node → Click "Set as Start"
9. Try **Toggle Accepting**: Select node → Click "Toggle Accepting"

### Expected Results:
- [ ] Usage guide expands/collapses smoothly
- [ ] Guide shows 4 sections with clear instructions
- [ ] Can pan by dragging empty space
- [ ] Can zoom with scroll wheel
- [ ] Can select nodes (shows blue selection bar)
- [ ] Can drag nodes to reposition them
- [ ] "Set as Start" button changes start state
- [ ] "Toggle Accepting" button adds/removes double circle
- [ ] Edges use **smooth Bezier curves** (not straight/rectangular lines)
- [ ] Self-loops appear as **circular arcs above nodes**
- [ ] Multiple edges between same nodes are **offset/curved**
- [ ] Edge labels have clean white backgrounds

**Issue if any:**
```
[Write any problems here]
```

---

## 3. ✅ Import/Export JSON

### Test JSON:
```json
{
  "kind": "DFA",
  "states": ["q0", "q1", "q2"],
  "alphabet": ["a", "b"],
  "start": "q0",
  "accepting": ["q2"],
  "transitions": [
    {"from": "q0", "symbol": "a", "to": "q1"},
    {"from": "q1", "symbol": "b", "to": "q2"},
    {"from": "q2", "symbol": "a", "to": "q2"},
    {"from": "q2", "symbol": "b", "to": "q2"},
    {"from": "q0", "symbol": "b", "to": "q0"},
    {"from": "q1", "symbol": "a", "to": "q1"}
  ]
}
```

### Test Steps:
1. Click "Import JSON" button
2. Create a `.json` file with above content
3. Select the file
4. Verify import success
5. Switch to Canvas view to see visualization
6. Click "Export JSON" button
7. Check downloaded file

### Expected Results:
- [ ] Import shows success alert
- [ ] Automaton loads correctly (3 states, 2 symbols, 6 transitions)
- [ ] Table view shows all data
- [ ] Canvas view shows nodes with smooth edges
- [ ] Export downloads `automaton.json`
- [ ] Exported JSON is valid and matches structure

**Issue if any:**
```
[Write any problems here]
```

---

## 4. ✅ Simulation with Trace Viewer

### Test Data:
- Use the DFA from section 3
- Test strings: `ab`, `aab`, `abb`, `ba`

### Test Steps:
1. Go to `/simulate`
2. Import the DFA from section 3
3. Enter test strings (one per line) in textarea
4. Click "Run Simulation"
5. Check results table
6. Click "View trace" on any result
7. Use **Play button** (▶️) to auto-step through trace
8. Use **Previous/Next arrows** to manually step
9. Expand "Show steps" section

### Expected Results:
- [ ] Results table shows Accept/Reject for each string
- [ ] "View trace" displays trace section
- [ ] Play button auto-advances steps (1 per second)
- [ ] Pause button stops auto-advance
- [ ] Previous/Next arrows work
- [ ] Step counter shows current position (e.g., "3 / 5")
- [ ] "Show steps" expands to show step details
- [ ] Step title, explanation, and data display correctly

**Issue if any:**
```
[Write any problems here]
```

---

## 5. ✅ NFA to DFA Conversion

### Test NFA:
```json
{
  "kind": "NFA",
  "states": ["q0", "q1", "q2"],
  "alphabet": ["a", "b"],
  "start": "q0",
  "accepting": ["q2"],
  "transitions": [
    {"from": "q0", "symbol": "ε", "to": "q1"},
    {"from": "q1", "symbol": "a", "to": "q2"}
  ]
}
```

### Test Steps:
1. Go to `/nfa-to-dfa`
2. Import the NFA above
3. Click "Convert to DFA"
4. Check result DFA info
5. Try "Use simple names (A, B, C...)" toggle
6. Click "Load DFA into editor"
7. Switch to Canvas view to see result

### Expected Results:
- [ ] Conversion succeeds
- [ ] Shows DFA with state count
- [ ] Simple names toggle works
- [ ] "Load DFA into editor" imports result
- [ ] Canvas shows DFA with smooth edges
- [ ] Trace/steps are available (if implemented)

**Issue if any:**
```
[Write any problems here]
```

---

## 6. ✅ DFA Minimization

### Test DFA (has redundant states):
```json
{
  "kind": "DFA",
  "states": ["q0", "q1", "q2", "q3"],
  "alphabet": ["a", "b"],
  "start": "q0",
  "accepting": ["q3"],
  "transitions": [
    {"from": "q0", "symbol": "a", "to": "q1"},
    {"from": "q0", "symbol": "b", "to": "q2"},
    {"from": "q1", "symbol": "a", "to": "q3"},
    {"from": "q1", "symbol": "b", "to": "q1"},
    {"from": "q2", "symbol": "a", "to": "q3"},
    {"from": "q2", "symbol": "b", "to": "q2"},
    {"from": "q3", "symbol": "a", "to": "q3"},
    {"from": "q3", "symbol": "b", "to": "q3"}
  ]
}
```

### Test Steps:
1. Go to `/minimize`
2. Import the DFA above
3. Click "Minimize DFA"
4. Check if it shows "already minimal" or reduction info
5. Check state mapping (expand if available)
6. Try "Show dead state" toggle
7. Click "Load minimal DFA into editor"

### Expected Results:
- [ ] Minimization succeeds
- [ ] Shows minimal DFA state count
- [ ] State mapping is displayed (if available)
- [ ] "Show dead state" toggle works
- [ ] "Load minimal DFA" imports result
- [ ] Canvas shows minimized DFA

**Issue if any:**
```
[Write any problems here]
```

---

## 7. ✅ Regex to NFA (Thompson's Construction)

### Test Regex: `(a|b)*abb` or `a|b`

### Test Steps:
1. Go to `/regex`
2. Make sure **Thompson** tab is active
3. Enter regex: `(a|b)*abb` or just `a|b`
4. Click "Convert to NFA" (no need to enter alphabet)
5. Check result NFA info
6. Click "Load NFA into editor"

### Expected Results:
- [ ] Conversion succeeds without alphabet error
- [ ] Shows NFA state count
- [ ] "Load NFA" imports to editor
- [ ] Canvas shows NFA with epsilon transitions
- [ ] Edges are smooth Bezier curves

**Issue if any:**
```
[Write any problems here]
```

---

## 8. ✅ FA to Regex (Arden's Lemma)

### Test Steps:
1. Go to `/regex`
2. Switch to **Arden** tab
3. Import simple DFA (from section 3)
4. Click "Convert to Regex"
5. Check result regex display

### Expected Results:
- [ ] Conversion succeeds
- [ ] Shows regex result
- [ ] Displays in canonical/textbook format

**Issue if any:**
```
[Write any problems here]
```

---

## 9. ✅ Pumping Lemma

### Test Steps (Non-Regular):
1. Go to `/pumping`
2. Select **Non-regular** tab
3. Choose language: `aⁿbⁿ`
4. Set pumping length: `p = 3`
5. Click "Test with Pumping Lemma"
6. Check decompositions

### Test Steps (Regular):
1. Switch to **Regular** tab
2. Import DFA from section 3
3. Enter string: `aab`
4. Click "Test with Pumping Lemma"

### Expected Results:
- [ ] Non-regular test shows decompositions
- [ ] Regular test shows pumping for DFA
- [ ] Results display correctly

**Issue if any:**
```
[Write any problems here]
```

---

## 10. ✅ Language Classification

### Test Steps:
1. Go to `/language`
2. Try **Automaton** tab with imported DFA
3. Click "Identify Language"
4. Try **Grammar** tab
5. Enter grammar:
   ```
   S -> aSb | ε
   ```
6. Click "Identify Language"

### Expected Results:
- [ ] Automaton classification: "Type 3 (Regular)"
- [ ] Grammar classification shows type
- [ ] Reasons/explanation displayed

**Issue if any:**
```
[Write any problems here]
```

---

## 11. ✅ Parser

### Test Grammar:
```
E -> E + T | T
T -> T * F | F
F -> ( E ) | id
```

### Test Steps:
1. Go to `/parser`
2. Enter grammar above
3. Click "Parse Grammar"
4. Check parse tree/result

### Expected Results:
- [ ] Grammar parses successfully
- [ ] Shows grammar type or structure
- [ ] No errors

**Issue if any:**
```
[Write any problems here]
```

---

## 12. ✅ Number Base Conversions

### Test Steps:
1. Go to `/numbers`
2. Enter input: `1010`
3. From: **Binary**
4. To: **Hexadecimal**
5. Click "Convert"
6. Try other combinations (Octal ↔ Hex, etc.)

### Expected Results:
- [ ] Conversion succeeds
- [ ] Shows correct output
- [ ] Trace/steps available (if implemented)

**Issue if any:**
```
[Write any problems here]
```

---

## Summary Template

Copy and fill this when reporting:

```
Tested ✅ | Issues ❌
-----------------
[ ] 1. Basic Editor
[ ] 2. Canvas + Guide
[ ] 3. Import/Export
[ ] 4. Simulation
[ ] 5. NFA→DFA
[ ] 6. Minimize
[ ] 7. Regex→NFA
[ ] 8. FA→Regex
[ ] 9. Pumping
[ ] 10. Language
[ ] 11. Parser
[ ] 12. Numbers

Critical Issues:
1. [Issue description]
2. [Issue description]

Minor Issues:
1. [Issue description]
```

---

**Testing Time Estimates:**
- Quick (5 min): Sections 1-4
- Medium (10 min): Add sections 5-7
- Full (20-25 min): All sections
