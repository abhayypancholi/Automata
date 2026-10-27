/**
 * Tests for pumping lemma engine
 */

import { describe, it, expect } from 'vitest';
import { pumpNonRegular, pumpRegular } from './pumping';
import type { Automaton } from '../automaton/types';

describe('pumping - non-regular mode', () => {
  it('a^n b^n with p=3 generates correct number of decompositions', () => {
    /**
     * For p=3, witness is "aaabbb" (length 6)
     * Decompositions with |xy| ≤ 3 and |y| ≥ 1:
     * 
     * xyLength=1: x="", y="a", z="aabbb" → 1 decomposition
     * xyLength=2: x="", y="aa", z="abbb" → 1 decomposition
     *             x="a", y="a", z="abbb" → 1 decomposition
     * xyLength=3: x="", y="aaa", z="bbb" → 1 decomposition
     *             x="a", y="aa", z="bbb" → 1 decomposition
     *             x="aa", y="a", z="bbb" → 1 decomposition
     * 
     * Total: 6 decompositions
     * 
     * Each should fail because pumping y changes the number of a's but not b's,
     * breaking the a^n b^n pattern.
     */
    
    const result = pumpNonRegular('anbn', 3);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.decompositions).toHaveLength(6);
    expect(result.value.allDecompositionsFail).toBe(true);
    
    // Every decomposition should have a failing i
    for (const decomp of result.value.decompositions) {
      expect(decomp.failingI).not.toBeNull();
      expect(typeof decomp.failingI).toBe('number');
    }
  });
  
  it('a^n b^n: every decomposition fails to pump', () => {
    const result = pumpNonRegular('anbn', 3);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Check specific decompositions
    const decomps = result.value.decompositions;
    
    // All y values are in the 'a' region (since |xy| ≤ 3 and witness starts with 'aaa')
    // Pumping any of them will create imbalance
    for (const decomp of decomps) {
      // y should be all a's
      expect(decomp.y).toMatch(/^a+$/);
      // Should fail (i=0 removes y, creating fewer a's than b's)
      expect(decomp.failingI).toBe(0);
    }
  });
  
  it('rejects invalid language id', () => {
    const result = pumpNonRegular('nonexistent', 3);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.message).toContain('Unknown language');
  });
  
  it('validates witness length', () => {
    // Create a scenario where witness would be too short
    // This shouldn't happen with our implementation, but test the check
    const result = pumpNonRegular('anbn', 100);
    
    // Our witness function should handle this, but if it doesn't:
    if (!result.ok) {
      expect(result.error.message).toContain('too short');
    }
  });
  
  it('handles ww^R (even palindromes) with p=2', () => {
    const result = pumpNonRegular('wwR', 2);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.allDecompositionsFail).toBe(true);
    expect(result.value.decompositions.length).toBeGreaterThan(0);
  });
  
  it('handles a^n b^n c^n with p=2', () => {
    const result = pumpNonRegular('anbncn', 2);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.allDecompositionsFail).toBe(true);
  });
  
  it('handles a^n b^n c^n with various p values', () => {
    for (let p = 2; p <= 5; p++) {
      const result = pumpNonRegular('anbncn', p);
      
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      
      expect(result.value.allDecompositionsFail).toBe(true);
      expect(result.value.p).toBe(p);
    }
  });
  
  it('handles ww^R with various p values', () => {
    for (let p = 2; p <= 5; p++) {
      const result = pumpNonRegular('wwR', p);
      
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      
      expect(result.value.allDecompositionsFail).toBe(true);
      expect(result.value.p).toBe(p);
    }
  });
});

