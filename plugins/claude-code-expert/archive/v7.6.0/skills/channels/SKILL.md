# Channels Reference

> Build MCP servers that push webhooks, alerts, and chat messages into a Claude Code session.
> Requires Claude Code v2.1.80+ (permission relay requires v2.1.81+).
> Research preview — requires claude.ai login; Console/API key auth not supported.

## What Is a Channel

A channel is an MCP server that pushes events into a Claude Code session so Claude can react to things happening outside the terminal. Claude Code spawns it as a subprocess and communicates over stdio.

**One-way channels**: Forward alerts, webhooks, monitoring events for Claude to act on.
**Two-way channels**: Also expose a reply tool so Claude can send messages back.
**Permission relay**: Trusted two-way channels can forward tool approval prompts to remote devices.

### Architecture

```
External System → Your Channel Server (local) ←stdio→ Claude Code Session
```

- **Chat platforms** (Telegram, Discord): Plugin polls platform API, forwards messages to Claude
- **Webhooks** (CI, monitoring): Server listens on local HTTP port, pushes POSTs to Claude

### Built-in Channels (Research Preview)

Telegram, Discord, iMessage, and fakechat are included. Custom channels require `--dangerously-load-development-channels` flag.

## Building a Channel

### Requirements

- `@modelcontextprotocol/sdk` package
- Node.js-compatible runtime (Bun, Node, Deno)
- stdio transport (Claude Code spawns as subprocess)

### Minimal One-Way Channel (Webhook Receiver)

```ts
#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    // This key makes it a channel — Claude Code registers a listener
    capabilities: { experimental: { 'claude/channel': {} } },
    // Added to Claude's system prompt
    instructions: 'Events from the webhook channel arrive as <channel source="webhook" ...>. Read them and act, no reply expected.',
  },
)

await mcp.connect(new StdioServerTransport())

// HTTP server forwards every POST to Claude
Bun.serve({
  port: 8788,
  hostname: '127.0.0.1',
  async fetch(req) {
    const body = await req.text()
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: {
        content: body,
        meta: { path: new URL(req.url).pathname, method: req.method },
      },
    })
    return new Response('ok')
  },
})
```

### Registration (.mcp.json)

```json
{
  "mcpServers": {
    "webhook": { "command": "bun", "args": ["./webhook.ts"] }
  }
}
```

### Testing

```bash
# Start with development flag
claude --dangerously-load-development-channels server:webhook

# In another terminal, send a test event
curl -X POST localhost:8788 -d "build failed on main: https://ci.example.com/run/1234"
```

Events arrive as `<channel>` tags:
```
<channel source="webhook" path="/" method="POST">build failed on main: https://ci.example.com/run/1234</channel>
```

## Server Options

| Field | Type | Description |
|-------|------|-------------|
| `capabilities.experimental['claude/channel']` | `object` | **Required**. Always `{}`. Registers the notification listener. |
| `capabilities.experimental['claude/channel/permission']` | `object` | Optional. Enables permission relay for remote tool approval. |
| `capabilities.tools` | `object` | Two-way only. Always `{}`. Enables MCP tool discovery. |
| `instructions` | `string` | Recommended. Added to Claude's system prompt. Describe events, reply behavior, and routing. |

## Notification Format

Push events via `mcp.notification()` with method `notifications/claude/channel`:

| Field | Type | Description |
|-------|------|-------------|
| `content` | `string` | Event body — becomes body of `<channel>` tag |
| `meta` | `Record<string, string>` | Optional. Each entry becomes a tag attribute (e.g., `chat_id`, `severity`). Keys: letters, digits, underscores only. |

```ts
await mcp.notification({
  method: 'notifications/claude/channel',
  params: {
    content: 'build failed on main',
    meta: { severity: 'high', run_id: '1234' },
  },
})
// Arrives as: <channel source="your-channel" severity="high" run_id="1234">build failed on main</channel>
```

## Two-Way Channels: Reply Tool

Add a reply tool so Claude can send messages back:

1. Add `tools: {}` to capabilities
2. Register `ListToolsRequestSchema` and `CallToolRequestSchema` handlers
3. Update `instructions` to tell Claude when/how to reply

