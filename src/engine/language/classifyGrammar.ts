/**
 * Grammar classification (Chomsky hierarchy)
 * 
 * Classifies grammars by form (upper bound on language class):
 * - Type 3 (Regular): Right-linear or left-linear (ALL productions)
 * - Type 2 (Context-free): Single nonterminal on left (ALL productions)
 * - Type 1 (Context-sensitive): Non-contracting |left| <= |right| (ALL productions)
 * - Type 0 (Unrestricted): Everything else
 * 
 * Classification is from most restrictive to least restrictive.
 * ALL productions must satisfy the condition for the grammar to be that type.
 * 
 * Note: This classifies the GRAMMAR FORM, not the language.
 * A Type 2 grammar may generate a Type 3 language.
 */

import type { Grammar, Production } from './grammarParse';

export interface GrammarClassification {
  type: 'Type 0' | 'Type 1' | 'Type 2' | 'Type 3';
  subtype?: 'right-linear' | 'left-linear';
  description: string;
  explanation: string;
  isUpperBound: boolean;
}

/**
 * Check if a symbol is a nonterminal
 * Nonterminals: single uppercase letter, possibly followed by digits (S, S1, A2, etc.)
 */
function isNonterminal(symbol: string): boolean {
  return /^[A-Z](\d+)?$/.test(symbol);
}

/**
 * Check if a symbol is epsilon
 */
function isEpsilon(symbol: string): boolean {
  return symbol === 'ε' || symbol === 'eps';
}

/**
 * Check if a production is right-linear
 * Right-linear forms:
 * - A -> ε
 * - A -> a1 a2 ... an (terminals only)
 * - A -> a1 a2 ... an B (terminals followed by ONE nonterminal)
 */
function isRightLinear(prod: Production): boolean {
  const { right } = prod;
  
  // Empty or epsilon production is allowed
  if (right.length === 0 || (right.length === 1 && isEpsilon(right[0]!))) {
    return true;
  }
  
  // Find nonterminals in the right side
  let nonterminalCount = 0;
  let lastNonterminalIndex = -1;
  
  for (let i = 0; i < right.length; i++) {
    const symbol = right[i]!;
    if (isNonterminal(symbol)) {
      nonterminalCount++;
      lastNonterminalIndex = i;
    }
  }
  
  // At most one nonterminal allowed
  if (nonterminalCount > 1) {
    return false;
  }
  
  // If there's a nonterminal, it must be the LAST symbol
  if (nonterminalCount === 1 && lastNonterminalIndex !== right.length - 1) {
    return false;
  }
  
  return true;
}

/**
 * Check if a production is left-linear
 * Left-linear forms:
 * - A -> ε
 * - A -> a1 a2 ... an (terminals only)
 * - A -> B a1 a2 ... an (ONE nonterminal followed by terminals)
 */
function isLeftLinear(prod: Production): boolean {
  const { right } = prod;
  
  // Empty or epsilon production is allowed
  if (right.length === 0 || (right.length === 1 && isEpsilon(right[0]!))) {
    return true;
  }
  
  // Find nonterminals in the right side
  let nonterminalCount = 0;
  let firstNonterminalIndex = -1;
  
  for (let i = 0; i < right.length; i++) {
    const symbol = right[i]!;
    if (isNonterminal(symbol)) {
      nonterminalCount++;
      if (firstNonterminalIndex === -1) {
        firstNonterminalIndex = i;
      }
    }
  }
  
  // At most one nonterminal allowed
  if (nonterminalCount > 1) {
    return false;
  }
  
  // If there's a nonterminal, it must be the FIRST symbol
  if (nonterminalCount === 1 && firstNonterminalIndex !== 0) {
    return false;
  }
  
  return true;
}

/**
 * Check if ALL productions have a single nonterminal on the left side
 * This is required for Type 2 and Type 3
 */
