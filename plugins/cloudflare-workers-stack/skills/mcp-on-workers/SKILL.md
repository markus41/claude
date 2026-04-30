---
name: MCP Servers on Workers
description: Use when the user asks about Model Context Protocol servers hosted as Cloudflare Workers, McpServer SDK, Streamable HTTP transport, MCP tools/resources/prompts, or building MCP services for Claude/agentic apps.
version: 0.1.0
---

# MCP Servers on Cloudflare Workers

The Discovery Co-Pilot stack ships **5 MCP servers as Workers** (methodology-mcp, past-meetings-mcp, engagements-mcp, roi-models-mcp, deliverables-mcp). This is a forward-looking pattern: every internal capability gets exposed as MCP, so Claude (or any LLM agent) can call it via a single protocol.

## Why MCP-on-Workers

- **Edge latency** for LLM tool calls (<100ms anywhere)
- **Per-tenant isolation** via service bindings to your auth Worker
- **Stateless / stateful flexibility** — DOs for sessions, KV/D1 for cached data
- **Versioned** like any Worker; gradual rollout supported
- **Public-facing or service-bound** — same code, different routing

## Stack

```bash
pnpm add @modelcontextprotocol/sdk
pnpm add -D @cloudflare/workers-types wrangler
```

The `@modelcontextprotocol/sdk` package (TypeScript SDK) ships transports including **Streamable HTTP**, which is what runs on Workers. The legacy stdio transport doesn't apply here.

## Minimal MCP Worker

```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export interface Env {
  D1: D1Database;
  AUTH: Fetcher;        // service binding to oauth-provider
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    // Verify JWT via service binding
    const verified = await env.AUTH.fetch(new Request('http://internal/verify', {
      method: 'POST',
      headers: { 'Authorization': req.headers.get('Authorization') ?? '' },
    }));
    if (!verified.ok) return new Response('Unauthorized', { status: 401 });
    const { tenantId, userId } = await verified.json<{ tenantId: string; userId: string }>();

    // Build a fresh MCP server per request (stateless mode is simplest at the edge)
    const server = new McpServer({ name: 'engagements-mcp', version: '1.0.0' });
    registerTools(server, env, { tenantId, userId });
    registerResources(server, env, { tenantId });

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);

    // Adapt Worker Request/Response to Node-style req/res that the transport expects
    const body = await req.json();
    const { req: nodeReq, res: nodeRes, response } = await adaptRequest(req, body);
    await transport.handleRequest(nodeReq, nodeRes, body);
    return response();
  }
};
```

A small adapter converts Cloudflare's `Request`/`Response` to the Node-shaped interface the transport library expects. Many production setups use Hono with the official Cloudflare adapter, which removes that boilerplate:

```typescript
import { Hono } from 'hono';
import { streamableHttpTransport } from 'mcp-cloudflare-adapter';   // community

const app = new Hono<{ Bindings: Env }>();
app.post('/mcp', streamableHttpTransport(buildMcpServer));
export default app;
```

(Use the official adapter if/when MCP ships one — see the modelcontextprotocol/typescript-sdk docs for current Worker examples.)

## Tools

```typescript
function registerTools(server: McpServer, env: Env, ctx: { tenantId: string; userId: string }) {
  server.registerTool(
    'search_engagements',
    {
      description: 'Search engagements by client name or status',
      inputSchema: z.object({
        query: z.string().min(1).describe('Free-text search query'),
        status: z.enum(['active', 'completed', 'paused']).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    },
    async ({ query, status, limit }) => {
      let sql = 'SELECT id, client, status, started_at FROM engagements WHERE tenant_id = ? AND (client LIKE ? OR notes LIKE ?)';
      const args: unknown[] = [ctx.tenantId, `%${query}%`, `%${query}%`];
      if (status) { sql += ' AND status = ?'; args.push(status); }
      sql += ' ORDER BY started_at DESC LIMIT ?';
      args.push(limit);

      const { results } = await env.D1.prepare(sql).bind(...args).all();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2),
        }]
      };
    }
  );

  server.registerTool(
    'create_engagement',
    {
      description: 'Create a new engagement record',
      inputSchema: z.object({
        client: z.string(),
        scope: z.string(),
      }),
    },
    async ({ client, scope }) => {
      const id = crypto.randomUUID();
      await env.D1.prepare('INSERT INTO engagements (id, tenant_id, client, scope, status, started_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, ctx.tenantId, client, scope, 'active', new Date().toISOString())
        .run();
      return {
        content: [{ type: 'text', text: `Created engagement ${id}` }],
        structuredContent: { id, client, scope },
      };
    }
  );
}
```

