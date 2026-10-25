/**
 * Subset construction (NFA to DFA conversion)
 * 
 * Algorithm: Powerset construction (Sipser, Theorem 1.39)
 * Start with epsilon-closure of the NFA start state. For each subset and symbol,
 * compute the move, apply epsilon-closure, and add to the DFA if new.
 * Process subsets in discovery order (BFS).
 * 
 * Inputs: NFA (possibly with epsilon transitions)
 * Outputs: Equivalent DFA, construction trace showing subset table
 * 
 * Invariant: Every reachable DFA state corresponds to a subset of NFA states.
 * The DFA accepts a string iff the NFA's final configuration contains an
 * accepting state.
 */

import type { Automaton, StateId, Symbol, Transition } from '../automaton/types';
import type { Result } from '../errors';
import type { Trace, TraceStep } from '../trace';
import { epsilonClosure } from './epsilonClosure';
import { normalize } from '../automaton/normalize';

/**
 * Subset construction trace step data
 */
export interface SubsetConstructionStepData {
  kind: 'subset-construction';
  stepType: 'initial' | 'process-subset' | 'complete';
  subset?: StateId[]; // Current subset being processed
  symbol?: Symbol; // Symbol being processed
  moveResult?: StateId[]; // Result of move operation before epsilon-closure
  closureResult?: StateId[]; // Result after epsilon-closure
  target?: StateId[]; // The target subset (same as closureResult)
  isNew?: boolean; // Whether target is a newly discovered subset
  table?: Array<{
    // Current construction table
    subset: StateId[];
    transitions: Record<Symbol, StateId[]>;
    isAccepting: boolean;
  }>;
}

export interface SubsetConstructionResult {
  dfa: Automaton;
  trace: Trace<SubsetConstructionStepData>;
  stateMapping: Map<string, StateId[]>; // DFA state name -> NFA subset
}

/**
 * Convert a set of states to a canonical string key
 */
function setToKey(states: Set<StateId>): string {
  return Array.from(states).sort().join(',');
}

/**
 * Convert a set to a DFA state name
 */
function setToStateName(states: Set<StateId>): string {
  if (states.size === 0) return '∅';
  return `{${Array.from(states).sort().join(',')}}`;
}

/**
 * Move operation: which states can be reached from a set on a symbol?
 * Does not include epsilon-closure.
 */
function move(
  states: Set<StateId>,
  symbol: Symbol,
  automaton: Automaton
): Set<StateId> {
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
 * Check if a subset contains any accepting state
 */
function isAcceptingSubset(subset: Set<StateId>, nfa: Automaton): boolean {
  for (const state of subset) {
    if (nfa.accepting.includes(state)) {
      return true;
    }
  }
  return false;
}

/**
 * Convert NFA to DFA via subset construction
 * 
 * Returns the DFA and a trace showing the construction table being built
 */
export function subsetConstruction(
  nfa: Automaton
): Result<SubsetConstructionResult> {
  const steps: TraceStep<SubsetConstructionStepData>[] = [];
  const alphabet = nfa.alphabet;

  // Map from subset key to DFA state name
  const subsetToState = new Map<string, string>();
  // Map from DFA state name to NFA subset
  const stateMapping = new Map<string, StateId[]>();
  // Track which subsets we've seen
  const discovered = new Map<string, Set<StateId>>();
  // Worklist of subsets to process
  const worklist: Set<StateId>[] = [];

  // Initial subset: epsilon-closure of start
  const initialSubset = epsilonClosure(new Set([nfa.start]), nfa);
  const initialKey = setToKey(initialSubset);
  const initialStateName = setToStateName(initialSubset);

  subsetToState.set(initialKey, initialStateName);
  stateMapping.set(initialStateName, Array.from(initialSubset).sort());
  discovered.set(initialKey, initialSubset);
  worklist.push(initialSubset);

  steps.push({
    index: 0,
    title: 'Initial subset',
    explanation: `Start with epsilon-closure of NFA start state {${nfa.start}}: ${initialStateName}`,
    data: {
      kind: 'subset-construction',
      stepType: 'initial',
      subset: Array.from(initialSubset).sort(),
    },
  });

  // DFA transitions being built
  const dfaTransitions: Transition[] = [];
  const dfaStates = new Set<string>([initialStateName]);
  const dfaAccepting = new Set<string>();

  if (isAcceptingSubset(initialSubset, nfa)) {
    dfaAccepting.add(initialStateName);
  }

  let stepIndex = 1;
  const LIMIT = 1024;

  // Process worklist
  while (worklist.length > 0) {
    const currentSubset = worklist.shift()!;
    const currentKey = setToKey(currentSubset);
    const currentStateName = subsetToState.get(currentKey)!;

    // For each symbol, compute target subset
    for (const symbol of alphabet) {
      const moveResult = move(currentSubset, symbol, nfa);
      const targetSubset = epsilonClosure(moveResult, nfa);
      const targetKey = setToKey(targetSubset);

      let targetStateName: string;
      let isNew = false;

      if (!discovered.has(targetKey)) {
        // Check limit
        if (discovered.size >= LIMIT) {
          return {
            ok: false,
            error: {
              code: 'LIMIT_EXCEEDED',
              message: `Subset construction generated more than ${LIMIT} DFA states. Construction stopped.`,
              hint: `Generated ${discovered.size} states so far.`,
            },
          };
        }

        // New subset discovered
        targetStateName = setToStateName(targetSubset);
        subsetToState.set(targetKey, targetStateName);
        stateMapping.set(targetStateName, Array.from(targetSubset).sort());
        discovered.set(targetKey, targetSubset);
        worklist.push(targetSubset);
        dfaStates.add(targetStateName);

        if (isAcceptingSubset(targetSubset, nfa)) {
          dfaAccepting.add(targetStateName);
        }

        isNew = true;
      } else {
        targetStateName = subsetToState.get(targetKey)!;
      }

      // Add transition
      dfaTransitions.push({
        from: currentStateName,
        symbol,
        to: targetStateName,
      });

      // Add trace step
      steps.push({
        index: stepIndex++,
        title: `Process ${currentStateName} on '${symbol}'`,
        explanation: `From ${currentStateName}, read '${symbol}'. Move gives {${Array.from(moveResult).sort().join(',') || 'empty'}}. After epsilon-closure: ${targetStateName}.${isNew ? ' (New subset discovered)' : ''}`,
        data: {
          kind: 'subset-construction',
          stepType: 'process-subset',
          subset: Array.from(currentSubset).sort(),
          symbol,
          moveResult: Array.from(moveResult).sort(),
          closureResult: Array.from(targetSubset).sort(),
          target: Array.from(targetSubset).sort(),
          isNew,
        },
      });
    }
  }

  // Build final DFA
  const dfa: Automaton = {
    kind: 'DFA',
    states: Array.from(dfaStates),
    alphabet: [...alphabet],
    start: initialStateName,
    accepting: Array.from(dfaAccepting),
    transitions: dfaTransitions,
  };

  const normalizedDFA = normalize(dfa);

  steps.push({
    index: stepIndex,
    title: 'Construction complete',
    explanation: `DFA has ${dfaStates.size} states (including ${dfaAccepting.size} accepting states).${dfaStates.has('∅') ? ' The empty set (dead state) is reachable.' : ''}`,
    data: {
      kind: 'subset-construction',
      stepType: 'complete',
    },
  });

  return {
    ok: true,
    value: {
      dfa: normalizedDFA,
      trace: { steps },
      stateMapping,
    },
  };
}
