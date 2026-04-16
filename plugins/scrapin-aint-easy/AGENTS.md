# AGENTS.md — scrapin-ain't-easy

Use this file when working in `plugins/scrapin-aint-easy/`.

## Goal
Ship safe, testable improvements to the scraping + documentation intelligence plugin.

## Operating rules
1. Run from plugin root: `cd plugins/scrapin-aint-easy`.
2. Validate changes with at least:
   - `pnpm build`
   - `pnpm test`
3. Prefer extending existing MCP tools (`src/mcp/tools.ts`) and crawler modules (`src/crawler/*`) over creating parallel systems.
4. Keep config-driven behavior in `config/*.yaml` whenever possible.
5. Update docs when behavior changes (`README.md`, `SKILL.md`, or `docs/context/*`).

## Codex MCP setup (local)
Register this plugin as an MCP server in Codex:

```bash
codex mcp add scrapin --command node --arg plugins/scrapin-aint-easy/dist/cli.js --arg --mcp
codex mcp list
```

If you need a static config, add this to `~/.codex/config.toml`:

```toml
[mcp_servers.scrapin]
command = "node"
args = ["plugins/scrapin-aint-easy/dist/cli.js", "--mcp"]
```

## High-value files
- `src/crawler/crawler.ts` — crawl orchestration and fallback behavior
- `src/mcp/tools.ts` — tool definitions and handlers
- `src/drift/*` — code/agent drift reporting
- `config/sources.yaml` + `config/algo-sources.yaml` — source registration
