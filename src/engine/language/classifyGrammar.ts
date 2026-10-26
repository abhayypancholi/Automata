/**
 * Grammar classification (Chomsky hierarchy)
 * 
 * Classifies grammars by form (upper bound on language class):
 * - Type 3 (Regular): Right-linear or left-linear
 * - Type 2 (Context-free): Single nonterminal on left
 * - Type 1 (Context-sensitive): Non-contracting (|left| <= |right|)
 * - Type 0 (Unrestricted): All others
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
 * Check if a production is right-linear
 * Right-linear: A -> a B | a | ε
 * (terminal* nonterminal | terminal+ | ε)
 */
function isRightLinear(prod: Production): boolean {
  const { right } = prod;
  
  // ε is allowed
  if (right.length === 1 && right[0] === 'ε') {
    return true;
  }
  
  // Empty (other than ε) not allowed
  if (right.length === 0) {
    return false;
  }
  
  // Check: terminal* followed by at most one nonterminal at the end
  for (let i = 0; i < right.length; i++) {
    const symbol = right[i]!;
    const isNT = /^[A-Z]$/.test(symbol);
    
    if (isNT) {
      // Nonterminal must be at the end
      if (i !== right.length - 1) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if a production is left-linear
 * Left-linear: A -> B a | a | ε
 * (nonterminal terminal* | terminal+ | ε)
 */
function isLeftLinear(prod: Production): boolean {
  const { right } = prod;
  
  // ε is allowed
  if (right.length === 1 && right[0] === 'ε') {
    return true;
  }
  
  // Empty (other than ε) not allowed
  if (right.length === 0) {
    return false;
  }
  
  // Check: at most one nonterminal at the beginning, followed by terminal*
  for (let i = 0; i < right.length; i++) {
    const symbol = right[i]!;
    const isNT = /^[A-Z]$/.test(symbol);
    
    if (isNT) {
      // Nonterminal must be at the beginning
      if (i !== 0) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if grammar is Type 3 (regular)
 * All productions must be right-linear OR all must be left-linear (not mixed)
 * AND each production must have a single nonterminal on the left side
 */
function isType3(grammar: Grammar): { isType3: boolean; subtype?: 'right-linear' | 'left-linear' } {
  // Type 3 requires single nonterminal on left side (this is CFG requirement too)
  for (const prod of grammar.productions) {
    const leftSymbols = prod.left.trim().split(/\s+/);
    if (leftSymbols.length !== 1 || !/^[A-Z]$/.test(leftSymbols[0]!)) {
      return { isType3: false };
    }
  }
  
  const allRightLinear = grammar.productions.every(isRightLinear);
  const allLeftLinear = grammar.productions.every(isLeftLinear);
  
  if (allRightLinear) {
    return { isType3: true, subtype: 'right-linear' };
  }
  
  if (allLeftLinear) {
    return { isType3: true, subtype: 'left-linear' };
  }
  
  return { isType3: false };
}

/**
 * Check if grammar is Type 2 (context-free)
 * All productions have single nonterminal on left side
 */
function isType2(grammar: Grammar): boolean {
  for (const prod of grammar.productions) {
    // Left side must be a single nonterminal
    const leftSymbols = prod.left.trim().split(/\s+/);
    if (leftSymbols.length !== 1) {
      return false;
    }
    const symbol = leftSymbols[0]!;
    if (!/^[A-Z]$/.test(symbol)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if grammar is Type 1 (context-sensitive / non-contracting)
 * For all productions: |left| <= |right|
 * Exception: S -> ε allowed if S doesn't appear on any right side
 */
function isType1(grammar: Grammar): boolean {
  const startSymbol = grammar.startSymbol;
  
  // Check if start symbol appears on right side
  const startAppearsOnRight = grammar.productions.some(prod =>
    prod.right.includes(startSymbol)
  );
  
  for (const prod of grammar.productions) {
    const leftSymbols = prod.left.trim().split(/\s+/).filter(s => s);
    const leftLength = leftSymbols.length;
    const rightLength = prod.right.filter(s => s !== 'ε').length;
    
    // Handle ε productions
    if (prod.right.length === 1 && prod.right[0] === 'ε') {
      // S -> ε allowed if S doesn't appear on right
      if (leftLength === 1 && leftSymbols[0] === startSymbol && !startAppearsOnRight) {
        continue;
      }
      // Other ε productions violate Type 1
      return false;
    }
    
    // Non-contracting: |left| <= |right|
    if (leftLength > rightLength) {
      return false;
    }
  }
  
  return true;
}

/**
 * Classify grammar by form
 */
export function classifyGrammar(grammar: Grammar): GrammarClassification {
  // Check from most restrictive to least restrictive
  
  // Type 3 (Regular)
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
  
  // Type 0 (Unrestricted)
  return {
    type: 'Type 0',
    description: 'Unrestricted',
    explanation: 'This grammar is unrestricted (no constraints on production form). This is an upper bound on the language class.',
    isUpperBound: true,
  };
}
