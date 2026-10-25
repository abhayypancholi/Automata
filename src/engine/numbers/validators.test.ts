/**
 * Tests for number format validators
 */

import { describe, it, expect } from 'vitest';
import {
  buildBinaryValidator,
  buildBinaryWithPrefixValidator,
  buildOctalValidator,
  buildOctalWithPrefixValidator,
  buildHexValidator,
  buildHexWithPrefixValidator,
  validate,
} from './validators';

describe('validators - binary', () => {
  it('builds a valid DFA', () => {
    const result = buildBinaryValidator();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    
    expect(result.value.kind).toBe('DFA');
    expect(result.value.alphabet).toContain('0');
    expect(result.value.alphabet).toContain('1');
  });
  
  it('accepts valid binary strings', () => {
    const result = buildBinaryValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const valid = ['0', '1', '10', '11', '101', '1010', '11111111'];
    for (const str of valid) {
      expect(validate(dfa, str)).toBe(true);
    }
  });
  
  it('rejects invalid binary strings', () => {
    const result = buildBinaryValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const invalid = ['', '2', '8', 'a', '012', '10a', '0b101'];
    for (const str of invalid) {
      expect(validate(dfa, str)).toBe(false);
    }
  });
});

describe('validators - binary with prefix', () => {
  it('accepts valid prefixed binary strings', () => {
    const result = buildBinaryWithPrefixValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const valid = ['0b0', '0b1', '0B10', '0b101010', '0B11111111'];
    for (const str of valid) {
      expect(validate(dfa, str)).toBe(true);
    }
  });
  
  it('rejects strings without prefix or invalid format', () => {
    const result = buildBinaryWithPrefixValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const invalid = ['', '0', '1', '10', '0b', '0x10', '0b2', '0b10a'];
    for (const str of invalid) {
      expect(validate(dfa, str)).toBe(false);
    }
  });
});

describe('validators - octal', () => {
  it('accepts valid octal strings', () => {
    const result = buildOctalValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const valid = ['0', '1', '7', '10', '77', '123', '777', '1234567'];
    for (const str of valid) {
      expect(validate(dfa, str)).toBe(true);
    }
  });
  
  it('rejects invalid octal strings', () => {
    const result = buildOctalValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const invalid = ['', '8', '9', 'a', '08', '128', '0o77'];
    for (const str of invalid) {
      expect(validate(dfa, str)).toBe(false);
    }
  });
});

describe('validators - octal with prefix', () => {
  it('accepts valid prefixed octal strings', () => {
    const result = buildOctalWithPrefixValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const valid = ['0o0', '0o7', '0O10', '0o77', '0O1234567'];
    for (const str of valid) {
      expect(validate(dfa, str)).toBe(true);
    }
  });
  
  it('rejects strings without prefix or invalid format', () => {
    const result = buildOctalWithPrefixValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const invalid = ['', '0', '7', '77', '0o', '0o8', '0x77'];
    for (const str of invalid) {
      expect(validate(dfa, str)).toBe(false);
    }
  });
});

describe('validators - hex', () => {
  it('accepts valid hex strings', () => {
    const result = buildHexValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const valid = [
      '0', '9', 'a', 'f', 'A', 'F',
      '10', 'FF', 'ff', 'aB', 'DeadBeef', '123ABC',
    ];
    for (const str of valid) {
      expect(validate(dfa, str)).toBe(true);
    }
  });
  
  it('rejects invalid hex strings', () => {
    const result = buildHexValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const invalid = ['', 'g', 'z', '0x10', 'FFg', '10G'];
    for (const str of invalid) {
      expect(validate(dfa, str)).toBe(false);
    }
  });
});

describe('validators - hex with prefix', () => {
  it('accepts valid prefixed hex strings', () => {
    const result = buildHexWithPrefixValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const valid = [
      '0x0', '0x9', '0xa', '0xF',
      '0X10', '0xFF', '0xDeadBeef', '0X123ABC',
    ];
    for (const str of valid) {
      expect(validate(dfa, str)).toBe(true);
    }
  });
  
  it('rejects strings without prefix or invalid format', () => {
    const result = buildHexWithPrefixValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const invalid = ['', '0', 'FF', '0x', '0xG', '0xFFg', '0b10'];
    for (const str of invalid) {
      expect(validate(dfa, str)).toBe(false);
    }
  });
});

describe('validators - oracle tests', () => {
  it('binary validator agrees with regex on random strings', () => {
    const result = buildBinaryValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const binaryRegex = /^[01]+$/;
    
    // Test all strings up to length 5
    const testStrings = [
      '0', '1', '00', '01', '10', '11',
      '000', '001', '010', '011', '100', '101', '110', '111',
      '2', '8', 'a', '', '012', '10a', '0b10',
    ];
    
    for (const str of testStrings) {
      const expected = binaryRegex.test(str);
      const actual = validate(dfa, str);
      expect(actual).toBe(expected);
    }
  });
  
  it('octal validator agrees with regex on random strings', () => {
    const result = buildOctalValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const octalRegex = /^[0-7]+$/;
    
    const testStrings = [
      '0', '1', '7', '10', '77', '123', '777',
      '8', '9', '', '08', '0o77', 'a',
    ];
    
    for (const str of testStrings) {
      const expected = octalRegex.test(str);
      const actual = validate(dfa, str);
      expect(actual).toBe(expected);
    }
  });
  
  it('hex validator agrees with regex on random strings', () => {
    const result = buildHexValidator();
    if (!result.ok) throw new Error('Failed to build validator');
    const dfa = result.value;
    
    const hexRegex = /^[0-9a-fA-F]+$/;
    
    const testStrings = [
      '0', '9', 'a', 'f', 'A', 'F',
      '10', 'FF', 'ff', 'aB', 'DeadBeef',
      '', 'g', 'z', '0x10', 'FFg',
    ];
    
    for (const str of testStrings) {
      const expected = hexRegex.test(str);
      const actual = validate(dfa, str);
      expect(actual).toBe(expected);
    }
  });
  
  it('minimized DFAs have expected state counts', () => {
    const binary = buildBinaryValidator();
    const octal = buildOctalValidator();
    const hex = buildHexValidator();
    
    if (!binary.ok || !octal.ok || !hex.ok) {
      throw new Error('Failed to build validators');
    }
    
    // All should be minimal DFAs (1 start + 1 accepting + possibly 1 dead state)
    // Binary: 2 states (start/accepting, dead)
    // Octal: 2 states
    // Hex: 2 states
    expect(binary.value.states.length).toBeLessThanOrEqual(3);
    expect(octal.value.states.length).toBeLessThanOrEqual(3);
    expect(hex.value.states.length).toBeLessThanOrEqual(3);
  });
});
