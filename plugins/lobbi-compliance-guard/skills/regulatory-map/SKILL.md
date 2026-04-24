---
description: Map business processes to specific regulatory requirements and identify compliance obligations. Use when onboarding a new insurance or financial services client, assessing impact of a regulatory change, or designing a compliance program for a new product line.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Regulatory Mapping

Produce a comprehensive regulatory requirement matrix that maps each business process step to the specific regulatory requirements it must satisfy, identifies gaps where no control exists, and provides the foundation for a compliance program.

## Step 1: Entity and Product Classification

Identify exactly what the client is and does, because regulatory obligations are entity- and product-specific.

**Entity type (select all that apply):**

Insurance:
- [ ] Insurance agent (licensed individual or agency)
- [ ] Insurance broker
- [ ] Managing General Agent (MGA) — has binding authority
- [ ] Managing General Underwriter (MGU) — no binding authority
- [ ] Admitted carrier (licensed in state, subject to rate/form filing)
- [ ] Non-admitted / surplus lines carrier
- [ ] Third-Party Administrator (TPA)
- [ ] Reinsurer

Mortgage:
- [ ] Mortgage broker (originates, does not fund)
- [ ] Mortgage banker / non-bank lender (originates and funds, sells to secondary market)
- [ ] Portfolio lender (originates and holds)
- [ ] Mortgage servicer (collects payments, loss mitigation)
- [ ] Correspondent lender

Financial Services:
- [ ] Registered Investment Advisor (RIA)
- [ ] Broker-dealer (FINRA member)
- [ ] Dual registrant (RIA + BD)
- [ ] Bank or credit union (state or federally chartered)
- [ ] Money services business (MSB)

**Product lines and states (document each combination):**

