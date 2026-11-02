import type { TraceStep } from '@/engine/trace';

interface ParserStepData {
  kind: 'parser';
  phase?: 'tokenize' | 'parse' | 'derive';
  token?: { type: string; text: string; line: number; column: number };
  production?: string;
  derivation?: string;
}

export type { ParserStepData };

interface StepViewParserProps {
  step: TraceStep<ParserStepData>;
}

export function StepViewParser({ step }: StepViewParserProps) {
  const data = step.data;

  return (
    <div className="space-y-3">
      {data.phase === 'tokenize' && data.token && (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-gray-600 dark:text-gray-400">Token type:</span>
            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">{data.token.type}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-600 dark:text-gray-400">Text:</span>
            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
              "{data.token.text}"
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-600 dark:text-gray-400">Position:</span>
            <span className="ml-2 text-gray-900 dark:text-gray-100">
              Line {data.token.line}, Column {data.token.column}
            </span>
          </div>
        </div>
      )}

      {data.production && (
        <div className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">Production:</span>
          <div className="mt-1 font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            {data.production}
          </div>
        </div>
      )}

      {data.derivation && (
        <div className="text-sm">
          <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">Derivation:</div>
          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
            {data.derivation}
          </div>
        </div>
      )}
    </div>
  );
}
