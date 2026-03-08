# Common failure modes and remediation playbooks

- **403 insufficient privileges after consent changes** → Re-consent in tenant admin center and verify token claims.
- **429 throttling on directory-wide scans** → Implement retry-after exponential backoff with jitter.
- **400 invalid object reference for deleted principals** → Refresh IDs from source of truth before write operations.
- **412 eTag conflicts on concurrent updates** → GET latest object then PATCH with fresh eTag.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
