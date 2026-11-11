import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseRegex, thompson } from '@/engine/regex';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const RegexToNfaRequestSchema = z.object({
  regex: z.string().max(200, 'Regex too long (max 200 characters)'),
  alphabet: z.array(z.string()).max(10, 'Too many alphabet symbols (max 10)'),
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, RegexToNfaRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { regex, alphabet } = parseResult.data;

  try {
    // Parse regex
    const parseRes = parseRegex(regex);
    if (!parseRes.ok) {
      return errorResponse(parseRes.error);
    }

    // Use provided alphabet or detected alphabet from regex
    const effectiveAlphabet = alphabet.length > 0 ? alphabet : parseRes.value.alphabet;

    // Convert to NFA using Thompson's construction
    const thompsonResult = thompson(parseRes.value.ast, effectiveAlphabet);

    return successResponse({
      nfa: thompsonResult.nfa,
      trace: thompsonResult.trace,
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
