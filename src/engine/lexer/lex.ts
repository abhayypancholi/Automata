/**
 * Lexical analyzer (lexer/tokenizer)
 * 
 * Uses direct pattern matching with maximal munch:
 * 1. Try each token pattern in priority order
 * 2. Track the longest match found
 * 3. Emit the token for the longest match
 * 4. If no match, error UNEXPECTED_CHARACTER
 * 
 * Special handling:
 * - After matching DIFF, check if next char is identifier char
 *   If so, discard DIFF and re-lex as IDENT
 * - Skip WS tokens
 * - Track line/column (1-based)
 */

import type { Result } from '../errors';
import type { TokenType } from './tokenDefs';

export interface Token {
  type: TokenType;
  text: string;
  offset: number;  // 0-based character offset in input
  line: number;    // 1-based line number
  column: number;  // 1-based column number
}

export interface LexResult {
  tokens: Token[];
}

/**
 * Token pattern matchers (in priority order)
 */
const patterns: Array<{ type: TokenType; regex: RegExp; skip?: boolean }> = [
  { type: 'BIN', regex: /^0[bB][01]+/ },
  { type: 'OCT', regex: /^0[oO][0-7]+/ },
  { type: 'HEX', regex: /^0[xX][0-9a-fA-F]+/ },
  { type: 'NUMBER', regex: /^[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/ },
  { type: 'DIFF', regex: /^d[a-zA-Z_][a-zA-Z0-9_]*\/dt/ },
  { type: 'IDENT', regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
  { type: 'POWER', regex: /^\*\*/ },
  { type: 'PLUS', regex: /^\+/ },
  { type: 'MINUS', regex: /^-/ },
  { type: 'STAR', regex: /^\*/ },
  { type: 'SLASH', regex: /^\// },
  { type: 'CARET', regex: /^\^/ },
  { type: 'LPAREN', regex: /^\(/ },
  { type: 'RPAREN', regex: /^\)/ },
  { type: 'COMMA', regex: /^,/ },
  { type: 'COLON', regex: /^:/ },
  { type: 'EQUALS', regex: /^=/ },
  { type: 'COMMENT', regex: /^#[^\n]*/ },
  { type: 'NEWLINE', regex: /^\n/ },
  { type: 'WS', regex: /^[ \t]+/, skip: true },
];

/**
 * Lex the input string into tokens
 */
export function lex(input: string): Result<LexResult> {
  const tokens: Token[] = [];
  
  let offset = 0;
  let line = 1;
  let column = 1;
  
  while (offset < input.length) {
    let longestMatch: { type: TokenType; text: string; skip?: boolean } | null = null;
    
    // Try each pattern (maximal munch: take longest match)
    for (const pattern of patterns) {
      const remaining = input.slice(offset);
      const match = remaining.match(pattern.regex);
      
      if (match && match[0]) {
        if (!longestMatch || match[0].length > longestMatch.text.length) {
          longestMatch = {
            type: pattern.type,
            text: match[0],
            skip: pattern.skip,
          };
        }
      }
    }
    
    if (!longestMatch) {
      return {
        ok: false,
        error: {
          code: 'UNEXPECTED_CHARACTER',
          message: `Unexpected character: '${input[offset]}'`,
          line,
          column,
          offset,
          length: 1,
        },
      };
    }
    
    let tokenType = longestMatch.type;
    let text = longestMatch.text;
    
    // Special handling for DIFF followed by identifier characters
    if (tokenType === 'DIFF') {
      const nextOffset = offset + text.length;
      if (nextOffset < input.length) {
        const nextChar = input[nextOffset]!;
        if (/[a-zA-Z0-9_]/.test(nextChar)) {
          // This is actually "dx/dtau" not "dv/dt"
          // Re-lex as IDENT from the current position
          const identMatch = input.slice(offset).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
          if (identMatch) {
            tokenType = 'IDENT';
            text = identMatch[0];
          }
        }
      }
    }
    
    // Emit token (unless it should be skipped)
    if (!longestMatch.skip) {
      tokens.push({
        type: tokenType,
        text,
        offset,
        line,
        column,
      });
    }
    
    // Update line/column
    for (const char of text) {
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    offset += text.length;
  }
  
  return {
    ok: true,
    value: { tokens },
  };
}
