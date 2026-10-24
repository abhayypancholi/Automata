/**
 * Automaton validation
 * 
 * Validates the structural integrity of an automaton and returns precise errors
 * for: duplicate states, unknown states in transitions, symbols not in alphabet,
 * start not in states, DFA completeness and determinism when required.
 */

import type { Automaton, StateId, Symbol } from './types';
import { EPS } from './types';
import type { Result } from '../errors';

export interface ValidationOptions {
  requireComplete?: boolean; // DFA must have all transitions
  requireDeterministic?: boolean; // DFA cannot have duplicate transitions
}

/**
 * Validate automaton structure
 * Returns ok(true) if valid, or error with precise message
 */
export function validateAutomaton(
  automaton: Automaton,
  options: ValidationOptions = {}
): Result<true> {
  const { requireComplete = false, requireDeterministic = false } = options;

  // Check for duplicate states
  const stateSet = new Set<StateId>();
  for (const state of automaton.states) {
    if (stateSet.has(state)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_AUTOMATON',
          message: `Duplicate state: "${state}"`,
        },
      };
    }
    stateSet.add(state);
  }

  // States must be non-empty
  if (automaton.states.length === 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: 'Automaton must have at least one state',
      },
    };
  }

  // Start state must exist
  if (!stateSet.has(automaton.start)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: `Start state "${automaton.start}" not found in states`,
      },
    };
  }

  // Accepting states must exist
  for (const accepting of automaton.accepting) {
    if (!stateSet.has(accepting)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_AUTOMATON',
          message: `Accepting state "${accepting}" not found in states`,
        },
      };
    }
  }

  // Alphabet must not contain epsilon
  const alphabetSet = new Set<Symbol>(automaton.alphabet);
  if (alphabetSet.has(EPS)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: 'Alphabet must not contain ε (epsilon)',
      },
    };
  }

  // Check transitions
  for (const transition of automaton.transitions) {
    // From state must exist
    if (!stateSet.has(transition.from)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_AUTOMATON',
          message: `Transition from unknown state: "${transition.from}"`,
        },
      };
    }

    // To state must exist
    if (!stateSet.has(transition.to)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_AUTOMATON',
          message: `Transition to unknown state: "${transition.to}"`,
        },
      };
    }

    // Symbol must be in alphabet or epsilon (for NFA)
    if (transition.symbol !== EPS && !alphabetSet.has(transition.symbol)) {
      return {
        ok: false,
        error: {
          code: 'INVALID_AUTOMATON',
          message: `Transition uses symbol "${transition.symbol}" not in alphabet`,
        },
      };
    }

    // Epsilon transitions only allowed in NFA
    if (transition.symbol === EPS && automaton.kind === 'DFA') {
      return {
        ok: false,
        error: {
          code: 'INVALID_AUTOMATON',
          message: `DFA cannot have ε-transitions (from "${transition.from}")`,
        },
      };
    }
  }

  // DFA-specific validation
  if (automaton.kind === 'DFA' && (requireComplete || requireDeterministic)) {
    const transitionMap = new Map<string, Set<StateId>>();

    for (const transition of automaton.transitions) {
      const key = `${transition.from}:${transition.symbol}`;
      if (!transitionMap.has(key)) {
        transitionMap.set(key, new Set());
      }
      transitionMap.get(key)!.add(transition.to);
    }

    // Check determinism
    if (requireDeterministic) {
      for (const [key, targets] of transitionMap.entries()) {
        if (targets.size > 1) {
          const [from, symbol] = key.split(':');
          return {
            ok: false,
            error: {
              code: 'INVALID_AUTOMATON',
              message: `DFA has multiple transitions from state "${from}" on symbol "${symbol}"`,
            },
          };
        }
      }
    }

    // Check completeness
    if (requireComplete) {
      for (const state of automaton.states) {
        for (const symbol of automaton.alphabet) {
          const key = `${state}:${symbol}`;
          if (!transitionMap.has(key) || transitionMap.get(key)!.size === 0) {
            return {
              ok: false,
              error: {
                code: 'INVALID_AUTOMATON',
                message: `DFA missing transition from state "${state}" on symbol "${symbol}"`,
              },
            };
          }
        }
      }
    }
  }

  return { ok: true, value: true };
}
