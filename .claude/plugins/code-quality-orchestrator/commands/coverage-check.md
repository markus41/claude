---
description: Analyze test coverage and enforce thresholds.
---

# /coverage-check

Analyze test coverage and enforce thresholds.

## Usage

```bash
/coverage-check [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--threshold=<pct>` | Minimum coverage | 80 |
| `--lines` | Check line coverage | true |
| `--branches` | Check branch coverage | true |
| `--functions` | Check function coverage | true |
| `--statements` | Check statement coverage | true |
| `--changed-only` | Only changed files | false |
| `--suggest-tests` | Generate test suggestions | false |

## Examples

```bash
# Standard coverage check
/coverage-check

# Custom threshold
/coverage-check --threshold=90

# Get test suggestions for gaps
/coverage-check --suggest-tests

# Check only changed files
/coverage-check --changed-only --threshold=85
```

## Output

```
📊 TEST COVERAGE REPORT
═══════════════════════════════════════════════════════

Coverage Summary:
├── Statements:  85.2% (1024/1202) ✓
├── Branches:    78.5% (156/199)   ✓
├── Functions:   88.1% (74/84)     ✓
└── Lines:       84.8% (998/1177)  ✓

Threshold: 80% ✓ PASSED

Coverage Gaps (below threshold):
┌────────────────────────────────┬──────────┬───────────┐
│ File                           │ Coverage │ Gap       │
├────────────────────────────────┼──────────┼───────────┤
│ src/utils/parser.ts            │ 65%      │ -15%      │
│ src/services/validator.ts      │ 72%      │ -8%       │
└────────────────────────────────┴──────────┴───────────┘

Suggested Tests:
1. parser.ts: Add test for error handling in parseConfig()
2. validator.ts: Add branch coverage for strict mode
```
