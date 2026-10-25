/**
 * Table-filling algorithm for DFA minimization (Myhill-Nerode)
 * 
 * Reference implementation for testing only - NOT used in production.
 * 
 * Algorithm: Build a table of state pairs (p, q). Mark pairs as distinguishable
 * if one is accepting and the other is not. Then iteratively mark pairs (p, q)
 * distinguishable if there exists a symbol a such that (δ(p,a), δ(q,a)) is
 * already marked distinguishable. Repeat until no new pairs are marked.
 * 
 * The number of equivalence classes equals the number of states in the
 * minimal DFA.
 */

import type { Automaton, StateId, Symbol } from '../automaton/types';

/**
 * Compute the number of equivalence classes (= minimal DFA state count)
 * using table-filling algorithm
 */
export function countEquivalenceClasses(dfa: Automaton): number {
  const states = dfa.states;

  // Table: marked[i][j] = true if states[i] and states[j] are distinguishable
  const marked: boolean[][] = Array.from({ length: states.length }, () =>
    Array(states.length).fill(false)
  );

  // Initial marking: accepting vs non-accepting
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const iAccepting = dfa.accepting.includes(states[i]!);
      const jAccepting = dfa.accepting.includes(states[j]!);

      if (iAccepting !== jAccepting) {
        marked[i]![j] = true;
      }
    }
  }

  // Iteratively mark pairs
  let changed = true;
  while (changed) {
    changed = false;

    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        if (marked[i]![j]) continue; // Already marked

        const p = states[i]!;
        const q = states[j]!;

        // Check if there exists a symbol where successors are distinguishable
        for (const symbol of dfa.alphabet) {
          const pNext = getTransition(dfa, p, symbol);
          const qNext = getTransition(dfa, q, symbol);

          if (!pNext || !qNext) {
            // Missing transition - treat as distinguishable
            if (pNext !== qNext) {
              marked[i]![j] = true;
              changed = true;
              break;
            }
            continue;
          }

          const pNextIdx = states.indexOf(pNext);
          const qNextIdx = states.indexOf(qNext);

          if (pNextIdx === qNextIdx) continue;

          // Check if (pNext, qNext) is marked
          const [minIdx, maxIdx] =
            pNextIdx < qNextIdx ? [pNextIdx, qNextIdx] : [qNextIdx, pNextIdx];

          if (marked[minIdx]![maxIdx]) {
            marked[i]![j] = true;
            changed = true;
            break;
          }
        }
      }
    }
  }

  // Count equivalence classes
  const parent = Array.from({ length: states.length }, (_, i) => i);

  function find(i: number): number {
    if (parent[i] !== i) {
      parent[i] = find(parent[i]!);
    }
    return parent[i]!;
  }

  function union(i: number, j: number): void {
    const pi = find(i);
    const pj = find(j);
    if (pi !== pj) {
      parent[pi] = pj;
    }
  }

  // Union all unmarked pairs
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      if (!marked[i]![j]) {
        union(i, j);
      }
    }
  }

  // Count distinct roots
  const roots = new Set<number>();
  for (let i = 0; i < states.length; i++) {
    roots.add(find(i));
  }

  return roots.size;
}

/**
 * Helper: get transition target
 */
function getTransition(
  dfa: Automaton,
  from: StateId,
  symbol: Symbol
): StateId | null {
  const transition = dfa.transitions.find(
    (t) => t.from === from && t.symbol === symbol
  );
  return transition?.to ?? null;
}
