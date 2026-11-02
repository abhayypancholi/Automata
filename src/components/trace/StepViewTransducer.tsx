import type { TraceStep } from '@/engine/trace';

interface TransducerStepData {
  kind: 'transducer';
  input?: string;
  state?: string;
  output?: string;
  finalOutput?: string;
}

export type { TransducerStepData };

interface StepViewTransducerProps {
  step: TraceStep<TransducerStepData>;
}

export function StepViewTransducer({ step }: StepViewTransducerProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {data.input !== undefined && (
        <div className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">Input bit:</span>
          <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">{data.input}</span>
        </div>
      )}

      {data.state !== undefined && (
        <div className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">State:</span>
          <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">{data.state}</span>
        </div>
      )}

      {data.output !== undefined && (
        <div className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">Output:</span>
          <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">{data.output}</span>
        </div>
      )}

      {data.finalOutput !== undefined && (
        <div className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">Final output:</span>
          <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
            {data.finalOutput}
          </span>
        </div>
      )}
    </div>
  );
}
