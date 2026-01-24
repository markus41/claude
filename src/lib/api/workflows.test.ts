/**
 * Visual Workflows API Service Tests
 *
 * Comprehensive test suite for workflow CRUD operations with mocked API responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  type WorkflowListParams,
} from './workflows';
import { apiClient } from './client';
import type {
  VisualWorkflow,
  VisualWorkflowDefinition,
  VisualWorkflowListResponse,
} from '@/types/workflow';

// Mock the API client
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Workflows API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listWorkflows', () => {
    it('should fetch workflows without filters', async () => {
      const mockResponse: VisualWorkflowListResponse = {
        workflows: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await listWorkflows();

      expect(apiClient.get).toHaveBeenCalledWith('/v1/workflows/visual');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch workflows with active status filter', async () => {
      const params: WorkflowListParams = { is_active: true };
      const mockResponse: VisualWorkflowListResponse = {
        workflows: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await listWorkflows(params);

      expect(apiClient.get).toHaveBeenCalledWith('/v1/workflows/visual?is_active=true');
    });

    it('should fetch workflows with multiple tags', async () => {
      const params: WorkflowListParams = { tags: ['production', 'deployment'] };

      vi.mocked(apiClient.get).mockResolvedValue({
        workflows: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      await listWorkflows(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/workflows/visual?tags=production&tags=deployment'
      );
    });

    it('should fetch workflows with search and pagination', async () => {
      const params: WorkflowListParams = {
        search: 'deployment',
        page: 2,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        workflows: [],
        total: 0,
        page: 2,
        page_size: 50,
        has_more: false,
      });

      await listWorkflows(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/workflows/visual?search=deployment&page=2&page_size=50'
      );
    });

    it('should fetch workflows with all filters combined', async () => {
      const params: WorkflowListParams = {
        is_active: true,
        tags: ['production'],
        search: 'pipeline',
        page: 1,
        page_size: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        workflows: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      await listWorkflows(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/workflows/visual?is_active=true&tags=production&search=pipeline&page=1&page_size=20'
      );
    });
  });

  describe('getWorkflow', () => {
    it('should fetch workflow by ID', async () => {
      const workflowId = '550e8400-e29b-41d4-a716-446655440000';
      const mockWorkflow: Partial<VisualWorkflow> = {
        id: workflowId,
        name: 'Test Workflow',
        nodes: [],
        edges: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockWorkflow);

      const result = await getWorkflow(workflowId);

      expect(apiClient.get).toHaveBeenCalledWith(`/v1/workflows/visual/${workflowId}`);
      expect(result).toEqual(mockWorkflow);
    });
  });

  describe('createWorkflow', () => {
    it('should create new workflow', async () => {
      const workflowData: VisualWorkflowDefinition = {
        name: 'New Pipeline',
        description: 'Test workflow',
        nodes: [
          {
            id: 'start',
            type: 'trigger.manual',
            position: { x: 100, y: 100 },
            data: { label: 'Start' },
          },
        ],
        edges: [],
        canvas_settings: {
          zoom: 1.0,
          viewport: { x: 0, y: 0 },
          snapToGrid: true,
          gridSize: 15,
        },
        tags: ['test'],
      };

      const mockResponse: Partial<VisualWorkflow> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...workflowData,
        version: 1,
        is_active: true,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await createWorkflow(workflowData);

      expect(apiClient.post).toHaveBeenCalledWith('/v1/workflows/visual', workflowData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow with partial data', async () => {
      const workflowId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const mockResponse: Partial<VisualWorkflow> = {
        id: workflowId,
        ...updateData,
        version: 2,
      };

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await updateWorkflow(workflowId, updateData);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/v1/workflows/visual/${workflowId}`,
        updateData
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update workflow nodes and edges', async () => {
      const workflowId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        nodes: [
          {
            id: 'node1',
            type: 'trigger.manual',
            position: { x: 0, y: 0 },
            data: {},
          },
        ],
        edges: [],
      };

      vi.mocked(apiClient.put).mockResolvedValue({ id: workflowId });

      await updateWorkflow(workflowId, updateData);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/v1/workflows/visual/${workflowId}`,
        updateData
      );
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow by ID', async () => {
      const workflowId = '550e8400-e29b-41d4-a716-446655440000';

      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await deleteWorkflow(workflowId);

      expect(apiClient.delete).toHaveBeenCalledWith(`/v1/workflows/visual/${workflowId}`);
    });
  });

  describe('duplicateWorkflow', () => {
    it('should duplicate workflow with new IDs', async () => {
      const workflowId = '550e8400-e29b-41d4-a716-446655440000';
      const originalWorkflow: Partial<VisualWorkflow> = {
        id: workflowId,
        name: 'Original Workflow',
        description: 'Original description',
        nodes: [
          {
            id: 'node-1',
            type: 'trigger.manual',
            position: { x: 100, y: 100 },
            data: { label: 'Start' },
          },
          {
            id: 'node-2',
            type: 'phase.explore',
            position: { x: 300, y: 100 },
            data: { label: 'Explore' },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
          },
        ],
        canvas_settings: { zoom: 1.0, viewport: { x: 0, y: 0 } },
        tags: ['original'],
      };

      const duplicatedWorkflow: Partial<VisualWorkflow> = {
        id: 'new-workflow-id',
        name: 'Original Workflow (Copy)',
        version: 1,
      };

      // Mock get for original workflow
      vi.mocked(apiClient.get).mockResolvedValue(originalWorkflow);
      // Mock post for creating duplicate
      vi.mocked(apiClient.post).mockResolvedValue(duplicatedWorkflow);

      const result = await duplicateWorkflow(workflowId);

      // Verify original workflow was fetched
      expect(apiClient.get).toHaveBeenCalledWith(`/v1/workflows/visual/${workflowId}`);

      // Verify create was called
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/workflows/visual',
        expect.objectContaining({
          name: 'Original Workflow (Copy)',
          description: 'Original description',
          tags: ['original'],
        })
      );

      // Verify new IDs were generated for nodes and edges
      const createCall = vi.mocked(apiClient.post).mock.calls[0][1] as any;
      expect(createCall.nodes[0].id).not.toBe('node-1');
      expect(createCall.nodes[1].id).not.toBe('node-2');
      expect(createCall.edges[0].id).not.toBe('edge-1');

      // Verify edge references were updated
      expect(createCall.edges[0].source).toBe(createCall.nodes[0].id);
      expect(createCall.edges[0].target).toBe(createCall.nodes[1].id);
    });

    it('should duplicate workflow with custom name', async () => {
      const workflowId = '550e8400-e29b-41d4-a716-446655440000';
      const customName = 'Custom Copy Name';

      vi.mocked(apiClient.get).mockResolvedValue({
        id: workflowId,
        name: 'Original',
        nodes: [],
        edges: [],
        canvas_settings: {},
        tags: [],
      });

      vi.mocked(apiClient.post).mockResolvedValue({ id: 'new-id' });

      await duplicateWorkflow(workflowId, customName);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/workflows/visual',
        expect.objectContaining({
          name: customName,
        })
      );
    });
  });
});
