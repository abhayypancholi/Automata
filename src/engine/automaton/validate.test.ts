import { describe, it, expect } from 'vitest';
import { validateAutomaton } from './validate';
import type { Automaton } from './types';
import { EPS } from './types';

describe('validateAutomaton', () => {
  it('should accept a valid DFA', () => {
    const dfa: Automaton = {
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

    const result = validateAutomaton(dfa);
    expect(result.ok).toBe(true);
  });

  it('should reject duplicate states', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q0'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Duplicate state');
      expect(result.error.message).toContain('q0');
    }
  });

  it('should reject empty state list', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: [],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('at least one state');
    }
  });

  it('should reject unknown start state', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q2',
      accepting: [],
      transitions: [],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Start state');
      expect(result.error.message).toContain('q2');
      expect(result.error.message).toContain('not found');
    }
  });

  it('should reject unknown accepting state', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: ['q2'],
      transitions: [],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Accepting state');
      expect(result.error.message).toContain('q2');
    }
  });

  it('should reject epsilon in alphabet', () => {
    const automaton: Automaton = {
      kind: 'NFA',
      states: ['q0'],
      alphabet: ['0', EPS],
      start: 'q0',
      accepting: [],
      transitions: [],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Alphabet');
      expect(result.error.message).toContain('ε');
    }
  });

  it('should reject transition from unknown state', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q2', symbol: '0', to: 'q1' }],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('from unknown state');
      expect(result.error.message).toContain('q2');
    }
  });

  it('should reject transition to unknown state', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: '0', to: 'q2' }],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('to unknown state');
      expect(result.error.message).toContain('q2');
    }
  });

  it('should reject transition with symbol not in alphabet', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: '1', to: 'q1' }],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('not in alphabet');
      expect(result.error.message).toContain('1');
    }
  });

  it('should reject epsilon transitions in DFA', () => {
    const automaton: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [{ from: 'q0', symbol: EPS, to: 'q1' }],
    };

    const result = validateAutomaton(automaton);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('DFA cannot have ε-transitions');
      expect(result.error.message).toContain('q0');
    }
  });

  it('should allow epsilon transitions in NFA', () => {
    const nfa: Automaton = {
      kind: 'NFA',
      states: ['q0', 'q1'],
      alphabet: ['0'],
      start: 'q0',
      accepting: ['q1'],
      transitions: [{ from: 'q0', symbol: EPS, to: 'q1' }],
    };

    const result = validateAutomaton(nfa);
    expect(result.ok).toBe(true);
  });

  it('should detect missing transitions in complete DFA check', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1'],
      alphabet: ['0', '1'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        // Missing: q0 on 1, q1 on 0, q1 on 1
      ],
    };

    const result = validateAutomaton(dfa, { requireComplete: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('missing transition');
      expect(result.error.message).toContain('q0');
      expect(result.error.message).toContain('1');
    }
  });

  it('should detect duplicate transitions in deterministic DFA check', () => {
    const dfa: Automaton = {
      kind: 'DFA',
      states: ['q0', 'q1', 'q2'],
      alphabet: ['0'],
      start: 'q0',
      accepting: [],
      transitions: [
        { from: 'q0', symbol: '0', to: 'q1' },
        { from: 'q0', symbol: '0', to: 'q2' },
      ],
    };

    const result = validateAutomaton(dfa, { requireDeterministic: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('multiple transitions');
      expect(result.error.message).toContain('q0');
      expect(result.error.message).toContain('0');
    }
  });

  it('should accept complete and deterministic DFA', () => {
    const dfa: Automaton = {
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

    const result = validateAutomaton(dfa, {
      requireComplete: true,
      requireDeterministic: true,
    });
    expect(result.ok).toBe(true);
  });
});
