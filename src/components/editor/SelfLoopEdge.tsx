'use client';

import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

export function SelfLoopEdge({
  id,
  sourceX,
  sourceY,
  label,
  markerEnd,
  style,
}: EdgeProps) {
  // Create a circular loop above the node
  const radius = 40;
  const centerX = sourceX;
  const centerY = sourceY - radius - 10;
  
  // SVG path for a circle that starts and ends at the top of the node
  // Start at top of node, curve up and around in a loop
  const path = `
    M ${sourceX},${sourceY - 15}
    C ${sourceX - radius},${sourceY - 20}
      ${sourceX - radius},${centerY - radius}
      ${centerX},${centerY - radius}
    C ${sourceX + radius},${centerY - radius}
      ${sourceX + radius},${sourceY - 20}
      ${sourceX},${sourceY - 15}
  `;

  // Label position (top of the loop)
  const labelX = sourceX;
  const labelY = centerY - radius - 5;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="px-2 py-1 text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
            {label}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
