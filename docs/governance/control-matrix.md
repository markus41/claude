# TVS Microsoft Deploy Governance Control Matrix

This matrix maps governance controls to executable safeguards in the repository and defines required evidence artifacts for audits and client assurance.

| Control ID | Risk Addressed | Implementation (scripts/hooks/commands) | Execution Command(s) | Required Evidence Artifacts |
|---|---|---|---|---|
| GOV-001 | Scope/permission misuse in Microsoft identity workflows | `plugins/tvs-microsoft-deploy/hooks/scope-permission-misuse-check.sh`, `plugins/tvs-microsoft-deploy/scripts/identity_policy_checks.py`, `plugins/tvs-microsoft-deploy/hooks/identity-policy-engine.sh` | `python3 plugins/tvs-microsoft-deploy/scripts/identity_policy_checks.py --json` | JSON findings output, CAB approval record for any high-privilege scope override, run timestamp |
| GOV-002 | Tenant drift across Azure and Dataverse environments | `plugins/tvs-microsoft-deploy/hooks/tenant-drift-check.sh`, `plugins/tvs-microsoft-deploy/hooks/tenant-isolation-validator.sh`, `plugins/tvs-microsoft-deploy/scripts/identity_drift_detect.py` | `python3 plugins/tvs-microsoft-deploy/scripts/identity_drift_detect.py --help` (or operational runbook command) | Tenant diff report, approved target tenant list, deployment job logs |
| GOV-003 | Unsafe destructive calls (data/resource deletion) | `plugins/tvs-microsoft-deploy/hooks/unsafe-destructive-call-check.sh`, `plugins/tvs-microsoft-deploy/commands/deploy-all.md`, `plugins/tvs-microsoft-deploy/commands/deploy-azure.md` | Guardrail enforced automatically through PreToolUse hooks during `az`/`pac`/`curl` operations | Change window approval, command transcript with guardrail pass/deny result, rollback plan reference |
| GOV-004 | Missing audit metadata on mutating changes | `plugins/tvs-microsoft-deploy/hooks/audit-metadata-check.sh`, `plugins/tvs-microsoft-deploy/scripts/m365_operational_update.py`, `plugins/tvs-microsoft-deploy/scripts/power_platform_alm.py` | Include `--change-ticket`, `--run-id`, `--requested-by` and/or `X-Audit-*` headers in command invocations | Run metadata manifest, ticket reference, operator identity record |
| GOV-005 | Contract drift in third-party APIs (Graph/Fabric/Dataverse/Planner/Stripe/Firebase) | `plugins/tvs-microsoft-deploy/tests/contract/test_api_contracts.py`, `plugins/tvs-microsoft-deploy/tests/contract/README.md` | `pytest plugins/tvs-microsoft-deploy/tests/contract/test_api_contracts.py -q` | CI test report, sanitized response samples, defect ticket IDs for failures |

## Audit packaging checklist

1. Export hook execution logs for all guarded deployment sessions.
2. Preserve command transcripts showing metadata and tenant context.
3. Attach contract-test reports to release records.
4. Store all artifacts in immutable release evidence storage with retention per policy.
