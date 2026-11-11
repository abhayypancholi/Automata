import type { Automaton } from '@/engine/automaton/types';
import type { Node, Edge } from '@xyflow/react';

export interface StateNodeData extends Record<string, unknown> {
  label: string;
  isStart: boolean;
  isAccepting: boolean;
}

export interface EdgeData extends Record<string, unknown> {
  isSelfLoop: boolean;
  hasOpposite: boolean;
}

export interface FlowGraph {
  nodes: Node<StateNodeData>[];
  edges: Edge<EdgeData>[];
}

// Group transitions by (from, to) pair
interface TransitionGroup {
  from: string;
  to: string;
  symbols: string[];
}

export function toFlowGraph(automaton: Automaton): FlowGraph {
  // Group transitions by (from, to) pair to merge labels
  const grouped = new Map<string, TransitionGroup>();

  for (const t of automaton.transitions) {
    const key = `${t.from}->${t.to}`;
    if (!grouped.has(key)) {
      grouped.set(key, { from: t.from, to: t.to, symbols: [] });
    }
    grouped.get(key)!.symbols.push(t.symbol);
  }

  // Create nodes
  const nodes: Node<StateNodeData>[] = automaton.states.map((state, index) => {
    const position =
      automaton.layout?.[state] ||
      // Default grid layout: 200px apart, 3 columns
      {
        x: (index % 3) * 200,
        y: Math.floor(index / 3) * 150,
      };

    return {
      id: state,
      type: 'state',
      position,
      data: {
        label: state,
        isStart: state === automaton.start,
        isAccepting: automaton.accepting.includes(state),
      },
    };
  });

  // Create edges
  const edges: Edge<EdgeData>[] = [];

  // Track which pairs have opposite edges and count multiple edges
  const opposites = new Set<string>();
  const edgeCounts = new Map<string, number>();
  
  // Count edges between each pair (in both directions)
  for (const group of grouped.values()) {
    const forwardKey = `${group.from}-${group.to}`;
    const reverseKey = `${group.to}-${group.from}`;
    const pairKey = [group.from, group.to].sort().join('-');
    
    if (group.from !== group.to) {
      edgeCounts.set(pairKey, (edgeCounts.get(pairKey) || 0) + 1);
      
      if (grouped.has(reverseKey)) {
        opposites.add(forwardKey);
        opposites.add(reverseKey);
      }
    }
  }

  let edgeIndex = 0;
  for (const group of grouped.values()) {
    const key = `${group.from}->${group.to}`;
    const isSelfLoop = group.from === group.to;
    const hasOpposite = opposites.has(key);
    const pairKey = [group.from, group.to].sort().join('-');
    const multipleEdges = (edgeCounts.get(pairKey) || 0) > 1;

    // Determine edge type
    let edgeType: string = 'default';
    let edgeOptions: Record<string, any> = {};
    
    if (isSelfLoop) {
      edgeType = 'selfloop';
    } else if (multipleEdges && hasOpposite) {
      // Multiple edges between same nodes - use smoothstep with curvature
      edgeType = 'smoothstep';
      // Add curvature based on direction
      const isForward = group.from < group.to;
      edgeOptions.pathOptions = {
        offset: isForward ? 25 : -25,
        borderRadius: 20,
      };
    } else {
      // Single edge - use smoothstep for nice curves
      edgeType = 'smoothstep';
    }

    edges.push({
      id: key,
      source: group.from,
      target: group.to,
      label: group.symbols.sort().join(', '),
      type: edgeType,
      animated: false,
      ...edgeOptions,
      style: {
        strokeWidth: 2,
        stroke: '#374151',
      },
      labelStyle: {
        fill: '#1f2937',
        fontWeight: 600,
        fontSize: 14,
      },
      labelBgStyle: {
        fill: '#ffffff',
        fillOpacity: 0.95,
      },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: 'arrowclosed' as const,
        width: 20,
        height: 20,
        color: '#374151',
      },
      data: {
        isSelfLoop,
        hasOpposite,
      },
    });
    
    edgeIndex++;
  }

  return { nodes, edges };
}
