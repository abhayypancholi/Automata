/**
 * POST /api/parse
 * 
 * Parse mini-language source code into AST, tokens, and unit-check results.
 * Returns a per-line breakdown even when errors occur.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lex } from '@/engine/lexer/lex';
import { parse } from '@/engine/parser/parse';
import { checkProgram } from '@/engine/units/check';
import { parseRequestBody } from '../helpers';

/**
 * Request schema
 */
const ParseRequestSchema = z.object({
  source: z.string().max(5000, 'Source code exceeds 5000 character limit'),
});

/**
 * POST handler
 */
export async function POST(request: Request) {
  // Parse and validate request
  const parsed = await parseRequestBody(request, ParseRequestSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { source } = parsed.data;
  const sourceLines = source.split('\n');

  // Step 1: Lex the full source
  const lexResult = lex(source);

  if (!lexResult.ok) {
    // Lex error — find which line it's on and return per-line structure
    const errLine = (lexResult.error as { line?: number }).line ?? 1;
    const lines = sourceLines.map((_, idx) => {
      if (idx + 1 === errLine) {
        return {
          errors: [lexResult.error],
        };
      }
      return { tokens: [] };
    });
    return NextResponse.json({ ok: true, result: { lines, units: { ok: false } } });
  }

  const allTokens = lexResult.value.tokens;

  // Group tokens by line (excluding WS and NEWLINE for display)
  const tokensByLine: Record<number, Array<{ type: string; text: string; line: number; column: number }>> = {};
  for (const tok of allTokens) {
    if (tok.type === 'WS') continue;
    if (!tokensByLine[tok.line]) {
      tokensByLine[tok.line] = [];
    }
    tokensByLine[tok.line]!.push({ type: tok.type, text: tok.text, line: tok.line, column: tok.column });
  }

  // Step 2: Parse — always attempt, collect errors
  // We call parse which can return ok:false (first error) or ok:true (ast + errors)
  // But the engine parse() currently aborts on first error. We'll use the internal ParseResult.
  // Re-invoke with the lexed tokens to get the AST+errors struct:
  let parseErrors: Array<{ code: string; message: string; line?: number; column?: number }> = [];
  let ast = null;
  let unitResult: { ok: boolean; errors?: Array<{ code: string; message: string; line?: number; column?: number }> } = { ok: true };

  const parseResult = parse(source);
  if (parseResult.ok) {
    ast = parseResult.value.ast;
    parseErrors = parseResult.value.errors ?? [];

    // Step 3: Unit check
    try {
      const unitCheck = checkProgram(ast);
      if (unitCheck.ok) {
        const checkRes = unitCheck.value;
        unitResult = { ok: checkRes.ok, errors: checkRes.errors };
      } else {
        unitResult = { ok: false, errors: [unitCheck.error] };
      }
    } catch (e) {
      unitResult = { ok: false, errors: [{ code: 'INTERNAL_ERROR', message: String(e) }] };
    }
  } else {
    parseErrors = [parseResult.error];
  }

  // Step 4: Group parse errors by line
  const errorsByLine: Record<number, Array<{ code: string; message: string; line?: number; column?: number }>> = {};
  for (const err of parseErrors) {
    const lineNum = (err as { line?: number }).line ?? 1;
    if (!errorsByLine[lineNum]) {
      errorsByLine[lineNum] = [];
    }
    errorsByLine[lineNum]!.push(err);
  }
  // Also add unit errors by line
  if (unitResult.errors) {
    for (const err of unitResult.errors) {
      const lineNum = (err as { line?: number }).line ?? 1;
      if (!errorsByLine[lineNum]) {
        errorsByLine[lineNum] = [];
      }
      errorsByLine[lineNum]!.push(err);
    }
  }

  // Step 5: Build per-line response
  const lines = sourceLines.map((_, idx) => {
    const lineNum = idx + 1;
    const lineErrors = errorsByLine[lineNum];
    const lineTokens = tokensByLine[lineNum] ?? [];

    if (lineErrors && lineErrors.length > 0) {
      return {
        tokens: lineTokens,
        errors: lineErrors,
      };
    }

    if (lineTokens.length === 0) {
      return {}; // empty / comment line
    }

    return {
      tokens: lineTokens,
    };
  });

  return NextResponse.json({
    ok: true,
    result: {
      lines,
      ast: ast ?? null,
      units: { ok: unitResult.ok, errors: unitResult.errors ?? [] },
    },
  });
}
