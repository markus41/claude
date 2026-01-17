# MCP Client Manager

**Status:** ✅ Implemented | **Tests:** ✅ 20 passing | **Type Safety:** ✅ Full

## Overview

The MCP Client Manager provides a robust, production-ready interface for orchestrating multiple Model Context Protocol (MCP) servers. It handles connection management, retry logic, tool execution, resource reading, and prompt retrieval with full type safety and event-driven architecture.

## Features

- **Multi-Server Management**: Connect to and manage multiple MCP servers simultaneously
- **Automatic Retry**: Exponential backoff with configurable retry policies
- **Event-Driven**: EventEmitter3-based events for connection state changes
- **Type-Safe**: Full TypeScript support with strict type checking
- **Connection Pooling**: Efficient connection reuse and management
- **Metrics**: Built-in duration tracking for tool calls
- **Graceful Degradation**: Optional servers continue even if unavailable

## Quick Start

```typescript
import { createMCPClientManager } from './mcp/client-manager.js';

// Create manager with default servers (Harness, Scaffold, GitHub)
const manager = createMCPClientManager();

// Initialize and connect to all servers
await manager.initializeServers();

// Call a tool
const result = await manager.callTool({
  server: 'harness',
  tool: 'get-pipeline',
  arguments: {
    org: 'my-org',
    project: 'my-project',
    pipeline: 'ci-cd-pipeline',
  },
});

console.log(result.content);

// Cleanup
await manager.disconnectAll();
```

## Server Definitions

### Default Servers

The manager comes pre-configured with three MCP servers:

#### 1. Harness Platform Server

```typescript
{
  name: 'harness',
  transport: 'stdio',
  command: 'docker',
  args: ['run', '-i', '--rm', 'harness/mcp-server', 'stdio'],
  env: {
    HARNESS_API_KEY: process.env.HARNESS_API_KEY,
    HARNESS_ACCOUNT_ID: process.env.HARNESS_ACCOUNT_ID,
    HARNESS_DEFAULT_ORG_ID: process.env.HARNESS_ORG_ID,
    HARNESS_DEFAULT_PROJECT_ID: process.env.HARNESS_PROJECT_ID,
  },
  optional: false,
}
```

**Tools:**
- `create-pipeline`, `get-pipeline`, `update-pipeline`, `delete-pipeline`
- `create-template`, `get-template`, `update-template`, `delete-template`
- `create-service`, `get-service`, `update-service`, `delete-service`
- `create-environment`, `get-environment`, `update-environment`, `delete-environment`
- `execute-pipeline`, `get-execution`, `list-executions`

#### 2. Scaffold Server

```typescript
{
  name: 'scaffold',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@agiflowai/scaffold-mcp'],
  optional: true,
}
```

**Tools:**
- `scaffold-project`: Generate projects from templates
- `list-templates`: List available templates
- `get-template`: Get template details

#### 3. GitHub Server

```typescript
{
  name: 'github',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
  optional: true,
}
```

**Tools:**
- `create-repository`, `get-repository`, `update-repository`
- `create-pull-request`, `get-pull-request`, `merge-pull-request`
- `create-issue`, `get-issue`, `update-issue`
- `get-file-contents`, `create-or-update-file`, `search-code`

## Custom Server Configuration

```typescript
import { MCPClientManager } from './mcp/client-manager.js';
import type { MCPServerDefinition } from './types/mcp.js';

const customServers: MCPServerDefinition[] = [
  {
    name: 'my-custom-server',
    transport: 'stdio',
    command: 'node',
    args: ['path/to/server.js'],
    env: {
      API_KEY: process.env.MY_API_KEY,
    },
    optional: false,
    timeout: 15000, // 15 second connection timeout
    retry: {
      maxAttempts: 5,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
    },
  },
];

const manager = new MCPClientManager({
  servers: customServers,
  autoConnect: true, // Auto-connect on initialization
  defaultTimeout: 30000, // 30 second default timeout for operations
  logger: (level, message, meta) => {
    console.log(`[${level}] ${message}`, meta);
  },
});
```

## API Reference

### Constructor

```typescript
new MCPClientManager(options: MCPClientManagerOptions)
```

**Options:**
- `servers`: Array of MCP server definitions
- `autoConnect?`: Whether to auto-connect on initialization (default: `true`)
- `defaultTimeout?`: Default timeout for operations in ms (default: `30000`)
- `logger?`: Custom logger function

### Methods

#### `initializeServers(): Promise<void>`

Initialize and connect to all configured servers.

```typescript
await manager.initializeServers();
```

#### `callTool(request: MCPToolCallRequest): Promise<MCPToolCallResult>`

Execute a tool on an MCP server.

```typescript
const result = await manager.callTool({
  server: 'harness',
  tool: 'get-pipeline',
  arguments: { org: 'my-org', project: 'my-project', pipeline: 'main' },
  timeout: 5000, // Optional: override default timeout
});

if (result.success) {
  console.log(result.content);
} else {
  console.error(result.error);
}
```

#### `readResource(request: MCPResourceReadRequest): Promise<MCPResourceReadResult>`

Read a resource from an MCP server.

```typescript
const result = await manager.readResource({
  server: 'github',
  uri: 'github://owner/repo/blob/main/README.md',
});
```

#### `getPrompt(request: MCPPromptGetRequest): Promise<MCPPromptGetResult>`

Get a prompt from an MCP server.

```typescript
const result = await manager.getPrompt({
  server: 'scaffold',
  name: 'new-project',
  arguments: { projectType: 'microservice' },
});
```

