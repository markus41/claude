---
description: Install, list, remove, and debug Claude Code hook packs. Integrates with the 8 security-hardened packs in the plugin's MCP KB.
---

# /cc-hooks — Manage Hook Packs

Wraps the hooks skill and MCP `cc_kb_hook_recipe` tool.

## Usage

```bash
/cc-hooks list                      # Show installed + available packs
/cc-hooks install <pack>            # Install a pack (script + settings.json merge)
/cc-hooks remove <pack>             # Remove pack (script + settings.json unmerge)
/cc-hooks recommend                 # Recommend packs based on repo signals
/cc-hooks test <pack>               # Run pack against a fixture — see decision output
/cc-hooks debug <event> <matcher>   # Show what fires when, execution order
```

## Installable packs

Fetch details via `cc_kb_hook_recipe(name)`:

| Pack | Event | Purpose |
|---|---|---|
| `protect-sensitive-files` | PreToolUse (Write\|Edit) | Block writes to .env / credentials / keys |
| `auto-format-after-edit` | PostToolUse (Write\|Edit) | Prettier / black / rustfmt / gofmt |
| `stop-until-tests-pass` | Stop | Block Stop until test suite green |
| `post-compact-context-restoration` | (after /compact) | Reload memory rules + recent context |
| `direnv-reload-on-cwd-change` | (cwd change) | Reload .envrc for direnv users |
| `task-created-governance` | Notification | Log new task creation |
| `task-completed-quality-gate` | Stop | Enforce lint + test before task completion |
| `teammate-idle-enforcement` | (periodic) | Kill idle teammate processes |

## Installation flow

1. `install <pack>`:
   - Fetches script via MCP (`cc_kb_hook_recipe(pack)`).
   - Writes `.claude/hooks/{pack}.sh` with `chmod +x`.
   - Merges `settings_snippet` into `.claude/settings.json` under `hooks.{Event}`.
   - Runs verify step (from KB) to confirm pack is wired.

2. `remove <pack>`:
   - Unmerges settings.json entry.
   - Optionally deletes `.claude/hooks/{pack}.sh` (asks; keeps script on disk by default).

## Recommendations (`recommend`)

Runs `cc_docs_hook_pack_recommend(signals)` with auto-detected repo signals (has_formatter, has_tests, has_secrets, has_git, …). Returns shortlist of packs with rationale.

## Debugging (`debug`)

Shows:
- Which packs fire on the given event + matcher combination
- Execution order
- Their output format
- Test fixture to verify behavior
