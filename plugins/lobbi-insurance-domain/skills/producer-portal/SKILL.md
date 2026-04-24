---
description: Design producer and independent agent self-service portal specifications for insurance agencies. Use when building or specifying a portal where agents can submit business, check policy status, download documents, and track commissions.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Producer Portal Specification

Design the feature specification and integration requirements for an insurance agency producer portal — a self-service interface where independent agents, captive sub-agents, or CSRs can submit business, manage existing accounts, access documents, and track commissions without requiring staff intervention.

## Portal User Types and Access Levels

Define who accesses the portal and what they can do.

| User Type | Description | Access Level |
|-----------|-------------|-------------|
| Principal Agent | Agency owner or partner | Full access including commission reports |
| Sub-Agent / Producer | Individual licensed producer | Own book of business only; no commission admin |
| Customer Service Representative (CSR) | Agency staff handling accounts | Full account access; no commission reports unless granted |
| Agency Administrator | Manages portal users, not licensed | User management; no submission access |
| Read-Only | Compliance, accounting review | View and export only; no edit access |

---

## Feature 1: Authentication and Access Control

**Authentication requirements:**

- Email and password (minimum: 12-character, complexity enforced)
- Multi-factor authentication (MFA) required for all users — TOTP (Google Authenticator) or SMS OTP
- MFA enrollment required on first login; cannot be bypassed
- Single Sign-On (SSO): support SAML 2.0 or OIDC if agency uses O365 or Google Workspace
- Password reset: self-service via verified email link (expire after 60 minutes)
- Failed login lockout: 5 consecutive failures → account locked → admin unlock or 30-minute auto-unlock
- Session management:
  - Session timeout: 30 minutes of inactivity
  - Absolute session limit: 8 hours regardless of activity
  - Single session per user (second login invalidates first — or allow with notification)

**Role-based access control:**

| Feature / Data | Principal Agent | Sub-Agent | CSR | Admin | Read-Only |
|---------------|:-:|:-:|:-:|:-:|:-:|
| View own accounts | ✓ | ✓ | ✓ | — | ✓ |
| View all agency accounts | ✓ | — | ✓ | — | ✓ |
| Submit new business | ✓ | ✓ | ✓ | — | — |
| Bind policies | ✓ | Within authority | Within authority | — | — |
| Request endorsements | ✓ | ✓ | ✓ | — | — |
| Download policy documents | ✓ | Own clients | ✓ | — | ✓ |
| View commission reports | ✓ | Own only | — | — | ✓ (read) |
| Manage portal users | ✓ | — | — | ✓ | — |
| Export data | ✓ | — | ✓ (limited) | — | ✓ |

---

## Feature 2: New Business Submission

**Submission flow:**

1. Producer selects LOB from supported lines menu
2. System loads intake form for selected LOB (ACORD-mapped fields)
3. Producer completes applicant, risk, coverage, and prior insurance sections
4. Document upload (prior dec page, loss runs, MVR authorization, photos)
5. Submission validation:
   - Required fields complete
   - Date fields valid
   - Policy number format validates (if transferred)
   - File types accepted (PDF, JPG, PNG — max 25MB per file, 100MB per submission)
6. Producer certifies accuracy and submits
7. Submission ID generated and displayed; confirmation email sent to producer
8. Submission routed to agency underwriting or carrier per workflow rules

**Submission tracking dashboard:**

| Column | Description |
|--------|-------------|
| Submission ID | Unique identifier; click to view detail |
| Insured name | |
| LOB | |
| Submitted date | |
| Status | Pending / In Review / Quoted / Bound / Declined / Withdrawn |
| Assigned to | Agency UW or carrier contact handling the submission |
| Target response date | Based on SLA for this LOB |
| Actions | View / Download quote / Bind / Message |

**Notifications sent to producer:**
- Submission received (immediate)
- Submission assigned (when underwriter picks it up)
- Quote ready (with quote document attachment)
- Bind confirmation
- Declination (with declination reason)
- Additional information requested (with specific items needed)

---

## Feature 3: Policy Management

**Policy search:**

- Search by: insured name, policy number, VIN/property address, effective date range, LOB
- Results table: insured name, policy #, LOB, carrier, effective date, expiration date, premium, status

**Policy detail view:**

| Section | Data Displayed |
|---------|---------------|
| Policy header | Policy number, carrier, effective date, expiration date, status |
| Insured | Named insured(s), mailing address, contact |
| Coverage summary | LOB, limits, deductibles, endorsements |
| Billing | Premium, payment plan, next due date, balance |
| Documents | All documents for this policy (click to download) |
| Claims | Open claims linked to this policy |
| History | Policy history (prior terms, endorsements, renewals) |

