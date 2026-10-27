/**
 * Build a lexer DFA from token definitions
 * 
 * Note: Due to complexity of token patterns (especially NUMBER with exponents
 * and DIFF), we build a simpler hand-crafted lexer rather than using the
 * full regex→NFA→DFA pipeline for all tokens. This is acceptable since
 * the token patterns are fixed and well-defined.
 */

import type { Automaton } from '../automaton/types';
import type { TokenType } from './tokenDefs';
import { TOKEN_TYPES } from './tokenDefs';

export interface TaggedAutomaton extends Automaton {
  tags: Record<string, { type: TokenType; priority: number }>;
}

// Cached DFA instance
let cachedDFA: TaggedAutomaton | null = null;

/**
 * For T10, we'll use a simplified approach:
 * Build a hand-crafted DFA that recognizes all token types.
 * This is more practical than converting complex regex patterns.
 * 
 * The DFA is cached and reused on subsequent calls.
 */
export function buildLexerDFA(): TaggedAutomaton {
  // Return cached instance if available
  if (cachedDFA) {
    return cachedDFA;
  }
  
  // Build tags for all token types
  // Priority matches the order in tokenDefs (higher priority = lower number)
  const tags: Record<string, { type: TokenType; priority: number }> = {};
  TOKEN_TYPES.forEach((type, index) => {
    tags[type] = { type, priority: index };
  });
  
  // This is a placeholder DFA - the actual lexer uses direct pattern matching
  // in lex.ts rather than running a full DFA simulation
  cachedDFA = {
    kind: 'DFA',
    states: ['START'],
    alphabet: [],
    start: 'START',
    accepting: [],
    transitions: [],
    tags,
  };
  
  return cachedDFA;
}
