---
description: Design data retention and deletion policies with regulatory basis for each data type. Use when a client needs to define how long different data categories are kept, when they are deleted, and what the regulatory or business justification is.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Data Retention and Deletion Policy Design

Design a complete data retention and deletion policy covering inventory, regulatory minimums, retention schedule, legal hold procedures, deletion runbook, and technical implementation guidance.

## Step 1: Data Inventory

Identify and classify all data types the client holds. For each, document:

| Data Category | Subcategory | Format | Storage Location | Contains PII? | Regulatory Category |
|--------------|-------------|--------|-----------------|--------------|---------------------|
| Customer PII | Contact info | DB records | CRM, AMS, LOS | Yes | GLBA, state privacy |
| Customer PII | SSN/Tax ID | Encrypted DB | Core system | Yes — sensitive | GLBA, FCRA |
| Transactions | Policy premiums | DB records | AMS | Yes | State DOI |
| Transactions | Loan origination | DB + documents | LOS + file storage | Yes | RESPA, TRID |
| Communications | Email correspondence | Email archive | Exchange/O365 | Maybe | FINRA 4511, state |
| Communications | Recorded calls | Audio files | Call recording platform | Maybe | State recording law |
| Audit logs | System access | Log files | SIEM | Partial | SOX, SOC 2 |
| Financial records | Ledger entries | DB records | Accounting system | No | SOX, tax |
| Documents | Applications | PDF/scanned | Document management | Yes | Varies by type |
| Documents | Policy/loan docs | PDF | Document management | Yes | State DOI, RESPA |
| Documents | Adverse action notices | PDF | Document management | Yes | ECOA, FCRA |
| Claims records | FNOL and adjuster notes | DB + docs | Claims system | Yes | State DOI |
| Marketing | Prospect data | CRM | CRM | Yes | CCPA, CAN-SPAM |
| HR | Employee records | HR system | HRIS | Yes | State labor law |

## Step 2: Regulatory Minimum Retention by Data Type

### Insurance

| Record Type | Minimum Retention | Clock Starts | Citation |
|-------------|------------------|--------------|---------|
| Policy files (all lines) | 5 years | Policy expiration | Most state DOI regulations |
| Policy files (life insurance) | 6 years | Policy expiration | Many states — use most restrictive |
| Claims files | 5 years | Claim closure | State DOI (varies; verify per state) |
| Agent licensing records | 3 years | License termination | NAIC Producer Licensing Model Act |
| Market conduct records | 5 years | Record creation | State DOI market conduct exams |
| Premium tax records | 4 years | Tax filing | State DOI / state revenue dept |
| Complaint records | 5 years | Complaint closure | Most state DOI regulations |
| Advertising/marketing materials | 3 years | Last use | State DOI unfair trade practices |
| Surplus lines affidavits | 3–5 years | Filing date | State surplus lines law (varies) |

### Mortgage

| Record Type | Minimum Retention | Clock Starts | Citation |
|-------------|------------------|--------------|---------|
| Loan application and disclosures | 3 years | Consummation or action taken | Reg Z § 1026.25 |
| TRID Loan Estimates and CDs | 3 years | Consummation | Reg Z § 1026.25(c) |
| RESPA servicing records | 2 years | Date of action | Reg X § 1024.38 |
| HMDA Loan Application Register | 3 years | LAR submission | Reg C § 1003.5(b) |
| ECOA adverse action notices | 25 months | Date notice given | Reg B § 1002.12 |
| FCRA adverse action notices | 5 years | Date notice given | FCRA § 1681p |
| BSA/AML Currency Transaction Reports | 5 years | Filing date | 31 CFR 1010.430 |
| BSA/AML Suspicious Activity Reports | 5 years | Filing date | 31 CFR 1020.320 |
| BSA Customer Identification records | 5 years | Account closure | 31 CFR 1020.220 |
| QM/ATR income/asset documentation | 3 years | Consummation | Reg Z § 1026.43(e)(4) |
| MERS registration records | Life of loan + 7 years | Payoff/transfer | MERS operating procedures |

### Financial Services / General

| Record Type | Minimum Retention | Clock Starts | Citation |
|-------------|------------------|--------------|---------|
| FINRA customer account records | 6 years | Account closure | FINRA Rule 4511 |
| FINRA communications (general) | 3 years | Creation (first 2 years easily accessible) | FINRA Rule 4511 |
| FINRA order tickets | 3 years | Order date | FINRA Rule 4511 |
| SEC investment advisor records | 5 years | Creation | 17 CFR 275.204-2 |
| SOX financial records | 7 years | Fiscal year end | SOX § 802 |
| Tax records | 7 years | Tax filing | IRS general guidance |
| GLBA privacy notices | 6 years | Issuance | 16 CFR Part 314 |
| Employment records | 4–7 years | Employment end | State labor law (varies) |

