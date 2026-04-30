# Linear Orchestrator

Advanced Linear integration plugin for Claude Code. Covers the full Linear GraphQL API and provides **two-way integrations** with **Harness Code** and **Microsoft Planner**.

## Highlights

- **22 commands** across the Linear feature surface (issues, cycles, projects, initiatives, customers, SLA, triage, agents, MCP)
- **10 skills** covering GraphQL, OAuth, webhooks, attachments, pagination, rate limiting, agents/AIG, and the two bridges
- **12 specialised agents** (Opus / Sonnet / Haiku) for routing, planning, customer liaison, SLA monitoring, and bridge management
- **Bidirectional sync**: Linear ↔ Harness Code and Linear ↔ Microsoft Planner via webhooks and delta queries
- **Production-grade primitives**: HMAC signature verification, OAuth 2.0 actor authorization, cursor pagination, complexity-budget aware rate limiting, dead-letter queue

## Install

```bash
# Add to your Claude Code marketplace, then:
/plugin install linear-orchestrator
/linear:setup
```

## Quick Start

```bash
# 1. Authenticate
/linear:setup --mode oauth

# 2. Install the Linear MCP server (optional but recommended)
/linear:mcp --install

# 3. Register webhooks (required for two-way sync)
/linear:webhook --register --url https://your-app.example.com/linear/webhook

# 4. Wire up Harness Code two-way sync
/linear:harness-sync --enable --org <org> --project <project>

# 5. Wire up Microsoft Planner two-way sync
/linear:planner-sync --enable --plan-id <plan-id>
```

## Documentation

- `CONTEXT_SUMMARY.md` — bootstrap context
- `CLAUDE.md` — operational guide
- `commands/*.md` — per-command spec
- `skills/*/SKILL.md` — reusable behaviours
- `agents/*.md` — specialist roles
- `docs/architecture.md` — bridge architecture

## License

MIT © Markus Ahling