## Resources

```typescript
function registerResources(server: McpServer, env: Env, ctx: { tenantId: string }) {
  server.registerResource(
    'engagement',
    'engagement://{id}',
    {
      description: 'Full engagement record by id',
      mimeType: 'application/json',
    },
    async (uri, { id }) => {
      const row = await env.D1.prepare('SELECT * FROM engagements WHERE id = ? AND tenant_id = ?')
        .bind(id, ctx.tenantId).first();
      if (!row) throw new Error('not found');
      return {
        contents: [{
          uri: uri.toString(),
          mimeType: 'application/json',
          text: JSON.stringify(row),
        }]
      };
    }
  );
}
```

## Prompts

Prompts let MCP clients enumerate canned LLM prompts your server provides:

```typescript
server.registerPrompt(
  'summarize_engagement',
  {
    description: 'Generate a 1-paragraph summary of an engagement',
    arguments: [
      { name: 'engagementId', description: 'Engagement id', required: true },
    ],
  },
  async ({ engagementId }) => {
    const row = await env.D1.prepare('SELECT * FROM engagements WHERE id = ? AND tenant_id = ?')
      .bind(engagementId, ctx.tenantId).first();
    return {
      messages: [
        { role: 'user', content: { type: 'text', text: `Summarize this engagement: ${JSON.stringify(row)}` } }
      ]
    };
  }
);
```

## Stateless vs stateful

| Mode | Use when |
|------|----------|
| **Stateless** (`sessionIdGenerator: undefined`) — new server per request | Simple tool calls, idempotent |
| **Stateful** (UUID generator + map of transports) — one server per session id | Long agentic conversations, sampling, progress notifications |

For Workers, **stateless** is the default. If you need sessions, store the session id in DO and route via service binding so the same request goes to the same DO each time:

```typescript
const sid = req.headers.get('mcp-session-id') ?? crypto.randomUUID();
const id = env.MCP_SESSION.idFromName(sid);
return env.MCP_SESSION.get(id).fetch(req);   // DO holds the McpServer instance
```

## Wrangler config

```jsonc
{
  "name": "engagements-mcp",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-15",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "d1_databases": [{ "binding": "D1", "database_name": "lobbi-engagements-cache", "database_id": "..." }],
  "services": [{ "binding": "AUTH", "service": "oauth-provider" }],
  "routes": [{ "pattern": "mcp.example.com/engagements", "zone_name": "example.com" }]
}
```

## Client connection (from Claude Desktop / Claude Code)

```json
{
  "mcpServers": {
    "engagements": {
      "url": "https://mcp.example.com/engagements",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

Streamable HTTP transport is supported by Claude Desktop and Claude Code (and growing client list).

## Auth model

Three layers:
1. **Network** — Cloudflare WAF rules to block known-bad IPs
2. **Identity** — JWT in `Authorization`, verified via `oauth-provider` service binding
3. **Tool-level authorization** — inside each tool, recheck what `tenantId` is allowed to do

Never trust `tenantId` from the request body — only from a verified token.

## Versioning

Serve multiple versions on different routes:
```jsonc
"routes": [
  { "pattern": "mcp.example.com/engagements/v1", "zone_name": "example.com" },
  { "pattern": "mcp.example.com/engagements/v2", "zone_name": "example.com" }
]
```

Or use the same Worker with a path prefix and branch on the path. Old MCP clients keep working while you iterate.

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

describe('engagements-mcp', () => {
  it('exposes search_engagements tool', async () => {
    const init = await fetch('http://localhost/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } }
      }),
    });
    expect(init.ok).toBe(true);

    const list = await fetch('http://localhost/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    });
    const data = await list.json();
    expect(data.result.tools.map((t: any) => t.name)).toContain('search_engagements');
  });
});
```

## Pitfalls

- **stdio transport on Workers**: doesn't work. Use Streamable HTTP.
- **Building one McpServer per Worker module top-level** in stateless mode: each request must get a fresh instance — instances aren't safe to share across concurrent requests.
- **Forgetting `nodejs_compat`**: the SDK uses `Buffer` and stream APIs.
- **Returning structured-only content**: most clients render `content[0].text`. Always include a human-readable text block alongside structured JSON.
- **Tool input schema using non-zod**: SDK expects zod for runtime validation. Plain JSON Schema is supported but loses static types.
- **Auth fail returning 200**: must return 401, otherwise MCP clients silently consider the server up but tools all fail.
- **Cross-tenant leak**: never let a tool return rows it didn't filter by `tenant_id` from the verified token.
