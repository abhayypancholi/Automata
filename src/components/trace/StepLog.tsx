'use client';

import { useState } from 'react';
import type { TraceStep } from '@/engine/trace';
import { StepView } from './StepView';

interface StepLogProps {
  steps: TraceStep[];
  currentStep: number;
}

export function StepLog({ steps, currentStep }: StepLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <details
      open={isExpanded}
      onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-750 select-none">
        Show steps ({steps.length})
      </summary>
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
        {/* Current step info */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {step?.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {step?.explanation}
          </p>
        </div>

        {/* Step-specific visualization */}
        {step && <StepView step={step} />}
      </div>
    </details>
  );
}
