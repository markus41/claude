# Linear Orchestrator Plugin Guide

## Purpose
Operational guide for working safely in `plugins/linear-orchestrator`. Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `setup` (see `commands/setup.md`) — auth + MCP + webhooks
- `issue` (see `commands/issue.md`) — CRUD + sub-issues + templates
- `assign` (see `commands/assign.md`)
- `comment` (see `commands/comment.md`)
- `triage` (see `commands/triage.md`)
- `relations` (see `commands/relations.md`)
- `documents` (see `commands/documents.md`)
- `customer` (see `commands/customer.md`)
- `cycle` (see `commands/cycle.md`)
- `project` (see `commands/project.md`)
- `initiative` (see `commands/initiative.md`)
- `team` (see `commands/team.md`)
- `workflow` (see `commands/workflow.md`)
- `sla` (see `commands/sla.md`)
- `agent` (see `commands/agent.md`)
- `mcp` (see `commands/mcp.md`)
- `webhook` (see `commands/webhook.md`)
- `attachment` (see `commands/attachment.md`)
- `diff` (see `commands/diff.md`)
- `query` (see `commands/query.md`)
- `harness-sync` (see `commands/harness-sync.md`) — PRs, branches, deploys
- `harness-git` (see `commands/harness-git.md`) — Git Experience advanced features
- `harness-platform` (see `commands/harness-platform.md`) — API keys, triggers, approvals, connectors
- `planner-sync` (see `commands/planner-sync.md`)

## Architecture

### Auth Layers
1. **API key** — service-account flow (`Authorization: <key>`)
2. **OAuth 2.0** — interactive user flow with `actor=user|app` parameter
3. **OAuth Actor Authorization** — required when posting on behalf of users from agent integrations

### Two-Way Sync Bridges
| Bridge | Linear → External | External → Linear |
|--------|-------------------|-------------------|
| Harness Code | Issue create → branch/PR; status change → PR label | PR merged → issue Done; deploy event → comment |
| MS Planner | Issue create → Planner task; assignee → task assignee | Task complete → issue Done; comment → comment |

Both bridges use Linear webhooks + remote delta queries for idempotent reconciliation. State is tracked in `lib/state.ts` (cursor + last-seen IDs).

## Prohibited Actions
- Do not commit secrets. Use `LINEAR_API_KEY`, `LINEAR_WEBHOOK_SECRET`, `HARNESS_API_TOKEN`, `GRAPH_CLIENT_SECRET` env vars.
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not bypass webhook signature verification.
- Do not poll Linear at intervals shorter than the rate limit allows — use webhooks first.
- Do not store Linear actor tokens beyond their TTL.

## Required Validation Checks
- Run `pnpm check:marketplace` (validates this plugin's manifest + frontmatter)
- Run `npx tsc --noEmit` if TypeScript files were changed
- Hand-test the GraphQL query against Linear's `https://api.linear.app/graphql` endpoint when adding new queries

## Context Budget
Load in this order, stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. The specific `commands/<name>.md` for the requested operation
3. Related `skills/<name>/SKILL.md` only if implementing
4. `lib/` only when modifying behavior

## Escalation Path
- If Linear schema has changed: re-run `npx graphql-codegen` against `https://api.linear.app/graphql` and reconcile types
- If a webhook delivery fails twice: route to dead-letter queue (`lib/webhook-dlq.ts`); do not auto-retry beyond 3 attempts
- If Harness/Planner credentials are missing: degrade gracefully (one-way Linear-only mode), warn the user, do NOT silently skip writes

## Key References
- Linear docs root: https://linear.app/docs
- Linear developers: https://linear.app/developers
- Apollo Studio schema: https://studio.apollographql.com/public/Linear-API/variant/current/schema/reference
- Harness Code REST: https://apidocs.harness.io/tag/Code-Repositories
- MS Graph Planner: https://learn.microsoft.com/en-us/graph/api/resources/planner-overview
