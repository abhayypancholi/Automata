import { describe, it, expect } from 'vitest';
import { enumerate, countStrings } from './enumerate';

describe('enumerate', () => {
  it('should return empty string for length 0', () => {
    const result = enumerate(['0', '1'], 0);
    expect(result).toEqual(['']);
  });

  it('should enumerate binary strings up to length 2', () => {
    const result = enumerate(['0', '1'], 2);
    expect(result).toEqual(['', '0', '1', '00', '01', '10', '11']);
  });

  it('should enumerate in length-then-lexicographic order', () => {
    const result = enumerate(['a', 'b', 'c'], 2);
    expect(result).toEqual([
      '',
      'a',
      'b',
      'c',
      'aa',
      'ab',
      'ac',
      'ba',
      'bb',
      'bc',
      'ca',
      'cb',
      'cc',
    ]);
  });

  it('should handle single symbol alphabet', () => {
    const result = enumerate(['x'], 3);
    expect(result).toEqual(['', 'x', 'xx', 'xxx']);
  });

  it('should handle empty alphabet', () => {
    const result = enumerate([], 5);
    expect(result).toEqual(['']);
  });

  it('should respect alphabet order', () => {
    const result = enumerate(['1', '0'], 1);
    // Alphabet order is ['1', '0'], so '1' comes before '0'
    expect(result).toEqual(['', '1', '0']);
  });
});

describe('countStrings', () => {
  it('should count correctly for binary alphabet', () => {
    // 1 + 2 + 4 + 8 = 15
    expect(countStrings(2, 3)).toBe(15);
  });

  it('should count correctly for ternary alphabet', () => {
    // 1 + 3 + 9 = 13
    expect(countStrings(3, 2)).toBe(13);
  });

  it('should return 1 for length 0', () => {
    expect(countStrings(5, 0)).toBe(1);
  });

  it('should return 1 for empty alphabet', () => {
    expect(countStrings(0, 10)).toBe(1);
  });

  it('should match actual enumeration count', () => {
    for (const alphabetSize of [1, 2, 3, 4]) {
      for (const maxLength of [0, 1, 2, 3]) {
        const alphabet = Array.from({ length: alphabetSize }, (_, i) =>
          String.fromCharCode(97 + i)
        );
        const actual = enumerate(alphabet, maxLength).length;
        const expected = countStrings(alphabetSize, maxLength);
        expect(actual).toBe(expected);
      }
    }
  });
});
