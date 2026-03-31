# PR / Code Review Checklist

## Before Approving

### File Changes
- Check for unintended file changes: lock files (`pnpm-lock.yaml`), generated indexes, build artifacts
- Verify no `.env`, credentials, or secret files are included in the diff
- Confirm only files relevant to the PR scope are modified

### Plugin Changes
- If commands, skills, or agents were added/removed/modified, verify the plugin manifest (`plugin.json`) version is bumped
- Ensure `plugin.json` metadata (description, command count, skill count) matches actual contents
- Check that new commands/skills/agents are registered in the appropriate `index.json`

### Code Quality
- Verify TypeScript strict mode compliance: `npx tsc --noEmit` must pass
- Confirm `npx eslint .` reports no new errors
- Functions must not exceed 50 lines (per code-style rules)
- No `any` types without explicit justification in a comment

### Testing
- Confirm tests pass: `pnpm test`
- New features must include at least one test
- Bug fixes must include a regression test

### Security
- Check hook scripts for injection vulnerabilities (heredoc injection, JSON injection, path traversal)
- Verify MCP server inputs are sanitized
- No hardcoded credentials or API keys

### Documentation
- CHANGELOG.md should be updated for non-trivial changes (new features, breaking changes, bug fixes)
- New plugins must include a README or description in the manifest
- New skills must have a `SKILL.md` with proper frontmatter

## Review Response Format

When reviewing, provide feedback in categories:
- **BLOCK**: Must fix before merge (security issues, broken tests, missing critical logic)
- **REQUEST**: Should fix before merge (code quality, missing tests, unclear naming)
- **SUGGEST**: Optional improvements (style preferences, minor optimizations)
- **PRAISE**: Call out good patterns worth highlighting
