---
description: Production-ready channel server implementations — CI webhook receiver, mobile approval relay, Discord/Telegram bridge, and local fakechat dev profile. Copy-paste starter code with sender allowlists, permission relay, and security hardening.
model: claude-sonnet-4-6
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---

# Channels Bootstrap — Starter Implementations

Four production-ready channel server patterns. Each is runnable with Bun or Node.js,
includes sender allowlists, and handles the security concerns that make channels safe to
deploy. Copy the one that fits your use case, drop it in your repo, and register it in
`.mcp.json`.

> **Prerequisites**: Claude Code v2.1.80+, claude.ai login (not API key), Bun or Node.js
> **Security rule**: Every inbound channel is a prompt injection vector — always gate on
> sender identity before forwarding any content to Claude.

---

## Pattern 1: CI Webhook Receiver

**Use case**: React to CI/CD events (GitHub Actions failures, build completions, deploy
status) without polling. Claude gets notified when a build breaks and can investigate,
post a PR comment, or open a fix branch automatically.

### `channels/ci-webhook.ts`

```typescript
#!/usr/bin/env bun
/**
 * CI Webhook Channel — receives POST events from GitHub Actions, GitLab CI,
 * Jenkins, or any webhook-capable CI system and pushes them into Claude Code.
 *
 * Security: webhook HMAC signature verification (GitHub Actions compatible).
 * Setup: set WEBHOOK_SECRET env var matching your CI platform's secret.
 *
 * Register in .mcp.json:
 *   "ci-webhook": { "command": "bun", "args": ["./channels/ci-webhook.ts"],
 *                   "env": { "WEBHOOK_SECRET": "${WEBHOOK_SECRET}" } }
 *
 * Start:
 *   claude --dangerously-load-development-channels server:ci-webhook
 *
 * Test:
 *   curl -X POST http://127.0.0.1:8788/webhook \
 *     -H "Content-Type: application/json" \
 *     -d '{"action":"completed","workflow_run":{"name":"CI","conclusion":"failure","html_url":"https://github.com/org/repo/actions/runs/123"}}'
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createHmac, timingSafeEqual } from 'crypto'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? ''
const PORT = parseInt(process.env.CI_WEBHOOK_PORT ?? '8788', 10)

// Map CI event types to human-readable summaries for Claude
function summarizeEvent(event: string, body: Record<string, unknown>): string | null {
  switch (event) {
    case 'workflow_run': {
      const run = body.workflow_run as Record<string, unknown>
      if (!run) return null
      if (run.conclusion === 'failure') {
        return `CI FAILURE: Workflow "${run.name}" failed on branch "${run.head_branch}". ` +
               `Commit: ${String(run.head_sha).slice(0, 7)}. ` +
               `Run: ${run.html_url}`
      }
      if (run.conclusion === 'success') {
        return `CI SUCCESS: Workflow "${run.name}" passed on branch "${run.head_branch}".`
      }
      return null  // ignore in-progress events
    }
    case 'push': {
      const commits = (body.commits as unknown[])?.length ?? 0
      const ref = String(body.ref ?? '').replace('refs/heads/', '')
      const pusher = (body.pusher as Record<string, unknown>)?.name ?? 'unknown'
      return `PUSH: ${pusher} pushed ${commits} commit(s) to ${ref}.`
    }
    case 'pull_request': {
      const pr = body.pull_request as Record<string, unknown>
      const action = String(body.action ?? '')
      if (!['opened', 'ready_for_review', 'closed'].includes(action)) return null
      const state = action === 'closed' && body.merged ? 'merged' : action
      return `PR ${state.toUpperCase()}: "${pr?.title}" → ${pr?.base?.branch ?? 'main'}. ` +
             `URL: ${pr?.html_url}`
    }
    case 'deployment_status': {
      const ds = body.deployment_status as Record<string, unknown>
      const env = (body.deployment as Record<string, unknown>)?.environment ?? 'unknown'
      if (ds?.state === 'failure') {
        return `DEPLOY FAILURE: Deployment to ${env} failed. ` +
               `Log: ${ds?.log_url ?? 'no log'}`
      }
      if (ds?.state === 'success') {
        return `DEPLOY SUCCESS: Deployed to ${env}.`
      }
      return null
    }
    default:
      return null
  }
}

// Verify GitHub webhook signature (HMAC-SHA256)
async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true  // no secret configured — allow all (dev mode)
  if (!signature) return false
  const expected = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

const mcp = new Server(
  { name: 'ci-webhook', version: '1.0.0' },
  {
    capabilities: { experimental: { 'claude/channel': {} } },
    instructions:
      'CI and deployment events arrive as <channel source="ci-webhook" event="..." ...>. ' +
      'For FAILURE events: investigate the failure, check recent commits, and propose a fix. ' +
      'For DEPLOY FAILURE: check logs and determine rollback vs hot-fix. ' +
      'For PR events: summarize changes if asked. ' +
      'Do not act on SUCCESS events unless explicitly asked.',
  },
)

await mcp.connect(new StdioServerTransport())

const server = Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  async fetch(req: Request) {
    if (new URL(req.url).pathname !== '/webhook') {
      return new Response('not found', { status: 404 })
    }
    if (req.method !== 'POST') {
      return new Response('method not allowed', { status: 405 })
    }

    const rawBody = await req.text()
    const sig = req.headers.get('x-hub-signature-256')
    if (!(await verifySignature(rawBody, sig))) {
      return new Response('forbidden', { status: 403 })
    }

    const event = req.headers.get('x-github-event') ?? 'unknown'
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return new Response('bad request', { status: 400 })
    }

    const summary = summarizeEvent(event, parsed)
    if (summary === null) {
      return new Response('ok (ignored)')  // don't forward irrelevant events
    }

    await mcp.notification({
      method: 'notifications/claude/channel',
      params: {
        content: summary,
        meta: { event, severity: summary.startsWith('CI FAILURE') || summary.startsWith('DEPLOY FAILURE') ? 'high' : 'info' },
      },
    })

    return new Response('ok')
  },
})

console.error(`CI webhook channel listening on http://127.0.0.1:${PORT}/webhook`)
```

### Registration

```json
{
  "mcpServers": {
    "ci-webhook": {
      "command": "bun",
      "args": ["./channels/ci-webhook.ts"],
      "env": {
        "WEBHOOK_SECRET": "${WEBHOOK_SECRET}",
        "CI_WEBHOOK_PORT": "8788"
      }
    }
  }
}
```

### GitHub Actions Setup

Add a webhook in your repository (Settings → Webhooks → Add webhook):
- **Payload URL**: `http://your-tunnel/webhook` (use ngrok or Cloudflare Tunnel to expose local port)
- **Content type**: `application/json`
- **Secret**: same value as `WEBHOOK_SECRET`
- **Events**: Workflow runs, Push, Pull requests, Deployment statuses

