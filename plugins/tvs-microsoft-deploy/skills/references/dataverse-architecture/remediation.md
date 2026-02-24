# Common failure modes and remediation playbooks

- **SQL timeout on overly broad queries** → Add selective indexes and filter columns via $select.
- **Business rule recursion causing plugin depth errors** → Refactor automation to avoid circular updates and use depth guards.
- **Duplicate detection false positives on alternate keys** → Tune duplicate rules and use composite keys carefully.
- **Access denied from business unit hierarchy mismatch** → Realign owner teams/business units and test effective privileges.

## Escalation data to capture
- Request/operation ID and timestamp (UTC).
- Tenant/environment/workspace identifiers.
- Last known successful deployment or configuration baseline.
