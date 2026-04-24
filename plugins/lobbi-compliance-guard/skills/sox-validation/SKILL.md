---
description: Validate financial controls and workflows against SOX Section 302 and 404 requirements. Use when a client needs to ensure their financial reporting workflows meet Sarbanes-Oxley requirements for internal controls over financial reporting.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# SOX Section 302 and 404 Validation

Assess financial reporting controls and workflows against Sarbanes-Oxley Act requirements, producing a control matrix with design and operating effectiveness ratings, deficiency log, and remediation roadmap.

## Section 1: SOX 302 — Disclosure Controls

Section 302 requires the CEO and CFO to certify that disclosure controls and procedures are effective and that they have reviewed the financial report.

**Disclosure controls assessment:**

- [ ] Disclosure controls and procedures (DC&P) are formally documented and defined
- [ ] DC&P design has been reviewed and approved by executive management in the past 12 months
- [ ] Evaluation of DC&P effectiveness has been conducted as of the end of each fiscal quarter
- [ ] Material weaknesses in internal controls have been identified and disclosed if present
- [ ] Significant changes in internal controls during the period have been documented and disclosed
- [ ] Evaluation process produces written documentation that supports CEO/CFO certification
- [ ] Sub-certifications collected from financial report preparers (controllers, division heads)
- [ ] Fraud risk assessment conducted and results documented

**Section 302 workflow requirements:**
- Certification timeline is defined (typically 45 days post-quarter end for 10-Q, 60 days for 10-K)
- Sub-certification collection process has defined deadlines and escalation path
- Material weakness and significant deficiency disclosure process is documented
- Prior-period adjustments and restatement procedures are defined

## Section 2: SOX 404 — Internal Controls Over Financial Reporting

Section 404 requires management to assess the effectiveness of internal controls over financial reporting (ICFR) and external auditors to attest to that assessment.

### 2a: Risk-Based Control Inventory

Build the control inventory using a top-down risk-based approach aligned with COSO (Committee of Sponsoring Organizations) framework.

**Entity-level controls (ELC):**

| Control | Description | Control Owner | Frequency | Evidence |
|---------|-------------|--------------|-----------|---------|
| Control environment | Tone at top, ethics code, HR competency policies | CEO/Board | Annual | Board minutes, signed code of conduct |
| Risk assessment | Formal annual risk assessment process | CFO | Annual | Risk assessment document |
| Control activities | Policy and procedure documentation | Controller | Annual | Policy library |
| Information and communication | Financial reporting close process | Controller | Monthly | Close checklist, financial statements |
| Monitoring | Internal audit charter and plan | Internal Audit | Annual | IA reports |

**Process-level controls — Financial Reporting Processes:**

For each financial reporting process (Revenue, A/P, A/R, Payroll, Fixed Assets, Treasury, Financial Close), document:

| Control ID | Process | Control Description | Control Type | Owner | Frequency | Automated/Manual | Key Control |
|-----------|---------|---------------------|-------------|-------|-----------|-----------------|------------|
| [ID] | [Process] | [What the control does] | [Preventive/Detective] | [Role] | [Daily/Month-end/etc.] | [A/M/Hybrid] | [Yes/No] |

Mark controls as **Key Controls** if they address a significant risk and failure would result in a material misstatement. Key controls require full design and operating effectiveness testing.

**IT General Controls (ITGC):**

ITGCs are the foundation that automated financial controls depend on. Scope all financially significant systems.

| Control Domain | Control | System | Owner | Evidence |
|---------------|---------|--------|-------|---------|
| Logical access | User access provisioning with manager approval | [ERP/GL system] | IT Security | Provisioning tickets |
| Logical access | Quarterly access review and certification | [System] | IT Security | Access review sign-off |
| Logical access | Privileged access review (admin accounts) | All financial systems | IT Security | Privileged user list + approval |
| Logical access | Terminated employee de-provisioning within 24 hours | All systems | HR + IT | Offboarding tickets |
| Change management | Separation of development, test, and production environments | All financial systems | IT | Environment architecture diagram |
| Change management | Change request, approval, and testing before production deploy | All financial systems | IT | Change tickets |
| Change management | Emergency change process with post-hoc approval | All financial systems | IT | Emergency change log |
| Computer operations | Backup and recovery procedures tested annually | Financial system DBs | IT | Backup test results |
| Computer operations | Job scheduling monitoring and failure alerts | Batch financial jobs | IT | Job monitoring reports |
| Program development | SDLC policy covering security and UAT requirements | All systems | IT | SDLC policy |

### 2b: Design Effectiveness Assessment

For each key control, evaluate whether it is designed to achieve its control objective if it operates as designed.

