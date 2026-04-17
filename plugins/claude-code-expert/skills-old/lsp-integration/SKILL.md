---
description: LSP server detection, installation, and Claude Code integration — auto-invoke when setting up a new project, running /cc-setup, or configuring IDE tooling
model: claude-sonnet-4-6
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# LSP Integration — Phase 7 of /cc-setup

LSP (Language Server Protocol) servers power real-time diagnostics, type checking, and formatting. Claude Code integrates with LSP through PostToolUse hooks to catch errors immediately after writing files.

## 18-Server Detection Matrix

| Language | LSP Server | Install Command | Detect Signal |
|----------|-----------|-----------------|---------------|
| TypeScript/JS | `typescript-language-server` | `npm i -g typescript-language-server typescript` | `tsconfig.json`, `package.json` |
| Python (strict) | `pyright` | `npm i -g pyright` | `pyproject.toml`, `requirements.txt` |
| Python (general) | `pylsp` | `pip install python-lsp-server` | `.py` files |
| Go | `gopls` | `go install golang.org/x/tools/gopls@latest` | `go.mod` |
| Rust | `rust-analyzer` | `rustup component add rust-analyzer` | `Cargo.toml` |
| Java | `jdtls` | Eclipse JDT LS (via Mason/LspInstall) | `pom.xml`, `build.gradle` |
| C# | `omnisharp` | `dotnet tool install -g csharp-ls` | `*.csproj`, `*.sln` |
| Ruby | `solargraph` | `gem install solargraph` | `Gemfile` |
| PHP | `intelephense` | `npm i -g intelephense` | `composer.json` |
| Elixir | `elixir-ls` | `mix archive.install hex elixir_ls` | `mix.exs` |
| Svelte | `svelte-language-server` | `npm i -g svelte-language-server` | `svelte.config.*` |
| Vue | `vue-language-server` | `npm i -g @vue/language-server` | `nuxt.config.*` |
| Tailwind CSS | `tailwindcss-language-server` | `npm i -g @tailwindcss/language-server` | `tailwind.config.*` |
| GraphQL | `graphql-language-service-cli` | `npm i -g graphql-language-service-cli` | `*.graphql`, `schema.gql` |
| Prisma | `prisma-language-server` | `npm i -g @prisma/language-server` | `prisma/` directory |
| YAML | `yaml-language-server` | `npm i -g yaml-language-server` | `.yaml`, `.yml` files |
| Dockerfile | `dockerfile-language-server` | `npm i -g dockerfile-language-server-nodejs` | `Dockerfile` |
| Bash | `bash-language-server` | `npm i -g bash-language-server` | `.sh` files, `.claude/hooks/` |

## Detection Script

Run during Phase 1 of `/cc-setup` to identify which LSPs to recommend:

```bash
#!/usr/bin/env bash
# Detect and report LSP recommendations for current project
check_lsp() {
  local name="$1" signal="$2" install="$3"
  if ls $signal 2>/dev/null | head -1 | grep -q .; then
    if command -v "$(echo "$name" | cut -d/ -f1)" &>/dev/null; then
      echo "  OK:      $name"
    else
      echo "  MISSING: $name — install: $install"
    fi
  fi
}

echo "=== LSP Detection ==="
check_lsp "typescript-language-server" "tsconfig.json package.json" "npm i -g typescript-language-server typescript"
check_lsp "pyright" "pyproject.toml requirements.txt" "npm i -g pyright"
check_lsp "gopls" "go.mod" "go install golang.org/x/tools/gopls@latest"
check_lsp "rust-analyzer" "Cargo.toml" "rustup component add rust-analyzer"
check_lsp "solargraph" "Gemfile" "gem install solargraph"
check_lsp "svelte-language-server" "svelte.config.*" "npm i -g svelte-language-server"
check_lsp "tailwindcss-language-server" "tailwind.config.*" "npm i -g @tailwindcss/language-server"
check_lsp "prisma-language-server" "prisma/" "npm i -g @prisma/language-server"
check_lsp "bash-language-server" ".claude/hooks/" "npm i -g bash-language-server"
```

## Claude Code Hook Integration

Claude Code doesn't use LSP directly, but you can use PostToolUse hooks to run LSP-powered diagnostics after file writes.

### TypeScript — PostToolUse diagnostics hook

```bash
#!/usr/bin/env bash
# .claude/hooks/auto-typecheck.sh
# Registered on: PostToolUse (Write|Edit matcher on *.ts, *.tsx)
INPUT=$(head -c 65536)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

if [[ "$FILE" != *.ts ]] && [[ "$FILE" != *.tsx ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Run whole-project check filtered to changed file — single-file mode ignores tsconfig.json
ERRORS=$(npx tsc --noEmit 2>&1 | grep -F "$(basename "$FILE")" | head -5)
if [ -n "$ERRORS" ]; then
  echo "TypeScript errors in $(basename "$FILE"):" >&2
  echo "$ERRORS" >&2
fi

echo '{"decision": "approve"}'
```

### Python — pyright diagnostics hook

```bash
#!/usr/bin/env bash
# Registered on: PostToolUse (Write|Edit matcher on *.py)
INPUT=$(head -c 65536)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')

if [[ "$FILE" != *.py ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

ERRORS=$(pyright "$FILE" 2>&1 | grep -E "error:" | head -5)
if [ -n "$ERRORS" ]; then
  echo "Pyright errors:" >&2
  echo "$ERRORS" >&2
fi

echo '{"decision": "approve"}'
```

### Rust — cargo check hook

```bash
#!/usr/bin/env bash
# Registered on: PostToolUse (Write|Edit matcher on *.rs)
INPUT=$(head -c 65536)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')

if [[ "$FILE" != *.rs ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

cargo check 2>&1 | grep -E "^error" | head -10 >&2
echo '{"decision": "approve"}'
```

## settings.json Hook Registration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/auto-typecheck.sh"
          }
        ]
      }
    ]
  }
}
```

## Why LSP Integration Matters

- **Immediate feedback**: Errors surface right after Claude writes a file, not at build time
- **Type-safe edits**: TypeScript errors caught before Claude attempts to run tests
- **Batch diagnostics**: Run `tsc --noEmit` across the whole project to catch cross-file breakage
- **Cost savings**: Catching errors early avoids multiple round-trips of write → test → fix

## LSP vs Built-in IDE Diagnostics

Claude Code has a built-in `LSP` tool (via `mcp__ide__getDiagnostics`) when running in VS Code or JetBrains IDE extensions. The hook approach above is for CLI usage where no IDE is attached.

| Context | Diagnostics Source |
|---------|-------------------|
| VS Code extension | `mcp__ide__getDiagnostics` (built-in) |
| JetBrains extension | `mcp__ide__getDiagnostics` (built-in) |
| CLI (terminal) | PostToolUse hook → `tsc --noEmit` / `pyright` |
| CI/CD headless | PostToolUse hook → LSP CLI tools |

## Cost Note

LSP installation is one-time. The diagnostics hooks add ~100ms per file write, which is negligible vs the cost of a missed type error causing a failed test run (which requires another full turn).
