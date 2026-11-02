'use client';

import { Handle, Position } from '@xyflow/react';
import type { StateNodeData } from '@/lib/toFlowGraph';

interface StateNodeProps {
  data: StateNodeData;
  selected?: boolean;
}

export function StateNode({ data, selected }: StateNodeProps) {
  const { label, isStart, isAccepting } = data;

  return (
    <div className="relative">
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {/* Start arrow marker */}
      {isStart && (
        <div
          className="absolute -left-6 top-1/2 -translate-y-1/2"
          aria-label="Start state"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M0 8 L12 8 M8 4 L12 8 L8 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}

      {/* State circle */}
      <div
        className={`relative flex items-center justify-center rounded-full border-2 ${
          selected
            ? 'border-blue-600 dark:border-blue-400'
            : 'border-gray-900 dark:border-gray-100'
        } bg-white dark:bg-gray-800`}
        style={{
          width: isAccepting ? '54px' : '50px',
          height: isAccepting ? '54px' : '50px',
        }}
      >
        {/* Double ring for accepting */}
        {isAccepting && (
          <div
            className="absolute inset-1 rounded-full border-2 border-gray-900 dark:border-gray-100"
            aria-label="Accepting state"
          />
        )}

        {/* Label */}
        <span className="relative z-10 select-none text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </span>
      </div>
    </div>
  );
}
