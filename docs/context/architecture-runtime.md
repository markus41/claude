# Architecture: Runtime

## Plugin Loading

<!-- Fill in: How and when are plugins discovered and loaded? -->

1. On build, `scripts/generate-plugin-indexes.mjs` scans `plugins/` directories
2. Each plugin's `.claude-plugin/plugin.json` manifest is read
3. Commands, agents, and skills are indexed into the registry
4. At runtime, the frontend reads the generated indexes

## MCP Server Lifecycle

MCP servers are declared in `.mcp.json` at the project root.

| Server | Transport | Purpose |
|--------|----------|---------|
| perplexity | npx (stdio) | Web knowledge queries |
| firecrawl | npx (stdio) | Web page scraping |
| deploy-intelligence | node (local) | Build and deploy tracking |
| lessons-learned | node (local) | Error pattern capture and search |
| project-metrics | node (local) | Code health and DORA metrics |
| code-quality-gate | node (local) | Lint, typecheck, security scan |
| workflow-bridge | node (local) | Pipeline status and changelog |

<!-- Fill in: Startup order, health checks, restart behavior -->

## Hook Execution Flow

Hooks are configured in `.claude/settings.json` under the `hooks` key.

```
Event fires (e.g., PreToolUse)
  -> Match hook triggers
  -> Execute shell/node script
  -> Capture stdout/stderr
  -> Pass result back to runtime
```

Events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `SessionStart`, `Stop`

<!-- Fill in: Error handling, timeout behavior, hook ordering -->

## Agent Invocation

<!-- Fill in: How agents are selected, how subagents are spawned, context passing -->

## Workflow Execution

<!-- Fill in: How a workflow graph is traversed at runtime, node execution order -->
