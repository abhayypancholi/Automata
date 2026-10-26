/**
 * Tests for grammar parsing
 */

import { describe, it, expect } from 'vitest';
import { parseGrammar } from './grammarParse';

describe('grammarParse - valid grammars', () => {
  it('parses simple right-linear grammar', () => {
    const text = `S -> a S
S -> b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.startSymbol).toBe('S');
    expect(result.value.productions).toHaveLength(2);
    expect(result.value.productions[0]).toEqual({
      left: 'S',
      right: ['a', 'S'],
      line: 1,
    });
    expect(result.value.productions[1]).toEqual({
      left: 'S',
      right: ['b'],
      line: 2,
    });
  });
  
  it('parses grammar with multiple alternatives on one line', () => {
    const text = `S -> a B | b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.productions).toHaveLength(2);
    expect(result.value.productions[0]).toEqual({
      left: 'S',
      right: ['a', 'B'],
      line: 1,
    });
    expect(result.value.productions[1]).toEqual({
      left: 'S',
      right: ['b'],
      line: 1,
    });
  });
  
  it('handles epsilon as ε', () => {
    const text = `S -> ε`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.productions[0]?.right).toEqual(['ε']);
  });
  
  it('handles epsilon as eps', () => {
    const text = `S -> eps`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.productions[0]?.right).toEqual(['ε']);
  });
  
  it('recognizes uppercase as nonterminals', () => {
    const text = `S -> A B C`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const grammar = result.value;
    expect(grammar.nonterminals).toContain('S');
    expect(grammar.nonterminals).toContain('A');
    expect(grammar.nonterminals).toContain('B');
    expect(grammar.nonterminals).toContain('C');
  });
  
  it('recognizes lowercase and symbols as terminals', () => {
    const text = `S -> a b + * 0`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const grammar = result.value;
    expect(grammar.terminals).toContain('a');
    expect(grammar.terminals).toContain('b');
    expect(grammar.terminals).toContain('+');
    expect(grammar.terminals).toContain('*');
    expect(grammar.terminals).toContain('0');
  });
  
  it('handles multi-line grammar', () => {
    const text = `S -> A B
A -> a
B -> b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.productions).toHaveLength(3);
    expect(result.value.startSymbol).toBe('S');
  });
  
  it('ignores empty lines', () => {
    const text = `S -> a

A -> b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.productions).toHaveLength(2);
  });
});

describe('grammarParse - malformed grammars', () => {
  it('rejects production without arrow', () => {
    const text = `S a B`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('MALFORMED_GRAMMAR');
    expect(result.error.line).toBe(1);
  });
  
  it('rejects empty right side without epsilon', () => {
    const text = `S ->`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('MALFORMED_GRAMMAR');
  });
  
  it('rejects empty left side', () => {
    const text = `-> a b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('MALFORMED_GRAMMAR');
    expect(result.error.message).toContain('Left side cannot be empty');
  });
  
  it('rejects empty alternative', () => {
    const text = `S -> a | | b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('MALFORMED_GRAMMAR');
    expect(result.error.message).toContain('Empty alternative');
  });
  
  it('rejects grammar with no productions', () => {
    const text = ``;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('MALFORMED_GRAMMAR');
    expect(result.error.message).toContain('at least one production');
  });
  
  it('allows multi-symbol left side for Type 0/1 grammars', () => {
    // Multi-symbol left sides are needed for context-sensitive and unrestricted grammars
    const text = `S A -> b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.productions[0]?.left).toBe('S A');
  });
  
  it('allows lowercase and symbols in right side', () => {
    // Lowercase letters and symbols are terminals
    const text = `S -> a b + *`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.productions[0]?.right).toEqual(['a', 'b', '+', '*']);
  });
  
  it('correctly identifies start symbol from first production', () => {
    const text = `A -> a
B -> b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.startSymbol).toBe('A');
  });
});