```bash
# Quick local tunnel (for dev/testing)
# Requires ngrok: https://ngrok.com
ngrok http 8788

# Cloudflare Tunnel (persistent, no account needed for quick test)
cloudflared tunnel --url http://127.0.0.1:8788
```

### Claude Startup

```bash
# Load channel with development flag (until your channel is in official marketplace)
claude --dangerously-load-development-channels server:ci-webhook
```

---

## Pattern 2: Mobile Approval Relay

**Use case**: Approve or deny Claude's tool calls from your phone when you're away from
your desk. Forwards tool approval prompts to Telegram (or any chat platform), parses
yes/no responses, relays verdicts back to Claude Code.

Requires Claude Code v2.1.81+.

### `channels/mobile-approval.ts`

```typescript
#!/usr/bin/env bun
/**
 * Mobile Approval Relay — forwards Claude Code permission prompts to Telegram
 * and relays yes/no verdicts back. Lets you approve tool calls from your phone.
 *
 * Prerequisites:
 *   - Telegram bot token (BotFather → /newbot)
 *   - Your Telegram user ID (use @userinfobot to find it)
 *
 * Register in .mcp.json:
 *   "mobile-approval": {
 *     "command": "bun", "args": ["./channels/mobile-approval.ts"],
 *     "env": { "TELEGRAM_TOKEN": "${TELEGRAM_TOKEN}", "ALLOWED_USER_IDS": "${ALLOWED_USER_IDS}" }
 *   }
 *
 * Start:
 *   claude --dangerously-load-development-channels server:mobile-approval
 *
 * Usage: Claude will send approval requests to your Telegram. Reply:
 *   "yes <id>"  → approve
 *   "no <id>"   → deny
 *   "y <id>" / "n <id>" also work
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN ?? ''
const POLL_INTERVAL_MS = 1500

// Parse comma-separated allowed user IDs: "123456789,987654321"
const ALLOWED_USER_IDS = new Set(
  (process.env.ALLOWED_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
)

if (!TELEGRAM_TOKEN) {
  console.error('ERROR: TELEGRAM_TOKEN is required')
  process.exit(1)
}
if (ALLOWED_USER_IDS.size === 0) {
  console.error('WARNING: ALLOWED_USER_IDS not set — all Telegram users can send verdicts!')
}

// --- Telegram API helpers ---

async function telegramPost(method: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Telegram API error (${method}): ${err}`)
  }
  return (await res.json()) as Record<string, unknown>
}