**Policy actions (based on user role and policy status):**

| Action | Available When | Process |
|--------|---------------|---------|
| Request endorsement | Policy active | Opens endorsement request form |
| Request cancellation | Policy active | Opens cancellation request form; routes to agency for processing |
| Order certificate of insurance | Policy active | Certificate request form; auto-issued for standard additional interests or routed to CSR |
| Download declarations page | Always | Immediate download from document management system |
| View billing | Always | Links to carrier billing or agency billing system |
| Report a claim | Policy active | FNOL intake form (or link to carrier FNOL if direct-report) |

---

## Feature 4: Document Library

**Document categories available:**

| Category | Access | Download Format |
|---------|--------|----------------|
| Policy documents (current term) | By policy — role-based | PDF |
| Policy documents (prior terms) | By policy — role-based | PDF |
| Certificates of insurance | By policy — CSR and above | PDF |
| Endorsements | By policy | PDF |
| Billing statements | By policy — principal and CSR | PDF |
| ACORD forms (blank) | All users | PDF |
| Agency marketing materials | All users | PDF |

**Upload capability (for CSRs and principals):**

- Upload supporting documents to a policy record (signed forms, correspondence)
- File type and size validation
- Document indexed to policy number and document type for searchability
- Uploaded documents visible to all agency staff with access to the account

---

## Feature 5: Commission Dashboard

**Access:** Principal Agent and Read-Only (full); Sub-Agent (own commissions only)

**Commission summary view:**

| Metric | Period Options |
|--------|---------------|
| Gross written premium | Current month / YTD / Last 12 months |
| Earned commission | Current month / YTD / Last 12 months |
| Expected future commissions | Based on in-force policies |
| Commission by carrier | Breakdown by carrier |
| Commission by LOB | Breakdown by line of business |
| Commission by producer | Breakdown by sub-agent (principal view only) |

**Commission detail table:**

| Column | Description |
|--------|-------------|
| Policy number | |
| Insured name | |
| LOB | |
| Carrier | |
| Effective date | |
| Premium | |
| Commission rate | |
| Commission amount | |
| Payment status | Paid / Pending / Disputed |
| Payment date | |

**Payment schedule:**

- Display next expected payment date
- History of past payments with reconciliation detail
- Downloadable commission statements (PDF and CSV) for accounting

**Commission dispute submission:**

- Flag individual commission line items as disputed
- Enter dispute reason and expected amount
- Routed to agency accounting for resolution
- Status tracking (submitted / under review / resolved)

---

## Feature 6: Notifications and Communication

**Notification preferences (configurable per user):**

| Event | In-Portal | Email | SMS (optional) |
|-------|:---------:|:-----:|:--------------:|
| New submission status change | ✓ | ✓ | — |
| Quote ready | ✓ | ✓ | ✓ |
| Policy renewal approaching (90/60/30 days) | ✓ | ✓ | — |
| Policy expiring in 7 days (unrenewed) | ✓ | ✓ | ✓ |
| New document available | ✓ | ✓ | — |
| Commission payment posted | ✓ | ✓ | — |

**Secure messaging:**

- Message thread per policy or submission
- Producer ↔ agency staff only (not carrier direct)
- All messages stored; audit trail maintained
- Unread message count displayed in portal header
- Email notification for new messages (configurable)

---

## Agency Management System Integration Requirements

The portal must integrate with the agency's AMS (Applied EPIC, Vertafore AMS360, HawkSoft, or custom).

| Integration Point | Data Flow | Sync Frequency | Method |
|------------------|-----------|----------------|--------|
| Policy data | AMS → Portal | Real-time or hourly pull | API or database view |
| Client records | AMS → Portal | Real-time or hourly pull | API |
| Commission data | AMS → Portal | Daily | API or SFTP file |
| Document storage | Portal → AMS | On upload | API |
| Submission intake | Portal → AMS | On submission | API or email-to-AMS |
| Endorsement requests | Portal → AMS | On submission | API or task creation |

**Authentication integration:**

If the agency uses AMS login credentials, implement SSO so producers use one set of credentials for both the AMS and the portal.

---

## Output Format

Deliver two artifacts:

1. **Portal Feature Specification** — Full feature list with user story format (as a [user type], I can [action] so that [benefit]) and acceptance criteria for each feature

2. **AMS Integration Requirements** — Integration point table with field mappings, sync frequency, connection method, error handling, and data validation rules
