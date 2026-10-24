import { describe, it, expect } from 'vitest';
import { EPS, type Automaton } from './types';

describe('Automaton types', () => {
  it('should define EPS constant correctly', () => {
    expect(EPS).toBe('ε');
  });

  it('should allow creating a valid automaton', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q0', symbol: '1', to: 'q0' },
        { from: 'q1', symbol: '0', to: 'q1' },
        { from: 'q1', symbol: '1', to: 'q0' },
      ],
    };

    expect(automaton.kind).toBe('DFA');
    expect(automaton.states).toHaveLength(2);
    expect(automaton.alphabet).toHaveLength(2);
  });
});
