# /cc-channels — Channels Bootstrap & Configuration

Bootstrap Claude Code channel integrations for your project: generate starter server
implementations, write `.mcp.json` configuration, create pairing instructions, and
configure sender allowlists and security settings.

## Usage

```bash
/cc-channels bootstrap              # Interactive: choose patterns to install
/cc-channels bootstrap --all        # Install all 4 starter patterns
/cc-channels bootstrap ci-webhook   # Install only the CI webhook receiver
/cc-channels bootstrap mobile       # Install only the mobile approval relay
/cc-channels bootstrap discord      # Install only the Discord bridge
/cc-channels bootstrap fakechat     # Install only the fakechat dev profile

/cc-channels list                   # List available channel patterns
/cc-channels status                 # Check which channels are registered in .mcp.json
/cc-channels security               # Audit channel security config (allowlists, secrets)
/cc-channels pair <code>            # Confirm a pairing code from a paired device
/cc-channels test [name]            # Send a test event through a registered channel
```

---

## Patterns Available

| Pattern | Transport | Auth | Permission Relay | Use Case |
|---------|-----------|------|-----------------|----------|
| `ci-webhook` | HTTP POST | HMAC signature | No | React to CI failures, deploys, PRs |
| `mobile` | Telegram poll | User ID allowlist | Yes | Approve tool calls from phone |
| `discord` | Discord poll | User ID allowlist | Yes | Two-way Discord ↔ Claude bridge |
| `fakechat` | Built-in | None (local only) | No | Local dev & testing |

---

## Phase 1: Bootstrap a Channel

### Interactive Mode

When run without `--all` or a pattern name, prompt the user:

```
Which channel patterns do you want to install?

  [1] ci-webhook  — React to CI/CD events (GitHub Actions, deploys)
  [2] mobile      — Approve tool calls from your phone (Telegram)
  [3] discord     — Two-way Discord bridge
  [4] fakechat    — Local dev profile (no external service)

Enter numbers (e.g. "1 2" or "all"):
```

### Generated Files

For each selected pattern, write:

```
channels/
  ci-webhook.ts          # CI webhook receiver (if selected)
  mobile-approval.ts     # Mobile approval relay (if selected)
  discord-bridge.ts      # Discord bridge (if selected)
.claude/
  channels/
    allowlist.txt        # Sender allowlist (with instructions)
    README.md            # Pairing and security guide
```

Plus update or create `.mcp.json` with the channel server registrations.

### For `ci-webhook`

Write `channels/ci-webhook.ts` from the `channels-bootstrap` skill Pattern 1.

Add to `.mcp.json`:
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

Print setup instructions:
```
CI Webhook Channel — Setup Instructions

1. Start Claude with the channel:
   claude --dangerously-load-development-channels server:ci-webhook

2. Set the webhook secret:
   export WEBHOOK_SECRET="$(openssl rand -hex 32)"

3. Expose the local port (choose one):
   ngrok http 8788                          # Quick tunnel (ephemeral URL)
   cloudflared tunnel --url http://127.0.0.1:8788  # Cloudflare Tunnel

4. Register the webhook in GitHub:
   Repository → Settings → Webhooks → Add webhook
   - Payload URL: https://<your-tunnel>/webhook
   - Content type: application/json
   - Secret: <your WEBHOOK_SECRET>
   - Events: Workflow runs, Push, Pull requests, Deployment statuses

5. Test:
   curl -X POST http://127.0.0.1:8788/webhook \
     -d '{"action":"completed","workflow_run":{"name":"CI","conclusion":"failure","head_branch":"main","head_sha":"abc123","html_url":"https://github.com"}}'

Claude will receive: [CI FAILURE: Workflow "CI" failed on branch "main"...]
and automatically begin investigating.
```

### For `mobile` (Telegram Approval Relay)

Write `channels/mobile-approval.ts` from the `channels-bootstrap` skill Pattern 2.

Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "mobile-approval": {
      "command": "bun",
      "args": ["./channels/mobile-approval.ts"],
      "env": {
        "TELEGRAM_TOKEN": "${TELEGRAM_TOKEN}",
        "ALLOWED_USER_IDS": "${TELEGRAM_ALLOWED_USER_IDS}"
      }
    }
  }
}
```

Print setup instructions:
```
Mobile Approval Relay — Setup Instructions

1. Create a Telegram bot:
   - Open Telegram → search @BotFather → send /newbot
   - Follow prompts, copy the token

2. Find your Telegram user ID:
   - Message @userinfobot on Telegram
   - Copy the "Id:" field

3. Set environment variables:
   export TELEGRAM_TOKEN="your-bot-token-here"
   export TELEGRAM_ALLOWED_USER_IDS="your-telegram-user-id"

4. Start Claude with the relay:
   claude --dangerously-load-development-channels server:mobile-approval

