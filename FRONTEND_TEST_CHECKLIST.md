# Frontend Testing Checklist

## Critical Fixes Applied

### 1. ✅ Can Now Type Transition Targets
**Issue:** Typing "q1" in transition cell was ignored because it filtered out non-existent states
**Fix:** Removed the filter `automaton.states.includes(t)` and auto-create states when typing

**Test:**
1. Go to http://localhost:3000/simulate
2. Click "Add State" button (creates q0)
3. Click "Add Symbol" button (creates 'a')
4. In the transition table, find the cell for q0 on 'a'
5. **Type "q1"** in that cell
6. Press Tab or click away
7. ✅ **Result:** q1 should auto-create and appear as a new state row

### 2. ✅ Can Now Edit State Names
**Issue:** State names were static text, not editable
**Fix:** Changed state name cells to input fields with onChange handler

**Test:**
1. Go to http://localhost:3000/simulate
2. Click "Add State" twice (creates q0, q1)
3. Click on the state name "q0" in the first column
4. **Change it to "start"**
5. Press Tab or click away
6. ✅ **Result:** State renamed to "start", all transitions updated

### 3. ⚠️ Symbol Editing - Not Fully Editable
**Current Behavior:** Symbols can be added (Add Symbol button) and removed (× button) but not renamed inline

**Reason:** Renaming symbols requires updating all transitions system-wide. Not implemented yet.

**Workaround:**
1. Click × to remove old symbol
2. Click "Add Symbol" to add new symbol
3. Re-enter transitions

---

## Complete Testing Guide

### Test 1: Create Simple DFA from Scratch

**Goal:** Build a DFA that accepts strings ending in 'a'

1. Navigate to http://localhost:3000/simulate
2. Switch to **Table view** (should be default)
3. Click "Add State" → creates q0
4. Click "Add State" → creates q1  
5. Click "Add Symbol" → creates 'a'
6. Click "Add Symbol" → creates 'b'

7. **Edit State Names:**
   - Click on "q0", change to "S0"
   - Click on "q1", change to "S1"
   - Verify names update

8. **Set Start State:**
   - Click radio button in "Start" column for S0

9. **Set Accepting State:**
   - Check checkbox in "Accept" column for S1

10. **Enter Transitions:**
    - S0 on 'a' → type "S1"
    - S0 on 'b' → type "S0"
    - S1 on 'a' → type "S1"
    - S1 on 'b' → type "S0"

11. Switch to **Canvas view** to see the graph

12. **Test Simulation:**
    - Enter test string: "bba"
    - Click "Simulate"
    - Should accept (ends in 'a')

### Test 2: Create NFA with Epsilon Transitions

1. Go to http://localhost:3000/simulate
2. Switch to Table view
3. Click "NFA" button (toggle kind)
4. Click "Add State" 3 times → q0, q1, q2
5. Click "Add Symbol" 2 times → a, b
6. Notice **ε column** appears (epsilon for NFA)

7. **Enter NFA Transitions (comma-separated):**
   - q0 on 'a' → type "q0, q1" (goes to both states)
   - q0 on ε → type "q2"
   - q1 on 'b' → type "q2"
   - q2 on 'a' → type "q2"

8. Set q0 as start, q2 as accepting
9. Verify multi-target transitions work

### Test 3: Auto-Create States via Transitions

1. Go to http://localhost:3000/simulate
2. Click "Add State" once → q0
3. Click "Add Symbol" once → a
4. In transition cell for q0 on 'a':
   - **Type "accept"** (state that doesn't exist yet)
   - Press Tab
   - ✅ **Verify:** New state "accept" appears in table

5. Add more non-existent states via transitions:
   - Type "reject", "loop", "final"
   - All should auto-create

### Test 4: Rename States with Transitions

1. Create: q0 → q1 → q2 with transitions
2. Rename q1 to "middle"
3. ✅ **Verify:** All transitions FROM and TO q1 now use "middle"

### Test 5: Import/Export JSON

1. Build a simple automaton
2. Click "Export JSON"
3. Save file
4. Modify JSON in text editor (change state names)
5. Click "Import JSON"
6. Load modified file
7. ✅ **Verify:** Changes reflected in table

### Test 6: Cross-Page Features

**Minimize Page:**
1. Go to /minimize
2. Create a DFA
3. Click "Minimize DFA"
4. Toggle "Show dead state"
5. Click "Load minimal DFA into editor"
6. ✅ **Verify:** Automaton loaded back

**NFA to DFA Page:**
1. Go to /nfa-to-dfa
2. Create an NFA
3. Click "Convert to DFA"
4. Toggle "Use simple names (A, B, C...)"
5. Click "Load DFA into editor"
6. ✅ **Verify:** Renamed states appear

---

## Known Working Features

✅ Add/Delete States
✅ Add/Delete Symbols  
✅ Set Start State (radio button)
✅ Toggle Accepting States (checkbox)
✅ **Enter Transitions (now works with auto-create)**
✅ **Rename States (now editable)**
✅ Switch DFA/NFA
✅ Epsilon transitions for NFA
✅ Multi-target NFA transitions (comma-separated)
✅ Import/Export JSON
✅ Canvas visualization
✅ Table editing

## Known Limitations

⚠️ **Symbols not inline-editable** - Must remove and re-add
⚠️ **No undo/redo** - Use browser refresh to reset
⚠️ **Validation errors** - Only shown when incomplete DFA

---

## Quick Smoke Test (2 minutes)

Run this to verify all critical functions work:

```
1. Open http://localhost:3000/simulate
2. Table view should be visible
3. Click "Add State" → q0 appears ✓
4. Click "Add Symbol" → 'a' appears ✓  
5. Type "q1" in the q0/'a' cell → q1 auto-creates ✓
6. Click q0 state name, change to "start" → renames ✓
7. Click Start radio for 'start' → sets start ✓
8. Check Accept checkbox for q1 → sets accepting ✓
9. Switch to Canvas view → graph visible ✓
10. Enter "a" in test input, click Simulate → accepts ✓
```

If all 10 steps pass → Frontend working correctly!

---

## Reporting Issues

If something doesn't work:

1. Open browser console (F12)
2. Look for errors (red text)
3. Copy the error message
4. Note which step failed
5. Report with screenshot if possible

**Common Issues:**
- "Cannot read property" → State management issue
- "X is not a function" → Missing function in store
- Input not updating → Event handler not connected
- Canvas not showing → ReactFlow rendering issue
