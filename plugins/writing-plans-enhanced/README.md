# writing-plans-enhanced

Enhanced fork of `superpowers:writing-plans` — a plan-authoring skill for multi-step implementation work, with additions for pre-writing context-gathering, task metadata, non-TDD task templates, and an automated plan linter.

## What this adds vs. superpowers:writing-plans

- **Phase 1: Pre-Writing — Gather Context** — read spec twice, study codebase conventions, identify risks before decomposing.
- **Task metadata** — every task declares Type / Depends on / Parallel-safe / Risk so executors can order and parallelize correctly.
- **Non-TDD task templates** — config, refactor, migration, documentation, file-move, infrastructure, bug-fix — each with its own verification style.
- **Observability guidance** — per-task telemetry table + `execution-log.md` feedback loop.
- **Automated plan linter** — `scripts/plan-lint.sh` catches placeholders, missing Context block, missing metadata, forward dependencies, and vague commit messages. Self-tested via `scripts/test-plan-lint.sh` (16 assertions).
- **Red Flags section** — mechanical "do not ship if..." checklist.
- **Integration map** — explicit before/during/after skill links.

## Why fork

The upstream skill lives in a plugin cache (`~/.claude/plugins/cache/claude-plugins-official/superpowers/`) that gets overwritten by plugin updates. Hosting the enhanced version here in the hub puts it under git version control and makes the improvements durable.

## Usage

Invoke the skill in Claude Code: `writing-plans-enhanced` (namespaced by this plugin's name when installed via the marketplace).

Lint any plan file:

```bash
bash skills/writing-plans-enhanced/scripts/plan-lint.sh path/to/plan.md
```

Exit codes:

- `0` — clean
- `1` — issues found (prints `file:line: issue`)
- `2` — usage error

Run the linter's own tests:

```bash
bash skills/writing-plans-enhanced/scripts/test-plan-lint.sh
```

Expected: `Summary: 16 passed, 0 failed`.

## Provenance

Derived from the `superpowers` skill set in the `claude-plugins-official` marketplace, under the same MIT license. The enhancements and the linter are authored by Markus Ahling. The skill is renamed to `writing-plans-enhanced` to avoid name collision with the upstream skill when both are installed.

## License

MIT.
