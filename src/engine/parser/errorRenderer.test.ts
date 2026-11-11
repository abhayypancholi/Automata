/**
 * Tests for error rendering
 */

import { describe, it, expect } from 'vitest';
import { renderError, formatError } from './errorRenderer';
import type { EngineError } from '../errors';

describe('errorRenderer', () => {
  describe('renderError', () => {
    it('should render basic error with source line and caret', () => {
      const error: EngineError = {
        code: 'UNEXPECTED_TOKEN',
        message: 'Unexpected token found',
        line: 1,
        column: 5,
      };
      const source = 'a = b + c';
      
      const result = renderError(error, source);
      
      expect(result).toContain('a = b + c');
      expect(result).toContain('    ^');  // 4 spaces + caret for column 5
      expect(result).toContain('Error: UNEXPECTED_TOKEN at line 1, column 5');
      expect(result).toContain('Unexpected token found');
    });

    it('should render error with expected tokens', () => {
      const error: EngineError = {
        code: 'MISSING_OPERAND',
        message: 'Missing operand',
        line: 1,
        column: 6,
        expected: ['NUMBER', 'IDENT', '('],
      };
      const source = 'a = +';
      
      const result = renderError(error, source);
      
      expect(result).toContain('Expected: NUMBER, IDENT, (');
    });

    it('should render error with hint', () => {
      const error: EngineError = {
        code: 'MISSING_EQUALS',
        message: 'Missing equals sign',
        line: 1,
        column: 6,
        hint: 'Did you mean to use = instead of :?',
      };
      const source = 'dv/dt (I - v) : volt';
      
      const result = renderError(error, source);
      
      expect(result).toContain('Hint: Did you mean to use = instead of :?');
    });

    it('should render error with related info (UNCLOSED_PAREN)', () => {
      const error: EngineError = {
        code: 'UNCLOSED_PAREN',
        message: 'Unclosed parenthesis',
        line: 1,
        column: 20,
        related: {
          line: 1,
          column: 9,
          note: 'Opening paren here',
        },
      };
      const source = 'dv/dt = (I - v/tau : volt';
      
      const result = renderError(error, source);
      
      expect(result).toContain('Note: Opening paren at line 1, column 9');
    });

    it('should render error on multi-line source', () => {
      const error: EngineError = {
        code: 'UNIT_MISMATCH',
        message: 'Unit mismatch',
        line: 3,
        column: 10,
      };
      const source = 'I : ampere\nR : ohm\nV = I + R : volt';
      
      const result = renderError(error, source);
      
      expect(result).toContain('V = I + R : volt');
      expect(result).toContain('         ^');  // 9 spaces + caret for column 10
      expect(result).toContain('Error: UNIT_MISMATCH at line 3, column 10');
    });

    it('should handle error without line/column', () => {
      const error: EngineError = {
        code: 'INVALID_AUTOMATON',
        message: 'Invalid automaton structure',
      };
      const source = 'test';
      
      const result = renderError(error, source);
      
      expect(result).toContain('test');
      expect(result).toContain('Error: INVALID_AUTOMATON');
      expect(result).not.toContain('at line');
      expect(result).toContain('Invalid automaton structure');
    });

    it('should handle error with no expected tokens', () => {
      const error: EngineError = {
        code: 'UNKNOWN_UNIT',
        message: 'Unknown unit: volts',
        line: 1,
        column: 15,
        expected: [],
      };
      const source = 'dv/dt = I : volts';
      
      const result = renderError(error, source);
      
      expect(result).not.toContain('Expected:');
    });

    it('should handle error on line beyond source length', () => {
      const error: EngineError = {
        code: 'UNEXPECTED_EOF',
        message: 'Unexpected end of file',
        line: 5,
        column: 1,
      };
      const source = 'a = 1';
      
      const result = renderError(error, source);
      
      // Should handle gracefully with empty line
      expect(result).toContain('Error: UNEXPECTED_EOF at line 5, column 1');
    });

    it('should handle column 1 caret positioning', () => {
      const error: EngineError = {
        code: 'UNEXPECTED_TOKEN',
        message: 'Unexpected character',
        line: 1,
        column: 1,
      };
      const source = '@invalid';
      
      const result = renderError(error, source);
      
      expect(result).toContain('@invalid');
      expect(result).toContain('^'); // No spaces before caret
      expect(result).not.toContain(' ^');
    });
  });

  describe('formatError', () => {
    it('should format basic error', () => {
      const error: EngineError = {
        code: 'UNEXPECTED_TOKEN',
        message: 'Unexpected token',
        line: 1,
        column: 5,
      };
      
      const result = formatError(error);
      
      expect(result).toBe('UNEXPECTED_TOKEN: Unexpected token (line 1, column 5)');
    });

    it('should format error without line/column', () => {
      const error: EngineError = {
        code: 'INVALID_AUTOMATON',
        message: 'Invalid structure',
      };
      
      const result = formatError(error);
      
      expect(result).toBe('INVALID_AUTOMATON: Invalid structure');
      expect(result).not.toContain('line');
    });

    it('should format error with expected tokens', () => {
      const error: EngineError = {
        code: 'MISSING_OPERAND',
        message: 'Missing operand',
        line: 2,
        column: 10,
        expected: ['NUMBER', 'IDENT'],
      };
      
      const result = formatError(error);
      
      expect(result).toBe('MISSING_OPERAND: Missing operand (line 2, column 10) - Expected: NUMBER, IDENT');
    });

    it('should format error with empty expected array', () => {
      const error: EngineError = {
        code: 'UNKNOWN_UNIT',
        message: 'Unknown unit',
        line: 1,
        column: 15,
        expected: [],
      };
      
      const result = formatError(error);
      
      expect(result).toBe('UNKNOWN_UNIT: Unknown unit (line 1, column 15)');
      expect(result).not.toContain('Expected:');
    });

    it('should handle error with single expected token', () => {
      const error: EngineError = {
        code: 'MISSING_EQUALS',
        message: 'Missing equals',
        line: 1,
        column: 6,
        expected: ['='],
      };
      
      const result = formatError(error);
      
      expect(result).toContain('Expected: =');
    });
  });
});
