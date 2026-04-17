# /cc-config — Claude Code Configuration Generator & Auditor

Generate, audit, or modify Claude Code configuration files.

## Usage
```
/cc-config [action] [options]
```

## Actions

### generate
Generate a new Claude Code configuration from scratch.
```
/cc-config generate                    # Interactive setup
/cc-config generate --preset developer # Use preset
/cc-config generate --preset ci-cd     # CI/CD preset
/cc-config generate --preset secure    # Security-hardened preset
```

### audit
Audit existing configuration for issues.
```
/cc-config audit              # Check all config files
/cc-config audit --strict     # Strict validation
```

### show
Display current effective configuration.
```
/cc-config show               # Show merged settings
/cc-config show --permissions # Show only permissions
/cc-config show --hooks       # Show only hooks
/cc-config show --mcp         # Show MCP servers
```

## Implementation

When invoked:

### For `generate`:
1. Read existing config files (if any)
2. Ask user about their project type and needs
3. Generate appropriate CLAUDE.md, settings.json, .mcp.json
4. Create recommended rules files
5. Set up basic hooks

### For `audit`:
1. Read all config files
2. Validate JSON syntax
3. Check for common issues:
   - Missing API key configuration
   - Overly permissive settings
   - Invalid hook scripts
   - Broken MCP server configs
   - Missing CLAUDE.md
   - Secrets in version-controlled files
4. Report findings with fix suggestions

### For `show`:
1. Load and merge all settings levels
2. Display effective configuration
3. Highlight any conflicts or overrides

## Presets

### Developer (default)
- Permissive file access
- Common build tools allowed
- Auto-memory enabled
- Sonnet model

### CI/CD
- Read-only by default
- Only build/test commands allowed
- Auto-memory disabled
- Haiku model for cost efficiency

### Secure
- Minimal permissions
- Audit logging hooks
- No network access
- All writes require approval
