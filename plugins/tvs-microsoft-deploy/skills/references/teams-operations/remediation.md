# Common failure modes and remediation playbooks

- **Team provisioning delayed beyond SLA** → Poll async operation endpoint until succeeded; avoid duplicate creates.
- **Private channel creation fails for unsupported owner set** → Ensure at least one eligible owner and compliance prechecks pass.
- **App sideload blocked by org policy** → Update Teams app setup policy and app permission policy.
- **Guest access inconsistencies across teams** → Harmonize Entra B2B + Teams guest policy and re-sync members.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