async function sendMessage(chatId: string, text: string): Promise<void> {
  await telegramPost('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' })
}

// Long-poll for Telegram updates
let lastUpdateId = 0
async function getUpdates(): Promise<Array<Record<string, unknown>>> {
  try {
    const result = await telegramPost('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 1,
      allowed_updates: ['message'],
    })
    const updates = (result.result as Array<Record<string, unknown>>) ?? []
    if (updates.length > 0) {
      lastUpdateId = (updates[updates.length - 1].update_id as number)
    }
    return updates
  } catch {
    return []
  }
}

// --- MCP Channel Server ---

const PERMISSION_REPLY_RE = /^\s*(y(?:es)?|n(?:o)?)\s+([a-km-z]{5})\s*$/i

const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

// Track which chat IDs to relay permission requests to (populated after pairing)
const pairedChatIds = new Set<string>()

// Load paired chats from file if exists (survives restarts)
const PAIRED_FILE = '.claude/channels/mobile-approval-paired.json'
try {
  const saved = JSON.parse(await Bun.file(PAIRED_FILE).text())
  if (Array.isArray(saved)) saved.forEach((id: string) => pairedChatIds.add(id))
  console.error(`Loaded ${pairedChatIds.size} paired chat(s)`)
} catch { /* file doesn't exist yet */ }

async function savePaired(): Promise<void> {
  try {
    await Bun.write(PAIRED_FILE, JSON.stringify([...pairedChatIds]))
  } catch { /* ignore write errors */ }
}

const mcp = new Server(
  { name: 'mobile-approval', version: '1.0.0' },
  {
    capabilities: {
      experimental: {
        'claude/channel': {},
        'claude/channel/permission': {},  // enables permission relay
      },
      tools: {},
    },
    instructions:
      'This is a mobile approval relay. When you need tool approval, the request is forwarded to the user\'s phone via Telegram. ' +
      'Wait for the verdict — do not proceed without it when a permission prompt is shown. ' +
      'Inbound messages from paired users arrive as <channel> tags. ' +
      'To pair a new device, tell the user to message the bot and run the pairing flow.',
  },
)

