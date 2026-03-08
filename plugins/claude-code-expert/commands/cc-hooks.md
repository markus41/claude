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
