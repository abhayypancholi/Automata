import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('/api/nfa-to-dfa', () => {
  it('should convert NFA with epsilon transitions to DFA', async () => {
    const nfa = {
      kind: 'NFA' as const,
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: 'ε', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q2' },
      ],
    };

    const request = new Request('http://localhost:3000/api/nfa-to-dfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: nfa }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.dfa).toBeDefined();
    expect(data.result.dfa.kind).toBe('DFA');
    expect(data.result.dfa.states.length).toBeGreaterThan(0);
    expect(data.result.table).toBeDefined();
    expect(data.result.trace).toBeDefined();
  });

  it('should return error for invalid automaton', async () => {
    const request = new Request('http://localhost:3000/api/nfa-to-dfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: { invalid: 'data' } }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ok).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should handle NFA without epsilon transitions', async () => {
    const nfa = {
      kind: 'NFA' as const,
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
      ],
    };

    const request = new Request('http://localhost:3000/api/nfa-to-dfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: nfa }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.result.dfa).toBeDefined();
  });
});
