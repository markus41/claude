# Security Rules

## Hook Script Injection Prevention

- All hook scripts must sanitize user-supplied input before use
- Use `flock` for atomic file writes in shared files (e.g., lessons-learned.md)
- Heredoc content must be quoted (`<< 'EOF'`) to prevent variable expansion
- Use `jq` for JSON construction instead of string concatenation
- Validate file paths with `realpath` to prevent path traversal

## Plugin Sandboxing

- Plugins execute in the Claude Code runtime, not in a separate sandbox
- Plugin hooks run as shell scripts with the same permissions as the user
- Never install plugins from untrusted sources without reviewing the manifest
- The `plugin-preflight.yml` CI workflow validates plugin structure on PRs

<!-- Fill in: Future sandboxing plans, permission model -->

## Credential Handling

- Never commit `.env` files, API keys, or secrets to the repository
- Store secrets in environment variables referenced via `${VAR}` in `.mcp.json`
- The `.gitignore` must include `.env`, `*.pem`, `credentials.json`
- MCP server API keys are injected at runtime, not hardcoded

## CI Security

- GitHub Actions workflows use `permissions` blocks to limit token scope
- Secrets are passed via GitHub repository secrets, never in workflow files
- PR workflows from forks do not have access to repository secrets

## Known Threat Vectors

| Vector | Mitigation | Status |
|--------|-----------|--------|
| Malicious plugin hook | CI preflight checks, manual review | Active |
| MCP server token leak | Env var injection, no hardcoding | Active |
| Heredoc injection in hooks | Quoted heredocs, input sanitization | Active |
<!-- Fill in: Additional threat vectors -->
