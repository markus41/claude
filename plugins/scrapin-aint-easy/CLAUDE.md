# scrapin-ain't-easy — Documentation Intelligence Engine

A production-grade Claude Code plugin providing live, graph-traversable API documentation,
an algorithm library, codebase drift detection, and agent prompt drift monitoring. Runs as
an MCP server with 17 tools, 8 agents, 6 slash commands, optional LSP, and continuous
background monitoring via 8 cron jobs.

---

## Interview-First Philosophy (CRITICAL)

**Before generating ANY configuration, setup, or architecture output, you MUST conduct
a comprehensive, interactive interview with the user.** This is non-negotiable.

### Interview Rules

1. **Ask ONE question at a time** — wait for the answer before the next question
2. **NEVER use dates or timelines** unless the user specifically asks for them
3. **Adapt dynamically** — generate follow-up questions based on each answer
4. **Be genuinely curious** — dig deeper on surprising or ambiguous answers
5. **Minimum 15 questions** before generating any output — but don't count, just be thorough
6. **Cover ALL domains** through natural conversation flow:
   - Project identity and purpose
   - Tech stack and architecture
   - Team structure and workflows
   - Testing philosophy and practices
   - Security and compliance requirements
   - Deployment and infrastructure
   - Domain concepts and business rules
   - Code conventions and standards
   - Current pain points and gaps
   - Goals and priorities (NOT timelines)
7. **Never assume** — if something seems obvious, confirm it anyway
8. **Summarize understanding** periodically — "Let me make sure I have this right..."
9. **Look for contradictions** — if answers conflict, ask clarifying questions
10. **End with a synthesis** — present what you've learned and ask "What did I miss?"

### When the Interview Applies

- `/scrapin-setup` or any project configuration task
- First use of the plugin in a new project
- When asked to generate `.claude/` structure, `docs/context/`, or rules
- When asked to "set up" or "configure" anything project-wide

### When the Interview Does NOT Apply

- Direct tool calls (`scrapin_search`, `scrapin_algo_search`, etc.)
- Running drift scans
- Querying the knowledge graph
- Status checks

---

## When to Use Which Tool — Decision Tree

- **Looking up a specific API symbol?**
  → `scrapin_search` (then `scrapin_graph_query` with `include_siblings: true` for context)

- **Need to understand a symbol's relationships?**
  → `scrapin_graph_query` with 1-2 hops

- **Need an algorithm or pattern?**
  → `scrapin_algo_search` first → `scrapin_algo_detail` for code and complexity

- **Checking if docs are current?**
  → `scrapin_diff` for a specific source → `scrapin_code_drift_report` for the whole codebase

- **Suspicious of agent consistency?**
  → `scrapin_agent_drift_status` → `scrapin_agent_drift_detail` for specifics

- **Adding a new doc source?**
  → `scrapin_add_source` → `scrapin_crawl_source`

- **Overall system health?**
  → `scrapin_graph_stats` + `scrapin_cron_status`

---

## Context Efficiency Rules

1. **Always call `scrapin_graph_query` before `scrapin_crawl_source`** — the data may already be indexed
2. **Always include `include_siblings: true`** when answering about a specific symbol — siblings provide essential context
3. **Keep `hops` ≤ 2** unless explicitly requested — deeper traversals return too much noise
4. **Prefer vector search** (`scrapin_search`) for exploratory queries, **graph traversal** for known symbols
5. **Cap responses at 4096 tokens** — use `continue_token` for pagination

---

## Agent Drift Rules (CRITICAL)

1. After ANY edit to `.claude/agents/*.md`, call `scrapin_agent_drift_status` immediately
2. If drift score > 7, **HALT all work** and report to user before continuing
3. If cross-agent contradiction detected, **DO NOT proceed** without user resolution
4. Run `scrapin_agent_drift_acknowledge` only after explicit user confirmation

---

## Algorithm Lookup Rules

1. **Before writing ANY** sorting, searching, graph traversal, or DP algorithm from scratch, call `scrapin_algo_search` first
2. Attach complexity annotations (`// O(n log n) time, O(n) space`) to all written algorithms
3. If an algorithm exists in the library, use it as a reference — don't reinvent

---

## Cron Job Schedule

| Job | Schedule | What it does |
|---|---|---|
| `full-sweep` | Daily 3am | Re-crawl all documentation sources |
| `staleness-check` | Every 30 min | Flag pages older than 7 days as stale |
| `missing-doc-scan` | Every 6 hours | Find symbols without documentation |
| `openapi-sync` | Weekly Monday 1am | Sync OpenAPI specs |
| `embedding-rebuild` | Weekly Sunday 4am | Rebuild vector search index |
| `algo-sweep` | Weekly Sunday 2am | Re-index algorithm sources |
| `code-drift-scan` | Every 4 hours | Scan codebase for API drift |
| `agent-drift-scan` | Every 15 minutes | Check agent files for drift |

---

## Key File References

- `@config/sources.yaml` — Documentation source registry
- `@config/algo-sources.yaml` — Algorithm source registry
- `@config/graph-schema.yaml` — Node/edge type definitions
- `@config/rate-limits.yaml` — Per-source crawl rate limits
- `@config/agent-registry.yaml` — Agent drift detection baselines
- `@data/drift-reports/latest.json` — Most recent drift report (if exists)

---

## Project Setup Flow

When setting up this plugin for a new project:

1. **Interview** — Conduct thorough project interview (see rules above)
2. **Generate** — Based on interview, generate:
   - `CLAUDE.md` tailored to the project
   - `.claude/rules/` with project-specific rules
   - `.claude/skills/` with relevant skills
   - `.claude/templates/` with project-appropriate templates
   - `.claude/agents/` with specialized agents
   - `.claude/hooks/` with automation triggers
   - `docs/context/` with architectural documentation
3. **Configure** — Set up `config/sources.yaml` with the project's documentation sources
4. **Index** — Run initial crawl and algorithm indexing
5. **Baseline** — Establish agent drift baselines
6. **Verify** — Run `/scrapin-status` to confirm everything is healthy
