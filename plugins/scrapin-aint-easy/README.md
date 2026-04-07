# scrapin-ain't-easy

> Documentation intelligence engine, algorithm library, and codebase/agent drift detection system for Claude Code.

## What It Does

Drop this plugin into any repo and immediately get:

- **Live, graph-traversable API documentation** for any configured source (Stripe, GitHub, Anthropic, Azure, etc.)
- **Algorithm & pattern library** indexed from TheAlgorithms, Refactoring Guru, NeetCode, patterns.dev, and more
- **Codebase drift detection** — finds undocumented imports, deprecated API usage, and stale references
- **Agent drift detection** — monitors `.claude/agents/*.md` for content changes, schema breaks, and cross-agent contradictions
- **Cron-driven background jobs** keeping everything current
- **MCP server** with 17 tools, **LSP server** for editor integration, **6 slash commands**, **8 specialized agents**

## Quick Start

```bash
# Install dependencies
cd plugins/scrapin-aint-easy
pnpm install

# Build
pnpm build

# Start MCP server (default mode)
pnpm start

# Start with all features
pnpm start:all  # MCP + LSP + Cron
```

## Claude Code Integration

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "scrapin-aint-easy": {
      "command": "node",
      "args": ["plugins/scrapin-aint-easy/dist/cli.js", "--mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "your-key-here"
      }
    }
  }
}
```

Or for `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "scrapin-aint-easy": {
      "command": "node",
      "args": ["/absolute/path/to/dist/cli.js", "--mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "your-key-here"
      }
    }
  }
}
```

## VS Code LSP Setup

Add to VS Code `settings.json`:

```json
{
  "scrapin.lsp.enable": true,
  "scrapin.lsp.command": "node",
  "scrapin.lsp.args": ["plugins/scrapin-aint-easy/dist/cli.js", "--lsp"]
}
```

Or run standalone: `pnpm start:lsp`

## Slash Commands

| Command | Description |
|---|---|
| `/scrapin-search <query>` | Search documentation knowledge graph |
| `/scrapin-crawl <source>` | Trigger documentation crawl |
| `/scrapin-diff <source>` | Show doc changes since last crawl |
| `/scrapin-algo <query>` | Query algorithm library |
| `/scrapin-drift` | Run drift detection (code + agents) |
| `/scrapin-status` | System health dashboard |

## MCP Tools

| Tool | Description |
|---|---|
| `scrapin_search` | Semantic search across all doc + algo nodes |
| `scrapin_graph_query` | N-hop graph traversal from a symbol |
| `scrapin_algo_search` | Search algorithm library |
| `scrapin_algo_detail` | Full detail for one algorithm |
| `scrapin_crawl_source` | Trigger immediate crawl |
| `scrapin_diff` | Show doc changes since last crawl |
| `scrapin_lsp_hover` | LSP-style symbol lookup |
| `scrapin_cron_status` | Cron job status + drift info |
| `scrapin_add_source` | Register a new documentation source |
| `scrapin_add_algo_source` | Register a new algorithm source |
| `scrapin_code_drift_scan` | Trigger codebase drift scan |
| `scrapin_code_drift_report` | Get latest code drift report |
| `scrapin_agent_drift_status` | List agents with drift scores |
| `scrapin_agent_drift_detail` | Full drift report for one agent |
| `scrapin_agent_drift_acknowledge` | Mark drift as intentional |
| `scrapin_agent_drift_diff` | Markdown diff since baseline |
| `scrapin_graph_stats` | Node/edge counts, index health |

## Adding Documentation Sources

Edit `config/sources.yaml`:

```yaml
sources:
  my-library:
    name: My Library
    base_url: https://docs.my-library.com
    sitemap: https://docs.my-library.com/sitemap.xml
    package_aliases: ["my-library", "@my-org/my-library"]
    concurrency: 5
    rps: 2
```

Then run: `/scrapin-crawl my-library`

## Adding Algorithm Sources

Edit `config/algo-sources.yaml`:

```yaml
algo_sources:
  - key: my-algo-repo
    url: https://github.com/user/algorithms
    type: github_repo
    paths: ["src/**/*.ts"]
    extract_mode: code_analysis
```

Then run: `pnpm algo:index`

## Understanding Drift Reports

### Code Drift

- **missing_docs**: You import symbols that have no documentation in the graph. Action: add the source and crawl it.
- **deprecated_usage**: You're using APIs marked as deprecated. Action: check for replacements via `scrapin_graph_query` with `SUPERSEDES` edges.
- **stale_docs**: Documentation was updated since your last scan. Action: review changes, update code if needed.

### Agent Drift

- **Score 0-2**: Minor formatting changes. Usually safe to acknowledge.
- **Score 3-5**: Moderate changes. Review the diff before acknowledging.
- **Score 6-7**: Significant behavioral changes. Carefully review.
- **Score 8-10**: Critical changes or contradictions. **Must resolve before continuing work.**

### Cross-Agent Contradictions

When two agents define conflicting behavior (e.g., one says "always use X" and another says "never use X"), the system flags it. These must be resolved by the user — the plugin will not proceed silently.

## Architecture

```
MCP Server (stdio) ──── Claude Code
     │
     ├── Knowledge Graph (Kùzu embedded / Neo4j)
     │     ├── Source, Page, Symbol, Module, Example nodes
     │     ├── AlgoNode, Pattern nodes
     │     └── AgentDef nodes
     │
     ├── Vector Store (HNSW + Xenova embeddings)
     │
     ├── Crawler Engine
     │     ├── Firecrawl (primary)
     │     ├── Puppeteer (fallback)
     │     └── OpenAPI parser
     │
     ├── Drift Detection
     │     ├── Code drift scanner
     │     ├── Agent drift detector
     │     └── Doc diff engine
     │
     ├── Cron Scheduler (8 jobs, max 3 concurrent)
     │
     └── LSP Server (optional, stdio/TCP)
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FIRECRAWL_API_KEY` | For crawling | Firecrawl API key |
| `GITHUB_TOKEN` | For GitHub sources | GitHub API token |
| `NEO4J_URI` | Optional | Switch to Neo4j instead of Kùzu |
| `NEO4J_USER` | With Neo4j | Neo4j username |
| `NEO4J_PASSWORD` | With Neo4j | Neo4j password |

## Development

```bash
pnpm dev          # Watch mode with tsx
pnpm test         # Run tests
pnpm test:watch   # Watch mode tests
pnpm build        # Build with tsup
```

## License

MIT
