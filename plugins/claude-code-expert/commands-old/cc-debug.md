# /cc-debug — Claude Code Setup Debugger

Comprehensive debugger for Claude Code configuration and setup issues.

## Usage
```
/cc-debug                         # Full debug scan
/cc-debug --fix                   # Scan and auto-fix issues
/cc-debug --report                # Generate debug report
```

## What It Checks

### 1. Installation Health
- Claude Code CLI version and installation
- Node.js version (requires 18+)
- npm/pnpm/yarn availability
- Global vs local installation
- PATH configuration

### 2. Authentication
- API key presence and format
- Provider configuration (Direct, Bedrock, Vertex)
- Token validity (basic connectivity test)
- Proxy settings affecting auth

### 3. Project Configuration
- CLAUDE.md presence and readability
- settings.json syntax and schema validation
- settings.local.json syntax
- .mcp.json syntax and server configs
- Rules files syntax and path patterns
- .gitignore entries for sensitive files

### 4. MCP Servers
- Each server: command exists, env vars set, starts successfully
- Tool listing from each server
- Timeout and connectivity issues
- Duplicate server names

### 5. Hooks
- Each hook: script exists, is executable, produces valid JSON
- Matcher patterns are valid
- No circular dependencies
- Timeout configuration

### 6. Plugins
- Plugin manifest validation
- Resource file existence
- Registry consistency
- Version compatibility

### 7. Permissions
- Allow/deny list syntax
- Pattern matching validation
- Conflicting rules detection
- Enterprise settings conflicts

### 8. Known Issues
- Check lessons-learned.md for NEEDS_FIX entries
- Check for known error patterns
- Compare against common fixes database

## Implementation

When invoked:

1. Activate the `claude-code-debugger` agent
2. Run all diagnostic checks systematically
3. Categorize findings: PASS, WARN, FAIL
4. For each FAIL: provide specific fix command/steps
5. If `--fix` flag: automatically apply safe fixes
6. If `--report` flag: save full report to `.claude/debug-report.md`

### Auto-Fix Capabilities
The debugger can automatically fix:
- Non-executable hook scripts → `chmod +x`
- Invalid JSON → attempt repair and backup original
- Missing directories → create them
- Missing .gitignore entries → append
- Outdated Claude Code → suggest update command
- Missing jq dependency → suggest install

### Cannot Auto-Fix (Requires User Input)
- Missing API keys
- Wrong provider selection
- Business logic in hooks
- Permission policy decisions
- MCP server credentials

## Exit Codes (for scripting)
```
0 — All checks passed
1 — Warnings found but no failures
2 — Failures found
```
