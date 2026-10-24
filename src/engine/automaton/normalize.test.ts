import { describe, it, expect } from 'vitest';
import { normalize } from './normalize';
import type { Automaton } from './types';

describe('normalize', () => {
  it('should sort states naturally', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q10', 'q2', 'q1'],
      alphabet: ['0'],
      start: 'q1',
      accepting: [],
      transitions: [],
    };

    const result = normalize(automaton);
    expect(result.states).toEqual(['q1', 'q2', 'q10']);
  });

  it('should sort alphabet', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['c', 'a', 'b'],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const result = normalize(automaton);
    expect(result.alphabet).toEqual(['a', 'b', 'c']);
  });

  it('should sort transitions by (from, symbol, to)', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q1', symbol: '1', to: 'q0' },
        { from: 'q0', symbol: '1', to: 'q1' },
        { from: 'q1', symbol: '0', to: 'q2' },
        { from: 'q0', symbol: '0', to: 'q0' },
      ],
    };

    const result = normalize(automaton);
    expect(result.transitions).toEqual([
      { from: 'q0', symbol: '0', to: 'q0' },
      { from: 'q0', symbol: '1', to: 'q1' },
      { from: 'q1', symbol: '0', to: 'q2' },
      { from: 'q1', symbol: '1', to: 'q0' },
    ]);
  });

  it('should deduplicate transitions', () => {
    const automaton: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q0', symbol: '0', to: 'q1' },
      ],
    };

    const result = normalize(automaton);
    expect(result.transitions).toHaveLength(1);
    expect(result.transitions[0]).toEqual({ from: 'q0', symbol: '0', to: 'q1' });
  });

  it('should sort accepting states', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0'],
      start: 'q0',
      accepting: ['q2', 'q0', 'q1'],
      transitions: [],
    };

    const result = normalize(automaton);
    expect(result.accepting).toEqual(['q0', 'q1', 'q2']);
  });

  it('should be idempotent', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q2', 'q0', 'q1'],
      alphabet: ['1', '0'],
      start: 'q0',
      accepting: ['q2', 'q0'],
      transitions: [
        { from: 'q1', symbol: '0', to: 'q0' },
        { from: 'q0', symbol: '1', to: 'q1' },
      ],
    };

    const once = normalize(automaton);
    const twice = normalize(once);

    expect(twice).toEqual(once);
  });

  it('should not mutate the input', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q1', 'q0'],
      alphabet: ['1', '0'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q1', symbol: '0', to: 'q0' }],
    };

    const original = JSON.parse(JSON.stringify(automaton));
    normalize(automaton);

    expect(automaton).toEqual(original);
  });

  it('should preserve layout if present', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [],
      layout: { q0: { x: 10, y: 20 }, q1: { x: 30, y: 40 } },
    };

    const result = normalize(automaton);
    expect(result.layout).toEqual({ q0: { x: 10, y: 20 }, q1: { x: 30, y: 40 } });
  });

  it('should handle empty accepting states', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const result = normalize(automaton);
    expect(result.accepting).toEqual([]);
  });
});
