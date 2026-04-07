---
description: Documentation intelligence engine with graph-based API docs, algorithm library, and drift detection
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# scrapin-ain't-easy

Documentation intelligence engine, algorithm library, and codebase/agent drift detection system.

---

## MCP Tool Reference

### Documentation Search & Graph

```
# Semantic search across all indexed content
scrapin_search(query: "useQuery mutation", limit: 10, label_filter: "Symbol")

# Graph traversal from a known node
scrapin_graph_query(start_id: "react-query:useQuery", hops: 2, include_siblings: true)
# Cypher equivalent: MATCH (s:Symbol {id: 'react-query:useQuery'})-[*1..2]-(n) RETURN n

# LSP-style hover lookup
scrapin_lsp_hover(symbol: "PaymentIntent", package_hint: "stripe")
```

### Algorithm Library

```
# Search algorithms by description
scrapin_algo_search(query: "find shortest path in weighted graph", category: "graph", language: "ts")

# Get full detail for one algorithm
scrapin_algo_detail(name: "dijkstra")
# Returns: description, time/space complexity, TypeScript + Python code, related algos
```

### Documentation Crawling

```
# Trigger crawl for a source
scrapin_crawl_source(source_key: "stripe", force: true)

# Show changes since last crawl
scrapin_diff(source_key: "anthropic")

# Register a new source
scrapin_add_source(key: "fastify", name: "Fastify", base_url: "https://fastify.dev/docs", package_aliases: ["fastify"])

# Register a new algorithm source
scrapin_add_algo_source(key: "leetcode-patterns", url: "https://seanprashad.com/leetcode-patterns", type: "single_page")
```

### Drift Detection

```
# Scan codebase for API drift
scrapin_code_drift_scan(project_root: "/path/to/project")

# Get latest code drift report
scrapin_code_drift_report()

# Check all agents for drift
scrapin_agent_drift_status()

# Get detail for one agent
scrapin_agent_drift_detail(agent_id: "backend-architect")

# Acknowledge intentional drift
scrapin_agent_drift_acknowledge(agent_id: "backend-architect", notes: "Updated for v2 API")

# Show exact diff since baseline
scrapin_agent_drift_diff(agent_id: "backend-architect")
```

### System Health

```
# Graph statistics
scrapin_graph_stats()

# Cron job status
scrapin_cron_status()
```

---

## Graph Query Patterns

### Find all symbols in a module
```
scrapin_graph_query(start_id: "stripe:payments", hops: 1, edge_types: ["BELONGS_TO"])
# Cypher: MATCH (s:Symbol)-[:BELONGS_TO]->(m:Module {id: 'stripe:payments'}) RETURN s
```

### Find deprecated symbols and their replacements
```
scrapin_search(query: "deprecated", label_filter: "Symbol")
# Then for each: scrapin_graph_query(start_id: id, hops: 1, edge_types: ["SUPERSEDES"])
# Cypher: MATCH (old:Symbol {deprecated: true})-[:SUPERSEDES]->(new:Symbol) RETURN old, new
```

### Find algorithms used by a symbol
```
scrapin_graph_query(start_id: "my-lib:sortUsers", hops: 1, edge_types: ["USES_ALGO"])
# Cypher: MATCH (s:Symbol {id: 'my-lib:sortUsers'})-[:USES_ALGO]->(a:AlgoNode) RETURN a
```

---

## Algorithm Library Query Patterns

### By problem type
```
scrapin_algo_search(query: "sort array of objects by multiple keys", category: "sorting")
scrapin_algo_search(query: "detect cycle in directed graph", category: "graph")
scrapin_algo_search(query: "longest common subsequence", category: "dynamic-programming")
```

### By pattern
```
scrapin_algo_search(query: "observer pattern event handling", category: "design-patterns")
scrapin_algo_search(query: "circuit breaker retry", category: "architectural-patterns")
```

---

## Code Drift Detection Workflow

1. Run scan: `scrapin_code_drift_scan()`
2. Review report sections:
   - **missing_docs**: Imports with no indexed documentation → queue crawls
   - **deprecated_usage**: Using deprecated APIs → plan migration
   - **stale_docs**: Docs updated since last scan → review changes
3. For missing docs: `scrapin_add_source()` + `scrapin_crawl_source()`
4. For deprecated: `scrapin_graph_query()` with `edge_types: ["SUPERSEDES"]` to find replacements

---

## Agent Drift Detection Workflow

1. Quick check: `scrapin_agent_drift_status()`
2. For any score > 3: `scrapin_agent_drift_detail(agent_id)`
3. For any score > 7: **STOP** — report to user immediately
4. To see exact changes: `scrapin_agent_drift_diff(agent_id)`
5. If change is intentional: `scrapin_agent_drift_acknowledge(agent_id, notes: "reason")`
6. If contradiction found: resolve with user before continuing

---

## Sibling Resolution Strategy

When looking up a specific symbol, always include siblings for context:

```
# Don't do this (missing context):
scrapin_graph_query(start_id: "stripe:PaymentIntent.create", hops: 1)

# Do this (includes sibling methods on the same page):
scrapin_graph_query(start_id: "stripe:PaymentIntent.create", hops: 1, include_siblings: true)
```

Siblings are symbols defined on the same documentation page — they're almost always related.

---

## Concurrency and Rate Limiting

- Each source has its own concurrency limit (default: 5) and RPS limit (default: 2)
- Cron jobs share a global semaphore (max 3 concurrent jobs)
- See `@config/rate-limits.yaml` for per-source settings
- Never modify rate limits without checking the source's Terms of Service

---

## Cron Schedule Quick Reference

| Job | Cron | Human-Readable |
|---|---|---|
| full-sweep | `0 3 * * *` | Daily 3am |
| staleness-check | `*/30 * * * *` | Every 30 min |
| missing-doc-scan | `0 */6 * * *` | Every 6 hours |
| openapi-sync | `0 1 * * 1` | Monday 1am |
| embedding-rebuild | `0 4 * * 0` | Sunday 4am |
| algo-sweep | `0 2 * * 0` | Sunday 2am |
| code-drift-scan | `0 */4 * * *` | Every 4 hours |
| agent-drift-scan | `*/15 * * * *` | Every 15 min |

---

## Interview-Driven Setup

When using this plugin to set up a new project's Claude Code configuration, the
`scrapin_setup_interview` prompt template enforces a thorough, interactive discovery
process. Key rules:

- One question at a time, adapted based on previous answers
- Never generate dates or timelines unless explicitly asked
- Minimum 15 questions before generating any configuration
- Must cover: identity, stack, architecture, team, testing, security, deployment, domain, conventions, pain points, goals
- End with synthesis and confirmation before generating output
