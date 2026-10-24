/**
 * Test utilities for automata
 * 
 * Provides:
 * - fast-check arbitraries for generating random small automata
 * - Naive reference acceptor for oracle testing
 */

import * as fc from 'fast-check';
import type { Automaton, StateId } from './types';
import { EPS } from './types';

/**
 * Naive reference acceptor - explores all possible paths (exponential time)
 * Only for testing on small automata and short strings
 */
export function naiveAccepts(automaton: Automaton, input: string): boolean {
  const symbols = input.split('');

  // Epsilon closure helper (copied from equivalence for now)
  function epsilonClosure(states: Set<StateId>): Set<StateId> {
    const closure = new Set(states);
    const queue = Array.from(states);

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const transition of automaton.transitions) {
        if (transition.from === current && transition.symbol === EPS) {
          if (!closure.has(transition.to)) {
            closure.add(transition.to);
            queue.push(transition.to);
          }
        }
      }
    }

    return closure;
  }

  // Current set of states
  let current = epsilonClosure(new Set([automaton.start]));

  // Process each symbol
  for (const symbol of symbols) {
    const next = new Set<StateId>();

    for (const state of current) {
      for (const transition of automaton.transitions) {
        if (transition.from === state && transition.symbol === symbol) {
          next.add(transition.to);
        }
      }
    }

    current = epsilonClosure(next);
  }

  // Check if any current state is accepting
  for (const state of current) {
    if (automaton.accepting.includes(state)) {
      return true;
    }
  }

  return false;
}

/**
 * fast-check arbitrary for small DFAs
 */
export function arbitraryDFA(): fc.Arbitrary<Automaton> {
  return fc
    .record({
      stateCount: fc.integer({ min: 1, max: 5 }),
      alphabetSize: fc.integer({ min: 1, max: 3 }),
    })
    .chain(({ stateCount, alphabetSize }) => {
      const states = Array.from({ length: stateCount }, (_, i) => `q${i}`);
      const alphabet = Array.from({ length: alphabetSize }, (_, i) =>
        String.fromCharCode(97 + i)
      ); // a, b, c

      return fc.record({
        start: fc.constantFrom(...states),
        accepting: fc.subarray(states),
        transitions: fc.array(
          fc.record({
            from: fc.constantFrom(...states),
            symbol: fc.constantFrom(...alphabet),
            to: fc.constantFrom(...states),
          }),
          { minLength: 0, maxLength: stateCount * alphabetSize * 2 }
        ),
      }).map(({ start, accepting, transitions }) => ({
        kind: 'DFA' as const,
        states,
        alphabet,
        start,
        accepting,
        transitions,
      }));
    });
}

/**
 * fast-check arbitrary for small NFAs (with epsilon transitions)
 */
export function arbitraryNFA(): fc.Arbitrary<Automaton> {
  return fc
    .record({
      stateCount: fc.integer({ min: 1, max: 5 }),
      alphabetSize: fc.integer({ min: 1, max: 3 }),
    })
    .chain(({ stateCount, alphabetSize }) => {
      const states = Array.from({ length: stateCount }, (_, i) => `q${i}`);
      const alphabet = Array.from({ length: alphabetSize }, (_, i) =>
        String.fromCharCode(97 + i)
      );

      // Alphabet for transitions includes epsilon
      const transitionAlphabet = [...alphabet, EPS];

      return fc.record({
        start: fc.constantFrom(...states),
        accepting: fc.subarray(states),
        transitions: fc.array(
          fc.record({
            from: fc.constantFrom(...states),
            symbol: fc.constantFrom(...transitionAlphabet),
            to: fc.constantFrom(...states),
          }),
          { minLength: 0, maxLength: stateCount * (alphabetSize + 1) * 2 }
        ),
      }).map(({ start, accepting, transitions }) => ({
        kind: 'NFA' as const,
        states,
        alphabet,
        start,
        accepting,
        transitions,
      }));
    });
}
