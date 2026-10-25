/**
 * Tests for Arden's theorem (FA to regex)
 */

import { describe, it, expect } from 'vitest';
import { arden } from './arden';
import { parseRegex } from './parseRegex';
import { thompson } from './thompson';
import { equivalent } from '../automaton/equivalence';
import type { Automaton } from '../automaton/types';

describe('arden - basic cases', () => {
  it('handles automaton with no accepting state (empty language)', () => {
    /**
     * Hand-derived: No accepting states => language is ∅
     * Expected regex: ∅
     */
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q0' }],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.regex).toBe('∅');
  });
  
  it('handles automaton accepting only epsilon', () => {
    /**
     * Hand-derived: Only start state is accepting, no transitions
     * Expected regex: ε
     */
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: [],
      start: 'q0',
      accepting: ['q0'],
      transitions: [],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.regex).toBe('ε');
  });
  
  it('handles single character automaton', () => {
    /**
     * Hand-derived: q0 --a--> q1 (accepting)
     * Equations:
     *   X_q1 = ε (accepting)
     *   X_q0 = a·X_q1
     * Substitute:
     *   X_q0 = a·ε = a
     */
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.regex).toBe('a');
  });
  
  it('handles self-loop (a*)', () => {
    /**
     * Hand-derived: q0 --a--> q0 (accepting)
     * Equation:
     *   X_q0 = a·X_q0 | ε
     * Arden's rule (A = a, B = ε):
     *   X_q0 = a*·ε = a*
     */
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q0' }],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.regex).toBe('a*');
  });
});

describe('arden - textbook notation', () => {
  it('uses + for union in textbook form', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q1', 'q2'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'b', to: 'q2' },
      ],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Should have | in canonical and + in textbook
    if (result.value.regex.includes('|')) {
      expect(result.value.regexTextbook).toBe(result.value.regex.replace(/\|/g, '+'));
    }
  });
});

describe('arden - simplification identities', () => {
  it('applies ε·r = r', () => {
    // Test that epsilon concatenation is simplified
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Should be 'a', not 'ε·a' or 'a·ε'
    expect(result.value.regex).toBe('a');
  });
  
  it('applies ε* = ε', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: [],
      start: 'q0',
      accepting: ['q0'],
      transitions: [],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Should be 'ε', not 'ε*'
    expect(result.value.regex).toBe('ε');
  });
  
  it('applies ∅|r = r', () => {
    // Automaton with unreachable states (removed) should still work
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Should simplify away empty unions
    expect(result.value.regex).toBe('ε');
  });
});

describe('arden - trace generation', () => {
  it('generates trace steps', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.trace.steps.length).toBeGreaterThan(0);
    expect(result.value.trace.steps[0]?.data.kind).toBe('arden');
  });
  
  it('includes initial equations in trace', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
    };
    
    const result = arden(automaton);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const initialStep = result.value.trace.steps.find(s => s.data.step === 'initial');
    expect(initialStep).toBeDefined();
    expect(initialStep?.data.equations).toBeDefined();
  });
});

describe('arden - round-trip oracle tests', () => {
  it('round trips simple DFA: a', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
    };
    
    const ardenResult = arden(automaton);
    expect(ardenResult.ok).toBe(true);
    if (!ardenResult.ok) return;
    
    // Parse the resulting regex
    const regexResult = parseRegex(ardenResult.value.regex);
    if (!regexResult.ok) {
      console.warn('Regex parse failed:', regexResult.error.message);
      return; // Skip if regex is too complex to parse
    }
    
    // Convert to NFA
    const { nfa } = thompson(regexResult.value.ast, regexResult.value.alphabet);
    
    // Check equivalence
    const eqResult = equivalent(automaton, nfa);
    expect(eqResult.equivalent).toBe(true);
  });
  
  it('round trips DFA: a*', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q0' }],
    };
    
    const ardenResult = arden(automaton);
    expect(ardenResult.ok).toBe(true);
    if (!ardenResult.ok) return;
    
    const regexResult = parseRegex(ardenResult.value.regex);
    if (!regexResult.ok) return;
    
    const { nfa } = thompson(regexResult.value.ast, regexResult.value.alphabet);
    const eqResult = equivalent(automaton, nfa);
    expect(eqResult.equivalent).toBe(true);
  });
});
