/**
 * Error codes and types for engine operations
 */

export type ErrorCode =
  | 'INVALID_AUTOMATON'
  | 'LIMIT_EXCEEDED'
  | 'SYMBOL_NOT_IN_ALPHABET'
  | 'UNSUPPORTED_REGEX_FEATURE'
  | 'MALFORMED_GRAMMAR'
  | 'UNEXPECTED_CHARACTER'
  | 'UNEXPECTED_EOF'
  | 'UNEXPECTED_TOKEN'
  | 'UNCLOSED_PAREN'
  | 'UNEXPECTED_CLOSE_PAREN'
  | 'MISSING_OPERAND'
  | 'MISSING_EQUALS'
  | 'MISSING_UNIT'
  | 'UNKNOWN_UNIT'
  | 'UNIT_MISMATCH'
  | 'UNDECLARED_IDENTIFIER'
  | 'RESERVED_NAME'
  | 'UNKNOWN_FUNCTION'
  | 'WRONG_ARITY'
  // Client-side error codes
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export interface EngineError {
  code: ErrorCode;
  message: string;
  line?: number;
  column?: number;
  offset?: number;
  length?: number;
  expected?: string[];
  hint?: string;
  related?: { line: number; column: number; note: string };
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };
