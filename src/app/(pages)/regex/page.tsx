'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AutomatonEditor } from '@/components/editor/AutomatonEditor';
import { useAutomatonStore } from '@/lib/store';
import { Stepper } from '@/components/trace/Stepper';
import { StepLog } from '@/components/trace/StepLog';
import { LoadingView } from '@/components/LoadingView';
import type { Automaton } from '@/engine/automaton/types';

type TabType = 'thompson' | 'arden';

interface ThompsonResult {
  nfa: Automaton;
  ast?: unknown;
  trace?: Array<{
    index: number;
    title: string;
    explanation: string;
    data: unknown;
  }>;
}

interface ArdenResult {
  regex: string;
  regexTextbook?: string;
  trace?: Array<{
    index: number;
    title: string;
    explanation: string;
    data: unknown;
  }>;
}

export default function RegexPage() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const importAutomaton = useAutomatonStore((state) => state.importAutomaton);
  
  const [activeTab, setActiveTab] = useState<TabType>('thompson');
  
  // Thompson state
  const [regexInput, setRegexInput] = useState('');
  const [thompsonResult, setThompsonResult] = useState<ThompsonResult | null>(null);
  const [thompsonLoading, setThompsonLoading] = useState(false);
  const [thompsonError, setThompsonError] = useState<string | null>(null);
  const [thompsonStep, setThompsonStep] = useState(0);
  
  // Arden state
  const [ardenResult, setArdenResult] = useState<ArdenResult | null>(null);
  const [ardenLoading, setArdenLoading] = useState(false);
  const [ardenError, setArdenError] = useState<string | null>(null);
  const [ardenStep, setArdenStep] = useState(0);
  const [regexFormat, setRegexFormat] = useState<'canonical' | 'textbook'>('canonical');

  const handleThompson = async () => {
    if (!regexInput.trim()) {
      setThompsonError('Please enter a regex');
      return;
    }

    setThompsonLoading(true);
    setThompsonError(null);
    setThompsonResult(null);

    try {
      const response = await fetch('/api/regex-to-nfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regex: regexInput }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setThompsonError(data.error?.message || 'Conversion failed');
        return;
      }

      setThompsonResult(data.result);
      setThompsonStep(0);
    } catch (err) {
      setThompsonError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setThompsonLoading(false);
    }
  };

  const handleArden = async () => {
    if (!automaton) {
      setArdenError('No automaton defined. Load one in the editor below.');
      return;
    }

    setArdenLoading(true);
    setArdenError(null);
    setArdenResult(null);

    try {
      const response = await fetch('/api/fa-to-regex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automaton }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setArdenError(data.error?.message || 'Conversion failed');
        return;
      }

      setArdenResult(data.result);
      setArdenStep(0);
    } catch (err) {
      setArdenError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setArdenLoading(false);
    }
  };

  const handleLoadNfa = () => {
    if (thompsonResult?.nfa) {
      importAutomaton(thompsonResult.nfa);
      setActiveTab('arden'); // Switch to Arden tab
    }
  };

  const thompsonTrace = thompsonResult?.trace || [];
  const ardenTrace = ardenResult?.trace || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Regular Expression Conversions
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Convert between regular expressions and finite automata using Thompson construction
            and Arden's theorem.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('thompson')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'thompson'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Regex → NFA (Thompson)
            </button>
            <button
              onClick={() => setActiveTab('arden')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'arden'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              FA → Regex (Arden)
            </button>
          </nav>
        </div>

        {/* Thompson tab */}
        {activeTab === 'thompson' && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="regex-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Regular Expression:
              </label>
              <input
                id="regex-input"
                type="text"
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="e.g., (a|b)*c"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Supported: literals, | (union), * (star), + (plus), ? (optional), parentheses, character classes [a-z]
              </p>
            </div>

            <button
              onClick={handleThompson}
              disabled={thompsonLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {thompsonLoading ? 'Converting...' : 'Convert to NFA'}
            </button>

            {thompsonLoading && <LoadingView />}
            {thompsonError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {thompsonError}
                </p>
              </div>
            )}

            {thompsonResult && (
              <div className="space-y-6">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">States:</span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                      {thompsonResult.nfa.states.length}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Alphabet:</span>
                    <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                      {thompsonResult.nfa.alphabet.join(', ')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleLoadNfa}
                      className="px-3 py-1.5 text-sm rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      Load NFA into editor
                    </button>
                    <button
                      onClick={() => setActiveTab('arden')}
                      className="px-3 py-1.5 text-sm rounded bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 transition-colors"
                    >
                      Convert back to regex →
                    </button>
                  </div>
                </div>

                {thompsonTrace.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Construction Steps
                    </h3>

                    <Stepper
                      currentStep={thompsonStep}
                      totalSteps={thompsonTrace.length}
                      onStepChange={setThompsonStep}
                      isPlaying={false}
                      onPlayPause={() => {}}
                    />

                    <div className="mt-4">
                      <StepLog steps={thompsonTrace} currentStep={thompsonStep} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Arden tab */}
        {activeTab === 'arden' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Input Automaton
              </h2>
              <AutomatonEditor />
            </div>

            <button
              onClick={handleArden}
              disabled={ardenLoading || !automaton}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {ardenLoading ? 'Converting...' : 'Convert to Regex'}
            </button>

            {ardenLoading && <LoadingView />}
            {ardenError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {ardenError}
                </p>
              </div>
            )}

            {ardenResult && (
              <div className="space-y-6">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Result:
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRegexFormat('canonical')}
                        className={`px-2 py-1 text-xs rounded ${
                          regexFormat === 'canonical'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Canonical (|)
                      </button>
                      <button
                        onClick={() => setRegexFormat('textbook')}
                        className={`px-2 py-1 text-xs rounded ${
                          regexFormat === 'textbook'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Textbook (+)
                      </button>
                    </div>
                  </div>

                  <div className="font-mono text-lg text-gray-900 dark:text-gray-100 break-all">
                    {regexFormat === 'canonical'
                      ? ardenResult.regex
                      : ardenResult.regexTextbook || ardenResult.regex}
                  </div>
                </div>

                {ardenTrace.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Elimination Steps
                    </h3>

                    <Stepper
                      currentStep={ardenStep}
                      totalSteps={ardenTrace.length}
                      onStepChange={setArdenStep}
                      isPlaying={false}
                      onPlayPause={() => {}}
                    />

                    <div className="mt-4">
                      <StepLog steps={ardenTrace} currentStep={ardenStep} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
