---
description: Build claims intake, triage, assignment, and settlement automation workflows for insurance agencies. Use when automating first notice of loss handling, claims status tracking, or settlement authorization workflows.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Claims Processor Workflow Design

Design the complete claims workflow from First Notice of Loss through settlement or denial, including intake, triage, assignment, investigation tracking, reserve setting, settlement authorization, and denial handling.

## Scope Confirmation

Confirm which claims workflow components are in scope:

- [ ] FNOL intake (phone script, web form, email parsing)
- [ ] Initial triage and coverage verification
- [ ] Assignment routing to adjuster, TPA, or vendor
- [ ] Investigation task tracking and document collection
- [ ] Reserve setting and authority levels
- [ ] Settlement authorization and payment
- [ ] Denial workflow and adverse action notices
- [ ] Status updates to insured and agent

Lines of business in scope: [Personal auto / Commercial auto / Property / GL / Workers comp / Professional liability]

---

## Component 1: First Notice of Loss (FNOL) Intake

**Intake channel design:**

| Channel | Implementation | Required Data Captured | Routing |
|---------|---------------|----------------------|---------|
| Phone | Script for CSR; data entered in claims system during call | All required fields | Immediate triage after call |
| Web form | Self-service form on agency/carrier portal | All required fields + file upload | Auto-triage on submission |
| Email | Parsed from incoming email (keyword detection + AI extraction) | Partial fields — follow-up required | Flagged queue for CSR completion |
| Mobile app | If applicable — same as web form | All required fields + photo upload | Auto-triage on submission |

**Required fields by LOB:**

