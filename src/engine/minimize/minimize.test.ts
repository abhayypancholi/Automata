import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { minimize } from './minimize';
import type { Automaton } from '../automaton/types';
import { equivalent } from '../automaton/equivalence';
import { normalize } from '../automaton/normalize';
import { arbitraryDFA } from '../automaton/testUtils';
import { countEquivalenceClasses } from '../__reference__/tableFilling';

describe('minimize', () => {
  // Hand-derived example with complete partition derivation
  it('should minimize DFA with redundant states', () => {
    /**
     * Derivation: DFA for L = { w | w contains "01" }
     * 
     * Original DFA (non-minimal):
     *   States: {q0, q1, q2, q3, q4}
     *   Start: q0
     *   Accept: {q2, q3, q4}
     *   
     *   q0 --0--> q1
     *   q0 --1--> q0
     *   q1 --0--> q1
     *   q1 --1--> q2  (found "01")
     *   q2 --0--> q3
     *   q2 --1--> q4
     *   q3 --0--> q3
     *   q3 --1--> q4
     *   q4 --0--> q3
     *   q4 --1--> q4
     * 
     * Partition refinement by hand:
     * 
     * π₀ = {{q2, q3, q4}, {q0, q1}}
     *      (accepting vs non-accepting)
     * 
     * Refining {q2, q3, q4}:
     *   On '0': q2→q3, q3→q3, q4→q3  (all go to {q2,q3,q4})
     *   On '1': q2→q4, q3→q4, q4→q4  (all go to {q2,q3,q4})
     *   Same signature → stays together
     * 
     * Refining {q0, q1}:
     *   On '0': q0→q1, q1→q1  (both go to {q0,q1})
     *   On '1': q0→q0 (goes to {q0,q1}), q1→q2 (goes to {q2,q3,q4})
     *   Different signatures → split
     * 
     * π₁ = {{q2, q3, q4}, {q0}, {q1}}
     * 
     * Refining {q2, q3, q4} again:
     *   On '0': q2→q3, q3→q3, q4→q3  (all same block)
     *   On '1': q2→q4, q3→q4, q4→q4  (all same block)
     *   Stays together
     * 
     * π₂ = {{q2, q3, q4}, {q0}, {q1}} = π₁ → stable
     * 
     * Minimal DFA: 3 states
     */
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2', 'q3', 'q4'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q2', 'q3', 'q4'],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q0', symbol: '1', to: 'q0' },
        { from: 'q1', symbol: '0', to: 'q1' },
        { from: 'q1', symbol: '1', to: 'q2' },
        { from: 'q2', symbol: '0', to: 'q3' },
        { from: 'q2', symbol: '1', to: 'q4' },
        { from: 'q3', symbol: '0', to: 'q3' },
        { from: 'q3', symbol: '1', to: 'q4' },
        { from: 'q4', symbol: '0', to: 'q3' },
        { from: 'q4', symbol: '1', to: 'q4' },
      ],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { minimal, partitions, alreadyMinimal } = result.value;

    // Should have 3 partitions: π₀, π₁, π₂
    expect(partitions.length).toBe(3);

    // π₀ = {{q2,q3,q4}, {q0,q1}}
    expect(partitions[0]).toHaveLength(2);

    // π₁ should have 3 blocks
    expect(partitions[1]).toHaveLength(3);

    // π₂ = π₁ (stable)
    expect(partitions[2]).toEqual(partitions[1]);

    // Minimal DFA should have 3 states
    expect(minimal.states).toHaveLength(3);

    // Should not be already minimal
    expect(alreadyMinimal).toBe(false);

    // Language equivalence
    expect(equivalent(dfa, minimal).equivalent).toBe(true);
  });

  it('should recognize already-minimal DFA', () => {
    /**
     * DFA for L = { w | w has even length }
     * States: {even, odd}
     * Start: even
     * Accept: {even}
     * 
     * This is already minimal (2 states needed)
     */
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['even', 'odd'],
      alphabet: ['a'],
      start: 'even',
      accepting: ['even'],
      transitions: [
        { from: 'even', symbol: 'a', to: 'odd' },
        { from: 'odd', symbol: 'a', to: 'even' },
      ],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { minimal, alreadyMinimal } = result.value;

    expect(alreadyMinimal).toBe(true);
    expect(minimal.states).toHaveLength(2);

    // Partition should stabilize immediately
    expect(result.value.partitions[0]).toHaveLength(2);
    expect(result.value.partitions[1]).toEqual(result.value.partitions[0]);
  });

  it('should handle incomplete DFA by adding dead state', () => {
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

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { trace } = result.value;

    // Should have a "complete" step
    const completeStep = trace.steps.find((s) => s.data.stepType === 'complete');
    expect(completeStep).toBeDefined();
    expect(completeStep?.data.addedState).toBeDefined();
    expect(completeStep?.explanation).toContain('dead state');
  });

  it('should remove unreachable states', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2', 'unreachable'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
        { from: 'q2', symbol: 'a', to: 'q0' },
        { from: 'unreachable', symbol: 'a', to: 'q0' },
      ],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { trace } = result.value;

    // Should have "remove-unreachable" step
    const removeStep = trace.steps.find(
      (s) => s.data.stepType === 'remove-unreachable'
    );
    expect(removeStep).toBeDefined();
    expect(removeStep?.data.removedStates).toContain('unreachable');
  });

  it('should handle all-accepting DFA', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0', 'q1', 'q2'], // All accepting
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
        { from: 'q2', symbol: 'a', to: 'q0' },
      ],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { minimal } = result.value;

    // All states equivalent → 1 state
    expect(minimal.states).toHaveLength(1);
    expect(minimal.accepting).toHaveLength(1);
  });

  it('should handle none-accepting DFA', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: [], // None accepting
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q0' },
      ],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { minimal } = result.value;

    // All non-accepting states equivalent → 1 state
    expect(minimal.states).toHaveLength(1);
    expect(minimal.accepting).toHaveLength(0);
  });

  it('should handle single-state DFA', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q0' }],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { minimal, alreadyMinimal } = result.value;

    expect(minimal.states).toHaveLength(1);
    expect(alreadyMinimal).toBe(true);
  });

  it('should include split witnesses in trace', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
        { from: 'q2', symbol: 'a', to: 'q2' },
      ],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const { trace } = result.value;

    // Find refine steps with splits
    const refineSteps = trace.steps.filter(
      (s) => s.data.stepType === 'refine' && s.data.splits && s.data.splits.length > 0
    );

    expect(refineSteps.length).toBeGreaterThan(0);

    // Each split should have a witness
    for (const step of refineSteps) {
      for (const split of step.data.splits || []) {
        expect(split.witness).toBeDefined();
        expect(split.witness.p).toBeDefined();
        expect(split.witness.q).toBeDefined();
        expect(split.witness.symbol).toBeDefined();
      }
    }
  });

  // Oracle test: state count matches table-filling
  it('should produce minimal state count matching table-filling reference', () => {
    fc.assert(
      fc.property(arbitraryDFA(), (dfa) => {
        const normalizedInput = normalize(dfa);
        const minResult = minimize(normalizedInput);

        if (!minResult.ok) return false;

        const { minimal } = minResult.value;

        // Complete and clean the DFA for fair comparison
        const { states: dfa_states, alphabet, transitions, accepting, start } = normalizedInput;
        
        // Make complete test DFA
        const transitionMap = new Map<string, string>();
        for (const t of transitions) {
          transitionMap.set(`${t.from}:${t.symbol}`, t.to);
        }

        let testDFA: Automaton = {
          kind: 'DFA',
          states: dfa_states,
          alphabet,
          start,
          accepting,
          transitions,
        };

        // Add dead state if needed
        let needsDead = false;
        for (const state of dfa_states) {
          for (const symbol of alphabet) {
            if (!transitionMap.has(`${state}:${symbol}`)) {
              needsDead = true;
              break;
            }
          }
          if (needsDead) break;
        }

        if (needsDead) {
          const dead = '∅_test';
          const newTransitions = [...transitions];
          for (const state of [...dfa_states, dead]) {
            for (const symbol of alphabet) {
              if (!transitionMap.has(`${state}:${symbol}`)) {
                newTransitions.push({ from: state, symbol, to: dead });
              }
            }
          }
          testDFA = {
            ...testDFA,
            states: [...dfa_states, dead],
            transitions: newTransitions,
          };
        }

        // Remove unreachable
        const reachable = new Set<string>([start]);
        const queue = [start];
        while (queue.length > 0) {
          const curr = queue.shift()!;
          for (const t of testDFA.transitions) {
            if (t.from === curr && !reachable.has(t.to)) {
              reachable.add(t.to);
              queue.push(t.to);
            }
          }
        }

        testDFA = {
          ...testDFA,
          states: testDFA.states.filter((s) => reachable.has(s)),
          accepting: testDFA.accepting.filter((s) => reachable.has(s)),
          transitions: testDFA.transitions.filter(
            (t) => reachable.has(t.from) && reachable.has(t.to)
          ),
        };

        const expectedCount = countEquivalenceClasses(testDFA);
        const actualCount = minimal.states.length;

        return actualCount === expectedCount;
      }),
      { numRuns: 30 }
    );
  });

  // Oracle test: language equivalence
  it('should produce language-equivalent DFA', () => {
    fc.assert(
      fc.property(arbitraryDFA(), (dfa) => {
        const normalizedInput = normalize(dfa);
        
        // Skip if non-deterministic (duplicate transitions on same (state, symbol))
        const transKeys = new Set<string>();
        for (const t of normalizedInput.transitions) {
          const key = `${t.from}:${t.symbol}`;
          if (transKeys.has(key)) {
            return true; // Skip this test case
          }
          transKeys.add(key);
        }
        
        const result = minimize(normalizedInput);

        if (!result.ok) return false;

        const { minimal } = result.value;

        const equivResult = equivalent(normalizedInput, minimal);
        return equivResult.equivalent === true;
      }),
      { numRuns: 30 }
    );
  });

  // Oracle test: minimizing twice changes nothing
  it('should be idempotent (minimizing twice gives same result)', () => {
    fc.assert(
      fc.property(arbitraryDFA(), (dfa) => {
        const normalizedInput = normalize(dfa);
        
        // Skip if non-deterministic
        const transKeys = new Set<string>();
        for (const t of normalizedInput.transitions) {
          const key = `${t.from}:${t.symbol}`;
          if (transKeys.has(key)) {
            return true; // Skip this test case
          }
          transKeys.add(key);
        }
        
        const result1 = minimize(normalizedInput);
        if (!result1.ok) return false;

        const result2 = minimize(result1.value.minimal);
        if (!result2.ok) return false;

        // Second minimization should be already minimal
        return (
          result2.value.alreadyMinimal === true &&
          result2.value.minimal.states.length === result1.value.minimal.states.length
        );
      }),
      { numRuns: 20 }
    );
  });

  it('should handle DFA with empty alphabet', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: [],
      start: 'q0',
      accepting: ['q0'],
      transitions: [],
    };

    const result = minimize(dfa);
    expect(result.ok).toBe(true);

    if (!result.ok) return;

    // q1 is unreachable with no transitions, so it gets removed
    // Minimal DFA has only q0
    expect(result.value.minimal.states).toHaveLength(1);
    expect(result.value.minimal.accepting).toEqual(result.value.minimal.states);
  });
});
