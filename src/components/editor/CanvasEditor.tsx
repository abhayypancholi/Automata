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
  const [showGuide, setShowGuide] = useState(false);
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
      {/* Usage Guide */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg transition-colors"
        >
          <span className="font-medium text-gray-900 dark:text-gray-100">
            📖 Canvas Usage Guide
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${showGuide ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showGuide && (
          <div className="px-4 pb-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">🖱️ Navigation</h4>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Pan:</strong> Click and drag on empty space</li>
                <li>• <strong>Zoom:</strong> Scroll wheel or use +/- controls</li>
                <li>• <strong>Fit View:</strong> Click the fit icon in bottom-right controls</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">🎯 Node Operations</h4>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Select:</strong> Click on a state node</li>
                <li>• <strong>Move:</strong> Drag selected node to reposition</li>
                <li>• <strong>Set Start:</strong> Select node → click "Set as Start" button</li>
                <li>• <strong>Toggle Accepting:</strong> Select node → click "Toggle Accepting"</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">🔗 Edge Drawing</h4>
              <ul className="space-y-1 ml-4">
                <li>• Edges are drawn with <strong>smooth Bezier curves</strong></li>
                <li>• <strong>Self-loops</strong> appear as circular arcs above the node</li>
                <li>• <strong>Multiple edges</strong> between nodes are automatically offset</li>
                <li>• Edge labels show transition symbols with clean backgrounds</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">💡 Tips</h4>
              <ul className="space-y-1 ml-4">
                <li>• Use the <strong>Table view</strong> to add/remove states and transitions</li>
                <li>• Canvas auto-arranges nodes in a grid by default</li>
                <li>• Drag nodes to create your preferred layout</li>
                <li>• The minimap (bottom-left) shows full graph overview</li>
              </ul>
            </div>
          </div>
        )}
      </div>

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
          type: 'smoothstep',
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
