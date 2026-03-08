---
name: Microsoft Graph Administration
description: Use for tenant-level Microsoft Graph administration, identity governance automation, app consent hygiene, and operational troubleshooting across Entra ID, Exchange, and SharePoint workloads.
version: 1.0.0
---

# Microsoft Graph Administration

Use this skill when requests involve Graph API setup, permissioning, tenant objects, lifecycle operations, or Graph-related production incidents.

## Fast path
1. Confirm tenant, cloud (Global/GCC), and authentication pattern (delegated vs app-only).
2. Select least-privilege scopes and consent workflow.
3. Execute endpoint workflow and validate request/response contracts.
4. Apply failure remediation and rerun with trace IDs captured.

## References
- Endpoints and operation map: `references/microsoft-graph-admin/endpoints.md`
- Scopes and consent matrix: `references/microsoft-graph-admin/scopes.md`
- Payload schemas and examples: `references/microsoft-graph-admin/payloads.md`
- Failure modes and remediation playbooks: `references/microsoft-graph-admin/remediation.md`
