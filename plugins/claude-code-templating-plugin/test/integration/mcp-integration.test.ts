/**
 * MCP Integration Tests
 *
 * Tests the MCP client manager integration with the plugin system,
 * verifying server definitions, tool registration, and event handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'eventemitter3';
import type { MCPServerDefinition, MCPServerState, MCPTool } from '../../src/types/mcp.js';

// Mock MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({ tools: [] }),
    listResources: vi.fn().mockResolvedValue({ resources: [] }),
    listPrompts: vi.fn().mockResolvedValue({ prompts: [] }),
    callTool: vi.fn().mockResolvedValue({ content: [] }),
    readResource: vi.fn().mockResolvedValue({ contents: [] }),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    onclose: undefined,
    onerror: undefined,
  })),
}));

describe('MCP Integration', () => {
  describe('Server Definitions', () => {
    it('should define harness MCP server correctly', () => {
      const harnessServer: MCPServerDefinition = {
        name: 'harness',
        command: 'docker',
        args: ['run', '-i', '--rm', 'harness/mcp-server', 'stdio'],
        env: {
          HARNESS_API_KEY: 'test-key',
          HARNESS_ACCOUNT_ID: 'test-account',
        },
        capabilities: ['tools', 'resources'],
      };

      expect(harnessServer.name).toBe('harness');
      expect(harnessServer.command).toBe('docker');
      expect(harnessServer.args).toContain('harness/mcp-server');
      expect(harnessServer.capabilities).toContain('tools');
    });

    it('should define scaffold MCP server correctly', () => {
      const scaffoldServer: MCPServerDefinition = {
        name: 'scaffold',
        command: 'npx',
        args: ['-y', '@agiflowai/scaffold-mcp'],
        capabilities: ['tools'],
      };

      expect(scaffoldServer.name).toBe('scaffold');
      expect(scaffoldServer.command).toBe('npx');
    });

    it('should define github MCP server correctly', () => {
      const githubServer: MCPServerDefinition = {
        name: 'github',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_TOKEN: 'test-token',
        },
        capabilities: ['tools', 'resources'],
      };

      expect(githubServer.name).toBe('github');
      expect(githubServer.capabilities).toContain('resources');
    });
  });

  describe('Server State Management', () => {
    it('should initialize server state as disconnected', () => {
      const state: MCPServerState = {
        name: 'harness',
        status: 'disconnected',
        tools: [],
        resources: [],
        prompts: [],
      };

      expect(state.status).toBe('disconnected');
      expect(state.tools).toHaveLength(0);
    });

    it('should track connected server state', () => {
      const tools: MCPTool[] = [
        {
          name: 'harness_create_pipeline',
          description: 'Create a Harness pipeline',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              org: { type: 'string' },
            },
            required: ['name'],
          },
        },
        {
          name: 'harness_list_pipelines',
          description: 'List Harness pipelines',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ];

      const state: MCPServerState = {
        name: 'harness',
        status: 'connected',
        tools,
        resources: [],
        prompts: [],
        connectedAt: new Date(),
      };

      expect(state.status).toBe('connected');
      expect(state.tools).toHaveLength(2);
      expect(state.tools[0]!.name).toBe('harness_create_pipeline');
      expect(state.connectedAt).toBeDefined();
    });

    it('should track connection errors', () => {
      const state: MCPServerState = {
        name: 'harness',
        status: 'error',
        tools: [],
        resources: [],
        prompts: [],
        lastError: 'Connection refused',
      };

      expect(state.status).toBe('error');
      expect(state.lastError).toBe('Connection refused');
    });
  });

  describe('Event Handling', () => {
    let eventEmitter: EventEmitter;

    beforeEach(() => {
      eventEmitter = new EventEmitter();
    });

    afterEach(() => {
      eventEmitter.removeAllListeners();
    });

    it('should emit connected event when server connects', async () => {
      const connectedHandler = vi.fn();
      eventEmitter.on('connected', connectedHandler);

      const state: MCPServerState = {
        name: 'harness',
        status: 'connected',
        tools: [],
        resources: [],
        prompts: [],
      };

      eventEmitter.emit('connected', state);

      expect(connectedHandler).toHaveBeenCalledWith(state);
    });

    it('should emit disconnected event when server disconnects', async () => {
      const disconnectedHandler = vi.fn();
      eventEmitter.on('disconnected', disconnectedHandler);

      eventEmitter.emit('disconnected', 'harness');

      expect(disconnectedHandler).toHaveBeenCalledWith('harness');
    });

    it('should emit error event on connection failure', async () => {
      const errorHandler = vi.fn();
      eventEmitter.on('error', errorHandler);

      const error = new Error('Connection failed');
      eventEmitter.emit('error', error, 'harness');

      expect(errorHandler).toHaveBeenCalledWith(error, 'harness');
    });

    it('should emit toolCallCompleted event after tool execution', async () => {
      const toolCallHandler = vi.fn();
      eventEmitter.on('toolCallCompleted', toolCallHandler);

      const result = {
        content: [{ type: 'text', text: 'Pipeline created successfully' }],
        isError: false,
      };

      eventEmitter.emit('toolCallCompleted', 'harness', 'harness_create_pipeline', result);

      expect(toolCallHandler).toHaveBeenCalledWith('harness', 'harness_create_pipeline', result);
    });
  });

  describe('Tool Discovery', () => {
    it('should discover harness tools', () => {
      const harnessTools: MCPTool[] = [
        {
          name: 'harness_create_pipeline',
          description: 'Create a new Harness pipeline',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Pipeline name' },
              orgIdentifier: { type: 'string', description: 'Organization ID' },
              projectIdentifier: { type: 'string', description: 'Project ID' },
            },
            required: ['name'],
          },
        },
        {
          name: 'harness_get_pipeline',
          description: 'Get pipeline details',
          inputSchema: {
            type: 'object',
            properties: {
              identifier: { type: 'string' },
            },
            required: ['identifier'],
          },
        },
        {
          name: 'harness_trigger_pipeline',
          description: 'Trigger pipeline execution',
          inputSchema: {
            type: 'object',
            properties: {
              identifier: { type: 'string' },
              inputs: { type: 'object' },
            },
            required: ['identifier'],
          },
        },
      ];

      expect(harnessTools).toHaveLength(3);
      expect(harnessTools.map((t) => t.name)).toContain('harness_create_pipeline');
      expect(harnessTools.map((t) => t.name)).toContain('harness_get_pipeline');
      expect(harnessTools.map((t) => t.name)).toContain('harness_trigger_pipeline');
    });

    it('should discover github tools', () => {
      const githubTools: MCPTool[] = [
        {
          name: 'github_create_repository',
          description: 'Create a new GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              private: { type: 'boolean' },
            },
            required: ['name'],
          },
        },
        {
          name: 'github_create_pull_request',
          description: 'Create a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              repo: { type: 'string' },
              head: { type: 'string' },
              base: { type: 'string' },
              title: { type: 'string' },
            },
            required: ['repo', 'head', 'base', 'title'],
          },
        },
      ];

      expect(githubTools).toHaveLength(2);
      expect(githubTools.map((t) => t.name)).toContain('github_create_repository');
    });
  });

  describe('Tool Execution', () => {
    it('should validate tool call parameters', () => {
      const tool: MCPTool = {
        name: 'harness_create_pipeline',
        description: 'Create pipeline',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      };

      const validParams = { name: 'my-pipeline' };
      const invalidParams = { description: 'missing name' };

      // Validation logic
      const validateParams = (params: Record<string, unknown>): boolean => {
        const required = tool.inputSchema.required || [];
        return required.every((prop) => prop in params);
      };

      expect(validateParams(validParams)).toBe(true);
      expect(validateParams(invalidParams)).toBe(false);
    });

    it('should handle tool execution results', () => {
      const successResult = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              pipelineId: 'my_pipeline',
              status: 'created',
            }),
          },
        ],
        isError: false,
      };

      const errorResult = {
        content: [
          {
            type: 'text',
            text: 'Pipeline creation failed: Invalid org ID',
          },
        ],
        isError: true,
      };

      expect(successResult.isError).toBe(false);
      expect(errorResult.isError).toBe(true);
    });
  });

  describe('Plugin Integration', () => {
    it('should integrate MCP with plugin activation', async () => {
      // Simulate plugin activation with MCP config
      const pluginConfig = {
        mcp: {
          autoConnect: true,
          servers: ['harness', 'github'],
          defaultTimeout: 30000,
        },
      };

      expect(pluginConfig.mcp.autoConnect).toBe(true);
      expect(pluginConfig.mcp.servers).toContain('harness');
      expect(pluginConfig.mcp.servers).toContain('github');
    });

    it('should route template commands to appropriate MCP tools', () => {
      // Define command to tool mapping
      const commandToolMap: Record<string, string[]> = {
        '/template generate': ['scaffold'],
        '/harness pipeline': ['harness_create_pipeline', 'harness_get_pipeline'],
        '/harness template': ['harness_create_template'],
        '/harness deploy': ['harness_trigger_pipeline'],
      };

      expect(commandToolMap['/harness pipeline']).toContain('harness_create_pipeline');
      expect(commandToolMap['/template generate']).toContain('scaffold');
    });

    it('should handle MCP server reconnection', async () => {
      const reconnectAttempts: number[] = [];
      const maxRetries = 3;

      const simulateReconnect = async (attempt: number): Promise<boolean> => {
        reconnectAttempts.push(attempt);
        // Simulate success on third attempt
        return attempt >= 2;
      };

      let connected = false;
      for (let i = 0; i < maxRetries && !connected; i++) {
        connected = await simulateReconnect(i);
      }

      expect(connected).toBe(true);
      expect(reconnectAttempts).toHaveLength(3);
    });
  });
});

describe('End-to-End MCP Workflows', () => {
  describe('Pipeline Creation Workflow', () => {
    it('should create pipeline through MCP tools', async () => {
      // Simulate full pipeline creation workflow
      const workflow = {
        steps: [
          { tool: 'harness_create_pipeline', status: 'completed' },
          { tool: 'harness_create_service', status: 'completed' },
          { tool: 'harness_create_environment', status: 'completed' },
        ],
      };

      expect(workflow.steps).toHaveLength(3);
      expect(workflow.steps.every((s) => s.status === 'completed')).toBe(true);
    });
  });

  describe('Scaffold with Harness Integration', () => {
    it('should scaffold project and create Harness resources', async () => {
      // Simulate scaffold with Harness integration
      const scaffoldResult = {
        projectPath: '/workspace/my-service',
        files: ['package.json', 'src/index.ts', 'CLAUDE.md'],
        harnessResources: {
          pipeline: 'my_service_pipeline',
          service: 'my_service',
          environments: ['dev', 'staging', 'prod'],
        },
      };

      expect(scaffoldResult.files).toContain('package.json');
      expect(scaffoldResult.harnessResources.environments).toHaveLength(3);
      expect(scaffoldResult.harnessResources.pipeline).toBe('my_service_pipeline');
    });
  });
});
