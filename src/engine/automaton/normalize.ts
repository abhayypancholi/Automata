/**
 * Automaton normalization
 * 
 * Normalizes automaton to canonical form:
 * - Sort states naturally (lexicographic)
 * - Sort alphabet
 * - Sort transitions by (from, symbol, to)
 * - Deduplicate transitions
 * - Sort accepting states
 * 
 * This ensures deterministic output for tests and comparisons.
 */

import type { Automaton, Transition } from './types';

/**
 * Natural sort comparator for state IDs and symbols
 */
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Compare transitions for sorting: (from, symbol, to)
 */
function compareTransitions(a: Transition, b: Transition): number {
  const fromCmp = naturalSort(a.from, b.from);
  if (fromCmp !== 0) return fromCmp;

  const symbolCmp = naturalSort(a.symbol, b.symbol);
  if (symbolCmp !== 0) return symbolCmp;

  return naturalSort(a.to, b.to);
}

/**
 * Deduplicate transitions while preserving order
 */
function deduplicateTransitions(transitions: Transition[]): Transition[] {
  const seen = new Set<string>();
  const result: Transition[] = [];

  for (const transition of transitions) {
    const key = `${transition.from}:${transition.symbol}:${transition.to}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(transition);
    }
  }

  return result;
}

/**
 * Normalize automaton to canonical form
 * 
 * Returns a new automaton (does not mutate input)
 */
export function normalize(automaton: Automaton): Automaton {
  // Sort states
  const states = [...automaton.states].sort(naturalSort);

  // Sort alphabet
  const alphabet = [...automaton.alphabet].sort(naturalSort);

  // Sort and deduplicate transitions
  const transitions = deduplicateTransitions(
    [...automaton.transitions].sort(compareTransitions)
  );

  // Sort accepting states
  const accepting = [...automaton.accepting].sort(naturalSort);

  return {
    kind: automaton.kind,
    states,
    alphabet,
    start: automaton.start,
    accepting,
    transitions,
    layout: automaton.layout ? { ...automaton.layout } : undefined,
  };
}
