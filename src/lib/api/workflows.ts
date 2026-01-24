/**
 * Visual Workflows API Service
 *
 * Establishes type-safe API integration for visual workflow CRUD operations.
 * Provides comprehensive workflow management with pagination, filtering, and real-time updates.
 *
 * Best for: Enterprise workflow applications requiring robust lifecycle management
 * with multi-tenant isolation and optimistic UI updates.
 *
 * @example
 * ```tsx
 * // List workflows with filtering
 * const workflows = await listWorkflows({
 *   is_active: true,
 *   tags: ['production'],
 *   page: 1,
 *   page_size: 20
 * });
 *
 * // Create new workflow
 * const newWorkflow = await createWorkflow({
 *   name: 'My Workflow',
 *   description: 'Automated deployment pipeline',
 *   nodes: [...],
 *   edges: [...],
 *   canvas_settings: { zoom: 1.0, viewport: { x: 0, y: 0 } }
 * });
 * ```
 */

import { apiClient } from './client';
import type {
  VisualWorkflow,
  VisualWorkflowDefinition,
  VisualWorkflowListResponse,
  VisualWorkflowUpdate,
} from '@/types/workflow';

/**
 * Parameters for listing workflows with filtering and pagination
 */
export interface WorkflowListParams {
  /** Filter by active status */
  is_active?: boolean;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Search in name and description */
  search?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page (max: 100) */
  page_size?: number;
}

/**
 * List visual workflows with filtering and pagination
 *
 * Retrieves workflows from backend with support for active status filtering,
 * tag-based search, and full-text search across workflow names and descriptions.
 *
 * Results are paginated with configurable page size (default: 20, max: 100).
 * Workflows are ordered by last update time (most recent first).
 *
 * @param params - Filtering and pagination parameters
 * @returns Promise resolving to paginated workflow list
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * // Get active production workflows
 * const { workflows, total, has_more } = await listWorkflows({
 *   is_active: true,
 *   tags: ['production', 'deployment'],
 *   page: 1,
 *   page_size: 20
 * });
 *
 * // Search workflows by name
 * const results = await listWorkflows({
 *   search: 'deployment',
 *   page: 1
 * });
 * ```
 */
export async function listWorkflows(
  params: WorkflowListParams = {}
): Promise<VisualWorkflowListResponse> {
  const queryParams = new URLSearchParams();

  // Add active status filter
  if (params.is_active !== undefined) {
    queryParams.append('is_active', String(params.is_active));
  }

  // Add tags filter (multiple values)
  if (params.tags && params.tags.length > 0) {
    params.tags.forEach((tag) => queryParams.append('tags', tag));
  }

  // Add search query
  if (params.search) {
    queryParams.append('search', params.search);
  }

  // Add pagination
  if (params.page !== undefined) {
    queryParams.append('page', String(params.page));
  }
  if (params.page_size !== undefined) {
    queryParams.append('page_size', String(params.page_size));
  }

  // Build endpoint with query string
  const query = queryParams.toString();
  const endpoint = query ? `/v1/workflows/visual?${query}` : '/v1/workflows/visual';

  return apiClient.get<VisualWorkflowListResponse>(endpoint);
}

/**
 * Get a specific visual workflow by ID
 *
 * Retrieves complete workflow definition including all nodes, edges,
 * canvas settings, and metadata.
 *
 * @param workflowId - Workflow UUID
 * @returns Promise resolving to workflow details
 * @throws ApiError with status 404 if workflow not found
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * const workflow = await getWorkflow('550e8400-e29b-41d4-a716-446655440000');
 * console.log(workflow.name, workflow.nodes.length);
 * ```
 */
export async function getWorkflow(workflowId: string): Promise<VisualWorkflow> {
  return apiClient.get<VisualWorkflow>(`/v1/workflows/visual/${workflowId}`);
}

