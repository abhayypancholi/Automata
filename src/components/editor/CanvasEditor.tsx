'use client';

import { useCallback, useState } from 'react';
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
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StateNode } from './StateNode';
import { SelfLoopEdge } from './SelfLoopEdge';
import { useAutomatonStore } from '@/lib/store';
import { toFlowGraph, type StateNodeData, type EdgeData } from '@/lib/toFlowGraph';
import { useEffect } from 'react';

const nodeTypes = {
  state: StateNode,
};

const edgeTypes = {
  selfloop: SelfLoopEdge,
};

export function CanvasEditor() {
  const automaton = useAutomatonStore((state) => state.automaton);
  const { setStart, toggleAccepting } = useAutomatonStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
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

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node.id);
  }, []);

  const handleSetStart = () => {
    if (selectedNode) {
      setStart(selectedNode);
    }
  };

  const handleToggleAccepting = () => {
    if (selectedNode) {
      toggleAccepting(selectedNode);
    }
  };

  return (
    <div className="space-y-4">
      {/* Canvas controls */}
      {selectedNode && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Selected: {selectedNode}
            </span>
            <button
              onClick={handleSetStart}
              className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Set as Start
            </button>
            <button
              onClick={handleToggleAccepting}
              className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Toggle Accepting
            </button>
            <button
              onClick={() => setSelectedNode(null)}
              className="ml-auto px-3 py-1 text-sm rounded bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      <div className="h-[600px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          style: { 
            stroke: '#374151',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            width: 20,
            height: 20,
            color: '#374151',
          },
          labelStyle: {
            fill: '#1f2937',
            fontWeight: 600,
            fontSize: 14,
          },
          labelBgStyle: {
            fill: '#ffffff',
            fillOpacity: 0.9,
          },
          labelBgPadding: [8, 4] as [number, number],
          labelBgBorderRadius: 4,
        }}
        className="reactflow-wrapper"
      >
        <Background 
          color="#d1d5db"
          gap={16}
          size={1}
          className="bg-gray-50 dark:bg-gray-900"
        />
        <Controls 
          className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg [&>button]:bg-white [&>button]:dark:bg-gray-800 [&>button]:border-gray-200 [&>button]:dark:border-gray-700 [&>button]:text-gray-700 [&>button]:dark:text-gray-200"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { isAccepting?: boolean; isStart?: boolean };
            if (data.isStart) return '#3b82f6';
            if (data.isAccepting) return '#10b981';
            return '#6b7280';
          }}
          className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
          maskColor="rgba(107, 114, 128, 0.2)"
          pannable
          zoomable
        />
      </ReactFlow>
      </div>
    </div>
  );
}
