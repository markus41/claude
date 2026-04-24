---
description: Design policy submission, underwriting review, and issuance workflows for insurance agencies and MGAs. Use when automating new business intake, quote-to-bind processes, or policy change endorsement workflows.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Policy Workflow Design

Design the end-to-end workflow for insurance policy submission, underwriting, binding, issuance, and endorsement. Produces a workflow specification and system integration requirements suitable for automation build.

## Scope Definition

Confirm which workflow components are in scope before designing:

- [ ] New business intake (submission form design)
- [ ] Underwriting routing and review
- [ ] Quote generation and delivery
- [ ] Bind workflow
- [ ] Policy issuance and delivery
- [ ] Endorsement workflow (mid-term changes)
- [ ] Cancellation workflow (separate or included)

Lines of business in scope: [Personal auto / Commercial auto / Homeowners / Commercial property / GL / Professional liability / Workers comp / Other]

---

## Component 1: New Business Intake

**Submission form design:**

Define required fields by line of business. Group into sections that mirror ACORD form structure so data maps cleanly to carrier systems.

| Section | Fields | Required? | Source of Truth |
|---------|--------|-----------|----------------|
| Applicant information | Full name, DOB, SSN/EIN, address, contact | Required | Applicant entry |
| Risk information | [LOB-specific: vehicle VIN, property address, business description] | Required | Applicant entry |
| Prior insurance | Current carrier, policy #, expiration date, reason for shopping | Required for most carriers | Applicant entry |
| Loss history | Claims in past 3–5 years (dates, types, amounts) | Required | Applicant entry + CLUE pull |
| Requested coverage | Coverage types, limits, deductibles | Required | Agent selection |
| Signatures | Applicant signature, agent certification | Required | E-signature |

**ACORD form mapping:**

| LOB | ACORD Form | Fields Mapped |
|-----|-----------|--------------|
| Personal lines | ACORD 80 | All personal auto fields |
| Commercial lines | ACORD 125 | Commercial applicant info |
| Property | ACORD 140 | Property details |
| GL | ACORD 126 | General liability |

**Document collection at intake:**

| Document | Required For | Collection Method | Validation |
|---------|------------|-----------------|------------|
| Prior dec page | All renewals and transfers | Upload | Policy number matches; not expired |
| MVR authorization | Personal and commercial auto | E-signature | Signed before MVR pull |
| Loss runs | Commercial lines (3–5 years) | Upload or carrier request | Signed by prior carrier |
| Photo inspection | Property over $[X] | Upload or inspection order | 4-point completed |

---

## Component 2: Underwriting Routing

**Risk appetite rules (work with client underwriting team to define):**

| Rule | Condition | Action |
|------|-----------|--------|
| Auto-decline | [e.g., >2 at-fault accidents in 3 years] | Decline with adverse action notice |
| Refer to underwriter | [e.g., prior lapse >60 days] | Route to UW queue with flagged reason |
| Straight-through quote | [e.g., preferred risk, no adverse factors] | Auto-quote, agent notification |
| MGA/carrier referral | [e.g., risk outside standard appetite] | Route to E&S market workflow |

**Referral queue design:**

| Field | Description |
|-------|-------------|
| Submission ID | Unique ID for tracking |
| LOB and risk type | For routing to correct underwriter |
| Flag reason | Which rule triggered the referral |
| Priority | Standard / Rush (binding deadline approaching) |
| Assigned underwriter | Auto-assigned by LOB and territory |
| SLA | Response required within [N] business hours |
| Escalation trigger | Unreviewed after [N] hours → supervisor notification |

**Declination workflow:**

1. System flags submission for decline
2. Licensed underwriter (never automated system alone) reviews and confirms
3. Adverse action notice generated — includes: specific reason(s), right to dispute, date
4. Notice delivered to applicant within state DOI time requirement
5. Notice copy stored in compliance file with delivery confirmation
6. Producer notified of declination

---

## Component 3: Quote Generation

**Rating system integration:**

| Carrier / Rating Engine | Connection Method | Data Format | Rate Return Format |
|------------------------|------------------|-------------|-------------------|
| [Carrier 1] | API / Rater | JSON / XML | Quoted premium + tier |
| [Carrier 2] | | | |

**Quote workflow:**

