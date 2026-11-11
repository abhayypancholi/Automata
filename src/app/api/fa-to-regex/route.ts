import { NextResponse } from 'next/server';
import { z } from 'zod';
import { arden } from '@/engine/regex';
import { validateAutomaton } from '@/engine/automaton/validate';
import { AutomatonSchema } from '@/app/api/helpers';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const FaToRegexRequestSchema = z.object({
  automaton: AutomatonSchema,
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, FaToRegexRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { automaton } = parseResult.data;
  const typedAutomaton = automaton as import('@/engine/automaton').Automaton;

  // Validate automaton
  const validation = validateAutomaton(typedAutomaton);
  if (!validation.ok) {
    return errorResponse(validation.error);
  }

  try {
    // Convert FA to regex using Arden's lemma
    const result = arden(typedAutomaton);

    if (!result.ok) {
      return errorResponse(result.error);
    }

    return successResponse({
      regex: result.value.regex,
      regexTextbook: result.value.regexTextbook,
      trace: result.value.trace,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
