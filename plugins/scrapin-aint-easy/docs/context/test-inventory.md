# Test Inventory

> Pointers to major test suites and their purpose.

## Test Suites

| Suite | Location | What It Tests | Run Command |
|---|---|---|---|
| _Core_ | _tests/core/_ | _Semaphore, token bucket, graph, vector_ | _pnpm test_ |
| _Crawler_ | _tests/crawler/_ | _Adapters, parsers, extractors_ | _pnpm test_ |
| _Drift_ | _tests/drift/_ | _Code and agent drift detection_ | _pnpm test_ |

## Golden Tests

_Tests that represent critical invariants — breaking these is a serious signal._

## Contract Tests

_API contract tests, if any._
