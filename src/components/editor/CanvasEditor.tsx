'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StateNode } from './StateNode';
import { useAutomatonStore } from '@/lib/store';
import { toFlowGraph, type StateNodeData, type EdgeData } from '@/lib/toFlowGraph';
import { useEffect } from 'react';

const nodeTypes = {
  state: StateNode,
};

export function CanvasEditor() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StateNodeData>>(
    []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<EdgeData>>([]);

  // Update flow graph when automaton changes
  useEffect(() => {
    const flowGraph = toFlowGraph(automaton);
    setNodes(flowGraph.nodes);
    setEdges(flowGraph.edges);
  }, [automaton, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      // For now, just update the edges in the UI
      // In a full implementation, this would update the store
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  return (
    <div className="h-[600px] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { isAccepting?: boolean };
            return data.isAccepting ? '#10b981' : '#6b7280';
          }}
        />
      </ReactFlow>
    </div>
  );
}
