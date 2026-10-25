/**
 * DFA minimization via partition refinement (Moore's algorithm)
 * 
 * Algorithm: Start with partition π0 = {F, Q\F} (accepting vs non-accepting).
 * Refine by splitting blocks: two states are in the same block of πi+1 iff
 * they were in the same block of πi AND go to the same blocks on every symbol.
 * Stop when πi+1 = πi (no splits occurred).
 * 
 * Inputs: DFA (possibly incomplete or with unreachable states)
 * Outputs: Minimal DFA, partition history, state mapping
 * 
 * Invariant: States in the same block of πi are equivalent up to i steps of
 * lookahead. When the partition stabilizes, states in the same block are
 * fully equivalent (indistinguishable by any string).
 */

import type { Automaton, StateId, Symbol, Transition } from '../automaton/types';
import type { Result } from '../errors';
import type { Trace, TraceStep } from '../trace';
import { normalize } from '../automaton/normalize';

/**
 * Minimization trace step data
 */
export interface MinimizationStepData {
  kind: 'minimization';
  stepType: 'complete' | 'remove-unreachable' | 'initial-partition' | 'refine' | 'build-quotient' | 'done';
  addedState?: string;
  addedTransitions?: Transition[];
  removedStates?: StateId[];
  partition?: StateId[][]; // Current partition (array of blocks)
  iteration?: number;
  splits?: Array<{
    block: StateId[];
    into: StateId[][];
    witness: { p: StateId; q: StateId; symbol: Symbol; pBlock: number; qBlock: number };
  }>;
  stable?: boolean;
}

export interface MinimizationResult {
  minimal: Automaton;
  trace: Trace<MinimizationStepData>;
  partitions: StateId[][][]; // History of partitions
  mapping: Map<StateId, StateId>; // Original state -> minimal state
  alreadyMinimal: boolean;
}

/**
 * Complete DFA by adding explicit dead state if transitions are missing
 */
function completeDFA(dfa: Automaton): {
  completed: Automaton;
  deadState: string | null;
  addedTransitions: Transition[];
} {
  // Check if already complete
  const transitionMap = new Map<string, StateId>();
  for (const transition of dfa.transitions) {
    const key = `${transition.from}:${transition.symbol}`;
    transitionMap.set(key, transition.to);
  }

  let missingFound = false;
  for (const state of dfa.states) {
    for (const symbol of dfa.alphabet) {
      const key = `${state}:${symbol}`;
      if (!transitionMap.has(key)) {
        missingFound = true;
        break;
      }
    }
    if (missingFound) break;
  }

  if (!missingFound) {
    return { completed: dfa, deadState: null, addedTransitions: [] };
  }

  // Need to add dead state
  // Find a name that doesn't collide
  let deadState = '∅';
  let suffix = 1;
  while (dfa.states.includes(deadState)) {
    deadState = `∅${suffix}`;
    suffix++;
  }

  const newStates = [...dfa.states, deadState];
  const addedTransitions: Transition[] = [];

  // Add missing transitions to dead state
  for (const state of newStates) {
    for (const symbol of dfa.alphabet) {
      const key = `${state}:${symbol}`;
      if (!transitionMap.has(key)) {
        addedTransitions.push({ from: state, symbol, to: deadState });
      }
    }
  }

  const completed: Automaton = {
    kind: 'DFA',
    states: newStates,
    alphabet: dfa.alphabet,
    start: dfa.start,
    accepting: dfa.accepting,
    transitions: [...dfa.transitions, ...addedTransitions],
  };

  return { completed, deadState, addedTransitions };
}

/**
 * Find reachable states via BFS from start
 */
function findReachableStates(dfa: Automaton): Set<StateId> {
  const reachable = new Set<StateId>([dfa.start]);
  const queue = [dfa.start];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const transition of dfa.transitions) {
      if (transition.from === current && !reachable.has(transition.to)) {
        reachable.add(transition.to);
        queue.push(transition.to);
      }
    }
  }

  return reachable;
}

/**
 * Remove unreachable states
 */
function removeUnreachable(dfa: Automaton): {
  cleaned: Automaton;
  removed: StateId[];
} {
  const reachable = findReachableStates(dfa);
  const removed = dfa.states.filter((s) => !reachable.has(s));

  if (removed.length === 0) {
    return { cleaned: dfa, removed: [] };
  }

  const cleaned: Automaton = {
    kind: 'DFA',
    states: dfa.states.filter((s) => reachable.has(s)),
    alphabet: dfa.alphabet,
    start: dfa.start,
    accepting: dfa.accepting.filter((s) => reachable.has(s)),
    transitions: dfa.transitions.filter(
      (t) => reachable.has(t.from) && reachable.has(t.to)
    ),
  };

  return { cleaned, removed };
}

