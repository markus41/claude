# exec-automator

`exec-automator` provides executive-director automation workflows for associations and nonprofits.

## Quick Operator View

- **Purpose:** analyze responsibilities, score automation potential, and generate/deploy LangGraph workflows.
- **Primary entrypoint:** `CONTEXT.md` (fast operational summary).
- **Core resources:** `commands/`, `agents/`, `skills/`, `templates/`, `mcp-server/`.

## Where to Go Next

- Start with `CONTEXT.md` for day-to-day usage.
- Use `docs/README_DEEP_DIVE.md` for full narrative, architecture details, ROI model, and end-to-end platform documentation.

## Plugin Manifest & Hook Schemas

Plugin authors should validate manifest and hooks files against the canonical repository schemas:

- Manifest: [`schemas/plugin.schema.json`](../../schemas/plugin.schema.json) for `.claude-plugin/plugin.json`
- Hooks: [`schemas/hooks.schema.json`](../../schemas/hooks.schema.json) for `hooks/hooks.json`

Run `npm run check:plugin-schema` from the repository root before submitting changes.
