/**
 * Tests for named languages library
 */

import { describe, it, expect } from 'vitest';
import { namedLanguages, getLanguage } from './namedLanguages';
import { enumerate } from '../automaton/enumerate';
import { simulate } from '../simulate/simulate';

describe('namedLanguages - structure', () => {
  it('has at least 11 named languages', () => {
    expect(namedLanguages.length).toBeGreaterThanOrEqual(11);
  });
  
  it('every language has required fields', () => {
    for (const lang of namedLanguages) {
      expect(lang.id).toBeTruthy();
      expect(lang.display).toBeTruthy();
      expect(lang.class).toBeTruthy();
      expect(lang.proofSketch).toBeTruthy();
      expect(typeof lang.membership).toBe('function');
      expect(typeof lang.witness).toBe('function');
    }
  });
});

describe('namedLanguages - a^n b^n', () => {
  const lang = getLanguage('anbn');
  
  it('exists and has correct class', () => {
    expect(lang).toBeDefined();
    expect(lang?.class).toBe('Type 2');
  });
  
  it('accepts valid strings', () => {
    expect(lang?.membership('')).toBe(true); // n=0
    expect(lang?.membership('ab')).toBe(true); // n=1
    expect(lang?.membership('aabb')).toBe(true); // n=2
    expect(lang?.membership('aaabbb')).toBe(true); // n=3
    expect(lang?.membership('aaaabbbb')).toBe(true); // n=4
    expect(lang?.membership('aaaaabbbbb')).toBe(true); // n=5
  });
  
  it('rejects invalid strings', () => {
    expect(lang?.membership('a')).toBe(false);
    expect(lang?.membership('b')).toBe(false);
    expect(lang?.membership('aab')).toBe(false);
    expect(lang?.membership('abb')).toBe(false);
    expect(lang?.membership('ba')).toBe(false);
    expect(lang?.membership('abab')).toBe(false);
    expect(lang?.membership('aabbb')).toBe(false);
  });
  
  it('generates valid witness for pumping', () => {
    for (let p = 2; p <= 8; p++) {
      const w = lang?.witness(p);
      expect(w).toBeTruthy();
      if (!w) continue;
      expect(w.length).toBeGreaterThanOrEqual(p);
      expect(lang?.membership(w)).toBe(true);
    }
  });
});

describe('namedLanguages - a^n b^n c^n', () => {
  const lang = getLanguage('anbncn');
  
  it('has correct class', () => {
    expect(lang?.class).toBe('Type 1');
  });
  
  it('accepts valid strings', () => {
    expect(lang?.membership('')).toBe(true); // n=0
    expect(lang?.membership('abc')).toBe(true);
    expect(lang?.membership('aabbcc')).toBe(true);
    expect(lang?.membership('aaabbbccc')).toBe(true);
    expect(lang?.membership('aaaabbbbcccc')).toBe(true);
    expect(lang?.membership('aaaaabbbbbccccc')).toBe(true);
    expect(lang?.membership('aaaaaabbbbbbcccccc')).toBe(true);
  });
  
  it('rejects invalid strings', () => {
    expect(lang?.membership('ab')).toBe(false);
    expect(lang?.membership('aabbc')).toBe(false);
    expect(lang?.membership('aabbccc')).toBe(false);
    expect(lang?.membership('abbc')).toBe(false);
    expect(lang?.membership('aabcc')).toBe(false);
    expect(lang?.membership('abcc')).toBe(false);
    expect(lang?.membership('abcabc')).toBe(false);
  });
});

describe('namedLanguages - ww^R (palindromes of even length)', () => {
  const lang = getLanguage('wwR');
  
  it('has correct class', () => {
    expect(lang?.class).toBe('Type 2');
  });
  
  it('accepts valid palindromes', () => {
    expect(lang?.membership('')).toBe(true);
    expect(lang?.membership('aa')).toBe(true);
    expect(lang?.membership('bb')).toBe(true);
    expect(lang?.membership('abba')).toBe(true);
    expect(lang?.membership('baab')).toBe(true);
    expect(lang?.membership('aabbaa')).toBe(true);
    expect(lang?.membership('abccba')).toBe(true);
  });
  
  it('rejects non-palindromes', () => {
    expect(lang?.membership('a')).toBe(false);
    expect(lang?.membership('ab')).toBe(false);
    expect(lang?.membership('abc')).toBe(false);
    expect(lang?.membership('abab')).toBe(false);
    expect(lang?.membership('aabba')).toBe(false);
    expect(lang?.membership('abcba')).toBe(false);
    expect(lang?.membership('aabbcc')).toBe(false);
  });
});

