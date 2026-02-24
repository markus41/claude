# Operations Runbook

## Install and Bootstrap

1. Run `./scripts/install.sh`.
2. Configure provider keys (`ANTHROPIC_API_KEY`, optional `OPENAI_API_KEY`, etc.).
3. Start with `./scripts/start-mcp.sh`.
4. Validate with `./scripts/health-check.sh`.

## Standard Execution Flow

1. `/analyze` organization artifacts.
2. `/map` responsibility and dependency chains.
3. `/score` opportunities and rank ROI.
4. `/generate` workflow candidates.
5. `/simulate` with test scenarios.
6. `/deploy` approved workflows.

## Monitoring and Reliability

- Use hooks in `hooks/hooks.json` for lifecycle automation.
- Review operational scripts in `scripts/` for backup and integration setup.
- Use `mcp-server/README.md` and `mcp-server/OVERVIEW.md` for backend runtime details.

## Incident and Recovery

- Re-run health checks after deployment changes.
- Pause deployments if simulation quality gates fail.
- Use backups before schema or integration updates.
