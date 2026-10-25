/**
 * Tests for Thompson's construction
 */

import { describe, it, expect } from 'vitest';
import { thompson } from './thompson';
import type { RegexNode } from './types';
import { simulate } from '../simulate';

describe('thompson - basic constructs', () => {
  it('builds NFA for a single literal', () => {
    /**
     * Hand-derived example: literal 'a'
     * 
     * Expected NFA:
     * States: q0 (start), q1 (accept)
     * Transition: q0 -a-> q1
     */
    const ast: RegexNode = { type: 'literal', value: 'a' };
    const result = thompson(ast, ['a']);
    
    expect(result.nfa.kind).toBe('NFA');
    expect(result.nfa.states).toEqual(['q0', 'q1']);
    expect(result.nfa.start).toBe('q0');
    expect(result.nfa.accepting).toEqual(['q1']);
    expect(result.nfa.transitions).toEqual([
      { from: 'q0', symbol: 'a', to: 'q1' },
    ]);
    
    expect(result.trace.steps.length).toBe(1);
    expect(result.trace.steps[0]?.title).toBe("Literal 'a'");
  });
  
  it('builds NFA for epsilon', () => {
    /**
     * Hand-derived example: epsilon (empty string)
     * 
     * Expected NFA:
     * States: q0 (start), q1 (accept)
     * Transition: q0 -ε-> q1
     */
    const ast: RegexNode = { type: 'epsilon' };
    const result = thompson(ast, []);
    
    expect(result.nfa.states).toEqual(['q0', 'q1']);
    expect(result.nfa.start).toBe('q0');
    expect(result.nfa.accepting).toEqual(['q1']);
    expect(result.nfa.transitions).toEqual([
      { from: 'q0', symbol: 'ε', to: 'q1' },
    ]);
  });
  
  it('builds NFA for concatenation ab', () => {
    /**
     * Hand-derived example: ab
     * 
     * Fragment for 'a': q0 -a-> q1
     * Fragment for 'b': q2 -b-> q3
     * Connect: q1 -ε-> q2
     * 
     * Final NFA:
     * Start: q0, Accept: q3
     * Transitions: q0 -a-> q1, q1 -ε-> q2, q2 -b-> q3
     */
    const ast: RegexNode = {
      type: 'concat',
      children: [
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
      ],
    };
    const result = thompson(ast, ['a', 'b']);
    
    expect(result.nfa.start).toBe('q0');
    expect(result.nfa.accepting).toEqual(['q3']);
    expect(result.nfa.transitions).toContainEqual({ from: 'q0', symbol: 'a', to: 'q1' });
    expect(result.nfa.transitions).toContainEqual({ from: 'q1', symbol: 'ε', to: 'q2' });
    expect(result.nfa.transitions).toContainEqual({ from: 'q2', symbol: 'b', to: 'q3' });
    
    // Should have 3 trace steps: literal a, literal b, concat
    expect(result.trace.steps.length).toBe(3);
    expect(result.trace.steps[2]?.title).toBe('Concatenation');
  });
  
  it('builds NFA for union a|b', () => {
    /**
     * Hand-derived example: a|b
     * 
     * Fragment for 'a': q0 -a-> q1
     * Fragment for 'b': q2 -b-> q3
     * New start q4, new accept q5
     * 
     * Transitions:
     * q4 -ε-> q0, q4 -ε-> q2
     * q1 -ε-> q5, q3 -ε-> q5
     * q0 -a-> q1, q2 -b-> q3
     */
    const ast: RegexNode = {
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    };
    const result = thompson(ast, ['a', 'b']);
    
    expect(result.nfa.start).toBe('q4');
    expect(result.nfa.accepting).toEqual(['q5']);
    
    // Check that we have the key epsilon transitions for union
    const epsTransitions = result.nfa.transitions.filter(t => t.symbol === 'ε');
    expect(epsTransitions.length).toBe(4); // Two from start, two to accept
    
    expect(result.trace.steps.length).toBe(3); // literal a, literal b, union
    expect(result.trace.steps[2]?.title).toBe('Union');
  });
  
  it('builds NFA for Kleene star a*', () => {
    /**
     * Hand-derived example: a*
     * 
     * Fragment for 'a': q0 -a-> q1
     * New start q2, new accept q3
     * 
     * Transitions:
     * q2 -ε-> q0 (enter loop)
     * q1 -ε-> q0 (repeat loop)
     * q2 -ε-> q3 (skip loop)
     * q1 -ε-> q3 (exit loop)
     * q0 -a-> q1 (the loop itself)
     */
    const ast: RegexNode = {
      type: 'star',
      child: { type: 'literal', value: 'a' },
    };
    const result = thompson(ast, ['a']);
    
    expect(result.nfa.start).toBe('q2');
    expect(result.nfa.accepting).toEqual(['q3']);
    
    // Check for the characteristic epsilon transitions
    const epsTransitions = result.nfa.transitions.filter(t => t.symbol === 'ε');
    expect(epsTransitions.length).toBe(4);
    
    expect(result.trace.steps.length).toBe(2); // literal a, star
    expect(result.trace.steps[1]?.title).toBe('Kleene Star');
  });
  
  it('builds NFA for plus a+', () => {
    /**
     * a+ is converted to aa*
     */
    const ast: RegexNode = {
      type: 'plus',
      child: { type: 'literal', value: 'a' },
    };
    const result = thompson(ast, ['a']);
    
    // Should accept 'a', 'aa', but not empty string
    const simEmpty = simulate(result.nfa, '');
    expect(simEmpty.ok).toBe(true);
    if (!simEmpty.ok) return;
    expect(simEmpty.value.accepted).toBe(false);
    
    const simA = simulate(result.nfa, 'a');
    expect(simA.ok).toBe(true);
    if (!simA.ok) return;
    expect(simA.value.accepted).toBe(true);
    
    const simAA = simulate(result.nfa, 'aa');
    expect(simAA.ok).toBe(true);
    if (!simAA.ok) return;
    expect(simAA.value.accepted).toBe(true);
  });
  
  it('builds NFA for optional a?', () => {
    /**
     * a? is converted to a|ε
     */
    const ast: RegexNode = {
      type: 'optional',
      child: { type: 'literal', value: 'a' },
    };
    const result = thompson(ast, ['a']);
    
    // Should accept both empty string and 'a'
    const simEmpty = simulate(result.nfa, '');
    expect(simEmpty.ok).toBe(true);
    if (!simEmpty.ok) return;
    expect(simEmpty.value.accepted).toBe(true);
    
    const simA = simulate(result.nfa, 'a');
    expect(simA.ok).toBe(true);
    if (!simA.ok) return;
    expect(simA.value.accepted).toBe(true);
    
    const simAA = simulate(result.nfa, 'aa');
    expect(simAA.ok).toBe(true);
    if (!simAA.ok) return;
    expect(simAA.value.accepted).toBe(false);
  });
  
  it('builds NFA for character class [abc]', () => {
    /**
     * [abc] is converted to a|b|c
     */
    const ast: RegexNode = {
      type: 'class',
      chars: ['a', 'b', 'c'],
    };
    const result = thompson(ast, ['a', 'b', 'c']);
    
    // Should accept 'a', 'b', 'c' but not 'ab'
    const simA = simulate(result.nfa, 'a');
    expect(simA.ok).toBe(true);
    if (!simA.ok) return;
    expect(simA.value.accepted).toBe(true);
    
    const simB = simulate(result.nfa, 'b');
    expect(simB.ok).toBe(true);
    if (!simB.ok) return;
    expect(simB.value.accepted).toBe(true);
    
    const simC = simulate(result.nfa, 'c');
    expect(simC.ok).toBe(true);
    if (!simC.ok) return;
    expect(simC.value.accepted).toBe(true);
    
    const simAB = simulate(result.nfa, 'ab');
    expect(simAB.ok).toBe(true);
    if (!simAB.ok) return;
    expect(simAB.value.accepted).toBe(false);
  });
});