/**
 * Compute signature of a state: for each symbol, the index of the block
 * that the state goes to
 */
function computeSignature(
  state: StateId,
  partition: StateId[][],
  dfa: Automaton
): string {
  const sig: number[] = [];

  for (const symbol of dfa.alphabet.slice().sort()) {
    // Find transition
    const transition = dfa.transitions.find(
      (t) => t.from === state && t.symbol === symbol
    );
    const target = transition?.to;

    // Find which block the target is in
    const blockIndex = partition.findIndex((block) =>
      target ? block.includes(target) : false
    );

    sig.push(blockIndex);
  }

  return sig.join(',');
}

/**
 * Refine a partition: split blocks by signature
 */
function refinePartition(
  partition: StateId[][],
  dfa: Automaton
): {
  newPartition: StateId[][];
  splits: Array<{
    block: StateId[];
    into: StateId[][];
    witness: { p: StateId; q: StateId; symbol: Symbol; pBlock: number; qBlock: number };
  }>;
} {
  const newPartition: StateId[][] = [];
  const splits: Array<{
    block: StateId[];
    into: StateId[][];
    witness: { p: StateId; q: StateId; symbol: Symbol; pBlock: number; qBlock: number };
  }> = [];

  for (const block of partition) {
    // Group states by signature
    const sigMap = new Map<string, StateId[]>();

    for (const state of block) {
      const sig = computeSignature(state, partition, dfa);
      if (!sigMap.has(sig)) {
        sigMap.set(sig, []);
      }
      sigMap.get(sig)!.push(state);
    }

    const groups = Array.from(sigMap.values());

    if (groups.length > 1) {
      // Block was split - find witness
      const group0 = groups[0]!;
      const group1 = groups[1]!;
      const p = group0[0]!;
      const q = group1[0]!;

      // Find the symbol where they differ
      let witnessSymbol = dfa.alphabet[0]!;
      let pBlock = -1;
      let qBlock = -1;

      for (const symbol of dfa.alphabet) {
        const pTrans = dfa.transitions.find(
          (t) => t.from === p && t.symbol === symbol
        );
        const qTrans = dfa.transitions.find(
          (t) => t.from === q && t.symbol === symbol
        );

        const pTarget = pTrans?.to;
        const qTarget = qTrans?.to;

        const pBlockIdx = partition.findIndex((blk) =>
          pTarget ? blk.includes(pTarget) : false
        );
        const qBlockIdx = partition.findIndex((blk) =>
          qTarget ? blk.includes(qTarget) : false
        );

        if (pBlockIdx !== qBlockIdx) {
          witnessSymbol = symbol;
          pBlock = pBlockIdx;
          qBlock = qBlockIdx;
          break;
        }
      }

      splits.push({
        block: block.slice().sort(),
        into: groups.map((g) => g.slice().sort()),
        witness: { p, q, symbol: witnessSymbol, pBlock, qBlock },
      });
    }

    // Add all groups to new partition
    for (const group of groups) {
      newPartition.push(group.slice().sort());
    }
  }

  // Sort blocks by smallest element
  newPartition.sort((a, b) => {
    const minA = a[0] || '';
    const minB = b[0] || '';
    return minA.localeCompare(minB, undefined, { numeric: true });
  });

  return { newPartition, splits };
}

/**
 * Check if two partitions are equal
 */
function partitionsEqual(p1: StateId[][], p2: StateId[][]): boolean {
  if (p1.length !== p2.length) return false;

  for (let i = 0; i < p1.length; i++) {
    const block1 = p1[i]!.slice().sort();
    const block2 = p2[i]!.slice().sort();

    if (block1.length !== block2.length) return false;
    if (block1.some((s, j) => s !== block2[j])) return false;
  }

  return true;
}

/**
 * Minimize DFA
 */
