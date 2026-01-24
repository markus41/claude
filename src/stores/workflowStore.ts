/**
 * Workflow State Management Store
 *
 * Establishes centralized state management for visual workflow operations.
 * Implements undo/redo stack, optimistic updates, and comprehensive CRUD operations.
 *
 * Best for: Complex workflow applications requiring robust state management
 * with history tracking and multi-level undo capabilities.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  VisualWorkflow,
  VisualWorkflowNode,
  VisualWorkflowEdge,
  CanvasSettings,
  NodePosition,
} from '../types';

/**
 * History state for undo/redo functionality
 */
interface HistoryState {
  nodes: VisualWorkflowNode[];
  edges: VisualWorkflowEdge[];
}

/**
 * Workflow store state
 */
interface WorkflowState {
  // Core workflow data
  workflow: VisualWorkflow | null;
  nodes: VisualWorkflowNode[];
  edges: VisualWorkflowEdge[];
  canvasSettings: CanvasSettings;

  // History management
  past: HistoryState[];
  future: HistoryState[];
  maxHistorySize: number;

  // Selection state
  selectedNodes: string[];
  selectedEdges: string[];

  // Clipboard
  clipboard: {
    nodes: VisualWorkflowNode[];
    edges: VisualWorkflowEdge[];
  } | null;

  // Workflow operations
  setWorkflow: (workflow: VisualWorkflow | null) => void;
  updateWorkflowMetadata: (updates: Partial<Pick<VisualWorkflow, 'name' | 'description' | 'tags'>>) => void;

  // Node operations
  addNode: (node: VisualWorkflowNode) => void;
  updateNode: (nodeId: string, updates: Partial<VisualWorkflowNode>) => void;
  updateNodePosition: (nodeId: string, position: NodePosition) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  deleteNodes: (nodeIds: string[]) => void;

  // Edge operations
  addEdge: (edge: VisualWorkflowEdge) => void;
  updateEdge: (edgeId: string, updates: Partial<VisualWorkflowEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  deleteEdges: (edgeIds: string[]) => void;

  // Selection operations
  selectNode: (nodeId: string, multi?: boolean) => void;
  selectEdge: (edgeId: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Clipboard operations
  copy: () => void;
  paste: (position?: NodePosition) => void;
  cut: () => void;

  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Canvas operations
  updateCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  fitView: () => void;

  // Bulk operations
  replaceNodesAndEdges: (nodes: VisualWorkflowNode[], edges: VisualWorkflowEdge[]) => void;

  // Utility operations
  reset: () => void;
  getNode: (nodeId: string) => VisualWorkflowNode | undefined;
  getEdge: (edgeId: string) => VisualWorkflowEdge | undefined;
  getConnectedEdges: (nodeId: string) => VisualWorkflowEdge[];
}

/**
 * Default canvas settings
 */
const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  zoom: 1.0,
  viewport: { x: 0, y: 0 },
  snapToGrid: true,
  gridSize: 15,
  showMinimap: true,
  showControls: true,
  panOnDrag: true,
};

/**
 * Save current state to history
 */
const saveToHistory = (state: WorkflowState): void => {
  const historyState: HistoryState = {
    nodes: state.nodes,
    edges: state.edges,
  };

  state.past.push(historyState);

  // Limit history size
  if (state.past.length > state.maxHistorySize) {
    state.past.shift();
  }

  // Clear future when new action is performed
  state.future = [];
};

/**
 * Generate unique ID for nodes/edges
 */
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create workflow store with immer middleware for immutability
 */
export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        workflow: null,
        nodes: [],
        edges: [],
        canvasSettings: DEFAULT_CANVAS_SETTINGS,
        past: [],
        future: [],
        maxHistorySize: 50,
        selectedNodes: [],
        selectedEdges: [],
        clipboard: null,

        // Workflow operations
        setWorkflow: (workflow) => {
          set((state) => {
            state.workflow = workflow;
            state.nodes = workflow?.nodes || [];
            state.edges = workflow?.edges || [];
            state.canvasSettings = workflow?.canvas_settings || DEFAULT_CANVAS_SETTINGS;
            state.past = [];
            state.future = [];
            state.selectedNodes = [];
            state.selectedEdges = [];
          });
        },

        updateWorkflowMetadata: (updates) => {
          set((state) => {
            if (state.workflow) {
              Object.assign(state.workflow, updates);
            }
          });
        },

