# Testing Strategy

## Test Pyramid

| Level | Tool | Scope | Speed |
|-------|------|-------|-------|
| Unit | Vitest | Functions, utilities, store logic | Fast (<1s) |
| Component | Vitest + Testing Library | React component rendering and interaction | Fast |
| Integration | Vitest | Store + component interaction, MCP tool mocks | Medium |
| E2E | Playwright | Full browser flows, workflow builder interactions | Slow |

## Running Tests

```bash
pnpm test              # Run Vitest (unit + component)
pnpm test:ui           # Vitest with browser UI
pnpm test:e2e          # Playwright E2E tests
pnpm type-check        # TypeScript strict check
pnpm lint              # ESLint
```

## Conventions

- Test files live next to source: `*.test.ts` / `*.test.tsx`
- Use descriptive test names: `it("adds a node to the workflow when dragged from palette")`
- Prefer real implementations over mocks; mock only external boundaries
- Each PR must not reduce overall coverage

## Plugin Testing

- Plugins may include their own test files
- Plugin validation scripts: `check:plugin-context`, `check:plugin-schema`, `check:hooks`
- CI runs `plugin-preflight.yml` on every PR touching `plugins/`

## Coverage

<!-- Fill in: Current coverage percentages, targets, excluded paths -->

| Area | Current | Target |
|------|---------|--------|
| `src/stores/` | <!-- Fill in --> | 90% |
| `src/components/` | <!-- Fill in --> | 80% |
| `src/utils/` | <!-- Fill in --> | 90% |
