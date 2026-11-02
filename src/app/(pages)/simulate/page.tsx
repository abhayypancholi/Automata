'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AutomatonEditor } from '@/components/editor/AutomatonEditor';
import { useAutomatonStore } from '@/lib/store';
import { Stepper } from '@/components/trace/Stepper';
import { StepLog } from '@/components/trace/StepLog';

interface SimulationResult {
  input: string;
  ok: boolean;
  accepted?: boolean;
  trace?: Array<{
    index: number;
    title: string;
    explanation: string;
    data: unknown;
  }>;
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
}

export default function SimulatePage() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const [inputStrings, setInputStrings] = useState<string>('');
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleSimulate = async () => {
    if (!automaton) {
      setError('No automaton defined');
      return;
    }

    // Parse input strings (one per line, empty lines ignored)
    const inputs = inputStrings
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (inputs.length === 0) {
      setError('No input strings provided');
      return;
    }

    if (inputs.length > 20) {
      setError('Too many input strings (max 20)');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automaton, inputs }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Simulation failed');
        return;
      }

      setResults(data.data);
      setSelectedResultIndex(0);
      setCurrentStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const selectedResult = results?.[selectedResultIndex];
  const trace = selectedResult?.trace || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Simulate Automaton
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Build or import an automaton and test strings against it.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Automaton
          </h2>
          <AutomatonEditor />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Test Strings
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="input-strings"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Input strings (one per line):
              </label>
              <textarea
                id="input-strings"
                value={inputStrings}
                onChange={(e) => setInputStrings(e.target.value)}
                placeholder="Enter test strings, one per line&#10;Example:&#10;&#10;aabb&#10;ab"
                rows={6}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading || !automaton}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {results && results.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Results
            </h2>

            <div className="space-y-4">
              {/* Results summary table */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-750">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                        Input
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                        Result
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {results.map((result, idx) => (
                      <tr
                        key={idx}
                        className={
                          selectedResultIndex === idx
                            ? 'bg-blue-50 dark:bg-blue-950'
                            : ''
                        }
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                          {result.input || '(empty)'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {result.ok ? (
                            <span
                              className={
                                result.accepted
                                  ? 'text-green-700 dark:text-green-400 font-medium'
                                  : 'text-red-700 dark:text-red-400 font-medium'
                              }
                            >
                              {result.accepted ? 'Accepted' : 'Rejected'}
                            </span>
                          ) : (
                            <span className="text-red-700 dark:text-red-400 font-medium">
                              Error: {result.error?.code}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              setSelectedResultIndex(idx);
                              setCurrentStep(0);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View trace
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Step-by-step trace viewer */}
              {selectedResult && selectedResult.ok && trace.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Trace for: {selectedResult.input || '(empty)'}
                  </h3>

                  <Stepper
                    currentStep={currentStep}
                    totalSteps={trace.length}
                    onStepChange={setCurrentStep}
                    isPlaying={false}
                    onPlayPause={() => {}}
                  />

                  <StepLog steps={trace} currentStep={currentStep} />
                </div>
              )}

              {selectedResult && !selectedResult.ok && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error: {selectedResult.error?.message}
                  </p>
                  {selectedResult.error?.context && (
                    <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto">
                      {JSON.stringify(selectedResult.error.context, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
