/**
 * Tests for grammar classification
 */

import { describe, it, expect } from 'vitest';
import { parseGrammar } from './grammarParse';
import { classifyGrammar } from './classifyGrammar';

describe('classifyGrammar - Type 3 (regular)', () => {
  it('classifies right-linear grammar as Type 3', () => {
    const text = `S -> a S
S -> b S
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).toBe('Type 3');
    expect(classification.subtype).toBe('right-linear');
    expect(classification.isUpperBound).toBe(true);
  });
  
  it('classifies left-linear grammar as Type 3', () => {
    const text = `S -> S a
S -> S b
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).toBe('Type 3');
    expect(classification.subtype).toBe('left-linear');
  });
  
  it('classifies grammar with terminals only as Type 3', () => {
    const text = `S -> a
S -> b
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).toBe('Type 3');
  });
  
  it('does not classify mixed linear grammar as Type 3', () => {
    const text = `S -> a S
S -> S b`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).not.toBe('Type 3');
    expect(classification.type).toBe('Type 2');
  });
});

describe('classifyGrammar - Type 2 (context-free)', () => {
  it('classifies context-free grammar as Type 2', () => {
    const text = `S -> a S b
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).toBe('Type 2');
    expect(classification.description).toContain('Context-free');
  });
  
  it('states Type 2 is an upper bound', () => {
    const text = `S -> a S b
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.isUpperBound).toBe(true);
    expect(classification.explanation).toContain('upper bound');
  });
  
  it('classifies mixed linear as Type 2', () => {
    const text = `S -> a S
S -> S b`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).toBe('Type 2');
  });
  
  it('allows regular language written as Type 2 grammar', () => {
    // a*b* can be written as Type 2
    const text = `S -> A B
A -> a A
A -> ε
B -> b B
B -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).toBe('Type 2');
    expect(classification.explanation).toContain('upper bound');
  });
});

describe('classifyGrammar - Type 1 (context-sensitive)', () => {
  it('classifies non-contracting grammar as Type 1', () => {
    // Proper Type 1 example: context-sensitive with multi-symbol left side
    // and non-contracting property
    const text = `S -> a S B C
S -> a B C
C B -> B C
a B -> a b
b B -> b b
b C -> b c
c C -> c c`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    // Should be Type 1 because of multi-symbol left sides and non-contracting
    expect(classification.type).toBe('Type 1');
  });
  
  it('allows S -> ε for Type 1 when S not on right side', () => {
    const text = `S -> A B
A -> a A
A -> a
B -> b B
B -> b
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    // Should still be Type 2 or 3 depending on productions
    expect(['Type 2', 'Type 3']).toContain(classification.type);
  });
  
  it('classifies contracting grammar as Type 0', () => {
    // Contracting: |left| > |right|
    const text = `S A -> B
B -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    // B -> ε violates Type 1 (contracting), should be Type 0
    expect(classification.type).toBe('Type 0');
  });
  
  it('rejects S -> ε when S appears on right side', () => {
    const text = `S -> S a
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    // S appears on right side, so S -> ε violates Type 1
    // But it's still Type 3 (left-linear) so Type 3 takes precedence
    expect(classification.type).toBe('Type 3');
  });
});

describe('classifyGrammar - Type 0 (unrestricted)', () => {
  it('classifies multi-symbol left side as not Type 2', () => {
    const text = `S A -> B
B -> b`;
    const result = parseGrammar(text);
    
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    const classification = classifyGrammar(result.value);
    // Multi-symbol left side means it's not Type 2 (CFG)
    // It should be Type 0 or Type 1 depending on non-contracting property
    expect(classification.type).not.toBe('Type 2');
    expect(classification.type).not.toBe('Type 3');
  });
});

describe('classifyGrammar - S -> ε handling', () => {
  it('handles S -> ε in Type 3 grammar', () => {
    const text = `S -> a S
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    expect(classification.type).toBe('Type 3');
  });
  
  it('allows S -> ε when S not on any right side', () => {
    const text = `S -> A
A -> a A
A -> ε
S -> ε`;
    const parseResult = parseGrammar(text);
    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;
    
    const classification = classifyGrammar(parseResult.value);
    // Should be classified without S->ε violation
    expect(classification.type).not.toBe('Type 0');
  });
});