// Handle incoming permission requests from Claude Code
mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  const text =
    `🔐 *Permission Request*\n` +
    `Tool: \`${params.tool_name}\`\n` +
    `Action: ${params.description}\n` +
    `Preview: \`${params.input_preview}\`\n\n` +
    `Reply: \`yes ${params.request_id}\` to approve or \`no ${params.request_id}\` to deny`

  for (const chatId of pairedChatIds) {
    await sendMessage(chatId, text).catch((e) => console.error(`Failed to send to ${chatId}:`, e))
  }
})

// Reply tool (not used in approval relay — verdicts come via Telegram)
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }))
mcp.setRequestHandler(CallToolRequestSchema, async () => {
  throw new Error('No tools on mobile-approval channel')
})

await mcp.connect(new StdioServerTransport())

// --- Telegram polling loop ---

const PAIRING_CODES = new Map<string, string>()  // code → chatId

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

setInterval(async () => {
  const updates = await getUpdates()
  for (const update of updates) {
    const message = update.message as Record<string, unknown> | undefined
    if (!message) continue

    const chatId = String((message.chat as Record<string, unknown>)?.id ?? '')
    const fromId = String((message.from as Record<string, unknown>)?.id ?? '')
    const text = String(message.text ?? '').trim()

    // Security: gate on allowed user IDs
    if (ALLOWED_USER_IDS.size > 0 && !ALLOWED_USER_IDS.has(fromId)) {
      console.error(`Rejected message from unauthorized user ${fromId}`)
      continue
    }

    // Pairing flow: user sends /pair
    if (text === '/pair' || text === '/start') {
      const code = generateCode()
      PAIRING_CODES.set(code, chatId)
      await sendMessage(chatId,
        `Your pairing code is: \`${code}\`\n` +
        `Run in Claude Code: \`/channels pair ${code}\`\n` +
        `(Code expires in 10 minutes)`
      )
      setTimeout(() => PAIRING_CODES.delete(code), 10 * 60 * 1000)
      continue
    }

    // Pairing confirmation from Claude Code (via internal notification)
    // handled below in the channel notification handler

    // Permission verdict: "yes abcde" or "no abcde"
    const verdict = PERMISSION_REPLY_RE.exec(text)
    if (verdict) {
      const allow = verdict[1].toLowerCase().startsWith('y')
      const requestId = verdict[2].toLowerCase()
      await mcp.notification({
        method: 'notifications/claude/channel/permission',
        params: { request_id: requestId, behavior: allow ? 'allow' : 'deny' },
      })
      await sendMessage(chatId, `✅ Verdict sent: ${allow ? 'approved' : 'denied'} (\`${requestId}\`)`)
      continue
    }

    // Handle /activate <code> sent by Claude Code to confirm pairing
    if (text.startsWith('/activate ')) {
      const code = text.slice('/activate '.length).trim()
      if (PAIRING_CODES.has(code)) {
        pairedChatIds.add(chatId)
        await savePaired()
        PAIRING_CODES.delete(code)
        await sendMessage(chatId, '✅ Paired! You will now receive permission requests from Claude Code.')
      } else {
        await sendMessage(chatId, '❌ Invalid or expired code.')
      }
      continue
    }

    // Forward all other messages as channel events to Claude
    if (pairedChatIds.has(chatId)) {
      await mcp.notification({
        method: 'notifications/claude/channel',
        params: {
          content: text,
          meta: { source: 'telegram', chat_id: chatId, from_id: fromId },
        },
      })
    }
  }
}, POLL_INTERVAL_MS)

console.error('Mobile approval relay started. Message your bot on Telegram to pair.')
```

### Quick Setup

```bash
# 1. Create a Telegram bot
# Open Telegram → search @BotFather → /newbot → copy token

# 2. Find your Telegram user ID
# Message @userinfobot on Telegram → copy your ID

# 3. Set environment variables
export TELEGRAM_TOKEN="your-bot-token-here"
export ALLOWED_USER_IDS="your-telegram-user-id"

# 4. Start Claude with the relay
claude --dangerously-load-development-channels server:mobile-approval

