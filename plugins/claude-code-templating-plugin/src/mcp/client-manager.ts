/**
 * MCP Client Manager
 *
 * Orchestrates connections to multiple MCP servers and provides a unified interface
 * for tool execution, resource reading, and prompt retrieval.
 *
 * Features:
 * - Multi-server connection management
 * - Automatic retry with exponential backoff
 * - Event-driven architecture
 * - Connection state tracking
 * - Metrics and logging
 */

import { EventEmitter } from 'eventemitter3';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { ClientCapabilities } from '@modelcontextprotocol/sdk/types.js';
import {
  IMCPClientManager,
  MCPClientManagerOptions,
  MCPServerDefinition,
  MCPServerState,
  MCPTool,
  MCPToolCallRequest,
  MCPToolCallResult,
  MCPResourceReadRequest,
  MCPResourceReadResult,
  MCPPromptGetRequest,
  MCPPromptGetResult,
  MCPEvent,
  MCPEventType,
  RetryConfig,
  LogLevel,
} from '../types/mcp.js';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Default timeout for operations (30 seconds)
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Connection timeout (10 seconds)
 */
const CONNECTION_TIMEOUT_MS = 10000;

/**
 * Server connection info
 */
interface ServerConnection {
  definition: MCPServerDefinition;
  client: Client;
  transport: StdioClientTransport;
  state: MCPServerState;
  retryCount: number;
  lastAttempt?: Date;
}

/**
 * MCP Client Manager implementation
 *
 * Manages multiple MCP server connections and provides a unified interface
 * for interacting with MCP tools, resources, and prompts.
 */
export class MCPClientManager extends EventEmitter implements IMCPClientManager {
  private connections: Map<string, ServerConnection> = new Map();
  private logger: (level: LogLevel, message: string, meta?: Record<string, unknown>) => void;
  private defaultTimeout: number;
  private autoConnect: boolean;
  private isInitialized = false;

  constructor(options: MCPClientManagerOptions) {
    super();
    this.logger = options.logger || this.defaultLogger;
    this.defaultTimeout = options.defaultTimeout || DEFAULT_TIMEOUT_MS;
    this.autoConnect = options.autoConnect !== false;

    // Initialize server definitions
    for (const serverDef of options.servers) {
      const state: MCPServerState = {
        name: serverDef.name,
        status: 'disconnected',
        tools: [],
        resources: [],
        prompts: [],
      };

      const capabilities: ClientCapabilities = {
        sampling: {},
      };

      this.connections.set(serverDef.name, {
        definition: serverDef,
        client: new Client(
          {
            name: `claude-code-templating-plugin/${serverDef.name}`,
            version: '1.0.0',
          },
          {
            capabilities,
          }
        ),
        transport: new StdioClientTransport({
          command: serverDef.command!,
          args: serverDef.args || [],
          env: {
            ...process.env,
            ...(serverDef.env || {}),
          } as Record<string, string>,
        }),
        state,
        retryCount: 0,
      });
    }
  }