5. Pair your phone:
   - Message your bot: /pair
   - Bot sends a code, e.g. "Your pairing code is: XK9M2P"
   - In Claude Code: /cc-channels pair XK9M2P

6. Test permission relay:
   - Run a command that requires approval
   - You'll receive a Telegram message like:
     "🔐 Permission Request
      Tool: Bash
      Action: Run shell command
      Preview: {"command":"git push origin main"}
      Reply: yes abcde to approve or no abcde to deny"
   - Reply "yes abcde" to approve from your phone

Security: ALLOWED_USER_IDS prevents anyone else from sending verdicts to your session.
```

### For `discord`

Write `channels/discord-bridge.ts` from the `channels-bootstrap` skill Pattern 3.

Add to `.mcp.json`:
```json
{
  "mcpServers": {
    "discord-bridge": {
      "command": "bun",
      "args": ["./channels/discord-bridge.ts"],
      "env": {
        "DISCORD_TOKEN": "${DISCORD_TOKEN}",
        "ALLOWED_USER_IDS": "${DISCORD_ALLOWED_USER_IDS}"
      }
    }
  }
}
```

Print setup instructions:
```
Discord Bridge — Setup Instructions

1. Create a Discord bot:
   - discord.com/developers/applications → New Application → Bot
   - Reset Token → copy token

2. Enable Message Content Intent:
   Bot settings → Privileged Gateway Intents → Message Content Intent → Enable

3. Invite the bot:
   OAuth2 → URL Generator → Scopes: bot
   Permissions: View Channels, Send Messages, Read Message History
   Open the generated URL and add to your server

4. Get your Discord user ID:
   Discord → User Settings → Advanced → Enable Developer Mode
   Right-click your username → Copy User ID

5. Set environment variables:
   export DISCORD_TOKEN="your-bot-token"
   export DISCORD_ALLOWED_USER_IDS="your-discord-user-id"

6. Start Claude with the bridge:
   claude --dangerously-load-development-channels server:discord-bridge

7. DM the bot "!pair" to initiate pairing (or add your channel ID directly to allowlist)

8. Now you can DM the bot and Claude will receive and respond to your messages.
   Claude replies using the discord_reply tool with the channel_id from the event.

Permission relay: Claude will DM you for approval when it needs to run a tool.
Reply "yes abcde" or "no abcde" in Discord to approve or deny.
```

### For `fakechat`

No file to write — fakechat is built-in. Print instructions:

```
Fakechat Dev Channel — Setup Instructions

Fakechat is built into Claude Code — no installation required.

1. Start with fakechat:
   claude --channels fakechat

2. A browser window opens with a fake chat UI.
   Type messages to send events to Claude.

3. Or use the HTTP API:
   curl -X POST http://localhost:14714/send \
     -H "Content-Type: application/json" \
     -d '{"text": "run the tests and tell me if they pass"}'

Use fakechat to:
- Test your channel instructions before connecting real platforms
- Demo channel behavior without external accounts
- Develop and debug channel-aware Claude Code workflows

Note: Fakechat has no sender authentication — only use it locally.
```

---

## Phase 2: Allowlist Configuration

Write `.claude/channels/allowlist.txt`:

```
# Claude Code Channel Sender Allowlist
# =====================================
# Add user IDs (Telegram IDs, Discord IDs, etc.) one per line.
# Lines starting with # are comments.
# This file is watched at runtime — edit to add/remove users without restart.
#
# IMPORTANT: Gate on USER ID, not room/channel ID.
# In group chats, the room ID is shared by all members.
# Gating on room ID lets anyone in the room inject prompts.
#
# HOW TO FIND USER IDs:
# - Telegram: message @userinfobot
# - Discord: User Settings → Advanced → Developer Mode → right-click username → Copy User ID
#
# Add your user IDs below:
```

Write `.claude/channels/README.md`:

```markdown
# Claude Code Channels — Security Guide

## What are channels?

Channels are MCP servers that push events into your running Claude Code session so
Claude can react to external events without you being at the terminal.

## Security Model

Every channel is a potential prompt injection vector. An ungated channel accepts
messages from anyone who can reach the bot or endpoint.

### Rules

1. **Always check sender identity** before emitting notifications to Claude.
   Gate on `user_id` / `from_id`, not `chat_id` / `channel_id`.

2. **Use HMAC verification for webhooks** (see WEBHOOK_SECRET).

3. **Bind HTTP listeners to 127.0.0.1**, not 0.0.0.0.

4. **Never expose webhook endpoints without authentication** (signature or API key).

5. **Pair devices explicitly** — no auto-approval of new senders.

6. **Keep paired device files out of git** — they contain real user IDs.

## Files

