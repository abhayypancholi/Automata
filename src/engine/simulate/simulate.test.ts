import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { simulate } from './simulate';
import type { Automaton } from '../automaton/types';
import { EPS } from '../automaton/types';
import { normalize } from '../automaton/normalize';
import { arbitraryDFA, arbitraryNFA, naiveAccepts } from '../automaton/testUtils';
import { enumerate } from '../automaton/enumerate';

describe('simulate', () => {
  // Hand-derived DFA example (derivation in comment)
  it('should simulate DFA accepting strings with even number of 0s', () => {
    /**
     * Derivation: DFA for L = { w | w has even number of 0s }
     * States: {even, odd}
     * Start: even (0 zeros seen, even)
     * Accept: {even}
     * Transitions:
     *   even --0--> odd   (saw odd number of 0s)
     *   even --1--> even  (1 doesn't change parity)
     *   odd --0--> even   (saw even number of 0s again)
     *   odd --1--> odd    (1 doesn't change parity)
     * 
     * Test strings:
     * - "" -> even (start) -> ACCEPT
     * - "0" -> even -> odd -> REJECT
     * - "00" -> even -> odd -> even -> ACCEPT
     * - "101" -> even -> even -> odd -> odd -> REJECT
     * - "1001" -> even -> even -> odd -> even -> even -> ACCEPT
     */
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['even', 'odd'],
      alphabet: ['0', '1'],
      start: 'even',
      accepting: ['even'],
      transitions: [
        { from: 'even', symbol: '0', to: 'odd' },
        { from: 'even', symbol: '1', to: 'even' },
        { from: 'odd', symbol: '0', to: 'even' },
        { from: 'odd', symbol: '1', to: 'odd' },
      ],
    };

    // Empty string - accepted (start state is accepting)
    let result = simulate(dfa, '');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
      expect(result.value.trace.steps).toHaveLength(1); // Only start step
      expect(result.value.trace.steps[0]?.data.to).toEqual(['even']);
    }

    // "0" - rejected (odd number)
    result = simulate(dfa, '0');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(false);
      expect(result.value.trace.steps).toHaveLength(2); // Start + 1 symbol
    }

    // "00" - accepted (even number)
    result = simulate(dfa, '00');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
      expect(result.value.trace.steps).toHaveLength(3); // Start + 2 symbols
    }

    // "101" - rejected
    result = simulate(dfa, '101');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(false);
    }

    // "1001" - accepted
    result = simulate(dfa, '1001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
    }
  });

  // Hand-derived NFA with epsilon example
  it('should simulate NFA with epsilon transitions', () => {
    /**
     * Derivation: NFA for L = { w | w ends with "01" or is empty }
     * States: {q0, q1, q2, q3}
     * Start: q0
     * Accept: {q0, q2} (q0 for empty, q2 for ending with "01")
     * Transitions:
     *   q0 --ε--> q3      (start branching)
     *   q3 --0,1--> q3    (read anything)
     *   q3 --0--> q1      (might be start of "01")
     *   q1 --1--> q2      (complete "01")
     * 
     * Test strings:
     * - "" -> {q0, q3} after ε-closure -> ACCEPT (q0 is accepting)
     * - "01" -> ACCEPT
     * - "001" -> ACCEPT
     * - "10" -> REJECT
     */
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q0', 'q2'],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q3' },
        { from: 'q3', symbol: '0', to: 'q3' },
        { from: 'q3', symbol: '1', to: 'q3' },
        { from: 'q3', symbol: '0', to: 'q1' },
        { from: 'q1', symbol: '1', to: 'q2' },
      ],
    };

    // Empty string - accepted (q0 is accepting)
    let result = simulate(nfa, '');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
      expect(result.value.trace.steps[0]?.data.to).toContain('q0');
      expect(result.value.trace.steps[0]?.data.to).toContain('q3');
    }

    // "01" - accepted
    result = simulate(nfa, '01');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
    }

    // "001" - accepted
    result = simulate(nfa, '001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
    }

    // "10" - rejected
    result = simulate(nfa, '10');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(false);
    }
  });

  it('should handle stuck DFA (no transition)', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        // Missing: q0 on 1, q1 on 0, q1 on 1
      ],
    };

    // "1" should get stuck at q0
    const result = simulate(dfa, '1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(false);
      const lastStep = result.value.trace.steps[result.value.trace.steps.length - 1];
      expect(lastStep?.data.stuck).toBe(true);
      expect(lastStep?.explanation).toContain('stuck');
    }
  });

  it('should reject symbol not in alphabet', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const result = simulate(dfa, '012');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SYMBOL_NOT_IN_ALPHABET');
      expect(result.error.message).toContain('2');
      expect(result.error.offset).toBe(2);
    }
  });

  it('should have trace length = input length + 1', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q0' }],
    };

    for (const len of [0, 1, 5, 10]) {
      const input = 'a'.repeat(len);
      const result = simulate(dfa, input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.trace.steps).toHaveLength(len + 1);
      }
    }
  });

  it('should accept empty string when start is accepting after epsilon-closure', () => {
    // NFA: start --ε--> accept
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: EPS, to: 'q1' }],
    };

    const result = simulate(nfa, '');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
    }
  });

  it('should reject empty string when start is not accepting', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [],
    };

    const result = simulate(dfa, '');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(false);
    }
  });

  it('should be deterministic (same input gives same result)', () => {
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

    const input = '101010';
    const result1 = simulate(dfa, input);
    const result2 = simulate(dfa, input);

    expect(result1).toEqual(result2);
  });

  it('should include transitions used in trace', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
    };

    const result = simulate(dfa, 'a');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const step = result.value.trace.steps[1];
      expect(step?.data.transitionsUsed).toEqual([
        { from: 'q0', symbol: 'a', to: 'q1' },
      ]);
    }
  });

  // Oracle test: agree with naive acceptor
  it('should agree with naive acceptor on random DFAs for all strings up to length 5', () => {
    fc.assert(
      fc.property(arbitraryDFA(), (dfa) => {
        const normalized = normalize(dfa);

        if (normalized.alphabet.length === 0) return true;

        const strings = enumerate(normalized.alphabet, 5);

        for (const str of strings) {
          const simResult = simulate(normalized, str);
          const naiveResult = naiveAccepts(normalized, str);

          if (!simResult.ok) {
            // Should not error on valid strings
            return false;
          }

          if (simResult.value.accepted !== naiveResult) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 30 }
    );
  });

  it('should agree with naive acceptor on random NFAs', () => {
    fc.assert(
      fc.property(arbitraryNFA(), (nfa) => {
        const normalized = normalize(nfa);

        if (normalized.alphabet.length === 0) return true;

        const strings = enumerate(normalized.alphabet, 4);

        for (const str of strings) {
          const simResult = simulate(normalized, str);
          const naiveResult = naiveAccepts(normalized, str);

          if (!simResult.ok) {
            return false;
          }

          if (simResult.value.accepted !== naiveResult) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 30 }
    );
  });

  it('should handle NFA with multiple epsilon transitions from one state', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2', 'q3'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q3'],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q0', symbol: EPS, to: 'q2' },
        { from: 'q1', symbol: 'a', to: 'q3' },
        { from: 'q2', symbol: 'a', to: 'q3' },
      ],
    };

    const result = simulate(nfa, 'a');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
      // Start should have epsilon-closure containing q0, q1, q2
      const startStep = result.value.trace.steps[0];
      expect(startStep?.data.to).toContain('q0');
      expect(startStep?.data.to).toContain('q1');
      expect(startStep?.data.to).toContain('q2');
    }
  });

  it('should handle epsilon cycles', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q1', symbol: EPS, to: 'q0' }, // Cycle
        { from: 'q1', symbol: 'a', to: 'q2' },
      ],
    };

    const result = simulate(nfa, 'a');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accepted).toBe(true);
    }
  });
});
