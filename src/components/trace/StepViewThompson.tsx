import type { TraceStep } from '@/engine/trace';
import type { Automaton } from '@/engine/automaton/types';

interface ThompsonStepData {
  kind: 'thompson';
  node?: unknown; // Regex AST node
  fragment?: Automaton;
  description?: string;
}

export type { ThompsonStepData };

interface StepViewThompsonProps {
  step: TraceStep<ThompsonStepData>;
}

export function StepViewThompson({ step }: StepViewThompsonProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {data.description && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {data.description}
        </div>
      )}

      {data.fragment && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fragment automaton:
          </div>
          <div className="rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-600 dark:text-gray-400">States:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                {data.fragment.states.join(', ')}
              </span>
            </div>

            <div className="text-sm">
              <span className="font-medium text-gray-600 dark:text-gray-400">Start:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                {data.fragment.start}
              </span>
            </div>

            <div className="text-sm">
              <span className="font-medium text-gray-600 dark:text-gray-400">Accepting:</span>
              <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                {data.fragment.accepting.join(', ')}
              </span>
            </div>

            {data.fragment.transitions.length > 0 && (
              <div className="text-sm">
                <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Transitions:
                </div>
                <div className="space-y-1">
                  {data.fragment.transitions.map((t, idx) => (
                    <div key={idx} className="font-mono text-xs text-gray-600 dark:text-gray-400 ml-2">
                      {t.from} —{t.symbol}→ {t.to}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {data.node !== undefined && (
        <details className="text-xs text-gray-500 dark:text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            AST node (debug)
          </summary>
          <pre className="mt-2 overflow-auto">
            {JSON.stringify(data.node, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