  /**
   * Default logger implementation
   */
  private defaultLogger(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`);
  }

  /**
   * Emit an MCP event
   */
  private emitMCPEvent(type: MCPEventType, server: string, data?: unknown): void {
    const event: MCPEvent = {
      type,
      server,
      data,
      timestamp: new Date(),
    };
    this.emit(type, event);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelayMs
    );
    // Add jitter (±10%)
    return delay * (0.9 + Math.random() * 0.2);
  }

  /**
   * Connect to a single server with retry logic
   */
  private async connectServer(
    serverName: string,
    connection: ServerConnection
  ): Promise<boolean> {
    const { definition, client, transport } = connection;
    const retryConfig = definition.retry || DEFAULT_RETRY_CONFIG;
    const timeout = definition.timeout || CONNECTION_TIMEOUT_MS;

    this.logger('info', `Connecting to MCP server: ${serverName}`);
    connection.state.status = 'connecting';

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        connection.lastAttempt = new Date();

        // Connect with timeout
        const connectPromise = client.connect(transport);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeout)
        );

        await Promise.race([connectPromise, timeoutPromise]);

        // List capabilities
        const [toolsList, resourcesList, promptsList] = await Promise.all([
          client.listTools().catch(() => ({ tools: [] })),
          client.listResources().catch(() => ({ resources: [] })),
          client.listPrompts().catch(() => ({ prompts: [] })),
        ]);

        connection.state.tools = toolsList.tools.map((tool) => ({
          name: tool.name,
          description: tool.description || '',
          inputSchema: tool.inputSchema as any,
          annotations: tool.annotations
            ? {
                audience: tool.annotations.readOnlyHint ? ['assistant' as const] : undefined,
                priority: tool.annotations.destructiveHint ? 1 : undefined,
              }
            : undefined,
        }));

        connection.state.resources = resourcesList.resources.map((resource) => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
          annotations: resource.annotations,
        }));

        connection.state.prompts = promptsList.prompts.map((prompt) => ({
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments?.map((arg) => ({
            name: arg.name,
            description: arg.description,
            required: arg.required,
          })),
        }));

        // Success
        connection.state.status = 'connected';
        connection.state.lastConnected = new Date();
        connection.state.lastError = undefined;
        connection.retryCount = 0;

        this.logger('info', `Connected to MCP server: ${serverName}`, {
          tools: connection.state.tools.length,
          resources: connection.state.resources.length,
          prompts: connection.state.prompts.length,
        });

        this.emitMCPEvent('connected', serverName);
        if (connection.state.tools.length > 0) {
          this.emitMCPEvent('tool_list_changed', serverName, connection.state.tools);
        }

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        connection.state.lastError = errorMessage;
        connection.retryCount = attempt;

        this.logger('warn', `Failed to connect to ${serverName} (attempt ${attempt}/${retryConfig.maxAttempts})`, {
          error: errorMessage,
        });

        if (attempt < retryConfig.maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, retryConfig);
          this.logger('debug', `Retrying connection to ${serverName} in ${Math.round(delay)}ms`);
          connection.state.status = 'reconnecting';
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    connection.state.status = 'error';
    this.logger('error', `Failed to connect to MCP server: ${serverName}`, {
      error: connection.state.lastError,
    });

    this.emitMCPEvent('error', serverName, {
      error: connection.state.lastError,
    });

    if (!definition.optional) {
      throw new Error(`Failed to connect to required MCP server: ${serverName}`);
    }

    return false;
  }

  /**
   * Initialize all servers
   */
  async initializeServers(): Promise<void> {
    if (this.isInitialized) {
      this.logger('warn', 'MCP Client Manager already initialized');
      return;
    }

    this.logger('info', 'Initializing MCP servers', {
      serverCount: this.connections.size,
    });

    if (this.autoConnect) {
      const connectionPromises = Array.from(this.connections.entries()).map(
        ([name, connection]) =>
          this.connectServer(name, connection).catch((error) => {
            this.logger('error', `Failed to initialize server ${name}`, { error });
            return false;
          })
      );

      await Promise.all(connectionPromises);
    }

    this.isInitialized = true;
    this.logger('info', 'MCP Client Manager initialized');
  }

  /**
   * Get server state
   */
  getServerState(name: string): MCPServerState | undefined {
    return this.connections.get(name)?.state;
  }

  /**
   * List all servers
   */
  listServers(): MCPServerState[] {
    return Array.from(this.connections.values()).map((conn) => conn.state);
  }

  /**
   * Call a tool
   */
  async callTool(request: MCPToolCallRequest): Promise<MCPToolCallResult> {
    const startTime = Date.now();
    const connection = this.connections.get(request.server);

    if (!connection) {
      return {
        success: false,
        error: `Server not found: ${request.server}`,
        isError: true,
        durationMs: Date.now() - startTime,
      };
    }

    if (connection.state.status !== 'connected') {
      return {
        success: false,
        error: `Server not connected: ${request.server} (status: ${connection.state.status})`,
        isError: true,
        durationMs: Date.now() - startTime,
      };
    }

    try {
      this.logger('debug', `Calling tool: ${request.server}/${request.tool}`, {
        arguments: request.arguments,
      });

      const timeout = request.timeout || this.defaultTimeout;
      const callPromise = connection.client.callTool({
        name: request.tool,
        arguments: request.arguments,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tool call timeout')), timeout)
      );

      const result = await Promise.race([callPromise, timeoutPromise]);

      const durationMs = Date.now() - startTime;
      this.logger('debug', `Tool call completed: ${request.server}/${request.tool}`, {
        durationMs,
      });

      // Map SDK content types to our internal types
      const mappedContent = Array.isArray(result.content)
        ? result.content.map((item: any) => ({
            type: item.type as any,
            text: item.type === 'text' ? item.text : undefined,
            data: item.type === 'image' ? item.data : undefined,
            mimeType: item.type === 'image' ? item.mimeType : undefined,
            uri: item.type === 'resource' ? item.uri : undefined,
          }))
        : [];

      return {
        success: !(result as any).isError,
        content: mappedContent,
        error: (result as any).isError ? JSON.stringify(result.content) : undefined,
        isError: (result as any).isError,
        durationMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - startTime;

      this.logger('error', `Tool call failed: ${request.server}/${request.tool}`, {
        error: errorMessage,
        durationMs,
      });

      return {
        success: false,
        error: errorMessage,
        isError: true,
        durationMs,
      };
    }
  }

  /**
   * Read a resource
   */
  async readResource(request: MCPResourceReadRequest): Promise<MCPResourceReadResult> {
    const connection = this.connections.get(request.server);

    if (!connection) {
      return {
        success: false,
        error: `Server not found: ${request.server}`,
      };
    }

    if (connection.state.status !== 'connected') {
      return {
        success: false,
        error: `Server not connected: ${request.server} (status: ${connection.state.status})`,
      };
    }

    try {
      this.logger('debug', `Reading resource: ${request.server}/${request.uri}`);

      const timeout = request.timeout || this.defaultTimeout;
      const readPromise = connection.client.readResource({ uri: request.uri });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Resource read timeout')), timeout)
      );

      const result = await Promise.race([readPromise, timeoutPromise]);

      return {
        success: true,
        contents: result.contents.map((content) => ({
          uri: content.uri,
          mimeType: content.mimeType,
          text: (content as any).text,
          blob: (content as any).blob,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger('error', `Resource read failed: ${request.server}/${request.uri}`, {
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get a prompt
   */
  async getPrompt(request: MCPPromptGetRequest): Promise<MCPPromptGetResult> {
    const connection = this.connections.get(request.server);

    if (!connection) {
      return {
        success: false,
        error: `Server not found: ${request.server}`,
      };
    }

    if (connection.state.status !== 'connected') {
      return {
        success: false,
        error: `Server not connected: ${request.server} (status: ${connection.state.status})`,
      };
    }

    try {
      this.logger('debug', `Getting prompt: ${request.server}/${request.name}`);

      const result = await connection.client.getPrompt({
        name: request.name,
        arguments: request.arguments,
      });

      return {
        success: true,
        description: result.description,
        messages: result.messages.map((msg) => ({
          role: msg.role,
          content: msg.content as any,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger('error', `Get prompt failed: ${request.server}/${request.name}`, {
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * List tools from a server
   */
  listTools(serverName: string): MCPTool[] {
    const connection = this.connections.get(serverName);
    return connection?.state.tools || [];
  }

  /**
   * List tools from all servers
   */
  listAllTools(): Map<string, MCPTool[]> {
    const allTools = new Map<string, MCPTool[]>();
    for (const [name, connection] of this.connections.entries()) {
      if (connection.state.tools.length > 0) {
        allTools.set(name, connection.state.tools);
      }
    }
    return allTools;
  }

  /**
   * Disconnect from a server
   */
  async disconnect(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName);
    if (!connection) {
      this.logger('warn', `Server not found: ${serverName}`);
      return;
    }

    if (connection.state.status === 'disconnected') {
      return;
    }

    try {
      this.logger('info', `Disconnecting from server: ${serverName}`);
      await connection.client.close();
      connection.state.status = 'disconnected';
      this.emitMCPEvent('disconnected', serverName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger('error', `Failed to disconnect from server: ${serverName}`, {
        error: errorMessage,
      });
      connection.state.status = 'error';
      connection.state.lastError = errorMessage;
    }
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    this.logger('info', 'Disconnecting from all servers');

    const disconnectPromises = Array.from(this.connections.keys()).map((name) =>
      this.disconnect(name)
    );

    await Promise.all(disconnectPromises);
    this.isInitialized = false;
  }
}

/**
 * Default server definitions
 */
const DEFAULT_SERVER_DEFINITIONS: MCPServerDefinition[] = [
  {
    name: 'harness',
    transport: 'stdio',
    command: 'docker',
    args: ['run', '-i', '--rm', 'harness/mcp-server', 'stdio'],
    env: {
      HARNESS_API_KEY: process.env.HARNESS_API_KEY || '',
      HARNESS_ACCOUNT_ID: process.env.HARNESS_ACCOUNT_ID || '',
      HARNESS_DEFAULT_ORG_ID: process.env.HARNESS_ORG_ID || '',
      HARNESS_DEFAULT_PROJECT_ID: process.env.HARNESS_PROJECT_ID || '',
    },
    description: 'Harness Platform MCP Server',
    optional: false,
  },
  {
    name: 'scaffold',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@agiflowai/scaffold-mcp'],
    description: 'Scaffold MCP Server for project templating',
    optional: true,
  },
  {
    name: 'github',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    },
    description: 'GitHub MCP Server',
    optional: true,
  },
];

/**
 * Create an MCP Client Manager with default configuration
 */
export function createMCPClientManager(
  options?: Partial<MCPClientManagerOptions>
): MCPClientManager {
  return new MCPClientManager({
    servers: options?.servers || DEFAULT_SERVER_DEFINITIONS,
    autoConnect: options?.autoConnect !== false,
    defaultTimeout: options?.defaultTimeout || DEFAULT_TIMEOUT_MS,
    logger: options?.logger,
  });
}

// Default export
export default MCPClientManager;