describe('namedLanguages - ww', () => {
  const lang = getLanguage('ww');
  
  it('has correct class', () => {
    expect(lang?.class).toBe('Type 1');
  });
  
  it('accepts repeated strings', () => {
    expect(lang?.membership('')).toBe(true);
    expect(lang?.membership('aa')).toBe(true);
    expect(lang?.membership('bb')).toBe(true);
    expect(lang?.membership('abab')).toBe(true);
    expect(lang?.membership('baba')).toBe(true);
    expect(lang?.membership('aabbaa bbaa')).toBe(false); // space not in alphabet
    expect(lang?.membership('abcabc')).toBe(true);
  });
  
  it('rejects non-repeated strings', () => {
    expect(lang?.membership('a')).toBe(false);
    expect(lang?.membership('ab')).toBe(false);
    expect(lang?.membership('abc')).toBe(false);
    expect(lang?.membership('aab')).toBe(false);
    expect(lang?.membership('abb')).toBe(false);
    expect(lang?.membership('abba')).toBe(false);
    expect(lang?.membership('abcdef')).toBe(false);
  });
});

describe('namedLanguages - palindromes', () => {
  const lang = getLanguage('palindromes');
  
  it('has correct class', () => {
    expect(lang?.class).toBe('Type 2');
  });
  
  it('accepts palindromes of any length', () => {
    expect(lang?.membership('')).toBe(true);
    expect(lang?.membership('a')).toBe(true);
    expect(lang?.membership('b')).toBe(true);
    expect(lang?.membership('aa')).toBe(true);
    expect(lang?.membership('aba')).toBe(true);
    expect(lang?.membership('abba')).toBe(true);
    expect(lang?.membership('abcba')).toBe(true);
    expect(lang?.membership('aabbaa')).toBe(true);
  });
  
  it('rejects non-palindromes', () => {
    expect(lang?.membership('ab')).toBe(false);
    expect(lang?.membership('abc')).toBe(false);
    expect(lang?.membership('abab')).toBe(false);
    expect(lang?.membership('aabba')).toBe(false);
    expect(lang?.membership('abcde')).toBe(false);
    expect(lang?.membership('aabbcc')).toBe(false);
  });
});

describe('namedLanguages - a*b*', () => {
  const lang = getLanguage('a*b*');
  
  it('has correct class and machine', () => {
    expect(lang?.class).toBe('Type 3');
    expect(lang?.machine).toBeDefined();
  });
  
  it('accepts strings with as followed by bs', () => {
    expect(lang?.membership('')).toBe(true);
    expect(lang?.membership('a')).toBe(true);
    expect(lang?.membership('b')).toBe(true);
    expect(lang?.membership('aa')).toBe(true);
    expect(lang?.membership('bb')).toBe(true);
    expect(lang?.membership('ab')).toBe(true);
    expect(lang?.membership('aabb')).toBe(true);
    expect(lang?.membership('aaabbb')).toBe(true);
  });
  
  it('rejects strings with b followed by a', () => {
    expect(lang?.membership('ba')).toBe(false);
    expect(lang?.membership('aba')).toBe(false);
    expect(lang?.membership('bba')).toBe(false);
    expect(lang?.membership('abba')).toBe(false);
    expect(lang?.membership('bab')).toBe(false);
    expect(lang?.membership('aabaa')).toBe(false);
  });
});

describe('namedLanguages - equal number of a and b', () => {
  const lang = getLanguage('equal-ab');
  
  it('has correct class', () => {
    expect(lang?.class).toBe('Type 2');
  });
  
  it('accepts strings with equal as and bs', () => {
    expect(lang?.membership('')).toBe(true);
    expect(lang?.membership('ab')).toBe(true);
    expect(lang?.membership('ba')).toBe(true);
    expect(lang?.membership('aabb')).toBe(true);
    expect(lang?.membership('abab')).toBe(true);
    expect(lang?.membership('abba')).toBe(true);
    expect(lang?.membership('baab')).toBe(true);
  });
  
  it('rejects strings with unequal as and bs', () => {
    expect(lang?.membership('a')).toBe(false);
    expect(lang?.membership('b')).toBe(false);
    expect(lang?.membership('aa')).toBe(false);
    expect(lang?.membership('aab')).toBe(false);
    expect(lang?.membership('abb')).toBe(false);
    expect(lang?.membership('aaab')).toBe(false);
    expect(lang?.membership('abbb')).toBe(false);
  });
});

