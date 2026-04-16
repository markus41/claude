# Bug Triage Heuristics

## Severity Classification

### Critical
- Data loss or corruption
- Security vulnerability
- Complete service outage
- Affects all users

### High
- Feature completely broken
- Performance degradation > 50%
- Affects majority of users
- No workaround available

### Medium
- Feature partially broken with workaround
- Intermittent failures
- Affects subset of users
- Performance degradation 10-50%

### Low
- Cosmetic issues
- Edge cases with easy workarounds
- Affects very few users
- Enhancement disguised as bug

## Investigation Checklist

1. Can the bug be reproduced?
2. When did it start? (check recent commits)
3. Is it related to a dependency update?
4. Does `scrapin_code_drift_report` show relevant API changes?
5. Is the affected symbol documented? (`scrapin_search`)
6. Are there related known issues?

## Common Root Causes

- API contract change without code update → check `scrapin_diff`
- Deprecated API usage → check `scrapin_code_drift_report`
- Missing error handling → check code review checklist
- Race condition → check for unguarded async operations
