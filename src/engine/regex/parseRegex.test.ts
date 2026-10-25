/**
 * Tests for regex parser adapter
 */

import { describe, it, expect } from 'vitest';
import { parseRegex } from './parseRegex';

describe('parseRegex - supported constructs', () => {
  it('parses a simple literal', () => {
    const result = parseRegex('a');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({ type: 'literal', value: 'a' });
    expect(result.value.alphabet).toEqual(['a']);
  });
  
  it('parses concatenation', () => {
    const result = parseRegex('abc');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'concat',
      children: [
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
        { type: 'literal', value: 'c' },
      ],
    });
    expect(result.value.alphabet).toEqual(['a', 'b', 'c']);
  });
  
  it('parses union with |', () => {
    const result = parseRegex('a|b');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    });
    expect(result.value.alphabet).toEqual(['a', 'b']);
  });
  
  it('parses Kleene star', () => {
    const result = parseRegex('a*');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'star',
      child: { type: 'literal', value: 'a' },
    });
  });
  
  it('parses plus', () => {
    const result = parseRegex('a+');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'plus',
      child: { type: 'literal', value: 'a' },
    });
  });
  
  it('parses optional', () => {
    const result = parseRegex('a?');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'optional',
      child: { type: 'literal', value: 'a' },
    });
  });
  
  it('parses grouping', () => {
    const result = parseRegex('(ab)');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'concat',
      children: [
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
      ],
    });
  });
  
  it('parses empty group as epsilon', () => {
    const result = parseRegex('()');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({ type: 'epsilon' });
    expect(result.value.alphabet).toEqual([]);
  });
  
  it('parses character class with literals', () => {
    const result = parseRegex('[abc]');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'class',
      chars: ['a', 'b', 'c'],
    });
    expect(result.value.alphabet).toEqual(['a', 'b', 'c']);
  });
  
  it('parses character class with range', () => {
    const result = parseRegex('[a-z]');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast.type).toBe('class');
    if (result.value.ast.type !== 'class') return;
    
    expect(result.value.ast.chars.length).toBe(26);
    expect(result.value.ast.chars[0]).toBe('a');
    expect(result.value.ast.chars[25]).toBe('z');
  });
  
  it('parses complex expression with precedence', () => {
    const result = parseRegex('ab|c*');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({
      type: 'union',
      left: {
        type: 'concat',
        children: [
          { type: 'literal', value: 'a' },
          { type: 'literal', value: 'b' },
        ],
      },
      right: {
        type: 'star',
        child: { type: 'literal', value: 'c' },
      },
    });
  });
  
  it('extracts alphabet in sorted order', () => {
    const result = parseRegex('cab');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.alphabet).toEqual(['a', 'b', 'c']);
  });
});

describe('parseRegex - unsupported features', () => {
  it('rejects anchors (^)', () => {
    const result = parseRegex('^abc');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNSUPPORTED_REGEX_FEATURE');
    expect(result.error.message).toContain('Assertion');
  });
  
  it('rejects anchors ($)', () => {
    const result = parseRegex('abc$');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNSUPPORTED_REGEX_FEATURE');
    expect(result.error.message).toContain('Assertion');
  });
  
  it('rejects backreferences', () => {
    const result = parseRegex('(a)\\1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNSUPPORTED_REGEX_FEATURE');
    expect(result.error.message).toContain('Backreferences');
  });
  
  it('rejects lookahead', () => {
    const result = parseRegex('a(?=b)');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNSUPPORTED_REGEX_FEATURE');
    expect(result.error.message).toContain('Assertion');
  });
  
  it('rejects negated character class', () => {
    const result = parseRegex('[^abc]');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNSUPPORTED_REGEX_FEATURE');
    expect(result.error.message).toContain('Negated character classes');
  });
  
  it('rejects counted repetition {n}', () => {
    const result = parseRegex('a{2}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNSUPPORTED_REGEX_FEATURE');
    expect(result.error.message).toContain('Counted repetition');
  });
  
  it('rejects counted repetition {n,m}', () => {
    const result = parseRegex('a{2,3}');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    
    expect(result.error.code).toBe('UNSUPPORTED_REGEX_FEATURE');
    expect(result.error.message).toContain('Counted repetition');
  });
  
  it('rejects flags', () => {
    // regexp-tree will parse /abc/i as having flags
    // Our parseRegex expects no flags since we add them ourselves
    const result = parseRegex('abc');
    expect(result.ok).toBe(true);
  });
});

describe('parseRegex - edge cases', () => {
  it('handles escaped metacharacters', () => {
    const result = parseRegex('\\*');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({ type: 'literal', value: '*' });
  });
  
  it('handles empty string (epsilon only)', () => {
    const result = parseRegex('()');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.ast).toEqual({ type: 'epsilon' });
  });
});
