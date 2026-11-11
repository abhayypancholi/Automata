'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { LoadingView } from '@/components/LoadingView';

type ConversionMode = 'convert' | 'validate' | 'divisibility';

export default function NumbersPage() {
  const [mode, setMode] = useState<ConversionMode>('convert');
  const [inputValue, setInputValue] = useState('');
  const [fromBase, setFromBase] = useState<'binary' | 'octal' | 'hex'>('binary');
  const [toBase, setToBase] = useState<'octal' | 'hex'>('octal');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/convert-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromBase, to: toBase, value: inputValue }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Conversion failed');
        return;
      }

      setResult(data.data.output);
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
            Number Systems
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Convert between number bases using transducers and validate number formats.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setMode('convert')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mode === 'convert'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Convert
            </button>
            <button
              onClick={() => setMode('validate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mode === 'validate'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Validate
            </button>
            <button
              onClick={() => setMode('divisibility')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                mode === 'divisibility'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Divisibility
            </button>
          </nav>
        </div>

        {/* Convert mode */}
        {mode === 'convert' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From:
                </label>
                <select
                  value={fromBase}
                  onChange={(e) => setFromBase(e.target.value as 'binary' | 'octal' | 'hex')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                >
                  <option value="binary">Binary</option>
                  <option value="octal">Octal</option>
                  <option value="hex">Hexadecimal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To:
                </label>
                <select
                  value={toBase}
                  onChange={(e) => setToBase(e.target.value as 'octal' | 'hex')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                >
                  <option value="octal">Octal</option>
                  <option value="hex">Hexadecimal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Input value:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g., 1010"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Note: Conversions use LSB-first representation internally
              </p>
            </div>

            <button
              onClick={handleConvert}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium"
            >
              {loading ? 'Converting...' : 'Convert'}
            </button>

            {loading && <LoadingView />}

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {result && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Result:
                </div>
                <div className="font-mono text-lg text-gray-900 dark:text-gray-100">
                  {result}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validate mode - simplified */}
        {mode === 'validate' && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Validator coming soon - validates number format against regex and DFA
            </p>
          </div>
        )}

        {/* Divisibility mode */}
        {mode === 'divisibility' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Divisibility by n (Binary DFA)
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Binary divisibility can be checked with a finite automaton because the remainder operation
                has bounded state. For divisibility by n, the DFA has n states (representing remainders 0 to n-1),
                reads the binary string MSB-first, and accepts if it ends in remainder 0.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded font-mono text-sm">
                <p className="text-gray-600 dark:text-gray-400">Transition function:</p>
                <p className="mt-2 text-gray-900 dark:text-gray-100">
                  δ(remainder, bit) = (2 × remainder + bit) mod n
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Why Decimal Conversion is NOT Finite-State
              </h3>
              <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                <p>
                  <strong>Key insight:</strong> Converting between binary and decimal requires carrying operations
                  that depend on the position (place value) of each digit relative to the entire number.
                </p>
                <p>
                  For example, converting decimal "123" to binary: the value of the digit "1" depends on it being
                  in the hundreds place, which requires knowing there are exactly two more digits after it.
                  A finite automaton cannot count arbitrarily many digits forward or maintain unbounded carries.
                </p>
                <p>
                  <strong>Binary ↔ Octal/Hex works</strong> because each output digit depends only on a fixed-size
                  group of input digits (3 for octal, 4 for hex), independent of the total length.
                </p>
                <p>
                  <strong>Decimal divisibility</strong> (e.g., "is this decimal number divisible by 3?") can be
                  done with a DFA using the digit-sum modulo trick, but that's different from base conversion.
                </p>
                <p className="pt-2 border-t border-blue-300 dark:border-blue-700 italic">
                  This is a well-known result in formal language theory. For the formal proof, see your textbook's
                  section on closure properties of regular languages.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Interactive divisibility DFA builder (for n = 1 to 64) coming in a future update
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