/**
 * Create a new visual workflow
 *
 * Creates workflow with nodes, edges, and canvas configuration.
 * Automatically validates:
 * - Node ID uniqueness
 * - Edge source/target references
 * - Circular dependency detection
 *
 * @param data - Workflow definition (name, nodes, edges, canvas settings)
 * @returns Promise resolving to created workflow with generated ID
 * @throws ApiError with status 400 if validation fails
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * const workflow = await createWorkflow({
 *   name: 'Development Pipeline',
 *   description: 'Automated CI/CD workflow',
 *   nodes: [
 *     {
 *       id: 'start',
 *       type: 'trigger.manual',
 *       position: { x: 100, y: 100 },
 *       data: { label: 'Start Deployment' }
 *     }
 *   ],
 *   edges: [],
 *   canvas_settings: {
 *     zoom: 1.0,
 *     viewport: { x: 0, y: 0 },
 *     snapToGrid: true,
 *     gridSize: 15
 *   },
 *   tags: ['deployment', 'production']
 * });
 * ```
 */
export async function createWorkflow(
  data: VisualWorkflowDefinition
): Promise<VisualWorkflow> {
  return apiClient.post<VisualWorkflow>('/v1/workflows/visual', data);
}

/**
 * Update an existing visual workflow
 *
 * Supports partial updates - only provided fields are modified.
 * Automatically increments version number on successful update.
 *
 * When updating nodes or edges, the entire array must be provided
 * (not incremental changes). This ensures consistency validation.
 *
 * @param workflowId - Workflow UUID
 * @param data - Partial workflow update data
 * @returns Promise resolving to updated workflow
 * @throws ApiError with status 404 if workflow not found
 * @throws ApiError with status 400 if validation fails
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * // Update workflow name and description
 * const updated = await updateWorkflow(workflowId, {
 *   name: 'Updated Pipeline Name',
 *   description: 'New description'
 * });
 *
 * // Update workflow nodes and edges
 * const updated = await updateWorkflow(workflowId, {
 *   nodes: [...updatedNodes],
 *   edges: [...updatedEdges]
 * });
 *
 * // Update canvas settings
 * const updated = await updateWorkflow(workflowId, {
 *   canvas_settings: {
 *     zoom: 1.5,
 *     viewport: { x: 100, y: 50 }
 *   }
 * });
 * ```
 */
export async function updateWorkflow(
  workflowId: string,
  data: VisualWorkflowUpdate
): Promise<VisualWorkflow> {
  return apiClient.put<VisualWorkflow>(`/v1/workflows/visual/${workflowId}`, data);
}

/**
 * Delete a visual workflow (soft delete)
 *
 * Implements soft delete by setting is_active=False.
 * Workflow data is preserved for audit purposes and can be restored
 * by updating is_active back to True.
 *
 * @param workflowId - Workflow UUID
 * @returns Promise resolving when deletion completes
 * @throws ApiError with status 404 if workflow not found
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * await deleteWorkflow('550e8400-e29b-41d4-a716-446655440000');
 *
 * // Restore deleted workflow
 * await updateWorkflow(workflowId, { is_active: true });
 * ```
 */
export async function deleteWorkflow(workflowId: string): Promise<void> {
  await apiClient.delete<void>(`/v1/workflows/visual/${workflowId}`);
}

/**
 * Duplicate an existing workflow
 *
 * Creates a copy of workflow with new ID and appended " (Copy)" to name.
 * All nodes and edges are duplicated with new IDs to prevent conflicts.
 *
 * @param workflowId - Source workflow UUID
 * @param newName - Optional name for duplicated workflow
 * @returns Promise resolving to new workflow
 *
 * @example
 * ```tsx
 * const copy = await duplicateWorkflow(
 *   originalId,
 *   'Production Pipeline - Copy'
 * );
 * ```
 */
export async function duplicateWorkflow(
  workflowId: string,
  newName?: string
): Promise<VisualWorkflow> {
  // Fetch original workflow
  const original = await getWorkflow(workflowId);

  // Generate new IDs for nodes and edges
  const nodeIdMap = new Map<string, string>();
  const newNodes = original.nodes.map((node) => {
    const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    nodeIdMap.set(node.id, newId);
    return { ...node, id: newId };
  });

  const newEdges = original.edges.map((edge, index) => ({
    ...edge,
    id: `edge-${Date.now()}-${index}`,
    source: nodeIdMap.get(edge.source) || edge.source,
    target: nodeIdMap.get(edge.target) || edge.target,
  }));

  // Create duplicated workflow
  return createWorkflow({
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    nodes: newNodes,
    edges: newEdges,
    canvas_settings: original.canvas_settings,
    tags: original.tags,
  });
}
