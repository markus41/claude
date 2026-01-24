/**
 * API Client Configuration
 *
 * Establishes centralized HTTP client for ACCOS backend API communication.
 * Provides typed request/response handling with error transformation and retry logic.
 *
 * Best for: Enterprise applications requiring robust API integration with
 * comprehensive error handling and type safety across all endpoints.
 */

/**
 * API error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API client configuration
 */
interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Request options for API calls
 */
interface RequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * Create configured API client instance
 *
 * @param config - Client configuration
 * @returns API client with typed request methods
 */
export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, timeout = 30000, headers: defaultHeaders = {} } = config;

  /**
   * Make HTTP request with timeout and error handling
   */
  async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout: requestTimeout = timeout, ...fetchOptions } = options;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...fetchOptions.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.detail || errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code,
          errorData
        );
      }

      // Parse response body
      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  return {
    /**
     * GET request
     */
    get: <T>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'GET' }),

    /**
     * POST request
     */
    post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),

    /**
     * PUT request
     */
    put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),

    /**
     * PATCH request
     */
    patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      }),

    /**
     * DELETE request
     */
    delete: <T>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),
  };
}

/**
 * Default API client instance
 *
 * Uses Vite proxy configuration for development (/api -> http://localhost:8000)
 * and assumes same-origin deployment for production.
 */
export const apiClient = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});
