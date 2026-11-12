# Grammar Classification Fix Verification

## Test Case 1: `S -> aSb | ab`

**Input (single line with |):**
```
S -> aSb | ab
```

**Expected:** Type 2 (Context-Free)
**Reason:** `S -> aSb` has nonterminal `S` in the middle (not right-linear or left-linear)

## Test Case 2: `S -> aSb` and `S -> ab` (separate lines)

**Input (two lines):**
```
S -> aSb
S -> ab
```

**Expected:** Type 2 (Context-Free)
**Reason:** Same as above

## Test Case 3: Proper tokenization

**Before fix:** `aSb` was treated as single terminal token
**After fix:** `aSb` tokenized as `['a', 'S', 'b']` - three separate symbols

## How to Test:

1. Start dev server: `pnpm dev`
2. Go to http://localhost:3000/language
3. Select "Grammar" tab
4. Enter grammar: `S -> aSb | ab`
5. Click "Identify Language"
6. **Expected Result:**
   - Class: **Type 2**
   - Certainty: Upper bound
   - Finiteness: **Infinite** (or appropriate value)
   - Reasons explain why it's context-free

## Other Fixed Issues:

### Pumping Lemma
- Mode: `nonregular` → `non-regular` ✅
- Language IDs: `a_n_b_n` → `anbn` ✅
- Both formats now accepted

### Named Languages
- Full UI with language picker ✅
- Shows all 11 languages ✅

### Parser
- Returns proper line-by-line structure ✅
- Shows tokens and errors per line ✅

### Language Result
- Now shows finite/infinite info ✅
