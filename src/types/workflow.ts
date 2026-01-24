/**
 * Visual Workflow Type Definitions
 *
 * Establishes comprehensive type safety for visual workflow orchestration system.
 * Provides React Flow compatible interfaces that integrate with ACCOS API schemas.
 *
 * Best for: TypeScript-first React applications requiring robust type checking
 * for complex workflow management with multi-tenant support.
 */

/**
 * Node category classification for palette organization
 */
export enum NodeCategory {
  TRIGGER = 'trigger',
  PHASE = 'phase',
  AGENT = 'agent',
  CONTROL = 'control',
  ACTION = 'action',
  TERMINATOR = 'terminator',
}

/**
 * Workflow execution lifecycle status
 */
export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

/**
 * Node execution lifecycle status
 */
export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

/**
 * Template sharing visibility level
 */
export enum TemplateVisibility {
  PRIVATE = 'private',
  WORKSPACE = 'workspace',
  ORGANIZATION = 'organization',
  PUBLIC = 'public',
}

/**
 * 2D canvas position for visual workflow nodes
 *
 * Coordinates are relative to canvas origin (0,0) in top-left corner.
 */
export interface NodePosition {
  /** X coordinate on canvas */
  x: number;
  /** Y coordinate on canvas */
  y: number;
}

/**
 * Visual workflow node definition (React Flow compatible)
 *
 * Represents a single node in the visual workflow with position,
 * type, and configuration data.
 */
export interface VisualWorkflowNode {
  /** Unique node identifier within workflow */
  id: string;
  /** Node type (determines behavior and UI) */
  type: string;
  /** Canvas position */
  position: NodePosition;
  /** Node configuration data (type-specific) */
  data: Record<string, unknown>;
  /** Node width in pixels (optional, for layout) */
  width?: number;
  /** Node height in pixels (optional, for layout) */
  height?: number;
  /** Whether node is currently selected */
  selected?: boolean;
  /** Whether node is currently being dragged */
  dragging?: boolean;
}

/**
 * Visual workflow edge (connection between nodes)
 *
 * Defines data flow and execution order between workflow nodes.
 * Compatible with React Flow edge format.
 */
export interface VisualWorkflowEdge {
  /** Unique edge identifier */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Source handle ID (for multi-output nodes) */
  sourceHandle?: string;
  /** Target handle ID (for multi-input nodes) */
  targetHandle?: string;
  /** Edge type (determines visual styling) */
  type?: string;
  /** Edge metadata (conditions, labels, etc.) */
  data?: Record<string, unknown>;
  /** Whether edge should animate during execution */
  animated?: boolean;
  /** Whether edge is currently selected */
  selected?: boolean;
}

/**
 * Canvas configuration and viewport state
 */
export interface CanvasSettings {
  /** Zoom level (0.1 - 4.0) */
  zoom: number;
  /** Viewport position */
  viewport: {
    x: number;
    y: number;
  };
  /** Enable snap-to-grid */
  snapToGrid?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
  /** Show minimap */
  showMinimap?: boolean;
  /** Show controls */
  showControls?: boolean;
  /** Enable panning */
  panOnDrag?: boolean;
}

/**
 * Visual workflow definition (create/update request)
 */
export interface VisualWorkflowDefinition {
  /** Workflow name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Workflow nodes */
  nodes: VisualWorkflowNode[];
  /** Workflow edges */
  edges: VisualWorkflowEdge[];
  /** Canvas configuration and view state */
  canvas_settings: CanvasSettings;
  /** Searchable tags for categorization */
  tags?: string[];
}

/**
 * Complete visual workflow (API response)
 */
export interface VisualWorkflow extends VisualWorkflowDefinition {
  /** Workflow UUID */
  id: string;
  /** Organization UUID */
  organization_id: string;
  /** Workspace UUID */
  workspace_id?: string;
  /** Version number */
  version: number;
  /** Whether workflow is active */
  is_active: boolean;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Creator user ID */
  created_by?: string;
  /** Last updater user ID */
  updated_by?: string;
}

/**
 * Paginated workflow list response
 */
export interface VisualWorkflowListResponse {
  /** Workflow list */
  workflows: VisualWorkflow[];
  /** Total workflow count */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  page_size: number;
  /** Whether more pages available */
  has_more: boolean;
}

