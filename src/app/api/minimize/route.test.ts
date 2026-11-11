import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('/api/minimize', () => {
  it('should minimize a simple DFA', async () => {
    const dfa = {
      kind: 'DFA' as const,
      states: ['q0', 'q1', 'q2'],
      alphabet: ['a', 'b'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'b', to: 'q0' },
        { from: 'q1', symbol: 'a', to: 'q2' },
        { from: 'q1', symbol: 'b', to: 'q1' },
        { from: 'q2', symbol: 'a', to: 'q2' },
        { from: 'q2', symbol: 'b', to: 'q2' },
      ],
    };

    const request = new Request('http://localhost:3000/api/minimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: dfa }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.minimal).toBeDefined();
    expect(data.result.minimal.kind).toBe('DFA');
    expect(data.result.trace).toBeDefined();
    expect(data.result.alreadyMinimal).toBeDefined();
  });

  it('should detect already minimal DFA', async () => {
    const dfa = {
      kind: 'DFA' as const,
      states: ['q0', 'q1'],
      alphabet: ['a'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q1' },
      ],
    };

    const request = new Request('http://localhost:3000/api/minimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: dfa }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.result.minimal).toBeDefined();
  });

  it('should return error for invalid automaton', async () => {
    const request = new Request('http://localhost:3000/api/minimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automaton: { invalid: 'data' } }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.ok).toBe(false);
    expect(data.error).toBeDefined();
  });
});
