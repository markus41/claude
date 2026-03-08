# CLI Hub

## Command Index

Commands in `commands/` must define: purpose, required args, dry-run support, and rollback guidance.

## Contract Expectations

- Input parameters and defaults
- Preconditions and safety checks
- Side effects and output artifacts
- Exit codes and error taxonomy

## Examples

Use command docs to mirror runtime patterns:

```bash
/tvs:deploy-all --env prod --dry-run
/tvs:identity-drift --json
/tvs:status-check --env test
```

## Failure Handling

- Prefer explicit non-zero exits with actionable remediation.
- Log dependency failures with upstream/downstream context.
- Capture partial completion state for resumable deploys.
