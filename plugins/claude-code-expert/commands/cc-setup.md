# /cc-setup — Full Repo Analysis & Claude Code Deployment

Analyze the current repository, detect its tech stack, and deploy a complete Claude Code configuration including CLAUDE.md, settings.json, hooks, recommended MCP servers, and LSP hints.

## Usage

```bash
/cc-setup                      # Full interactive setup
/cc-setup --auto               # Non-interactive, best-guess defaults
/cc-setup --dry-run             # Show what would be configured without writing
/cc-setup --mcp-only            # Only detect and install MCP servers
/cc-setup --audit               # Audit existing setup, suggest improvements
```

## What This Command Does

### Phase 1: Repo Analysis (read-only)

Scan the repo to build a project fingerprint:

```bash
# 1. Detect languages & frameworks
# Look for these markers:
DETECT_MAP=(
  "package.json:Node.js"
  "tsconfig.json:TypeScript"
  "requirements.txt:Python"
  "pyproject.toml:Python"
  "Pipfile:Python"
  "go.mod:Go"
  "Cargo.toml:Rust"
  "pom.xml:Java/Maven"
  "build.gradle:Java/Gradle"
  "Gemfile:Ruby"
  "composer.json:PHP"
  "*.csproj:C#/.NET"
  "Package.swift:Swift"
  "mix.exs:Elixir"
)

# 2. Detect frameworks
FRAMEWORK_MAP=(
  "next.config.*:Next.js"
  "nuxt.config.*:Nuxt.js"
  "vite.config.*:Vite"
  "angular.json:Angular"
  "svelte.config.*:SvelteKit"
  "remix.config.*:Remix"
  "astro.config.*:Astro"
  "gatsby-config.*:Gatsby"
  "nest-cli.json:NestJS"
  "django:Django"
  "flask:Flask"
  "fastapi:FastAPI"
  "rails:Rails"
  "spring:Spring Boot"
)

# 3. Detect infrastructure
INFRA_MAP=(
  "Dockerfile:Docker"
  "docker-compose*:Docker Compose"
  "kubernetes/:Kubernetes"
  "helm/:Helm"
  "terraform/:Terraform"
  "pulumi/:Pulumi"
  ".github/workflows/:GitHub Actions"
  "Jenkinsfile:Jenkins"
  ".gitlab-ci.yml:GitLab CI"
  ".circleci/:CircleCI"
  "serverless.yml:Serverless"
  "cdk.json:AWS CDK"
  "bicep:Azure Bicep"
  "ansible/:Ansible"
)

# 4. Detect databases & services
SERVICE_MAP=(
  "prisma/:Prisma"
  "drizzle.config.*:Drizzle ORM"
  "knexfile.*:Knex"
  ".env*DATABASE_URL*postgres:PostgreSQL"
  ".env*DATABASE_URL*mysql:MySQL"
  ".env*MONGO:MongoDB"
  ".env*REDIS:Redis"
  "supabase/:Supabase"
  "firebase.json:Firebase"
  ".env*STRIPE:Stripe"
  ".env*SENTRY:Sentry"
  ".env*SLACK:Slack"
)

# 5. Detect test frameworks
TEST_MAP=(
  "jest.config*:Jest"
  "vitest.config*:Vitest"
  "cypress.config*:Cypress"
  "playwright.config*:Playwright"
  "pytest.ini:Pytest"
  "setup.cfg:[pytest]:Pytest"
  ".mocharc*:Mocha"
  "karma.conf*:Karma"
)

# 6. Detect package managers
PM_MAP=(
  "pnpm-lock.yaml:pnpm"
  "yarn.lock:yarn"
  "package-lock.json:npm"
  "bun.lockb:bun"
  "poetry.lock:poetry"
  "Pipfile.lock:pipenv"
  "uv.lock:uv"
)
```

### Phase 2: Generate CLAUDE.md

Based on detected stack, generate a project-specific `CLAUDE.md`:

```markdown
# Project Instructions

## Build & Test
- Install: `{detected_install_cmd}`
- Build: `{detected_build_cmd}`
- Test: `{detected_test_cmd}`
- Lint: `{detected_lint_cmd}`
- Type Check: `{detected_typecheck_cmd}`

## Tech Stack
- Language: {languages}
- Framework: {framework}
- Database: {databases}
- Infrastructure: {infra}

## Key Paths
- Source: {src_dir}
- Tests: {test_dir}
- Config: {config_files}

## Conventions
- {detected_conventions}
```

