---
description: Audit a workflow or business process against insurance, mortgage, or financial services regulatory requirements. Use when a client workflow needs regulatory sign-off or when validating that a proposed automation meets compliance requirements before build.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Compliance Check

Perform a structured regulatory compliance audit of a workflow or business process against applicable insurance, mortgage, or financial services requirements.

## Step 1: Identify Applicable Regulations

Determine which regulatory frameworks apply based on entity type, product lines, and states of operation.

**Insurance:**
- State Department of Insurance rules for each state of operation (admitted vs. surplus lines)
- NAIC model laws (Market Conduct, Privacy, Claims Settlement Practices)
- Producer licensing requirements (lines of authority, CE, non-resident)

**Mortgage:**
- TRID (TILA-RESPA Integrated Disclosure) — Reg Z/X
- RESPA Section 8 (kickback/fee-splitting prohibition)
- HMDA/Regulation C (data collection and reporting)
- QM/ATR (Qualified Mortgage / Ability to Repay — Dodd-Frank)
- ECOA/Regulation B (fair lending, adverse action)
- FCRA (credit report permissible purpose, adverse action notices)

**Financial Services:**
- FINRA rules (broker-dealer supervision, suitability, recordkeeping)
- SEC regulations (investment advisor registration, fiduciary duty)
- BSA/AML (Bank Secrecy Act, Anti-Money Laundering — suspicious activity reporting, CIP)
- State money transmitter laws (if applicable)

## Step 2: Map Requirements to Workflow Steps

For each identified regulation, trace its requirements to specific steps in the workflow:

| Regulation | Requirement | Applicable Workflow Step | Responsible Role |
|------------|-------------|--------------------------|-----------------|
| [Reg]      | [What must happen] | [Step name/number] | [Who] |

Flag each workflow step that touches a regulated activity. Mark steps with no regulatory mapping as low-risk baseline.

## Step 3: Gap Analysis

For each requirement-to-step mapping, assess whether the current workflow design satisfies the requirement:

- **Compliant**: Workflow step explicitly addresses the requirement with documented evidence
- **Partial**: Requirement is partially addressed; specific gaps identified
- **Non-Compliant**: Requirement is not addressed in the current design
- **Not Applicable**: Requirement does not apply to this specific workflow variant

**Severity classification for gaps:**
- **Critical**: Non-compliance exposes client to regulatory enforcement, license revocation, or civil liability
- **High**: Non-compliance is likely to be cited in an examination or audit
- **Medium**: Non-compliance may be cited; remediation is straightforward
- **Low**: Best practice not followed; unlikely to be cited but should be addressed

## Step 4: Remediation Backlog

For each gap, produce a remediation item:

```
GAP-[N]: [Short title]
Regulation: [Specific statute/rule citation]
Severity: Critical | High | Medium | Low
Current state: [What the workflow does today]
Required state: [What it must do]
Remediation: [Specific change required — be actionable]
Complexity: Low (< 1 day) | Medium (1–3 days) | High (3+ days)
Owner: [Role responsible]
```

## Step 5: Sign-Off Evidence Checklist

List the documentation a compliance officer or regulator would need to confirm each requirement is met:

- Policy/procedure documents that address each requirement
- Training records for staff who execute regulated workflow steps
- Audit log evidence that required fields are captured
- Sample outputs (disclosures, notices, reports) showing required content
- System screenshots or configuration exports showing controls are active
- Testing evidence (QA sign-off, UAT sign-off) for compliance-critical steps

## Output Format

Produce a **Compliance Review Report** with these sections:

1. **Executive Summary** — Entity type, product lines, states reviewed; overall compliance posture (Compliant / Partially Compliant / Non-Compliant); count of Critical/High/Medium/Low gaps
2. **Regulatory Universe** — Table of all applicable regulations with brief description and applicability rationale
3. **Requirement-to-Workflow Mapping** — Full mapping table from Step 2
4. **Gap Analysis** — Findings table with severity, current state, required state
5. **Remediation Backlog** — Prioritized list from Step 4 (Critical first)
6. **Sign-Off Evidence Checklist** — Documentation required for each requirement
7. **Open Questions** — Items requiring client clarification before the review can be finalized
