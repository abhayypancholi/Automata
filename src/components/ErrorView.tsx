import type { EngineError } from '@/engine/errors';

interface ErrorViewProps {
  error: EngineError;
}

export function ErrorView({ error }: ErrorViewProps) {
  return (
    <div
      className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            {error.code.replace(/_/g, ' ')}
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error.message}
          </p>
          {error.hint && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Hint: {error.hint}
            </p>
          )}
          {(error.line !== undefined || error.column !== undefined) && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {error.line !== undefined && `Line ${error.line}`}
              {error.line !== undefined && error.column !== undefined && ', '}
              {error.column !== undefined && `Column ${error.column}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
