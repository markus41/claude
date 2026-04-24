---
description: Design audit log specifications for regulated business processes. Use when a workflow requires a defensible audit trail for FINRA examinations, state insurance audits, SOX controls testing, or internal compliance reviews.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Audit Trail Design

Produce a complete audit logging specification for a regulated business process, covering event catalog, data schema, immutability mechanisms, retention schedule, access controls, and examination query patterns.

## Step 1: Event Catalog

Enumerate every action that must be logged. For each workflow, identify:

**Standard event categories:**
- **Create** — Record, account, policy, loan, or document created
- **Read** (sensitive only) — PII accessed, credit report pulled, account viewed by non-owner
- **Update** — Field value changed (capture before/after)
- **Delete** (or archive) — Record removed or soft-deleted
- **Status change** — Workflow state transition (e.g., submitted → approved → issued)
- **Authorization** — Access granted, permission changed, role assigned
- **Export/Download** — Data exported to file, report generated, document downloaded
- **Communication** — Email sent, disclosure delivered, adverse action notice issued
- **Integration** — Data sent to or received from external system (AMS, LOS, AUS, carrier portal)
- **System** — Login, logout, session timeout, failed authentication, configuration change

For each event, assign:
- **Event code** (e.g., `POL.BIND.001`) — namespace by domain and action
- **Description** — Plain English description of what occurred
- **Trigger** — What user action or system event causes this log entry
- **Frequency** — Expected volume (per day / per transaction)
- **Regulatory driver** — Which regulation requires this event to be logged (or "business requirement" if not regulatory)

## Step 2: Required Fields per Event

Every audit log record must capture these fields as a minimum:

| Field | Type | Description | Regulatory Basis |
|-------|------|-------------|-----------------|
| `event_id` | UUID | Unique identifier for this log entry | Tamper-evidence |
| `event_code` | string | Structured event code from catalog | Searchability |
| `event_timestamp` | ISO 8601 UTC | When the event occurred (server time, not client) | All regs |
| `actor_id` | string | Authenticated user ID who caused the event | FINRA 4511, SOX 404 |
| `actor_role` | string | Role/permission level of the actor at time of event | Segregation of duties |
| `actor_ip` | string | Client IP address | Security |
| `session_id` | UUID | Session identifier linking related events | Forensics |
| `correlation_id` | UUID | Business transaction ID spanning multiple events | Traceability |
| `object_type` | string | Entity type affected (Policy, Loan, Client, User) | Context |
| `object_id` | string | ID of the affected record | Searchability |
| `before_value` | JSON | Field values before the change (for Update events) | SOX, FINRA |
| `after_value` | JSON | Field values after the change (for Update events) | SOX, FINRA |
| `result` | enum | `success` \| `failure` \| `partial` | Completeness |
| `failure_reason` | string | If result = failure, why it failed | Debugging |
| `source_system` | string | Which system generated the event | Multi-system audit |
| `data_classification` | enum | `public` \| `internal` \| `confidential` \| `restricted` | Privacy |

For events involving PII or PHI, also capture:
- `data_subject_id` — ID of the individual whose data was accessed
- `access_purpose` — Business purpose for accessing the data (required for GLBA/CCPA)

## Step 3: Immutability Mechanisms

The audit log must be tamper-evident and append-only. Choose one or more mechanisms based on client infrastructure:

**Database-level:**
- Append-only table with no UPDATE or DELETE permissions for any application role
- Database trigger that blocks UPDATE/DELETE and alerts on attempt
- Row-level hash: `SHA-256(event_id + event_timestamp + actor_id + object_id + content_hash_of_all_fields)` stored in each row
- Periodic Merkle root calculation (batch of N records → root hash stored separately)

**Storage-level:**
- Write-Once Read-Many (WORM) storage for log exports (AWS S3 Object Lock, Azure Blob immutability policy)
- Automated daily export to immutable cold storage with hash verification

**Cryptographic chaining:**
- Each record contains `previous_record_hash` — SHA-256 of the previous record's full content
- Chain integrity verification: daily automated job validates the hash chain; alerts on break

**Third-party:**
- Immutable audit log service (e.g., AWS CloudTrail, Azure Monitor, Splunk SIEM) as secondary sink
- Records written to primary DB and secondary immutable service simultaneously

## Step 4: Retention Schedule

| Event Category | Minimum Retention | Maximum Retention | Regulatory Citation |
|----------------|------------------|------------------|---------------------|
| Insurance policy transactions | 5 years post-policy expiration | 7 years | State DOI (varies; use most restrictive) |
| Insurance claims records | 5 years post-close | 10 years | State DOI claims regulations |
| Mortgage origination records | 3 years | 5 years | RESPA § 1024.9 |
| HMDA LAR data | 3 years | Permanent | Reg C § 1003.5 |
| BSA/AML suspicious activity | 5 years | Permanent | 31 CFR 1020.320 |
| FINRA communications | 3 years (first 2 easily accessible) | 6 years | FINRA Rule 4511 |
| SOX financial controls | 7 years | Permanent | SOX § 802 |
| Login/authentication logs | 1 year | 3 years | SOC 2 / general security |
| Failed authentication | 90 days | 1 year | Security best practice |
| System configuration changes | 3 years | 7 years | SOX ITGC |

**Legal hold:** Any record subject to litigation hold must be retained until hold is released, regardless of standard retention period. Implement a legal hold flag that overrides automated deletion.

## Step 5: Access Controls

| Role | Permissions |
|------|-------------|
| Application services | INSERT only — no SELECT, UPDATE, DELETE |
| Compliance officer | SELECT with full field access, CSV export |
| Internal audit | SELECT with full field access, read-only |
| IT operations | SELECT on non-PII fields only; PII masked |
| Legal | SELECT with full access during litigation hold |
| Regulators (examination) | Read-only export of scoped date range |
| No role | DELETE or UPDATE (blocked at DB and application layer) |

All access to the audit log itself must be logged in a separate meta-audit log (log of logs).

## Step 6: Examination Query Patterns

Design indexed queries for the most common regulatory examination scenarios:

```sql
-- All actions by a specific user in a date range
SELECT * FROM audit_log
WHERE actor_id = :user_id
  AND event_timestamp BETWEEN :start_date AND :end_date
ORDER BY event_timestamp;

-- All changes to a specific record
SELECT * FROM audit_log
WHERE object_type = :entity_type AND object_id = :record_id
ORDER BY event_timestamp;

-- All failed authentication attempts
SELECT * FROM audit_log
WHERE event_code = 'AUTH.LOGIN.FAIL'
  AND event_timestamp >= :start_date
ORDER BY event_timestamp;

-- All disclosures delivered (for TRID/ECOA examination)
SELECT * FROM audit_log
WHERE event_code IN ('DISC.LE.DELIVER', 'DISC.CD.DELIVER', 'DISC.ADVERSE.DELIVER')
  AND event_timestamp BETWEEN :start_date AND :end_date;

-- Chain integrity verification
SELECT event_id, event_timestamp,
       SHA256(CONCAT(event_id, event_timestamp, actor_id, object_id, content)) AS computed_hash,
       stored_hash,
       (computed_hash = stored_hash) AS hash_valid
FROM audit_log
ORDER BY event_timestamp;
```

## Output Format

Deliver four artifacts:

1. **Event Catalog Table** — All events with code, description, trigger, frequency, regulatory driver
2. **Data Schema** — Full field definition table with types, constraints, and regulatory basis
3. **Retention Matrix** — Retention schedule table with regulatory citations
4. **Access Control Specification** — Role permission matrix and meta-audit requirements
