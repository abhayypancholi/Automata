'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { LoadingView } from '@/components/LoadingView';

type ParserTab = 'tokens' | 'tree' | 'derivation' | 'units' | 'annotations';

interface ParseResult {
  lines?: Array<{
    tokens?: Array<{ type: string; text: string; line: number; column: number }>;
    ast?: unknown;
    errors?: Array<{ code: string; message: string; line: number; column: number }>;
  }>;
  units?: { ok: boolean };
}

export default function ParserPage() {
  const [activeTab, setActiveTab] = useState<ParserTab>('tokens');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Parse failed');
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Render error with caret (as specified in T19 requirement)
  const renderErrorWithCaret = (err: { message: string; line: number; column: number }, lineText: string) => {
    const caret = ' '.repeat(Math.max(0, err.column - 1)) + '^';
    return (
      <div className="font-mono text-sm">
        <div className="text-gray-600 dark:text-gray-400">{lineText}</div>
        <div className="text-red-600 dark:text-red-400">{caret}</div>
        <div className="text-red-800 dark:text-red-200 mt-1">{err.message}</div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Parser & Unit Checker
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Parse the mini-language and check dimensional consistency.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source code:
          </label>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="I : ampere&#10;R : ohm&#10;V = I * R : volt"
            rows={12}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
        </div>

        <button
          onClick={handleParse}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium"
        >
          {loading ? 'Parsing...' : 'Parse & Check Units'}
        </button>

        {loading && <LoadingView />}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Tab navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('tokens')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tokens'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Tokens
                </button>
                <button
                  onClick={() => setActiveTab('tree')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tree'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Parse Tree
                </button>
                <button
                  onClick={() => setActiveTab('derivation')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'derivation'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Derivation
                </button>
                <button
                  onClick={() => setActiveTab('units')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'units'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Units
                </button>
                <button
                  onClick={() => setActiveTab('annotations')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'annotations'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Annotations
                </button>
              </nav>
            </div>

            {/* Tab content */}
            {activeTab === 'tokens' && result.lines && (
              <div className="space-y-4">
                {result.lines.map((line, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Line {idx + 1}
                    </div>
                    {line.errors && line.errors.length > 0 ? (
                      <div className="space-y-2">
                        {line.errors.map((err, errIdx) => (
                          <div key={errIdx}>
                            {renderErrorWithCaret(err, source.split('\n')[idx] || '')}
                          </div>
                        ))}
                      </div>
                    ) : line.tokens ? (
                      <div className="space-y-1">
                        {line.tokens.map((token, tokenIdx) => (
                          <div key={tokenIdx} className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            <span className="text-blue-600 dark:text-blue-400">{token.type}</span>
                            {' "'}
                            {token.text}
                            {'"'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-500">Empty line</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tree' && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Parse tree visualization coming in polish phase
                </p>
              </div>
            )}

            {activeTab === 'derivation' && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Leftmost derivation display coming in polish phase
                </p>
              </div>
            )}

            {activeTab === 'units' && result.units && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className={`text-lg font-semibold ${result.units.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {result.units.ok ? '✓ All units consistent' : '✗ Unit errors found'}
                </div>
              </div>
            )}

            {activeTab === 'annotations' && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Comment annotations display coming in polish phase
                </p>
              </div>
            )}
          </div>
        )}

        {/* Balanced parentheses demo section */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Demonstration: Balanced Parentheses
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            The language of balanced parentheses is context-free (Type 2) but not regular (Type 3).
          </p>
          <a
            href="/pumping"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            → Test with pumping lemma
          </a>
        </div>
      </div>
    </Layout>
  );
}
