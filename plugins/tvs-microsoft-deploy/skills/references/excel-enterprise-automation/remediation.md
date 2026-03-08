# Common failure modes and remediation playbooks

- **Workbook locked by interactive user session** → Retry with backoff or schedule off-hours automation windows.
- **InvalidArgument from shape mismatch in range update** → Validate row/column dimensions before PATCH.
- **SessionNotFound after idle timeout** → Recreate session and resume from checkpoint.
- **Calc engine delay causing stale reads** → Trigger calculate endpoint and poll before readback.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
