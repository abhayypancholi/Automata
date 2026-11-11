import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  binaryToOctal,
  binaryToHex,
  octalToBinary,
  hexToBinary,
  octalToHex,
  hexToOctal,
} from '@/engine/numbers/convert';
import { parseRequestBody, successResponse, errorResponse } from '@/app/api/helpers';

const ConvertNumberRequestSchema = z.object({
  input: z.string().max(200),
  from: z.enum(['binary', 'octal', 'hex']),
  to: z.enum(['binary', 'octal', 'hex']),
});

export async function POST(request: Request) {
  const parseResult = await parseRequestBody(request, ConvertNumberRequestSchema);
  if (!parseResult.ok) {
    return parseResult.response;
  }

  const { input, from, to } = parseResult.data;

  // Validate input format
  const inputUpper = input.toUpperCase();
  if (from === 'binary' && !/^[01]+$/.test(input)) {
    return errorResponse({
      code: 'UNEXPECTED_CHARACTER',
      message: 'Binary number must contain only 0 and 1',
    });
  }
  if (from === 'octal' && !/^[0-7]+$/.test(input)) {
    return errorResponse({
      code: 'UNEXPECTED_CHARACTER',
      message: 'Octal number must contain only digits 0-7',
    });
  }
  if (from === 'hex' && !/^[0-9A-F]+$/i.test(input)) {
    return errorResponse({
      code: 'UNEXPECTED_CHARACTER',
      message: 'Hexadecimal number must contain only digits 0-9 and A-F',
    });
  }

  try {
    let output: string;
    let trace: any = null;

    // Same base
    if (from === to) {
      output = input;
    }
    // Binary to others
    else if (from === 'binary' && to === 'octal') {
      const result = binaryToOctal(input);
      output = result.normalized;
      trace = result.trace;
    } else if (from === 'binary' && to === 'hex') {
      const result = binaryToHex(input);
      output = result.normalized;
      trace = result.trace;
    }
    // Octal conversions
    else if (from === 'octal' && to === 'binary') {
      const result = octalToBinary(input);
      output = result.normalized;
      trace = result.trace;
    } else if (from === 'octal' && to === 'hex') {
      output = octalToHex(input);
    }
    // Hex conversions
    else if (from === 'hex' && to === 'binary') {
      const result = hexToBinary(inputUpper);
      output = result.normalized;
      trace = result.trace;
    } else if (from === 'hex' && to === 'octal') {
      output = hexToOctal(inputUpper);
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid conversion combination',
          },
        },
        { status: 400 }
      );
    }

    return successResponse({
      input,
      output,
      from,
      to,
      trace,
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