1. Submission passes underwriting routing (either auto-approved or UW approved)
2. System submits rating data to configured carriers/raters
3. Responses collected; quotes ranked by premium (and optionally by coverage quality)
4. Quote comparison generated (side-by-side coverage and premium)
5. Agent reviews quotes and selects recommendation
6. Quote document generated for client presentation
7. Quote delivered to client (email / portal)

**Quote document required elements:**
- Quoted premium (annual and monthly if payment plan available)
- Coverage summary (limits and deductibles)
- Carrier name and AM Best rating
- Quote expiration date
- Payment options
- Next steps (how to bind)

---

## Component 4: Bind Workflow

**Bind authority rules:**

| Bind Type | Authority Level | Approval Required |
|-----------|----------------|------------------|
| Preferred risk within appetite | Agent bind authority | None — auto-bind |
| Standard risk | Agency bind authority | Agency principal approval if over $[X] premium |
| Referral risk | Carrier/MGA bind authority | Carrier written approval before binding |
| E&S / surplus lines | Surplus lines bind authority | Diligent search documentation + affidavit |

**Bind workflow steps:**

1. Client confirms coverage selection (written or documented phone acknowledgment)
2. First premium payment collected (check, ACH, or credit card — confirm carrier acceptance)
3. Premium finance agreement executed if applicable
4. Binder issued to insured — must include: insured name, carrier, effective date, LOB, limits, policy number (or pending)
5. Evidence of insurance (EOI/certificate) issued if required by lienholder or additional insured
6. Carrier system submission:
   - AMS → carrier portal (automated submission) OR
   - AMS → ACORD XML → carrier API OR
   - Manual carrier portal entry (legacy carriers)
7. Carrier confirmation received and stored
8. Agent and insured notified of bind confirmation

**Surplus lines bind checklist:**
- [ ] Diligent search documented (minimum [N] admitted declinations per state law)
- [ ] Surplus lines broker license confirmed active
- [ ] Premium tax calculated and stamping fee included
- [ ] Stamping office affidavit prepared
- [ ] Disclosure notice to insured signed (risk not covered by state guaranty fund)

---

## Component 5: Policy Issuance

**Issuance workflow:**

1. Carrier issues policy (typically 1–10 business days post-bind depending on carrier)
2. Policy document received from carrier
3. Policy data reconciled against AMS:
   - Effective date matches bind confirmation
   - Coverage limits and deductibles match quote
   - Named insured(s) correct
   - Additional interests / lienholders correct
4. Discrepancies flagged for agent review and correction
5. Policy document stored in document management system linked to AMS client record
6. Policy delivered to insured:
   - Email with PDF attachment (with delivery confirmation tracking)
   - Portal upload if insured has portal access
   - Mailed copy if required by state law or insured preference
7. Agent notification of successful issuance
8. Billing confirmed (direct bill carrier vs. agency bill)
9. Policy tickler set for renewal (90 days before expiration)

---

## Component 6: Endorsement Workflow

**Endorsement intake:**

| Change Type | Intake Method | Processing Path |
|------------|--------------|----------------|
| Driver add/remove | Online form or phone | Automated if within appetite; referral if adverse |
| Vehicle add/remove | Online form or phone | Automated for standard; referral for high-value or specialty |
| Address change | Online form or phone | Automated for most; referral if rate territory impact |
| Coverage change | Agent-initiated | Agent submits to carrier; audit trail required |
| Named insured change | Agent + carrier approval | Carrier-specific process; may require new application |

**Endorsement processing:**

1. Change request received (channel logged for E&O file)
2. Change type classified (in-appetite automatic vs. referral)
3. Premium impact calculated (return premium or additional premium)
4. Client acknowledgment of premium change (required before processing)
5. Endorsement submitted to carrier
6. Endorsement document received and reconciled
7. AMS updated with endorsement effective date and premium change
8. Endorsement confirmation sent to insured with updated coverage summary
9. E&O documentation: request logged with date, requestor, change made, confirmation

---

## Output Format

Deliver two artifacts:

1. **Workflow Diagram Specification** — For each component in scope, a step-by-step process narrative with decision branches, actor at each step (system / agent / underwriter / insured / carrier), and system interactions

2. **System Integration Requirements** — For each system integration point:
   - Integration purpose
   - Source system and destination system
   - Data transferred (field list)
   - Connection method (API / file exchange / manual)
   - Authentication requirements
   - Error handling and retry logic
   - SLA / timeout requirements
