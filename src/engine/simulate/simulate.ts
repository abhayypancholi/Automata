/**
 * Automaton simulation
 * 
 * Algorithm: For DFA, follow single transition per symbol. For NFA, maintain
 * set of current states with epsilon-closure applied after each move.
 * 
 * Inputs: automaton, input string
 * Outputs: accept/reject, trace showing state progression
 * 
 * Invariant: Current configuration after processing i symbols is the set of
 * all states reachable from start by reading the first i symbols (with epsilon
 * transitions followed).
 */

import type { Automaton, StateId, Transition } from '../automaton/types';
import { EPS } from '../automaton/types';
import type { Result } from '../errors';
import type { Trace, TraceStep } from '../trace';

/**
 * Simulation trace step data
 */
export interface SimulationStepData {
  kind: 'simulation';
  symbolIndex: number; // -1 for initial step
  symbol: string | null; // null for initial step
  from: StateId[];
  to: StateId[];
  transitionsUsed: Transition[];
  stuck?: boolean;
}

export interface SimulationResult {
  accepted: boolean;
  trace: Trace<SimulationStepData>;
}

/**
 * Compute epsilon-closure of a set of states
 * Uses iterative BFS to handle cycles
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
 * Check if any state in the set is accepting
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
 * Simulate automaton on input string
 * 
 * Returns accept/reject and a detailed trace
 */
export function simulate(
  automaton: Automaton,
  input: string
): Result<SimulationResult> {
  const symbols = input.split('');
  const steps: TraceStep<SimulationStepData>[] = [];

  // Validate symbols are in alphabet (or empty string)
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]!;
    if (!automaton.alphabet.includes(symbol)) {
      return {
        ok: false,
        error: {
          code: 'SYMBOL_NOT_IN_ALPHABET',
          message: `Symbol "${symbol}" at position ${i} is not in alphabet {${automaton.alphabet.join(', ')}}`,
          offset: i,
        },
      };
    }
  }

  // Initial configuration: epsilon-closure of start state
  let current = epsilonClosure(new Set([automaton.start]), automaton);
  const currentArray = Array.from(current).sort();

  steps.push({
    index: 0,
    title: 'Start',
    explanation: `Initial state${current.size > 1 ? 's' : ''} after epsilon-closure: {${currentArray.join(', ')}}`,
    data: {
      kind: 'simulation',
      symbolIndex: -1,
      symbol: null,
      from: [],
      to: currentArray,
      transitionsUsed: [],
    },
    highlight: {
      states: currentArray,
    },
  });

  // Process each symbol
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]!;
    const next = new Set<StateId>();
    const transitionsUsed: Transition[] = [];

    // Follow all transitions on this symbol (handles both DFA and non-deterministic cases)
    for (const state of current) {
      for (const transition of automaton.transitions) {
        if (transition.from === state && transition.symbol === symbol) {
          next.add(transition.to);
          transitionsUsed.push(transition);
        }
      }
    }

    // Check if DFA is stuck (no transitions found)
    if (automaton.kind === 'DFA' && next.size === 0) {
      const currentState = Array.from(current)[0]!;
      steps.push({
        index: i + 1,
        title: `Read '${symbol}'`,
        explanation: `No transition from state "${currentState}" on symbol '${symbol}'. The DFA is stuck (implicit dead state).`,
        data: {
          kind: 'simulation',
          symbolIndex: i,
          symbol,
          from: [currentState],
          to: [],
          transitionsUsed: [],
          stuck: true,
        },
        highlight: {
          states: [currentState],
        },
      });

      return {
        ok: true,
        value: {
          accepted: false,
          trace: { steps },
        },
      };
    }

    // Apply epsilon-closure
    const fromArray = Array.from(current).sort();
    const nextWithClosure = epsilonClosure(next, automaton);
    const toArray = Array.from(nextWithClosure).sort();

    steps.push({
      index: i + 1,
      title: `Read '${symbol}'`,
      explanation:
        automaton.kind === 'DFA'
          ? `From state "${fromArray[0]}", read '${symbol}', move to state "${toArray[0]}".`
          : `From states {${fromArray.join(', ')}}, read '${symbol}', move to {${Array.from(next).sort().join(', ')}}. After epsilon-closure: {${toArray.join(', ')}}.`,
      data: {
        kind: 'simulation',
        symbolIndex: i,
        symbol,
        from: fromArray,
        to: toArray,
        transitionsUsed,
      },
      highlight: {
        states: toArray,
        transitions: transitionsUsed,
      },
    });

    current = nextWithClosure;
  }

  // Check acceptance
  const accepted = hasAcceptingState(current, automaton);

  return {
    ok: true,
    value: {
      accepted,
      trace: { steps },
    },
  };
}
