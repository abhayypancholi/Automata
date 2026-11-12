import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pumpNonRegular, pumpRegular } from '@/engine/language';
import { validateAutomaton } from '@/engine/automaton/validate';
import { AutomatonSchema } from '@/app/api/helpers';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const PumpingRequestSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('nonregular'),
    languageId: z.string(),
    p: z.number().int().min(1).max(50),
  }),
  z.object({
    mode: z.literal('non-regular'),
    languageId: z.string(),
    p: z.number().int().min(1).max(50),
  }),
  z.object({
    mode: z.literal('regular'),
    automaton: AutomatonSchema,
    string: z.string().max(200),
  }),
]);

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, PumpingRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const data = parseResult.data;

  try {
    if (data.mode === 'non-regular' || data.mode === 'nonregular') {
      const result = pumpNonRegular(data.languageId, data.p);
      
      if (!result.ok) {
        return errorResponse(result.error);
      }
      
      return successResponse(result.value);
    } else {
      const typedAutomaton = data.automaton as import('@/engine/automaton').Automaton;
      
      // Validate automaton
      const validation = validateAutomaton(typedAutomaton);
      if (!validation.ok) {
        return errorResponse(validation.error);
      }
      
      const result = pumpRegular(typedAutomaton, data.string);
      
      if (!result.ok) {
        return errorResponse(result.error);
      }
      
      return successResponse(result.value);
    }
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
