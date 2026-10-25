/**
 * Number format validators using regex → NFA → DFA pipeline
 * 
 * Builds DFAs for validating binary, octal, and hex strings
 * with optional prefixes (0b, 0o, 0x)
 */

import { parseRegex } from '../regex/parseRegex';
import { thompson } from '../regex/thompson';
import { subsetConstruction } from '../convert/subsetConstruction';
import { minimize } from '../minimize/minimize';
import type { Automaton } from '../automaton/types';
import type { Result } from '../errors';

/**
 * Build validator DFA for a number format
 */
function buildValidatorDFA(pattern: string): Result<Automaton> {
  // Parse regex
  const parseResult = parseRegex(pattern);
  if (!parseResult.ok) return parseResult;
  
  // Convert to NFA
  const { nfa } = thompson(parseResult.value.ast, parseResult.value.alphabet);
  
  // Convert to DFA
  const dfaResult = subsetConstruction(nfa);
  if (!dfaResult.ok) return dfaResult;
  
  // Minimize
  const minResult = minimize(dfaResult.value.dfa);
  if (!minResult.ok) return minResult;
  
  return { ok: true, value: minResult.value.minimal };
}

/**
 * Binary number validator: [01]+
 */
export function buildBinaryValidator(): Result<Automaton> {
  return buildValidatorDFA('[01]+');
}

/**
 * Binary number with prefix validator: 0[bB][01]+
 */
export function buildBinaryWithPrefixValidator(): Result<Automaton> {
  return buildValidatorDFA('0[bB][01]+');
}

/**
 * Octal number validator: [0-7]+
 */
export function buildOctalValidator(): Result<Automaton> {
  return buildValidatorDFA('[0-7]+');
}

/**
 * Octal number with prefix validator: 0[oO][0-7]+
 */
export function buildOctalWithPrefixValidator(): Result<Automaton> {
  return buildValidatorDFA('0[oO][0-7]+');
}

/**
 * Hexadecimal number validator: [0-9a-fA-F]+
 */
export function buildHexValidator(): Result<Automaton> {
  return buildValidatorDFA('[0-9a-fA-F]+');
}

/**
 * Hexadecimal number with prefix validator: 0[xX][0-9a-fA-F]+
 */
export function buildHexWithPrefixValidator(): Result<Automaton> {
  return buildValidatorDFA('0[xX][0-9a-fA-F]+');
}

/**
 * Validate a string against a DFA
 */
export function validate(dfa: Automaton, input: string): boolean {
  // Simple DFA simulation to avoid circular dependency
  let currentState = dfa.start;
  
  for (const symbol of input) {
    const transition = dfa.transitions.find(
      t => t.from === currentState && t.symbol === symbol
    );
    
    if (!transition) {
      return false; // Stuck/rejected
    }
    
    currentState = transition.to;
  }
  
  return dfa.accepting.includes(currentState);
}

/**
 * Build all validators
 */
export function buildAllValidators(): Record<string, Result<Automaton>> {
  return {
    binary: buildBinaryValidator(),
    binaryWithPrefix: buildBinaryWithPrefixValidator(),
    octal: buildOctalValidator(),
    octalWithPrefix: buildOctalWithPrefixValidator(),
    hex: buildHexValidator(),
    hexWithPrefix: buildHexWithPrefixValidator(),
  };
}
