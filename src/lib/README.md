# lib/

Shared infrastructure used by components and hooks throughout the application. Nothing in this directory renders UI — it provides typed data access and real-time communication primitives.

## api/

Typed REST clients for every ACCOS backend resource. Each file exports a set of plain `async` functions; they have no React dependency and can be called anywhere.

### client.ts

The foundation for all API calls. Exports `createApiClient` and a pre-configured default instance `apiClient`.

Key behaviour:
- All requests include `Content-Type: application/json`.
- A 30-second `AbortController` timeout is applied to every request.
- Non-2xx responses are parsed for `detail` / `message` / `code` fields and thrown as `ApiError`.
- Network failures and `AbortError` timeouts are also normalised to `ApiError`.

```typescript
import { apiClient, ApiError } from '@/lib/api/client';

try {
  const data = await apiClient.get<MyType>('/v1/resource');
} catch (err) {
  if (err instanceof ApiError && err.status === 404) {
    // handle not found
  }
}
```

The base URL is resolved from `VITE_API_BASE_URL` at build time, defaulting to `/api` (proxied by Vite in development to `http://localhost:8000`).

### workflows.ts

CRUD operations for visual workflow definitions.

| Function | Method | Endpoint |
|----------|--------|----------|
| `listWorkflows(params)` | GET | `/v1/workflows/visual` |
| `getWorkflow(id)` | GET | `/v1/workflows/visual/:id` |
| `createWorkflow(data)` | POST | `/v1/workflows/visual` |
| `updateWorkflow(id, data)` | PUT | `/v1/workflows/visual/:id` |
| `deleteWorkflow(id)` | DELETE | `/v1/workflows/visual/:id` |
| `duplicateWorkflow(id, name?)` | GET + POST | (client-side) |

`listWorkflows` supports filtering by `is_active`, `tags`, and free-text `search`, plus pagination (`page`, `page_size`, max 100).

`updateWorkflow` treats `nodes` and `edges` as full replacements — pass the complete updated array, not a diff.

`deleteWorkflow` is a soft delete (`is_active = false`). The record is preserved for audit purposes and can be restored by calling `updateWorkflow(id, { is_active: true })`.

### templates.ts

Fetch, create, and instantiate workflow templates. Templates are read-mostly; they are instantiated into full `VisualWorkflow` records by the backend.

### nodeTypes.ts

Fetch the node type catalog (`/v1/node-types`). Returns all available node types with their display metadata and JSON Schema for inputs/outputs/properties. Results are cached for 5 minutes by `useNodeTypes`.

### plugins.ts

Marketplace API: search, install, uninstall, configure, enable/disable, reviews, and metrics. All calls are thin wrappers over `apiClient`. The `usePlugins` hook layer in `src/hooks/` adds React Query caching on top.

### index.ts

Re-exports the most commonly used functions as a single import point:

```typescript
import { createWorkflow, fetchNodeTypes, searchMarketplacePlugins } from '@/lib/api';
```

## websocket/

A production-ready WebSocket client used to receive real-time workflow execution events (node started, node completed, node failed, execution status changes).

### client.ts — `WebSocketClient`

```typescript
const ws = new WebSocketClient({
  url: 'ws://localhost:8000/ws/swarm',
  sessionId: 'session-abc123',
  agentId: 'workflow-monitor',
  debug: true, // optional: logs all messages to console
});

// Subscribe to typed events
ws.on(WSMessageType.NODE_STARTED, (data) => {
  console.log('Node started:', data.node_id);
});

// Subscribe to connection lifecycle
ws.onClientEvent('statusChange', (status) => {
  console.log('Connection status:', status);
});

await ws.connect();

// Later
ws.disconnect(); // clean shutdown, no reconnect attempt
```

The URL is constructed as `{url}/{sessionId}?agent_id={agentId}`.

**Heartbeat.** After connecting, the client sends a `PING` message every 30 seconds and waits up to 10 seconds for a `PONG`. If none arrives, the connection is closed and reconnection begins.

**Reconnection.** On unexpected disconnect the client enters `RECONNECTING` state and retries with exponential backoff. Manual `disconnect()` calls set `manualDisconnect = true` to suppress reconnection.

**Event subscription model.** `on(type, handler)` returns an `EventSubscription` with an `unsubscribe()` method. Always call `unsubscribe()` in `useEffect` cleanup to prevent memory leaks.

### reconnection.ts — `ReconnectionManager`

Implements configurable exponential backoff. Default config: initial delay 1 s, max delay 30 s, max 10 attempts. Consumed internally by `WebSocketClient`.

### events.ts

Defines the `WSMessageType` enum and the `WSMessage` envelope type. Contains `parseWSMessage` to safely parse raw JSON into typed messages and `isMessageType` for discriminated type narrowing.

### index.ts

Re-exports `WebSocketClient`, `WSMessageType`, `ConnectionStatus`, and event types.

## utils.ts

```typescript
import { cn } from '@/lib/utils';
```

`cn(...inputs: ClassValue[])` — Combines class names using `clsx` and resolves Tailwind conflicts with `tailwind-merge`. Use it everywhere you conditionally apply Tailwind classes:

```tsx
<div className={cn('px-4 py-2', isActive && 'bg-blue-500', className)}>
```

Without `tailwind-merge`, concatenating conflicting utilities like `p-4 px-2` would apply both and the winner would be unpredictable. `cn` ensures the last conflicting class wins.
