# Common failure modes and remediation playbooks

- **412 precondition failed due to stale eTag** → Read current task to fetch latest eTag before PATCH.
- **403 when automation account is not group member** → Add service account as group owner/member with planner access.
- **404 bucket not found after plan recreation** → Re-resolve plan/bucket IDs after lifecycle events.
- **429 throttling during bulk updates** → Batch updates and apply retry-after handling.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
