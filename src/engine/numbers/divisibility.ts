/**
 * Divisibility DFA builder
 * 
 * Builds a DFA that recognizes binary strings (MSB first) whose value is divisible by n
 * 
 * Algorithm:
 * - States: r0, r1, ..., r(n-1) representing remainders mod n
 * - Start state: r0 (value 0)
 * - Accept state: r0 (divisible by n)
 * - Transition: δ(r, b) = (2r + b) mod n
 * - Empty string is accepted (value 0 is divisible by any n)
 */

import type { Automaton } from '../automaton/types';

/**
 * Build a DFA that recognizes binary strings divisible by n
 * 
 * @param n - The divisor (must be >= 1)
 * @returns DFA that accepts binary strings whose value mod n = 0
 */
export function buildDivisibilityDFA(n: number): Automaton {
  if (n < 1) {
    throw new Error('Divisor n must be >= 1');
  }
  
  // States: r0, r1, ..., r(n-1)
  const states = Array.from({ length: n }, (_, i) => `r${i}`);
  
  // Transitions: from each remainder state, on each bit
  const transitions = [];
  for (let r = 0; r < n; r++) {
    for (const bit of ['0', '1']) {
      const bitValue = bit === '0' ? 0 : 1;
      const nextRemainder = (2 * r + bitValue) % n;
      transitions.push({
        from: `r${r}`,
        symbol: bit,
        to: `r${nextRemainder}`,
      });
    }
  }
  
  return {
    kind: 'DFA',
    states,
    alphabet: ['0', '1'],
    start: 'r0',
    accepting: ['r0'], // Only r0 is accepting (remainder 0)
    transitions,
  };
}

/**
 * Test if a binary string is divisible by n using the DFA
 */
export function isDivisible(n: number, binary: string): boolean {
  const dfa = buildDivisibilityDFA(n);
  
  // Simulate the DFA
  let currentState = dfa.start;
  
  for (const bit of binary) {
    const transition = dfa.transitions.find(
      t => t.from === currentState && t.symbol === bit
    );
    
    if (!transition) {
      return false; // Invalid input
    }
    
    currentState = transition.to;
  }
  
  return dfa.accepting.includes(currentState);
}

/**
 * Get the remainder when dividing a binary string by n
 */
export function getRemainder(n: number, binary: string): number {
  if (binary === '') return 0;
  
  let currentState = 0; // Start at r0
  
  for (const bit of binary) {
    const bitValue = bit === '0' ? 0 : 1;
    currentState = (2 * currentState + bitValue) % n;
  }
  
  return currentState;
}
