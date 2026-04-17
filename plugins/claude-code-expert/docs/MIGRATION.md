# Migration Guide — v7.6.0 → v8.0.0

## What changed

v8 is a major rewrite. The plugin's public intents are the same but the surface is dramatically smaller and better-routed.

- **49 skills → 14** — consolidated, progressively-disclosed (skill-creator conformant)
- **21 commands → 11** — single-intent, clearer defaults
- **26 agents → 18** — role-scoped, tool-restricted
- **New memory layer**: three-tier system (engram + Obsidian vault + plugin rules)
- **Expanded MCP**: 15 → 22 tools with lazy KB artifacts (every artifact ≤ 2 KB)

## How to upgrade

```bash
/plugin upgrade claude-code-expert
```

The plugin auto-swaps `skills/` and `commands/` on upgrade. Old tree preserved in `archive/v7.6.0/` for reference.

## Command changes

### Renamed (shims until v8.1)

| v7 | v8 |
|---|---|
| `/cc-bootstrap` | `/cc-setup --audit` |
| `/cc-config` | `/cc-sync --fix-drift` |
| `/cc-troubleshoot` | `/cc-debug` |

Running the v7 command still works in v8.0 — you'll see a one-line redirect + the v8 command executes.

### Removed (functionality moved, not gone)

| v7 | Where to get the functionality |
|---|---|
| `/cc-agent` | Use `Agent` tool directly or `/cc-council` |
| `/cc-budget` | `/cc-intel` + MCP `cc_docs_compare` |
| `/cc-cicd` | MCP `cc_kb_workflow_pack(name)` |
| `/cc-learn` | MCP `cc_kb_workflow_pack(name)` (7 packs) |
| `/cc-mcp` | `/cc-setup --mcp-only` |
| `/cc-perf` | `/cc-intel <performance question>` |
| `/cc-schedule` | native `schedule` skill + MCP `cc_docs_schedule_recommend` |

## Skill changes

35 skills consolidated. Key mergers:

- `hooks-system`, `hook-policy-engine`, `hook-script-library` → `hooks` + MCP `cc_kb_hook_recipe`
- `agent-teams`, `agent-teams-advanced`, `agent-team-topologies`, `teams-collaboration`, `agent-lifecycle` → `agent-teams` + MCP `cc_kb_topology_kit`
- `channels`, `channels-bootstrap`, `channels-user-guide` → `mcp` skill + MCP `cc_kb_channel_server`
- `lsp-integration` → MCP `cc_kb_lsp_config`
- `cli-reference`, `configuration`, `settings-deep-dive`, `tools-reference`, `slash-commands` → MCP `cc_docs_*` tools (already existed; enriched)
- `common-workflows` → MCP `cc_kb_workflow_pack` (7 packs)

If your code or docs referenced a specific v7 skill path, check `migrations/v7-to-v8.md` for the exact replacement.

## Agent changes

9 agents deleted (roles folded):

- `claude-code-architect` → absorbed by `principal-engineer-strategist` + `/cc-setup` workflow
- `claude-code-debugger` → absorbed by `debugger` (CC-specific playbook loaded via `/cc-debug`)
- `hooks-specialist` → superseded by `hooks` skill + MCP KB
- `ide-integration-specialist` → MCP `cc_kb_lsp_config`
- `mcp-configurator` → `mcp` skill + `/cc-setup --mcp-only`
- `permissions-security-advisor` → merged into `security-compliance-advisor`
- `sdk-guide` → external `claude-api` skill covers
- `teams-architect` → merged into `team-orchestrator`
- `agent-lifecycle-manager` → merged into `team-orchestrator`

1 agent added: `memory-consolidator` (Opus, read-only on engram, writes Obsidian + plugin rules).

## Memory changes (new in v8)

v7 had no memory layer. v8 adds a three-tier system:

| Tier | Store | Purpose |
|---|---|---|
| 1 | engram (global MCP) | Working memory — unchanged protocol |
| 2 | Obsidian vault | Durable curated knowledge |
| 3 | Plugin `memory/rules/` | Baseline rules shipped to consumer repos |

Bridged by `memory-consolidator` agent. Full design in [MEMORY_ARCHITECTURE.md](MEMORY_ARCHITECTURE.md) and [`../memory/conventions.md`](../memory/conventions.md).

**What this means for you:**
- Keep using engram as before. No behavior change.
- Run `/cc-memory consolidate` occasionally (weekly is fine) to promote reinforced patterns into Obsidian + the plugin's baseline rules.
- Consumer repos get three baseline rule files installed by `/cc-setup` — these propagate plugin-wide CC conventions to every repo automatically.

## What to do right after upgrading

1. Run `/cc-setup --audit` in your main repos — the score surfaces any drift from v8 baselines.
2. Run `/cc-sync --fix-drift` to repair.
3. Run `/cc-memory status` to verify engram integration.
4. If you use Obsidian, verify the vault MCP is accessible: `mcp__obsidian__*` tools should appear or the vault path (`C:/Users/MarkusAhling/obsidian/`) should be readable.
5. Read [`../memory/conventions.md`](../memory/conventions.md) for the write discipline.

## Rollback

```bash
cd C:/Users/MarkusAhling/pro/claude/plugins/claude-code-expert
git reset --hard v7.6.0-pre-redesign
```

The v7.6.0 tree is preserved in `archive/v7.6.0/` for reference until v8.1.
