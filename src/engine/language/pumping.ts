/**
 * Pumping lemma demonstration engine
 * 
 * Two modes:
 * 1. Non-regular mode: Demonstrates why a language is not regular by showing
 *    that no decomposition can be pumped for a given p
 * 2. Regular mode: Shows that a regular language satisfies the pumping lemma
 *    by finding a cycle and demonstrating pumpability
 * 
 * References:
 * - Sipser, "Introduction to the Theory of Computation", 3rd ed., Theorem 1.70
 * - Pumping lemma for regular languages: If L is regular, then ∃p (pumping length)
 *   such that ∀s ∈ L with |s| ≥ p, ∃xyz (decomposition) where s = xyz and:
 *   1. |xy| ≤ p
 *   2. |y| ≥ 1
 *   3. ∀i ≥ 0: xy^i z ∈ L
 */

import type { Automaton } from '../automaton/types';
import type { Result } from '../errors';
import { getLanguage } from './namedLanguages';
import { normalize } from '../automaton/normalize';
import { simulate } from '../simulate/simulate';

/**
 * A single decomposition of a string into x, y, z
 */
export interface PumpingDecomposition {
  x: string;
  y: string;
  z: string;
  /** For non-regular mode: the smallest i where xy^i z fails, or null if all pass */
  failingI?: number | null;
  /** For regular mode: results for i=0..5 */
  pumpingResults?: Array<{ i: number; string: string; accepted: boolean }>;
}

/**
 * Result of pumping lemma demonstration
 */
export interface PumpingResult {
  mode: 'non-regular' | 'regular';
  languageId?: string;
  p: number;
  witness: string;
  decompositions: PumpingDecomposition[];
  /** For non-regular: true if every decomposition fails */
  allDecompositionsFail?: boolean;
  /** Explanation text */
  explanation: string;
}

/**
 * Enumerate all valid decompositions of s = xyz where |xy| ≤ p and |y| ≥ 1
 */
function enumerateDecompositions(s: string, p: number): Array<{ x: string; y: string; z: string }> {
  const decompositions: Array<{ x: string; y: string; z: string }> = [];
  
  // |xy| ≤ p means x + y takes at most p characters
  // |y| ≥ 1 means y is non-empty
  
  for (let xyLength = 1; xyLength <= Math.min(p, s.length); xyLength++) {
    // y can start at position 0 (x is empty) up to position xyLength - 1
    for (let yStart = 0; yStart < xyLength; yStart++) {
      const yLength = xyLength - yStart;
      if (yLength === 0) continue; // |y| ≥ 1
      
      const x = s.slice(0, yStart);
      const y = s.slice(yStart, yStart + yLength);
      const z = s.slice(yStart + yLength);
      
      decompositions.push({ x, y, z });
    }
  }
  
  return decompositions;
}

/**
 * Pump a string: xy^i z
 */
function pump(x: string, y: string, z: string, i: number): string {
  return x + y.repeat(i) + z;
}

/**
 * Non-regular mode: Try to pump each decomposition and find counterexamples
 */
export function pumpNonRegular(languageId: string, p: number): Result<PumpingResult> {
  // Get the language
  const lang = getLanguage(languageId);
  if (!lang) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: `Unknown language: ${languageId}`,
      },
    };
  }
  
  // Get witness string
  const witness = lang.witness(p);
  
  // Validate witness
  if (witness.length < p) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: `Witness string is too short: |witness| = ${witness.length} < p = ${p}`,
      },
    };
  }
  
  if (!lang.membership(witness)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: `Witness string is not in the language`,
      },
    };
  }
  
  // Enumerate all decompositions
  const rawDecompositions = enumerateDecompositions(witness, p);
  const decompositions: PumpingDecomposition[] = [];
  
  let allFail = true;
  
  for (const { x, y, z } of rawDecompositions) {
    let failingI: number | null = null;
    
    // Try pumping with i = 0, 1, 2, 3, 4, 5
    for (let i = 0; i <= 5; i++) {
      const pumped = pump(x, y, z, i);
      if (!lang.membership(pumped)) {
        failingI = i;
        break;
      }
    }
    
    if (failingI === null) {
      allFail = false;
    }
    
    decompositions.push({
      x,
      y,
      z,
      failingI,
    });
  }
  
  const explanation = allFail
    ? `For p = ${p}, every decomposition of the witness string fails to pump (at least one value of i produces a string not in the language). This demonstrates that the language cannot satisfy the pumping lemma for this value of p. The general proof (for all p) requires showing this pattern holds for any choice of p.`
    : `Warning: Some decompositions can be pumped for p = ${p}. This may indicate the witness is incorrect or the language is actually regular.`;
  
  return {
    ok: true,
    value: {
      mode: 'non-regular',
      languageId,
      p,
      witness,
      decompositions,
      allDecompositionsFail: allFail,
      explanation,
    },
  };
}

