# Testing Strategy

> Populated from interview Phase 4: Testing & Quality.

## Test Pyramid

| Level | Tools | Location | Coverage Target |
|---|---|---|---|
| _Unit_ | _Vitest_ | _tests/_ | _80%_ |
| _Integration_ | _Vitest_ | _tests/_ | _Key paths_ |
| _E2E_ | _Playwright_ | _e2e/_ | _Critical flows_ |

## How Tests Are Organized

_Test file naming, co-location vs separate directory._

## What Must Be Tested

_Rules for when tests are required._

## Running Tests

```bash
pnpm test          # All tests
pnpm test:watch    # Watch mode
```
