import { NextResponse } from 'next/server';
import { z } from 'zod';
import { minimize } from '@/engine/minimize';
import { validateAutomaton } from '@/engine/automaton/validate';
import { AutomatonSchema } from '@/app/api/helpers';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const MinimizeRequestSchema = z.object({
  automaton: AutomatonSchema,
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, MinimizeRequestSchema);
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
    const result = minimize(typedAutomaton);

    if (!result.ok) {
      return errorResponse(result.error);
    }

    return successResponse({
      minimal: result.value.minimal,
      trace: result.value.trace,
      alreadyMinimal: result.value.alreadyMinimal,
      mapping: Object.fromEntries(result.value.mapping.entries()),
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
