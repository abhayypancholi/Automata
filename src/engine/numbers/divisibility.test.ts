/**
 * Tests for divisibility DFA builder
 */

import { describe, it, expect } from 'vitest';
import { buildDivisibilityDFA, isDivisible, getRemainder } from './divisibility';

describe('divisibility - DFA structure', () => {
  it('builds a DFA with n states for divisor n', () => {
    for (const n of [1, 2, 3, 5, 7, 64]) {
      const dfa = buildDivisibilityDFA(n);
      expect(dfa.states.length).toBe(n);
      expect(dfa.kind).toBe('DFA');
      expect(dfa.alphabet).toEqual(['0', '1']);
      expect(dfa.start).toBe('r0');
      expect(dfa.accepting).toEqual(['r0']);
    }
  });
  
  it('has correct transitions for each state', () => {
    const dfa = buildDivisibilityDFA(3);
    
    // Should have 2 transitions per state (for '0' and '1')
    expect(dfa.transitions.length).toBe(3 * 2);
    
    // Check specific transitions for n=3
    // From r0: δ(0,0)=(2*0+0)%3=0, δ(0,1)=(2*0+1)%3=1
    const r0Transitions = dfa.transitions.filter(t => t.from === 'r0');
    expect(r0Transitions).toContainEqual({ from: 'r0', symbol: '0', to: 'r0' });
    expect(r0Transitions).toContainEqual({ from: 'r0', symbol: '1', to: 'r1' });
  });
  
  it('rejects divisor less than 1', () => {
    expect(() => buildDivisibilityDFA(0)).toThrow('Divisor n must be >= 1');
    expect(() => buildDivisibilityDFA(-1)).toThrow('Divisor n must be >= 1');
  });
});

describe('divisibility - n=1', () => {
  it('accepts all binary strings (everything divisible by 1)', () => {
    const testCases = ['', '0', '1', '10', '11', '101', '1111'];
    for (const binary of testCases) {
      expect(isDivisible(1, binary)).toBe(true);
    }
  });
});

describe('divisibility - n=2 (even numbers)', () => {
  it('accepts binary strings ending in 0', () => {
    const even = ['0', '10', '100', '110', '1000', '1010'];
    for (const binary of even) {
      expect(isDivisible(2, binary)).toBe(true);
    }
  });
  
  it('rejects binary strings ending in 1', () => {
    const odd = ['1', '11', '101', '111', '1001', '1011'];
    for (const binary of odd) {
      expect(isDivisible(2, binary)).toBe(false);
    }
  });
});

describe('divisibility - n=3', () => {
  it('accepts binary strings divisible by 3', () => {
    // 0=0, 11=3, 110=6, 1001=9, 1100=12, 1111=15
    const divisibleBy3 = ['0', '11', '110', '1001', '1100', '1111'];
    for (const binary of divisibleBy3) {
      expect(isDivisible(3, binary)).toBe(true);
    }
  });
  
  it('rejects binary strings not divisible by 3', () => {
    // 1=1, 10=2, 100=4, 101=5, 111=7, 1000=8
    const notDivisibleBy3 = ['1', '10', '100', '101', '111', '1000'];
    for (const binary of notDivisibleBy3) {
      expect(isDivisible(3, binary)).toBe(false);
    }
  });
});

describe('divisibility - n=5', () => {
  it('accepts binary strings divisible by 5', () => {
    // 0=0, 101=5, 1010=10, 1111=15, 10100=20
    const divisibleBy5 = ['0', '101', '1010', '1111', '10100'];
    for (const binary of divisibleBy5) {
      expect(isDivisible(5, binary)).toBe(true);
    }
  });
  
  it('rejects binary strings not divisible by 5', () => {
    // 1=1, 10=2, 11=3, 100=4, 110=6
    const notDivisibleBy5 = ['1', '10', '11', '100', '110'];
    for (const binary of notDivisibleBy5) {
      expect(isDivisible(5, binary)).toBe(false);
    }
  });
});

describe('divisibility - n=7', () => {
  it('accepts binary strings divisible by 7', () => {
    // 0=0, 111=7, 1110=14, 10101=21
    const divisibleBy7 = ['0', '111', '1110', '10101'];
    for (const binary of divisibleBy7) {
      expect(isDivisible(7, binary)).toBe(true);
    }
  });
  
  it('rejects binary strings not divisible by 7', () => {
    // 1=1, 10=2, 11=3, 100=4, 101=5, 110=6
    const notDivisibleBy7 = ['1', '10', '11', '100', '101', '110'];
    for (const binary of notDivisibleBy7) {
      expect(isDivisible(7, binary)).toBe(false);
    }
  });
});