describe('thompson - complex expressions', () => {
  it('builds NFA for (a|b)*', () => {
    const ast: RegexNode = {
      type: 'star',
      child: {
        type: 'union',
        left: { type: 'literal', value: 'a' },
        right: { type: 'literal', value: 'b' },
      },
    };
    const result = thompson(ast, ['a', 'b']);
    
    // Test various strings
    const tests = [
      { input: '', expected: true },
      { input: 'a', expected: true },
      { input: 'b', expected: true },
      { input: 'ab', expected: true },
      { input: 'ba', expected: true },
      { input: 'aabb', expected: true },
    ];
    
    for (const { input, expected } of tests) {
      const sim = simulate(result.nfa, input);
      expect(sim.ok).toBe(true);
      if (!sim.ok) return;
      expect(sim.value.accepted).toBe(expected);
    }
  });
  
  it('builds NFA for a*b*', () => {
    const ast: RegexNode = {
      type: 'concat',
      children: [
        { type: 'star', child: { type: 'literal', value: 'a' } },
        { type: 'star', child: { type: 'literal', value: 'b' } },
      ],
    };
    const result = thompson(ast, ['a', 'b']);
    
    const tests = [
      { input: '', expected: true },
      { input: 'a', expected: true },
      { input: 'b', expected: true },
      { input: 'aab', expected: true },
      { input: 'abb', expected: true },
      { input: 'ba', expected: false },
    ];
    
    for (const { input, expected } of tests) {
      const sim = simulate(result.nfa, input);
      expect(sim.ok).toBe(true);
      if (!sim.ok) return;
      expect(sim.value.accepted).toBe(expected);
    }
  });
  
  it('builds NFA for (a|b)*abb', () => {
    /**
     * Classic example: strings ending with "abb"
     */
    const ast: RegexNode = {
      type: 'concat',
      children: [
        {
          type: 'star',
          child: {
            type: 'union',
            left: { type: 'literal', value: 'a' },
            right: { type: 'literal', value: 'b' },
          },
        },
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
        { type: 'literal', value: 'b' },
      ],
    };
    const result = thompson(ast, ['a', 'b']);
    
    const tests = [
      { input: 'abb', expected: true },
      { input: 'aabb', expected: true },
      { input: 'babb', expected: true },
      { input: 'ab', expected: false },
      { input: 'abba', expected: false },
    ];
    
    for (const { input, expected } of tests) {
      const sim = simulate(result.nfa, input);
      expect(sim.ok).toBe(true);
      if (!sim.ok) return;
      expect(sim.value.accepted).toBe(expected);
    }
  });
});

