import type { TraceStep } from '@/engine/trace';

interface SimulateStepData {
  kind: 'simulate';
  symbolIndex?: number;
  symbol?: string;
  from: string[];
  to: string[];
  transitionsUsed?: Array<{ from: string; symbol: string; to: string }>;
  stuck?: boolean;
}

export type { SimulateStepData };

interface StepViewSimulateProps {
  step: TraceStep<SimulateStepData>;
}

export function StepViewSimulate({ step }: StepViewSimulateProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {/* Current state(s) */}
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Current state{data.from.length > 1 ? 's' : ''}:
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {data.from.map((state) => (
            <span
              key={state}
              className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              {state}
            </span>
          ))}
        </div>
      </div>

      {/* Symbol being read */}
      {data.symbol !== undefined && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reading symbol:
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center rounded bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
              {data.symbol || 'ε'}
            </span>
          </div>
        </div>
      )}

      {/* Next state(s) */}
      {data.to.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Next state{data.to.length > 1 ? 's' : ''}:
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {data.to.map((state) => (
              <span
                key={state}
                className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-200"
              >
                {state}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stuck indicator */}
      {data.stuck && (
        <div className="rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-2">
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            Stuck (no transition available)
          </span>
        </div>
      )}

      {/* Transitions used */}
      {data.transitionsUsed && data.transitionsUsed.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transitions:
          </div>
          <div className="space-y-1">
            {data.transitionsUsed.map((t, i) => (
              <div
                key={i}
                className="text-sm text-gray-600 dark:text-gray-400 font-mono"
              >
                {t.from} —{t.symbol}→ {t.to}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
