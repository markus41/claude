/**
 * WorkflowCanvas Component
 *
 * Establishes comprehensive visual workflow editing canvas powered by React Flow.
 * Integrates with Zustand state management for undo/redo, auto-save functionality,
 * keyboard shortcuts, and accessibility features.
 *
 * Best for: Enterprise workflow applications requiring robust visual editing with
 * performance optimization for 100+ nodes and full accessibility compliance.
 *
 * @example
 * ```tsx
 * <WorkflowCanvas
 *   workflowId="wf-123"
 *   onSave={(nodes, edges) => saveWorkflow({ nodes, edges })}
 *   autoSaveInterval={30000}
 * />
 * ```
 */

import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../../stores/workflowStore';
import { VisualWorkflowNode, VisualWorkflowEdge, NodePosition } from '../../types';
import { NODE_METADATA } from '../../types/nodes';

/**
 * WorkflowCanvas Props Interface
 */
export interface WorkflowCanvasProps {
  /** Workflow ID for persistence */
  workflowId?: string;
  /** Auto-save callback */
  onSave?: (nodes: VisualWorkflowNode[], edges: VisualWorkflowEdge[]) => void | Promise<void>;
  /** Auto-save interval in milliseconds (default: 30000 / 30s) */
  autoSaveInterval?: number;
  /** Whether canvas is in read-only mode */
  readOnly?: boolean;
  /** Custom node types registry */
  nodeTypes?: Record<string, React.ComponentType<any>>;
  /** Custom edge types registry */
  edgeTypes?: Record<string, React.ComponentType<any>>;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Internal WorkflowCanvas implementation (requires ReactFlowProvider)
 */
const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({
  workflowId,
  onSave,
  autoSaveInterval = 30000,
  readOnly = false,
  nodeTypes: customNodeTypes,
  edgeTypes: customEdgeTypes,
  className = '',
}) => {
  const reactFlowInstance = useReactFlow();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<{ nodes: VisualWorkflowNode[]; edges: VisualWorkflowEdge[] } | null>(null);

  // Zustand store selectors
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const canvasSettings = useWorkflowStore((state) => state.canvasSettings);
  const addNode = useWorkflowStore((state) => state.addNode);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const updateNodePosition = useWorkflowStore((state) => state.updateNodePosition);
  const deleteNodes = useWorkflowStore((state) => state.deleteNodes);
  const addEdge = useWorkflowStore((state) => state.addEdge);
  const deleteEdges = useWorkflowStore((state) => state.deleteEdges);
  const selectAll = useWorkflowStore((state) => state.selectAll);
  const clearSelection = useWorkflowStore((state) => state.clearSelection);
  const copy = useWorkflowStore((state) => state.copy);
  const paste = useWorkflowStore((state) => state.paste);
  const cut = useWorkflowStore((state) => state.cut);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const canUndo = useWorkflowStore((state) => state.canUndo);
  const canRedo = useWorkflowStore((state) => state.canRedo);
  const selectedNodes = useWorkflowStore((state) => state.selectedNodes);
  const selectedEdges = useWorkflowStore((state) => state.selectedEdges);
  const updateCanvasSettings = useWorkflowStore((state) => state.updateCanvasSettings);

  /**
   * Auto-save functionality with debouncing
   */
  useEffect(() => {
    if (!onSave || readOnly) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Check if data has changed
    const hasChanged =
      !lastSaveRef.current ||
      JSON.stringify({ nodes, edges }) !== JSON.stringify(lastSaveRef.current);

    if (hasChanged && nodes.length > 0) {
      autoSaveTimerRef.current = setTimeout(() => {
        onSave(nodes, edges);
        lastSaveRef.current = { nodes, edges };
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, onSave, autoSaveInterval, readOnly]);

  /**
   * Handle node changes (position, selection, removal)
   */
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        switch (change.type) {
          case 'position':
            if (change.position && !change.dragging) {
              updateNodePosition(change.id, change.position);
            }
            break;
          case 'remove':
            deleteNodes([change.id]);
            break;
          case 'select':
            // Handled by Zustand store
            break;
        }
      });
    },
    [updateNodePosition, deleteNodes]
  );

