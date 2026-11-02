import type { TraceStep } from '@/engine/trace';

interface ArdenStepData {
  kind: 'arden';
  phase?: 'eliminate' | 'simplify' | 'complete';
  variable?: string;
  equation?: string;
  substitutedInto?: string[];
  identitiesUsed?: string[];
  equations?: Record<string, string>;
}

export type { ArdenStepData };

interface StepViewArdenProps {
  step: TraceStep<ArdenStepData>;
}

export function StepViewArden({ step }: StepViewArdenProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {/* Current equation being processed */}
      {data.variable && data.equation && (
        <div className="rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
            {data.variable} = {data.equation}
          </div>
        </div>
      )}

      {/* Identities applied */}
      {data.identitiesUsed && data.identitiesUsed.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Identities applied:
          </div>
          <ul className="list-disc list-inside space-y-1">
            {data.identitiesUsed.map((identity, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                {identity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Substitution targets */}
      {data.substitutedInto && data.substitutedInto.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Substituted into: {data.substitutedInto.join(', ')}
          </div>
        </div>
      )}

      {/* All equations */}
      {data.equations && Object.keys(data.equations).length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current equations:
          </div>
          <div className="space-y-1">
            {Object.entries(data.equations).map(([variable, equation]) => (
              <div
                key={variable}
                className="font-mono text-sm text-gray-900 dark:text-gray-100"
              >
                {variable} = {equation}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.phase === 'complete' && (
        <div className="rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
          <div className="text-sm font-medium text-green-800 dark:text-green-200">
            ✓ Elimination complete
          </div>
        </div>
      )}
    </div>
  );
}
