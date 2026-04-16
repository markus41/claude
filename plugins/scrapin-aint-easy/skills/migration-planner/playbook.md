# Migration Playbook

## Pre-Migration

1. Document current state (schema version, API contracts, dependency versions)
2. Run full test suite — all tests must pass before starting
3. Run `scrapin_code_drift_scan` to identify all affected code
4. Create backup/snapshot of current state
5. Communicate migration plan to team

## During Migration

1. Apply changes in small, reversible steps
2. After each step: run relevant tests
3. If a step fails: STOP and evaluate — do not continue
4. Keep a log of what was applied

## Post-Migration

1. Run full test suite
2. Run `scrapin_code_drift_scan` — verify no new missing docs
3. Run `scrapin_agent_drift_status` — verify no agent inconsistencies
4. Update documentation and changelog
5. Monitor for regressions

## Rollback

1. Apply rollback in reverse order of migration steps
2. Verify each rollback step with tests
3. Document what went wrong and why