# 5. Pair your phone
# In Telegram: message your bot with /pair
# In Claude Code terminal: run the command the bot gives you
```

---

## Pattern 3: Discord Bridge

**Use case**: Two-way bridge between Discord DMs and Claude Code. Ask Claude questions,
get responses, trigger tasks, and approve tool calls — all from Discord. Includes
allowlist-based access control, pairing flow, and optional permission relay.

### `channels/discord-bridge.ts`

```typescript
#!/usr/bin/env bun
/**
 * Discord Bridge Channel — bidirectional bridge between Discord DMs and Claude Code.
 *
 * Prerequisites:
 *   - Discord bot token (Developer Portal → New Application → Bot → Reset Token)
 *   - Enable "Message Content Intent" in bot settings
 *   - Invite bot with: View Channels, Send Messages, Read Message History
 *
 * Register in .mcp.json:
 *   "discord-bridge": {
 *     "command": "bun", "args": ["./channels/discord-bridge.ts"],
 *     "env": { "DISCORD_TOKEN": "${DISCORD_TOKEN}", "ALLOWED_USER_IDS": "${ALLOWED_USER_IDS}" }
 *   }
 *
 * Start:
 *   claude --dangerously-load-development-channels server:discord-bridge
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? ''
const POLL_INTERVAL_MS = 1500

// Allowlist — Discord user IDs (comma-separated)
// Get your ID: Discord → User Settings → Advanced → Enable Developer Mode → right-click username → Copy User ID
const ALLOWED_USER_IDS = new Set(
  (process.env.ALLOWED_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
)

if (!DISCORD_TOKEN) {
  console.error('ERROR: DISCORD_TOKEN is required')
  process.exit(1)
}

const DISCORD_API = 'https://discord.com/api/v10'
const headers = { Authorization: `Bot ${DISCORD_TOKEN}`, 'Content-Type': 'application/json' }

async function discordGet(path: string): Promise<unknown> {
  const res = await fetch(`${DISCORD_API}${path}`, { headers })
  if (!res.ok) throw new Error(`Discord API error: ${res.status} ${await res.text()}`)
  return res.json()
}

async function discordPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${DISCORD_API}${path}`, {
    method: 'POST', headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Discord API error: ${res.status} ${await res.text()}`)
  return res.json()
}

// Track last seen message ID per channel to avoid re-processing
const lastMessageIds = new Map<string, string>()

// Track paired channels (channel_id → user_id mapping)
const pairedChannels = new Map<string, string>()  // Discord channel ID → user ID
const pairedUsers = new Map<string, string>()  // user ID → Discord channel ID (for replies)

const PAIRED_FILE = '.claude/channels/discord-bridge-paired.json'
try {
  const saved = JSON.parse(await Bun.file(PAIRED_FILE).text())
  if (saved.channels) Object.entries(saved.channels).forEach(([ch, u]) => pairedChannels.set(ch, u as string))
  if (saved.users) Object.entries(saved.users).forEach(([u, ch]) => pairedUsers.set(u, ch as string))
  console.error(`Loaded ${pairedChannels.size} paired channel(s)`)
} catch { /* first run */ }

async function savePaired(): Promise<void> {
  try {
    await Bun.write(PAIRED_FILE, JSON.stringify({
      channels: Object.fromEntries(pairedChannels),
      users: Object.fromEntries(pairedUsers),
    }))
  } catch { /* ignore */ }
}

// Split long messages to stay under Discord's 2000-char limit
function splitMessage(text: string, maxLen = 1900): string[] {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    const chunk = text.slice(i, i + maxLen)
    chunks.push(chunk)
    i += maxLen
  }
  return chunks
}

async function sendToDiscord(channelId: string, text: string): Promise<void> {
  const parts = splitMessage(text)
  for (const part of parts) {
    await discordPost(`/channels/${channelId}/messages`, { content: part })
  }
}

// --- Permission relay schema ---
const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