## Step 3: Retention Schedule

Build the master retention schedule combining regulatory minimums with business requirements. Apply the most restrictive applicable period.

**Retention period table format:**

| Data Category | Business Minimum | Regulatory Minimum | Regulatory Citation | Approved Maximum | Active Storage | Archive Storage | Delete Action |
|--------------|-----------------|-------------------|---------------------|-----------------|----------------|-----------------|---------------|
| [Category] | [N years] | [N years] | [Citation] | [N years] | [N years] | [N years after archive] | [Auto-delete / Manual review / Anonymize] |

**Approved maximum** = the point at which data must be deleted absent a legal hold. Typically regulatory minimum + 1–2 years buffer for litigation.

## Step 4: Legal Hold Procedures

When litigation, regulatory investigation, or government inquiry begins, standard retention schedules are suspended for affected data.

**Legal hold process:**
1. **Trigger identification** — Litigation hold triggers: receipt of subpoena, preservation letter, or when litigation is reasonably anticipated
2. **Hold notice** — Legal counsel issues written hold notice to all custodians of potentially relevant data
3. **System hold flags** — IT sets a legal hold flag on affected records in all systems; automated deletion is blocked for flagged records
4. **Custodian acknowledgment** — All recipients of hold notice confirm in writing
5. **Scope documentation** — Hold notice specifies: data categories in scope, date range, relevant systems, custodians
6. **Hold log** — Maintain a log of all active legal holds: matter name, date issued, data scope, custodians, systems
7. **Hold release** — Legal counsel issues release notice when matter is resolved; IT removes hold flags; standard retention schedule resumes
8. **Periodic review** — Active holds reviewed quarterly to confirm continued necessity

## Step 5: Deletion Runbook

For each data category at end of retention period:

**Automated deletion (preferred for structured data):**
```
1. Automated job runs [daily / weekly / monthly]
2. Query: SELECT records WHERE retention_expiry_date <= TODAY() AND legal_hold_flag = FALSE
3. For PII: overwrite with zeros or cryptographically erase encryption key (key deletion)
4. For non-PII: standard delete + transaction log purge
5. Generate deletion certificate: timestamp, record count, data category, deletion method, operator
6. Log deletion certificate to immutable audit log
7. Alert to compliance officer if deletion count exceeds threshold (potential pipeline issue)
```

**Manual review deletion (for complex or high-value records):**
1. System generates deletion candidate list 60 days before expiry
2. Compliance officer reviews list; approves or applies legal hold extension
3. Approved deletions executed by IT with certificate generated
4. Certificate filed in compliance records

**Backup and archive purge:**
- Backup media must be included in retention/deletion scope
- Backups older than retention period must be purged on the same schedule
- For tape backups: overwrite-3-pass standard (NIST SP 800-88)
- Cloud backups: confirm provider's deletion API deletes all copies including geo-redundant replicas
- Certificate of destruction issued by vendor for physical media destruction

**Anonymization (alternative to deletion where operational data is needed):**
- Replace PII fields with synthetic values or hash
- Anonymized records are no longer subject to privacy law retention limits
- Confirm anonymization is truly irreversible before classifying as complete

## Step 6: Technical Implementation Notes

**Database:**
- Add `retention_expiry_date` column to all tables containing regulated data
- Add `legal_hold_flag` boolean column
- Create deletion job with idempotent design (safe to re-run)
- Index on `(retention_expiry_date, legal_hold_flag)` for efficient scans

**Document management:**
- Set document retention metadata at upload time
- Configure automated expiry notifications 90 days before deletion
- Integrate legal hold flag with document DMS (SharePoint, Laserfiche, DocuWare)

**Email/communications archive:**
- Configure archiving platform (O365 Compliance, Mimecast, Proofpoint) with retention policies per mailbox category
- Legal hold: O365 Litigation Hold or In-Place Hold applied at mailbox level

**Cloud storage:**
- S3/Azure Blob lifecycle policies for automated tiering and deletion
- Object Lock for WORM compliance where required
- Verify deletion propagates to all storage tiers (Standard → IA → Glacier → deleted)

## Output Format

Deliver three artifacts:

1. **Retention Schedule Table** — All data categories with regulatory minimums, approved maximums, active/archive periods, and delete actions
2. **Legal Hold Procedure** — Step-by-step process with roles, triggers, and documentation requirements
3. **Deletion Runbook** — Automated and manual deletion procedures with certificate requirements and technical implementation notes
