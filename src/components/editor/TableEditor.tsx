'use client';

import { useState } from 'react';
import { useAutomatonStore } from '@/lib/store';

export function TableEditor() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const {
    addState,
    deleteState,
    renameState,
    setStart,
    toggleAccepting,
    addSymbol,
    removeSymbol,
    renameSymbol,
    addTransition,
    removeTransition,
  } = useAutomatonStore();

  // Local state for editing transitions and symbols
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [symbolEditValue, setSymbolEditValue] = useState<string>('');

  const handleAddState = () => {
    const newName = `q${automaton.states.length}`;
    addState(newName);
  };

  const handleAddSymbol = () => {
    const newSymbol = String.fromCharCode(97 + automaton.alphabet.length); // a, b, c, ...
    if (automaton.alphabet.length < 10) {
      addSymbol(newSymbol);
    }
  };

  // Get transitions for a given state and symbol
  const getTransitions = (state: string, symbol: string): string[] => {
    return automaton.transitions
      .filter((t) => t.from === state && t.symbol === symbol)
      .map((t) => t.to);
  };

  // Handle transition cell change (just updates display, doesn't validate)
  const handleTransitionChange = (
    state: string,
    symbol: string,
    value: string
  ) => {
    // Don't validate or modify - just let the user type
    // Actual state updates happen in handleTransitionCommit
  };

  // Handle when user finishes editing (blur or Enter)
  const handleTransitionCommit = (
    state: string,
    symbol: string,
    value: string
  ) => {
    if (value.trim()) {
      const targets = value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      for (const target of targets) {
        // Auto-create states that don't exist
        if (!automaton.states.includes(target)) {
          addState(target);
        }
        // Ensure transition exists
        const transitionExists = automaton.transitions.some(
          (t) => t.from === state && t.symbol === symbol && t.to === target
        );
        if (!transitionExists) {
          addTransition({ from: state, symbol, to: target });
        }
      }
    }
  };

  const alphabet = [
    ...automaton.alphabet,
    ...(automaton.kind === 'NFA' ? ['ε'] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAddState}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Add State
        </button>
        <button
          onClick={handleAddSymbol}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
        >
          Add Symbol
        </button>
      </div>

      {/* Table */}
      {automaton.states.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">
                  State
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold">
                  Start
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold">
                  Accept
                </th>
                {alphabet.map((symbol) => (
                  <th
                    key={symbol}
                    className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {symbol !== 'ε' ? (
                        <input
                          type="text"
                          value={editingSymbol === symbol ? symbolEditValue : symbol}
                          onFocus={() => {
                            setEditingSymbol(symbol);
                            setSymbolEditValue(symbol);
                          }}
                          onChange={(e) => {
                            setSymbolEditValue(e.target.value);
                          }}
                          onBlur={(e) => {
                            const newSymbol = e.target.value.trim();
                            if (newSymbol && newSymbol !== symbol && newSymbol.length <= 3) {
                              renameSymbol(symbol, newSymbol);
                            }
                            setEditingSymbol(null);
                            setSymbolEditValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newSymbol = e.currentTarget.value.trim();
                              if (newSymbol && newSymbol !== symbol && newSymbol.length <= 3) {
                                renameSymbol(symbol, newSymbol);
                              }
                              setEditingSymbol(null);
                              setSymbolEditValue('');
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-12 bg-transparent text-center font-semibold focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                          maxLength={3}
                        />
                      ) : (
                        <span>{symbol}</span>
                      )}
                      {symbol !== 'ε' && (
                        <button
                          onClick={() => removeSymbol(symbol)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          aria-label={`Remove symbol ${symbol}`}
                          title="Remove symbol"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {automaton.states.map((state) => (
                <tr
                  key={state}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => {
                        const newName = e.target.value.trim();
                        if (newName && newName !== state) {
                          renameState(state, newName);
                        }
                      }}
                      onBlur={(e) => {
                        const newName = e.target.value.trim();
                        if (!newName) {
                          // Restore original name if empty
                          e.target.value = state;
                        }
                      }}
                      className="w-full bg-transparent px-1 py-0.5 font-medium focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label={`State name: ${state}`}
                    />
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                    <input
                      type="radio"
                      name="start"
                      checked={automaton.start === state}
                      onChange={() => setStart(state)}
                      className="cursor-pointer"
                      aria-label={`Set ${state} as start state`}
                    />
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={automaton.accepting.includes(state)}
                      onChange={() => toggleAccepting(state)}
                      className="cursor-pointer"
                      aria-label={`Toggle ${state} as accepting`}
                    />
                  </td>
                  {alphabet.map((symbol) => {
                    const cellKey = `${state}-${symbol}`;
                    const currentValue = getTransitions(state, symbol).join(', ');
                    const isEditing = editingCell === cellKey;
                    const displayValue = isEditing ? editValue : currentValue;
                    
                    return (
                      <td
                        key={symbol}
                        className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                      >
                        <input
                          type="text"
                          list={`states-${state}-${symbol}`}
                          value={displayValue}
                          onFocus={() => {
                            setEditingCell(cellKey);
                            setEditValue(currentValue);
                          }}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={(e) => {
                            handleTransitionCommit(state, symbol, e.target.value);
                            setEditingCell(null);
                            setEditValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTransitionCommit(state, symbol, e.currentTarget.value);
                              setEditingCell(null);
                              setEditValue('');
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-full bg-transparent px-1 py-0.5 text-center focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="—"
                          aria-label={`Transition from ${state} on ${symbol}`}
                        />
                        <datalist id={`states-${state}-${symbol}`}>
                          {automaton.states.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                    <button
                      onClick={() => deleteState(state)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      aria-label={`Delete state ${state}`}
                      title="Delete state"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No states yet. Click "Add State" to begin.
          </p>
        </div>
      )}
    </div>
  );
}
