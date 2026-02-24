# exec-automator

`exec-automator` provides executive-director automation workflows for associations and nonprofits.

## Quickstart

1. Run `./scripts/install.sh` to install dependencies.
2. Set `ANTHROPIC_API_KEY` (and optional model provider keys).
3. Start the MCP service with `./scripts/start-mcp.sh`.
4. Run `./scripts/health-check.sh`.
5. Use `/orchestrate` or `/analyze` with organization docs to begin the pipeline.

## Architecture Snapshot

The plugin follows a 6-phase automation pipeline:

`ANALYZE -> MAP -> SCORE -> GENERATE -> SIMULATE -> DEPLOY`

Core components:
- `commands/`: operator slash commands for each pipeline phase.
- `agents/`: specialist agents (finance, membership, events, governance, comms).
- `skills/`: reusable domain knowledge packs.
- `workflows/`: deployment-ready workflow templates.
- `mcp-server/`: LangGraph/LangChain execution engine.
- `hooks/`: lifecycle and workflow execution automation hooks.

## Docs Navigation

Load `docs/context-map.md` first to route by user intent.

Deep docs:
- `docs/commands.md`
- `docs/agents.md`
- `docs/skills.md`
- `docs/operations.md`
- `docs/README_DEEP_DIVE.md` (full platform narrative)

## Plugin Manifest & Hook Schemas

Plugin authors should validate manifest and hooks files against the canonical repository schemas:

- Manifest: [`schemas/plugin.schema.json`](../../schemas/plugin.schema.json) for `.claude-plugin/plugin.json`
- Hooks: [`schemas/hooks.schema.json`](../../schemas/hooks.schema.json) for `hooks/hooks.json`

Run `npm run check:plugin-schema` from the repository root before submitting changes.