#### `listTools(serverName: string): MCPTool[]`

List all tools from a specific server.

```typescript
const tools = manager.listTools('harness');
console.log(tools.map(t => t.name));
```

#### `listAllTools(): Map<string, MCPTool[]>`

List all tools from all connected servers.

```typescript
const allTools = manager.listAllTools();
for (const [serverName, tools] of allTools.entries()) {
  console.log(`${serverName}: ${tools.length} tools`);
}
```

#### `getServerState(name: string): MCPServerState | undefined`

Get the current state of a server.

```typescript
const state = manager.getServerState('harness');
console.log(`Status: ${state?.status}`);
console.log(`Tools: ${state?.tools.length}`);
console.log(`Last Error: ${state?.lastError}`);
```

#### `listServers(): MCPServerState[]`

List all server states.

```typescript
const servers = manager.listServers();
for (const server of servers) {
  console.log(`${server.name}: ${server.status}`);
}
```

#### `disconnect(serverName: string): Promise<void>`

Disconnect from a specific server.

```typescript
await manager.disconnect('scaffold');
```

#### `disconnectAll(): Promise<void>`

Disconnect from all servers.

```typescript
await manager.disconnectAll();
```

## Events

The manager emits events for connection state changes:

```typescript
manager.on('connected', (event: MCPEvent) => {
  console.log(`Server connected: ${event.server}`);
});

manager.on('disconnected', (event: MCPEvent) => {
  console.log(`Server disconnected: ${event.server}`);
});

manager.on('error', (event: MCPEvent) => {
  console.error(`Server error: ${event.server}`, event.data);
});

manager.on('tool_list_changed', (event: MCPEvent) => {
  console.log(`Tools updated: ${event.server}`, event.data);
});
```

## Retry Configuration

The manager supports automatic retry with exponential backoff:

```typescript
{
  retry: {
    maxAttempts: 3,        // Maximum retry attempts
    initialDelayMs: 1000,  // Initial delay (1 second)
    maxDelayMs: 10000,     // Maximum delay (10 seconds)
    backoffMultiplier: 2,  // Doubles delay each retry
  }
}
```

**Retry Behavior:**
1. First attempt: immediate
2. Second attempt: 1 second delay (± 10% jitter)
3. Third attempt: 2 second delay (± 10% jitter)
4. Fourth attempt: 4 second delay (± 10% jitter)
5. Subsequent: capped at 10 seconds

## Error Handling

All methods handle errors gracefully:

```typescript
// Tool call error
const result = await manager.callTool({
  server: 'non-existent',
  tool: 'some-tool',
  arguments: {},
});

if (!result.success) {
  console.error(`Error: ${result.error}`);
  console.log(`Duration: ${result.durationMs}ms`);
}
```

## Type Safety

The module is fully typed with strict TypeScript checking:

```typescript
import type {
  MCPServerDefinition,
  MCPServerState,
  MCPConnectionStatus,
  MCPTool,
  MCPToolCallRequest,
  MCPToolCallResult,
  MCPResourceReadRequest,
  MCPResourceReadResult,
  MCPPromptGetRequest,
  MCPPromptGetResult,
  MCPEvent,
  MCPEventType,
} from './types/mcp.js';
```

## Testing

Run tests with:

```bash
npm test -- src/mcp/__tests__/client-manager.test.ts
```

**Test Coverage:**
- ✅ Constructor and initialization
- ✅ Server state management
- ✅ Tool listing
- ✅ Tool execution
- ✅ Resource reading
- ✅ Prompt retrieval
- ✅ Error handling
- ✅ Event emission
- ✅ Connection management

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              MCPClientManager                            │
│  (EventEmitter3)                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Harness    │  │   Scaffold   │  │    GitHub    │ │
│  │  Connection  │  │  Connection  │  │  Connection  │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤ │
│  │ Client       │  │ Client       │  │ Client       │ │
│  │ Transport    │  │ Transport    │  │ Transport    │ │
│  │ State        │  │ State        │  │ State        │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Features:                                               │
│  • Retry with exponential backoff                       │
│  • Connection state tracking                            │
│  • Event emission                                       │
│  • Metrics collection                                   │
│  • Graceful error handling                              │
└─────────────────────────────────────────────────────────┘
```

## Performance

The client manager is optimized for performance:

- **Connection Pooling**: Reuses connections efficiently
- **Lazy Initialization**: Connects only when needed
- **Parallel Operations**: Supports concurrent tool calls
- **Timeout Management**: Prevents hanging operations
- **Memory Efficient**: Minimal overhead per connection

## Best Practices

1. **Always Disconnect**: Call `disconnectAll()` when done
2. **Handle Errors**: Check `result.success` before using data
3. **Use Events**: Subscribe to events for state changes
4. **Configure Timeouts**: Set appropriate timeouts for your use case
5. **Mark Optional Servers**: Set `optional: true` for non-critical servers
6. **Custom Logger**: Provide a logger for production debugging
7. **Reuse Instances**: Create one manager instance and reuse it

## Environment Variables

Required for default servers:

```bash
# Harness Platform
HARNESS_API_KEY=your_api_key_here
HARNESS_ACCOUNT_ID=your_account_id
HARNESS_ORG_ID=your_org_id
HARNESS_PROJECT_ID=your_project_id

# GitHub (optional)
GITHUB_TOKEN=your_github_token
```

## Related Files

- **Types**: `src/types/mcp.ts` - Type definitions
- **Tests**: `src/mcp/__tests__/client-manager.test.ts` - Unit tests
- **Export**: `src/mcp/index.ts` - Public API

## License

MIT
