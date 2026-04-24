---
description: Validate insurance agency workflows against state insurance department requirements and NAIC model laws. Use when designing a workflow for a new state market or when conducting a compliance review of existing agency operations.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Insurance Agency Compliance Checklist

Validate insurance agency workflows against state insurance department (DOI) requirements and applicable NAIC model laws. This skill produces a compliance checklist organized by regulatory domain, with specific statutory or regulatory citation for each requirement.

## Inputs Required

Before running this checklist, identify:
- States of operation (resident state + all non-resident states)
- Lines of business placed (personal auto, homeowners, commercial, GL, professional liability, workers comp, life, surplus lines, etc.)
- Entity type (agency / MGA / TPA / carrier)
- Whether surplus lines authority is held

---

## Section 1: Producer Licensing

**Resident license requirements:**
- [ ] Agency holds a valid resident insurance agency license in the state of domicile
- [ ] All licensed producers have current individual resident licenses in their resident state
- [ ] Lines of authority match the lines of business being transacted (cannot place beyond licensed LOB)
- [ ] License expiration dates tracked with renewal alerts at 90 and 30 days before expiration
- [ ] License numbers on file and searchable in AMS for each producer

**Non-resident license requirements:**
- [ ] Non-resident licenses obtained for each state where the agency transacts business
- [ ] Non-resident license in each state covers all LOBs transacted in that state
- [ ] Reciprocity rules applied: verify each state recognizes resident state's license
- [ ] Non-resident license applications filed within state-required window when business commences
- [ ] Non-resident licenses renewed timely (renewal dates tracked by state)

**Continuing education (CE):**
- [ ] CE requirements tracked per producer per state
- [ ] CE completion documented before each license renewal
- [ ] Ethics CE requirements met (most states require 3+ hours of ethics per cycle)
- [ ] Flood insurance CE met if placing NFIP policies (6 hours per FEMA requirement)
- [ ] CE records maintained for [N] years (varies by state; use most conservative)

**Citation framework:** NAIC Producer Licensing Model Act (adopted in modified form by most states); each state's insurance code Chapter on producer licensing (e.g., Texas Insurance Code §4001; California Insurance Code §1625).

---

## Section 2: Surplus Lines Compliance

*(Skip if agency does not hold surplus lines authority)*

**Diligent search requirements:**
- [ ] At least [N] admitted carrier declinations documented for each surplus lines risk (number varies by state: TX = 1, CA = 3, FL = 3, NY = 3)
- [ ] Declinations documented with: carrier name, date of declination, reason (or "unable to quote")
- [ ] Diligent search conducted by licensed surplus lines agent (not the standard resident agent)
- [ ] Written documentation of search maintained in file

**Filing and stamping requirements:**
- [ ] Surplus lines affidavit prepared for each placement
- [ ] Affidavit filed with the appropriate stamping office (ELANY for NY; SLTX for TX; FSLSO for FL; other states vary)
- [ ] Stamping fees paid and included in premium remittance
- [ ] Stamping office confirmation receipt stored in client file

**Premium tax:**
- [ ] Surplus lines premium tax calculated at correct state rate (varies: typically 2–5%)
- [ ] Premium tax paid to state within filing deadline (typically 30–60 days of policy effective)
- [ ] Surplus lines agent is responsible for premium tax remittance (not the insured)

**Insured disclosure:**
- [ ] Signed disclosure to insured that: policy is placed with a non-admitted carrier; the carrier is not subject to state licensing regulation; the policy is NOT covered by the state guaranty fund
- [ ] Disclosure language meets state-specific requirements (some states have prescribed language)
- [ ] Disclosure obtained before binding

**Citation framework:** NAIC Non-Admitted Insurance Model Act; each state's surplus lines chapter (e.g., Texas Insurance Code Chapter 981; California Insurance Code §1760 et seq.; New York Insurance Law Article 21).

---

## Section 3: Client Disclosure Requirements

**Required disclosures at point of sale (varies by state and LOB):**

- [ ] **Privacy Notice (GLBA):** Delivered at inception and annually; describes information sharing practices
- [ ] **MAIP/FAIR Plan eligibility:** If declining personal lines risk, disclose availability of assigned risk plan or FAIR plan in states that require it
- [ ] **Coverage summary:** Some states require a written coverage summary at delivery of policy
- [ ] **Claims process notice:** Some states require written notice at inception of how to file a claim
- [ ] **Flood insurance disclosure:** Required for property owners in flood zones; must offer NFIP or private flood and document declination if not purchased

**Auto-specific disclosures (personal lines):**
- [ ] Named operator exclusion disclosure (if applicable — state law determines when permitted)
- [ ] Uninsured/underinsured motorist coverage offered and acknowledged (most states require written declination if UM/UIM not purchased)
- [ ] Medical payments coverage offered and acknowledged (some states)
- [ ] PIP requirements met (no-fault states)

