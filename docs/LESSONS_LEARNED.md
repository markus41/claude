# Lessons Learned

This document captures lessons learned from errors, bugs, and issues encountered during development. Each entry documents the problem, root cause, and fix to prevent recurrence.

---

## 2025-01-19: Hooks.json Structure Validation Error

### Problem
The jira-orchestrator plugin (v7.3.0) failed to load with error:
```json
{
  "expected": "record",
  "code": "invalid_type",
  "path": ["hooks"],
  "message": "Invalid input: expected record, received undefined"
}
```

### Root Cause
The **cached** `hooks.json` file was missing the required `"hooks"` wrapper object.

**Incorrect structure (cached):**
```json
{
  "UserPromptSubmit": [...],
  "PostToolUse": [...]
}
```

**Correct structure (expected):**
```json
{
  "$schema": "./schema/hook-config.schema.json",
  "hooks": {
    "UserPromptSubmit": [...],
    "PostToolUse": [...]
  }
}
```

### Fix Applied
1. Updated the cached file at `.claude/plugins/cache/claude-orchestration/jira-orchestrator/7.3.0/hooks/hooks.json`
2. Added the `"hooks"` wrapper object around the hook event types
3. Added `"$schema"` property for validation

### Prevention
1. **Source file must always have `hooks` wrapper** - Ensure `plugins/*/hooks/hooks.json` uses correct structure
2. **Validate after caching** - Plugin build/cache process should validate structure matches expected format
3. **Documentation created** - See `C:\Users\MarkusAhling\obsidian\Research\Development\Claude-Code-Hooks-JSON-Structure.md`

### Files Modified
- `C:\Users\MarkusAhling\.claude\plugins\cache\claude-orchestration\jira-orchestrator\7.3.0\hooks\hooks.json`

### Related Documentation
- [[Claude-Code-Hooks-JSON-Structure]] in Obsidian vault

---

## Template for Future Entries

```markdown
## YYYY-MM-DD: [Brief Title]

### Problem
[Description of the error/issue]

### Root Cause
[What caused the problem]

### Fix Applied
[Steps taken to resolve]

### Prevention
[How to prevent this in the future]

### Files Modified
[List of files changed]

### Related Documentation
[Links to related docs]
```
