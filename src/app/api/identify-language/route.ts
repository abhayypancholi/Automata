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
      
      // Determine if the automaton recognizes a finite language
      // A DFA/NFA recognizes a finite language iff it has no reachable cycles that lead to an accepting state
      // Simple heuristic: check if there are any self-loops or cycles on the automaton
      // For now, we can note it's potentially infinite if there are any transitions back to visited states
      const hasTransitions = typedAutomaton.transitions.length > 0;
      const stateCount = typedAutomaton.states.length;
      
      // Automaton recognizes a Type 3 (regular) language
      return successResponse({
        class: 'Type 3',
        certainty: 'Exact',
        finiteness: hasTransitions && stateCount > 0
          ? 'Could be finite or infinite — depends on whether the DFA has cycles reachable from the start state to an accepting state. Use minimization or trace to verify.'
          : 'Empty language (finite, containing no strings).',
        reasons: [
          'Finite automata recognize exactly the regular languages (Type 3).',
          `This ${typedAutomaton.kind} has ${typedAutomaton.states.length} states and alphabet {${typedAutomaton.alphabet.join(', ')}}.`,
          'Regular languages may be finite or infinite. A language is finite if and only if the minimal DFA has no cycles that contribute to acceptance.',
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
        finiteness: 'Cannot be determined from grammar form alone — depends on the language generated.',
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
        isFinite: lang.isFinite,
        finiteness: lang.finiteness,
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
