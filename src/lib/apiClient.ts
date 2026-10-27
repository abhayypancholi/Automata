import type { Automaton } from '@/engine/automaton/types';
import type { EngineError } from '@/engine/errors';

// API response envelope types
export interface SuccessResponse<T> {
  ok: true;
  result: T;
  trace: { steps: unknown[] };
}

export interface ErrorResponse {
  ok: false;
  error: EngineError;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Result type for client-side error handling
export type Result<T> =
  | { ok: true; value: SuccessResponse<T> }
  | { ok: false; error: EngineError };

// Generic fetch wrapper
async function apiCall<T>(
  endpoint: string,
  body: unknown
): Promise<Result<T>> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as ApiResponse<T>;

    if (data.ok) {
      return { ok: true, value: data };
    } else {
      return { ok: false, error: data.error };
    }
  } catch (error) {
    // Handle network errors and JSON parsing errors
    if (error instanceof Error) {
      if (error.message.includes('JSON')) {
        return {
          ok: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse server response',
          },
        };
      }
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Network request failed: ${error.message}`,
        },
      };
    }
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
    };
  }
}

// Simulate endpoint
export interface SimulateRequest {
  automaton: Automaton;
  inputs: string[];
}

export interface SimulateResult {
  accepted: boolean;
  // Additional fields will be defined in T17
}

// Parse endpoint
export interface ParseRequest {
  source: string;
}

export interface ParseResult {
  lines: unknown[];
  // Additional fields will be defined in T19
}

// Check units endpoint
export interface CheckUnitsRequest {
  source: string;
}

export interface CheckUnitsResult {
  valid: boolean;
  // Additional fields will be defined in T19
}

// API client with typed methods
export const apiClient = {
  simulate: (request: SimulateRequest) =>
    apiCall<SimulateResult>('/api/simulate', request),

  parse: (request: ParseRequest) =>
    apiCall<ParseResult>('/api/parse', request),

  checkUnits: (request: CheckUnitsRequest) =>
    apiCall<CheckUnitsResult>('/api/check-units', request),

  // Additional endpoints will be added in later tasks (T16-T19):
  // nfaToDfa, minimize, regexToNfa, faToRegex, identifyLanguage,
  // pumping, convertNumber, validateNumber, divisibilityDfa, tokenize
};
