import type { TraceStep } from '@/engine/trace';

interface PumpingStepData {
  kind: 'pumping';
  decomposition?: { x: string; y: string; z: string };
  pumpedString?: string;
  i?: number;
  result?: boolean;
  verdict?: 'pass' | 'fail';
}

export type { PumpingStepData };

interface StepViewPumpingProps {
  step: TraceStep<PumpingStepData>;
}

export function StepViewPumping({ step }: StepViewPumpingProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {data.decomposition && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Decomposition:
          </div>
          <div className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <div>
              x = <span className="text-blue-600 dark:text-blue-400">{data.decomposition.x || 'ε'}</span>
            </div>
            <div>
              y = <span className="text-green-600 dark:text-green-400">{data.decomposition.y}</span>
            </div>
            <div>
              z = <span className="text-purple-600 dark:text-purple-400">{data.decomposition.z || 'ε'}</span>
            </div>
          </div>
        </div>
      )}

      {data.i !== undefined && data.pumpedString !== undefined && (
        <div className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">
            xy<sup>{data.i}</sup>z =
          </span>
          <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
            {data.pumpedString}
          </span>
        </div>
      )}

      {data.result !== undefined && (
        <div className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">In language:</span>
          <span
            className={`ml-2 font-medium ${
              data.result
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {data.result ? 'Yes' : 'No'}
          </span>
        </div>
      )}

      {data.verdict && (
        <div
          className={`mt-3 rounded p-3 text-sm font-medium ${
            data.verdict === 'fail'
              ? 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
          }`}
        >
          {data.verdict === 'fail' ? '✗ Decomposition fails' : '✓ Decomposition passes'}
        </div>
      )}
    </div>
  );
}