### Phase 3: Generate settings.json

Create `.claude/settings.json` with appropriate permissions:

```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "Glob", "Grep",
      "{package_manager} *",
      "Bash(git *)",
      "Bash({test_cmd})",
      "Bash({build_cmd})",
      "Bash({lint_cmd})"
    ],
    "deny": [
      "Bash(rm -rf /)", "Bash(sudo *)"
    ]
  },
  "model": "claude-sonnet-4-6",
  "autoMemory": true,
  "autoCompact": true
}
```

### Phase 4: Detect & Install MCP Servers

Auto-detect which MCP servers would be useful based on the repo:

| Detection | MCP Server | Package |
|-----------|-----------|---------|
| PostgreSQL connection | `postgres` | `@modelcontextprotocol/server-postgres` |
| SQLite files | `sqlite` | `@modelcontextprotocol/server-sqlite` |
| `.github/` directory | `github` | `@modelcontextprotocol/server-github` |
| Filesystem needs | `filesystem` | `@modelcontextprotocol/server-filesystem` |
| Browser testing | `puppeteer` | `@modelcontextprotocol/server-puppeteer` |
| Playwright config | `playwright` | `@playwright/mcp` |
| Sentry DSN | `sentry` | `@modelcontextprotocol/server-sentry` |
| Slack token | `slack` | `@modelcontextprotocol/server-slack` |
| Docker/K8s | `docker` | `@modelcontextprotocol/server-docker` |
| Any project | `memory` | `@modelcontextprotocol/server-memory` |
| Any project | `context7` | `@context7/mcp-server` |
| Web research | `firecrawl` | `firecrawl-mcp` |
| Web research | `perplexity` | `perplexity-mcp` |
| MongoDB connection | `mongodb` | `mongodb-mcp` |
| Redis connection | `redis` | `redis-mcp` |
| Supabase project | `supabase` | `supabase-mcp` |
| Linear issues | `linear` | `linear-mcp` |
| Notion workspace | `notion` | `@notionhq/mcp-server` |
| Vercel deployment | `vercel` | `vercel-mcp` |
| Cloudflare Workers | `cloudflare` | `cloudflare-mcp` |

#### MCP Installation Commands

```bash
# For each detected server, run:
claude mcp add --transport stdio --scope project {name} -- npx -y {package}

# For servers needing env vars:
claude mcp add --transport stdio --scope project -e API_KEY=$API_KEY {name} -- npx -y {package}

# For HTTP transport servers:
claude mcp add --transport http --scope project {name} {url}
```

#### Always-Recommended MCP Servers

These are useful for any project:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "disabled": false
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "disabled": false
    }
  }
}
```

### Phase 5: LSP Detection & Configuration

Detect which Language Server Protocols are available or recommended:

| Language | LSP Server | Install |
|----------|-----------|---------|
| TypeScript/JS | `typescript-language-server` | `npm i -g typescript-language-server typescript` |
| Python | `pylsp` / `pyright` | `pip install python-lsp-server` / `npm i -g pyright` |
| Go | `gopls` | `go install golang.org/x/tools/gopls@latest` |
| Rust | `rust-analyzer` | Via rustup component |
| Java | `jdtls` | Eclipse JDT LS |
| C# | `omnisharp` | OmniSharp |
| Ruby | `solargraph` | `gem install solargraph` |
| PHP | `intelephense` | `npm i -g intelephense` |
| Elixir | `elixir-ls` | Via Mix |
| Svelte | `svelte-language-server` | `npm i -g svelte-language-server` |
| Vue | `vue-language-server` | `npm i -g @vue/language-server` |
| Tailwind | `tailwindcss-language-server` | `npm i -g @tailwindcss/language-server` |
| GraphQL | `graphql-language-service-cli` | `npm i -g graphql-language-service-cli` |
| Prisma | `prisma-language-server` | `npm i -g @prisma/language-server` |
| YAML | `yaml-language-server` | `npm i -g yaml-language-server` |
| JSON | `vscode-json-languageserver` | `npm i -g vscode-json-languageserver` |
| Dockerfile | `dockerfile-language-server` | `npm i -g dockerfile-language-server-nodejs` |
| Bash | `bash-language-server` | `npm i -g bash-language-server` |
| SQL | `sql-language-server` | `npm i -g sql-language-server` |
| Markdown | `marksman` | Via GitHub releases |
| Terraform | `terraform-ls` | Via HashiCorp |
| Helm | `helm-ls` | Via GitHub releases |

#### LSP in Claude Code Context

Claude Code doesn't directly use LSP, but knowing which LSP servers are available helps:
1. **IDE integration** — Ensure the user's editor has proper LSP support for the stack
2. **MCP bridge** — Some MCP servers wrap LSP capabilities (diagnostics, completions)
3. **Hooks** — LSP diagnostics can be integrated via hooks (e.g., run LSP check pre-commit)

```bash
# Example: Use LSP diagnostics in a hook
# .claude/hooks/lsp-check.sh
#!/bin/bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')