| Product Line | States of Operation | License Type Held | License Numbers |
|-------------|---------------------|------------------|----------------|
| [e.g., Personal lines P&C] | [e.g., TX, CA, FL] | [e.g., Insurance Agency] | [License #s] |

## Step 2: Regulatory Universe Identification

Based on entity type and product lines, enumerate all applicable regulations.

**Federal regulations (apply regardless of state):**

| Regulation | Full Name | Administering Agency | Summary of Applicability |
|-----------|-----------|---------------------|--------------------------|
| RESPA | Real Estate Settlement Procedures Act | CFPB | Mortgage: settlement costs, kickbacks, escrow |
| TRID | TILA-RESPA Integrated Disclosure | CFPB | Mortgage: LE and CD disclosures |
| HMDA | Home Mortgage Disclosure Act (Reg C) | CFPB | Mortgage: LAR data collection and reporting |
| ECOA/Reg B | Equal Credit Opportunity Act | CFPB | Credit: adverse action, fair lending |
| FCRA | Fair Credit Reporting Act | CFPB + FTC | Credit: permissible purpose, adverse action |
| Dodd-Frank QM/ATR | Ability to Repay / Qualified Mortgage | CFPB | Mortgage: underwriting standards |
| BSA/AML | Bank Secrecy Act / Anti-Money Laundering | FinCEN | All financial: CIP, SAR, CTR |
| GLBA | Gramm-Leach-Bliley Act / Safeguards Rule | FTC / banking regulators | All financial: privacy, data security |
| CAN-SPAM | CAN-SPAM Act | FTC | Email marketing |
| TCPA | Telephone Consumer Protection Act | FCC | Phone/text marketing |
| FINRA 4511 | FINRA Recordkeeping Rule | FINRA | BD: books and records |
| SOX | Sarbanes-Oxley Act | SEC | Public companies: financial reporting controls |

**State regulations (document per state):**

For each state of operation, identify:
- Insurance code and regulations (administered by state DOI)
- Mortgage banking / lending statutes (state banking dept or DOI)
- State consumer protection statutes
- State privacy laws (CCPA/CPRA for CA; others as applicable)
- State recording consent laws (one-party vs. two-party)
- State unclaimed property laws

## Step 3: Requirement Extraction

For each regulation in the universe, extract the specific operational requirements — what must the business do, not just what the law says.

**Requirement format:**

```
REQ-[Regulation]-[N]:
Regulation: [Reg name and specific section/rule]
Requirement: [Plain English description of what must happen operationally]
Applies to: [Which entity types, product lines, or states]
Frequency: [Per transaction / Monthly / Annually / Ongoing]
Evidence required: [What documentation proves compliance]
Failure consequence: [Regulatory action, fine, license revocation, civil liability]
```

**Example extractions:**

```
REQ-TRID-001:
Regulation: TRID / Reg Z § 1026.37
Requirement: Deliver Loan Estimate within 3 business days of receiving application (6 triggers)
Applies to: All mortgage lenders and brokers
Frequency: Per loan application
Evidence required: LE issuance date, delivery confirmation, application date
Failure consequence: CFPB enforcement, inability to collect fees before LE delivery

REQ-NAIC-001:
Regulation: NAIC Unfair Trade Practices Act (adopted by most states)
Requirement: Acknowledge receipt of a claim within 10 working days; accept or deny within 45 days
Applies to: Admitted carriers, some TPAs
Frequency: Per claim
Evidence required: Claim acknowledgment log, acceptance/denial letters with dates
Failure consequence: State DOI market conduct citation, fines
```

## Step 4: Process Mapping

Map each regulatory requirement to the business process step(s) where it must be implemented.

**Process mapping table:**

| REQ ID | Regulation | Requirement Summary | Process Area | Process Step | Step Owner | System | Gap? |
|--------|-----------|---------------------|-------------|-------------|------------|--------|------|
| REQ-TRID-001 | TRID / Reg Z § 1026.37 | LE within 3 business days | Loan origination | Application intake → LE generation | Loan processor | LOS | [Yes/No] |

**Process areas to map (adjust for client):**

Insurance:
- Marketing and lead generation
- Application intake and data collection
- Underwriting and risk assessment
- Quote and bind
- Policy issuance
- Endorsements and policy changes
- Renewals
- Cancellations and non-renewals
- Claims intake
- Claims investigation and adjudication
- Claims payment
- Compliance monitoring and reporting
- Producer licensing management

Mortgage:
- Lead generation and marketing
- Pre-qualification
- Loan application intake
- Disclosure delivery (LE, CD, ECOA, FCRA)
- Processing and document collection
- Underwriting
- Appraisal and title
- Closing preparation and CD delivery
- Closing and funding
- Post-close and trailing documents
- Secondary market delivery
- Servicing (if applicable)
- Loss mitigation and default (if applicable)

## Step 5: Control Identification

For each requirement mapped to a process step, identify the control that satisfies it.

| REQ ID | Process Step | Control Description | Control Type | Automated? | Evidence Produced |
|--------|-------------|---------------------|-------------|-----------|-------------------|
| [REQ ID] | [Step] | [What the control does] | Preventive / Detective | Yes / No | [Log, report, document] |

Where no control exists, mark as **GAP** and proceed to Step 6.

## Step 6: Gap Identification and Evidence Matrix

**Gap summary:**

| REQ ID | Requirement | Gap Description | Risk Level | Remediation |
|--------|-------------|-----------------|-----------|-------------|
| [ID] | [Requirement] | [What is missing or inadequate] | Critical / High / Medium / Low | [Specific action] |

**Evidence matrix — what a regulator would request:**

| REQ ID | Requirement | Evidence Type | Produced By | Stored Where | Retention Period |
|--------|-------------|--------------|-------------|-------------|-----------------|

## Output Format

Deliver one integrated artifact — the **Regulatory Requirement Matrix** — as a structured table with these columns:

**Regulation | Section/Rule | Requirement (plain English) | Process Area | Process Step | Control | Evidence | Gap | Risk Level | Remediation**

Accompany with:
- **Regulatory Universe Summary** — Bullet list of all applicable regulations with one-line description
- **Gap Priority List** — Top gaps ordered by risk level (Critical first), with owner and target remediation date
- **Open Items** — Regulatory requirements where client must provide clarification before mapping can be completed
