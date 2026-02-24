# TAIA Plugin Upgrade Pack

This branch adds eight TAIA-focused upgrades to strengthen wind-down and sale execution.

1. **New command:** `commands/taia-readiness.md` for repeatable readiness scoring.
2. **New script:** `scripts/taia_readiness_check.sh` for CLI-grade checks and strict mode.
3. **New workflow:** `workflows/taia-day0-day30.md` for post-close transition control.
4. **New safety hook:** `hooks/taia-winddown-guard.sh` to prevent accidental destructive actions.
5. **Status visibility update:** `commands/status-check.md` links TAIA readiness command.
6. **Sale workflow hardening:** `workflows/taia-sale-prep.md` references readiness + transition + guard.
7. **Deployment guidance update:** `commands/deploy-all.md` includes TAIA safety pre-check.
8. **Standardized outputs:** readiness command documents markdown/json report artifacts.

## Suggested Execution Order

1. `/tvs:status-check --entity=taia`
2. `/tvs:extract-a3`
3. `/tvs:normalize-carriers`
4. `/tvs:taia-readiness --strict --export-md --export-json`
5. `workflows/taia-day0-day30.md` after close


## Extended Microsoft Buildout Assets

- Skills: `m365-graph-advanced.md`, `fabric-embedded-analytics.md`, `excel-automation-advanced.md`, `planner-orchestration.md`, `external-integration-apis.md`
- Commands: `deploy-planner.md`, `deploy-embedded-analytics.md`
- Agents: `planner-orchestrator-agent.md`, `excel-fabric-agent.md`
- Scripts: `create_planner_plan.py`, `publish_embedded_analytics.sh`, `excel_workbook_profile.py`
- Docs: `docs/API_CATALOG.md`

## Release Safety

- Branch hygiene: `scripts/verify_branch_merged_with_main.sh` ensures the current branch contains all commits from `main` before push/PR.
