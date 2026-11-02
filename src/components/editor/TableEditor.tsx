'use client';

import { useAutomatonStore } from '@/lib/store';

export function TableEditor() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const {
    addState,
    deleteState,
    setStart,
    toggleAccepting,
    addSymbol,
    removeSymbol,
    addTransition,
    removeTransition,
  } = useAutomatonStore();

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

  // Handle transition cell change
  const handleTransitionChange = (
    state: string,
    symbol: string,
    value: string
  ) => {
    const currentTargets = getTransitions(state, symbol);

    // Remove existing transitions
    for (const target of currentTargets) {
      removeTransition({ from: state, symbol, to: target });
    }

    // Add new transitions (comma-separated for NFA)
    if (value.trim()) {
      const targets = value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => automaton.states.includes(t));

      for (const target of targets) {
        addTransition({ from: state, symbol, to: target });
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
                    {symbol}
                    <button
                      onClick={() => removeSymbol(symbol)}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      aria-label={`Remove symbol ${symbol}`}
                      title="Remove symbol"
                    >
                      ×
                    </button>
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
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">
                    {state}
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
                  {alphabet.map((symbol) => (
                    <td
                      key={symbol}
                      className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                    >
                      <input
                        type="text"
                        value={getTransitions(state, symbol).join(', ')}
                        onChange={(e) =>
                          handleTransitionChange(state, symbol, e.target.value)
                        }
                        className="w-full bg-transparent px-1 py-0.5 text-center focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="—"
                        aria-label={`Transition from ${state} on ${symbol}`}
                      />
                    </td>
                  ))}
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
