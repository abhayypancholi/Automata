'use client';

import { useState } from 'react';
import { TableEditor } from './TableEditor';
import { CanvasEditor } from './CanvasEditor';
import { useAutomatonStore } from '@/lib/store';
import { validateAutomaton } from '@/engine/automaton/validate';

export function AutomatonEditor() {
  const [view, setView] = useState<'table' | 'canvas'>('canvas');
  const automaton = useAutomatonStore((state) => state.automaton);
  const { importAutomaton, exportAutomaton, setKind } = useAutomatonStore();

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
      } catch {
        alert('Failed to import: Invalid JSON file');
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
      </div>

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
