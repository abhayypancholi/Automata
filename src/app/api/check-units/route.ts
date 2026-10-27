/**
 * POST /api/check-units
 * 
 * Check unit consistency in mini-language program
 */

import { z } from 'zod';
import { parse } from '@/engine/parser/parse';
import { checkProgram } from '@/engine/units/check';
import { parseRequestBody, successResponse, errorResponse } from '../helpers';

/**
 * Request schema
 */
const CheckUnitsRequestSchema = z.object({
  source: z.string().max(5000, 'Source code exceeds 5000 character limit'),
});

/**
 * POST handler
 */
export async function POST(request: Request) {
  // Parse and validate request
  const parsed = await parseRequestBody(request, CheckUnitsRequestSchema);
  if (!parsed.ok) {
    return parsed.response;
  }
  
  const { source } = parsed.data;
  
  // Parse first
  const parseResult = parse(source);
  if (!parseResult.ok) {
    return errorResponse(parseResult.error);
  }
  
  // Check units
  const checkResult = checkProgram(parseResult.value.ast);
  
  // Return response
  if (!checkResult.ok) {
    return errorResponse(checkResult.error);
  }
  
  return successResponse({ ok: true, errors: [] });
}