if [ "$TOOL" = "Write" ] || [ "$TOOL" = "Edit" ]; then
  FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
  if [[ "$FILE" == *.ts ]] || [[ "$FILE" == *.tsx ]]; then
    # Run TypeScript check on the file
    npx tsc --noEmit "$FILE" 2>/dev/null
    if [ $? -ne 0 ]; then
      echo '{"decision": "approve"}' # Allow but warn
      echo "TypeScript errors detected in $FILE" >&2
    fi
  fi
fi
echo '{"decision": "approve"}'
```

### Phase 6: Generate Hooks

Set up recommended hooks based on the stack:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/security-guard.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/lessons-learned-capture.sh"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/on-stop.sh"
        }]
      }
    ]
  }
}
```

### Phase 7: Create Rules

Generate `.claude/rules/` files based on detected stack:

- `code-style.md` — Language-specific conventions (from detected linter configs)
- `git-workflow.md` — Git conventions (from existing commit history patterns)
- `testing.md` — Test conventions (from detected test framework)
- `architecture.md` — Project structure conventions
- `self-healing.md` — Error capture and learning loop
- `lessons-learned.md` — Empty starter for error tracking

### Phase 8: Verification

Run a final check:

```bash
# Verify CLAUDE.md exists and is valid
# Verify settings.json is valid JSON
# Verify .mcp.json is valid JSON
# Test each MCP server connectivity
# Check hook scripts are executable
# Report summary of what was configured
```

## Implementation

When `/cc-setup` is invoked:

1. **Read the codebase** — Use Glob and Grep to detect markers from the detection maps above
2. **Build fingerprint** — Compile list of languages, frameworks, databases, infra, tests, package managers
3. **Ask user** (unless `--auto`):
   - Confirm detected stack
   - Choose permission level (permissive / moderate / strict)
   - Select which MCP servers to install
   - Choose hook aggressiveness (minimal / standard / comprehensive)
4. **Generate files**:
   - `CLAUDE.md` (if not exists, or offer to enhance existing)
   - `.claude/settings.json`
   - `.claude/settings.local.json` (template for personal overrides)
   - `.mcp.json`
   - `.claude/rules/*.md`
   - `.claude/hooks/*.sh`
5. **Install MCP servers** — Run `claude mcp add` for each selected server
6. **Verify** — Test configurations, report results
7. **Output summary** — Print what was configured with next steps

## Flags

| Flag | Description |
|------|-------------|
| `--auto` | Non-interactive mode with best-guess defaults |
| `--dry-run` | Show plan without writing files |
| `--mcp-only` | Only detect and configure MCP servers |
| `--hooks-only` | Only set up hooks |
| `--rules-only` | Only generate rules files |
| `--audit` | Audit existing config and suggest improvements |
| `--force` | Overwrite existing configurations |
| `--preset <name>` | Use preset: `developer`, `ci-cd`, `secure`, `minimal` |
| `--skip-mcp` | Skip MCP server installation |
| `--skip-hooks` | Skip hook generation |
| `--skip-lsp` | Skip LSP detection |

## Presets

### `developer` (default)
- Permissive permissions for local dev
- All recommended MCP servers
- Standard hooks (security guard + error capture)
- Auto-memory enabled

### `ci-cd`
- Restrictive permissions (read-only + test/build)
- Minimal MCP servers
- No hooks (or audit-only hooks)
- Auto-memory disabled
- Uses haiku model for cost efficiency

### `secure`
- Strict permissions (read + grep only)
- No MCP servers
- Comprehensive audit hooks on every tool call
- No web access tools

### `minimal`
- Basic CLAUDE.md only
- Default permissions
- No MCP, no hooks, no rules
