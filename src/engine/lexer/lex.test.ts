/**
 * Tests for lexer
 */

import { describe, it, expect } from 'vitest';
import { lex } from './lex';
import { buildLexerDFA } from './buildLexer';

describe('lex - numeric literals', () => {
  it('lexes binary literals', () => {
    const result = lex('0b1010');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'BIN',
      text: '0b1010',
      line: 1,
      column: 1,
    });
  });
  
  it('lexes octal literals', () => {
    const result = lex('0o17');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'OCT',
      text: '0o17',
    });
  });
  
  it('lexes hex literals (uppercase X)', () => {
    const result = lex('0xFF');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'HEX',
      text: '0xFF',
    });
  });
  
  it('lexes hex literals (lowercase x)', () => {
    const result = lex('0xff');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'HEX',
      text: '0xff',
    });
  });
  
  it('lexes decimal integers', () => {
    const result = lex('123');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'NUMBER',
      text: '123',
    });
  });
  
  it('lexes decimal with fraction', () => {
    const result = lex('2.5');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'NUMBER',
      text: '2.5',
    });
  });
  
  it('lexes number with exponent', () => {
    const result = lex('1e-3');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'NUMBER',
      text: '1e-3',
    });
  });
});

describe('lex - identifiers and derivatives', () => {
  it('lexes identifiers', () => {
    const result = lex('foo bar_1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(2);
    expect(result.value.tokens[0]).toMatchObject({ type: 'IDENT', text: 'foo' });
    expect(result.value.tokens[1]).toMatchObject({ type: 'IDENT', text: 'bar_1' });
  });
  
  it('lexes derivative token', () => {
    const result = lex('dv/dt');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'DIFF',
      text: 'dv/dt',
    });
  });
  
  it('handles dx/dtau fallback (derivative followed by identifier chars)', () => {
    const result = lex('dx/dtau');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Should lex as: IDENT "dx", SLASH "/", IDENT "dtau"
    expect(result.value.tokens).toHaveLength(3);
    expect(result.value.tokens[0]).toMatchObject({ type: 'IDENT', text: 'dx' });
    expect(result.value.tokens[1]).toMatchObject({ type: 'SLASH', text: '/' });
    expect(result.value.tokens[2]).toMatchObject({ type: 'IDENT', text: 'dtau' });
  });
});

describe('lex - operators', () => {
  it('lexes single-character operators', () => {
    const result = lex('+ - * / ^');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(5);
    expect(result.value.tokens[0]).toMatchObject({ type: 'PLUS' });
    expect(result.value.tokens[1]).toMatchObject({ type: 'MINUS' });
    expect(result.value.tokens[2]).toMatchObject({ type: 'STAR' });
    expect(result.value.tokens[3]).toMatchObject({ type: 'SLASH' });
    expect(result.value.tokens[4]).toMatchObject({ type: 'CARET' });
  });
  
  it('lexes ** as POWER (maximal munch)', () => {
    const result = lex('**');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({ type: 'POWER', text: '**' });
  });
  
  it('distinguishes ** from two *', () => {
    const result = lex('a**b * c');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const types = result.value.tokens.map(t => t.type);
    expect(types).toEqual(['IDENT', 'POWER', 'IDENT', 'STAR', 'IDENT']);
  });
});

describe('lex - punctuation', () => {
  it('lexes punctuation', () => {
    const result = lex('( ) , : =');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(5);
    expect(result.value.tokens.map(t => t.type)).toEqual([
      'LPAREN', 'RPAREN', 'COMMA', 'COLON', 'EQUALS'
    ]);
  });
});

describe('lex - comments and newlines', () => {
  it('lexes comments', () => {
    const result = lex('# this is a comment');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(1);
    expect(result.value.tokens[0]).toMatchObject({
      type: 'COMMENT',
      text: '# this is a comment',
    });
  });
  
  it('lexes newlines', () => {
    const result = lex('a\nb');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(3);
    expect(result.value.tokens[1]).toMatchObject({ type: 'NEWLINE', text: '\n' });
  });
  
  it('skips whitespace', () => {
    const result = lex('a   b');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // Should only get the two identifiers, not the whitespace
    expect(result.value.tokens).toHaveLength(2);
    expect(result.value.tokens.map(t => t.type)).toEqual(['IDENT', 'IDENT']);
  });
});