const PERMISSION_REPLY_RE = /^\s*(y(?:es)?|n(?:o)?)\s+([a-km-z]{5})\s*$/i
const PAIRING_CODES = new Map<string, string>()  // code → user_id

function generateCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

const mcp = new Server(
  { name: 'discord-bridge', version: '1.0.0' },
  {
    capabilities: {
      experimental: {
        'claude/channel': {},
        'claude/channel/permission': {},
      },
      tools: {},
    },
    instructions:
      'Discord DM messages from allowlisted users arrive as <channel source="discord-bridge" ...>. ' +
      'Read the message and reply using the discord_reply tool with the user\'s channel_id. ' +
      'Keep replies concise — Discord has a 2000 character limit per message (long replies are split automatically). ' +
      'For permission requests, the prompt is sent to Discord; wait for a yes/no reply. ' +
      'To pair a new user, they DM the bot "!pair" and get a code to provide here.',
  },
)

// Permission relay: forward to all paired Discord channels
mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  const text =
    `🔐 **Permission Request**\n` +
    `Tool: \`${params.tool_name}\`\n` +
    `Action: ${params.description}\n` +
    `Preview: \`${params.input_preview.slice(0, 200)}\`\n\n` +
    `Reply: \`yes ${params.request_id}\` to approve or \`no ${params.request_id}\` to deny`

  for (const [channelId] of pairedChannels) {
    await sendToDiscord(channelId, text).catch((e) => console.error(`Failed to send to ${channelId}:`, e))
  }
})

// Expose discord_reply tool for Claude to send messages back
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'discord_reply',
    description: 'Send a message to a Discord channel (use the channel_id from the inbound <channel> tag)',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: { type: 'string', description: 'Discord channel ID from the inbound event' },
        text: { type: 'string', description: 'Message to send (auto-split if > 2000 chars)' },
      },
      required: ['channel_id', 'text'],
    },
  }],
}))

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'discord_reply') {
    const { channel_id, text } = req.params.arguments as { channel_id: string; text: string }
    if (!pairedChannels.has(channel_id)) {
      return { content: [{ type: 'text', text: 'Error: channel_id is not a paired channel' }] }
    }
    await sendToDiscord(channel_id, text)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`Unknown tool: ${req.params.name}`)
})

await mcp.connect(new StdioServerTransport())

// --- Discord polling loop ---

async function pollChannel(channelId: string): Promise<void> {
  const userId = pairedChannels.get(channelId)
  if (!userId) return

  const lastId = lastMessageIds.get(channelId)
  const path = `/channels/${channelId}/messages?limit=10${lastId ? `&after=${lastId}` : ''}`

  const messages = await discordGet(path) as Array<Record<string, unknown>>
  if (!Array.isArray(messages) || messages.length === 0) return

  // Discord returns newest-first, process oldest-first
  const sorted = messages.slice().sort((a, b) => String(a.id) < String(b.id) ? -1 : 1)

  for (const msg of sorted) {
    const id = String(msg.id ?? '')
    const authorId = String((msg.author as Record<string, unknown>)?.id ?? '')
    const content = String(msg.content ?? '').trim()
    const isBot = (msg.author as Record<string, unknown>)?.bot === true

    lastMessageIds.set(channelId, id)

    if (isBot || !content) continue  // skip bot messages and empty

    // Security gate on sender (owner of this paired channel)
    if (ALLOWED_USER_IDS.size > 0 && !ALLOWED_USER_IDS.has(authorId)) {
      console.error(`Rejected message from unauthorized user ${authorId}`)
      continue
    }

    // Permission verdict
    const verdict = PERMISSION_REPLY_RE.exec(content)
    if (verdict) {
      const allow = verdict[1].toLowerCase().startsWith('y')
      const requestId = verdict[2].toLowerCase()
      await mcp.notification({
        method: 'notifications/claude/channel/permission',
        params: { request_id: requestId, behavior: allow ? 'allow' : 'deny' },
      })
      await sendToDiscord(channelId, `✅ Verdict sent: ${allow ? 'approved' : 'denied'} (\`${requestId}\`)`)
      continue
    }

    // Forward as channel event
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: {
        content,
        meta: { source: 'discord', channel_id: channelId, user_id: authorId },
      },
    })
  }
}

