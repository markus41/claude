# linear-orchestrator Context Summary

## Plugin purpose
Advanced Linear integration with bidirectional sync to **Harness Code** and **Microsoft Planner**. Implements the full Linear GraphQL API surface (issues, cycles, projects, initiatives, customer requests, SLA, triage, agents/AIG, webhooks, MCP) with OAuth 2.0 actor authorization, attachment uploads, rate limiting, cursor pagination, filtering DSL, and webhook signature verification.

## Bridges
- **Harness Code ↔ Linear**: branch/PR creation from issues, status mirror via webhooks, deploy events → Linear comments + status updates
- **Microsoft Planner ↔ Linear**: bucket/task mirror via Microsoft Graph delta queries, two-way assignee + status sync, attachment passthrough

## Command index
- `commands/setup.md` — auth (API key + OAuth 2.0 + actor authorization), MCP install, webhook registration
- `commands/issue.md` — create/edit/select/delete, parent+sub-issues, templates, labels, priority, estimates, due dates
- `commands/assign.md` — assign / reassign / bulk assign
- `commands/comment.md` — comment on issues, threads, reactions
- `commands/triage.md` — triage queue workflows, auto-triage rules
- `commands/relations.md` — blocks/blocked-by/duplicate/related
- `commands/documents.md` — issue documents + project documents
- `commands/customer.md` — customer requests + managing customers
- `commands/cycle.md` — use cycles, update cycles, velocity
- `commands/project.md` — projects, milestones, status, overview, templates
- `commands/initiative.md` — initiatives, sub-initiatives, updates
- `commands/team.md` — teams, default team pages, settings
- `commands/workflow.md` — configure workflows, statuses, transitions
- `commands/sla.md` — SLA policies, breach alerts, reports
- `commands/agent.md` — Linear agents, agent signals, agent interaction, AIG
- `commands/mcp.md` — Linear MCP install/configure, tool routing
- `commands/webhook.md` — register, verify, replay, dead-letter
- `commands/attachment.md` — file storage auth, multipart upload, link existing
- `commands/diff.md` — Linear diffs (audit trail comparisons)
- `commands/query.md` — GraphQL query/filter/paginate cookbook
- `commands/harness-sync.md` — two-way Harness Code ↔ Linear sync (PRs, deploys)
- `commands/harness-git.md` — Harness Git Experience: bidir sync, signed commits, OAuth, auto-creation, git cache, environments-as-code, pipeline repos, rate-limit best practice
- `commands/harness-platform.md` — Harness Platform: API keys/JWT, custom approvals, tags, triggers, variables/expressions, connectors (YAML), authentication
- `commands/planner-sync.md` — two-way MS Planner ↔ Linear sync

## Agent index
- `agents/linear-architect.md` (opus) — architecture + data model decisions
- `agents/linear-graphql-expert.md` (sonnet) — query optimization + schema navigation
- `agents/linear-issue-curator.md` (sonnet) — issue lifecycle, sub-issues, labels
- `agents/linear-cycle-planner.md` (sonnet) — cycle/sprint planning
- `agents/linear-triage-officer.md` (sonnet) — triage queue resolution
- `agents/linear-customer-liaison.md` (sonnet) — customer request routing
- `agents/linear-sla-monitor.md` (haiku) — SLA breach watcher
- `agents/linear-webhook-engineer.md` (sonnet) — webhook design + verification
- `agents/linear-agent-orchestrator.md` (opus) — Linear agent + AIG signal coordination
- `agents/linear-initiative-planner.md` (opus) — initiative/sub-initiative roadmap
- `agents/harness-linear-bridge.md` (sonnet) — two-way Harness Code sync
- `agents/planner-linear-bridge.md` (sonnet) — two-way MS Planner sync

## Skill index
- `skills/linear-graphql/SKILL.md` — GraphQL schema patterns
- `skills/linear-sdk/SKILL.md` — `@linear/sdk` advanced usage + error handling
- `skills/linear-oauth/SKILL.md` — OAuth 2.0 + actor authorization + file-storage auth
- `skills/linear-webhooks/SKILL.md` — signature verify, replay, idempotency
- `skills/linear-pagination-filtering/SKILL.md` — cursor pagination + filter DSL
- `skills/linear-rate-limiting/SKILL.md` — token bucket, backoff, complexity budget
- `skills/linear-attachments/SKILL.md` — file storage upload flow
- `skills/linear-agents/SKILL.md` — agents-in-linear, agent signals, AIG, agent interaction
- `skills/harness-bridge/SKILL.md` — Harness Code ↔ Linear two-way sync
- `skills/planner-bridge/SKILL.md` — MS Planner ↔ Linear via Microsoft Graph

## Library
- `lib/client.ts` — GraphQL client with rate limit + retry
- `lib/auth.ts` — OAuth + actor token rotation
- `lib/webhook-verify.ts` — HMAC-SHA256 verification
- `lib/pagination.ts` — cursor pagination helpers
- `lib/attachment-upload.ts` — multipart upload to Linear file storage
- `lib/harness-bridge.ts` — Harness Code REST + webhook adapter
- `lib/planner-bridge.ts` — MS Graph delta query adapter
- `lib/queries/*.graphql.ts` — typed query strings (issues, cycles, projects, etc.)

## Configuration
- Secrets via env: `LINEAR_API_KEY`, `LINEAR_OAUTH_CLIENT_ID`, `LINEAR_OAUTH_CLIENT_SECRET`, `LINEAR_WEBHOOK_SECRET`, `HARNESS_API_TOKEN`, `HARNESS_ACCOUNT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`.
- Webhook endpoint must verify `Linear-Signature` HMAC-SHA256 before processing.
- Use Linear's complexity-budget header to stay under rate limits on bulk reads.
