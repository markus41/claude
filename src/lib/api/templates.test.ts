/**
 * Workflow Templates API Service Tests
 *
 * Comprehensive test suite for template operations with mocked API responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listTemplates,
  getTemplate,
  getTemplateBySlug,
  instantiateTemplate,
  getFeaturedTemplates,
  getTemplatesByCategory,
  searchTemplatesByTags,
  type TemplateListParams,
  type TemplateInstantiateParams,
} from './templates';
import { apiClient } from './client';
import type { WorkflowTemplateListResponse, WorkflowTemplate } from '@/types/workflow';

// Mock the API client
vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Templates API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('should fetch templates without filters', async () => {
      const mockResponse: WorkflowTemplateListResponse = {
        templates: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await listTemplates();

      expect(apiClient.get).toHaveBeenCalledWith('/v1/templates/workflows');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch templates with category filter', async () => {
      const params: TemplateListParams = { category: 'Development' };

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      await listTemplates(params);

      expect(apiClient.get).toHaveBeenCalledWith('/v1/templates/workflows?category=Development');
    });

    it('should fetch templates with multiple tags', async () => {
      const params: TemplateListParams = { tags: ['react', 'typescript'] };

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      await listTemplates(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?tags=react&tags=typescript'
      );
    });

    it('should fetch templates with visibility filter', async () => {
      const params: TemplateListParams = { visibility: 'public' };

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      await listTemplates(params);

      expect(apiClient.get).toHaveBeenCalledWith('/v1/templates/workflows?visibility=public');
    });

    it('should fetch featured templates only', async () => {
      const params: TemplateListParams = { featured: true };

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      await listTemplates(params);

      expect(apiClient.get).toHaveBeenCalledWith('/v1/templates/workflows?featured=true');
    });

    it('should fetch templates with all filters combined', async () => {
      const params: TemplateListParams = {
        category: 'Development',
        tags: ['react', 'typescript'],
        search: 'deployment',
        visibility: 'public',
        featured: true,
        page: 2,
        page_size: 50,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 2,
        page_size: 50,
        has_more: false,
      });

      await listTemplates(params);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?category=Development&tags=react&tags=typescript&search=deployment&visibility=public&featured=true&page=2&page_size=50'
      );
    });
  });

  describe('getTemplate', () => {
    it('should fetch template by ID', async () => {
      const templateId = '550e8400-e29b-41d4-a716-446655440000';
      const mockTemplate: Partial<WorkflowTemplate> = {
        id: templateId,
        name: 'Test Template',
        slug: 'test-template',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockTemplate);

      const result = await getTemplate(templateId);

      expect(apiClient.get).toHaveBeenCalledWith(`/v1/templates/workflows/${templateId}`);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('getTemplateBySlug', () => {
    it('should fetch template by slug', async () => {
      const slug = 'fullstack-dev-pipeline';
      const mockTemplate: Partial<WorkflowTemplate> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Full-Stack Dev Pipeline',
        slug,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockTemplate);

      const result = await getTemplateBySlug(slug);

      expect(apiClient.get).toHaveBeenCalledWith(`/v1/templates/workflows/slug/${slug}`);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('instantiateTemplate', () => {
    it('should instantiate template with name only', async () => {
      const templateId = '550e8400-e29b-41d4-a716-446655440000';
      const params: TemplateInstantiateParams = {
        name: 'My Workflow',
      };

      const mockWorkflow = {
        id: 'new-workflow-id',
        name: 'My Workflow',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockWorkflow);

      const result = await instantiateTemplate(templateId, params);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/v1/templates/workflows/${templateId}/instantiate`,
        params
      );
      expect(result).toEqual(mockWorkflow);
    });

    it('should instantiate template with all parameters', async () => {
      const templateId = '550e8400-e29b-41d4-a716-446655440000';
      const params: TemplateInstantiateParams = {
        name: 'Production Pipeline',
        description: 'Custom description',
        tags: ['production', 'deployment'],
      };

      vi.mocked(apiClient.post).mockResolvedValue({ id: 'new-id' });

      await instantiateTemplate(templateId, params);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/v1/templates/workflows/${templateId}/instantiate`,
        params
      );
    });
  });

  describe('getFeaturedTemplates', () => {
    it('should fetch featured templates with default limit', async () => {
      const mockTemplates: Partial<WorkflowTemplate>[] = [
        { id: '1', name: 'Template 1', slug: 'template-1', is_featured: true },
        { id: '2', name: 'Template 2', slug: 'template-2', is_featured: true },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: mockTemplates,
        total: 2,
        page: 1,
        page_size: 10,
        has_more: false,
      });

      const result = await getFeaturedTemplates();

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?featured=true&page=1&page_size=10'
      );
      expect(result).toEqual(mockTemplates);
    });

    it('should fetch featured templates with custom limit', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 1,
        page_size: 5,
        has_more: false,
      });

      await getFeaturedTemplates(5);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?featured=true&page=1&page_size=5'
      );
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should fetch templates by category with default limit', async () => {
      const category = 'Development';
      const mockTemplates: Partial<WorkflowTemplate>[] = [
        { id: '1', name: 'Dev Template 1', category },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: mockTemplates,
        total: 1,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      const result = await getTemplatesByCategory(category);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?category=Development&page=1&page_size=20'
      );
      expect(result).toEqual(mockTemplates);
    });

    it('should fetch templates by category with custom limit', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 1,
        page_size: 15,
        has_more: false,
      });

      await getTemplatesByCategory('CI/CD', 15);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?category=CI%2FCD&page=1&page_size=15'
      );
    });
  });

  describe('searchTemplatesByTags', () => {
    it('should search templates by tags with default limit', async () => {
      const tags = ['react', 'typescript'];
      const mockTemplates: Partial<WorkflowTemplate>[] = [
        { id: '1', name: 'React Template', tags },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        templates: mockTemplates,
        total: 1,
        page: 1,
        page_size: 20,
        has_more: false,
      });

      const result = await searchTemplatesByTags(tags);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?tags=react&tags=typescript&page=1&page_size=20'
      );
      expect(result).toEqual(mockTemplates);
    });

    it('should search templates by tags with custom limit', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        templates: [],
        total: 0,
        page: 1,
        page_size: 30,
        has_more: false,
      });

      await searchTemplatesByTags(['python', 'fastapi'], 30);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/v1/templates/workflows?tags=python&tags=fastapi&page=1&page_size=30'
      );
    });
  });
});
