'use client';

import { useState } from 'react';
import { TableEditor } from './TableEditor';
import { CanvasEditor } from './CanvasEditor';
import { useAutomatonStore } from '@/lib/store';
import { validateAutomaton } from '@/engine/automaton/validate';

export function AutomatonEditor() {
  const [view, setView] = useState<'table' | 'canvas'>('table');
  const [showHelp, setShowHelp] = useState(false);
  const automaton = useAutomatonStore((state) => state.automaton);
  const { importAutomaton, exportAutomaton, setKind, addState, addSymbol } = useAutomatonStore();

  // Validate automaton
  const validation = validateAutomaton(automaton);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importAutomaton(data);
        alert('Successfully imported automaton!');
      } catch (err) {
        alert(`Failed to import: ${err instanceof Error ? err.message : 'Invalid JSON file'}`);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data = exportAutomaton();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automaton.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View Toggle */}
        <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setView('canvas')}
            className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
              view === 'canvas'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Canvas
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-sm font-medium rounded-r-md border-l border-gray-300 dark:border-gray-600 ${
              view === 'table'
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Table
          </button>
        </div>

        {/* Kind Toggle */}
        <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setKind('DFA')}
            className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
              automaton.kind === 'DFA'
                ? 'bg-green-600 text-white dark:bg-green-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            DFA
          </button>
          <button
            onClick={() => setKind('NFA')}
            className={`px-3 py-1.5 text-sm font-medium rounded-r-md border-l border-gray-300 dark:border-gray-600 ${
              automaton.kind === 'NFA'
                ? 'bg-green-600 text-white dark:bg-green-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            NFA
          </button>
        </div>

        {/* Quick Actions for Canvas */}
        {view === 'canvas' && (
          <>
            <button
              onClick={() => addState(`q${automaton.states.length}`)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500"
            >
              Add State
            </button>
            <button
              onClick={() => addSymbol(String.fromCharCode(97 + automaton.alphabet.length))}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-500"
            >
              Add Symbol
            </button>
          </>
        )}

        <div className="flex-1"></div>

        {/* Import/Export */}
        <button
          onClick={handleImport}
          className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600"
        >
          Import JSON
        </button>
        <button
          onClick={handleExport}
          className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600"
        >
          Export JSON
        </button>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="rounded-md bg-gray-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-500"
        >
          {showHelp ? 'Hide' : 'Show'} Help
        </button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Quick Start Guide</h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p><strong>Table View:</strong> Click "Add State" and "Add Symbol" buttons, then type target states in the cells.</p>
            <p><strong>Canvas View:</strong> Visualization only - use Table view to edit. Canvas shows your automaton structure.</p>
            <p><strong>Set Start:</strong> Click radio button in "Start" column</p>
            <p><strong>Set Accepting:</strong> Check checkbox in "Accept" column</p>
            <p><strong>Add Transition:</strong> Type target state in the cell (for NFA, use comma: "q1, q2")</p>
            <p><strong>Epsilon Transitions:</strong> Switch to NFA mode, use "ε" column</p>
            
            <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
              <p className="font-semibold mb-1">Correct JSON Format:</p>
              <pre className="bg-blue-100 dark:bg-blue-900 p-2 rounded text-xs overflow-x-auto">
{`{
  "kind": "DFA",
  "states": ["q0", "q1"],
  "alphabet": ["a", "b"],
  "start": "q0",
  "accepting": ["q0"],
  "transitions": [
    { "from": "q0", "symbol": "a", "to": "q1" },
    { "from": "q0", "symbol": "b", "to": "q0" },
    { "from": "q1", "symbol": "a", "to": "q0" },
    { "from": "q1", "symbol": "b", "to": "q1" }
  ]
}`}</pre>
              <p className="mt-2 text-xs">Also accepts: "type", "initialState", "acceptStates" (auto-converted)</p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {!validation.ok && (
        <div
          className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-3"
          role="alert"
        >
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            {validation.error.code.replace(/_/g, ' ')}
          </p>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {validation.error.message}
          </p>
        </div>
      )}

      {/* Editor View */}
      {view === 'canvas' ? <CanvasEditor /> : <TableEditor />}
    </div>
  );
}
