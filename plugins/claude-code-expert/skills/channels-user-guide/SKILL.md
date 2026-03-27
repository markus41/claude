# Channels User Guide

> Push events into a running Claude Code session with channels.
> Forward CI results, chat messages, monitoring alerts, and webhook events so Claude can react while you're away.
> Requires Claude Code v2.1.80+. Research preview — requires claude.ai login.

## Overview

A channel is an MCP server that pushes events into your running Claude Code session, so Claude can react to things that happen while you're not at the terminal. Channels can be two-way: Claude reads the event and replies back through the same channel, like a chat bridge.

Events only arrive while the session is open. For always-on setups, run Claude in a background process or persistent terminal.

### Key Differences from Other Features

| Feature | What it does | Good for |
|---------|-------------|----------|
| Claude Code on the web | Runs tasks in a fresh cloud sandbox, cloned from GitHub | Delegating self-contained async work |
| Claude in Slack | Spawns a web session from an `@Claude` mention | Starting tasks from team conversation |
| Standard MCP server | Claude queries it during a task; nothing is pushed | On-demand access to read or query |
| Remote Control | Drive your local session from claude.ai or mobile | Steering an in-progress session remotely |
| **Channels** | **Push events from external sources into running session** | **CI alerts, chat bridges, webhooks, monitoring** |

Channels fill the gap by pushing events from non-Claude sources into your already-running local session.

## Supported Channels

### Telegram

1. **Create bot**: Open [BotFather](https://t.me/BotFather), send `/newbot`, copy the token
2. **Install**: `/plugin install telegram@claude-plugins-official`
3. **Configure**: `/telegram:configure <token>` (saves to `~/.claude/channels/telegram/.env`)
4. **Start**: `claude --channels plugin:telegram@claude-plugins-official`
5. **Pair**: Message your bot on Telegram, get pairing code, run `/telegram:access pair <code>`
6. **Lock down**: `/telegram:access policy allowlist`

### Discord

1. **Create bot**: [Discord Developer Portal](https://discord.com/developers/applications) → New Application → Bot → Reset Token
2. **Enable Message Content Intent**: Bot settings → Privileged Gateway Intents → Message Content Intent
3. **Invite**: OAuth2 → URL Generator → `bot` scope → View Channels, Send Messages, Send Messages in Threads, Read Message History, Attach Files, Add Reactions
4. **Install**: `/plugin install discord@claude-plugins-official`
5. **Configure**: `/discord:configure <token>`
6. **Start**: `claude --channels plugin:discord@claude-plugins-official`
7. **Pair**: DM your bot, get code, run `/discord:access pair <code>`
8. **Lock down**: `/discord:access policy allowlist`

### iMessage (macOS only)

Reads Messages database directly, sends replies through AppleScript. No bot token needed.

1. **Grant Full Disk Access**: System Settings → Privacy & Security → Full Disk Access → add your terminal
2. **Install**: `/plugin install imessage@claude-plugins-official`
3. **Start**: `claude --channels plugin:imessage@claude-plugins-official`
4. **Self-chat**: Text yourself — bypasses access control automatically
5. **Allow others**: `/imessage:access allow +15551234567` (phone or Apple ID email)

### Fakechat (Demo)

Localhost demo channel — no authentication, no external services.

1. **Install**: `/plugin install fakechat@claude-plugins-official`
2. **Start**: `claude --channels plugin:fakechat@claude-plugins-official`
3. **Open UI**: [http://localhost:8787](http://localhost:8787) and type a message
4. Events arrive as `<channel source="fakechat">` tags

## Build & Pipeline Use Cases

Channels are especially powerful for CI/CD and infrastructure workflows:

### CI/CD Webhook Channel
Push build failures, test results, and deployment status directly into your session:
- **Build failure alerts**: Claude receives the failure, reads the build log, and starts investigating
- **Test result streaming**: Failed test details arrive where Claude has your code open
- **Deploy status**: Post-deploy health checks forwarded for Claude to monitor

### Monitoring & Alerting Channel
Forward monitoring events so Claude can react:
- **Error tracker webhooks**: Sentry/Datadog alerts arrive for immediate root-cause analysis
- **Infrastructure alerts**: CPU spikes, OOM events, pod restarts
- **Log anomalies**: Stream unusual log patterns for Claude to investigate

### Pipeline Approval Channel
Use the permission relay for remote deployment approvals:
- Claude proposes a deployment action
- Approval prompt forwarded to your phone via Telegram/Discord
- You approve remotely, deployment proceeds

### Example: GitHub Actions Webhook → Channel
```
GitHub Actions → webhook POST to localhost:8788 → Channel Server → Claude Code Session
                                                                    ↓
                                                              Claude reads build log,
                                                              identifies failure,
                                                              proposes fix
```

## Security

### Sender Allowlists
Every channel maintains a sender allowlist. Only approved IDs can push messages — everyone else is silently dropped.

**Telegram/Discord pairing flow**:
1. Send any message to your bot
2. Bot replies with pairing code
3. Approve in Claude Code: `/telegram:access pair <code>` or `/discord:access pair <code>`
4. Lock to allowlist: `/telegram:access policy allowlist`

**iMessage**: Self-chat bypasses automatically. Add others with `/imessage:access allow`.

### Important Security Notes
- Being in `.mcp.json` isn't enough — server must also be named in `--channels`
- Allowlist also gates permission relay — only allowlist senders you trust with tool approval authority
- Gate on `message.from.id`, not `message.chat.id` (prevents group chat injection)

## Enterprise Controls

On Team and Enterprise plans, channels are **off by default**.

| Setting | Purpose | When not configured |
|---------|---------|-------------------|
| `channelsEnabled` | Master switch. Must be `true` for any channel to deliver messages. | Channels blocked |
| `allowedChannelPlugins` | Which plugins can register. Replaces Anthropic-maintained list when set. | Anthropic default list applies |

### Enable for organization
Admin console: **claude.ai → Admin settings → Claude Code → Channels** or set `channelsEnabled: true` in managed settings.

### Restrict plugins
```json
{
  "channelsEnabled": true,
  "allowedChannelPlugins": [
    { "marketplace": "claude-plugins-official", "plugin": "telegram" },
    { "marketplace": "claude-plugins-official", "plugin": "discord" },
    { "marketplace": "acme-corp-plugins", "plugin": "internal-alerts" }
  ]
}
```

When set, replaces the Anthropic allowlist entirely. Leave unset for default. Empty array blocks all plugins from allowlist (but `--dangerously-load-development-channels` still works).

## Running Channels

```bash
# Single channel
claude --channels plugin:telegram@claude-plugins-official

# Multiple channels (space-separated)
claude --channels plugin:telegram@claude-plugins-official plugin:fakechat@claude-plugins-official

# Development channel (custom/local)
claude --dangerously-load-development-channels server:my-webhook
```

## Research Preview Notes

- Rolling out gradually — `--channels` flag syntax may change
- Only plugins from Anthropic allowlist (or org allowlist) accepted
- Default approved set: [claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins)
- Test custom channels with `--dangerously-load-development-channels`

## See Also

- [Channels Reference](../channels/SKILL.md) — Build your own channel (MCP server implementation)
- [MCP Documentation](https://code.claude.com/docs/en/mcp) — Underlying protocol
- [Plugins](https://code.claude.com/docs/en/plugins) — Package channels for distribution
- [Remote Control](https://code.claude.com/docs/en/remote-control) — Drive sessions remotely
- [Scheduled Tasks](https://code.claude.com/docs/en/scheduled-tasks) — Poll on a timer instead of reacting to pushed events
