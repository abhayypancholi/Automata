import type { TraceStep } from '@/engine/trace';

interface MinimizeStepData {
  kind: 'minimize';
  phase?: 'complete' | 'remove-unreachable' | 'refine';
  iteration?: number;
  partition?: string[][];
  splits?: Array<{
    block: string[];
    into: string[][];
    witness?: {
      p: string;
      q: string;
      symbol: string;
      pBlock: number;
      qBlock: number;
    };
  }>;
  removedStates?: string[];
  addedTransitions?: Array<{ from: string; symbol: string; to: string }>;
}

export type { MinimizeStepData };

interface StepViewMinimizeProps {
  step: TraceStep<MinimizeStepData>;
}

export function StepViewMinimize({ step }: StepViewMinimizeProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {/* Completion phase */}
      {data.phase === 'complete' && data.addedTransitions && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Added transitions to complete DFA:
          </div>
          <div className="space-y-1">
            {data.addedTransitions.map((t, idx) => (
              <div key={idx} className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {t.from} —{t.symbol}→ {t.to}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove unreachable phase */}
      {data.phase === 'remove-unreachable' && data.removedStates && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Removed unreachable states:
          </div>
          <div className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
            {data.removedStates.join(', ')}
          </div>
        </div>
      )}

      {/* Refinement iteration */}
      {data.phase === 'refine' && data.partition && (
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Iteration {data.iteration}
            </div>
            <div className="mt-2 space-y-1">
              {data.partition.map((block, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Block {idx}:
                  </span>
                  <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                    {'{'}{block.join(', ')}{'}'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Splits in this iteration */}
          {data.splits && data.splits.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Splits:
              </div>
              <div className="space-y-2">
                {data.splits.map((split, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-2"
                  >
                    <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {'{'}{split.block.join(', ')}{'}'} splits into:
                    </div>
                    <div className="mt-1 ml-4 space-y-1">
                      {split.into.map((subblock, subIdx) => (
                        <div key={subIdx} className="text-sm font-mono text-gray-900 dark:text-gray-100">
                          {'{'}{subblock.join(', ')}{'}'}
                        </div>
                      ))}
                    </div>
                    {split.witness && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Witness: {split.witness.p} and {split.witness.q} differ on symbol{' '}
                        <span className="font-mono">{split.witness.symbol}</span> (go to blocks{' '}
                        {split.witness.pBlock} and {split.witness.qBlock})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
