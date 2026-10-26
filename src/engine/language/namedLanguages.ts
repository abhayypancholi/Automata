/**
 * Named languages library
 * 
 * Curated collection of well-known formal languages with:
 * - Class identification
 * - Membership testing
 * - Witness generation for pumping lemma
 * - Proof sketches
 * - Machines (DFAs) where applicable
 */

import type { Automaton } from '../automaton/types';

export interface NamedLanguage {
  id: string;
  display: string;
  description: string;
  class: 'Type 0' | 'Type 1' | 'Type 2' | 'Type 3';
  proofSketch: string;
  membership: (s: string) => boolean;
  witness: (p: number) => string;
  machine?: Automaton;
  machineText?: string;
}

/**
 * a^n b^n: n copies of a followed by n copies of b
 */
const anbn: NamedLanguage = {
  id: 'anbn',
  display: 'aⁿbⁿ',
  description: 'Strings with equal numbers of a and b, with all as before all bs',
  class: 'Type 2',
  proofSketch: 'Not regular (pumping lemma fails). Context-free: S -> aSb | ε',
  membership: (s: string): boolean => {
    // Count as and bs
    let aCount = 0;
    let bCount = 0;
    let seenB = false;
    
    for (const char of s) {
      if (char === 'a') {
        if (seenB) return false; // a after b
        aCount++;
      } else if (char === 'b') {
        seenB = true;
        bCount++;
      } else {
        return false; // Invalid character
      }
    }
    
    return aCount === bCount;
  },
  witness: (p: number): string => {
    // a^p b^p
    return 'a'.repeat(p) + 'b'.repeat(p);
  },
};

/**
 * a^n b^n c^n: n copies each of a, b, c
 */
const anbncn: NamedLanguage = {
  id: 'anbncn',
  display: 'aⁿbⁿcⁿ',
  description: 'Strings with equal numbers of a, b, and c, in that order',
  class: 'Type 1',
  proofSketch: 'Not context-free (pumping lemma for CFLs fails). Context-sensitive: requires counting three symbols.',
  membership: (s: string): boolean => {
    let aCount = 0;
    let bCount = 0;
    let cCount = 0;
    let phase = 0; // 0=a, 1=b, 2=c
    
    for (const char of s) {
      if (char === 'a') {
        if (phase > 0) return false;
        aCount++;
      } else if (char === 'b') {
        if (phase > 1) return false;
        phase = 1;
        bCount++;
      } else if (char === 'c') {
        phase = 2;
        cCount++;
      } else {
        return false;
      }
    }
    
    return aCount === bCount && bCount === cCount;
  },
  witness: (p: number): string => {
    return 'a'.repeat(p) + 'b'.repeat(p) + 'c'.repeat(p);
  },
};

/**
 * ww^R: strings followed by their reverse
 */
const wwR: NamedLanguage = {
  id: 'wwR',
  display: 'wwᴿ',
  description: 'Even-length palindromes: strings followed by their reverse',
  class: 'Type 2',
  proofSketch: 'Not regular. Context-free: S -> aSa | bSb | ε',
  membership: (s: string): boolean => {
    if (s.length % 2 !== 0) return false;
    const mid = s.length / 2;
    const first = s.slice(0, mid);
    const second = s.slice(mid);
    return first === second.split('').reverse().join('');
  },
  witness: (p: number): string => {
    const w = 'a'.repeat(p);
    return w + w.split('').reverse().join('');
  },
};

/**
 * ww: strings repeated twice
 */
const ww: NamedLanguage = {
  id: 'ww',
  display: 'ww',
  description: 'Strings consisting of two identical halves',
  class: 'Type 1',
  proofSketch: 'Not context-free (requires comparing two distant substrings). Context-sensitive.',
  membership: (s: string): boolean => {
    if (s.length % 2 !== 0) return false;
    const mid = s.length / 2;
    return s.slice(0, mid) === s.slice(mid);
  },
  witness: (p: number): string => {
    const w = 'a'.repeat(p);
    return w + w;
  },
};

