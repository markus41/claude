# scrapin-ain't-easy - Context Summary

Documentation intelligence engine (v1.0.0): 7 commands, 12 agents, 6 skills, 17 MCP tools. Graph-based doc crawling, algorithm library, codebase drift detection, agent prompt drift monitoring, and interview-driven project setup.

## Best at

- Live, graph-traversable API documentation from any source
- Algorithm library indexing (TheAlgorithms, Refactoring Guru, NeetCode)
- Codebase drift detection (missing/deprecated/stale docs)
- Agent prompt drift monitoring with cross-agent contradiction detection
- Interview-driven project setup generating full Claude Code configuration
- Vector + graph hybrid search across documentation
- Background monitoring via 8 cron jobs

## When to open deeper docs

| Signal | Open docs | Why |
|--------|-----------|-----|
| New project setup | `.claude/commands/scrapin-setup.md` | Interview-first config generation |
| Search docs | `.claude/commands/scrapin-search.md` | Graph + vector search |
| Crawl sources | `.claude/commands/scrapin-crawl.md` | Add/refresh doc sources |
| Doc changes | `.claude/commands/scrapin-diff.md` | What changed since last crawl |
| Algorithm lookup | `.claude/commands/scrapin-algo.md` | Search algorithm library |
| Drift check | `.claude/commands/scrapin-drift.md` | Code + agent drift detection |
| System health | `.claude/commands/scrapin-status.md` | Cron jobs, graph stats |
| Code review | `.claude/skills/code-review/SKILL.md` | Structured review with graph context |
| Bug triage | `.claude/skills/bug-triage/SKILL.md` | Categorize and prioritize bugs |
| Migration plan | `.claude/skills/migration-planner/SKILL.md` | Schema/API migration safety |
| Architecture | `docs/context/architecture.md` | System design and components |
| Data model | `docs/context/data-model.md` | Graph schema, node/edge types |
| API contracts | `docs/context/api-contracts.md` | MCP tool specifications |
