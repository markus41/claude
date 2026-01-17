/**
 * MCP (Model Context Protocol) type definitions
 *
 * Provides type-safe interfaces for MCP server orchestration that supports
 * scalable tool integration across multiple platforms.
 */

/**
 * MCP server transport types
 */
export type MCPTransportType = 'stdio' | 'sse' | 'http';

/**
 * MCP server definition
 */
export interface MCPServerDefinition {
  /** Server name identifier */
  name: string;
  /** Transport type */
  transport: MCPTransportType;
  /** Command to execute (for stdio transport) */
  command?: string;
  /** Command arguments */
  args?: string[];
  /** Server URL (for sse/http transport) */
  url?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Description */
  description?: string;
  /** Whether the server is optional */
  optional?: boolean;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}

/**
 * MCP server connection status
 */
export type MCPConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'reconnecting';

/**
 * MCP server state
 */
export interface MCPServerState {
  /** Server name */
  name: string;
  /** Connection status */
  status: MCPConnectionStatus;
  /** Last error message */
  lastError?: string;
  /** Last successful connection time */
  lastConnected?: Date;
  /** Available tools */
  tools: MCPTool[];
  /** Available resources */
  resources: MCPResource[];
  /** Available prompts */
  prompts: MCPPrompt[];
}

/**
 * MCP tool definition
 */
export interface MCPTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Input schema (JSON Schema) */
  inputSchema: MCPSchema;
  /** Tool annotations */
  annotations?: MCPAnnotations;
}

/**
 * MCP resource definition
 */
export interface MCPResource {
  /** Resource URI */
  uri: string;
  /** Resource name */
  name: string;
  /** Resource description */
  description?: string;
  /** MIME type */
  mimeType?: string;
  /** Annotations */
  annotations?: MCPAnnotations;
}

/**
 * MCP prompt definition
 */
export interface MCPPrompt {
  /** Prompt name */
  name: string;
  /** Prompt description */
  description?: string;
  /** Prompt arguments */
  arguments?: MCPPromptArgument[];
}

/**
 * MCP prompt argument
 */
export interface MCPPromptArgument {
  /** Argument name */
  name: string;
  /** Argument description */
  description?: string;
  /** Whether argument is required */
  required?: boolean;
}

/**
 * MCP JSON Schema
 */
export interface MCPSchema {
  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  /** Properties (for object type) */
  properties?: Record<string, MCPSchemaProperty>;
  /** Required properties */
  required?: string[];
  /** Items schema (for array type) */
  items?: MCPSchemaProperty;
  /** Additional properties allowed */
  additionalProperties?: boolean;
  /** Description */
  description?: string;
}

/**
 * MCP schema property
 */
export interface MCPSchemaProperty {
  /** Property type */
  type: string | string[];
  /** Property description */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Enum values */
  enum?: unknown[];
  /** Pattern (for strings) */
  pattern?: string;
  /** Minimum (for numbers) */
  minimum?: number;
  /** Maximum (for numbers) */
  maximum?: number;
  /** Min length (for strings/arrays) */
  minLength?: number;
  /** Max length (for strings/arrays) */
  maxLength?: number;
  /** Nested properties */
  properties?: Record<string, MCPSchemaProperty>;
  /** Items schema */
  items?: MCPSchemaProperty;
  /** Required nested properties */
  required?: string[];
}

/**
 * MCP annotations
 */
export interface MCPAnnotations {
  /** Audience */
  audience?: ('user' | 'assistant')[];
  /** Priority */
  priority?: number;
}

/**
 * MCP tool call request
 */
export interface MCPToolCallRequest {
  /** Server name */
  server: string;
  /** Tool name */
  tool: string;
  /** Tool arguments */
  arguments: Record<string, unknown>;
  /** Request timeout */
  timeout?: number;
}

/**
 * MCP tool call result
 */
export interface MCPToolCallResult {
  /** Whether call succeeded */
  success: boolean;
  /** Result content */
  content?: MCPContent[];
  /** Error message */
  error?: string;
  /** Is error */
  isError?: boolean;
  /** Execution time in milliseconds */
  durationMs: number;
}

/**
 * MCP content types
 */
export interface MCPContent {
  /** Content type */
  type: 'text' | 'image' | 'resource';
  /** Text content */
  text?: string;
  /** Image data (base64) */
  data?: string;
  /** Image MIME type */
  mimeType?: string;
  /** Resource URI */
  uri?: string;
}

/**
 * MCP resource read request
 */
export interface MCPResourceReadRequest {
  /** Server name */
  server: string;
  /** Resource URI */
  uri: string;
  /** Request timeout */
  timeout?: number;
}

/**
 * MCP resource read result
 */
export interface MCPResourceReadResult {
  /** Whether read succeeded */
  success: boolean;
  /** Resource content */
  contents?: MCPResourceContent[];
  /** Error message */
  error?: string;
}

/**
 * MCP resource content
 */
export interface MCPResourceContent {
  /** Resource URI */
  uri: string;
  /** MIME type */
  mimeType?: string;
  /** Text content */
  text?: string;
  /** Binary content (base64) */
  blob?: string;
}

/**
 * MCP prompt get request
 */
export interface MCPPromptGetRequest {
  /** Server name */
  server: string;
  /** Prompt name */
  name: string;
  /** Prompt arguments */
  arguments?: Record<string, string>;
}

/**
 * MCP prompt get result
 */
export interface MCPPromptGetResult {
  /** Whether get succeeded */
  success: boolean;
  /** Prompt description */
  description?: string;
  /** Prompt messages */
  messages?: MCPPromptMessage[];
  /** Error message */
  error?: string;
}

/**
 * MCP prompt message
 */
export interface MCPPromptMessage {
  /** Message role */
  role: 'user' | 'assistant';
  /** Message content */
  content: MCPContent;
}

/**
 * MCP client manager interface
 */
export interface IMCPClientManager {
  /** Initialize all servers */
  initializeServers(): Promise<void>;
  /** Get server state */
  getServerState(name: string): MCPServerState | undefined;
  /** List all servers */
  listServers(): MCPServerState[];
  /** Call a tool */
  callTool(request: MCPToolCallRequest): Promise<MCPToolCallResult>;
  /** Read a resource */
  readResource(request: MCPResourceReadRequest): Promise<MCPResourceReadResult>;
  /** Get a prompt */
  getPrompt(request: MCPPromptGetRequest): Promise<MCPPromptGetResult>;
  /** List tools from a server */
  listTools(serverName: string): MCPTool[];
  /** List tools from all servers */
  listAllTools(): Map<string, MCPTool[]>;
  /** Disconnect from a server */
  disconnect(serverName: string): Promise<void>;
  /** Disconnect from all servers */
  disconnectAll(): Promise<void>;
}

/**
 * MCP client manager options
 */
export interface MCPClientManagerOptions {
  /** Server definitions */
  servers: MCPServerDefinition[];
  /** Auto-connect on initialization */
  autoConnect?: boolean;
  /** Default timeout for operations */
  defaultTimeout?: number;
  /** Logger function */
  logger?: (level: LogLevel, message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * MCP event types
 */
export type MCPEventType =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'tool_list_changed'
  | 'resource_list_changed'
  | 'prompt_list_changed';

/**
 * MCP event
 */
export interface MCPEvent {
  /** Event type */
  type: MCPEventType;
  /** Server name */
  server: string;
  /** Event data */
  data?: unknown;
  /** Timestamp */
  timestamp: Date;
}

/**
 * MCP event handler
 */
export type MCPEventHandler = (event: MCPEvent) => void;
