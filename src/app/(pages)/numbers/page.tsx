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
  
  // Validator state
  const [validateBase, setValidateBase] = useState<'binary' | 'octal' | 'hex'>('binary');
  const [validateValue, setValidateValue] = useState('');
  const [validatePrefix, setValidatePrefix] = useState(false);
  const [validateResult, setValidateResult] = useState<any>(null);
  
  // Divisibility state
  const [divisor, setDivisor] = useState('3');
  const [testString, setTestString] = useState('');
  const [divisibilityResult, setDivisibilityResult] = useState<any>(null);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/convert-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromBase, to: toBase, input: inputValue }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Conversion failed');
        return;
      }

      setResult(data.result.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    setValidateResult(null);

    try {
      const response = await fetch('/api/validate-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          value: validateValue, 
          base: validateBase,
          withPrefix: validatePrefix,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Validation failed');
        return;
      }

      setValidateResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDivisibility = async () => {
    setLoading(true);
    setError(null);
    setDivisibilityResult(null);

    try {
      const n = parseInt(divisor, 10);
      if (isNaN(n) || n < 1 || n > 64) {
        setError('Divisor must be between 1 and 64');
        setLoading(false);
        return;
      }
      
      const testStrings = testString ? [testString] : [];

      const response = await fetch('/api/divisibility-dfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n, testStrings }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error?.message || 'Request failed');
        return;
      }

      setDivisibilityResult(data.result);
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

        {/* Validate mode */}
        {mode === 'validate' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base:
                </label>
                <select
                  value={validateBase}
                  onChange={(e) => setValidateBase(e.target.value as 'binary' | 'octal' | 'hex')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                >
                  <option value="binary">Binary</option>
                  <option value="octal">Octal</option>
                  <option value="hex">Hexadecimal</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={validatePrefix}
                    onChange={(e) => setValidatePrefix(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Require prefix (0b, 0o, 0x)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Value to validate:
              </label>
              <input
                type="text"
                value={validateValue}
                onChange={(e) => setValidateValue(e.target.value)}
                placeholder={validatePrefix ? "e.g., 0b1010" : "e.g., 1010"}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono"
              />
            </div>

            <button
              onClick={handleValidate}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium"
            >
              {loading ? 'Validating...' : 'Validate'}
            </button>

            {validateResult && (
              <div className={`rounded-lg border p-4 ${
                validateResult.valid
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'
              }`}>
                <div className={`text-lg font-semibold mb-2 ${
                  validateResult.valid
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {validateResult.valid ? '✓ Valid' : '✗ Invalid'}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  <div>
                    <span className="font-semibold">Regex Pattern:</span>
                    <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded font-mono text-xs">
                      {validateResult.regex}
                    </code>
                  </div>
                  {validateResult.dfa && (
                    <div>
                      <span className="font-semibold">DFA:</span>
                      <span className="ml-2">
                        {validateResult.dfa.states.length} states, 
                        {validateResult.dfa.transitions.length} transitions
                      </span>
                    </div>
                  )}
                  <p className="text-xs pt-2 border-t border-gray-300 dark:border-gray-700">
                    This validator uses a regex compiled to an NFA, then converted to a minimal DFA
                    to recognize valid number formats.
                  </p>
                </div>
              </div>
            )}
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
            
            {/* Interactive DFA Builder */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Build Divisibility DFA
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Divisor (n):
                  </label>
                  <input
                    type="number"
                    value={divisor}
                    onChange={(e) => setDivisor(e.target.value)}
                    min="1"
                    max="64"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test binary string (optional):
                  </label>
                  <input
                    type="text"
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder="e.g., 1010"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono"
                  />
                </div>
              </div>
              
              <button
                onClick={handleDivisibility}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium"
              >
                {loading ? 'Building...' : 'Build DFA'}
              </button>
              
              {divisibilityResult && (
                <div className="mt-6 space-y-4">
                  {/* DFA Info */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      DFA for Divisibility by {divisibilityResult.n}
                    </h4>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <div><span className="font-semibold">States:</span> {divisibilityResult.dfa.states.length} (r0 to r{divisibilityResult.n - 1})</div>
                      <div><span className="font-semibold">Start State:</span> {divisibilityResult.dfa.start}</div>
                      <div><span className="font-semibold">Accept State:</span> {divisibilityResult.dfa.accepting.join(', ')}</div>
                      <div><span className="font-semibold">Alphabet:</span> {divisibilityResult.dfa.alphabet.join(', ')}</div>
                    </div>
                  </div>
                  
                  {/* Transition Table */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Transition Table:
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left">State</th>
                            <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-center">0</th>
                            <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-center">1</th>
                          </tr>
                        </thead>
                        <tbody>
                          {divisibilityResult.dfa.states.map((state: string) => {
                            const trans0 = divisibilityResult.dfa.transitions.find(
                              (t: any) => t.from === state && t.symbol === '0'
                            );
                            const trans1 = divisibilityResult.dfa.transitions.find(
                              (t: any) => t.from === state && t.symbol === '1'
                            );
                            const isAccepting = divisibilityResult.dfa.accepting.includes(state);
                            
                            return (
                              <tr key={state} className={isAccepting ? 'bg-green-50 dark:bg-green-950' : ''}>
                                <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 font-mono">
                                  {state} {isAccepting && '(accept)'}
                                </td>
                                <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-center font-mono">
                                  {trans0?.to || '-'}
                                </td>
                                <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-center font-mono">
                                  {trans1?.to || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Test Results */}
                  {divisibilityResult.results && divisibilityResult.results.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Test Results:
                      </h4>
                      {divisibilityResult.results.map((res: any, idx: number) => (
                        <div key={idx} className={`rounded-lg border p-3 ${
                          res.divisible
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                        }`}>
                          <div className="font-mono text-sm mb-1">
                            Binary: <span className="font-bold">{res.string}</span>
                          </div>
                          <div className="text-sm">
                            Decimal value: {parseInt(res.string, 2)}
                          </div>
                          <div className="text-sm">
                            Remainder: {res.remainder}
                          </div>
                          <div className={`text-sm font-semibold mt-1 ${
                            res.divisible
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {res.divisible 
                              ? `✓ Divisible by ${divisibilityResult.n}` 
                              : `✗ Not divisible by ${divisibilityResult.n}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
          </div>
        )}
        
        {loading && <LoadingView />}

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
