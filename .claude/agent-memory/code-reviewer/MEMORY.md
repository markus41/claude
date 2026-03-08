# Code Reviewer Agent Memory

## Patterns to Check in Claude Code Plugin Files

### Hook event name accuracy
- Valid events: PreToolUse, PostToolUse, PostToolUseFailure, Notification, Stop, UserPromptSubmit, SessionStart
- `PostToolUseFailure` is distinct from `PostToolUse` — error-capture hooks should use the former
- lessons-learned-capture.sh belongs on PostToolUseFailure, not PostToolUse with matcher "*"

### inject-context.sh pattern (incomplete by design)
- The CONTEXT variable is built but never output in the approve JSON
- This is a recurring incomplete-scaffold pattern in cc-setup.md

### Security: reason field injection
- Line ~484: `echo "{\"decision\": \"block\", \"reason\": \"Blocked dangerous command: $pattern\"}"`
- `$pattern` is unquoted in JSON — if pattern contains `"` or `\` it breaks JSON
- Always use jq to build JSON output in hook scripts

### tsc --noEmit <single-file> is wrong
- `npx tsc --noEmit "$FILE"` does not work as intended: tsc ignores tsconfig and treats the file as a standalone module, breaking imports
- Correct approach: run `npx tsc --noEmit` (whole project) or use `tsc -p tsconfig.json --noEmit`

### MCP package names to verify
- `mongodb-mcp`, `redis-mcp`, `supabase-mcp`, `linear-mcp`, `vercel-mcp`, `cloudflare-mcp` are informal names not matching npm registry
- `@context7/mcp-server` — verify package name on npm
- `@modelcontextprotocol/server-*` is the official namespace

### Duplicate detection entries
- pnpm-workspace.yaml appears in both PM_MAP and MONOREPO_MAP (intentional overlap but worth noting)

### Referenced but undefined scripts
- on-stop.sh is referenced in settings JSON but has no implementation body

### --dry-run coverage
- Flag is declared but behavior is never specified beyond "show plan without writing"
