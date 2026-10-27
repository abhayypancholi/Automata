/**
 * Token definitions for the mini-language lexer
 * 
 * Token types are defined with regular expressions in our supported dialect.
 * Priority is determined by order in the list.
 */

export type TokenType =
  | 'BIN'        // Binary literal: 0b1010
  | 'OCT'        // Octal literal: 0o17
  | 'HEX'        // Hex literal: 0xFF
  | 'NUMBER'     // Decimal number: 123, 1.5, 1e-3
  | 'DIFF'       // Derivative: dv/dt
  | 'IDENT'      // Identifier: foo, bar_1
  | 'PLUS'       // +
  | 'MINUS'      // -
  | 'STAR'       // *
  | 'SLASH'      // /
  | 'POWER'      // ** (must come before CARET)
  | 'CARET'      // ^
  | 'LPAREN'     // (
  | 'RPAREN'     // )
  | 'COMMA'      // ,
  | 'COLON'      // :
  | 'EQUALS'     // =
  | 'COMMENT'    // # comment
  | 'NEWLINE'    // \n
  | 'WS';        // whitespace (skipped)

export interface TokenDef {
  type: TokenType;
  regex: string;
  skip?: boolean;  // If true, don't emit tokens of this type
}

/**
 * Token definitions in priority order
 * 
 * Priority rules:
 * - BIN/OCT/HEX before NUMBER (to avoid "0x" being lexed as NUMBER "0" then IDENT "x")
 * - DIFF before IDENT (to recognize dv/dt as DIFF, not IDENT "dv")
 * - POWER before CARET (to recognize ** as single token)
 */
export const tokenDefs: TokenDef[] = [
  // Numeric literals (specific before general)
  { type: 'BIN', regex: '0(b|B)(0|1)(0|1)*' },
  { type: 'OCT', regex: '0(o|O)(0|1|2|3|4|5|6|7)(0|1|2|3|4|5|6|7)*' },
  { type: 'HEX', regex: '0(x|X)(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|A|B|C|D|E|F)(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|A|B|C|D|E|F)*' },
  
  // Decimal numbers with optional decimal point and exponent
  // Pattern: digits (. digits)? (e/E (+/-)? digits)?
  { type: 'NUMBER', regex: '(0|1|2|3|4|5|6|7|8|9)(0|1|2|3|4|5|6|7|8|9)*(\\.(0|1|2|3|4|5|6|7|8|9)(0|1|2|3|4|5|6|7|8|9)*)?((e|E)(\\+|\\-)?(0|1|2|3|4|5|6|7|8|9)(0|1|2|3|4|5|6|7|8|9)*)?' },
  
  // Derivative token: d<ident>/dt
  // Pattern: d [a-zA-Z_][a-zA-Z0-9_]* /dt
  { type: 'DIFF', regex: 'd(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|_)(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_)*/dt' },
  
  // Identifiers
  { type: 'IDENT', regex: '(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|_)(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|0|1|2|3|4|5|6|7|8|9|_)*' },
  
  // Operators (longest first)
  { type: 'POWER', regex: '\\*\\*' },
  { type: 'PLUS', regex: '\\+' },
  { type: 'MINUS', regex: '\\-' },
  { type: 'STAR', regex: '\\*' },
  { type: 'SLASH', regex: '\\/' },
  { type: 'CARET', regex: '\\^' },
  
  // Punctuation
  { type: 'LPAREN', regex: '\\(' },
  { type: 'RPAREN', regex: '\\)' },
  { type: 'COMMA', regex: '\\,' },
  { type: 'COLON', regex: '\\:' },
  { type: 'EQUALS', regex: '\\=' },
  
  // Comment: # followed by any printable characters until newline
  // Since we don't support negated classes, list allowed characters
  // Printable ASCII: space (32) through ~ (126)
  { type: 'COMMENT', regex: '\\#( |\\!|\\"|\\#|\\$|\\%|\\&|\\\'|\\(|\\)|\\*|\\+|\\,|\\-|\\.|\\\/|0|1|2|3|4|5|6|7|8|9|\\:|\\;|\\<|\\=|\\>|\\?|\\@|A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z|\\[|\\\\|\\]|\\^|\\_|\\`|a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z|\\{|\\||\\}|\\~)*' },
  
  // Newline
  { type: 'NEWLINE', regex: '\\n' },
  
  // Whitespace (skip)
  { type: 'WS', regex: '( |\\t)(( |\\t)*)', skip: true },
];

/**
 * Array of all token types in priority order
 */
export const TOKEN_TYPES: TokenType[] = tokenDefs.map(def => def.type);
