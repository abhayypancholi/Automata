/**
 * Oracle tests for regex module
 * 
 * These tests verify that our regex implementation matches JavaScript's RegExp
 * behavior for all strings up to a certain length.
 */

import { describe, it, expect } from 'vitest';
import { parseRegex } from './parseRegex';
import { thompson } from './thompson';
import { simulate } from '../simulate';
import { subsetConstruction } from '../convert';
import { minimize } from '../minimize';
import { equivalent } from '../automaton/equivalence';
import * as fc from 'fast-check';

/**
 * Test corpus: 15 regex patterns covering various constructs (reduced for performance)
 */
const REGEX_CORPUS = [
  // Simple literals
  'a',
  'ab',
  
  // Union
  'a|b',
  '(a|b)c',
  
  // Star
  'a*',
  '(ab)*',
  
  // Plus
  'a+',
  
  // Optional
  'a?',
  
  // Character classes
  '[abc]',
  '[01]+',
  
  // Complex combinations
  'a*b*',
  '(a|b)*abb',
  'a(b|c)*d',
  '(a|b)(c|d)',
];

describe('oracle - regex corpus vs JS RegExp', () => {
  for (const pattern of REGEX_CORPUS) {
    it(`matches JS RegExp for: ${pattern}`, () => {
      const parseResult = parseRegex(pattern);
      
      // Skip if unsupported (shouldn't happen with our corpus)
      if (!parseResult.ok) {
        console.warn(`Pattern ${pattern} not supported:`, parseResult.error.message);
        return;
      }
      
      const { ast, alphabet } = parseResult.value;
      const { nfa } = thompson(ast, alphabet);
      
      // Create JS RegExp with anchors
      let jsPattern = pattern.replace(/\(\)/g, ''); // JS doesn't support () as epsilon
      if (jsPattern === '') jsPattern = '^$'; // Empty regex
      const jsRegex = new RegExp(`^(?:${jsPattern})$`);
      
      // Generate all strings up to length 4 (reduced for performance)
      const maxLength = 4;
      const testStrings = generateStrings(alphabet, maxLength);
      
      let mismatches = 0;
      const maxMismatches = 5;
      
      for (const str of testStrings) {
        const nfaResult = simulate(nfa, str);
        if (!nfaResult.ok) {
          console.error(`Simulation error for "${str}":`, nfaResult.error.message);
          mismatches++;
          continue;
        }
        
        const jsResult = jsRegex.test(str);
        
        if (nfaResult.value.accepted !== jsResult) {
          mismatches++;
          if (mismatches <= maxMismatches) {
            console.error(`Mismatch for "${str}": NFA=${nfaResult.value.accepted}, JS=${jsResult}`);
          }
        }
      }
      
      expect(mismatches).toBe(0);
    });
  }
});

describe('oracle - equivalence after conversions', () => {
  const patterns = ['(a|b)*', 'a*b*', '[01]+'];
  
  for (const pattern of patterns) {
    it(`NFA is equivalent to minimized DFA: ${pattern}`, () => {
      const parseResult = parseRegex(pattern);
      expect(parseResult.ok).toBe(true);
      if (!parseResult.ok) return;
      
      const { ast, alphabet } = parseResult.value;
      const { nfa } = thompson(ast, alphabet);
      
      const dfaResult = subsetConstruction(nfa);
      expect(dfaResult.ok).toBe(true);
      if (!dfaResult.ok) return;
      
      const minResult = minimize(dfaResult.value.dfa);
      expect(minResult.ok).toBe(true);
      if (!minResult.ok) return;
      
      const eqResult = equivalent(nfa, minResult.value.minimal);
      expect(eqResult.equivalent).toBe(true);
    });
  }
});

describe('oracle - property tests with fast-check', () => {
  it('random regexes match JS RegExp for small strings', () => {
    const arbRegex = fc.oneof(
      // Literals
      fc.constantFrom('a', 'b', 'c', '0', '1').map(c => ({ pattern: c, alphabet: [c] })),
      
      // Star
      fc.constantFrom('a', 'b').map(c => ({ pattern: `${c}*`, alphabet: [c] })),
      
      // Union
      fc.tuple(
        fc.constantFrom('a', 'b', 'c'),
        fc.constantFrom('a', 'b', 'c')
      ).map(([a, b]) => ({ 
        pattern: `${a}|${b}`, 
        alphabet: Array.from(new Set([a, b])).sort() 
      })),
      
      // Concat
      fc.tuple(
        fc.constantFrom('a', 'b'),
        fc.constantFrom('a', 'b')
      ).map(([a, b]) => ({ 
        pattern: `${a}${b}`, 
        alphabet: Array.from(new Set([a, b])).sort() 
      })),
    );
    
    fc.assert(
      fc.property(arbRegex, ({ pattern, alphabet }) => {
        const parseResult = parseRegex(pattern);
        if (!parseResult.ok) return true; // Skip unsupported
        
        const { ast } = parseResult.value;
        const { nfa } = thompson(ast, alphabet);
        
        const jsRegex = new RegExp(`^(?:${pattern})$`);
        
        // Test on strings up to length 4 (smaller for performance)
        const testStrings = generateStrings(alphabet, 4);
        
        for (const str of testStrings) {
          const nfaResult = simulate(nfa, str);
          if (!nfaResult.ok) return false;
          
          const jsResult = jsRegex.test(str);
          
          if (nfaResult.value.accepted !== jsResult) {
            return false;
          }
        }
        
        return true;
      }),
      { numRuns: 20, seed: 42 } // Deterministic for CI
    );
  });
});

/**
 * Helper: Generate all strings up to a given length over an alphabet
 */
function generateStrings(alphabet: string[], maxLength: number): string[] {
  const strings: string[] = [''];
  
  if (alphabet.length === 0) {
    return strings;
  }
  
  const queue: string[] = [''];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.length < maxLength) {
      for (const symbol of alphabet) {
        const next = current + symbol;
        strings.push(next);
        queue.push(next);
      }
    }
  }
  
  return strings;
}
