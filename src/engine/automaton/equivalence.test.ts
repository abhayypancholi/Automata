import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { equivalent } from './equivalence';
import type { Automaton } from './types';
import { EPS } from './types';
import { normalize } from './normalize';
import { arbitraryDFA, arbitraryNFA, naiveAccepts } from './testUtils';
import { enumerate } from './enumerate';

describe('equivalent', () => {
  it('should return true for identical automata', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q0', symbol: '1', to: 'q0' },
        { from: 'q1', symbol: '0', to: 'q1' },
        { from: 'q1', symbol: '1', to: 'q0' },
      ],
    };

    const result = equivalent(dfa, dfa);
    expect(result.equivalent).toBe(true);
  });

  it('should return true for renamed copies', () => {
    const dfa1: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q0', symbol: '1', to: 'q0' },
        { from: 'q1', symbol: '0', to: 'q1' },
        { from: 'q1', symbol: '1', to: 'q0' },
      ],
    };

    // Same automaton with different state names
    const dfa2: Automaton = {
      kind: 'DFA',
      states: ['a', 'b'],
      alphabet: ['0', '1'],
      start: 'a',
      accepting: ['b'],
      transitions: [
        { from: 'a', symbol: '0', to: 'b' },
        { from: 'a', symbol: '1', to: 'a' },
        { from: 'b', symbol: '0', to: 'b' },
        { from: 'b', symbol: '1', to: 'a' },
      ],
    };

    const result = equivalent(dfa1, dfa2);
    expect(result.equivalent).toBe(true);
  });

  it('should detect different languages with empty string counterexample', () => {
    const dfa1: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['0'],
      start: 'q0',
      accepting: ['q0'], // Accepts empty string
      transitions: [],
    };

    const dfa2: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [], // Rejects everything
      transitions: [],
    };

    const result = equivalent(dfa1, dfa2);
    expect(result.equivalent).toBe(false);
    if (!result.equivalent) {
      expect(result.counterexample).toBe('');
    }
  });

  it('should find shortest counterexample', () => {
    // DFA1: accepts strings with even number of 0s (including empty string)
    const dfa1: Automaton = {
      kind: 'DFA',
      states: ['even', 'odd'],
      alphabet: ['0'],
      start: 'even',
      accepting: ['even'],
      transitions: [
        { from: 'even', symbol: '0', to: 'odd' },
        { from: 'odd', symbol: '0', to: 'even' },
      ],
    };

    // DFA2: accepts strings with odd number of 0s (does NOT accept empty string)
    const dfa2: Automaton = {
      kind: 'DFA',
      states: ['even', 'odd'],
      alphabet: ['0'],
      start: 'even',
      accepting: ['odd'],
      transitions: [
        { from: 'even', symbol: '0', to: 'odd' },
        { from: 'odd', symbol: '0', to: 'even' },
      ],
    };

    const result = equivalent(dfa1, dfa2);
    expect(result.equivalent).toBe(false);
    if (!result.equivalent) {
      // Counterexample should be empty string (accepted by dfa1, rejected by dfa2)
      // OR "0" (accepted by dfa2, rejected by dfa1)
      // BFS finds empty string first since it's shorter
      expect(result.counterexample).toBe('');
    }
  });

  it('should handle NFA with epsilon transitions', () => {
    // NFA: start --ε--> accept
    const nfa1: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: EPS, to: 'q1' }],
    };

    // DFA: start is accepting (equivalent to nfa1)
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['0'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [],
    };

    const result = equivalent(nfa1, dfa);
    expect(result.equivalent).toBe(true);
  });

  it('should handle union of alphabets', () => {
    const dfa1: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const dfa2: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['b'],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    // Both reject all strings (empty language)
    const result = equivalent(dfa1, dfa2);
    expect(result.equivalent).toBe(true);
  });

  // Property-based tests
  it('should be reflexive (automaton equivalent to itself)', () => {
    fc.assert(
      fc.property(arbitraryDFA(), (dfa) => {
        const result = equivalent(dfa, dfa);
        return result.equivalent === true;
      }),
      { numRuns: 20 }
    );
  });

  it('should be symmetric', () => {
    fc.assert(
      fc.property(arbitraryDFA(), arbitraryDFA(), (dfa1, dfa2) => {
        const result1 = equivalent(dfa1, dfa2);
        const result2 = equivalent(dfa2, dfa1);
        return result1.equivalent === result2.equivalent;
      }),
      { numRuns: 20 }
    );
  });

  it('should agree with naive acceptor on all strings up to length 4', () => {
    fc.assert(
      fc.property(arbitraryDFA(), arbitraryDFA(), (dfa1, dfa2) => {
        const normalized1 = normalize(dfa1);
        const normalized2 = normalize(dfa2);

        // Build union alphabet
        const alphabetSet = new Set([
          ...normalized1.alphabet,
          ...normalized2.alphabet,
        ]);
        const alphabet = Array.from(alphabetSet);

        if (alphabet.length === 0) return true;

        const strings = enumerate(alphabet, 4);

        const equivResult = equivalent(normalized1, normalized2);

        for (const str of strings) {
          const accepts1 = naiveAccepts(normalized1, str);
          const accepts2 = naiveAccepts(normalized2, str);

          if (accepts1 !== accepts2) {
            // Languages differ, so equivalent should say false
            return equivResult.equivalent === false;
          }
        }

        // All tested strings agree; we can't prove equivalence from finite tests
        // but if equivalent says they differ, it should provide a counterexample
        // we can verify
        if (!equivResult.equivalent) {
          const counter = equivResult.counterexample;
          const accepts1 = naiveAccepts(normalized1, counter);
          const accepts2 = naiveAccepts(normalized2, counter);
          return accepts1 !== accepts2;
        }

        return true;
      }),
      { numRuns: 20 }
    );
  });

  it('should handle NFAs with epsilon transitions in property tests', () => {
    fc.assert(
      fc.property(arbitraryNFA(), (nfa) => {
        const normalized = normalize(nfa);
        const result = equivalent(normalized, normalized);
        return result.equivalent === true;
      }),
      { numRuns: 20 }
    );
  });
});
