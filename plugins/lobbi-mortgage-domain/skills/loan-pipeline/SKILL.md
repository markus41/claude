---
description: Design loan origination pipeline tracking and status workflow specifications for mortgage brokers and lenders. Use when automating loan status tracking, milestone notifications, or pipeline reporting for a mortgage operation.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Loan Pipeline Tracking Workflow Design

Design the complete loan origination pipeline tracking system, from application intake through funding, with automated status updates, borrower and agent notifications, pipeline reporting, and exception queue management.

## Scope Confirmation

Confirm which pipeline components are in scope:
- [ ] Application intake and channel capture
- [ ] Milestone status tracking
- [ ] Automated notifications (borrower, agent, real estate agent, settlement agent)
- [ ] Pipeline dashboard and reporting
- [ ] Exception queue (stuck loans, missing conditions)
- [ ] LOS integration for status sync

---

## Component 1: Application Intake and Channel Capture

**Origination channels to track:**

| Channel | Source System | Data Capture Method | Initial Status |
|---------|--------------|---------------------|---------------|
| Point-of-Sale (POS) system | [Blend, SimpleNexus, BeSmartee, etc.] | API integration | Application submitted |
| LOS — manual entry | [Encompass, BytePro, Calyx, etc.] | LOS webhook or polling | Application in progress |
| Referred (paper/email) | Manual upload | Staff entry in LOS | Application pending |
| Wholesale broker submission | Broker portal | API or file import | Broker submitted |

**Required data at intake (minimum for 6-piece TRID application definition):**

| Field | TRID Required? | Source |
|-------|---------------|--------|
| Borrower legal name | Yes | Borrower entry |
| Borrower SSN | Yes | Borrower entry |
| Property address | Yes | Borrower entry |
| Estimated property value | Yes | Borrower entry |
| Loan amount | Yes | Borrower entry |
| Income (used for qualification) | Yes | Borrower entry |
| Borrower DOB | No | Borrower entry |
| Email and phone | No | Borrower entry |
| Co-borrower information | No | If applicable |
| Loan purpose (purchase/refi) | No | Borrower selection |
| Property type | No | Borrower selection |
| Loan program | No | LO selection |

**Application date rule (TRID):**

Application is "received" for TRID purposes when all 6 required pieces are collected. The LE 3-business-day clock starts at application receipt. System must:
- Flag the exact date/time all 6 fields are populated
- Store this as the official `application_received_date`
- Calculate `le_due_date` = application_received_date + 3 business days (business day = Monday–Friday excluding federal holidays)
- Alert if LE has not been issued by day 2

---

## Component 2: Milestone Status Tracking

**Standard pipeline milestones:**

| # | Milestone | Description | Preceding Milestone | Common SLA |
|---|-----------|-------------|--------------------|-|
| 1 | Application received | All 6 TRID pieces collected; application date set | — | Day 0 |
| 2 | Pre-approval issued | Tri-merge credit pulled; DU/LP run; pre-approval letter generated | Application received | 1–2 business days |
| 3 | Under contract | Purchase agreement received (purchase only) | Pre-approval | Borrower-dependent |
| 4 | Disclosures sent | LE and intent to proceed received | Application received | Day 3 (LE due) |
| 5 | Intent to proceed received | Borrower signed intent to proceed | Disclosures sent | Varies |
| 6 | Processing — active | Loan package submitted to processor; conditions collection underway | Intent to proceed | Day 5–7 |
| 7 | Appraisal ordered | Appraisal ordered through AMC | Processing active | Day 5–7 |
| 8 | Appraisal received | Appraisal report received and reviewed | Appraisal ordered | 5–14 days from order |
| 9 | Title ordered | Title search ordered | Processing active | Day 5–7 |
| 10 | Title received | Title commitment received and reviewed | Title ordered | 5–10 days from order |
| 11 | Submitted to underwriting | Complete loan package submitted to UW | Processing active | Day 10–15 |
| 12 | Conditional approval | UW issues conditional approval with conditions list | Submitted to UW | 1–5 business days |
| 13 | Conditions received | All UW conditions collected and submitted | Conditional approval | Varies |
| 14 | Clear to close (CTC) | UW clears all conditions; loan approved | Conditions received | 1–2 business days |
| 15 | CD issued | Closing Disclosure issued to borrower | CTC | 3 business days before closing |
| 16 | Closing scheduled | Closing date/time/location confirmed | CD issued | — |
| 17 | Closing | Loan documents signed | Closing scheduled | — |
| 18 | Funding | Loan funded by lender; disbursement complete | Closing | 1–3 business days |
| 19 | Post-closing complete | Post-close package reviewed; shipped to investor | Funding | 1–5 business days |

**Status change triggers:**

Each milestone status change is triggered by one of:
- **LOS event** (automated): LOS webhook fires when LOS status changes
- **Processor/UW action** (semi-automated): Staff changes status in pipeline system after completing an action
- **System detection** (automated): Document received, time elapsed, condition cleared
- **Manual** (staff entry): Phone call confirmed, verbal acknowledgment received

Audit all status changes: record actor (staff member or system), timestamp, previous status, new status.

---

## Component 3: Automated Milestone Notifications

**Notification recipients:**

