'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AutomatonEditor } from '@/components/editor/AutomatonEditor';
import { useAutomatonStore } from '@/lib/store';
import { Stepper } from '@/components/trace/Stepper';
import { StepLog } from '@/components/trace/StepLog';
import { LoadingView } from '@/components/LoadingView';
import type { Automaton } from '@/engine/automaton/types';

interface MinimizeResult {
  minimal: Automaton;
  partitions?: string[][][]; // Array of partitions (each partition is array of blocks)
  mapping?: Record<string, string>;
  alreadyMinimal?: boolean;
  trace?: Array<{
    index: number;
    title: string;
    explanation: string;
    data: unknown;
  }>;
}

export default function MinimizePage() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const importAutomaton = useAutomatonStore((state) => state.importAutomaton);
  const [result, setResult] = useState<MinimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showDeadState, setShowDeadState] = useState(false);

  const handleMinimize = async () => {
    if (!automaton) {
      setError('No automaton defined');
      return;
    }

    if (automaton.kind !== 'DFA') {
      setError('Minimization requires a DFA. Convert your NFA first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/minimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automaton }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Minimization failed');
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

  const handleLoadMinimal = () => {
    if (result?.minimal) {
      // Optionally filter out dead state based on toggle
      if (!showDeadState) {
        // Simple heuristic: dead state has self-loops on all symbols
        const filtered = { ...result.minimal };
        // For now just load as-is; dead state filtering could be added
        importAutomaton(filtered);
      } else {
        importAutomaton(result.minimal);
      }
    }
  };

  const trace = result?.trace || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            DFA Minimization
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Minimize a DFA using partition refinement (Moore's algorithm).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Input DFA
          </h2>
          <AutomatonEditor />
        </div>

        <div>
          <button
            onClick={handleMinimize}
            disabled={loading || !automaton || automaton.kind !== 'DFA'}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {loading ? 'Minimizing...' : 'Minimize DFA'}
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
                Minimal DFA
              </h2>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
                {result.alreadyMinimal && (
                  <div className="rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200">
                    ✓ The input DFA was already minimal
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">States:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {result.minimal.states.length} states
                  </span>
                </div>

                <div className="text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Alphabet:</span>
                  <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                    {result.minimal.alphabet.join(', ')}
                  </span>
                </div>

                {result.mapping && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      State mapping
                    </summary>
                    <div className="mt-2 space-y-1 ml-4">
                      {Object.entries(result.mapping).map(([oldState, newState]) => (
                        <div key={oldState} className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          {oldState} → {newState}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLoadMinimal}
                    className="px-3 py-1.5 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    Load minimal DFA into editor
                  </button>

                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={showDeadState}
                      onChange={(e) => setShowDeadState(e.target.checked)}
                      className="mr-2"
                    />
                    Show dead state (if present)
                  </label>
                </div>
              </div>
            </div>

            {trace.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Minimization Steps
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
