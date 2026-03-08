# Common failure modes and remediation playbooks

- **Sharing policy blocks external collaborator onboarding** → Align site setting with tenant external sharing baseline.
- **Broken permission inheritance causing overexposure** → Reset unique permissions and reapply role assignments least-privilege.
- **Retention label not published to target site** → Publish label to scope and wait for propagation before retry.
- **429 from large list traversal** → Use delta queries/indexed columns and pagination.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
