/**
 * Thompson's construction: Regex AST to epsilon-NFA
 * 
 * Algorithm: Thompson (Sipser, Section 1.3)
 * 
 * Input: RegexNode AST, alphabet
 * Output: epsilon-NFA with trace showing fragment per node
 * 
 * Invariant: Each fragment has exactly one start state and one accept state.
 * States are named q0, q1, q2, ... in creation order.
 * 
 * Constructions:
 * - literal 'a': q0 -a-> q1
 * - epsilon: q0 -ε-> q1
 * - concat AB: A.start -> ... -> A.accept -ε-> B.start -> ... -> B.accept
 * - union A|B: q0 -ε-> A.start, q0 -ε-> B.start, A.accept -ε-> q1, B.accept -ε-> q1
 * - star A*: q0 -ε-> A.start, A.accept -ε-> A.start, q0 -ε-> q1, A.accept -ε-> q1
 * - plus A+: same as AA*
 * - optional A?: same as (A|ε)
 * - class [abc]: same as (a|b|c)
 */

import type { RegexNode } from './types';
import type { Automaton, Transition, StateId } from '../automaton/types';
import type { Trace, TraceStep } from '../trace';
import { EPS } from '../automaton/types';

interface Fragment {
  start: StateId;
  accept: StateId;
  states: StateId[];
  transitions: Transition[];
}

interface ThompsonTraceData {
  kind: 'thompson';
  node: RegexNode;
  fragment: Automaton;
  description: string;
}

let stateCounter = 0;

function freshState(): StateId {
  return `q${stateCounter++}`;
}

