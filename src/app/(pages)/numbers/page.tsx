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

        {/* Divisibility mode - simplified */}
        {mode === 'divisibility' && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Divisibility DFA generator coming soon
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
