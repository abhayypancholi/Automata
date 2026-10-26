/**
 * Grammar text parser
 * 
 * Parses context-free grammar text format:
 * - One production per line: A -> alpha | beta
 * - Uppercase letters are nonterminals
 * - Everything else (lowercase, symbols, digits) are terminals
 * - ε or eps represents epsilon (empty string)
 * - First production's left side is the start symbol
 * - Alternatives on same line separated by |
 */

import type { Result } from '../errors';

export interface Production {
  left: string; // Can be single nonterminal or multiple symbols (for Type 0/1)
  right: string[]; // Array of symbols (nonterminals or terminals)
  line: number;
}

export interface Grammar {
  productions: Production[];
  nonterminals: string[];
  terminals: string[];
  startSymbol: string;
}

/**
 * Check if a symbol is a nonterminal (uppercase letter)
 */
function isNonterminal(symbol: string): boolean {
  return /^[A-Z]$/.test(symbol);
}

/**
 * Normalize epsilon representations to ε
 */
function normalizeEpsilon(symbol: string): string {
  return symbol === 'eps' ? 'ε' : symbol;
}

/**
 * Parse a single production line
 * Format: A -> alpha | beta
 */
function parseProductionLine(line: string, lineNumber: number): Result<Production[]> {
  const trimmed = line.trim();
  if (!trimmed) {
    return { ok: true, value: [] }; // Empty line
  }
  
  // Split by arrow
  const arrowIndex = trimmed.indexOf('->');
  if (arrowIndex === -1) {
    return {
      ok: false,
      error: {
        code: 'MALFORMED_GRAMMAR',
        message: `Missing '->' in production`,
        line: lineNumber,
      },
    };
  }
  
  const leftPart = trimmed.slice(0, arrowIndex).trim();
  const rightPart = trimmed.slice(arrowIndex + 2).trim();
  
  // Validate left side is not empty
  if (!leftPart) {
    return {
      ok: false,
      error: {
        code: 'MALFORMED_GRAMMAR',
        message: `Left side cannot be empty`,
        line: lineNumber,
      },
    };
  }
  
  // Validate left side
  const leftSymbols = leftPart.split(/\s+/);
  if (leftSymbols.length === 0) {
    return {
      ok: false,
      error: {
        code: 'MALFORMED_GRAMMAR',
        message: `Left side cannot be empty`,
        line: lineNumber,
      },
    };
  }
  
  // For context-sensitive grammars, we allow multiple symbols on left
  // But for now, let's parse the left side as-is
  const left = leftSymbols.join(' ');
  
  // Parse right side (may have alternatives separated by |)
  if (!rightPart) {
    return {
      ok: false,
      error: {
        code: 'MALFORMED_GRAMMAR',
        message: `Right side cannot be empty (use ε for epsilon)`,
        line: lineNumber,
      },
    };
  }
  
  const alternatives = rightPart.split('|').map(alt => alt.trim());
  const productions: Production[] = [];
  
  for (const alt of alternatives) {
    if (!alt) {
      return {
        ok: false,
        error: {
          code: 'MALFORMED_GRAMMAR',
          message: `Empty alternative in production`,
          line: lineNumber,
        },
      };
    }
    
    // Parse symbols in alternative
    const symbols = alt.split(/\s+/).map(normalizeEpsilon);
    
    productions.push({
      left,
      right: symbols,
      line: lineNumber,
    });
  }
  
  return { ok: true, value: productions };
}

/**
 * Parse grammar text into structured format
 */
export function parseGrammar(text: string): Result<Grammar> {
  const lines = text.split('\n');
  const productions: Production[] = [];
  
  // Parse each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNumber = i + 1;
    
    const result = parseProductionLine(line, lineNumber);
    if (!result.ok) {
      return result;
    }
    
    productions.push(...result.value);
  }
  
  if (productions.length === 0) {
    return {
      ok: false,
      error: {
        code: 'MALFORMED_GRAMMAR',
        message: 'Grammar must have at least one production',
      },
    };
  }
  
  // Extract nonterminals and terminals
  const nonterminals = new Set<string>();
  const terminals = new Set<string>();
  
  for (const prod of productions) {
    nonterminals.add(prod.left);
    
    for (const symbol of prod.right) {
      if (symbol === 'ε') {
        // Epsilon is not a terminal
        continue;
      } else if (isNonterminal(symbol)) {
        nonterminals.add(symbol);
      } else {
        terminals.add(symbol);
      }
    }
  }
  
  // Start symbol is the left side of first production
  const startSymbol = productions[0]!.left;
  
  return {
    ok: true,
    value: {
      productions,
      nonterminals: Array.from(nonterminals).sort(),
      terminals: Array.from(terminals).sort(),
      startSymbol,
    },
  };
}