/**
 * Palindromes: strings that read the same forwards and backwards
 */
const palindromes: NamedLanguage = {
  id: 'palindromes',
  display: 'Palindromes',
  description: 'Strings that read the same forwards and backwards',
  class: 'Type 2',
  proofSketch: 'Not regular. Context-free: S -> aSa | bSb | a | b | ε',
  membership: (s: string): boolean => {
    return s === s.split('').reverse().join('');
  },
  witness: (p: number): string => {
    const half = 'a'.repeat(Math.ceil(p / 2));
    return half + half.split('').reverse().join('');
  },
};

/**
 * a*b*: any number of as followed by any number of bs
 */
const aStarBStar: NamedLanguage = {
  id: 'a*b*',
  display: 'a*b*',
  description: 'Any number of as followed by any number of bs',
  class: 'Type 3',
  proofSketch: 'Regular: recognized by a simple 3-state DFA',
  membership: (s: string): boolean => {
    let seenB = false;
    for (const char of s) {
      if (char === 'a') {
        if (seenB) return false;
      } else if (char === 'b') {
        seenB = true;
      } else {
        return false;
      }
    }
    return true;
  },
  witness: (p: number): string => {
    return 'a'.repeat(p) + 'b'.repeat(p);
  },
  machine: {
    kind: 'DFA',
    states: ['q0', 'q1', 'q2'],
    alphabet: ['a', 'b'],
    start: 'q0',
    accepting: ['q0', 'q1'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q0' },
      { from: 'q0', symbol: 'b', to: 'q1' },
      { from: 'q1', symbol: 'a', to: 'q2' },
      { from: 'q1', symbol: 'b', to: 'q1' },
      { from: 'q2', symbol: 'a', to: 'q2' },
      { from: 'q2', symbol: 'b', to: 'q2' },
    ],
  },
};

/**
 * Equal number of a and b (in any order)
 */
const equalAB: NamedLanguage = {
  id: 'equal-ab',
  display: 'Equal a and b',
  description: 'Strings with equal numbers of a and b (in any order)',
  class: 'Type 2',
  proofSketch: 'Not regular (pumping fails). Context-free: can be recognized by PDA counting the difference.',
  membership: (s: string): boolean => {
    let aCount = 0;
    let bCount = 0;
    
    for (const char of s) {
      if (char === 'a') {
        aCount++;
      } else if (char === 'b') {
        bCount++;
      } else {
        return false;
      }
    }
    
    return aCount === bCount;
  },
  witness: (p: number): string => {
    return 'a'.repeat(p) + 'b'.repeat(p);
  },
};

/**
 * Even number of a
 */
const evenA: NamedLanguage = {
  id: 'even-a',
  display: 'Even number of a',
  description: 'Strings over {a,b} with an even number of as',
  class: 'Type 3',
  proofSketch: 'Regular: 2-state DFA counting parity of as',
  membership: (s: string): boolean => {
    let aCount = 0;
    
    for (const char of s) {
      if (char === 'a') {
        aCount++;
      } else if (char !== 'b') {
        return false;
      }
    }
    
    return aCount % 2 === 0;
  },
  witness: (p: number): string => {
    // Generate string with even number of a's
    // If p is odd, use p+1 to make it even
    const count = p % 2 === 0 ? p : p + 1;
    return 'a'.repeat(count);
  },
  machine: {
    kind: 'DFA',
    states: ['even', 'odd'],
    alphabet: ['a', 'b'],
    start: 'even',
    accepting: ['even'],
    transitions: [
      { from: 'even', symbol: 'a', to: 'odd' },
      { from: 'even', symbol: 'b', to: 'even' },
      { from: 'odd', symbol: 'a', to: 'even' },
      { from: 'odd', symbol: 'b', to: 'odd' },
    ],
  },
};

