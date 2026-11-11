'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { AutomatonEditor } from '@/components/editor/AutomatonEditor';
import { useAutomatonStore } from '@/lib/store';
import { LoadingView } from '@/components/LoadingView';

type InputKind = 'automaton' | 'grammar' | 'named';

export default function LanguagePage() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const [inputKind, setInputKind] = useState<InputKind>('automaton');
  const [grammarText, setGrammarText] = useState('');
  const [result, setResult] = useState<{ class: string; certainty: string; reasons: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIdentify = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body =
        inputKind === 'automaton'
          ? { kind: 'automaton', automaton }
          : inputKind === 'grammar'
          ? { kind: 'grammar', grammar: grammarText }
          : { kind: 'named', languageId: 'a_n_b_n' };

      const response = await fetch('/api/identify-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Identification failed');
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Language Classification
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Identify the Chomsky hierarchy class of formal languages from automata or grammars.
          </p>
        </div>

        {/* Input type tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setInputKind('automaton')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                inputKind === 'automaton'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Automaton
            </button>
            <button
              onClick={() => setInputKind('grammar')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                inputKind === 'grammar'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Grammar
            </button>
            <button
              onClick={() => setInputKind('named')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                inputKind === 'named'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Named Languages
            </button>
          </nav>
        </div>

        {inputKind === 'automaton' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Input Automaton
            </h2>
            <AutomatonEditor />
          </div>
        )}

        {inputKind === 'grammar' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grammar (one production per line):
            </label>
            <textarea
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              placeholder="S -> a S b | ε"
              rows={8}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-sm"
            />
          </div>
        )}

        {inputKind === 'named' && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Named language selection (e.g., a<sup>n</sup>b<sup>n</sup>, palindromes) coming soon
            </p>
          </div>
        )}

        <button
          onClick={handleIdentify}
          disabled={loading || (inputKind === 'automaton' && !automaton)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium"
        >
          {loading ? 'Classifying...' : 'Identify Language Class'}
        </button>

        {loading && <LoadingView />}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Classification:
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {result.class}
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Certainty: {result.certainty}
              </div>
            </div>

            {result.reasons.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Reasons:
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {result.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-500 italic">
              Note: This is an upper bound classification based on the input form
            </div>

            {result.class !== 'Regular (Type 3)' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/pumping"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  → Use Pumping Lemma to prove non-regularity
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