export function minimize(dfa: Automaton): Result<MinimizationResult> {
  const steps: TraceStep<MinimizationStepData>[] = [];
  let stepIndex = 0;

  // Normalize input to handle any duplicate transitions
  const normalizedInput = normalize(dfa);

  // Step 1: Complete the DFA
  const { completed, deadState, addedTransitions } = completeDFA(normalizedInput);

  if (deadState) {
    steps.push({
      index: stepIndex++,
      title: 'Complete DFA',
      explanation: `Added dead state "${deadState}" with ${addedTransitions.length} transitions to make the DFA complete.`,
      data: {
        kind: 'minimization',
        stepType: 'complete',
        addedState: deadState,
        addedTransitions,
      },
    });
  }

  // Step 2: Remove unreachable states
  const { cleaned, removed } = removeUnreachable(completed);

  if (removed.length > 0) {
    steps.push({
      index: stepIndex++,
      title: 'Remove unreachable states',
      explanation: `Removed ${removed.length} unreachable state${removed.length > 1 ? 's' : ''}: {${removed.join(', ')}}.`,
      data: {
        kind: 'minimization',
        stepType: 'remove-unreachable',
        removedStates: removed,
      },
    });
  }

  const workingDFA = cleaned;
  const reachableCount = workingDFA.states.length;

  // Step 3: Initial partition π0 = {F, Q\F}
  const accepting = workingDFA.accepting.slice().sort();
  const nonAccepting = workingDFA.states
    .filter((s) => !workingDFA.accepting.includes(s))
    .sort();

  const initialPartition: StateId[][] = [];
  if (accepting.length > 0) initialPartition.push(accepting);
  if (nonAccepting.length > 0) initialPartition.push(nonAccepting);

  const partitions: StateId[][][] = [initialPartition];

  steps.push({
    index: stepIndex++,
    title: 'Initial partition π₀',
    explanation: `Partition states into accepting and non-accepting: π₀ = {${initialPartition.map((b) => `{${b.join(',')}}`).join(', ')}}.`,
    data: {
      kind: 'minimization',
      stepType: 'initial-partition',
      partition: initialPartition,
      iteration: 0,
    },
  });

  // Step 4: Refine until stable
  let currentPartition = initialPartition;
  let iteration = 1;

  while (true) {
    const { newPartition, splits } = refinePartition(currentPartition, workingDFA);

    const stable = partitionsEqual(currentPartition, newPartition);

    steps.push({
      index: stepIndex++,
      title: `Refine π₁${iteration > 1 ? `₀${iteration}`.replace('10', '') : ''}`,
      explanation: stable
        ? `No splits occurred. Partition is stable: π${iteration} = π${iteration - 1}.`
        : `Split ${splits.length} block${splits.length > 1 ? 's' : ''}: ${splits.map((s) => `{${s.block.join(',')}} → {${s.into.map((g) => g.join(',')).join('}, {')}}`).join('; ')}.`,
      data: {
        kind: 'minimization',
        stepType: 'refine',
        partition: newPartition,
        iteration,
        splits,
        stable,
      },
    });

    partitions.push(newPartition);

    if (stable) break;

    currentPartition = newPartition;
    iteration++;
  }

  const finalPartition = currentPartition;

  // Step 5: Build quotient DFA
  const blockToState = new Map<string, string>();
  const stateToBlock = new Map<StateId, StateId[]>();

  for (const block of finalPartition) {
    const blockKey = block.join(',');
    const newStateName = `{${block.join(',')}}`;
    blockToState.set(blockKey, newStateName);

    for (const state of block) {
      stateToBlock.set(state, block);
    }
  }

  const minimalStates = Array.from(blockToState.values());
  const minimalTransitions: Transition[] = [];
  const minimalAccepting: StateId[] = [];

  // Build transitions (one per block per symbol)
  for (const block of finalPartition) {
    const representative = block[0]!;
    const fromState = blockToState.get(block.join(','))!;

    // Check if accepting
    if (block.some((s) => workingDFA.accepting.includes(s))) {
      minimalAccepting.push(fromState);
    }

    // Add transitions
    for (const symbol of workingDFA.alphabet) {
      const transition = workingDFA.transitions.find(
        (t) => t.from === representative && t.symbol === symbol
      );
      if (transition) {
        const targetBlock = stateToBlock.get(transition.to)!;
        const toState = blockToState.get(targetBlock.join(','))!;

        minimalTransitions.push({ from: fromState, symbol, to: toState });
      }
    }
  }

  const startBlock = stateToBlock.get(workingDFA.start)!;
  const minimalStart = blockToState.get(startBlock.join(','))!;

  const minimal: Automaton = {
    kind: 'DFA',
    states: minimalStates,
    alphabet: workingDFA.alphabet,
    start: minimalStart,
    accepting: minimalAccepting,
    transitions: minimalTransitions,
  };

  const normalizedMinimal = normalize(minimal);

  // Build state mapping
  const mapping = new Map<StateId, StateId>();
  for (const state of normalizedInput.states) {
    const block = stateToBlock.get(state);
    if (block) {
      const minState = blockToState.get(block.join(','))!;
      mapping.set(state, minState);
    }
  }

  const alreadyMinimal = finalPartition.length === reachableCount;

  steps.push({
    index: stepIndex,
    title: 'Minimization complete',
    explanation: alreadyMinimal
      ? `The DFA was already minimal (${finalPartition.length} states).`
      : `Minimized DFA has ${finalPartition.length} states (reduced from ${reachableCount} reachable states).`,
    data: {
      kind: 'minimization',
      stepType: 'done',
    },
  });

  return {
    ok: true,
    value: {
      minimal: normalizedMinimal,
      trace: { steps },
      partitions,
      mapping,
      alreadyMinimal,
    },
  };
}
