/**
 * Node Types API Service
 *
 * Establishes typed API integration for node type definitions and metadata.
 * Provides methods for fetching node type catalog from ACCOS backend.
 *
 * Best for: Type-safe node type retrieval with category filtering and caching support.
 */

import { apiClient } from './client';
import type { NodeCategory } from '@/types/workflow';

/**
 * Node type definition from API
 *
 * Represents a single node type with its configuration schema and metadata.
 */
export interface NodeTypeDefinition {
  /** Unique node type identifier */
  type_name: string;
  /** Human-readable display name */
  display_name: string;
  /** Node category for palette organization */
  category: NodeCategory;
  /** Node description */
  description: string;
  /** Icon name (lucide-react compatible) */
  icon: string;
  /** Color scheme hex code */
  color_scheme: string;
  /** JSON Schema for input validation */
  input_schemas: Record<string, unknown>;
  /** JSON Schema for output definition */
  output_schemas: Record<string, unknown>;
  /** JSON Schema for configuration properties */
  config_schema: Record<string, unknown>;
  /** Whether node supports multiple inputs */
  supports_multiple_inputs?: boolean;
  /** Whether node supports multiple outputs */
  supports_multiple_outputs?: boolean;
  /** Default configuration values */
  default_config?: Record<string, unknown>;
}

/**
 * Node types list response
 */
export interface NodeTypesResponse {
  /** List of node type definitions */
  node_types: NodeTypeDefinition[];
  /** Total count of node types */
  total: number;
}

/**
 * Fetch all available node types
 *
 * Retrieves complete catalog of node types from backend API.
 * Results are suitable for React Query caching with 5-minute stale time.
 *
 * @returns Promise resolving to node types list
 * @throws ApiError on network failure or invalid response
 */
export async function fetchNodeTypes(): Promise<NodeTypesResponse> {
  return apiClient.get<NodeTypesResponse>('/v1/node-types');
}

/**
 * Fetch node types filtered by category
 *
 * @param category - Node category to filter by
 * @returns Promise resolving to filtered node types
 */
export async function fetchNodeTypesByCategory(
  category: NodeCategory
): Promise<NodeTypesResponse> {
  return apiClient.get<NodeTypesResponse>(
    `/v1/node-types?category=${category}`
  );
}

/**
 * Fetch single node type by name
 *
 * @param typeName - Node type identifier (e.g., 'trigger.epic')
 * @returns Promise resolving to node type definition
 */
export async function fetchNodeType(
  typeName: string
): Promise<NodeTypeDefinition> {
  return apiClient.get<NodeTypeDefinition>(`/v1/node-types/${typeName}`);
}
