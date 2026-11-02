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

  // Track which pairs have opposite edges
  const opposites = new Set<string>();
  for (const group of grouped.values()) {
    const reverseKey = `${group.to}->${group.from}`;
    if (grouped.has(reverseKey) && group.from !== group.to) {
      opposites.add(`${group.from}->${group.to}`);
      opposites.add(reverseKey);
    }
  }

  for (const group of grouped.values()) {
    const key = `${group.from}->${group.to}`;
    const isSelfLoop = group.from === group.to;
    const hasOpposite = opposites.has(key);

    edges.push({
      id: key,
      source: group.from,
      target: group.to,
      label: group.symbols.sort().join(', '),
      type: isSelfLoop ? 'selfloop' : hasOpposite ? 'curved' : 'default',
      data: {
        isSelfLoop,
        hasOpposite,
      },
    });
  }

  return { nodes, edges };
}