/**
 * Workflow update payload (partial)
 */
export interface VisualWorkflowUpdate {
  /** Workflow name */
  name?: string;
  /** Workflow description */
  description?: string;
  /** Complete nodes array (replaces existing) */
  nodes?: VisualWorkflowNode[];
  /** Complete edges array (replaces existing) */
  edges?: VisualWorkflowEdge[];
  /** Canvas configuration updates */
  canvas_settings?: Partial<CanvasSettings>;
  /** Updated tags */
  tags?: string[];
}

/**
 * Node type input/output schema (JSON Schema)
 */
export interface NodeSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, NodeSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Node schema property definition
 */
export interface NodeSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title?: string;
  description?: string;
  enum?: string[] | number[];
  default?: unknown;
  items?: NodeSchemaProperty;
  properties?: Record<string, NodeSchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

/**
 * Node type definition for UI palette and validation
 */
export interface NodeTypeDefinition {
  /** Unique node type identifier */
  type_name: string;
  /** Human-readable display name */
  display_name: string;
  /** Node category */
  category: NodeCategory;
  /** Icon name or URL */
  icon?: string;
  /** Node description */
  description?: string;
  /** JSON Schema for node inputs */
  input_schema?: NodeSchema;
  /** JSON Schema for node outputs */
  output_schema?: NodeSchema;
  /** JSON Schema for node configuration properties */
  properties_schema?: NodeSchema;
  /** Whether node accepts multiple inputs */
  supports_multiple_inputs: boolean;
  /** Whether node produces multiple outputs */
  supports_multiple_outputs: boolean;
  /** Default configuration values */
  default_config: Record<string, unknown>;
}

/**
 * Grouped node types by category for UI palette
 */
export interface NodeTypeCategory {
  /** Category identifier */
  category: NodeCategory;
  /** Human-readable category name */
  display_name: string;
  /** Category description */
  description: string;
  /** Node types in this category */
  node_types: NodeTypeDefinition[];
  /** Category icon */
  icon?: string;
  /** Display order in palette */
  order: number;
}

/**
 * Workflow template definition
 */
export interface WorkflowTemplate {
  /** Template UUID */
  id: string;
  /** Organization UUID */
  organization_id: string;
  /** Workspace UUID */
  workspace_id?: string;
  /** Template name */
  name: string;
  /** Template description */
  description?: string;
  /** URL-friendly slug */
  slug: string;
  /** Template category */
  category: string;
  /** Searchable tags */
  tags: string[];
  /** Common use cases */
  use_cases: string[];
  /** Complete workflow definition */
  definition: VisualWorkflowDefinition;
  /** Template sharing visibility */
  visibility: TemplateVisibility;
  /** Preview image URL */
  preview_image_url?: string;
  /** Estimated execution duration in minutes */
  estimated_duration_minutes?: number;
  /** Template version (semver) */
  version: string;
  /** Featured template */
  is_featured: boolean;
  /** Instantiation count */
  usage_count: number;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Creator user ID */
  created_by?: string;
}

/**
 * Paginated template list response
 */
export interface WorkflowTemplateListResponse {
  /** Template list */
  templates: WorkflowTemplate[];
  /** Total template count */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  page_size: number;
  /** Whether more pages available */
  has_more: boolean;
}

/**
 * Workflow execution state
 */
export interface WorkflowExecution {
  /** Execution UUID */
  id: string;
  /** Workflow UUID */
  workflow_id: string;
  /** Execution status */
  status: WorkflowExecutionStatus;
  /** Start timestamp */
  started_at: string;
  /** Completion timestamp */
  completed_at?: string;
  /** Error message if failed */
  error_message?: string;
  /** Current node being executed */
  current_node_id?: string;
  /** Node execution states */
  node_states: Record<string, NodeExecutionState>;
}

/**
 * Node execution state
 */
export interface NodeExecutionState {
  /** Node ID */
  node_id: string;
  /** Execution status */
  status: NodeExecutionStatus;
  /** Start timestamp */
  started_at?: string;
  /** Completion timestamp */
  completed_at?: string;
  /** Error message if failed */
  error_message?: string;
  /** Output data */
  output?: Record<string, unknown>;
  /** Execution logs */
  logs?: string[];
}