function hasAllSingleNonterminalLeft(grammar: Grammar): boolean {
  for (const prod of grammar.productions) {
    const leftSymbols = prod.left.trim().split(/\s+/).filter(s => s);
    
    // Must have exactly ONE symbol on the left
    if (leftSymbols.length !== 1) {
      return false;
    }
    
    const leftSymbol = leftSymbols[0]!;
    
    // That one symbol must be a nonterminal
    if (!isNonterminal(leftSymbol)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if grammar is Type 3 (regular)
 * Requirements (ALL must be true):
 * 1. ALL productions have single nonterminal on left
 * 2. ALL productions are right-linear OR ALL are left-linear (not mixed)
 */
function isType3(grammar: Grammar): { isType3: boolean; subtype?: 'right-linear' | 'left-linear' } {
  // First check: all productions must have single nonterminal on left
  if (!hasAllSingleNonterminalLeft(grammar)) {
    return { isType3: false };
  }
  
  // Check if ALL productions are right-linear
  const allRightLinear = grammar.productions.every(isRightLinear);
  if (allRightLinear) {
    return { isType3: true, subtype: 'right-linear' };
  }
  
  // Check if ALL productions are left-linear
  const allLeftLinear = grammar.productions.every(isLeftLinear);
  if (allLeftLinear) {
    return { isType3: true, subtype: 'left-linear' };
  }
  
  // Mixed or neither
  return { isType3: false };
}

/**
 * Check if grammar is Type 2 (context-free)
 * Requirement: ALL productions have single nonterminal on left side
 * (No restriction on right side)
 */
function isType2(grammar: Grammar): boolean {
  return hasAllSingleNonterminalLeft(grammar);
}

/**
 * Check if grammar is Type 1 (context-sensitive / non-contracting)
 * Requirements (ALL productions must satisfy):
 * - |left| <= |right| (non-contracting)
 * - Exception: S -> ε allowed ONLY if S doesn't appear on any right side
 */
function isType1(grammar: Grammar): boolean {
  const startSymbol = grammar.startSymbol;
  
  // Check if start symbol appears on any right side
  const startAppearsOnRight = grammar.productions.some(prod =>
    prod.right.some(symbol => symbol === startSymbol)
  );
  
  // Validate EVERY production
  for (const prod of grammar.productions) {
    // Calculate left side length (number of symbols)
    const leftSymbols = prod.left.trim().split(/\s+/).filter(s => s);
    const leftLength = leftSymbols.length;
    
    // Calculate right side length (excluding epsilon)
    const rightSymbols = prod.right.filter(s => !isEpsilon(s));
    const rightLength = rightSymbols.length;
    
    // Check for epsilon production
    const isEpsilonProduction = prod.right.length === 1 && isEpsilon(prod.right[0]!);
    
    if (isEpsilonProduction) {
      // S -> ε is allowed ONLY if S is the start symbol AND doesn't appear on right
      const isStartSymbol = leftLength === 1 && leftSymbols[0] === startSymbol;
      
      if (isStartSymbol && !startAppearsOnRight) {
        // This epsilon production is allowed
        continue;
      } else {
        // Epsilon production not allowed - violates Type 1
        return false;
      }
    }
    
    // Non-contracting rule: |left| <= |right|
    // This detects contracting productions where left is longer than right
    if (leftLength > rightLength) {
      return false;
    }
  }
  
  return true;
}

/**
 * Classify grammar by form
 * Check from most restrictive to least restrictive
 */
export function classifyGrammar(grammar: Grammar): GrammarClassification {
  // Type 3 (Regular) - Most restrictive
  const type3Check = isType3(grammar);
  if (type3Check.isType3) {
    return {
      type: 'Type 3',
      subtype: type3Check.subtype,
      description: `Regular (${type3Check.subtype})`,
      explanation: 'This grammar is regular. Note that this is an upper bound on the language class; the language itself may be classified more precisely by other means.',
      isUpperBound: true,
    };
  }
  
  // Type 2 (Context-free)
  if (isType2(grammar)) {
    return {
      type: 'Type 2',
      description: 'Context-free',
      explanation: 'This grammar is context-free (single nonterminal on the left side of each production). This is an upper bound on the language class; a context-free grammar can generate a regular language.',
      isUpperBound: true,
    };
  }
  
  // Type 1 (Context-sensitive)
  if (isType1(grammar)) {
    return {
      type: 'Type 1',
      description: 'Context-sensitive (non-contracting)',
      explanation: 'This grammar is context-sensitive (non-contracting: |left| ≤ |right| for all productions). This is an upper bound on the language class.',
      isUpperBound: true,
    };
  }
  
  // Type 0 (Unrestricted) - Least restrictive
  return {
    type: 'Type 0',
    description: 'Unrestricted',
    explanation: 'This grammar is unrestricted (has contracting productions or other violations of context-sensitive constraints). This is an upper bound on the language class.',
    isUpperBound: true,
  };
}
