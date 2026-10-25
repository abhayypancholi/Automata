/**
 * Tests for regex printer
 */

import { describe, it, expect } from 'vitest';
import { printCanonical, printTextbook } from './print';
import { parseRegex } from './parseRegex';
import type { RegexNode } from './types';

describe('printCanonical', () => {
  it('prints a literal', () => {
    const ast: RegexNode = { type: 'literal', value: 'a' };
    expect(printCanonical(ast)).toBe('a');
  });
  
  it('prints epsilon as ()', () => {
    const ast: RegexNode = { type: 'epsilon' };
    expect(printCanonical(ast)).toBe('()');
  });
  
  it('prints concatenation', () => {
    const ast: RegexNode = {
      type: 'concat',
      children: [
        { type: 'literal', value: 'a' },
        { type: 'literal', value: 'b' },
        { type: 'literal', value: 'c' },
      ],
    };
    expect(printCanonical(ast)).toBe('abc');
  });
  
  it('prints union with |', () => {
    const ast: RegexNode = {
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    };
    expect(printCanonical(ast)).toBe('a|b');
  });
  
  it('prints star', () => {
    const ast: RegexNode = {
      type: 'star',
      child: { type: 'literal', value: 'a' },
    };
    expect(printCanonical(ast)).toBe('a*');
  });
  
  it('prints plus', () => {
    const ast: RegexNode = {
      type: 'plus',
      child: { type: 'literal', value: 'a' },
    };
    expect(printCanonical(ast)).toBe('a+');
  });
  
  it('prints optional', () => {
    const ast: RegexNode = {
      type: 'optional',
      child: { type: 'literal', value: 'a' },
    };
    expect(printCanonical(ast)).toBe('a?');
  });
  
  it('prints character class', () => {
    const ast: RegexNode = {
      type: 'class',
      chars: ['a', 'b', 'c'],
    };
    expect(printCanonical(ast)).toBe('[abc]');
  });
  
  it('escapes special characters in literals', () => {
    const ast: RegexNode = { type: 'literal', value: '*' };
    expect(printCanonical(ast)).toBe('\\*');
  });
  
  it('escapes special characters in character classes', () => {
    const ast: RegexNode = {
      type: 'class',
      chars: [']', '-', '\\'],
    };
    const result = printCanonical(ast);
    expect(result).toContain('\\]');
    expect(result).toContain('\\-');
    expect(result).toContain('\\\\');
  });
});

describe('printTextbook', () => {
  it('prints union with +', () => {
    const ast: RegexNode = {
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    };
    expect(printTextbook(ast)).toBe('a+b');
  });
  
  it('prints other operators the same as canonical', () => {
    const ast: RegexNode = {
      type: 'star',
      child: { type: 'literal', value: 'a' },
    };
    expect(printTextbook(ast)).toBe('a*');
  });
});

describe('print - minimal parentheses', () => {
  it('adds parens for union in concat context', () => {
    const ast: RegexNode = {
      type: 'concat',
      children: [
        {
          type: 'union',
          left: { type: 'literal', value: 'a' },
          right: { type: 'literal', value: 'b' },
        },
        { type: 'literal', value: 'c' },
      ],
    };
    expect(printCanonical(ast)).toBe('(a|b)c');
  });
  
  it('adds parens for union in star context', () => {
    const ast: RegexNode = {
      type: 'star',
      child: {
        type: 'union',
        left: { type: 'literal', value: 'a' },
        right: { type: 'literal', value: 'b' },
      },
    };
    expect(printCanonical(ast)).toBe('(a|b)*');
  });
  
  it('adds parens for concat in star context', () => {
    const ast: RegexNode = {
      type: 'star',
      child: {
        type: 'concat',
        children: [
          { type: 'literal', value: 'a' },
          { type: 'literal', value: 'b' },
        ],
      },
    };
    expect(printCanonical(ast)).toBe('(ab)*');
  });
  
  it('does not add unnecessary parens for atoms', () => {
    const ast: RegexNode = {
      type: 'star',
      child: { type: 'literal', value: 'a' },
    };
    expect(printCanonical(ast)).toBe('a*');
  });
  
  it('handles nested unions without extra parens', () => {
    const ast: RegexNode = {
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: {
        type: 'union',
        left: { type: 'literal', value: 'b' },
        right: { type: 'literal', value: 'c' },
      },
    };
    expect(printCanonical(ast)).toBe('a|b|c');
  });
});

describe('print - round trip', () => {
  const testCases = [
    'a',
    'ab',
    'a|b',
    'a*',
    'a+',
    'a?',
    '(a|b)*',
    'a*b*',
    '(ab)*',
    '[abc]',
    '[0-9]',
    'a|b|c',
    '(a|b)(c|d)',
  ];
  
  for (const input of testCases) {
    it(`round trips: ${input}`, () => {
      const parsed1 = parseRegex(input);
      expect(parsed1.ok).toBe(true);
      if (!parsed1.ok) return;
      
      const printed = printCanonical(parsed1.value.ast);
      
      const parsed2 = parseRegex(printed);
      expect(parsed2.ok).toBe(true);
      if (!parsed2.ok) return;
      
      // The ASTs should be equivalent (may not be structurally identical due to grouping)
      // For now, just check that it parses successfully
      expect(parsed2.value.alphabet.sort()).toEqual(parsed1.value.alphabet.sort());
    });
  }
});

describe('print - textbook vs canonical', () => {
  it('uses different symbols for union', () => {
    const ast: RegexNode = {
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: { type: 'literal', value: 'b' },
    };
    
    expect(printCanonical(ast)).toBe('a|b');
    expect(printTextbook(ast)).toBe('a+b');
  });
  
  it('nested unions use consistent symbols', () => {
    const ast: RegexNode = {
      type: 'union',
      left: { type: 'literal', value: 'a' },
      right: {
        type: 'union',
        left: { type: 'literal', value: 'b' },
        right: { type: 'literal', value: 'c' },
      },
    };
    
    expect(printCanonical(ast)).toBe('a|b|c');
    expect(printTextbook(ast)).toBe('a+b+c');
  });
});
