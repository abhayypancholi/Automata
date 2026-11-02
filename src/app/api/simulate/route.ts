import { NextResponse } from 'next/server';
import { z } from 'zod';
import { simulate } from '@/engine/simulate';
import { validateAutomaton } from '@/engine/automaton/validate';
import { AutomatonSchema } from '@/app/api/helpers';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const SimulateRequestSchema = z.object({
  automaton: AutomatonSchema,
  inputs: z.array(z.string()).max(20, 'Too many input strings (max 20)'),
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, SimulateRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { automaton, inputs } = parseResult.data;
  // Cast to Automaton type (Zod validates the structure)
  const typedAutomaton = automaton as import('@/engine/automaton').Automaton;

  // Validate automaton
  const validation = validateAutomaton(typedAutomaton);
  if (!validation.ok) {
    return errorResponse(validation.error);
  }

  try {
    // Simulate each input string
    const results = inputs.map((input) => {
      const result = simulate(typedAutomaton, input);
      return {
        input,
        ...result,
      };
    });

    // Check if any result has an error
    const firstError = results.find((r) => !r.ok);
    if (firstError && !firstError.ok) {
      return errorResponse(firstError.error);
    }

    // All successful - extract values
    const successResults = results.map((r) => {
      if (!r.ok) throw new Error('Unexpected error state');
      return {
        input: r.input,
        accepted: r.value.accepted,
        trace: r.value.trace,
      };
    });

    return successResponse({
      results: successResults,
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
