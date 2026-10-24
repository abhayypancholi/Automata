/**
 * String enumeration over an alphabet
 * 
 * Generates all strings up to a given length in length-then-lexicographic order.
 * 
 * Algorithm: For length 0..n, generate all strings of that length by treating
 * them as base-k numbers where k = |alphabet|.
 */

import type { Symbol } from './types';

/**
 * Enumerate all strings up to length n over the given alphabet
 * 
 * Order: empty string, then all length-1 strings in alphabet order,
 * then all length-2 strings, etc.
 * 
 * Example: alphabet=['0','1'], n=2 gives ['', '0', '1', '00', '01', '10', '11']
 */
export function enumerate(alphabet: Symbol[], maxLength: number): string[] {
  if (alphabet.length === 0) {
    return [''];
  }

  const result: string[] = [''];

  // For each length from 1 to n
  for (let length = 1; length <= maxLength; length++) {
    const count = Math.pow(alphabet.length, length);

    // Generate all strings of this length
    for (let i = 0; i < count; i++) {
      let num = i;
      const chars: string[] = [];

      // Convert i to base-k representation
      for (let pos = 0; pos < length; pos++) {
        chars.push(alphabet[num % alphabet.length]!);
        num = Math.floor(num / alphabet.length);
      }

      // chars are in reverse order (least significant first)
      result.push(chars.reverse().join(''));
    }
  }

  return result;
}

/**
 * Count of strings up to length n: 1 + k + k^2 + ... + k^n = (k^(n+1) - 1) / (k - 1)
 * Special cases: if k=0, only the empty string; if k=1, n+1 strings
 */
export function countStrings(alphabetSize: number, maxLength: number): number {
  if (alphabetSize === 0) return 1;
  if (maxLength === 0) return 1;
  if (alphabetSize === 1) return maxLength + 1;
  return (Math.pow(alphabetSize, maxLength + 1) - 1) / (alphabetSize - 1);
}
