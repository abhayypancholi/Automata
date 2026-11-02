import { describe, it, expect } from 'vitest';
import { POST } from './route';
import type { Automaton } from '@/engine/automaton/types';

describe('POST /api/simulate', () => {
  it('should simulate DFA and return results', async () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'b', to: 'q0' },
        { from: 'q0', symbol: 'b', to: 'q0' },
        { from: 'q1', symbol: 'a', to: 'q1' },
      ],
    };

    const request = new Request('http://localhost/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automaton,
        inputs: ['a', 'ab', 'b'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.results).toHaveLength(3);
    expect(data.result.results[0].accepted).toBe(true); // 'a' -> q1
    expect(data.result.results[1].accepted).toBe(false); // 'ab' -> q0
    expect(data.result.results[2].accepted).toBe(false); // 'b' -> q0
  });

  it('should return 400 for malformed JSON', async () => {
    const request = new Request('http://localhost/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.ok).toBe(false);
  });

  it('should handle invalid automaton during simulation', async () => {
    const request = new Request('http://localhost/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automaton: {
          kind: 'DFA',
          states: ['q0', 'q1'],
          alphabet: ['a'],
          start: 'q0',
          accepting: [],
          transitions: [
            // Invalid: transition to non-existent state
            { from: 'q0', symbol: 'a', to: 'q99' },
          ],
        },
        inputs: ['a'],
      }),
    });

    const response = await POST(request);
    // Simulate validates and returns 422 for invalid automaton
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('INVALID_AUTOMATON');
  });

  it('should handle symbol not in alphabet', async () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q0'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q0' }],
    };

    const request = new Request('http://localhost/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automaton,
        inputs: ['b'], // 'b' not in alphabet
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe('SYMBOL_NOT_IN_ALPHABET');
  });

  it('should return deterministic results', async () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: 'a', to: 'q1' }],
    };

    const body = JSON.stringify({ automaton, inputs: ['a', ''] });

    const request1 = new Request('http://localhost/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const request2 = new Request('http://localhost/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const response1 = await POST(request1);
    const response2 = await POST(request2);

    const data1 = await response1.json();
    const data2 = await response2.json();

    expect(JSON.stringify(data1)).toBe(JSON.stringify(data2));
  });
});
