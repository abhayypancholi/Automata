import { NextResponse } from 'next/server';
import { z } from 'zod';
import { classifyGrammar } from '@/engine/language/classifyGrammar';
import { parseGrammar } from '@/engine/language/grammarParse';
import { getLanguage } from '@/engine/language/namedLanguages';
import { validateAutomaton } from '@/engine/automaton/validate';
import { AutomatonSchema } from '@/app/api/helpers';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const IdentifyLanguageRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('automaton'),
    automaton: AutomatonSchema,
  }),
  z.object({
    kind: z.literal('grammar'),
    grammar: z.string().max(5000),
  }),
  z.object({
    kind: z.literal('named'),
    languageId: z.string(),
  }),
]);

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, IdentifyLanguageRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const data = parseResult.data;

  try {
    if (data.kind === 'automaton') {
      const typedAutomaton = data.automaton as import('@/engine/automaton').Automaton;
      
      // Validate automaton
      const validation = validateAutomaton(typedAutomaton);
      if (!validation.ok) {
        return errorResponse(validation.error);
      }
      
      // Automaton recognizes a Type 3 (regular) language
      return successResponse({
        class: 'Type 3',
        certainty: 'Exact',
        reasons: [
          'Finite automata recognize exactly the regular languages (Type 3).',
          `This ${typedAutomaton.kind} has ${typedAutomaton.states.length} states and alphabet {${typedAutomaton.alphabet.join(', ')}}.`,
        ],
      });
    } else if (data.kind === 'grammar') {
      // Parse grammar
      const parseRes = parseGrammar(data.grammar);
      if (!parseRes.ok) {
        return errorResponse(parseRes.error);
      }
      
      // Classify grammar
      const classification = classifyGrammar(parseRes.value);
      
      return successResponse({
        class: classification.type,
        certainty: 'Upper bound',
        reasons: [
          classification.explanation,
          `Grammar form: ${classification.description}`,
          'Note: This classifies the grammar form, not the language. The actual language may be in a more restrictive class.',
        ],
      });
    } else {
      // Named language
      const lang = getLanguage(data.languageId);
      
      if (!lang) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'INVALID_INPUT',
              message: `Unknown language ID: ${data.languageId}`,
            },
          },
          { status: 400 }
        );
      }
      
      return successResponse({
        class: lang.class,
        certainty: 'Exact (by definition)',
        reasons: [
          `${lang.display}: ${lang.description}`,
          lang.proofSketch,
        ],
      });
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
