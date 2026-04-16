# PR / Code Review Checklist

## Before Approving

### Code Quality
- TypeScript strict mode compliance — no `any` types without justification
- Functions under 50 lines
- Proper error handling (no swallowed errors)
- Structured logging with pino

### Testing
- New modules have corresponding tests
- Tests pass: `pnpm test`
- Bug fixes include regression tests

### Security
- No hardcoded credentials or API keys
- MCP tool inputs validated with Zod
- File path operations validated against path traversal

### Graph Schema
- Schema changes are additive (no breaking removals)
- Migration is idempotent (safe to run twice)
- New node/edge types documented in `config/graph-schema.yaml`

### Configuration
- New sources properly configured in YAML files
- Rate limits set appropriately (check source ToS)
- Package aliases complete for the source

## Review Categories

- **BLOCK**: Security issues, broken tests, data loss risk
- **REQUEST**: Missing tests, unclear naming, error handling gaps
- **SUGGEST**: Style improvements, optimization opportunities
- **PRAISE**: Good patterns, clever solutions, thorough coverage