function buildFragment(node: RegexNode): { fragment: Fragment; steps: TraceStep<ThompsonTraceData>[] } {
  const steps: TraceStep<ThompsonTraceData>[] = [];
  
  function build(n: RegexNode): Fragment {
    switch (n.type) {
      case 'literal': {
        const start = freshState();
        const accept = freshState();
        const fragment: Fragment = {
          start,
          accept,
          states: [start, accept],
          transitions: [{ from: start, symbol: n.value, to: accept }],
        };
        
        steps.push({
          index: steps.length,
          title: `Literal '${n.value}'`,
          explanation: `Create a simple transition from ${start} to ${accept} on symbol '${n.value}'.`,
          data: {
            kind: 'thompson',
            node: n,
            fragment: fragmentToAutomaton(fragment, [n.value]),
            description: `Literal character '${n.value}'`,
          },
        });
        
        return fragment;
      }
      
      case 'epsilon': {
        const start = freshState();
        const accept = freshState();
        const fragment: Fragment = {
          start,
          accept,
          states: [start, accept],
          transitions: [{ from: start, symbol: EPS, to: accept }],
        };
        
        steps.push({
          index: steps.length,
          title: 'Epsilon',
          explanation: `Create an epsilon transition from ${start} to ${accept} for the empty string.`,
          data: {
            kind: 'thompson',
            node: n,
            fragment: fragmentToAutomaton(fragment, []),
            description: 'Empty string (epsilon)',
          },
        });
        
        return fragment;
      }
      
      case 'concat': {
        if (n.children.length === 0) {
          // Empty concat = epsilon
          return build({ type: 'epsilon' });
        }
        
        if (n.children.length === 1) {
          return build(n.children[0]!);
        }
        
        // Build fragments for all children
        const childFragments = n.children.map(child => build(child));
        
        // Connect them with epsilon transitions
        const states: StateId[] = [];
        const transitions: Transition[] = [];
        
        for (let i = 0; i < childFragments.length; i++) {
          const frag = childFragments[i]!;
          states.push(...frag.states);
          transitions.push(...frag.transitions);
          
          // Connect accept of fragment i to start of fragment i+1
          if (i < childFragments.length - 1) {
            transitions.push({
              from: frag.accept,
              symbol: EPS,
              to: childFragments[i + 1]!.start,
            });
          }
        }
        
        const fragment: Fragment = {
          start: childFragments[0]!.start,
          accept: childFragments[childFragments.length - 1]!.accept,
          states,
          transitions,
        };
        
        steps.push({
          index: steps.length,
          title: 'Concatenation',
          explanation: `Connect ${n.children.length} fragments in sequence with epsilon transitions between them.`,
          data: {
            kind: 'thompson',
            node: n,
            fragment: fragmentToAutomaton(fragment, []),
            description: `Concatenation of ${n.children.length} expressions`,
          },
        });
        
        return fragment;
      }
      
      case 'union': {
        const leftFrag = build(n.left);
        const rightFrag = build(n.right);
        
        const start = freshState();
        const accept = freshState();
        
        const fragment: Fragment = {
          start,
          accept,
          states: [start, ...leftFrag.states, ...rightFrag.states, accept],
          transitions: [
            { from: start, symbol: EPS, to: leftFrag.start },
            { from: start, symbol: EPS, to: rightFrag.start },
            { from: leftFrag.accept, symbol: EPS, to: accept },
            { from: rightFrag.accept, symbol: EPS, to: accept },
            ...leftFrag.transitions,
            ...rightFrag.transitions,
          ],
        };
        
        steps.push({
          index: steps.length,
          title: 'Union',
          explanation: `Create new start state ${start} with epsilon transitions to both branches, and merge their accept states into new accept state ${accept}.`,
          data: {
            kind: 'thompson',
            node: n,
            fragment: fragmentToAutomaton(fragment, []),
            description: 'Union (alternation)',
          },
        });
        
        return fragment;
      }
      
      case 'star': {
        const childFrag = build(n.child);
        
        const start = freshState();
        const accept = freshState();
        
        const fragment: Fragment = {
          start,
          accept,
          states: [start, ...childFrag.states, accept],
          transitions: [
            { from: start, symbol: EPS, to: childFrag.start },
            { from: childFrag.accept, symbol: EPS, to: childFrag.start },
            { from: start, symbol: EPS, to: accept },
            { from: childFrag.accept, symbol: EPS, to: accept },
            ...childFrag.transitions,
          ],
        };
        
        steps.push({
          index: steps.length,
          title: 'Kleene Star',
          explanation: `Create loop from accept back to start of inner fragment, and epsilon transitions to skip (${start} to ${accept}) or exit (inner accept to ${accept}).`,
          data: {
            kind: 'thompson',
            node: n,
            fragment: fragmentToAutomaton(fragment, []),
            description: 'Kleene star (zero or more)',
          },
        });
        
        return fragment;
      }
      
      case 'plus': {
        // A+ = AA*
        const innerNode = n.child;
        const plusNode: RegexNode = {
          type: 'concat',
          children: [
            innerNode,
            { type: 'star', child: innerNode },
          ],
        };
        
        return build(plusNode);
      }
      
      case 'optional': {
        // A? = A|ε
        const optNode: RegexNode = {
          type: 'union',
          left: n.child,
          right: { type: 'epsilon' },
        };
        
        return build(optNode);
      }
      
      case 'class': {
        // [abc] = a|b|c
        if (n.chars.length === 0) {
          // Empty class = nothing matches (should not happen from parser)
          return build({ type: 'epsilon' });
        }
        
        if (n.chars.length === 1) {
          return build({ type: 'literal', value: n.chars[0]! });
        }
        
        // Build as nested unions: a|(b|c)
        let unionNode: RegexNode = { type: 'literal', value: n.chars[n.chars.length - 1]! };
        for (let i = n.chars.length - 2; i >= 0; i--) {
          unionNode = {
            type: 'union',
            left: { type: 'literal', value: n.chars[i]! },
            right: unionNode,
          };
        }
        
        return build(unionNode);
      }
    }
  }
  
  const fragment = build(node);
  return { fragment, steps };
}

function fragmentToAutomaton(fragment: Fragment, alphabet: string[]): Automaton {
  return {
    kind: 'NFA',
    states: fragment.states,
    alphabet,
    start: fragment.start,
    accepting: [fragment.accept],
    transitions: fragment.transitions,
  };
}

export function thompson(ast: RegexNode, alphabet: string[]): {
  nfa: Automaton;
  trace: Trace<ThompsonTraceData>;
} {
  // Reset state counter for deterministic naming
  stateCounter = 0;
  
  const { fragment, steps } = buildFragment(ast);
  
  const nfa: Automaton = {
    kind: 'NFA',
    states: fragment.states,
    alphabet,
    start: fragment.start,
    accepting: [fragment.accept],
    transitions: fragment.transitions,
  };
  
  return {
    nfa,
    trace: { steps },
  };
}