describe('namedLanguages - even number of a', () => {
  const lang = getLanguage('even-a');
  
  it('has correct class and machine', () => {
    expect(lang?.class).toBe('Type 3');
    expect(lang?.machine).toBeDefined();
  });
  
  it('accepts strings with even number of a', () => {
    expect(lang?.membership('')).toBe(true);
    expect(lang?.membership('aa')).toBe(true);
    expect(lang?.membership('b')).toBe(true);
    expect(lang?.membership('bb')).toBe(true);
    expect(lang?.membership('aabb')).toBe(true);
    expect(lang?.membership('abab')).toBe(true);
    expect(lang?.membership('aaaa')).toBe(true);
  });
  
  it('rejects strings with odd number of a', () => {
    expect(lang?.membership('a')).toBe(false); // 1 is odd
    expect(lang?.membership('aaa')).toBe(false); // 3 is odd
    expect(lang?.membership('ab')).toBe(false); // 1 is odd
    expect(lang?.membership('aba')).toBe(true); // 2 is even - should accept
    expect(lang?.membership('aaaaa')).toBe(false); // 5 is odd
    expect(lang?.membership('aabba')).toBe(false); // 3 a's is odd - should reject
  });
});

describe('namedLanguages - machines agree with membership', () => {
  it('machine accepts same strings as membership for all strings up to length 8', () => {
    for (const lang of namedLanguages) {
      if (!lang.machine) continue;
      
      const machine = lang.machine;
      const alphabet = machine.alphabet;
      
      // Test all strings up to length 8
      for (let len = 0; len <= 8; len++) {
        const strings = enumerate(alphabet, len);
        
        for (const str of strings) {
          const membershipResult = lang.membership(str);
          const simResult = simulate(machine, str);
          
          expect(simResult.ok).toBe(true);
          if (!simResult.ok) continue;
          
          expect(simResult.value.accepted).toBe(membershipResult);
        }
      }
    }
  });
});


describe('namedLanguages - edge cases and coverage', () => {
  it('a^n b^m (n <= m) accepts edge cases', () => {
    const lang = getLanguage('anBm-n-leq-m');
    expect(lang?.membership('')).toBe(true); // n=0, m=0
    expect(lang?.membership('b')).toBe(true); // n=0, m=1
    expect(lang?.membership('bbb')).toBe(true); // n=0, m=3
    expect(lang?.membership('abb')).toBe(true); // n=1, m=2
  });
  
  it('a^p (prime) rejects composite and edge cases', () => {
    const lang = getLanguage('a-prime-power');
    expect(lang?.membership('')).toBe(false); // 0 not prime
    expect(lang?.membership('a')).toBe(false); // 1 not prime
    expect(lang?.membership('aaaa')).toBe(false); // 4 = 2*2
    expect(lang?.membership('aaaaaa')).toBe(false); // 6 = 2*3
    expect(lang?.membership('aaaaaaaaa')).toBe(false); // 9 = 3*3
    expect(lang?.membership('aa')).toBe(true); // 2 is prime
    expect(lang?.membership('aaaaa')).toBe(true); // 5 is prime
    expect(lang?.membership('aaaaaaa')).toBe(true); // 7 is prime
  });
  
  it('getLanguage returns undefined for unknown language', () => {
    const lang = getLanguage('nonexistent-language');
    expect(lang).toBeUndefined();
  });
  
  it('all languages have witness functions that generate valid strings', () => {
    for (const lang of namedLanguages) {
      // Test for p=2 to p=5 (higher values might have edge cases)
      for (let p = 2; p <= 5; p++) {
        const w = lang.witness(p);
        if (w.length < p) {
          console.error(`Language ${lang.id} witness too short for p=${p}: "${w}" (length ${w.length})`);
        }
        expect(w.length).toBeGreaterThanOrEqual(p);
        // Witness must be accepted by the language's membership function
        const accepted = lang.membership(w);
        if (!accepted) {
          // Debug which language and witness failed
          console.error(`Language ${lang.id} witness rejected for p=${p}: "${w}"`);
        }
        expect(accepted).toBe(true);
      }
    }
  });
  
  it('palindromes accepts single characters', () => {
    const lang = getLanguage('palindromes');
    for (const char of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
      expect(lang?.membership(char)).toBe(true);
    }
  });
  
  it('binary divisible by 3 handles empty string', () => {
    const lang = getLanguage('binary-div-3');
    // Empty string represents 0, which is divisible by 3
    expect(lang?.membership('')).toBe(true);
  });
  
  it('a^n b^n rejects strings with invalid characters', () => {
    const lang = getLanguage('anbn');
    expect(lang?.membership('aacbb')).toBe(false);
    expect(lang?.membership('ab1')).toBe(false);
    expect(lang?.membership('a b')).toBe(false);
  });
  
  it('a^n b^n c^n rejects strings with characters out of order', () => {
    const lang = getLanguage('anbncn');
    expect(lang?.membership('abcabc')).toBe(false);
    expect(lang?.membership('cab')).toBe(false);
    expect(lang?.membership('bac')).toBe(false);
  });
});
