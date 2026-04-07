---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Coding Conventions

## Language & Module System

- TypeScript strict mode (all strict flags enabled)
- ES modules (`"type": "module"` in package.json)
- Node.js 20+ — use `node:` protocol for built-in imports (`import { readFile } from 'node:fs/promises'`)
- File extensions in import paths: `.js` suffix for ESM resolution

## Naming

- **Files**: kebab-case (`token-bucket.ts`, `algo-graph.ts`)
- **Classes**: PascalCase (`AsyncSemaphore`, `GraphAdapter`)
- **Functions/methods**: camelCase (`upsertNode`, `parseImports`)
- **Constants**: UPPER_SNAKE_CASE (`ALGO_CATEGORIES`, `STALE_THRESHOLD_MS`)
- **Interfaces/types**: PascalCase, no `I` prefix (`SourceConfig` not `ISourceConfig`)
- **Enums**: PascalCase members (`NodeLabel.Symbol`)

## Functions

- Maximum 50 lines per function — extract helpers if longer
- Pure functions preferred where possible
- Every async function must handle errors: re-throw typed errors or return Result-style
- Avoid `any` — use `unknown` with type guards when the type is genuinely unknown

## Error Handling

- Use typed error classes for domain errors
- Log errors with `pino` structured logging — always include context (operation, input, etc.)
- Never swallow errors silently — at minimum, log and re-throw
- At system boundaries (user input, external APIs): validate with Zod schemas

## Logging

- Use `pino` for all logging (structured JSON)
- Log levels: `trace` for internals, `debug` for dev, `info` for operations, `warn` for recoverable issues, `error` for failures
- Every log line must include the module name via `pino({ name: 'module-name' })`

## Imports

- Group imports: node builtins → external packages → internal modules
- Prefer named imports over default imports
- Use `type` imports for type-only imports: `import type { X } from './y.js'`

## Shell Scripting

- Both Bash and PowerShell are allowed
- Use PowerShell (`pwsh`) for cross-platform scripts or when targeting Windows
- Use Bash for Unix-specific operations (hooks, CI)
- PowerShell scripts use `.ps1` extension
- Bash scripts use `.sh` extension with `#!/usr/bin/env bash` shebang
- Both must handle errors: Bash `set -euo pipefail`, PowerShell `$ErrorActionPreference = 'Stop'`
