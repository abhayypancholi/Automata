/**
 * POST /api/divisibility-dfa
 * 
 * Build a DFA for binary divisibility by n and optionally test strings
 */

import { z } from 'zod';
import { buildDivisibilityDFA, testDivisibility } from '@/engine/numbers/divisibility';
import { parseRequestBody, successResponse, errorResponse } from '../helpers';

const DivisibilityDFARequestSchema = z.object({
  n: z.number().int().min(1).max(64),
  testStrings: z.array(z.string().max(100)).optional(),
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, DivisibilityDFARequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { n, testStrings } = parseResult.data;

  try {
    const dfa = buildDivisibilityDFA(n);
    
    const results = testStrings?.map(str => {
      const result = testDivisibility(str, n);
      return {
        string: str,
        valid: result.valid,
        remainder: result.remainder,
        divisible: result.divisible,
      };
    });

    return successResponse({
      n,
      dfa,
      results: results ?? [],
    });
  } catch (error) {
    return errorResponse({
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
