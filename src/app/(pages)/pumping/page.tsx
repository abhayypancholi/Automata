'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AutomatonEditor } from '@/components/editor/AutomatonEditor';
import { useAutomatonStore } from '@/lib/store';
import { LoadingView } from '@/components/LoadingView';
import { Stepper } from '@/components/trace/Stepper';
import { StepLog } from '@/components/trace/StepLog';

type PumpingMode = 'nonregular' | 'regular';

interface PumpingResult {
  languageId?: string;
  p?: number;
  witness?: string;
  allDecompositionsFail?: boolean;
  explanation?: string;
  decompositions?: Array<{
    x: string;
    y: string;
    z: string;
    verdict: 'pass' | 'fail';
    counterexample?: { i: number; result: boolean };
  }>;
  trace?: Array<{
    index: number;
    title: string;
    explanation: string;
    data: unknown;
  }>;
}

export default function PumpingPage() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const [mode, setMode] = useState<PumpingMode>('nonregular');
  const [languageId, setLanguageId] = useState('anbn');
  const [pumpingLength, setPumpingLength] = useState('3');
  const [testString, setTestString] = useState('');
  const [result, setResult] = useState<PumpingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body =
        mode === 'nonregular'
          ? { mode: 'non-regular', languageId, p: parseInt(pumpingLength, 10) }
          : { mode: 'regular', automaton, string: testString };

      const response = await fetch('/api/pumping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Test failed');
        return;
      }

      setResult(data.result);
      setCurrentStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const trace = result?.trace || [];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Pumping Lemma
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test languages with the pumping lemma for regular languages.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setMode('nonregular')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mode === 'nonregular'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Non-Regular Mode
            </button>
            <button
              onClick={() => setMode('regular')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mode === 'regular'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Regular Mode
            </button>
          </nav>
        </div>

        {mode === 'nonregular' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language:
              </label>
              <select
                value={languageId}
                onChange={(e) => setLanguageId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="anbn">aⁿbⁿ</option>
                <option value="palindromes">Palindromes</option>
                <option value="equal-ab">Equal a and b</option>
                <option value="wwR">wwᴿ (even-length palindromes)</option>
                <option value="ww">ww (string repeated twice)</option>
                <option value="anbncn">aⁿbⁿcⁿ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pumping length (p):
              </label>
              <input
                type="number"
                value={pumpingLength}
                onChange={(e) => setPumpingLength(e.target.value)}
                min="1"
                max="10"
                className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {mode === 'regular' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Input Automaton
              </h2>
              <AutomatonEditor />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test string (length ≥ p):
              </label>
              <input
                type="text"
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="e.g., aaabbb"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleTest}
          disabled={loading || (mode === 'regular' && !automaton)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium"
        >
          {loading ? 'Testing...' : 'Test with Pumping Lemma'}
        </button>

        {loading && <LoadingView />}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {result && result.decompositions && (
          <div className="space-y-6">
            {/* Language Information for non-regular mode */}
            {mode === 'nonregular' && result.languageId && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Language Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Language: </span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono">
                      L = &#123; {(() => {
                        switch(result.languageId) {
                          case 'anbn': return 'aⁿbⁿ | n ≥ 0';
                          case 'anbncn': return 'aⁿbⁿcⁿ | n ≥ 0';
                          case 'palindromes': return 'w | w = wᴿ';
                          case 'wwR': return 'wwᴿ | w ∈ {a,b}*';
                          case 'ww': return 'ww | w ∈ {a,b}*';
                          case 'equal-ab': return 'w | #ₐ(w) = #ᵦ(w)';
                          default: return '...';
                        }
                      })()} &#125;
                    </span>
                  </div>
                  {result.p && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Pumping Length: </span>
                      <span className="text-gray-900 dark:text-gray-100">p = {result.p}</span>
                    </div>
                  )}
                  {result.witness && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Witness String: </span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">{result.witness}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Valid Decompositions
              </h3>
              <div className="space-y-3">
                {result.decompositions.map((decomp, idx) => {
                  const failsForI = decomp.counterexample?.i;
                  const pumpedString = failsForI !== undefined 
                    ? decomp.x + decomp.y.repeat(failsForI) + decomp.z
                    : null;
                  
                  return (
                    <div
                      key={idx}
                      className={`rounded p-3 ${
                        decomp.verdict === 'fail'
                          ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                          : 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="font-mono text-sm">
                          <span className="text-gray-600 dark:text-gray-400">x = </span>
                          <span className="text-gray-900 dark:text-gray-100">"{decomp.x || 'ε'}"</span>
                          <span className="text-gray-600 dark:text-gray-400">, y = </span>
                          <span className="text-gray-900 dark:text-gray-100">"{decomp.y}"</span>
                          <span className="text-gray-600 dark:text-gray-400">, z = </span>
                          <span className="text-gray-900 dark:text-gray-100">"{decomp.z || 'ε'}"</span>
                        </div>
                        
                        {mode === 'nonregular' && decomp.verdict === 'fail' && pumpedString && (
                          <div className="text-sm">
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="font-semibold">Pumping Test (i={failsForI}):</span>
                            </div>
                            <div className="font-mono text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1">
                              xy<sup>{failsForI}</sup>z = "{pumpedString}"
                            </div>
                            <div className="text-red-700 dark:text-red-300 mt-1">
                              ✗ This string does not belong to the language
                            </div>
                          </div>
                        )}
                        
                        <div
                          className={`text-sm font-medium ${
                            decomp.verdict === 'fail'
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-green-800 dark:text-green-200'
                          }`}
                        >
                          {decomp.verdict === 'fail' 
                            ? `✗ Fails pumping test` 
                            : '✓ Passes pumping test'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {mode === 'nonregular' && result.allDecompositionsFail && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                  <div className="text-sm text-yellow-900 dark:text-yellow-100">
                    <span className="font-semibold">Conclusion:</span> Every valid decomposition fails the pumping condition. 
                    This demonstrates that the language does not satisfy the pumping lemma for regular languages.
                  </div>
                </div>
              )}
            </div>

            {result.explanation && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Explanation
                </h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {result.explanation}
                </p>
              </div>
            )}

            {trace.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Detailed Steps
                </h3>

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
