/**
 * Workflow Templates API Service
 *
 * Establishes type-safe API integration for workflow template operations.
 * Provides template catalog browsing, filtering, and workflow instantiation.
 *
 * Best for: Accelerating workflow creation with pre-built, tested templates
 * that establish standardized patterns across teams and organizations.
 *
 * @example
 * ```tsx
 * // Browse featured templates
 * const { templates } = await listTemplates({
 *   visibility: 'public',
 *   category: 'Development',
 *   page: 1
 * });
 *
 * // Instantiate template to create workflow
 * const workflow = await instantiateTemplate(
 *   templateId,
 *   'My Development Pipeline'
 * );
 * ```
 */

import { apiClient } from './client';
import type {
  VisualWorkflow,
  WorkflowTemplate,
  WorkflowTemplateListResponse,
  TemplateVisibility,
} from '@/types/workflow';

/**
 * Parameters for listing workflow templates with filtering and pagination
 */
export interface TemplateListParams {
  /** Filter by template category */
  category?: string;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Search in template name and description */
  search?: string;
  /** Filter by visibility level */
  visibility?: TemplateVisibility;
  /** Show only featured templates */
  featured?: boolean;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page (max: 100) */
  page_size?: number;
}

/**
 * Parameters for instantiating a workflow template
 */
export interface TemplateInstantiateParams {
  /** Name for the new workflow */
  name: string;
  /** Optional description override */
  description?: string;
  /** Optional tags to add */
  tags?: string[];
}

/**
 * List workflow templates with filtering and pagination
 *
 * Retrieves template catalog with support for category filtering,
 * visibility levels, and full-text search. Templates are ordered
 * by usage count and featured status.
 *
 * @param params - Filtering and pagination parameters
 * @returns Promise resolving to paginated template list
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * // Get public featured templates
 * const { templates, total } = await listTemplates({
 *   visibility: 'public',
 *   featured: true,
 *   page: 1,
 *   page_size: 20
 * });
 *
 * // Search templates by category and tags
 * const devTemplates = await listTemplates({
 *   category: 'Development',
 *   tags: ['react', 'typescript'],
 *   search: 'deployment'
 * });
 * ```
 */
export async function listTemplates(
  params: TemplateListParams = {}
): Promise<WorkflowTemplateListResponse> {
  const queryParams = new URLSearchParams();

  // Add category filter
  if (params.category) {
    queryParams.append('category', params.category);
  }

  // Add tags filter (multiple values)
  if (params.tags && params.tags.length > 0) {
    params.tags.forEach((tag) => queryParams.append('tags', tag));
  }

  // Add search query
  if (params.search) {
    queryParams.append('search', params.search);
  }

  // Add visibility filter
  if (params.visibility) {
    queryParams.append('visibility', params.visibility);
  }

  // Add featured filter
  if (params.featured !== undefined) {
    queryParams.append('featured', String(params.featured));
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
  const endpoint = query ? `/v1/templates/workflows?${query}` : '/v1/templates/workflows';

  return apiClient.get<WorkflowTemplateListResponse>(endpoint);
}

/**
 * Get a specific workflow template by ID
 *
 * Retrieves complete template definition including workflow structure,
 * metadata, use cases, and preview information.
 *
 * @param templateId - Template UUID
 * @returns Promise resolving to template details
 * @throws ApiError with status 404 if template not found
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * const template = await getTemplate('550e8400-e29b-41d4-a716-446655440000');
 * console.log(template.name, template.usage_count);
 * ```
 */
export async function getTemplate(templateId: string): Promise<WorkflowTemplate> {
  return apiClient.get<WorkflowTemplate>(`/v1/templates/workflows/${templateId}`);
}

/**
 * Get a workflow template by slug
 *
 * Retrieves template using URL-friendly slug identifier.
 * Useful for shareable links and bookmarking.
 *
 * @param slug - Template slug (e.g., 'fullstack-dev-pipeline')
 * @returns Promise resolving to template details
 * @throws ApiError with status 404 if template not found
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * const template = await getTemplateBySlug('fullstack-dev-pipeline');
 * ```
 */
export async function getTemplateBySlug(slug: string): Promise<WorkflowTemplate> {
  return apiClient.get<WorkflowTemplate>(`/v1/templates/workflows/slug/${slug}`);
}

/**
 * Instantiate a workflow template
 *
 * Creates a new workflow from template with customized name and metadata.
 * Template definition is copied with new node/edge IDs to prevent conflicts.
 * Template usage count is automatically incremented.
 *
 * @param templateId - Template UUID
 * @param params - Instantiation parameters (name, description, tags)
 * @returns Promise resolving to created workflow
 * @throws ApiError with status 404 if template not found
 * @throws ApiError with status 400 if validation fails
 * @throws ApiError on network failure or server error
 *
 * @example
 * ```tsx
 * // Create workflow from template
 * const workflow = await instantiateTemplate(templateId, {
 *   name: 'Production Deployment Pipeline',
 *   description: 'Automated deployment for production environment',
 *   tags: ['production', 'deployment']
 * });
 *
 * // Simple instantiation with just name
 * const workflow = await instantiateTemplate(templateId, {
 *   name: 'My Pipeline'
 * });
 * ```
 */
export async function instantiateTemplate(
  templateId: string,
  params: TemplateInstantiateParams
): Promise<VisualWorkflow> {
  return apiClient.post<VisualWorkflow>(
    `/v1/templates/workflows/${templateId}/instantiate`,
    params
  );
}

/**
 * Get featured workflow templates
 *
 * Convenience method to retrieve featured templates.
 * Featured templates are curated, tested workflows recommended
 * for common use cases.
 *
 * @param limit - Maximum number of templates to return (default: 10)
 * @returns Promise resolving to featured template list
 *
 * @example
 * ```tsx
 * const featured = await getFeaturedTemplates(5);
 * ```
 */
export async function getFeaturedTemplates(
  limit: number = 10
): Promise<WorkflowTemplate[]> {
  const response = await listTemplates({
    featured: true,
    page: 1,
    page_size: limit,
  });
  return response.templates;
}

/**
 * Get templates by category
 *
 * Convenience method to retrieve all templates in a specific category.
 *
 * @param category - Template category name
 * @param limit - Maximum number of templates to return (default: 20)
 * @returns Promise resolving to category template list
 *
 * @example
 * ```tsx
 * const devTemplates = await getTemplatesByCategory('Development', 20);
 * const cicdTemplates = await getTemplatesByCategory('CI/CD', 15);
 * ```
 */
export async function getTemplatesByCategory(
  category: string,
  limit: number = 20
): Promise<WorkflowTemplate[]> {
  const response = await listTemplates({
    category,
    page: 1,
    page_size: limit,
  });
  return response.templates;
}

/**
 * Search templates by tags
 *
 * Convenience method to find templates matching specific technology tags.
 * Returns templates that match ANY of the provided tags.
 *
 * @param tags - Array of tags to search for
 * @param limit - Maximum number of templates to return (default: 20)
 * @returns Promise resolving to matching template list
 *
 * @example
 * ```tsx
 * const reactTemplates = await searchTemplatesByTags(['react', 'typescript']);
 * const pythonTemplates = await searchTemplatesByTags(['python', 'fastapi', 'pytest']);
 * ```
 */
export async function searchTemplatesByTags(
  tags: string[],
  limit: number = 20
): Promise<WorkflowTemplate[]> {
  const response = await listTemplates({
    tags,
    page: 1,
    page_size: limit,
  });
  return response.templates;
}
