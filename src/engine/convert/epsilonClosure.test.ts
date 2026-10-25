import { describe, it, expect } from 'vitest';
import { epsilonClosure, epsilonClosureSingle } from './epsilonClosure';
import type { Automaton } from '../automaton/types';
import { EPS } from '../automaton/types';

describe('epsilonClosure', () => {
  it('should return input set when no epsilon transitions exist', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
      ],
    };

    const closure = epsilonClosure(new Set(['q0']), nfa);
    expect(Array.from(closure).sort()).toEqual(['q0']);
  });

  it('should include states reachable via single epsilon transition', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
      ],
    };

    const closure = epsilonClosure(new Set(['q0']), nfa);
    expect(Array.from(closure).sort()).toEqual(['q0', 'q1']);
  });

  it('should handle epsilon cycles correctly', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q1', symbol: EPS, to: 'q2' },
        { from: 'q2', symbol: EPS, to: 'q0' }, // Cycle
      ],
    };

    const closure = epsilonClosure(new Set(['q0']), nfa);
    expect(Array.from(closure).sort()).toEqual(['q0', 'q1', 'q2']);
  });

  it('should handle empty input set', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: EPS, to: 'q1' }],
    };

    const closure = epsilonClosure(new Set([]), nfa);
    expect(Array.from(closure)).toEqual([]);
  });

  it('should handle multiple input states', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q2' },
        { from: 'q1', symbol: EPS, to: 'q3' },
      ],
    };

    const closure = epsilonClosure(new Set(['q0', 'q1']), nfa);
    expect(Array.from(closure).sort()).toEqual(['q0', 'q1', 'q2', 'q3']);
  });

  it('should handle chain of epsilon transitions', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2', 'q3', 'q4'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q1', symbol: EPS, to: 'q2' },
        { from: 'q2', symbol: EPS, to: 'q3' },
        { from: 'q3', symbol: EPS, to: 'q4' },
      ],
    };

    const closure = epsilonClosure(new Set(['q0']), nfa);
    expect(Array.from(closure).sort()).toEqual(['q0', 'q1', 'q2', 'q3', 'q4']);
  });

  it('should handle branching epsilon transitions', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q0', symbol: EPS, to: 'q2' },
        { from: 'q0', symbol: EPS, to: 'q3' },
      ],
    };

    const closure = epsilonClosure(new Set(['q0']), nfa);
    expect(Array.from(closure).sort()).toEqual(['q0', 'q1', 'q2', 'q3']);
  });

  it('should handle diamond pattern', () => {
    /**
     * q0 --ε--> q1 --ε--> q3
     *   \              /
     *    ε-> q2 --ε-->
     */
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q0', symbol: EPS, to: 'q2' },
        { from: 'q1', symbol: EPS, to: 'q3' },
        { from: 'q2', symbol: EPS, to: 'q3' },
      ],
    };

    const closure = epsilonClosure(new Set(['q0']), nfa);
    expect(Array.from(closure).sort()).toEqual(['q0', 'q1', 'q2', 'q3']);
  });
});

describe('epsilonClosureSingle', () => {
  it('should work as convenience wrapper for single state', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: EPS, to: 'q1' }],
    };

    const closure = epsilonClosureSingle('q0', nfa);
    expect(Array.from(closure).sort()).toEqual(['q0', 'q1']);
  });
});
