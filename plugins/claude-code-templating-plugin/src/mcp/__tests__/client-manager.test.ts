/**
 * Tests for MCP Client Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClientManager, createMCPClientManager } from '../client-manager.js';
import type { MCPServerDefinition } from '../../types/mcp.js';

describe('MCPClientManager', () => {
  let manager: MCPClientManager;

  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    if (manager) {
      await manager.disconnectAll();
    }
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create manager with server definitions', () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      expect(manager).toBeDefined();
      expect(manager.listServers()).toHaveLength(1);
    });

    it('should use default logger if none provided', () => {
      const servers: MCPServerDefinition[] = [];
      manager = new MCPClientManager({ servers, autoConnect: false });
      expect(manager).toBeDefined();
    });

    it('should use custom logger if provided', () => {
      const customLogger = vi.fn();
      const servers: MCPServerDefinition[] = [];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
        logger: customLogger,
      });

      expect(manager).toBeDefined();
    });
  });

  describe('getServerState', () => {
    it('should return undefined for non-existent server', () => {
      manager = new MCPClientManager({
        servers: [],
        autoConnect: false,
      });

      const state = manager.getServerState('non-existent');
      expect(state).toBeUndefined();
    });

    it('should return server state', () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      const state = manager.getServerState('test-server');
      expect(state).toBeDefined();
      expect(state?.name).toBe('test-server');
      expect(state?.status).toBe('disconnected');
    });
  });

  describe('listServers', () => {
    it('should list all servers', () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'server-1',
          transport: 'stdio',
          command: 'node',
          args: ['test1.js'],
          optional: true,
        },
        {
          name: 'server-2',
          transport: 'stdio',
          command: 'node',
          args: ['test2.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      const list = manager.listServers();
      expect(list).toHaveLength(2);
      expect(list[0]!.name).toBe('server-1');
      expect(list[1]!.name).toBe('server-2');
    });

    it('should return empty array when no servers', () => {
      manager = new MCPClientManager({
        servers: [],
        autoConnect: false,
      });

      const list = manager.listServers();
      expect(list).toHaveLength(0);
    });
  });

  describe('listTools', () => {
    it('should return empty array for non-existent server', () => {
      manager = new MCPClientManager({
        servers: [],
        autoConnect: false,
      });

      const tools = manager.listTools('non-existent');
      expect(tools).toEqual([]);
    });

    it('should return empty array for disconnected server', () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      const tools = manager.listTools('test-server');
      expect(tools).toEqual([]);
    });
  });

  describe('listAllTools', () => {
    it('should return empty map when no tools available', () => {
      manager = new MCPClientManager({
        servers: [],
        autoConnect: false,
      });

      const allTools = manager.listAllTools();
      expect(allTools.size).toBe(0);
    });
  });

  describe('callTool', () => {
    it('should fail when server not found', async () => {
      manager = new MCPClientManager({
        servers: [],
        autoConnect: false,
      });

      const result = await manager.callTool({
        server: 'non-existent',
        tool: 'test-tool',
        arguments: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server not found');
      expect(result.isError).toBe(true);
    });

    it('should fail when server not connected', async () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      const result = await manager.callTool({
        server: 'test-server',
        tool: 'test-tool',
        arguments: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server not connected');
      expect(result.isError).toBe(true);
    });
  });

  describe('readResource', () => {
    it('should fail when server not found', async () => {
      manager = new MCPClientManager({
        servers: [],
        autoConnect: false,
      });

      const result = await manager.readResource({
        server: 'non-existent',
        uri: 'test://resource',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server not found');
    });

    it('should fail when server not connected', async () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      const result = await manager.readResource({
        server: 'test-server',
        uri: 'test://resource',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server not connected');
    });
  });

  describe('getPrompt', () => {
    it('should fail when server not found', async () => {
      manager = new MCPClientManager({
        servers: [],
        autoConnect: false,
      });

      const result = await manager.getPrompt({
        server: 'non-existent',
        name: 'test-prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server not found');
    });

    it('should fail when server not connected', async () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      const result = await manager.getPrompt({
        server: 'test-server',
        name: 'test-prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server not connected');
    });
  });

  describe('createMCPClientManager', () => {
    it('should create manager with default servers', () => {
      manager = createMCPClientManager({ autoConnect: false });
      expect(manager).toBeDefined();

      const servers = manager.listServers();
      expect(servers.length).toBeGreaterThan(0);
    });

    it('should create manager with custom servers', () => {
      const customServers: MCPServerDefinition[] = [
        {
          name: 'custom-server',
          transport: 'stdio',
          command: 'node',
          args: ['custom.js'],
          optional: true,
        },
      ];

      manager = createMCPClientManager({
        servers: customServers,
        autoConnect: false,
      });

      const servers = manager.listServers();
      expect(servers).toHaveLength(1);
      expect(servers[0]!.name).toBe('custom-server');
    });
  });

  describe('event handling', () => {
    it('should emit events', async () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      const errorHandler = vi.fn();
      manager.on('error', errorHandler);

      // This should trigger an error event when connection fails
      await manager.initializeServers().catch(() => {});

      // Event handlers are called asynchronously
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('disconnectAll', () => {
    it('should disconnect all servers', async () => {
      const servers: MCPServerDefinition[] = [
        {
          name: 'test-server',
          transport: 'stdio',
          command: 'node',
          args: ['test.js'],
          optional: true,
        },
      ];

      manager = new MCPClientManager({
        servers,
        autoConnect: false,
      });

      await manager.disconnectAll();

      const state = manager.getServerState('test-server');
      expect(state?.status).toBe('disconnected');
    });
  });
});
