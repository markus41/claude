# /cc-troubleshoot — Claude Code Issue Diagnostics

Diagnose and fix Claude Code setup and runtime issues.

## Usage
```
/cc-troubleshoot [issue-type]
```

## Issue Types

```
/cc-troubleshoot                  # Run full diagnostics
/cc-troubleshoot auth             # Authentication issues
/cc-troubleshoot mcp              # MCP server issues
/cc-troubleshoot hooks            # Hook issues
/cc-troubleshoot config           # Configuration issues
/cc-troubleshoot permissions      # Permission issues
/cc-troubleshoot performance      # Performance issues
/cc-troubleshoot install          # Installation issues
/cc-troubleshoot plugins          # Plugin issues
```

## Implementation

When invoked, activate the `claude-code-debugger` agent to run systematic diagnostics:

### Full Diagnostics (no issue-type)
1. Environment check (Node, npm, Claude Code version)
2. Authentication check (API key, provider)
3. Configuration validation (settings.json, .mcp.json, CLAUDE.md)
4. MCP server status
5. Hook validation
6. Plugin validation
7. Check lessons-learned for known issues
8. Report all findings with severity

### Targeted Diagnostics (with issue-type)
Focus only on the specified area with deeper analysis.

### Output Format
```
=== Claude Code Diagnostics ===

[PASS] Node.js v20.11.0
[PASS] Claude Code v1.2.3
[PASS] API Key configured (54 chars)
[PASS] settings.json valid
[WARN] 3 unresolved issues in lessons-learned.md
[FAIL] MCP server "postgres" not responding
[FAIL] Hook script .claude/hooks/guard.sh not executable

=== Recommended Fixes ===
1. Fix MCP server: Check DATABASE_URL env var
2. Fix hook: chmod +x .claude/hooks/guard.sh
```

### Auto-Fix
When possible, offer to automatically fix issues:
- Make scripts executable
- Fix JSON syntax errors
- Set missing env vars (prompt for values)
- Install missing dependencies
- Clear corrupted cache
