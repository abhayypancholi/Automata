'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AutomatonEditor } from '@/components/editor/AutomatonEditor';
import { useAutomatonStore } from '@/lib/store';
import { Stepper } from '@/components/trace/Stepper';
import { StepLog } from '@/components/trace/StepLog';
import { LoadingView } from '@/components/LoadingView';
import type { Automaton } from '@/engine/automaton/types';

interface ConversionResult {
  dfa: Automaton;
  table?: Array<{ subset: string; states: string[]; accepting: boolean }>;
  trace?: Array<{
    index: number;
    title: string;
    explanation: string;
    data: unknown;
  }>;
}

export default function NfaToDfaPage() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const importAutomaton = useAutomatonStore((state) => state.importAutomaton);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [useSimpleNames, setUseSimpleNames] = useState(false);

  const handleConvert = async () => {
    if (!automaton) {
      setError('No automaton defined');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/nfa-to-dfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automaton }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Conversion failed');
        return;
      }

      setResult(data.data);
      setCurrentStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDfa = () => {
    if (result?.dfa) {
      let automaton = result.dfa;
      
      // Optionally rename states to simple A, B, C... format
      if (useSimpleNames) {
        const stateMapping = new Map<string, string>();
        automaton.states.forEach((state, index) => {
          // Generate A, B, C, ..., Z, AA, AB, ...
          const name = indexToLetters(index);
          stateMapping.set(state, name);
        });
        
        automaton = {
          ...automaton,
          states: automaton.states.map(s => stateMapping.get(s)!),
          start: stateMapping.get(automaton.start)!,
          accepting: automaton.accepting.map(s => stateMapping.get(s)!),
          transitions: automaton.transitions.map(t => ({
            from: stateMapping.get(t.from)!,
            symbol: t.symbol,
            to: stateMapping.get(t.to)!,
          })),
        };
      }
      
      importAutomaton(automaton);
    }
  };

  // Helper to convert index to letters: 0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, etc.
  const indexToLetters = (index: number): string => {
    let result = '';
    let num = index;
    while (true) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
      if (num === 0) break;
      num--;
    }
    return result;
  };

  const trace = result?.trace || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            NFA to DFA Conversion
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Convert a nondeterministic finite automaton to a deterministic one using subset
            construction.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Input NFA
          </h2>
          <AutomatonEditor />
        </div>

        <div>
          <button
            onClick={handleConvert}
            disabled={loading || !automaton}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {loading ? 'Converting...' : 'Convert to DFA'}
          </button>
        </div>

        {loading && <LoadingView />}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Result DFA
              </h2>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">States:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {result.dfa.states.length} states
                  </span>
                </div>

                <div className="text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Alphabet:</span>
                  <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                    {result.dfa.alphabet.join(', ')}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLoadDfa}
                    className="px-3 py-1.5 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    Load DFA into editor
                  </button>

                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={useSimpleNames}
                      onChange={(e) => setUseSimpleNames(e.target.checked)}
                      className="mr-2"
                    />
                    Use simple names (A, B, C...)
                  </label>
                </div>
              </div>
            </div>

            {trace.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Conversion Steps
                </h2>

                <Stepper
                  currentStep={currentStep}
                  totalSteps={trace.length}
                  onStepChange={setCurrentStep}
                  isPlaying={false}
                  onPlayPause={() => {}}
                />

                <div className="mt-4">
                  <StepLog steps={trace} currentStep={currentStep} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
