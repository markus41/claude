# Common failure modes and remediation playbooks

- **Embed token generation denied for service principal** → Enable service principal tenant switch and workspace access.
- **RLS identity mismatch shows blank visuals** → Validate username/roles mapping and dataset RLS definitions.
- **Capacity overload increases render latency** → Autoscale capacity and move noisy tenants to dedicated workloads.
- **Dataset refresh chain breaks downstream SLAs** → Introduce staged refresh windows and dependency monitoring alerts.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