/**
 * Binary strings divisible by n (example: n=3)
 */
const binaryDiv3: NamedLanguage = {
  id: 'binary-div-3',
  display: 'Binary divisible by 3',
  description: 'Binary strings (MSB first) whose value is divisible by 3',
  class: 'Type 3',
  proofSketch: 'Regular: 3-state DFA with states representing remainders mod 3',
  membership: (s: string): boolean => {
    if (s === '') return true; // 0 is divisible by 3
    
    let value = 0;
    for (const char of s) {
      if (char === '0') {
        value = (value * 2) % 3;
      } else if (char === '1') {
        value = (value * 2 + 1) % 3;
      } else {
        return false;
      }
    }
    
    return value === 0;
  },
  witness: (p: number): string => {
    // Generate binary string for a value divisible by 3 with length >= p
    // Find smallest multiple of 3 whose binary representation has length >= p
    let value = 3;
    while (value.toString(2).length < p) {
      value += 3;
    }
    return value.toString(2);
  },
  machine: {
    kind: 'DFA',
    states: ['r0', 'r1', 'r2'],
    alphabet: ['0', '1'],
    start: 'r0',
    accepting: ['r0'],
    transitions: [
      { from: 'r0', symbol: '0', to: 'r0' },
      { from: 'r0', symbol: '1', to: 'r1' },
      { from: 'r1', symbol: '0', to: 'r2' },
      { from: 'r1', symbol: '1', to: 'r0' },
      { from: 'r2', symbol: '0', to: 'r1' },
      { from: 'r2', symbol: '1', to: 'r2' },
    ],
  },
};

/**
 * a^n b^m with n <= m
 */
const anBmNleqM: NamedLanguage = {
  id: 'anBm-n-leq-m',
  display: 'aⁿbᵐ (n ≤ m)',
  description: 'Strings with as followed by bs, where number of as ≤ number of bs',
  class: 'Type 2',
  proofSketch: 'Not regular. Context-free: S -> aSb | Sb | b | ε',
  membership: (s: string): boolean => {
    let aCount = 0;
    let bCount = 0;
    let seenB = false;
    
    for (const char of s) {
      if (char === 'a') {
        if (seenB) return false;
        aCount++;
      } else if (char === 'b') {
        seenB = true;
        bCount++;
      } else {
        return false;
      }
    }
    
    return aCount <= bCount;
  },
  witness: (p: number): string => {
    return 'a'.repeat(p) + 'b'.repeat(p);
  },
};

/**
 * a^p for prime p
 */
const aPrimePower: NamedLanguage = {
  id: 'a-prime-power',
  display: 'aᵖ (p prime)',
  description: 'Strings of as where the length is a prime number',
  class: 'Type 0',
  proofSketch: 'Not context-free (proven by Bar-Hillel). Requires number-theoretic computation.',
  membership: (s: string): boolean => {
    // Check all characters are 'a'
    if (!s.split('').every(c => c === 'a')) return false;
    
    const n = s.length;
    if (n < 2) return false;
    
    // Check if n is prime
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return false;
    }
    
    return true;
  },
  witness: (p: number): string => {
    // Find a prime >= p
    let candidate = Math.max(2, p);
    while (true) {
      let isPrime = true;
      for (let i = 2; i * i <= candidate; i++) {
        if (candidate % i === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) return 'a'.repeat(candidate);
      candidate++;
    }
  },
};

/**
 * All named languages
 */
export const namedLanguages: NamedLanguage[] = [
  anbn,
  anbncn,
  wwR,
  ww,
  palindromes,
  aStarBStar,
  equalAB,
  evenA,
  binaryDiv3,
  anBmNleqM,
  aPrimePower,
];

/**
 * Get a language by ID
 */
export function getLanguage(id: string): NamedLanguage | undefined {
  return namedLanguages.find(lang => lang.id === id);
}