| Recipient | Relationship | Channel | Content Level |
|-----------|-------------|---------|--------------|
| Borrower | Primary | Email + SMS | Consumer-friendly, no jargon |
| Co-borrower | Primary | Email + SMS | Same as borrower |
| Loan officer | Internal | Email + in-app | Detailed milestone + next action |
| Processor | Internal | In-app task | Action items |
| Real estate agent (purchase) | External | Email | Brief status; no financial details |
| Listing agent (purchase) | External | Email | Brief status; no financial details |
| Settlement agent / title company | External | Email | Closing-relevant milestones only |

**Borrower notification triggers and content:**

| Milestone | Notification Sent | Subject Line | Key Content |
|-----------|------------------|-------------|-------------|
| Application received | Immediate | "Your application is received — here's what happens next" | Checklist of what they'll need to provide; timeline overview |
| Disclosures sent | Immediate | "Your Loan Estimate is ready — please review" | LE summary; link to e-sign intent to proceed; LE explanation |
| Appraisal ordered | Same day | "Your appraisal has been ordered" | Expected timeline; what appraiser access they need to provide |
| Appraisal received | Same day | "Your appraisal is complete" | Result (value confirms/exceeds/below purchase price); next steps |
| Conditional approval | Same day | "You're approved — we need a few more items" | Plain-English list of outstanding conditions; how to submit; priority |
| CTC | Immediate | "You're clear to close!" | Congratulations; what to expect at closing; wire fraud warning |
| CD issued | Immediate | "Your Closing Disclosure is ready — please review" | CD summary; 3-business-day window explained; final cash to close |
| Closing confirmed | Confirmation | "Closing confirmed for [date/time/location]" | Location, what to bring (ID, cashier's check if applicable), wire instructions warning |
| Funded | Same day | "Your loan is funded — congratulations!" | Next steps: first payment date, servicer information |

---

## Component 4: Pipeline Dashboard and Reporting

**Pipeline dashboard views:**

**Loan officer view:**
- My pipeline: all active loans assigned to me
- Columns: borrower name, loan amount, program, loan purpose, current milestone, days in current milestone, CD due date, closing date, red flags
- Filters: milestone, loan type, closing date range

**Manager/branch view:**
- Full pipeline: all active loans by LO
- Pull-through metrics: application → CTC → funded rates
- Days-to-close by LO, loan type, lead source
- Loans at risk (closing within 7 days + not CTC)
- Fallout analysis: what stage are withdrawn/denied loans falling out?

**Pipeline reports:**

| Report | Frequency | Recipients | Purpose |
|--------|-----------|-----------|---------|
| Daily pipeline snapshot | Daily | LO, processor, manager | Current status of all active loans |
| Loans closing this week | Monday AM | LO, settlement, operations | Closing preparation |
| Aged loans report | Weekly | Manager | Loans stuck in a milestone > threshold days |
| Monthly production summary | Monthly | Branch / company | Volume, pull-through, days-to-close by period |
| HMDA LAR data extract | Monthly | Compliance | Required for HMDA reporting |

**Pull-through rate formula:**
```
Pull-through rate = Funded loans / Applications received (same cohort period)
Target: typically 65–80% for purchase; 50–70% for refi
```

**Days-in-stage monitoring:**

| Milestone | Days-in-Stage Alert Threshold |
|-----------|------------------------------|
| Application → LE issued | 3 business days (TRID requirement) |
| Intent to proceed → Submitted to UW | 10 business days |
| Submitted to UW → Conditional approval | 5 business days |
| Conditional approval → CTC | 10 business days |
| CTC → CD issued | 1 business day |
| CD issued → Closing | 3 business days minimum (TRID) |
| Closing → Funded | 3 business days |

---

## Component 5: Exception Queue

**Exception queue triggers:**

| Exception Type | Trigger Condition | Priority | Action |
|---------------|------------------|---------|--------|
| LE not issued | Day 3 from application without LE issuance | Critical | Immediate alert to LO and compliance |
| CD not issued | CTC granted + closing within 4 business days + no CD issued | Critical | Immediate alert |
| Loan stuck — processing | No milestone change in [N] business days during processing | High | Processor alert + manager notification |
| Loan stuck — conditions | Conditional approval issued; no conditions cleared in [N] business days | High | LO alert |
| Missing appraisal | Closing within 7 days; no appraisal received | High | Alert to LO and processor |
| Missing title | Closing within 7 days; no title commitment received | High | Alert to processor and settlement |
| Rate lock expiring | Rate lock expires within 3 business days | High | Alert to LO; extension decision required |
| Changed circumstance not documented | Any fee on LE changed without changed circumstance documentation | Critical | Compliance alert |
| HMDA data incomplete | Loan reaching disposition without complete HMDA data | Medium | Compliance alert |

**Exception workflow:**

1. Exception detected → logged to exception queue
2. Notification sent to responsible party (LO, processor, or compliance based on exception type)
3. Responsible party must acknowledge exception and enter disposition within SLA
4. If unacknowledged: escalate to manager after [N] hours
5. Exception resolved → removed from queue; resolution documented

---

## Output Format

Deliver two artifacts:

1. **Pipeline Workflow Specification** — Step-by-step description of each milestone, trigger conditions, automated notifications, and SLA targets; include TRID compliance checkpoints at LE and CD milestones

2. **LOS Integration Requirements** — For each LOS event that triggers a pipeline status change: event name, data fields passed, status mapping (LOS status → pipeline milestone), error handling if event fails, retry logic
