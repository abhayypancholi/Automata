import { describe, it, expect, beforeEach } from 'vitest';
import { useAutomatonStore } from './store';
import type { Automaton } from '@/engine/automaton/types';

describe('AutomatonStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAutomatonStore.setState({
      automaton: {
        kind: 'DFA',
        states: [],
        alphabet: [],
        start: '',
        accepting: [],
        transitions: [],
      },
    });
  });

  describe('addState', () => {
    it('should add a new state', () => {
      const { addState } = useAutomatonStore.getState();
      addState('q0');
      expect(useAutomatonStore.getState().automaton.states).toEqual(['q0']);
    });

    it('should not add duplicate states', () => {
      const { addState } = useAutomatonStore.getState();
      addState('q0');
      addState('q0');
      expect(useAutomatonStore.getState().automaton.states).toEqual(['q0']);
    });

    it('should sort states naturally', () => {
      const { addState } = useAutomatonStore.getState();
      addState('q10');
      addState('q2');
      addState('q1');
      expect(useAutomatonStore.getState().automaton.states).toEqual([
        'q1',
        'q2',
        'q10',
      ]);
    });
  });

  describe('deleteState', () => {
    it('should remove state and related transitions', () => {
      const { addState, addSymbol, addTransition, deleteState } =
        useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addSymbol('a');
      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });

      deleteState('q1');

      const { automaton } = useAutomatonStore.getState();
      expect(automaton.states).toEqual(['q0']);
      expect(automaton.transitions).toEqual([]);
    });

    it('should unset start if deleted', () => {
      const { addState, setStart, deleteState } =
        useAutomatonStore.getState();
      addState('q0');
      setStart('q0');
      deleteState('q0');

      expect(useAutomatonStore.getState().automaton.start).toBe('');
    });

    it('should remove from accepting if deleted', () => {
      const { addState, toggleAccepting, deleteState } =
        useAutomatonStore.getState();
      addState('q0');
      toggleAccepting('q0');
      deleteState('q0');

      expect(useAutomatonStore.getState().automaton.accepting).toEqual([]);
    });
  });

  describe('renameState', () => {
    it('should rename state in all locations', () => {
      const { addState, addSymbol, addTransition, setStart, toggleAccepting, renameState } =
        useAutomatonStore.getState();

      // Setup
      addState('q0');
      addState('q1');
      addSymbol('a');
      setStart('q0');
      toggleAccepting('q0');
      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });
      addTransition({ from: 'q1', symbol: 'a', to: 'q0' });

      // Rename
      renameState('q0', 'q2');

      const { automaton } = useAutomatonStore.getState();
      expect(automaton.states).toContain('q2');
      expect(automaton.states).not.toContain('q0');
      expect(automaton.start).toBe('q2');
      expect(automaton.accepting).toContain('q2');
      expect(automaton.transitions).toContainEqual({
        from: 'q2',
        symbol: 'a',
        to: 'q1',
      });
      expect(automaton.transitions).toContainEqual({
        from: 'q1',
        symbol: 'a',
        to: 'q2',
      });
    });

    it('should not rename if target name already exists', () => {
      const { addState, renameState } = useAutomatonStore.getState();
      addState('q0');
      addState('q1');

      renameState('q0', 'q1');

      expect(useAutomatonStore.getState().automaton.states).toEqual([
        'q0',
        'q1',
      ]);
    });
  });

  describe('setStart', () => {
    it('should set start state', () => {
      const { addState, setStart } = useAutomatonStore.getState();
      addState('q0');
      setStart('q0');

      expect(useAutomatonStore.getState().automaton.start).toBe('q0');
    });

    it('should not set start to non-existent state', () => {
      const { setStart } = useAutomatonStore.getState();
      setStart('q0');

      expect(useAutomatonStore.getState().automaton.start).toBe('');
    });
  });

  describe('toggleAccepting', () => {
    it('should add state to accepting', () => {
      const { addState, toggleAccepting } = useAutomatonStore.getState();
      addState('q0');
      toggleAccepting('q0');

      expect(useAutomatonStore.getState().automaton.accepting).toEqual(['q0']);
    });

    it('should remove state from accepting', () => {
      const { addState, toggleAccepting } = useAutomatonStore.getState();
      addState('q0');
      toggleAccepting('q0');
      toggleAccepting('q0');

      expect(useAutomatonStore.getState().automaton.accepting).toEqual([]);
    });

    it('should sort accepting states', () => {
      const { addState, toggleAccepting } = useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addState('q10');
      toggleAccepting('q10');
      toggleAccepting('q0');
      toggleAccepting('q1');

      expect(useAutomatonStore.getState().automaton.accepting).toEqual([
        'q0',
        'q1',
        'q10',
      ]);
    });
  });

  describe('addSymbol', () => {
    it('should add symbol to alphabet', () => {
      const { addSymbol } = useAutomatonStore.getState();
      addSymbol('a');

      expect(useAutomatonStore.getState().automaton.alphabet).toEqual(['a']);
    });

    it('should not add duplicate symbols', () => {
      const { addSymbol } = useAutomatonStore.getState();
      addSymbol('a');
      addSymbol('a');

      expect(useAutomatonStore.getState().automaton.alphabet).toEqual(['a']);
    });

    it('should sort alphabet', () => {
      const { addSymbol } = useAutomatonStore.getState();
      addSymbol('c');
      addSymbol('a');
      addSymbol('b');

      expect(useAutomatonStore.getState().automaton.alphabet).toEqual([
        'a',
        'b',
        'c',
      ]);
    });
  });

  describe('removeSymbol', () => {
    it('should remove symbol and related transitions', () => {
      const { addState, addSymbol, addTransition, removeSymbol } =
        useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addSymbol('a');
      addSymbol('b');
      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });
      addTransition({ from: 'q0', symbol: 'b', to: 'q1' });

      removeSymbol('a');

      const { automaton } = useAutomatonStore.getState();
      expect(automaton.alphabet).toEqual(['b']);
      expect(automaton.transitions).toEqual([
        { from: 'q0', symbol: 'b', to: 'q1' },
      ]);
    });
  });

  describe('addTransition', () => {
    it('should add transition', () => {
      const { addState, addSymbol, addTransition } =
        useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addSymbol('a');

      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });

      expect(useAutomatonStore.getState().automaton.transitions).toEqual([
        { from: 'q0', symbol: 'a', to: 'q1' },
      ]);
    });

    it('should not add duplicate transitions', () => {
      const { addState, addSymbol, addTransition } =
        useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addSymbol('a');

      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });
      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });

      expect(useAutomatonStore.getState().automaton.transitions).toHaveLength(
        1
      );
    });

    it('should sort transitions canonically', () => {
      const { addState, addSymbol, addTransition } =
        useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addState('q2');
      addSymbol('a');
      addSymbol('b');

      addTransition({ from: 'q1', symbol: 'b', to: 'q2' });
      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });
      addTransition({ from: 'q1', symbol: 'a', to: 'q0' });

      const { transitions } = useAutomatonStore.getState().automaton;
      expect(transitions).toEqual([
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q1', symbol: 'a', to: 'q0' },
        { from: 'q1', symbol: 'b', to: 'q2' },
      ]);
    });
  });

  describe('removeTransition', () => {
    it('should remove specific transition', () => {
      const { addState, addSymbol, addTransition, removeTransition } =
        useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addSymbol('a');
      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });

      removeTransition({ from: 'q0', symbol: 'a', to: 'q1' });

      expect(useAutomatonStore.getState().automaton.transitions).toEqual([]);
    });
  });

  describe('updateTransition', () => {
    it('should update existing transition', () => {
      const { addState, addSymbol, addTransition, updateTransition } =
        useAutomatonStore.getState();
      addState('q0');
      addState('q1');
      addState('q2');
      addSymbol('a');
      addSymbol('b');
      addTransition({ from: 'q0', symbol: 'a', to: 'q1' });

      updateTransition(
        { from: 'q0', symbol: 'a', to: 'q1' },
        { from: 'q0', symbol: 'b', to: 'q2' }
      );

      const { transitions } = useAutomatonStore.getState().automaton;
      expect(transitions).toContainEqual({
        from: 'q0',
        symbol: 'b',
        to: 'q2',
      });
      expect(transitions).not.toContainEqual({
        from: 'q0',
        symbol: 'a',
        to: 'q1',
      });
    });
  });

  describe('setKind', () => {
    it('should change automaton kind', () => {
      const { setKind } = useAutomatonStore.getState();
      setKind('NFA');

      expect(useAutomatonStore.getState().automaton.kind).toBe('NFA');
    });
  });

  describe('importAutomaton', () => {
    it('should replace current automaton', () => {
      const newAutomaton: Automaton = {
        kind: 'DFA',
        states: ['s0', 's1'],
        alphabet: ['x'],
        start: 's0',
        accepting: ['s1'],
        transitions: [{ from: 's0', symbol: 'x', to: 's1' }],
      };

      const { importAutomaton } = useAutomatonStore.getState();
      importAutomaton(newAutomaton);

      expect(useAutomatonStore.getState().automaton).toEqual(newAutomaton);
    });
  });

  describe('exportAutomaton', () => {
    it('should return current automaton without layout', () => {
      const { addState, addSymbol, exportAutomaton } =
        useAutomatonStore.getState();
      addState('q0');
      addSymbol('a');

      const exported = exportAutomaton();

      expect(exported).toEqual({
        kind: 'DFA',
        states: ['q0'],
        alphabet: ['a'],
        start: '',
        accepting: [],
        transitions: [],
      });
      expect(exported).not.toHaveProperty('layout');
    });
  });

  describe('loadExample', () => {
    it('should load example automaton', () => {
      const example: Automaton = {
        kind: 'NFA',
        states: ['a', 'b'],
        alphabet: ['0'],
        start: 'a',
        accepting: ['b'],
        transitions: [{ from: 'a', symbol: '0', to: 'b' }],
      };

      const { loadExample } = useAutomatonStore.getState();
      loadExample(example);

      expect(useAutomatonStore.getState().automaton).toEqual(example);
    });
  });

  describe('reset', () => {
    it('should clear automaton to empty state', () => {
      const { addState, addSymbol, reset } = useAutomatonStore.getState();
      addState('q0');
      addSymbol('a');

      reset();

      const { automaton } = useAutomatonStore.getState();
      expect(automaton).toEqual({
        kind: 'DFA',
        states: [],
        alphabet: [],
        start: '',
        accepting: [],
        transitions: [],
      });
    });
  });
});
