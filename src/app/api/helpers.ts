/**
 * Shared API helpers for route handlers
 * 
 * Provides common response envelope, error mapping, and validation
 */

import type { EngineError } from '@/engine/errors';
import { z } from 'zod';

/**
 * Success response envelope
 */
export interface SuccessResponse<T> {
  ok: true;
  result: T;
}

/**
 * Error response envelope
 */
export interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    line?: number;
    column?: number;
    expected?: string[];
    hint?: string;
  };
}

/**
 * Response type
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Create success response
 */
export function successResponse<T>(result: T): Response {
  const body: SuccessResponse<T> = {
    ok: true,
    result,
  };
  
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Map EngineError to HTTP status code
 * 
 * From design section 11:
 * - 400: Invalid input (malformed JSON, schema validation)
 * - 422: Valid but unsupported (limit exceeded, unsupported feature)
 * - 500: Internal error
 */
function mapErrorToStatus(error: EngineError): number {
  switch (error.code) {
    // Limit exceeded or unsupported features
    case 'LIMIT_EXCEEDED':
    case 'UNSUPPORTED_REGEX_FEATURE':
      return 422;
    
    // User errors (malformed input)
    case 'INVALID_AUTOMATON':
    case 'UNEXPECTED_CHARACTER':
    case 'UNEXPECTED_TOKEN':
    case 'UNEXPECTED_EOF':
    case 'UNCLOSED_PAREN':
    case 'UNEXPECTED_CLOSE_PAREN':
    case 'MISSING_OPERAND':
    case 'MISSING_EQUALS':
    case 'MISSING_UNIT':
    case 'UNKNOWN_UNIT':
    case 'UNIT_MISMATCH':
    case 'UNDECLARED_IDENTIFIER':
    case 'RESERVED_NAME':
    case 'UNKNOWN_FUNCTION':
    case 'WRONG_ARITY':
    case 'MALFORMED_GRAMMAR':
      return 400;
    
    default:
      return 500;
  }
}

/**
 * Create error response from EngineError
 */
export function errorResponse(error: EngineError): Response {
  const status = mapErrorToStatus(error);
  
  const body: ErrorResponse = {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      line: error.line,
      column: error.column,
      expected: error.expected,
      hint: error.hint,
    },
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create error response from validation error
 */
export function validationErrorResponse(message: string): Response {
  const body: ErrorResponse = {
    ok: false,
    error: {
      code: 'INVALID_INPUT',
      message,
    },
  };
  
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Body size limit (100 KB)
 */
const MAX_BODY_SIZE = 100 * 1024;

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  // Check content type
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return {
      ok: false,
      response: validationErrorResponse('Content-Type must be application/json'),
    };
  }
  
  // Check body size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'BODY_TOO_LARGE',
            message: 'Request body exceeds 100 KB limit',
          },
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }
  
  // Parse JSON
  let json: unknown;
  try {
    const text = await request.text();
    
    // Check actual size
    if (text.length > MAX_BODY_SIZE) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({
            ok: false,
            error: {
              code: 'BODY_TOO_LARGE',
              message: 'Request body exceeds 100 KB limit',
            },
          }),
          {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }
    
    json = JSON.parse(text);
  } catch {
    return {
      ok: false,
      response: validationErrorResponse('Invalid JSON'),
    };
  }
  
  // Validate with schema
  const result = schema.safeParse(json);
  if (!result.success) {
    const errors = result.error.issues
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return {
      ok: false,
      response: validationErrorResponse(`Validation error: ${errors}`),
    };
  }
  
  return { ok: true, data: result.data };
}
