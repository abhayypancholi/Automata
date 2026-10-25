/**
 * Epsilon-closure computation
 * 
 * Algorithm: Iterative BFS/DFS over epsilon transitions from a set of states.
 * 
 * Input: Set of states, automaton
 * Output: All states reachable via zero or more epsilon transitions
 * 
 * Invariant: A state is in the closure iff there exists a path of epsilon
 * transitions from some state in the input set. Handles cycles correctly
 * by maintaining a visited set.
 */

import type { StateId, Automaton } from '../automaton/types';
import { EPS } from '../automaton/types';

/**
 * Compute epsilon-closure of a set of states
 * 
 * Returns: Set of all states reachable via zero or more ε-transitions,
 * including the input states themselves.
 */
export function epsilonClosure(
  states: Set<StateId>,
  automaton: Automaton
): Set<StateId> {
  const closure = new Set(states);
  const queue = Array.from(states);
  
  // Safety: prevent infinite loops
  let iterations = 0;
  const maxIterations = automaton.states.length * automaton.transitions.length;

  while (queue.length > 0) {
    iterations++;
    if (iterations > maxIterations) {
      // This should never happen with correct cycle handling, but just in case
      console.warn('epsilonClosure: max iterations exceeded, breaking');
      break;
    }
    
    const current = queue.shift()!;

    // Find all epsilon transitions from current state
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
 * Compute epsilon-closure of a single state (convenience wrapper)
 */
export function epsilonClosureSingle(
  state: StateId,
  automaton: Automaton
): Set<StateId> {
  return epsilonClosure(new Set([state]), automaton);
}