describe('thompson - state naming and trace', () => {
  it('names states q0, q1, q2, ... in creation order', () => {
    const ast: RegexNode = {
      type: 'concat',
      children: [
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
      ],
    };
    const result = thompson(ast, ['a', 'b']);
    
    // First literal creates q0, q1
    // Second literal creates q2, q3
    expect(result.nfa.states).toContain('q0');
    expect(result.nfa.states).toContain('q1');
    expect(result.nfa.states).toContain('q2');
    expect(result.nfa.states).toContain('q3');
  });
  
  it('includes trace step per node', () => {
    const ast: RegexNode = {
      type: 'concat',
      children: [
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
      ],
    };
    const result = thompson(ast, ['a', 'b']);
    
    // Should have 3 steps: a, b, concat
    expect(result.trace.steps.length).toBe(3);
    expect(result.trace.steps[0]?.data.kind).toBe('thompson');
    expect(result.trace.steps[0]?.data.description).toContain('a');
    expect(result.trace.steps[2]?.title).toBe('Concatenation');
  });
  
  it('resets state counter on each call', () => {
    const ast: RegexNode = { type: 'literal', value: 'a' };
    
    const result1 = thompson(ast, ['a']);
    const result2 = thompson(ast, ['a']);
    
    // Both should start at q0
    expect(result1.nfa.start).toBe('q0');
    expect(result2.nfa.start).toBe('q0');
  });
});

describe('thompson - edge cases', () => {
  it('handles empty concat', () => {
    const ast: RegexNode = {
      type: 'concat',
      children: [],
    };
    const result = thompson(ast, []);
    
    // Empty concat should behave like epsilon
    const sim = simulate(result.nfa, '');
    expect(sim.ok).toBe(true);
    if (!sim.ok) return;
    expect(sim.value.accepted).toBe(true);
  });
  
  it('handles single-element concat', () => {
    const ast: RegexNode = {
      type: 'concat',
      children: [{ type: 'literal', value: 'a' }],
    };
    const result = thompson(ast, ['a']);
    
    const simA = simulate(result.nfa, 'a');
    expect(simA.ok).toBe(true);
    if (!simA.ok) return;
    expect(simA.value.accepted).toBe(true);
    
    const simEmpty = simulate(result.nfa, '');
    expect(simEmpty.ok).toBe(true);
    if (!simEmpty.ok) return;
    expect(simEmpty.value.accepted).toBe(false);
  });
  
  it('handles empty character class', () => {
    const ast: RegexNode = {
      type: 'class',
      chars: [],
    };
    const result = thompson(ast, []);
    
    // Empty class should accept empty string (treated as epsilon)
    const sim = simulate(result.nfa, '');
    expect(sim.ok).toBe(true);
    if (!sim.ok) return;
    expect(sim.value.accepted).toBe(true);
  });
  
  it('handles single-character class', () => {
    const ast: RegexNode = {
      type: 'class',
      chars: ['a'],
    };
    const result = thompson(ast, ['a']);
    
    const simA = simulate(result.nfa, 'a');
    expect(simA.ok).toBe(true);
    if (!simA.ok) return;
    expect(simA.value.accepted).toBe(true);
    
    const simEmpty = simulate(result.nfa, '');
    expect(simEmpty.ok).toBe(true);
    if (!simEmpty.ok) return;
    expect(simEmpty.value.accepted).toBe(false);
  });
});
