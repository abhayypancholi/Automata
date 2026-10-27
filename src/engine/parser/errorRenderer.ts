/**
 * Error rendering for parser errors
 * 
 * Renders error messages with source context and caret positioning
 */

import type { EngineError } from '../errors';

/**
 * Render an error with source line and caret
 * 
 * Example output:
 * ```
 * dv/dt = (I - v/tau : volt
 *         ^
 * Error: UNCLOSED_PAREN at line 1, column 9
 * Expected: )
 * ```
 */
export function renderError(error: EngineError, source: string): string {
  const lines = source.split('\n');
  const line = error.line ?? 1;
  const column = error.column ?? 1;
  
  const sourceLine = lines[line - 1] ?? '';
  
  // Build caret line (spaces + caret)
  const caret = ' '.repeat(column - 1) + '^';
  
  // Build error message
  let message = `${sourceLine}\n${caret}\n`;
  message += `Error: ${error.code}`;
  
  if (error.line !== undefined) {
    message += ` at line ${error.line}, column ${error.column}`;
  }
  
  message += `\n${error.message}`;
  
  // Add expected tokens if present
  if (error.expected && error.expected.length > 0) {
    message += `\nExpected: ${error.expected.join(', ')}`;
  }
  
  // Add hint if present
  if (error.hint) {
    message += `\nHint: ${error.hint}`;
  }
  
  // Add related info (for UNCLOSED_PAREN)
  if (error.related) {
    message += `\nNote: Opening paren at line ${error.related.line}, column ${error.related.column}`;
  }
  
  return message;
}

/**
 * Format error for display (without source context)
 */
export function formatError(error: EngineError): string {
  let message = `${error.code}: ${error.message}`;
  
  if (error.line !== undefined) {
    message += ` (line ${error.line}, column ${error.column})`;
  }
  
  if (error.expected && error.expected.length > 0) {
    message += ` - Expected: ${error.expected.join(', ')}`;
  }
  
  return message;
}
