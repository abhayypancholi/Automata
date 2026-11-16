/**
 * POST /api/validate-number
 * 
 * Validate whether a string is a valid number in the specified base
 * using regex and DFA
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateNumber } from '@/engine/numbers/validators';
import { parseRequestBody, successResponse, errorResponse } from '../helpers';

const ValidateNumberRequestSchema = z.object({
  value: z.string().max(200),
  base: z.enum(['binary', 'octal', 'hex']),
  withPrefix: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, ValidateNumberRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { value, base, withPrefix } = parseResult.data;

  try {
    const result = validateNumber(value, base, withPrefix ?? false);

    return successResponse({
      valid: result.valid,
      base,
      value,
      regex: result.regex,
      dfa: result.dfa,
      message: result.valid 
        ? `Valid ${base} number${withPrefix ? ' with prefix' : ''}`
        : `Invalid ${base} number${withPrefix ? ' with prefix' : ''}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
