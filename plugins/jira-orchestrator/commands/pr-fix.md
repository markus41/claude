---
name: pr-fix
description: "[DEPRECATED] Use /jira:pr --fix instead"
deprecated: true
redirect: /jira:pr --fix
---

# DEPRECATED: Use `/jira:pr --fix`

This command has been consolidated into `/jira:pr` with the `--fix` flag.

## Migration

```bash
# Old (deprecated)
/pr-fix <pr-url> --jira PROJ-123

# New (use this)
/jira:pr PROJ-123 --fix
```

## Why Consolidated?

- Reduces context overhead (44 commands → fewer primary commands)
- Single entry point for all PR operations
- Clearer workflow: create → fix → iterate

See `/jira:pr` for full documentation.

**⚓ Golden Armada** | *The Fleet Stands Ready*
