import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('success envelope parsing', () => {
    it('should parse successful response', async () => {
      const mockResponse = {
        ok: true,
        result: { accepted: true },
        trace: { steps: [] },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.simulate({
        automaton: {
          kind: 'DFA',
          states: ['q0'],
          alphabet: ['a'],
          start: 'q0',
          accepting: ['q0'],
          transitions: [],
        },
        inputs: ['a'],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockResponse);
      }
    });
  });

  describe('error envelope parsing', () => {
    it('should parse error response', async () => {
      const mockError = {
        ok: false,
        error: {
          code: 'INVALID_AUTOMATON',
          message: 'Invalid automaton',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => mockError,
      });

      const result = await apiClient.simulate({
        automaton: {
          kind: 'DFA',
          states: [],
          alphabet: [],
          start: '',
          accepting: [],
          transitions: [],
        },
        inputs: ['a'],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_AUTOMATON');
        expect(result.error.message).toBe('Invalid automaton');
      }
    });
  });

  describe('network errors', () => {
    it('should handle fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await apiClient.simulate({
        automaton: {
          kind: 'DFA',
          states: ['q0'],
          alphabet: [],
          start: 'q0',
          accepting: [],
          transitions: [],
        },
        inputs: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.message).toContain('Network error');
      }
    });

    it('should handle malformed JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await apiClient.simulate({
        automaton: {
          kind: 'DFA',
          states: ['q0'],
          alphabet: [],
          start: 'q0',
          accepting: [],
          transitions: [],
        },
        inputs: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PARSE_ERROR');
      }
    });
  });

  describe('parse endpoint', () => {
    it('should call parse endpoint with correct payload', async () => {
      const mockResponse = {
        ok: true,
        result: { lines: [] },
        trace: { steps: [] },
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      global.fetch = fetchSpy;

      await apiClient.parse({ source: 'v = 5 : volt' });

      expect(fetchSpy).toHaveBeenCalledWith('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'v = 5 : volt' }),
      });
    });
  });

  describe('checkUnits endpoint', () => {
    it('should call check-units endpoint with correct payload', async () => {
      const mockResponse = {
        ok: true,
        result: { valid: true },
        trace: { steps: [] },
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });
      global.fetch = fetchSpy;

      await apiClient.checkUnits({ source: 'v = 5 : volt' });

      expect(fetchSpy).toHaveBeenCalledWith('/api/check-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'v = 5 : volt' }),
      });
    });
  });
});
