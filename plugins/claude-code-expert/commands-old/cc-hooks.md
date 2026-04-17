# /cc-hooks — Claude Code Hooks Designer & Manager

Design, create, and manage Claude Code hooks.

## Usage
```
/cc-hooks [action] [hook-type]
```

## Actions

### create
Create a new hook interactively.
```
/cc-hooks create                        # Interactive
/cc-hooks create pre-tool-use           # Create PreToolUse hook
/cc-hooks create post-tool-use          # Create PostToolUse hook
/cc-hooks create notification           # Create Notification hook
/cc-hooks create stop                   # Create Stop hook
/cc-hooks create security-guard         # Create security PreToolUse hook
/cc-hooks create audit-logger           # Create audit PostToolUse hook
/cc-hooks create auto-test              # Create auto-test Stop hook
```

### list
List all configured hooks.
```
/cc-hooks list
```

### test
Test a hook script with sample input.
```
/cc-hooks test .claude/hooks/my-hook.sh
```

### debug
Debug why a hook isn't firing.
```
/cc-hooks debug
```

## Implementation

When invoked:

### For `create`:
1. Determine hook type needed
2. Ask about trigger conditions (matcher pattern)
3. Ask about desired behavior
4. Generate hook script
5. Add hook configuration to settings.json
6. Make script executable
7. Test with sample input

### For `list`:
1. Read settings.json
2. Display all hooks with:
   - Event type
   - Matcher pattern
   - Script path
   - Script status (exists/missing, executable/not)

### For `test`:
1. Generate appropriate sample JSON input
2. Run the hook script with the sample input
3. Display output and exit code
4. Validate output JSON format

### For `debug`:
1. Check settings.json hook configuration
2. Verify script paths exist
3. Verify scripts are executable
4. Check script dependencies (jq, etc.)
5. Run scripts with test input
6. Report issues found

## Pack Installer

Pre-built hook policy packs that can be installed with a single command. Each pack writes a hardened bash script and registers it in `.claude/settings.json`.

### Available commands

```
/cc-hooks install                              # Interactive: list packs and prompt selection
/cc-hooks install protect-sensitive-files
/cc-hooks install auto-format-after-edit
/cc-hooks install stop-until-tests-pass
/cc-hooks install post-compact-context-restoration
/cc-hooks install direnv-reload-on-cwd-change
/cc-hooks install task-created-governance
/cc-hooks install task-completed-quality-gate
/cc-hooks install teammate-idle-enforcement
/cc-hooks install --all                        # Install all 8 packs
/cc-hooks list-packs                           # Show available packs with descriptions
/cc-hooks status                               # Show which packs are installed
```

### Available packs

| Pack | Event | Matcher | What it does |
|------|-------|---------|--------------|
| `protect-sensitive-files` | PreToolUse | `"Write\|Edit"` | Blocks writes to .env, *.key, *.pem, secrets/, credentials files |
| `auto-format-after-edit` | PostToolUse | `"Write\|Edit"` | Runs prettier/black/rustfmt/eslint based on file extension |
| `stop-until-tests-pass` | Stop | `""` (all) | Runs test suite; blocks completion if any tests fail |
| `post-compact-context-restoration` | PostToolUse | `"Compact"` | Re-injects `.claude/active-task.md` after compaction |
| `direnv-reload-on-cwd-change` | UserPromptSubmit | `""` (all) | Detects `.envrc` and reloads env via `direnv` on each prompt |
| `task-created-governance` | PreToolUse | `"Task"` | Blocks TaskCreate if description is empty or < 20 chars |
| `task-completed-quality-gate` | PostToolUse | `"Task"` | Runs `tsc --noEmit` after task completion; blocks on TS errors |
| `teammate-idle-enforcement` | Stop | `""` (all) | Records completion timestamp to `/tmp/claude-last-stop` for idle tracking |

### If-based filtering (matcher field)

The `matcher` field is a **regex** applied to `tool_name`. A hook only fires when the regex matches:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/protect-sensitive-files.sh" }]
      }
    ]
  }
}
```

Common matcher patterns:
- `"Write|Edit"` — fires only on Write or Edit tool calls
- `"Task"` — fires only on Task tool calls
- `"Compact"` — fires only when compaction runs
- `"Bash"` — fires only on Bash tool calls
- `""` — fires on every tool call (no filter)

### Implementation

When `/cc-hooks install <pack>` is invoked:

1. Look up the pack definition from the `hook-policy-engine` skill
2. Write the bash script to `.claude/hooks/<pack-name>.sh`
3. Set executable permissions (`chmod +x`)
4. Read `.claude/settings.json` (or create it if missing)
5. Merge the hook registration under the correct event key and matcher
6. Write updated settings.json
7. Print:
   ```
   ✓ Installed: protect-sensitive-files
     Script:  .claude/hooks/protect-sensitive-files.sh
     Event:   PreToolUse
     Matcher: Write|Edit
     Effect:  Blocks writes to .env, *.key, *.pem, secrets/, credentials files
   ```

When `/cc-hooks install --all` is invoked, install all 8 packs in order and print a summary table.

When `/cc-hooks list-packs` is invoked, print the table above with descriptions.

When `/cc-hooks status` is invoked:
1. Read `.claude/settings.json`
2. For each of the 8 packs, check if the script exists in `.claude/hooks/` and if the hook is registered
3. Print a status table:
   ```
   Pack                              Script    Registered
   ─────────────────────────────────────────────────────
   protect-sensitive-files           ✓         ✓
   auto-format-after-edit            ✓         ✓
   stop-until-tests-pass             ✗         ✗
   ...
   ```

### settings.json merge strategy

When registering a hook, merge into the existing array under the event key — do not overwrite. If a hook with the same script path is already registered, skip (idempotent install):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/protect-sensitive-files.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/auto-format-after-edit.sh" }
        ]
      },
      {
        "matcher": "Compact",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/post-compact-context-restoration.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/stop-until-tests-pass.sh" },
          { "type": "command", "command": "bash .claude/hooks/teammate-idle-enforcement.sh" }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/direnv-reload-on-cwd-change.sh" }
        ]
      }
    ]
  }
}
```

Multiple hooks under the same event+matcher run in order — they all receive the same input JSON and their outputs are evaluated in sequence. If any hook returns `{"decision":"block"}`, the tool call is blocked.

### Full implementation reference

See `skills/hook-policy-engine/SKILL.md` for complete bash script implementations of all 8 packs, security hardening details, and the custom pack template.
