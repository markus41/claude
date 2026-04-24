---
description: Generate audit trail specifications for regulatory compliance in insurance and financial services. Use when designing audit logging for FINRA, state insurance department, SOX, or internal compliance requirements.
---

# Workflow Audit Trail Design

Design comprehensive audit logging for regulatory compliance:

1. **Regulatory scope**: Which regulations apply? (FINRA, state insurance, SOX, GDPR, internal policy)
2. **Required events**: Map every workflow action to an audit event (created, assigned, viewed, approved, rejected, modified, deleted)
3. **Required fields per event**: timestamp (UTC), actor (user ID + role), item ID, before/after values, IP address, session ID
4. **Retention period**: How long must audit records be retained? (typically 7 years for financial services)
5. **Access controls**: Who can query the audit log? Read-only for compliance, no delete capability
6. **Export format**: CSV, JSON, or direct to SIEM

Output: audit event catalog, data schema, retention policy spec, and access control matrix.