// Poll DMs from un-paired users for !pair commands
let dmChannelCache: string | null = null

async function getBotDMChannel(userId: string): Promise<string> {
  const dm = await discordPost('/users/@me/channels', { recipient_id: userId }) as Record<string, unknown>
  return String(dm.id ?? '')
}

setInterval(async () => {
  // Poll all paired channels
  for (const [channelId] of pairedChannels) {
    await pollChannel(channelId).catch((e) => console.error(`Poll error for ${channelId}:`, e))
  }
}, POLL_INTERVAL_MS)

console.error('Discord bridge started. DM your bot "!pair" to pair.')

// Note: Full !pair flow requires a gateway connection (websocket) to receive DMs from
// new users. For simplicity, pair manually by setting ALLOWED_USER_IDS + running:
//   node -e "require('./channels/discord-bridge.ts')" --pair <user_id>
// Or implement Discord Gateway for full bot capability.
```

### Quick Setup

```bash
# 1. Create bot: discord.com/developers/applications → New Application → Bot
# 2. Enable "Message Content Intent" under Bot → Privileged Gateway Intents
# 3. Invite URL: OAuth2 → URL Generator → bot scope → Send Messages, View Channels

export DISCORD_TOKEN="your-bot-token"
export ALLOWED_USER_IDS="your-discord-user-id"

claude --dangerously-load-development-channels server:discord-bridge
```

---

## Pattern 4: Local Fakechat Dev Profile

**Use case**: Test channel logic locally without any external service. Fakechat is a
built-in Claude Code channel that opens a fake chat UI in a browser tab. Use it to
simulate inbound messages and test your channel logic before connecting real platforms.

### Startup Commands

```bash
# Start fakechat (built-in, no registration needed)
claude --channels fakechat

# Test in another terminal — Claude Code exposes fakechat HTTP endpoint
curl -X POST http://localhost:14714/send \
  -H "Content-Type: application/json" \
  -d '{"text": "run the tests and tell me if they pass"}'
```

### Fakechat Instructions Profile

Add to CLAUDE.md or as a channel instructions file for consistent fakechat behavior:

```markdown
## Fakechat Dev Profile

When running with fakechat:
- Treat all inbound messages as commands from a trusted developer
- Reply concisely — no markdown headers, keep under 200 chars for chat UI
- For commands like "run tests", "check status", "what are you working on": execute and summarize
- For "approve" / "deny" / "yes <id>" / "no <id>": route as permission verdicts
- For code snippets: run them if safe, summarize the output
- Always confirm when a task is complete: "Done: <one-line summary>"
```

### Fakechat `.mcp.json` Entry

Fakechat is built-in but you can augment it with custom instructions:

```json
{
  "mcpServers": {
    "fakechat": {
      "command": "claude",
      "args": ["--channels", "fakechat", "--print"],
      "env": {}
    }
  }
}
```

### Sample Fakechat Test Script

```bash
#!/usr/bin/env bash
# test-channel.sh — validate channel behavior with fakechat

set -euo pipefail

FAKECHAT_PORT="${FAKECHAT_PORT:-14714}"
BASE="http://localhost:${FAKECHAT_PORT}"

send() {
  curl -s -X POST "$BASE/send" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$1\"}"
  sleep 2
}