describe('pumping - regular mode', () => {
  it('works on a hand-built DFA with hand-derived x, y, z', () => {
    /**
     * DFA for a*b*:
     * States: q0 (start, accepting), q1 (accepting), q2 (dead, not accepting)
     * Transitions:
     *   q0 --a--> q0
     *   q0 --b--> q1
     *   q1 --a--> q2 (once we see b, can't go back to a)
     *   q1 --b--> q1
     *   q2 --a--> q2
     *   q2 --b--> q2
     * 
     * For string w = "aaab" (length 4), p = 3 states
     * Trace: q0 --a--> q0 --a--> q0 --a--> q0 --b--> q1
     * States visited: [q0, q0, q0, q0, q1]
     * First p+1 = 4 states: [q0, q0, q0, q0]
     * Cycle: q0 appears multiple times
     * 
     * One valid decomposition: x="", y="aa", z="ab"
     * (or x="a", y="a", z="ab", etc.)
     */
    
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q0', 'q1'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q0' },
        { from: 'q0', symbol: 'b', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
        { from: 'q1', symbol: 'b', to: 'q1' },
        { from: 'q2', symbol: 'a', to: 'q2' },
        { from: 'q2', symbol: 'b', to: 'q2' },
      ],
    };
    
    const result = pumpRegular(dfa, 'aaab');
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.mode).toBe('regular');
    expect(result.value.p).toBe(3);
    expect(result.value.witness).toBe('aaab');
    
    // Should find a decomposition
    expect(result.value.decompositions).toHaveLength(1);
    const decomp = result.value.decompositions[0]!;
    
    // y should be non-empty and within first p characters
    expect(decomp.y.length).toBeGreaterThan(0);
    expect((decomp.x + decomp.y).length).toBeLessThanOrEqual(3);
    
    // All pumped strings should be accepted (since 'aaab' is in a*b*)
    expect(decomp.pumpingResults).toBeDefined();
    for (const pumpResult of decomp.pumpingResults!) {
      expect(pumpResult.accepted).toBe(true);
    }
  });
  
  it('rejects string shorter than p', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2', 'q3', 'q4'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q4'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
        { from: 'q2', symbol: 'a', to: 'q3' },
        { from: 'q3', symbol: 'a', to: 'q4' },
      ],
    };
    
    // p = 5 states, string "aa" has length 2 < 5
    const result = pumpRegular(dfa, 'aa');
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.message).toContain('too short');
    expect(result.error.message).toContain('only applies');
  });
  
  it('works on rejected strings', () => {
    // DFA that accepts only "ab"
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'b', to: 'q3' },
        { from: 'q1', symbol: 'a', to: 'q3' },
        { from: 'q1', symbol: 'b', to: 'q2' },
        { from: 'q2', symbol: 'a', to: 'q3' },
        { from: 'q2', symbol: 'b', to: 'q3' },
        { from: 'q3', symbol: 'a', to: 'q3' },
        { from: 'q3', symbol: 'b', to: 'q3' },
      ],
    };
    
    // String "aaaa" (length 4 ≥ p=4) is rejected
    const result = pumpRegular(dfa, 'aaaa');
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const decomp = result.value.decompositions[0]!;
    
    // All pumped strings should also be rejected
    for (const pumpResult of decomp.pumpingResults!) {
      expect(pumpResult.accepted).toBe(false);
    }
  });
});

describe('pumping - oracle tests', () => {
  it('regular mode: xy^i z acceptance equals w acceptance for i in 0..5', () => {
    // Test on a simple DFA: a* (accepts any number of a's)
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q0' },
        { from: 'q0', symbol: 'b', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'b', to: 'q1' },
      ],
    };
    
    // Test accepted string
    const acceptedResult = pumpRegular(dfa, 'aaaa');
    expect(acceptedResult.ok).toBe(true);
    if (!acceptedResult.ok) return;
    
    const decomp = acceptedResult.value.decompositions[0]!;
    for (const pumpResult of decomp.pumpingResults!) {
      expect(pumpResult.accepted).toBe(true);
    }
    
    // Test rejected string
    const rejectedResult = pumpRegular(dfa, 'aaab');
    expect(rejectedResult.ok).toBe(true);
    if (!rejectedResult.ok) return;
    
    const decomp2 = rejectedResult.value.decompositions[0]!;
    for (const pumpResult of decomp2.pumpingResults!) {
      expect(pumpResult.accepted).toBe(false);
    }
  });
});
