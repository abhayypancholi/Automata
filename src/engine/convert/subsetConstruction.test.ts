import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { subsetConstruction } from './subsetConstruction';
import type { Automaton } from '../automaton/types';
import { EPS } from '../automaton/types';
import { equivalent } from '../automaton/equivalence';
import { arbitraryNFA } from '../automaton/testUtils';
import { enumerate } from '../automaton/enumerate';
import { naiveAccepts } from '../automaton/testUtils';

describe('subsetConstruction', () => {
  // Hand-derived example with complete derivation
  it('should convert NFA accepting strings ending with "01"', () => {
    /**
     * Derivation: NFA for L = { w | w ends with "01" }
     * 
     * NFA:
     *   States: {q0, q1, q2}
     *   Start: q0
     *   Accept: {q2}
     *   Transitions:
     *     q0 --0--> q0 (self-loop, read anything)
     *     q0 --1--> q0 (self-loop, read anything)
     *     q0 --0--> q1 (might be start of "01")
     *     q1 --1--> q2 (complete "01")
     * 
     * Subset construction by hand:
     * 
     * Initial: ε-closure({q0}) = {q0}
     * 
     * Processing {q0}:
     *   On '0': move({q0}, 0) = {q0, q1}, ε-closure = {q0, q1} (NEW)
     *   On '1': move({q0}, 1) = {q0}, ε-closure = {q0} (seen)
     * 
     * Processing {q0, q1}:
     *   On '0': move({q0,q1}, 0) = {q0, q1}, ε-closure = {q0, q1} (seen)
     *   On '1': move({q0,q1}, 1) = {q0, q2}, ε-closure = {q0, q2} (NEW)
     * 
     * Processing {q0, q2}:
     *   On '0': move({q0,q2}, 0) = {q0, q1}, ε-closure = {q0, q1} (seen)
     *   On '1': move({q0,q2}, 1) = {q0}, ε-closure = {q0} (seen)
     * 
     * DFA states: {q0}, {q0,q1}, {q0,q2}
     * DFA start: {q0}
     * DFA accept: {{q0,q2}} (contains q2)
     * 
     * Verify:
     *   "01" -> {q0} --0--> {q0,q1} --1--> {q0,q2} ACCEPT
     *   "10" -> {q0} --1--> {q0} --0--> {q0,q1} REJECT
     *   "001" -> {q0} --0--> {q0,q1} --0--> {q0,q1} --1--> {q0,q2} ACCEPT
     */
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q0' },
        { from: 'q0', symbol: '1', to: 'q0' },
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q1', symbol: '1', to: 'q2' },
      ],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { dfa, trace, stateMapping } = result.value;

    // DFA should have 3 states
    expect(dfa.states).toHaveLength(3);

    // Verify state names contain expected subsets
    expect(stateMapping.size).toBe(3);
    const subsets = Array.from(stateMapping.values()).map((s) => s.sort().join(','));
    expect(subsets).toContain('q0');
    expect(subsets).toContain('q0,q1');
    expect(subsets).toContain('q0,q2');

    // Find accepting state (contains q2)
    let acceptingState: string | undefined;
    for (const [stateName, subset] of stateMapping.entries()) {
      if (subset.includes('q2')) {
        acceptingState = stateName;
        break;
      }
    }
    expect(acceptingState).toBeDefined();
    expect(dfa.accepting).toContain(acceptingState!);

    // Trace should show the construction steps
    expect(trace.steps.length).toBeGreaterThan(0);
    expect(trace.steps[0]?.data.stepType).toBe('initial');
    expect(trace.steps[trace.steps.length - 1]?.data.stepType).toBe('complete');

    // Verify equivalence
    const equivResult = equivalent(nfa, dfa);
    expect(equivResult.equivalent).toBe(true);
  });

  it('should handle NFA with epsilon transitions', () => {
    /**
     * Simple epsilon NFA:
     * q0 --ε--> q1 --a--> q2
     * 
     * Subset construction:
     * Initial: ε-closure({q0}) = {q0, q1}
     * 
     * Processing {q0, q1}:
     *   On 'a': move({q0,q1}, a) = {q2}, ε-closure = {q2} (NEW)
     * 
     * Processing {q2}:
     *   On 'a': move({q2}, a) = {}, ε-closure = {} (NEW, dead state)
     * 
     * DFA states: {q0,q1}, {q2}, {}
     * DFA start: {q0,q1}
     * DFA accept: {{q2}}
     */
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
      ],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { dfa, stateMapping } = result.value;

    // Start state should be {q0, q1}
    const startSubset = stateMapping.get(dfa.start);
    expect(startSubset?.sort()).toEqual(['q0', 'q1']);

    // Empty set should be reachable
    const hasEmptySet = Array.from(stateMapping.values()).some(
      (s) => s.length === 0
    );
    expect(hasEmptySet).toBe(true);

    // Equivalence check
    const equivResult = equivalent(nfa, dfa);
    expect(equivResult.equivalent).toBe(true);
  });

  it('should handle case where empty set is NOT reachable', () => {
    /**
     * NFA that is already complete (no dead transitions):
     * q0 --a--> q0
     * q0 --b--> q0
     * 
     * Subset construction:
     * Initial: {q0}
     * Processing {q0}:
     *   On 'a': {q0} (seen)
     *   On 'b': {q0} (seen)
     * 
     * DFA has only one state: {q0}
     * Empty set is not reachable
     */
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q0' },
        { from: 'q0', symbol: 'b', to: 'q0' },
      ],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { dfa, stateMapping } = result.value;

    // Should have only 1 state
    expect(dfa.states).toHaveLength(1);

    // Empty set should not be reachable
    const hasEmptySet = Array.from(stateMapping.values()).some(
      (s) => s.length === 0
    );
    expect(hasEmptySet).toBe(false);
  });

  it('should mark DFA state accepting iff subset contains NFA accepting state', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1', 'q2'], // Multiple accepting states
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
      ],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { dfa, stateMapping } = result.value;

    // Check each DFA state
    for (const dfaState of dfa.states) {
      const subset = stateMapping.get(dfaState)!;
      const shouldBeAccepting =
        subset.includes('q1') || subset.includes('q2');
      const isAccepting = dfa.accepting.includes(dfaState);

      expect(isAccepting).toBe(shouldBeAccepting);
    }
  });

  it('should handle single-state NFA', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { dfa } = result.value;

    // Should result in a simple DFA
    expect(dfa.states.length).toBeGreaterThan(0);
    expect(equivalent(nfa, dfa).equivalent).toBe(true);
  });

  it('should exceed limit for exponential blowup NFA', () => {
    /**
     * Classic "n-th symbol from the end is 1" NFA with large n
     * This requires 2^n DFA states
     * 
     * For n=11: needs 2048 states, exceeds limit of 1024
     */
    const n = 11;
    const states = Array.from({ length: n + 1 }, (_, i) => `q${i}`);
    const nfa: Automaton = {
      kind: 'NFA',
      states,
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: [`q${n}`],
      transitions: [
        // Self-loop on both symbols at start
        { from: 'q0', symbol: '0', to: 'q0' },
        { from: 'q0', symbol: '1', to: 'q0' },
        // Nondeterministic branch to start counting
        { from: 'q0', symbol: '1', to: 'q1' },
        // Then read exactly n-1 more symbols
        ...Array.from({ length: n - 1 }, (_, i) => [
          { from: `q${i + 1}`, symbol: '0', to: `q${i + 2}` },
          { from: `q${i + 1}`, symbol: '1', to: `q${i + 2}` },
        ]).flat(),
      ],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe('LIMIT_EXCEEDED');
      expect(result.error.message).toContain('1024');
    }
  });

  it('should count steps correctly', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'b', to: 'q0' },
      ],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { trace, stateMapping } = result.value;

    // Steps = 1 (initial) + (# subsets × # alphabet symbols) + 1 (complete)
    const numSubsets = stateMapping.size;
    const numSymbols = nfa.alphabet.length;
    const expectedSteps = 1 + numSubsets * numSymbols + 1;

    expect(trace.steps).toHaveLength(expectedSteps);
  });

  // Oracle tests
  it('should produce language-equivalent DFA (property test)', () => {
    fc.assert(
      fc.property(arbitraryNFA(), (nfa) => {
        const result = subsetConstruction(nfa);

        if (!result.ok) {
          // Limit exceeded is acceptable
          return result.error.code === 'LIMIT_EXCEEDED';
        }

        const { dfa } = result.value;

        // Check equivalence
        const equivResult = equivalent(nfa, dfa);
        return equivResult.equivalent === true;
      }),
      { numRuns: 30 }
    );
  });

  it('should agree with naive acceptor on all strings up to length 6', () => {
    fc.assert(
      fc.property(arbitraryNFA(), (nfa) => {
        if (nfa.alphabet.length === 0) return true;

        const result = subsetConstruction(nfa);

        if (!result.ok) {
          // Limit exceeded is ok for this test
          return result.error.code === 'LIMIT_EXCEEDED';
        }

        const { dfa } = result.value;

        const strings = enumerate(nfa.alphabet, 6);

        for (const str of strings) {
          const nfaAccepts = naiveAccepts(nfa, str);
          const dfaAccepts = naiveAccepts(dfa, str);

          if (nfaAccepts !== dfaAccepts) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 20 }
    );
  });

  it('should handle epsilon cycles in NFA', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: EPS, to: 'q1' },
        { from: 'q1', symbol: EPS, to: 'q0' }, // Epsilon cycle
        { from: 'q1', symbol: 'a', to: 'q2' },
      ],
    };

    const result = subsetConstruction(nfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    // Start should include both q0 and q1 due to epsilon cycle
    const startSubset = result.value.stateMapping.get(result.value.dfa.start);
    expect(startSubset?.sort()).toEqual(['q0', 'q1']);
  });

  it('should produce deterministic results (same NFA gives same DFA)', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'a', to: 'q0' },
      ],
    };

    const result1 = subsetConstruction(nfa);
    const result2 = subsetConstruction(nfa);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);

    if (!result1.ok || !result2.ok) return;

    // DFAs should be identical (after normalization, which is already applied)
    expect(result1.value.dfa).toEqual(result2.value.dfa);
  });
});