| File | Purpose | Commit to git? |
|------|---------|---------------|
| `allowlist.txt` | Sender allowlist (user IDs) | No — contains user data |
| `*-paired.json` | Paired device state | No — contains user data |
| `channels/*.ts` | Channel server source | Yes |
| `.mcp.json` | Channel server registration | Yes (no secrets — env vars only) |

## Pairing a New Device

1. For Telegram: message your bot `/pair`
2. Bot returns a code, e.g. `XK9M2P`
3. In Claude Code: `/cc-channels pair XK9M2P`
4. Device is added to paired list — future messages are forwarded to Claude

## Removing a Paired Device

Delete the entry from `.claude/channels/*-paired.json` and restart the channel server.

## Revoking Access

Remove the user ID from `allowlist.txt`. The file is watched — no restart needed.
```

---

## Phase 3: Security Audit Mode

When run with `/cc-channels security`:

Check each registered channel in `.mcp.json` for:

1. **Allowlist configured?** — Look for `ALLOWED_USER_IDS` in env
2. **Secrets as env vars?** — Check for hardcoded tokens in args (FAIL if found)
3. **Port binding** — Check source for `0.0.0.0` (WARN)
4. **HMAC verification** — Check ci-webhook.ts for `verifySignature` call
5. **Paired files in .gitignore** — Check `.gitignore` for `*-paired.json`

Output:
```
=== Channel Security Audit ===

ci-webhook
  ✓ WEBHOOK_SECRET referenced as env var
  ✓ Binds to 127.0.0.1
  ✓ HMAC signature verification present
  ✗ .claude/channels/*-paired.json not in .gitignore — ADD THIS

mobile-approval
  ✓ ALLOWED_USER_IDS configured
  ✓ TELEGRAM_TOKEN as env var
  ✓ Pairing codes expire (10 min)
  ✓ Paired file in .claude/channels/ (ensure .gitignored)

discord-bridge
  ✓ ALLOWED_USER_IDS configured
  ✓ DISCORD_TOKEN as env var
  ✓ Messages gated on user_id not channel_id
  ✗ discord-bridge-paired.json not in .gitignore — ADD THIS

Recommendations:
1. Add to .gitignore:
   .claude/channels/*.json
   .claude/channels/allowlist.txt
```

---

## Phase 4: Status Check

When run with `/cc-channels status`:

```
=== Registered Channels ===

Channel       | Pattern        | Status    | Last Event
--------------|----------------|-----------|------------
ci-webhook    | HTTP receiver  | Running   | 2026-03-31 09:14 (workflow_run failure)
mobile        | Telegram relay | Running   | 2026-03-31 08:55 (permission verdict: allowed)
discord       | Discord bridge | Stopped   | —

To start stopped channels:
  claude --dangerously-load-development-channels server:discord

To start all registered channels:
  claude --dangerously-load-development-channels server:ci-webhook,mobile,discord
```

---

## Phase 5: Test a Channel

When run with `/cc-channels test [name]`:

```bash
# Test ci-webhook
curl -X POST http://127.0.0.1:8788/webhook \
  -H "Content-Type: application/json" \
  -H "x-github-event: workflow_run" \
  -d '{"action":"completed","workflow_run":{"name":"CI","conclusion":"failure","head_branch":"main","head_sha":"abc1234","html_url":"https://github.com/org/repo/actions/runs/999"}}'

# Expected: Claude receives CI FAILURE event and begins investigation

# Test fakechat
curl -X POST http://localhost:14714/send \
  -H "Content-Type: application/json" \
  -d '{"text": "what is the current git status?"}'
```

---

## Common Questions

### What's the difference between channels and MCP tools?

MCP tools are **pull** — Claude queries them during a task. Channels are **push** — they
notify Claude when something external happens. Use MCP tools for data lookup; use channels
for event reaction.

### Do channels work with cloud tasks?

No. Channels require a running local Claude Code session to push events into. Cloud tasks
run in ephemeral Anthropic-hosted environments with no persistent session. For cloud-side
event reaction, use GitHub Actions + `claude-code-action` instead.

### Does Claude respond automatically to channel events?

Yes — Claude reads the `<channel>` tag and acts on it within the same session context.
The channel server's `instructions` field controls how Claude should respond (see each
pattern's server implementation).

### What happens if I close Claude while a channel event arrives?

The event is lost — channels only deliver while the session is open. For always-on
reaction, keep Claude running in a persistent terminal (tmux, screen) or use a Desktop
scheduled task (`/cc-schedule`) that re-opens the session on a schedule.

---

## See Also

- `channels` skill — full API reference (channel capability, notification format, permission relay)
- `channels-user-guide` skill — setup guides for Telegram, Discord, iMessage, Fakechat built-in channels
- `channels-bootstrap` skill — the 4 starter server implementations (copy-paste ready)
- `scheduled-tasks` skill — complement channels with scheduled re-invocation
