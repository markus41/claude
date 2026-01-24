/**
 * Simple Workflow Builder - Basic Test Version
 *
 * A minimal version to test if React Flow and basic components work
 */

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';

import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 100 },
    data: { label: 'Start Node' },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 400, y: 200 },
    data: { label: 'Processing Node' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
];

function SimpleFlow() {
  const [nodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export function SimpleWorkflowBuilder() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Visual Flow Builder (Test Mode)
            </h1>
            <p className="text-sm text-gray-500">
              Basic React Flow test - full interface loading...
            </p>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 p-4">
        <ReactFlowProvider>
          <SimpleFlow />
        </ReactFlowProvider>
      </div>
    </div>
  );
}