# Context Map

Use this file to pick the minimum documentation set for a given user intent.

| User intent | Load first | Then load |
|---|---|---|
| Get started quickly | `README.md` | `docs/operations.md#install-and-bootstrap` |
| Understand command behavior | `docs/commands.md` | `commands/*.md` for the specific command |
| Choose or tune agents | `docs/agents.md` | `agents/*.md` for role details |
| Pick domain knowledge packs | `docs/skills.md` | `skills/*/*.md` for implementation details |
| Operate in production | `docs/operations.md` | `hooks/README.md`, `mcp-server/README.md` |
| Full architecture and business context | `README.md` | `docs/README_DEEP_DIVE.md` |

## Loading Order Policy

1. `README.md`
2. `docs/context-map.md`
3. Intent-specific doc (`docs/commands.md`, `docs/agents.md`, `docs/skills.md`, `docs/operations.md`)
4. Deep references (`commands/`, `agents/`, `skills/`, `workflows/`, `docs/README_DEEP_DIVE.md`)
