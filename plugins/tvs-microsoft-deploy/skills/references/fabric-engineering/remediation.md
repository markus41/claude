# Common failure modes and remediation playbooks

- **Job stuck in Queued due to exhausted capacity** → Scale or pause competing workloads and tune SKU settings.
- **Unauthorized on cross-workspace shortcut creation** → Grant both source and target workspace permissions plus connection access.
- **Git sync conflicts on parallel deploys** → Enforce branch protection and serialized promotion windows.
- **Semantic model refresh timeout** → Partition model and optimize incremental refresh policy.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