        // Node operations
        addNode: (node) => {
          set((state) => {
            saveToHistory(state);
            state.nodes.push(node);
          });
        },

        updateNode: (nodeId, updates) => {
          set((state) => {
            saveToHistory(state);
            const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
            if (nodeIndex !== -1) {
              state.nodes[nodeIndex] = { ...state.nodes[nodeIndex], ...updates };
            }
          });
        },

        updateNodePosition: (nodeId, position) => {
          set((state) => {
            // Don't save to history for position updates (too many events)
            const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
            if (nodeIndex !== -1) {
              state.nodes[nodeIndex].position = position;
            }
          });
        },

        updateNodeData: (nodeId, data) => {
          set((state) => {
            saveToHistory(state);
            const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
            if (nodeIndex !== -1) {
              state.nodes[nodeIndex].data = { ...state.nodes[nodeIndex].data, ...data };
            }
          });
        },

        deleteNode: (nodeId) => {
          set((state) => {
            saveToHistory(state);
            state.nodes = state.nodes.filter((n) => n.id !== nodeId);
            // Remove connected edges
            state.edges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
            // Remove from selection
            state.selectedNodes = state.selectedNodes.filter((id) => id !== nodeId);
          });
        },

        deleteNodes: (nodeIds) => {
          set((state) => {
            saveToHistory(state);
            const nodeIdSet = new Set(nodeIds);
            state.nodes = state.nodes.filter((n) => !nodeIdSet.has(n.id));
            // Remove connected edges
            state.edges = state.edges.filter((e) => !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target));
            // Remove from selection
            state.selectedNodes = state.selectedNodes.filter((id) => !nodeIdSet.has(id));
          });
        },

        // Edge operations
        addEdge: (edge) => {
          set((state) => {
            saveToHistory(state);
            // Check if edge already exists
            const exists = state.edges.some(
              (e) =>
                e.source === edge.source &&
                e.target === edge.target &&
                e.sourceHandle === edge.sourceHandle &&
                e.targetHandle === edge.targetHandle
            );
            if (!exists) {
              state.edges.push(edge);
            }
          });
        },

        updateEdge: (edgeId, updates) => {
          set((state) => {
            saveToHistory(state);
            const edgeIndex = state.edges.findIndex((e) => e.id === edgeId);
            if (edgeIndex !== -1) {
              state.edges[edgeIndex] = { ...state.edges[edgeIndex], ...updates };
            }
          });
        },

        deleteEdge: (edgeId) => {
          set((state) => {
            saveToHistory(state);
            state.edges = state.edges.filter((e) => e.id !== edgeId);
            state.selectedEdges = state.selectedEdges.filter((id) => id !== edgeId);
          });
        },

        deleteEdges: (edgeIds) => {
          set((state) => {
            saveToHistory(state);
            const edgeIdSet = new Set(edgeIds);
            state.edges = state.edges.filter((e) => !edgeIdSet.has(e.id));
            state.selectedEdges = state.selectedEdges.filter((id) => !edgeIdSet.has(id));
          });
        },

        // Selection operations
        selectNode: (nodeId, multi = false) => {
          set((state) => {
            if (multi) {
              if (!state.selectedNodes.includes(nodeId)) {
                state.selectedNodes.push(nodeId);
              }
            } else {
              state.selectedNodes = [nodeId];
              state.selectedEdges = [];
            }
            // Update node selected state
            state.nodes.forEach((node) => {
              node.selected = state.selectedNodes.includes(node.id);
            });
          });
        },

        selectEdge: (edgeId, multi = false) => {
          set((state) => {
            if (multi) {
              if (!state.selectedEdges.includes(edgeId)) {
                state.selectedEdges.push(edgeId);
              }
            } else {
              state.selectedEdges = [edgeId];
              state.selectedNodes = [];
            }
            // Update edge selected state
            state.edges.forEach((edge) => {
              edge.selected = state.selectedEdges.includes(edge.id);
            });
          });
        },

        selectAll: () => {
          set((state) => {
            state.selectedNodes = state.nodes.map((n) => n.id);
            state.selectedEdges = state.edges.map((e) => e.id);
            state.nodes.forEach((node) => {
              node.selected = true;
            });
            state.edges.forEach((edge) => {
              edge.selected = true;
            });
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedNodes = [];
            state.selectedEdges = [];
            state.nodes.forEach((node) => {
              node.selected = false;
            });
            state.edges.forEach((edge) => {
              edge.selected = false;
            });
          });
        },

        // Clipboard operations
        copy: () => {
          const state = get();
          const selectedNodes = state.nodes.filter((n) => state.selectedNodes.includes(n.id));
          const selectedEdges = state.edges.filter(
            (e) => state.selectedNodes.includes(e.source) && state.selectedNodes.includes(e.target)
          );
          set((state) => {
            state.clipboard = { nodes: selectedNodes, edges: selectedEdges };
          });
        },

        paste: (position) => {
          const state = get();
          if (!state.clipboard) return;

          set((state) => {
            saveToHistory(state);

            // Create ID mapping for copied nodes
            const idMap = new Map<string, string>();
            state.clipboard!.nodes.forEach((node) => {
              idMap.set(node.id, generateId('node'));
            });

            // Calculate offset for pasted nodes
            const offset = position
              ? position
              : {
                  x: 50,
                  y: 50,
                };

            // Copy nodes with new IDs and positions
            const newNodes = state.clipboard!.nodes.map((node) => ({
              ...node,
              id: idMap.get(node.id)!,
              position: {
                x: node.position.x + offset.x,
                y: node.position.y + offset.y,
              },
              selected: true,
            }));

            // Copy edges with updated node references
            const newEdges = state.clipboard!.edges.map((edge) => ({
              ...edge,
              id: generateId('edge'),
              source: idMap.get(edge.source) || edge.source,
              target: idMap.get(edge.target) || edge.target,
              selected: true,
            }));

            // Clear previous selection
            state.nodes.forEach((node) => {
              node.selected = false;
            });
            state.edges.forEach((edge) => {
              edge.selected = false;
            });

            // Add new nodes and edges
            state.nodes.push(...newNodes);
            state.edges.push(...newEdges);

            // Update selection
            state.selectedNodes = newNodes.map((n) => n.id);
            state.selectedEdges = newEdges.map((e) => e.id);
          });
        },

        cut: () => {
          const state = get();
          state.copy();
          state.deleteNodes(state.selectedNodes);
        },

        // History operations
        undo: () => {
          set((state) => {
            if (state.past.length === 0) return;

            const previous = state.past.pop()!;
            state.future.push({
              nodes: state.nodes,
              edges: state.edges,
            });

            state.nodes = previous.nodes;
            state.edges = previous.edges;
            state.selectedNodes = [];
            state.selectedEdges = [];
          });
        },

        redo: () => {
          set((state) => {
            if (state.future.length === 0) return;

            const next = state.future.pop()!;
            state.past.push({
              nodes: state.nodes,
              edges: state.edges,
            });

            state.nodes = next.nodes;
            state.edges = next.edges;
            state.selectedNodes = [];
            state.selectedEdges = [];
          });
        },

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,

        clearHistory: () => {
          set((state) => {
            state.past = [];
            state.future = [];
          });
        },

        // Canvas operations
        updateCanvasSettings: (settings) => {
          set((state) => {
            state.canvasSettings = { ...state.canvasSettings, ...settings };
            if (state.workflow) {
              state.workflow.canvas_settings = state.canvasSettings;
            }
          });
        },

        fitView: () => {
          // This will be handled by React Flow's fitView method
          // Just trigger a re-render
          set((state) => {
            state.canvasSettings = { ...state.canvasSettings };
          });
        },

        // Bulk operations
        replaceNodesAndEdges: (nodes, edges) => {
          set((state) => {
            saveToHistory(state);
            state.nodes = nodes;
            state.edges = edges;
            state.selectedNodes = [];
            state.selectedEdges = [];
          });
        },

        // Utility operations
        reset: () => {
          set({
            workflow: null,
            nodes: [],
            edges: [],
            canvasSettings: DEFAULT_CANVAS_SETTINGS,
            past: [],
            future: [],
            selectedNodes: [],
            selectedEdges: [],
            clipboard: null,
          });
        },

        getNode: (nodeId) => {
          return get().nodes.find((n) => n.id === nodeId);
        },

        getEdge: (edgeId) => {
          return get().edges.find((e) => e.id === edgeId);
        },

        getConnectedEdges: (nodeId) => {
          return get().edges.filter((e) => e.source === nodeId || e.target === nodeId);
        },
      }))
    ),
    { name: 'WorkflowStore' }
  )
);

/**
 * Utility hook to generate unique IDs
 */
export const useGenerateId = () => {
  return (prefix: string) => generateId(prefix);
};
