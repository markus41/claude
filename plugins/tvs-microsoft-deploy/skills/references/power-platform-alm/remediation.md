# Common failure modes and remediation playbooks

- **Import failed: missing dependency** → Export dependency report and include required base solutions.
- **Connection reference unresolved in target** → Pre-create or remap connection references in deployment settings.
- **Plugin assembly version conflict** → Increment assembly version and publish plugin step order.
- **Pipeline service principal lacks environment access** → Grant Environment Maker + Deployment Pipeline role to service principal.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