**Design effectiveness criteria:**
- Control objective is clearly defined (what risk does this control address?)
- Control activity is specific enough to be performed consistently
- Control frequency matches the risk frequency (daily transaction risk → daily control)
- Control owner is appropriate (qualified, independent of the activity being controlled)
- Evidence of control performance is defined (what does the controller produce to show it ran?)
- Exception handling is defined (what happens when the control detects an error?)

**Design effectiveness rating:**
- **Effective**: All design criteria met
- **Partially Effective**: Minor design gaps; suggest enhancements
- **Ineffective**: Material design gap; control cannot achieve its objective as designed → document as design deficiency

### 2c: Operating Effectiveness Testing

For each key control, test whether it operated effectively throughout the period.

**Testing approach by control type:**

| Control Frequency | Minimum Sample Size | Testing Method |
|------------------|--------------------|--------------  |
| Daily | 25 | Inspect evidence for 25 randomly selected days |
| Weekly | 15 | Inspect evidence for 15 randomly selected weeks |
| Monthly | 12 | Inspect evidence for all 12 months |
| Quarterly | 4 | Inspect evidence for all 4 quarters |
| Annual | 1 | Inspect evidence for the annual performance |
| Automated (continuous) | 1 + ITGC reliance | Test control once + verify ITGC effectiveness |

**Evidence inspection checklist for each sample:**
- Evidence exists for the period (completeness)
- Evidence was produced timely (within defined window)
- Evidence shows the control was performed by the appropriate owner
- Evidence shows exceptions were identified and resolved (if any)
- Signatures, approvals, or system timestamps are present as required

**Operating effectiveness rating:**
- **Effective**: No exceptions or isolated exceptions that are not indicative of systemic failure
- **Deficiency**: One or more exceptions; classify severity (see Section 3)

### 2d: COSO Framework Management Assessment

Confirm the control environment addresses all five COSO components:

1. **Control Environment** — Integrity and ethical values; commitment to competence; board and audit committee oversight; management philosophy; organizational structure; assignment of authority; HR policies
2. **Risk Assessment** — Risk identification; risk analysis; risk response
3. **Control Activities** — Control policies and procedures; IT controls; performance reviews; physical controls; segregation of duties
4. **Information and Communication** — Financial reporting quality; communication channels up/down/across; external communication
5. **Monitoring** — Ongoing monitoring activities; separate evaluations; reporting of deficiencies

## Section 3: Deficiency Classification

| Deficiency Type | Definition | Disclosure Requirement |
|----------------|------------|----------------------|
| **Control deficiency** | Design or operation of a control does not allow management to prevent or detect a misstatement on a timely basis | Internal reporting only |
| **Significant deficiency** | A deficiency, or combination of deficiencies, that is less severe than a material weakness but important enough to merit attention by those responsible for financial reporting | Must report to audit committee |
| **Material weakness** | A deficiency, or combination of deficiencies, such that there is a reasonable possibility that a material misstatement will not be prevented or detected on a timely basis | Must disclose publicly in 10-K/10-Q; auditor must issue adverse opinion on ICFR |

**Indicators of material weakness (per SEC guidance):**
- Identified material misstatement in the financial statements
- Ineffective control environment (tone at top)
- Material restatement of previously issued financial statements
- Identified fraud by senior management
- Ineffective oversight by audit committee
- Significant deficiency that has not been remediated after reasonable time

## Section 4: Control Matrix

Produce a complete control matrix:

| Control ID | Process | Risk | Control Description | Type (P/D) | Owner | Frequency | A/M | Key | Design Effective | OE Rating | Deficiency Level | Remediation |
|-----------|---------|------|---------------------|------------|-------|-----------|-----|-----|-----------------|-----------|-----------------|-------------|

## Section 5: Remediation Roadmap

For each deficiency, produce a remediation item:

```
DEFICIENCY-[N]: [Short title]
Classification: Material Weakness | Significant Deficiency | Control Deficiency
Control(s) affected: [Control IDs]
Root cause: [Why the control failed — design gap vs. execution gap vs. resource gap]
Remediation action: [Specific steps to remediate]
Control owner: [Who is responsible]
Target completion: [Date — material weaknesses require expedited remediation]
Interim compensating control: [What can reduce risk until permanent fix is in place]
Validation approach: [How will management confirm remediation is effective]
```

## Output Format

Deliver four artifacts:

1. **Control Matrix** — Full spreadsheet-format table of all key controls with design and operating effectiveness ratings
2. **Deficiency Log** — All identified deficiencies with classification, root cause, and remediation owner
3. **Remediation Roadmap** — Prioritized remediation plan (material weaknesses first) with target dates and interim controls
4. **Management Assessment Summary** — Narrative summary suitable for inclusion in the annual report's ICFR section
