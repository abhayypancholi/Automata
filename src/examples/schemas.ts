import { z } from 'zod';

/**
 * Schemas for typed example JSON files
 */

export const AutomatonExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  automaton: z.object({
    kind: z.enum(['DFA', 'NFA']),
    states: z.array(z.string()).min(1),
    alphabet: z.array(z.string()),
    start: z.string(),
    accepting: z.array(z.string()),
    transitions: z.array(
      z.object({
        from: z.string(),
        symbol: z.string(),
        to: z.string(),
      })
    ),
  }),
  testStrings: z
    .array(
      z.object({
        input: z.string(),
        shouldAccept: z.boolean(),
      })
    )
    .optional(),
});

export const RegexExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  regex: z.string(),
  testStrings: z
    .array(
      z.object({
        input: z.string(),
        shouldMatch: z.boolean(),
      })
    )
    .optional(),
});

export const MinimizationExampleSchema = AutomatonExampleSchema.extend({
  expectedMinimalStates: z.number().optional(),
});

export const LanguageExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  inputKind: z.enum(['regex', 'automaton', 'grammar', 'named']),
  input: z.union([
    z.string(), // regex, grammar, or named language id
    z.object({
      // automaton
      kind: z.enum(['DFA', 'NFA']),
      states: z.array(z.string()),
      alphabet: z.array(z.string()),
      start: z.string(),
      accepting: z.array(z.string()),
      transitions: z.array(
        z.object({
          from: z.string(),
          symbol: z.string(),
          to: z.string(),
        })
      ),
    }),
  ]),
  expectedClass: z.enum(['Type 0', 'Type 1', 'Type 2', 'Type 3', 'Regular']),
});

export const PumpingExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  mode: z.enum(['nonregular', 'regular']),
  languageId: z.string().optional(), // for nonregular mode
  automaton: z
    .object({
      // for regular mode
      kind: z.enum(['DFA', 'NFA']),
      states: z.array(z.string()),
      alphabet: z.array(z.string()),
      start: z.string(),
      accepting: z.array(z.string()),
      transitions: z.array(
        z.object({
          from: z.string(),
          symbol: z.string(),
          to: z.string(),
        })
      ),
    })
    .optional(),
  p: z.number().min(2).max(8),
  testString: z.string().optional(), // for regular mode
});

export const NumberConversionExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  from: z.enum(['binary', 'octal', 'hex']),
  to: z.enum(['octal', 'hex']),
  input: z.string(),
  expectedOutput: z.string().optional(),
});

export const ParserExampleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  source: z.string(),
  shouldParse: z.boolean(),
  expectedError: z
    .object({
      code: z.string(),
      line: z.number().optional(),
      column: z.number().optional(),
    })
    .optional(),
});

export type AutomatonExample = z.infer<typeof AutomatonExampleSchema>;
export type RegexExample = z.infer<typeof RegexExampleSchema>;
export type MinimizationExample = z.infer<typeof MinimizationExampleSchema>;
export type LanguageExample = z.infer<typeof LanguageExampleSchema>;
export type PumpingExample = z.infer<typeof PumpingExampleSchema>;
export type NumberConversionExample = z.infer<typeof NumberConversionExampleSchema>;
export type ParserExample = z.infer<typeof ParserExampleSchema>;