**Auto (personal and commercial):**
- Date, time, and location of loss
- Description of what happened (free text)
- Other parties involved (name, contact, carrier, policy #, vehicle info)
- Police report number (if applicable)
- Vehicle information (year, make, model, VIN, damage description)
- Injuries: names, contact information, description
- Witnesses: names and contact information
- Photos uploaded (encouraged, not required at FNOL)

**Property:**
- Date and time loss discovered
- Type of loss (fire, water, wind, theft, vandalism, other)
- Location of damaged property
- Description of damage (free text)
- Temporary repairs needed immediately (document any emergency repairs)
- Public adjuster engaged? (Y/N — affects handling)
- Mortgage company / lienholder information

**GL / Professional Liability:**
- Date of incident / date claim received (claims-made distinction)
- Claimant name and contact
- Description of alleged wrongful act or injury
- Legal representation engaged by claimant? (Y/N — escalate immediately if yes)
- Prior notice of this claim? (Y/N — document for coverage determination)

**Workers Compensation:**
- Date and time of injury
- Employee name, ID, job title
- Description of injury and how it occurred
- Body part(s) injured
- Medical treatment received (yes/no, where, treating physician)
- Witness names
- Return to work expected? (Y/N)

---

## Component 2: Initial Triage

**Coverage verification (immediate — before assigning adjuster):**

1. Policy lookup by insured name, policy number, or VIN/property address
2. Confirm policy was active on the date of loss (not lapsed or cancelled)
3. Confirm LOB and perils — does the described loss fall within covered causes of loss?
4. Confirm deductible amount and any applicable sublimits
5. Flag if any coverage conditions are in question (e.g., vacancy exclusion for property, business use exclusion for personal auto)
6. Confirm reporting timely — no prompt notice issues

**Coverage determination outcomes:**

| Outcome | Action |
|---------|--------|
| Coverage confirmed | Proceed to assignment |
| Coverage in question — condition | Assign with coverage reservation letter triggered |
| Potentially no coverage | Route to senior adjuster or coverage counsel review before accepting |
| Duplicate claim (already reported) | Merge with existing claim file |
| Policy not found | Request policy information from insured; manual lookup |

**Claim type classification and priority scoring:**

| Priority | Criteria | Target Assignment SLA |
|---------|---------|----------------------|
| Critical | Fatality, catastrophic injury, significant property loss > $[X], litigation | Immediate — senior adjuster within 2 hours |
| High | Injury claim, commercial loss > $[X], multi-vehicle | Same business day |
| Standard | Property damage only, personal lines under $[X] | Within 1 business day |
| Low | Glass, roadside, minor property under $[X] | Within 2 business days |

---

## Component 3: Assignment Routing

**Adjuster/TPA routing rules:**

| Claim Type | Routing Condition | Destination |
|-----------|------------------|------------|
| Personal auto — glass only | State supports vendor direct | Auto-route to glass vendor network |
| Personal auto — property damage < $[X] | In-house adjuster available | In-house adjuster queue |
| Personal auto — injury (any) | Any BI involved | Senior adjuster or specialized BI team |
| Commercial property > $[X] | Over threshold | TPA or independent adjuster |
| Workers comp | Any WC claim | WC TPA (if using) or dedicated WC adjuster |
| Litigation | Any legal representation confirmed | Defense counsel notification + senior adjuster |
| Catastrophe event | CAT code activated | CAT team / storm adjuster roster |

**Workload balancing:**

- Display current open claim count per adjuster
- Route to adjuster with lowest open count within appropriate specialty
- Override: supervisor can manually reassign
- Escalation: if no appropriate adjuster available within SLA, notify supervisor

**Assignment notification:**

Upon assignment, send to adjuster:
- Claim summary (FNOL data)
- Policyholder contact information
- Policy coverage summary
- Priority level and contact-by deadline
- Document collection checklist for this claim type

Send to insured:
- Acknowledgment of claim receipt (required within state DOI time frame — typically 10 business days)
- Assigned adjuster name and contact information
- What to expect next
- How to submit additional documents

---

## Component 4: Investigation Tracking

**Task management by claim type:**

**Auto property damage:**
- [ ] Insured contacted (within [N] days per state DOI requirement)
- [ ] Damage inspection scheduled (in-person or photo estimate)
- [ ] Repair estimate received
- [ ] Total loss vs. repairable determination
- [ ] If total loss: ACV calculated, title obtained
- [ ] Other party demand received and responded to
- [ ] Payment authorized

**Property:**
- [ ] Insured contacted
- [ ] Field adjuster dispatched (if >$[X] or complex)
- [ ] Cause of loss investigation complete
- [ ] Scope of damage documented
- [ ] Contractor estimates received (minimum [N] estimates per policy or state requirement)
- [ ] Mortgage company notified if applicable
- [ ] Contents inventory received and reviewed
- [ ] ALE (additional living expense) documentation if displaced

**Document collection checklist (tracked per claim):**

| Document | Required For | Status | Due Date | Received Date |
|---------|------------|--------|---------|--------------|
| Police/incident report | Auto with other party; theft | | | |
| Medical records authorization | Any injury claim | | | |
| Medical bills and records | BI claims | | | |
| Repair estimates | Property damage | | | |
| Contractor invoices | Property paid claims | | | |
| Recorded statement | Complex or disputed claims | | | |
| Signed proof of loss | Property > $[X] (check policy) | | | |

**SLA monitoring:**

| Requirement | SLA | Monitoring |
|------------|-----|-----------|
| Acknowledgment to insured | 10 business days of claim receipt (most states) | Auto-alert at day 7 |
| Coverage acceptance or denial | 45 days (most states; varies) | Auto-alert at day 35 |
| Payment after coverage accepted | 15 business days of proof of loss (varies) | Auto-alert at day 10 |
| Response to insured inquiries | 10 business days | Auto-alert on pending inquiry |

---

## Component 5: Reserve Setting

**Reserve authority levels by claim type and amount:**

| Claim Type | Amount Range | Authority Level |
|-----------|-------------|----------------|
| Auto — property damage | < $[X] | Staff adjuster self-authority |
| Auto — property damage | $[X] – $[X] | Senior adjuster approval |
| Auto — property damage | > $[X] | Manager approval |
| Injury (BI / WC / PL) | Any amount | Senior adjuster + manager review |
| Complex or litigated | Any amount | Management committee |

**Reserve change documentation:**

Every reserve change must include:
- New reserve amount
- Reason for change (additional information received, coverage clarification, medical update, settlement negotiation)
- Adjuster notes explaining the basis
- Approval (if required by authority level)

---

## Component 6: Settlement Authorization

**Settlement authority levels:**

| Claim Type | Amount | Authority |
|-----------|--------|----------|
| All types | < $[X] | Staff adjuster self-authority |
| All types | $[X] – $[X] | Senior adjuster approval |
| All types | $[X] – $[X] | Manager approval |
| All types | > $[X] | Management committee approval |
| BI / injury | Any amount | Manager approval minimum |

**Settlement workflow:**

1. Settlement value calculated (using agreed methodology: ACV, replacement cost, medical special damages + general damages)
2. Demand/counter-demand negotiation documented
3. Settlement authority confirmed
4. Release form generated:
   - General release (BI claims — releases all future claims)
   - Property-specific release
   - State-specific release language (confirm with legal/compliance)
5. Release signed by claimant
6. Payment issued:
   - Check or ACH to claimant (or authorized payee)
   - Lienholder co-payee on property claims if applicable
7. Claim closed in system
8. Subrogation rights evaluated — if third party caused the loss, flag for subrogation pursuit

---

## Component 7: Denial Workflow

**Denial triggers:**

- No coverage on date of loss (policy lapsed, cancelled)
- Cause of loss is an excluded peril
- Policy condition not met (notice, cooperation, fraud)
- Coverage limit exhausted
- Loss not within covered location or property

**Denial process:**

1. Denial recommended by adjuster — must be reviewed and approved by supervisor before issuance (never auto-deny without human review)
2. Denial letter generated — required elements:
   - Specific policy provision(s) supporting the denial (cite exact policy language and page/section)
   - Description of the loss as reported
   - Explanation of why the loss is not covered under the cited provision(s)
   - Right to request reinvestigation
   - Right to file a complaint with the state DOI
   - Contact information for the adjuster handling the claim
3. Denial letter reviewed by compliance or E&O counsel for high-exposure or legally complex denials
4. Denial letter delivered to insured and agent (certified mail or documented electronic delivery)
5. Denial documented in claims system with delivery confirmation
6. Claim closed as denied
7. File retained per state DOI retention requirements

---

## Output Format

Deliver two artifacts:

1. **Claims Workflow Specification** — Step-by-step process for each component in scope, with decision branches, actor at each step (system / CSR / adjuster / supervisor / insured), system triggers, and SLA markers

2. **Authority Matrix** — Claims handling authority table showing triage, reserve, and settlement limits by role and claim type
