# Changelog

## 1.0.0 — 2026-04-30

### Added
- Initial release of `linear-orchestrator`
- 22 commands covering full Linear API surface: issues, cycles, projects, initiatives, customer requests, SLA, triage, agents/AIG, MCP, webhooks, attachments, diffs, query cookbook
- 10 skills: GraphQL, SDK, OAuth, webhooks, pagination/filtering, rate limiting, attachments, agents, harness-bridge, planner-bridge
- 12 agents: architect, graphql-expert, issue-curator, cycle-planner, triage-officer, customer-liaison, sla-monitor, webhook-engineer, agent-orchestrator, initiative-planner, harness-linear-bridge, planner-linear-bridge
- Two-way **Harness Code** sync via webhooks + REST polling
- Two-way **Microsoft Planner** sync via Microsoft Graph delta queries
- Library helpers: GraphQL client, OAuth, webhook signature verification, cursor pagination, attachment upload, bridge adapters
