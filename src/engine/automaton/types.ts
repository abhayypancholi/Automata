/**
 * Core types for finite automata
 */

export type StateId = string;
export type Symbol = string;

export const EPS = 'ε';

export interface Transition {
  from: StateId;
  symbol: Symbol;
  to: StateId;
}

export interface Automaton {
  kind: 'DFA' | 'NFA';
  states: StateId[];
  alphabet: Symbol[];
  start: StateId;
  accepting: StateId[];
  transitions: Transition[];
  layout?: Record<StateId, { x: number; y: number }>;
}
