# MCP Servers

Model Context Protocol (MCP) servers extend Claude's toolset beyond the built-in
file and bash tools. This directory contains five custom MCP servers built for this
project. Two external MCP servers (Perplexity and Firecrawl) are also configured
for web research.

## Why custom MCP servers

Some information Claude needs is not in files — it is in the runtime state of the
system. Docker build history, Kubernetes pod image versions, Helm release state,
code quality scores, and deployment pipeline status all require executing commands
and interpreting structured output. MCP servers wrap that complexity into typed,
named tools that Claude can call like any other tool.

## Custom MCP servers

### deploy-intelligence

Tracks Docker builds and Kubernetes deployments to detect stale images and
deployment drift. Fed by the `docker-build-tracker.sh` hook.

| Tool | Purpose |
|------|---------|
| `deploy_build_log` | Query Docker/ACR build history with filters for image name, action type, and time range |
| `deploy_k8s_images` | List all running K8s pod images with pull policies; flags `IfNotPresent` + mutable tag combinations |
| `deploy_helm_releases` | List Helm releases with their deployed image versions |
| `deploy_audit` | Full audit comparing build log against currently running images to find deployment drift |
| `deploy_volumes` | Track PersistentVolume/PVC status; identify orphaned volumes |
| `deploy_record_build` | Record a Docker build event (called by CI or hooks) |
| `deploy_image_history` | Show history of a specific image tag across all builds and deploys |

**Data source**: `.claude/logs/docker-builds.jsonl` (written by `docker-build-tracker.sh`)

### lessons-learned

A queryable interface to the self-healing knowledge base. Provides richer search
and management capabilities than reading the markdown file directly.

| Tool | Purpose |
|------|---------|
| `lessons_search` | Search lessons by keyword, tool name, or status. Use before starting work to check for known issues. |
| `lessons_add` | Add a new lesson with error, fix, prevention, and status fields |
| `lessons_resolve` | Mark a NEEDS_FIX lesson as RESOLVED and record the fix description |
| `lessons_patterns` | Extract recurring error patterns from the lessons database |
| `lessons_stats` | Statistics on error frequency, resolution rate, and most problematic tools |
| `rules_suggest` | Suggest new rule file entries based on unresolved or repeated patterns |

**Data source**: `.claude/rules/lessons-learned.md` + `.claude/logs/lessons-db.jsonl`

### project-metrics

Provides quantitative health indicators for the project. Useful for understanding
velocity, identifying problem areas, and tracking DORA metrics.

| Tool | Purpose |
|------|---------|
| `metrics_git_stats` | Git repository statistics: commit frequency, contributors, lines changed, branch activity |
| `metrics_code_health` | Code health indicators: file size distribution, largest files, complexity proxies |
| `metrics_session_log` | Track and query Claude Code session activity and productivity over time |
| `metrics_dora` | DORA-style metrics: deploy frequency, lead time for changes, change failure rate |
| `metrics_hotspots` | Identify files changed most often alongside bug fixes (high churn + high defect density) |
| `metrics_dependencies` | Analyze dependency freshness and count known vulnerabilities |

**Data source**: Git history, file system, `.claude/logs/session-metrics.jsonl`

### code-quality-gate

Automated code quality checks that return structured results and scores. Used by
the `task-quality-gate.sh` hook and can be called directly during development.

| Tool | Purpose |
|------|---------|
| `quality_check` | Run a full gate: TypeScript compilation, ESLint, security scan, returns combined score |
| `quality_typecheck` | Run `tsc --noEmit` and return structured compilation errors |
| `quality_lint` | Run ESLint and return structured issue list with severity and file locations |
| `quality_security_scan` | Scan changed files for security patterns: hardcoded secrets, SQL injection, XSS, eval usage, command injection |
| `quality_score` | Calculate an overall quality score (0–100) for recent changes based on all checks |
| `quality_pre_commit` | Pre-commit gate: runs all checks and returns pass/fail with blocking issues |

**Security patterns scanned**: hardcoded secrets, SQL injection, command injection,
`eval()` usage, XSS vectors (`innerHTML`, `dangerouslySetInnerHTML`), insecure
`Math.random()`, `console.log` calls, and TODO/FIXME markers.

### workflow-bridge

Orchestrates end-to-end deployment pipelines, tying build, test, registry push, and
Helm deploy steps into tracked, auditable pipelines.

| Tool | Purpose |
|------|---------|
| `workflow_pipeline` | Define and execute a multi-step deployment pipeline with named stages |
| `workflow_status` | Check status of running or completed pipelines |
| `workflow_gate` | Deployment gate check: validates pre-conditions before a deploy is allowed to proceed |
| `workflow_rollback_plan` | Generate a step-by-step rollback plan for a specific deployment |
| `workflow_changelog` | Generate a changelog between two deployment versions using git log |
| `workflow_environments` | Track and compare environment state (dev, staging, production) |

**Data source**: `.claude/logs/workflows.jsonl`, `.claude/logs/environments.json`

## External MCP servers

These servers are not in this directory — they are installed externally and registered
in `.mcp.json`.

| Server | Provider | Purpose |
|--------|----------|---------|
| Perplexity | Perplexity AI | Web knowledge queries. Use `mcp__perplexity__*` tools for current information, library comparisons, and general research. Preferred over WebSearch. |
| Firecrawl | Firecrawl | Scrape specific URLs into structured markdown. Use `mcp__firecrawl__*` tools when you have a URL to fetch. Preferred over WebFetch. |

The `research.md` rule enforces that these MCP tools are used instead of the built-in
`WebFetch` and `WebSearch` tools.

## Configuration

All MCP servers are registered in `.mcp.json` at the project root. The custom servers
are launched as Node.js processes:

```json
{
  "mcpServers": {
    "deploy-intelligence": {
      "command": "node",
      "args": [".claude/mcp-servers/deploy-intelligence/index.js"],
      "env": {
        "CLAUDE_PROJECT_DIR": "${workspaceFolder}"
      }
    },
    "lessons-learned": {
      "command": "node",
      "args": [".claude/mcp-servers/lessons-learned/index.js"],
      "env": {
        "CLAUDE_PROJECT_DIR": "${workspaceFolder}"
      }
    }
  }
}
```

All five custom servers use the `CLAUDE_PROJECT_DIR` environment variable to locate
project files. They fall back to `process.cwd()` if it is not set.

## Adding a new MCP server

1. Create a directory: `.claude/mcp-servers/<name>/`
2. Create `index.js` implementing the MCP JSON-RPC protocol (initialize, tools/list, tools/call)
3. Create `package.json` with `"type": "module"` for ES module support
4. Register in `.mcp.json` with the startup command and environment variables
5. Document each tool in this README

The servers use stdio transport (stdin/stdout) for communication with Claude Code.
Each tool call is a JSON-RPC 2.0 request and the server returns a JSON-RPC 2.0 response.

## See also

- [../README.md](../README.md) — Platform overview
- [../hooks/README.md](../hooks/README.md) — Hooks that write data these servers read
- [../rules/research.md](../rules/research.md) — Rule enforcing use of MCP research tools