echo "=== Testing channel responses ==="
send "what branch am I on?"
send "run the tests"
send "show me the last 3 commits"
send "done"
echo "=== Test sequence sent ==="
```

---

## Sender Allowlist Patterns

### Why sender allowlists are critical

A channel without an allowlist forwards **every** inbound message to Claude as if it
came from a trusted user. In a group chat or shared bot, anyone in the chat can inject
arbitrary instructions into your session.

**Always gate on `message.from.id` (user identity), not `message.chat.id` (room/channel identity).**
In group chats, the room ID is shared by all members — gating on room means anyone in
the room can inject prompts.

### Allowlist Patterns

#### Pattern A: Environment variable (simple, single user)

```typescript
const ALLOWED = new Set(process.env.ALLOWED_USER_IDS?.split(',').map(s => s.trim()) ?? [])

if (ALLOWED.size > 0 && !ALLOWED.has(fromId)) {
  console.error(`Dropped message from ${fromId} (not in allowlist)`)
  return  // never emit to mcp.notification()
}
```

#### Pattern B: File-based allowlist (multi-user, runtime-editable)

```typescript
import { readFileSync, watchFile } from 'fs'

let ALLOWED = new Set<string>()

function loadAllowlist() {
  try {
    const lines = readFileSync('.claude/channels/allowlist.txt', 'utf8').split('\n')
    ALLOWED = new Set(lines.map(l => l.trim()).filter(l => l && !l.startsWith('#')))
    console.error(`Allowlist loaded: ${ALLOWED.size} user(s)`)
  } catch {
    ALLOWED = new Set()
    console.error('No allowlist file — all users blocked')
  }
}

loadAllowlist()
watchFile('.claude/channels/allowlist.txt', loadAllowlist)  // hot-reload
```

`.claude/channels/allowlist.txt`:
```
# Telegram/Discord user IDs, one per line
# Lines starting with # are comments
123456789
987654321
```

#### Pattern C: Pairing-based allowlist (dynamic enrollment)

Used in the mobile-approval and Discord bridge patterns above. Users are added to the
allowlist by completing a pairing flow (bot generates code → user provides code to
Claude Code → Claude Code confirms → ID added to persistent set).

**Never skip the confirmation step** — without it, anyone who knows the bot address can
pair themselves.

### Content Sanitization

Even from trusted senders, apply basic sanitization to prevent prompt injection via
crafted message content:

```typescript
function sanitizeContent(text: string): string {
  // Remove XML/HTML tags that could confuse Claude's channel tag parser
  return text
    .replace(/<[^>]+>/g, '[tag removed]')   // strip XML tags
    .replace(/\u0000/g, '')                  // strip null bytes
    .slice(0, 4000)                          // truncate — channels have no hard limit but be defensive
}

// Use before forwarding:
const safe = sanitizeContent(inboundText)
await mcp.notification({ method: 'notifications/claude/channel', params: { content: safe, meta } })
```

---

## Security Checklist

Before deploying any channel to a shared or production environment:

- [ ] Sender allowlist is configured — `ALLOWED_USER_IDS` or allowlist file
- [ ] Allowlist gates on **user ID** not room/chat ID
- [ ] Content is sanitized (XML tags stripped, null bytes removed, length capped)
- [ ] WEBHOOK_SECRET set for webhook channels (HMAC signature verified)
- [ ] Channel server binds to `127.0.0.1` only (never `0.0.0.0` unless behind auth)
- [ ] Paired device list is persisted and auditable (`.claude/channels/`)
- [ ] Pairing codes expire (≤ 10 minutes)
- [ ] Permission relay only forwards to confirmed paired devices
- [ ] Paired file is in `.gitignore` (contains user IDs and chat IDs)
- [ ] No secrets (tokens, IDs) hardcoded in channel source — use env vars

`.gitignore` additions:
```
.claude/channels/*.json
.claude/channels/allowlist.txt
channels/.env
```

---

## See Also

- `channels` skill — full API reference (channel capability, notification format, permission relay fields)
- `channels-user-guide` skill — setup guides for Telegram, Discord, iMessage, Fakechat
- `commands/cc-channels.md` — `/cc-channels bootstrap` to write these files to your project
