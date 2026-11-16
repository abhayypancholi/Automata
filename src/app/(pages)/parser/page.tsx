'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { LoadingView } from '@/components/LoadingView';

import { generateParseTree, generateDerivation, extractAnnotations, renderTreeAsText, type TreeNode, type Annotation } from '@/lib/parserHelpers';

type ParserTab = 'tokens' | 'tree' | 'derivation' | 'units' | 'annotations';

interface ParseResult {
  lines?: Array<{
    tokens?: Array<{ type: string; text: string; line: number; column: number }>;
    ast?: unknown;
    errors?: Array<{ code: string; message: string; line: number; column: number }>;
  }>;
  ast?: any; // Full AST
  units?: { 
    ok: boolean; 
    errors?: Array<{ 
      code: string; 
      message: string; 
      line?: number; 
      column?: number;
    }>;
  };
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

      setResult(data.result);
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

            {activeTab === 'tree' && result.ast && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Parse Tree
                </h3>
                <pre className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto whitespace-pre">
                  {renderTreeAsText(generateParseTree(result.ast))}
                </pre>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  This tree shows the hierarchical structure of your program as parsed by the grammar.
                </p>
              </div>
            )}

            {activeTab === 'derivation' && result.ast && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Leftmost Derivation
                </h3>
                <div className="space-y-2">
                  {generateDerivation(result.ast).map((step, idx) => (
                    <div key={idx} className="font-mono text-sm">
                      <span className="text-gray-500 dark:text-gray-500 mr-3">{idx + 1}.</span>
                      <span className="text-gray-900 dark:text-gray-100">{step}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  Each step shows the leftmost nonterminal being expanded in the derivation.
                </p>
              </div>
            )}

            {activeTab === 'annotations' && result.ast && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Comment Annotations
                </h3>
                {(() => {
                  const annotations = extractAnnotations(result.ast, source.split('\n'));
                  return annotations.length > 0 ? (
                    <div className="space-y-3">
                      {annotations.map((ann, idx) => (
                        <div key={idx} className={`rounded p-3 ${
                          ann.type === 'trailing'
                            ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                        }`}>
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              Line {ann.line}
                              {ann.type === 'trailing' && ann.attachedTo && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400">
                                  (attached to: {ann.attachedTo})
                                </span>
                              )}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              ann.type === 'trailing'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>
                              {ann.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {ann.comment}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No comments found in the source code.
                    </div>
                  );
                })()}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  Comments can be trailing (on the same line as a statement) or standalone (on their own line).
                </p>
              </div>
            )}
              <div className="space-y-4">
                <div className={`rounded-lg border p-4 ${result.units.ok ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'}`}>
                  <div className={`text-lg font-semibold ${result.units.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {result.units.ok ? '✓ All units consistent' : '✗ Unit errors found'}
                  </div>
                </div>
                
                {result.units.errors && result.units.errors.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Detailed Errors:
                    </h3>
                    {result.units.errors.map((err, idx) => {
                      const lineNum = err.line ?? 0;
                      const lineText = lineNum > 0 ? source.split('\n')[lineNum - 1] || '' : '';
                      
                      // Extract dimension information from the message
                      // Message format: "Unit mismatch: expression has dimension X, but expected Y"
                      const dimensionMatch = err.message.match(/expression has dimension ([^,]+), but expected (.+)$/);
                      const actualDim = dimensionMatch?.[1] || 'unknown';
                      const expectedDim = dimensionMatch?.[2] || 'unknown';
                      
                      return (
                        <div key={idx} className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="text-sm font-medium text-red-700 dark:text-red-400">
                                Line {lineNum}
                              </div>
                              <div className="text-xs font-mono text-gray-500 dark:text-gray-500">
                                {err.code}
                              </div>
                            </div>
                            
                            {lineText && (
                              <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                <div className="text-gray-700 dark:text-gray-300">{lineText}</div>
                                {err.column && (
                                  <div className="text-red-600 dark:text-red-400">
                                    {' '.repeat(Math.max(0, err.column - 1))}^
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {err.code === 'UNIT_MISMATCH' && dimensionMatch ? (
                              <div className="space-y-1 text-sm">
                                <div className="text-red-700 dark:text-red-300 font-medium">
                                  Unit Mismatch:
                                </div>
                                <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-gray-700 dark:text-gray-300">
                                  <span className="font-semibold">Actual:</span>
                                  <span className="font-mono">{actualDim}</span>
                                  <span className="font-semibold">Expected:</span>
                                  <span className="font-mono">{expectedDim}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-red-700 dark:text-red-300">
                                {err.message}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'units' && result.units && (
          </div>
        )}

        {/* Balanced parentheses demo section */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Demonstration: Balanced Parentheses
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              The language of balanced parentheses is context-free (Type 2) but not regular (Type 3).
            </p>
            <Link
              href="/pumping"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Test with pumping lemma
            </Link>
          </div>

          {/* Reserved Identifiers Info */}
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Reserved Identifiers
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              The following identifiers are reserved unit symbols and cannot be used as variable names:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-mono">
              <div className="space-y-1">
                <div className="font-semibold text-gray-700 dark:text-gray-300">Base Units:</div>
                <div className="text-gray-600 dark:text-gray-400">m, meter, metre, kg, kilogram, s, second, A, ampere, amp, K, kelvin, mol, mole, cd, candela</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-gray-700 dark:text-gray-300">Derived Units:</div>
                <div className="text-gray-600 dark:text-gray-400">Hz, hertz, N, newton, Pa, pascal, J, joule, W, watt, C, coulomb, V, volt, ohm, Ω, S, siemens, F, farad</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-gray-700 dark:text-gray-300">Prefixed Units:</div>
                <div className="text-gray-600 dark:text-gray-400">pico (p-), nano (n-), micro (u-), milli (m-), kilo (k-), mega (M-) combined with: m, s, A, V, F, Hz, ohm</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Examples: mV, ms, nA, uF, kohm, Mohm</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-gray-700 dark:text-gray-300">Alternative Names:</div>
                <div className="text-gray-600 dark:text-gray-400">Use variable names like: current, voltage, resistance, time_constant, etc.</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              <strong>Tip:</strong> If you see a <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">RESERVED_NAME</code> error, 
              choose a different variable name that describes the physical quantity instead.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