describe('lex - line and column tracking', () => {
  it('tracks line and column for single line', () => {
    const result = lex('a + b');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens[0]).toMatchObject({ line: 1, column: 1 });  // a
    expect(result.value.tokens[1]).toMatchObject({ line: 1, column: 3 });  // +
    expect(result.value.tokens[2]).toMatchObject({ line: 1, column: 5 });  // b
  });
  
  it('tracks line numbers across newlines', () => {
    const result = lex('a\nb\nc');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens[0]).toMatchObject({ type: 'IDENT', line: 1, column: 1 });
    expect(result.value.tokens[1]).toMatchObject({ type: 'NEWLINE', line: 1, column: 2 });
    expect(result.value.tokens[2]).toMatchObject({ type: 'IDENT', line: 2, column: 1 });
    expect(result.value.tokens[3]).toMatchObject({ type: 'NEWLINE', line: 2, column: 2 });
    expect(result.value.tokens[4]).toMatchObject({ type: 'IDENT', line: 3, column: 1 });
  });
  
  it('tracks multi-line input correctly', () => {
    const result = lex('dv/dt = I\ntau : second');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    // First line
    expect(result.value.tokens[0]).toMatchObject({ type: 'DIFF', line: 1 });
    expect(result.value.tokens[1]).toMatchObject({ type: 'EQUALS', line: 1 });
    expect(result.value.tokens[2]).toMatchObject({ type: 'IDENT', text: 'I', line: 1 });
    expect(result.value.tokens[3]).toMatchObject({ type: 'NEWLINE', line: 1 });
    
    // Second line
    expect(result.value.tokens[4]).toMatchObject({ type: 'IDENT', text: 'tau', line: 2, column: 1 });
    expect(result.value.tokens[5]).toMatchObject({ type: 'COLON', line: 2 });
    expect(result.value.tokens[6]).toMatchObject({ type: 'IDENT', text: 'second', line: 2 });
  });
});

describe('lex - error handling', () => {
  it('reports UNEXPECTED_CHARACTER for invalid input', () => {
    const result = lex('a @ b');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNEXPECTED_CHARACTER');
    expect(result.error.message).toContain('@');
    expect(result.error.line).toBe(1);
    expect(result.error.column).toBe(3);
  });
  
  it('reports position for unexpected character', () => {
    const result = lex('foo\nbar @');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNEXPECTED_CHARACTER');
    expect(result.error.line).toBe(2);
    expect(result.error.column).toBe(5);
  });
});

describe('lex - maximal munch', () => {
  it('handles 0x1G as HEX then IDENT (maximal munch on hex)', () => {
    const result = lex('0x1G');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.tokens).toHaveLength(2);
    expect(result.value.tokens[0]).toMatchObject({ type: 'HEX', text: '0x1' });
    expect(result.value.tokens[1]).toMatchObject({ type: 'IDENT', text: 'G' });
  });
});

describe('lex - DFA properties', () => {
  it('builds lexer DFA once and reuses it', () => {
    const dfa1 = buildLexerDFA();
    const dfa2 = buildLexerDFA();
    
    // Should be the exact same object (cached)
    expect(dfa1).toBe(dfa2);
  });
  
  it('lexer DFA is deterministic', () => {
    const dfa = buildLexerDFA();
    
    expect(dfa.kind).toBe('DFA');
    
    // Check that for each state and symbol, there's at most one transition
    for (const state of dfa.states) {
      const symbolsSeen = new Set<string>();
      
      for (const trans of dfa.transitions) {
        if (trans.from === state) {
          expect(symbolsSeen.has(trans.symbol)).toBe(false);
          symbolsSeen.add(trans.symbol);
        }
      }
    }
  });
  
  it('lexer DFA has tags for token types', () => {
    const dfa = buildLexerDFA();
    
    expect(dfa.tags).toBeDefined();
    expect(Object.keys(dfa.tags).length).toBeGreaterThan(0);
    
    // Each tag should have type and priority
    for (const tag of Object.values(dfa.tags)) {
      expect(tag.type).toBeDefined();
      expect(typeof tag.priority).toBe('number');
    }
  });
});

describe('lex - complete examples', () => {
  it('lexes a complete equation', () => {
    const result = lex('dv/dt = (I - v)/tau : volt');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const types = result.value.tokens.map(t => t.type);
    expect(types).toEqual([
      'DIFF',      // dv/dt
      'EQUALS',    // =
      'LPAREN',    // (
      'IDENT',     // I
      'MINUS',     // -
      'IDENT',     // v
      'RPAREN',    // )
      'SLASH',     // /
      'IDENT',     // tau
      'COLON',     // :
      'IDENT',     // volt
    ]);
  });
  
  it('lexes parameter declaration', () => {
    const result = lex('tau : second');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const types = result.value.tokens.map(t => t.type);
    expect(types).toEqual(['IDENT', 'COLON', 'IDENT']);
  });
});
