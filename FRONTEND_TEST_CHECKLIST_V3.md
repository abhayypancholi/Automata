# Frontend Testing Checklist V3 - With Critical Fixes

**Updated:** November 12, 2026  
**Includes:** Grammar parser fix, pumping lemma fix, named languages, finiteness info

---

## 🔥 CRITICAL TESTS (Bug Fixes)

### ✅ Grammar Classification Bug Fix
**This was BROKEN - now FIXED**

**Test Input:** `S -> aSb | ab`

**Steps:**
1. Go to `/language`
2. Select "Grammar" tab
3. Enter: `S -> aSb | ab`
4. Click "Identify Language"

**Expected Result:**
- [ ] Class: **Type 2** (Context-Free) ✅ NOT Type 3!
- [ ] Finiteness: **Infinite** ✅
- [ ] Explanation mentions nonterminal in middle

**Also test these variants:**
```
S -> aSb
S -> ab

S -> a S b | a b

S -> aSb | ε
```
All should give **Type 2**, NOT Type 3!

**Issue if any:**
```
[If still shows Type 3, report here]
```

---

### ✅ Named Languages Fix
**This was NOT IMPLEMENTED - now WORKS**

**Steps:**
1. Go to `/language`
2. Select **"Named Language"** tab
3. Select: **aⁿbⁿ** from dropdown
4. Click "Identify Language"

**Expected Result:**
- [ ] Shows all 11 languages in dropdown:
  - aⁿbⁿ
  - aⁿbⁿcⁿ
  - ww
  - wʷ
  - Balanced Parentheses
  - 0ⁿ1ⁿ
  - Palindromes
  - aⁿbᵐ where n=m²
  - aⁿ!
  - Prime Length
  - Perfect Squares
- [ ] Result shows **Type 2**
- [ ] Finiteness: **Infinite**
- [ ] Description and proof sketch display

**Test each language:**
```
[ ] aⁿbⁿ → Type 2, Infinite
[ ] ww → Type 1, Infinite
[ ] Balanced Parens → Type 2, Infinite
```

**Issue if any:**
```
[Report any language that fails]
```

---

### ✅ Pumping Lemma Fix
**This was BROKEN - now FIXED**

**Steps:**
1. Go to `/pumping`
2. Select **"Non-regular"** tab
3. Choose: **aⁿbⁿ**
4. Set p: **3**
5. Click "Test with Pumping Lemma"

**Expected Result:**
- [ ] No "validation error" ✅
- [ ] Shows decompositions
- [ ] Explanation displays
- [ ] All 11 languages work

**Test multiple languages:**
```
[ ] aⁿbⁿ → Works
[ ] aⁿbⁿcⁿ → Works
[ ] ww → Works
```

**Issue if any:**
```
[Report validation errors or broken languages]
```

---

### ✅ Parser Page Fix
**This was NOT SHOWING RESULTS - now WORKS**

**Test Grammar:**
```
E -> E + T | T
T -> T * F | F
F -> ( E ) | id
```

**Steps:**
1. Go to `/parser`
2. Enter grammar above
3. Click "Parse Grammar"

**Expected Result:**
- [ ] Shows parsed structure
- [ ] Displays tokens per line
- [ ] AST appears
- [ ] No blank page

**Issue if any:**
```
[Report if still shows nothing]
```

---

### ✅ Finiteness Information
**This was MISSING - now ADDED**

**Steps:**
1. Test any language classification (automaton/grammar/named)
2. Check result display

**Expected Result:**
- [ ] Shows "Finiteness: Finite" or "Infinite" or "Unknown"
- [ ] Displayed for all classification types

**Issue if any:**
```
[Report if finiteness not showing]
```

---

## 📋 STANDARD TESTS (Already Working)

### 1. Basic Editor
- [ ] Add states
- [ ] Add symbols  
- [ ] Edit state names
- [ ] Edit symbol names
- [ ] Add transitions

### 2. Canvas View
- [ ] Usage guide expands
- [ ] Smooth Bezier edges
- [ ] Self-loops visible
- [ ] Minimap/controls visible
- [ ] Can drag nodes

### 3. Import/Export
- [ ] Import JSON succeeds
- [ ] Export downloads file
- [ ] Canvas shows imported automaton

### 4. Simulation
- [ ] Run simulation works
- [ ] Results table displays
- [ ] View trace button works
- [ ] Play/pause works
- [ ] Step navigation works

### 5. NFA to DFA
- [ ] Conversion succeeds
- [ ] Shows state count
- [ ] Load DFA works
- [ ] Canvas displays result

### 6. DFA Minimization
- [ ] Minimization succeeds
- [ ] Shows minimal state count
- [ ] Load minimal works
- [ ] State mapping visible

### 7. Regex to NFA
- [ ] Enter `a|b` - works without alphabet error ✅
- [ ] Enter `(a|b)*abb` - works
- [ ] Load NFA works

### 8. FA to Regex
- [ ] Conversion succeeds
- [ ] Shows regex result
- [ ] Canonical and textbook formats

### 9. Number Conversions
- [ ] Binary → Hex works
- [ ] Octal → Binary works
- [ ] All combinations work

---

## 🎯 Priority Testing Order

**High Priority (5 min):**
1. Grammar `S -> aSb | ab` → Must show Type 2 ✅
2. Named languages → Must show dropdown ✅
3. Pumping lemma → Must work without errors ✅
4. Parser → Must show results ✅

**Medium Priority (5 min):**
5. Finiteness → Check displays everywhere ✅
6. Simulation trace viewer
7. Canvas visualization

**Low Priority (10 min):**
8. All other features (already working)

---

## 📝 Bug Report Template

If you find issues, report using this format:

```
🐛 BUG: [Feature Name]

Steps:
1. [What you did]
2. [What you clicked]

Expected:
[What should happen]

Actual:
[What actually happened]

Screenshot/Error:
[Paste any error messages]
```

---

## ✅ Summary Template

```
CRITICAL FIXES TESTED:
[ ] Grammar Classification (Type 2 for S -> aSb)
[ ] Named Languages (11 languages work)
[ ] Pumping Lemma (No validation errors)
[ ] Parser Page (Shows results)
[ ] Finiteness Info (Displays everywhere)

STANDARD FEATURES:
[ ] Editor/Canvas
[ ] Simulation
[ ] NFA→DFA
[ ] Minimize
[ ] Regex
[ ] Numbers

ISSUES FOUND:
1. [List any bugs]
2. [With details]
```

---

**Total Test Time:** ~15-20 minutes for comprehensive testing  
**Quick Test:** ~5 minutes for critical fixes only
