/**
 * POST /api/parse
 * 
 * Parse mini-language source code into AST
 */

import { z } from 'zod';
import { parse } from '@/engine/parser/parse';
import { parseRequestBody, successResponse, errorResponse } from '../helpers';

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
  
  // Call engine
  const result = parse(source);
  
  // Return response
  if (!result.ok) {
    return errorResponse(result.error);
  }
  
  return successResponse(result.value);
}