**Commercial lines disclosures:**
- [ ] Risk management and loss control recommendations documented where provided
- [ ] Cyber liability exposure discussion if not placing cyber coverage

**Citation framework:** NAIC Privacy of Consumer Financial and Health Information Model Regulation; state unfair trade practices acts; each state's auto insurance disclosure requirements.

---

## Section 4: Privacy Compliance

**GLBA Safeguards Rule:**
- [ ] Written information security program (WISP) in place and reviewed annually
- [ ] WISP designates a qualified individual responsible for information security
- [ ] Risk assessment of foreseeable threats to customer information conducted
- [ ] Safeguards implemented: access controls, encryption in transit and at rest, MFA for systems with customer data, vendor oversight, incident response
- [ ] Service provider contracts include data protection requirements
- [ ] Employee training on information security conducted annually

**State privacy laws:**
- [ ] CCPA/CPRA compliance if California residents are customers (see gdpr-review skill for detail)
- [ ] State-specific privacy laws identified for each state of operation
- [ ] Privacy notice updated to reflect current data sharing practices

**Data breach notification:**
- [ ] Written breach response plan in place
- [ ] Notification trigger: unauthorized acquisition of customer personal information
- [ ] Notification timing: state laws vary — 30 to 90 days; use most restrictive (30 days if multi-state)
- [ ] Required notifications: affected individuals, state attorney general (some states), state DOI (some states), FTC (if >500 records)
- [ ] Substitute notice procedures defined if direct notice is not feasible

**Citation framework:** Gramm-Leach-Bliley Act; FTC Safeguards Rule (16 CFR Part 314, amended 2023); NAIC Insurance Data Security Model Law (adopted in 22+ states); state-specific notification statutes.

---

## Section 5: Claims Handling Regulations

**Prompt payment laws (applies to carriers; agency should monitor for carrier compliance):**

| State | Acknowledge Receipt | Accept or Deny | Pay After Acceptance |
|-------|--------------------|-----------------|--------------------|
| Texas | 15 business days | 15 business days | 5 business days |
| California | 10 calendar days | 40 days | 30 days after proof of loss |
| Florida | 14 days | 90 days | 20 days after agreement |
| New York | [State-specific] | [State-specific] | [State-specific] |

*(Complete this table for each state of operation — requirements vary significantly)*

**Agency obligations in claims handling:**
- [ ] Agency reports FNOL to carrier within [N] hours of receipt
- [ ] Agency maintains copy of FNOL in client file with date/time stamp
- [ ] Agency does not make coverage determinations on behalf of the carrier
- [ ] Agency does not accept or reject claims on behalf of the carrier (unless MGA with authority)
- [ ] Agency documents all client communications regarding a claim
- [ ] Agency does not advise clients on whether to hire a public adjuster or attorney (E&O risk)

**Bad faith exposure:**
- [ ] Agency does not coach carriers on how to handle claims in a manner that benefits the agency at the client's expense
- [ ] Agency does not fail to forward complete claims documentation to the carrier

**Citation framework:** NAIC Unfair Claims Settlement Practices Model Act (adopted in most states); each state's prompt payment statute; each state's bad faith statute.

---

## Section 6: Record Retention

**Standard minimum retention requirements by record type:**

| Record Type | Minimum Retention | Citation (example) |
|-------------|------------------|-------------------|
| Policy files | 5 years after expiration | Most state DOI regs |
| Claims files | 5 years after closure | Most state DOI regs |
| FNOL documentation | 5 years after closure | State DOI |
| Signed applications | 5 years | State DOI |
| Coverage declination forms | 5 years | State DOI / E&O best practice |
| Producer license records | 3 years after termination | NAIC model; state law |
| CE records | 4 years | Most state DOI regs |
| Surplus lines affidavits | 3–5 years | State surplus lines law |
| Premium tax records | 5 years | State DOI / revenue dept |
| Complaint records | 5 years after resolution | State DOI market conduct |
| Privacy notices | 6 years | GLBA |
| Information security incident records | 5 years | GLBA Safeguards Rule |

**Citation framework:** State DOI record retention regulations (each state has its own); NAIC Market Conduct Model Law.

**Note:** Identify the most restrictive period across all states of operation and apply it uniformly — reduces compliance risk from managing state-by-state variations.

---

## Output Format

Produce a **State-by-State Insurance Agency Compliance Checklist** with the following structure for each state:

1. **Licensing status** — License numbers, expiration dates, LOB authority
2. **Surplus lines** — Applicable requirements (if surplus lines is used in the state)
3. **Disclosure requirements** — Required disclosures at sale and renewal
4. **Claims handling** — Prompt payment requirements if applicable
5. **Record retention** — State-specific minimums
6. **Compliance gaps** — Any requirements not currently met, with severity and remediation action

For each checklist item, include the regulatory citation (statute number or DOI regulation citation). Where the requirement varies by state, note the specific state law rather than the NAIC model.
