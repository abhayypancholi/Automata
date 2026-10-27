import { create } from 'zustand';
import type { Automaton, Transition } from '@/engine/automaton/types';

interface AutomatonStore {
  automaton: Automaton;
  addState: (state: string) => void;
  deleteState: (state: string) => void;
  renameState: (oldName: string, newName: string) => void;
  setStart: (state: string) => void;
  toggleAccepting: (state: string) => void;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  addTransition: (transition: Transition) => void;
  removeTransition: (transition: Transition) => void;
  updateTransition: (old: Transition, updated: Transition) => void;
  setKind: (kind: 'DFA' | 'NFA') => void;
  importAutomaton: (automaton: Automaton) => void;
  exportAutomaton: () => Automaton;
  loadExample: (automaton: Automaton) => void;
  reset: () => void;
}

// Natural sort comparator for state/symbol strings
function naturalCompare(a: string, b: string): number {
  const regex = /(\d+)|(\D+)/g;
  const aParts = a.match(regex) ?? [];
  const bParts = b.match(regex) ?? [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];

    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;

    const aNum = Number(aPart);
    const bNum = Number(bPart);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      if (aPart !== bPart) return aPart.localeCompare(bPart);
    }
  }

  return 0;
}

// Sort transitions canonically: (from, symbol, to)
function sortTransitions(transitions: Transition[]): Transition[] {
  return [...transitions].sort((a, b) => {
    const fromCmp = naturalCompare(a.from, b.from);
    if (fromCmp !== 0) return fromCmp;

    const symbolCmp = a.symbol.localeCompare(b.symbol);
    if (symbolCmp !== 0) return symbolCmp;

    return naturalCompare(a.to, b.to);
  });
}

// Check if two transitions are equal
function transitionEquals(a: Transition, b: Transition): boolean {
  return a.from === b.from && a.symbol === b.symbol && a.to === b.to;
}

const emptyAutomaton: Automaton = {
  kind: 'DFA',
  states: [],
  alphabet: [],
  start: '',
  accepting: [],
  transitions: [],
};

export const useAutomatonStore = create<AutomatonStore>((set, get) => ({
  automaton: { ...emptyAutomaton },

  addState: (state: string) => {
    set((store) => {
      if (store.automaton.states.includes(state)) {
        return store;
      }
      return {
        automaton: {
          ...store.automaton,
          states: [...store.automaton.states, state].sort(naturalCompare),
        },
      };
    });
  },

  deleteState: (state: string) => {
    set((store) => {
      const states = store.automaton.states.filter((s) => s !== state);
      const transitions = store.automaton.transitions.filter(
        (t) => t.from !== state && t.to !== state
      );
      const accepting = store.automaton.accepting.filter((s) => s !== state);
      const start = store.automaton.start === state ? '' : store.automaton.start;

      return {
        automaton: {
          ...store.automaton,
          states,
          transitions,
          accepting,
          start,
        },
      };
    });
  },

  renameState: (oldName: string, newName: string) => {
    set((store) => {
      // Don't rename if target name already exists
      if (
        store.automaton.states.includes(newName) &&
        oldName !== newName
      ) {
        return store;
      }

      const states = store.automaton.states
        .map((s) => (s === oldName ? newName : s))
        .sort(naturalCompare);

      const transitions = sortTransitions(
        store.automaton.transitions.map((t) => ({
          from: t.from === oldName ? newName : t.from,
          symbol: t.symbol,
          to: t.to === oldName ? newName : t.to,
        }))
      );

      const accepting = store.automaton.accepting
        .map((s) => (s === oldName ? newName : s))
        .sort(naturalCompare);

      const start =
        store.automaton.start === oldName ? newName : store.automaton.start;

      return {
        automaton: {
          ...store.automaton,
          states,
          transitions,
          accepting,
          start,
        },
      };
    });
  },

  setStart: (state: string) => {
    set((store) => {
      // Only set if state exists
      if (!store.automaton.states.includes(state)) {
        return store;
      }
      return {
        automaton: {
          ...store.automaton,
          start: state,
        },
      };
    });
  },

  toggleAccepting: (state: string) => {
    set((store) => {
      const isAccepting = store.automaton.accepting.includes(state);
      const accepting = isAccepting
        ? store.automaton.accepting.filter((s) => s !== state)
        : [...store.automaton.accepting, state].sort(naturalCompare);

      return {
        automaton: {
          ...store.automaton,
          accepting,
        },
      };
    });
  },

  addSymbol: (symbol: string) => {
    set((store) => {
      if (store.automaton.alphabet.includes(symbol)) {
        return store;
      }
      return {
        automaton: {
          ...store.automaton,
          alphabet: [...store.automaton.alphabet, symbol].sort(),
        },
      };
    });
  },

  removeSymbol: (symbol: string) => {
    set((store) => {
      const alphabet = store.automaton.alphabet.filter((s) => s !== symbol);
      const transitions = store.automaton.transitions.filter(
        (t) => t.symbol !== symbol
      );

      return {
        automaton: {
          ...store.automaton,
          alphabet,
          transitions,
        },
      };
    });
  },

  addTransition: (transition: Transition) => {
    set((store) => {
      // Check for duplicate
      const exists = store.automaton.transitions.some((t) =>
        transitionEquals(t, transition)
      );
      if (exists) {
        return store;
      }

      return {
        automaton: {
          ...store.automaton,
          transitions: sortTransitions([
            ...store.automaton.transitions,
            transition,
          ]),
        },
      };
    });
  },

  removeTransition: (transition: Transition) => {
    set((store) => {
      return {
        automaton: {
          ...store.automaton,
          transitions: store.automaton.transitions.filter(
            (t) => !transitionEquals(t, transition)
          ),
        },
      };
    });
  },

  updateTransition: (old: Transition, updated: Transition) => {
    set((store) => {
      const transitions = store.automaton.transitions.map((t) =>
        transitionEquals(t, old) ? updated : t
      );

      return {
        automaton: {
          ...store.automaton,
          transitions: sortTransitions(transitions),
        },
      };
    });
  },

  setKind: (kind: 'DFA' | 'NFA') => {
    set((store) => ({
      automaton: {
        ...store.automaton,
        kind,
      },
    }));
  },

  importAutomaton: (automaton: Automaton) => {
    set({ automaton: { ...automaton } });
  },

  exportAutomaton: () => {
    const { automaton } = get();
    // Remove layout property if present
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { layout, ...rest } = automaton as Automaton & { layout?: unknown };
    return rest;
  },

  loadExample: (automaton: Automaton) => {
    set({ automaton: { ...automaton } });
  },

  reset: () => {
    set({ automaton: { ...emptyAutomaton } });
  },
}));
