import type { TraceStep } from '@/engine/trace';

interface SubsetStepData {
  kind: 'subset';
  phase?: 'initial' | 'transition' | 'complete';
  subset?: string[];
  symbol?: string;
  moveResult?: string[];
  closureResult?: string[];
  target?: string;
  isNew?: boolean;
  table?: Array<{
    subset: string;
    states: string[];
    accepting: boolean;
  }>;
}

export type { SubsetStepData };

interface StepViewSubsetProps {
  step: TraceStep<SubsetStepData>;
}

export function StepViewSubset({ step }: StepViewSubsetProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {/* Phase-specific rendering */}
      {data.phase === 'initial' && data.closureResult && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Initial closure:
          </div>
          <div className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
            {'{'}{data.closureResult.join(', ')}{'}'} 
          </div>
        </div>
      )}

      {data.phase === 'transition' && (
        <div className="space-y-2">
          {data.subset && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                From subset:
              </span>
              <span className="ml-2 font-mono text-sm text-gray-900 dark:text-gray-100">
                {'{'}{data.subset.join(',')}{'}'}
              </span>
            </div>
          )}

          {data.symbol && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                On symbol:
              </span>
              <span className="ml-2 font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                {data.symbol}
              </span>
            </div>
          )}

          {data.moveResult && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Move result:
              </span>
              <span className="ml-2 font-mono text-sm text-gray-900 dark:text-gray-100">
                {'{'}{data.moveResult.join(',')}{'}'}
              </span>
            </div>
          )}

          {data.closureResult && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                After ε-closure:
              </span>
              <span className="ml-2 font-mono text-sm text-gray-900 dark:text-gray-100">
                {'{'}{data.closureResult.join(',')}{'}'}
              </span>
            </div>
          )}

          {data.target && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Target state:
              </span>
              <span className="ml-2 font-mono text-sm text-gray-900 dark:text-gray-100">
                {data.target}
              </span>
              {data.isNew && (
                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  New
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table display */}
      {data.table && data.table.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subset construction table:
          </div>
          <div className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    DFA State
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    NFA States
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Accepting
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.table.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100">
                      {row.subset}
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100">
                      {'{'}{row.states.join(',')}{'}'}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                      {row.accepting ? '✓' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
