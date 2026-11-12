'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { AutomatonEditor } from '@/components/editor/AutomatonEditor';
import { useAutomatonStore } from '@/lib/store';
import { LoadingView } from '@/components/LoadingView';

type InputKind = 'automaton' | 'grammar' | 'named';

interface LanguageResult {
  class: string;
  certainty: string;
  reasons: string[];
  isFinite?: boolean | null;
  finiteness?: string;
}

/** Named language entries for the picker */
const NAMED_LANGUAGES = [
  { id: 'anbn',          display: 'aⁿbⁿ',                  description: 'Strings with equal numbers of a and b (all as before bs)', class: 'Type 2' },
  { id: 'anbncn',        display: 'aⁿbⁿcⁿ',                description: 'Strings with equal numbers of a, b, and c in order',      class: 'Type 1' },
  { id: 'wwR',           display: 'wwᴿ',                    description: 'Even-length palindromes (string followed by its reverse)', class: 'Type 2' },
  { id: 'ww',            display: 'ww',                     description: 'Strings consisting of two identical halves',              class: 'Type 1' },
  { id: 'palindromes',   display: 'Palindromes',            description: 'Strings that read the same forwards and backwards',      class: 'Type 2' },
  { id: 'a*b*',          display: 'a*b*',                   description: 'Any number of as followed by any number of bs',          class: 'Type 3' },
  { id: 'equal-ab',      display: 'Equal a and b',          description: 'Strings with equal numbers of a and b (any order)',      class: 'Type 2' },
  { id: 'even-a',        display: 'Even number of a',       description: 'Strings over {a,b} with an even number of as',          class: 'Type 3' },
  { id: 'binary-div-3',  display: 'Binary divisible by 3',  description: 'Binary strings whose value is divisible by 3',          class: 'Type 3' },
  { id: 'anBm-n-leq-m',  display: 'aⁿbᵐ (n ≤ m)',          description: 'Strings with as followed by bs, count of as ≤ count of bs', class: 'Type 2' },
  { id: 'a-prime-power', display: 'aᵖ (p prime)',           description: 'Strings of as where the length is prime',               class: 'Type 0' },
];

const CLASS_COLOR: Record<string, string> = {
  'Type 3': 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
  'Type 2': 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
  'Type 1': 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
  'Type 0': 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
};

const CLASS_LABEL: Record<string, string> = {
  'Type 3': 'Regular',
  'Type 2': 'Context-free',
  'Type 1': 'Context-sensitive',
  'Type 0': 'Unrestricted',
};

export default function LanguagePage() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const [inputKind, setInputKind] = useState<InputKind>('automaton');
  const [grammarText, setGrammarText] = useState('');
  const [selectedNamedId, setSelectedNamedId] = useState<string>(NAMED_LANGUAGES[0]!.id);
  const [result, setResult] = useState<LanguageResult | null>(null);
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
          : { kind: 'named', languageId: selectedNamedId };

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

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const selectedNamed = NAMED_LANGUAGES.find(l => l.id === selectedNamedId);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Language Classification
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Identify the Chomsky hierarchy class of formal languages from automata, grammars, or named languages.
          </p>
        </div>

        {/* Input type tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['automaton', 'grammar', 'named'] as InputKind[]).map((kind) => (
              <button
                key={kind}
                onClick={() => setInputKind(kind)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  inputKind === kind
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {kind === 'automaton' ? 'Automaton' : kind === 'grammar' ? 'Grammar' : 'Named Languages'}
              </button>
            ))}
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
              Grammar productions (one per line):
            </label>
            <textarea
              value={grammarText}
              onChange={(e) => setGrammarText(e.target.value)}
              placeholder={'S -> aSb | ab\nS -> eps'}
              rows={8}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Uppercase letters are nonterminals. Compact notation like <code>aSb</code> or spaced <code>a S b</code> both work.
              Use <code>eps</code> or <code>ε</code> for epsilon. Alternatives on the same line: <code>A -&gt; B | C</code>.
            </p>
          </div>
        )}

        {inputKind === 'named' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select a named language:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NAMED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedNamedId(lang.id)}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      selectedNamedId === lang.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {lang.display}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${CLASS_COLOR[lang.class] ?? ''}`}>
                        {lang.class}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lang.description}</p>
                  </button>
                ))}
              </div>
            </div>
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
            {/* Main classification badge */}
            <div className={`rounded-lg border p-4 ${CLASS_COLOR[result.class] ?? 'border-gray-200'}`}>
              <div className="text-sm font-medium opacity-70">Classification</div>
              <div className="mt-1 text-2xl font-bold">
                {result.class}
                {CLASS_LABEL[result.class] && (
                  <span className="ml-2 text-lg font-normal opacity-80">
                    — {CLASS_LABEL[result.class]}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm opacity-70">Certainty: {result.certainty}</div>
            </div>

            {/* Finiteness */}
            {result.finiteness && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Language size:
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-semibold">
                  {result.finiteness}
                </div>
              </div>
            )}
            {/* Show finite/infinite from isFinite field */}
            {result.isFinite !== undefined && result.isFinite !== null && !result.finiteness && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Language size:
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-semibold">
                  {result.isFinite ? '✦ Finite' : '∞ Infinite'}
                </div>
              </div>
            )}

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

            {/* Named language extra info */}
            {inputKind === 'named' && selectedNamed && (
              <div className="text-xs text-gray-500 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-700 pt-3">
                This is an exact classification for the named language <strong>{selectedNamed.display}</strong>.
              </div>
            )}

            {inputKind === 'grammar' && (
              <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                Note: This classifies the <strong>grammar form</strong> (an upper bound). A context-free grammar can still generate a regular language.
              </div>
            )}

            {result.class !== 'Type 3' && result.class !== 'Regular (Type 3)' && (
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