/**
 * Regular mode: Demonstrate that a regular language satisfies the pumping lemma
 */
export function pumpRegular(automaton: Automaton, w: string): Result<PumpingResult> {
  // Normalize and validate
  const normalized = normalize(automaton);
  
  // Remove unreachable states to get accurate p
  // For now, use all states; in a full implementation we'd remove unreachable
  const p = normalized.states.length;
  
  // Validate string length
  if (w.length < p) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: `String is too short for pumping lemma: |w| = ${w.length} < p = ${p}. The pumping lemma only applies to strings of length at least p.`,
      },
    };
  }
  
  // Simulate the DFA and track states visited
  const simResult = simulate(normalized, w);
  if (!simResult.ok) {
    return simResult;
  }
  
  const trace = simResult.value.trace;
  const accepted = simResult.value.accepted;
  
  // Extract states from trace (each step has 'to' states)
  const statesVisited: string[] = [normalized.start];
  for (const step of trace.steps) {
    if (step.data.to && step.data.to.length > 0) {
      statesVisited.push(...step.data.to);
    }
  }
  
  // Find the first repeated state in the first p+1 states
  // (We visit p+1 states when reading first p symbols: initial + p transitions)
  const firstP1States = statesVisited.slice(0, p + 1);
  
  let cycleStart = -1;
  let cycleEnd = -1;
  
  for (let i = 0; i < firstP1States.length; i++) {
    for (let j = i + 1; j < firstP1States.length; j++) {
      if (firstP1States[i] === firstP1States[j]) {
        cycleStart = i;
        cycleEnd = j;
        break;
      }
    }
    if (cycleStart !== -1) break;
  }
  
  if (cycleStart === -1) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTOMATON',
        message: `No cycle found in the first p+1 states`,
      },
    };
  }
  
  // Extract x, y, z
  // x = symbols that lead to the first occurrence of the repeated state
  // y = symbols that form the cycle (from first to second occurrence)
  // z = remaining symbols
  const x = w.slice(0, cycleStart);
  const y = w.slice(cycleStart, cycleEnd);
  const z = w.slice(cycleEnd);
  
  // Test pumping for i = 0..5
  const pumpingResults: Array<{ i: number; string: string; accepted: boolean }> = [];
  
  for (let i = 0; i <= 5; i++) {
    const pumped = pump(x, y, z, i);
    const pumpedResult = simulate(normalized, pumped);
    
    if (pumpedResult.ok) {
      pumpingResults.push({
        i,
        string: pumped,
        accepted: pumpedResult.value.accepted,
      });
    }
  }
  
  // All pumped strings should have the same acceptance as w
  const allMatch = pumpingResults.every(r => r.accepted === accepted);
  
  const explanation = allMatch
    ? `For this DFA with p = ${p} states, the string w = "${w}" (length ${w.length}) ${accepted ? 'is accepted' : 'is rejected'}. The pumping lemma decomposition x = "${x}", y = "${y}", z = "${z}" shows that pumping y (repeating it i times) preserves ${accepted ? 'acceptance' : 'rejection'} for all i ≥ 0. This demonstrates that the language satisfies the pumping lemma.`
    : `Warning: Pumping changed acceptance for some values of i. This indicates an error in the implementation or DFA.`;
  
  return {
    ok: true,
    value: {
      mode: 'regular',
      p,
      witness: w,
      decompositions: [{ x, y, z, pumpingResults }],
      explanation,
    },
  };
}