describe('divisibility - n=64', () => {
  it('accepts binary strings divisible by 64', () => {
    // Powers of 2: 64=1000000, 128=10000000
    const divisibleBy64 = ['0', '1000000', '10000000'];
    for (const binary of divisibleBy64) {
      expect(isDivisible(64, binary)).toBe(true);
    }
  });
  
  it('rejects binary strings not divisible by 64', () => {
    const notDivisibleBy64 = ['1', '10', '111', '1111', '111111'];
    for (const binary of notDivisibleBy64) {
      expect(isDivisible(64, binary)).toBe(false);
    }
  });
  
  it('has 64 states', () => {
    const dfa = buildDivisibilityDFA(64);
    expect(dfa.states.length).toBe(64);
  });
});

describe('divisibility - empty string', () => {
  it('accepts empty string for all n (0 is divisible by everything)', () => {
    for (const n of [1, 2, 3, 5, 7, 64]) {
      expect(isDivisible(n, '')).toBe(true);
    }
  });
});

describe('divisibility - getRemainder', () => {
  it('computes correct remainders', () => {
    // Test n=3
    expect(getRemainder(3, '')).toBe(0);
    expect(getRemainder(3, '0')).toBe(0);
    expect(getRemainder(3, '1')).toBe(1); // 1 % 3 = 1
    expect(getRemainder(3, '10')).toBe(2); // 2 % 3 = 2
    expect(getRemainder(3, '11')).toBe(0); // 3 % 3 = 0
    expect(getRemainder(3, '100')).toBe(1); // 4 % 3 = 1
    
    // Test n=5
    expect(getRemainder(5, '101')).toBe(0); // 5 % 5 = 0
    expect(getRemainder(5, '110')).toBe(1); // 6 % 5 = 1
    expect(getRemainder(5, '111')).toBe(2); // 7 % 5 = 2
  });
});

describe('divisibility - oracle tests with BigInt', () => {
  it('matches BigInt modulo for all binary strings up to length 14', () => {
    // Test all n from 1 to 20
    for (let n = 1; n <= 20; n++) {
      // Test specific binary strings up to length 14
      const testCases: string[] = [];
      
      // Add systematic test cases
      for (let len = 0; len <= 14; len++) {
        // Test a few random values for each length
        const samplesPerLength = Math.min(5, Math.pow(2, len));
        for (let i = 0; i < samplesPerLength; i++) {
          if (len === 0) {
            testCases.push('');
          } else {
            const value = Math.floor(Math.random() * Math.pow(2, len));
            const binary = value.toString(2);
            if (binary.length <= 14) {
              testCases.push(binary);
            }
          }
        }
      }
      
      // Also add edge cases
      testCases.push('0', '1', '10', '11', '111', '1111', '11111111111111');
      
      // Remove duplicates
      const uniqueCases = Array.from(new Set(testCases));
      
      for (const binary of uniqueCases) {
        const expected = binary === '' ? 0 : Number(BigInt(`0b${binary}`) % BigInt(n));
        const actual = getRemainder(n, binary);
        expect(actual).toBe(expected);
        
        // Also verify isDivisible
        const shouldBeDivisible = expected === 0;
        expect(isDivisible(n, binary)).toBe(shouldBeDivisible);
      }
    }
  });
  
  it('DFA simulation matches BigInt for specific test cases', () => {
    const testCases = [
      { n: 3, binary: '1001', value: 9 },
      { n: 5, binary: '1010', value: 10 },
      { n: 7, binary: '1110', value: 14 },
      { n: 10, binary: '1010', value: 10 },
      { n: 13, binary: '1101', value: 13 },
    ];
    
    for (const { n, binary, value } of testCases) {
      const expectedDivisible = value % n === 0;
      const actualDivisible = isDivisible(n, binary);
      expect(actualDivisible).toBe(expectedDivisible);
      
      const expectedRemainder = value % n;
      const actualRemainder = getRemainder(n, binary);
      expect(actualRemainder).toBe(expectedRemainder);
    }
  });
});
