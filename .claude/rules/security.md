# Security Rules

## Credentials and Secrets

- NEVER commit credentials, API keys, tokens, or secrets to the repository
- NEVER commit `.env` files — only `.env.example` or `.env.template` with placeholder values
- If a file likely contains secrets (`.env`, `credentials.json`, `*.pem`, `*.key`), warn the user before staging
- Secrets belong in environment variables or Azure Key Vault, never in source code

## MCP Server Security

- All MCP server inputs must be sanitized before processing
- Use `jq` for safe JSON construction in shell scripts — never string concatenation
- Validate MCP tool parameters against expected types and ranges
- MCP servers running as child processes (stdio transport) must not expose network ports

## Hook Script Security

- Hook scripts must validate all file paths using `realpath` to prevent path traversal
- Reject any path that resolves outside the project root
- Use hardcoded blocklists for dangerous patterns — never source blocklists from external files
- Sanitize all inputs written to `lessons-learned.md` or other auto-generated files (strip backticks, escape special characters)
- Use `flock` for atomic file writes in concurrent hook execution

## Plugin Manifest Security

- Plugin manifests (`plugin.json`) must not request permissions beyond what the plugin needs
- Review `allowed-tools` in skill frontmatter — restrict to the minimum required set
- Agent definitions must not grant shell access unless the agent explicitly requires it

## Web-Facing Code (OWASP Top 10)

- Sanitize all user inputs before rendering (XSS prevention)
- Use parameterized queries if any database interaction is added
- Validate and sanitize URL parameters and form data
- Set appropriate CORS headers — never use `Access-Control-Allow-Origin: *` in production
- Use HTTPS for all external API calls
- Avoid `dangerouslySetInnerHTML` in React components unless content is trusted and sanitized
- Keep dependencies updated — check for known vulnerabilities with `pnpm audit`

## Bash Script Security

- Quote all variables in shell scripts: `"${VAR}"` not `$VAR`
- Use `set -euo pipefail` at the top of all bash scripts
- Never use `eval` on user-provided or external input
- Prefer `printf '%s'` over `echo` for untrusted data
