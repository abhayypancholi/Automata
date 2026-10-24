/**
 * Automaton language equivalence
 * 
 * Algorithm: Product-automaton BFS over pairs of (subset-state-1, subset-state-2)
 * to find a shortest counterexample if languages differ.
 * 
 * Works for DFA and NFA by treating NFA states as sets and using epsilon-closure
 * (epsilon-closure will be implemented in T3; for now we assume no epsilon or
 * we'll implement a simple version here).
 * 
 * Invariant: Two automata are equivalent iff every string is accepted by both
 * or rejected by both. We explore reachable state-pairs, and if we find a pair
 * where one is accepting and the other is not, we have a counterexample.
 */

import type { Automaton, StateId, Symbol } from './types';
import { EPS } from './types';

interface EquivalenceResult {
  equivalent: true;
}

interface NonEquivalenceResult {
  equivalent: false;
  counterexample: string;
}

export type EquivalenceCheck = EquivalenceResult | NonEquivalenceResult;

/**
 * Compute epsilon-closure of a set of states
 * (Simple version for T1; will be replaced by the T3 implementation)
 */
function epsilonClosure(states: Set<StateId>, automaton: Automaton): Set<StateId> {
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

/**
 * Move operation: from a set of states, which states can we reach on symbol?
 */
function move(states: Set<StateId>, symbol: Symbol, automaton: Automaton): Set<StateId> {
  const result = new Set<StateId>();

  for (const state of states) {
    for (const transition of automaton.transitions) {
      if (transition.from === state && transition.symbol === symbol) {
        result.add(transition.to);
      }
    }
  }

  return result;
}

/**
 * Check if a set of states contains any accepting state
 */
function hasAcceptingState(states: Set<StateId>, automaton: Automaton): boolean {
  for (const state of states) {
    if (automaton.accepting.includes(state)) {
      return true;
    }
  }
  return false;
}

/**
 * Convert a set of states to a canonical string key
 */
function setToKey(states: Set<StateId>): string {
  return Array.from(states).sort().join(',');
}

/**
 * Check if two automata accept the same language
 * 
 * Returns { equivalent: true } or { equivalent: false, counterexample: string }
 * 
 * Uses BFS on the product automaton of (subset1, subset2) pairs.
 */
export function equivalent(a1: Automaton, a2: Automaton): EquivalenceCheck {
  // Build the union alphabet
  const alphabetSet = new Set([...a1.alphabet, ...a2.alphabet]);
  const alphabet = Array.from(alphabetSet).sort();

  // Initial configurations
  const start1 = epsilonClosure(new Set([a1.start]), a1);
  const start2 = epsilonClosure(new Set([a2.start]), a2);

  // Check if start configurations differ in acceptance
  const start1Accepts = hasAcceptingState(start1, a1);
  const start2Accepts = hasAcceptingState(start2, a2);

  if (start1Accepts !== start2Accepts) {
    return { equivalent: false, counterexample: '' };
  }

  // BFS queue: each entry is [states1, states2, pathString]
  const queue: [Set<StateId>, Set<StateId>, string][] = [[start1, start2, '']];
  const visited = new Set<string>();
  visited.add(`${setToKey(start1)}|${setToKey(start2)}`);

  while (queue.length > 0) {
    const [states1, states2, path] = queue.shift()!;

    // For each symbol in the union alphabet
    for (const symbol of alphabet) {
      // Compute next configurations
      const move1 = move(states1, symbol, a1);
      const next1 = epsilonClosure(move1, a1);

      const move2 = move(states2, symbol, a2);
      const next2 = epsilonClosure(move2, a2);

      const newPath = path + symbol;

      // Check acceptance
      const next1Accepts = hasAcceptingState(next1, a1);
      const next2Accepts = hasAcceptingState(next2, a2);

      if (next1Accepts !== next2Accepts) {
        return { equivalent: false, counterexample: newPath };
      }

      // Add to queue if not visited
      const key = `${setToKey(next1)}|${setToKey(next2)}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([next1, next2, newPath]);
      }
    }
  }

  return { equivalent: true };
}
