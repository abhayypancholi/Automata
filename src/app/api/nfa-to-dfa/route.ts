import { NextResponse } from 'next/server';
import { z } from 'zod';
import { subsetConstruction } from '@/engine/convert';
import { validateAutomaton } from '@/engine/automaton/validate';
import { AutomatonSchema } from '@/app/api/helpers';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const NfaToDfaRequestSchema = z.object({
  automaton: AutomatonSchema,
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, NfaToDfaRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { automaton } = parseResult.data;
  // Cast to Automaton type (Zod validates the structure)
  const typedAutomaton = automaton as import('@/engine/automaton').Automaton;

  // Validate automaton
  const validation = validateAutomaton(typedAutomaton);
  if (!validation.ok) {
    return errorResponse(validation.error);
  }

  try {
    // Convert NFA to DFA using subset construction
    const result = subsetConstruction(typedAutomaton);

    if (!result.ok) {
      return errorResponse(result.error);
    }

    // Build the subset table for display
    const table = Array.from(result.value.stateMapping.entries()).map(([dfaState, nfaStates]) => ({
      subset: dfaState,
      states: nfaStates,
      accepting: result.value.dfa.accepting.includes(dfaState),
    }));

    return successResponse({
      dfa: result.value.dfa,
      table,
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