```ts
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'reply',
    description: 'Send a message back over this channel',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'The conversation to reply in' },
        text: { type: 'string', description: 'The message to send' },
      },
      required: ['chat_id', 'text'],
    },
  }],
}))

mcp.setRequestHandler(CallToolRequestSchema, async req => {
  if (req.params.name === 'reply') {
    const { chat_id, text } = req.params.arguments as { chat_id: string; text: string }
    send(`Reply to ${chat_id}: ${text}`)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})
```

## Sender Gating (Security)

**An ungated channel is a prompt injection vector.** Always check sender identity before emitting notifications:

```ts
const allowed = new Set(loadAllowlist())

// Gate on sender identity, NOT room/chat identity
if (!allowed.has(message.from.id)) {
  return  // drop silently
}
await mcp.notification({ ... })
```

Gate on `message.from.id`, not `message.chat.id` — in group chats these differ, and gating on room would let anyone in an allowlisted group inject messages.

### Pairing Flows
- **Telegram/Discord**: User DMs bot → bot sends pairing code → user approves in Claude Code → platform ID added to allowlist
- **iMessage**: Detects user's own addresses from Messages DB at startup, auto-allows

## Permission Relay

Requires Claude Code v2.1.81+. Lets remote users approve/deny tool use from another device.

### How It Works

1. Claude Code generates 5-letter request ID, notifies your server
2. Server forwards prompt + ID to chat app
3. User replies `yes <id>` or `no <id>`
4. Server parses reply into verdict notification back to Claude Code

Local terminal dialog stays open — first answer (local or remote) wins.

### Request ID Format
Five lowercase letters from `a-z` excluding `l` (avoids confusion with `1`/`I`).

### Permission Request Fields

| Field | Description |
|-------|-------------|
| `request_id` | Five-letter ID to echo in verdict |
| `tool_name` | Tool name (e.g., `Bash`, `Write`) |
| `description` | Human-readable summary of tool call |
| `input_preview` | Tool args as JSON, truncated to 200 chars |

### Implementation

```ts
import { z } from 'zod'

// 1. Declare capability
capabilities: {
  experimental: {
    'claude/channel': {},
    'claude/channel/permission': {},  // opt in
  },
  tools: {},
},

// 2. Handle incoming permission requests
const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  send(
    `Claude wants to run ${params.tool_name}: ${params.description}\n\n` +
    `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
  )
})

// 3. Parse verdict from inbound messages
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i

const m = PERMISSION_REPLY_RE.exec(body)
if (m) {
  await mcp.notification({
    method: 'notifications/claude/channel/permission',
    params: {
      request_id: m[2].toLowerCase(),
      behavior: m[1].toLowerCase().startsWith('y') ? 'allow' : 'deny',
    },
  })
  return  // don't also forward as chat
}
```

## Publishing as a Plugin

Wrap your channel in a plugin and publish to a marketplace:
- Users install with `/plugin install`
- Enable per session with `--channels plugin:<name>@<marketplace>`
- Custom marketplace channels still need `--dangerously-load-development-channels`
- Submit to official marketplace for security review and allowlisting
- Team/Enterprise admins can add to `allowedChannelPlugins` list instead

## Troubleshooting

| Symptom | Diagnosis |
|---------|-----------|
| `curl` succeeds but event doesn't reach Claude | Run `/mcp` to check server status. Check `~/.claude/debug/<session-id>.txt` for stderr |
| `curl` fails with "connection refused" | Port not bound or stale process. `lsof -i :<port>` to check, kill stale process |
| "blocked by org policy" | Team/Enterprise admin must enable channels first |
| Permission relay verdict ignored | ID doesn't match open request — check format (5 lowercase letters, no `l`) |

## Key Points

- Channels are MCP servers with `claude/channel` experimental capability
- Events arrive as `<channel source="name" ...>content</channel>` tags
- Two-way channels add `tools: {}` capability and reply tool handlers
- **Always gate inbound messages** on sender identity to prevent prompt injection
- Permission relay requires `claude/channel/permission` capability and v2.1.81+
- Local terminal dialog and remote relay both stay live — first answer wins
- Package as plugin for distribution via marketplace

## See Also

- [Channels user guide](https://code.claude.com/docs/en/channels) — install and use built-in channels
- [Official channel implementations](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins) — Telegram, Discord, iMessage, fakechat
- [MCP documentation](https://code.claude.com/docs/en/mcp) — underlying protocol
- [Plugins](https://code.claude.com/docs/en/plugins) — package channels for distribution