  /**
   * Handle edge changes (selection, removal)
   */
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      changes.forEach((change) => {
        switch (change.type) {
          case 'remove':
            deleteEdges([change.id]);
            break;
          case 'select':
            // Handled by Zustand store
            break;
        }
      });
    },
    [deleteEdges]
  );

  /**
   * Handle new connection between nodes
   */
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge: VisualWorkflowEdge = {
        id: `edge-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        type: 'smoothstep',
        animated: false,
        data: {},
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      };

      addEdge(newEdge);
    },
    [addEdge]
  );

  /**
   * Connection validation
   * Prevents cycles and invalid connections
   */
  const isValidConnection = useCallback(
    (connection: Connection) => {
      // Prevent self-connections
      if (connection.source === connection.target) {
        return false;
      }

      // Check for cycles (basic check)
      const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
        const visited = new Set<string>();
        const stack = [targetId];

        while (stack.length > 0) {
          const current = stack.pop()!;
          if (current === sourceId) return true;
          if (visited.has(current)) continue;
          visited.add(current);

          edges
            .filter((e) => e.source === current)
            .forEach((e) => stack.push(e.target));
        }

        return false;
      };

      if (connection.source && connection.target) {
        if (wouldCreateCycle(connection.source, connection.target)) {
          return false;
        }
      }

      return true;
    },
    [edges]
  );

  /**
   * Keyboard shortcuts handler
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if typing in input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      // Undo (Ctrl/Cmd + Z)
      if (modifier && event.key === 'z' && !event.shiftKey && canUndo()) {
        event.preventDefault();
        undo();
      }

      // Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
      if ((modifier && event.key === 'y') || (modifier && event.shiftKey && event.key === 'z')) {
        if (canRedo()) {
          event.preventDefault();
          redo();
        }
      }

      // Select All (Ctrl/Cmd + A)
      if (modifier && event.key === 'a') {
        event.preventDefault();
        selectAll();
      }

      // Copy (Ctrl/Cmd + C)
      if (modifier && event.key === 'c' && selectedNodes.length > 0) {
        event.preventDefault();
        copy();
      }

      // Paste (Ctrl/Cmd + V)
      if (modifier && event.key === 'v') {
        event.preventDefault();
        paste();
      }

      // Cut (Ctrl/Cmd + X)
      if (modifier && event.key === 'x' && selectedNodes.length > 0) {
        event.preventDefault();
        cut();
      }

      // Delete (Delete or Backspace)
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();
          if (selectedNodes.length > 0) deleteNodes(selectedNodes);
          if (selectedEdges.length > 0) deleteEdges(selectedEdges);
        }
      }

      // Escape (Clear selection)
      if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    selectAll,
    copy,
    paste,
    cut,
    clearSelection,
    deleteNodes,
    deleteEdges,
    selectedNodes,
    selectedEdges,
  ]);

  /**
   * Restore viewport from canvas settings
   */
  useEffect(() => {
    if (reactFlowInstance && canvasSettings) {
      reactFlowInstance.setViewport({
        x: canvasSettings.viewport.x,
        y: canvasSettings.viewport.y,
        zoom: canvasSettings.zoom,
      });
    }
  }, [reactFlowInstance, canvasSettings]);

  /**
   * Update canvas settings on viewport change
   */
  const onMoveEnd = useCallback(
    (event: any, viewport: { x: number; y: number; zoom: number }) => {
      updateCanvasSettings({
        viewport: { x: viewport.x, y: viewport.y },
        zoom: viewport.zoom,
      });
    },
    [updateCanvasSettings]
  );

  /**
   * Convert Zustand nodes/edges to React Flow format
   */
  const reactFlowNodes: Node[] = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: node.data,
      })),
    [nodes]
  );

  const reactFlowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        markerEnd: edge.markerEnd || {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      })),
    [edges]
  );

  /**
   * Default node types (can be extended with customNodeTypes)
   */
  const defaultNodeTypes = useMemo(() => ({}), []);
  const nodeTypes = useMemo(
    () => ({ ...defaultNodeTypes, ...customNodeTypes }),
    [defaultNodeTypes, customNodeTypes]
  );

  return (
    <div
      className={`w-full h-full bg-gray-50 dark:bg-gray-900 ${className}`}
      role="application"
      aria-label="Visual workflow canvas"
    >
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        onMoveEnd={onMoveEnd}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={customEdgeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={canvasSettings.snapToGrid}
        snapGrid={[canvasSettings.gridSize || 15, canvasSettings.gridSize || 15]}
        fitView
        attributionPosition="bottom-left"
        deleteKeyCode={null} // Handle delete in keyboard shortcuts
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        panOnDrag={canvasSettings.panOnDrag}
        zoomOnDoubleClick={false}
        elementsSelectable={!readOnly}
        nodesConnectable={!readOnly}
        nodesDraggable={!readOnly}
        nodesFocusable={!readOnly}
        edgesFocusable={!readOnly}
        edgesUpdatable={!readOnly}
      >
        {canvasSettings.showControls && (
          <Controls
            showZoom={true}
            showFitView={true}
            showInteractive={!readOnly}
            position="top-left"
          />
        )}

        <Background
          variant={BackgroundVariant.Dots}
          gap={canvasSettings.gridSize || 15}
          size={1}
          color="#d1d5db"
          className="dark:opacity-30"
        />

        {canvasSettings.showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              const metadata = NODE_METADATA[node.type as keyof typeof NODE_METADATA];
              return metadata?.colors.border || '#6366f1';
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
            position="bottom-right"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          />
        )}
      </ReactFlow>

      {/* Accessibility announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {selectedNodes.length > 0 && `${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''} selected`}
        {selectedEdges.length > 0 && `${selectedEdges.length} connection${selectedEdges.length > 1 ? 's' : ''} selected`}
      </div>
    </div>
  );
};

/**
 * WorkflowCanvas Component (with ReactFlowProvider wrapper)
 *
 * Provides visual workflow editing canvas with auto-save, keyboard shortcuts,
 * accessibility, and performance optimization for large workflows.
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;
