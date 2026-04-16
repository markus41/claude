# Security Rules

## Credentials

- NEVER commit API keys, tokens, or secrets to the repository
- All secrets via environment variables: `FIRECRAWL_API_KEY`, `GITHUB_TOKEN`, `NEO4J_PASSWORD`
- `.env` files must be gitignored — only `.env.example` with placeholder values

## Input Validation

- All MCP tool inputs validated with Zod schemas before processing
- URL inputs must be validated as proper URLs before fetching
- File paths must be validated — no path traversal (`../`) allowed
- Rate limit config values must be bounded (rps > 0, concurrency >= 1)

## Web Scraping

- Respect `robots.txt` and rate limits for all crawled sources
- Never exceed configured RPS limits even under concurrent crawls
- Store only documentation content — never scrape or store PII
- FIRECRAWL_API_KEY must not be logged or included in error messages

## Graph Database

- Use parameterized queries for Neo4j to prevent injection
- Kùzu queries: escape single quotes in string values
- Never expose raw database errors to MCP tool responses

## Hook Scripts

- All Bash hook scripts must use `set -euo pipefail`
- All PowerShell hook scripts must use `$ErrorActionPreference = 'Stop'`
- Validate file paths with `realpath` (Bash) or `Resolve-Path` (PowerShell) before operations
- Use `jq` (Bash) or `ConvertTo-Json`/`ConvertFrom-Json` (PowerShell) for JSON — never string concatenation
- Both Bash and PowerShell hooks are supported
