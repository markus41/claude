---
description: Generate a fixed-scope project definition document with explicit inclusions, exclusions, and acceptance criteria. Use at project kickoff to establish the boundaries of a fixed-price engagement and prevent scope creep disputes.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Scope Definition Document

Produce a clear, signed-off project scope document that defines exactly what is and is not included in a fixed-price Lobbi engagement. This document is the reference point for all scope dispute resolution throughout the project.

## How to Use This Skill

Gather the following inputs before generating the scope document:
1. Discovery call notes or sales conversation summary
2. Client business problem description
3. Systems involved (AMS, LOS, CRM, carrier portals, email platform, etc.)
4. Users who will interact with the automation
5. Any constraints (technical environment, budget ceiling, go-live date)
6. What the client explicitly said they do NOT need

---

## Section 1: Business Problem Statement

Write 2–3 sentences in the client's own language describing the problem this project solves. Avoid technical jargon. This section is what the client reads to confirm we understand their situation.

**Format:**
> [Client name]'s [team/department] currently [describe the manual process or pain point]. This causes [quantified or described business impact: time lost, errors, delays, compliance risk]. This project will [high-level solution in plain English].

**Example:**
> Riverside Insurance Agency's CSR team currently processes policy change requests by hand — receiving requests via email, manually updating each policy in Applied EPIC, and sending confirmation to the client and carrier. This process takes an average of 45 minutes per request and generates 3–5 errors per week that require correction. This project will automate the intake, validation, system update, and confirmation steps so that routine policy change requests complete without manual intervention.

---

## Section 2: Success Criteria

List 3–5 measurable outcomes that define project success. Each criterion must be testable during User Acceptance Testing.

| # | Success Criterion | How It Will Be Measured | Acceptable Threshold |
|---|------------------|------------------------|----------------------|
| 1 | [Criterion] | [Measurement method] | [Pass/fail threshold] |
| 2 | | | |
| 3 | | | |

**Examples of good success criteria:**
- Policy change requests submitted through the intake form are processed and confirmed within 10 minutes without manual intervention for 95% of requests
- Error rate on processed changes is less than 0.5% as measured by QA review of a 30-day production sample
- System processes minimum 50 concurrent requests without degradation

---

## Section 3: In Scope

List every deliverable, integration, and user group that is included in this engagement. Be specific — vague inclusions become scope disputes.

### Deliverables

| # | Deliverable | Description | Acceptance Criteria |
|---|-------------|-------------|---------------------|
| 1 | [Deliverable name] | [What it is and what it does] | [Specific, testable criteria for sign-off] |

**Guidance for writing acceptance criteria:**
- Functional: "The system sends a confirmation email to the client and the agent within 10 minutes of processing"
- Non-functional: "The portal loads in under 3 seconds on a standard broadband connection"
- Data: "All required fields from the ACORD 175 are captured and stored in Applied EPIC"
- Error handling: "Invalid requests are routed to the exception queue with the specific validation failure noted"

### System Integrations

| Integration | Source System | Destination System | Data Transferred | Direction |
|------------|--------------|-------------------|-----------------|-----------|

### User Groups

List every type of user who will interact with the delivered automation:

| User Group | Access Level | Volume (approx.) |
|-----------|-------------|------------------|

### Data Volumes and Constraints

Explicitly document the scale the solution is designed to handle:
- Maximum transactions per day: [N]
- Maximum concurrent users: [N]
- Data volume assumptions: [e.g., policies up to 500 line items, attachments up to 10MB]

Any performance requirement outside these bounds is out of scope and subject to a change order.

---

## Section 4: Out of Scope

Explicitly list what is NOT included. This section prevents "I thought that was included" conversations.

**Standard exclusions to always include:**
- Custom reporting or analytics beyond what is specified in Section 3
- Training beyond [N] hours / [N] sessions defined in the delivery plan
- Changes to third-party system configuration (carrier portals, AMS, LOS) beyond the integration points listed above
- Mobile application development
- Ongoing maintenance and support after the [N]-day hypercare period
- Data migration of historical records
- Integration with any system not listed in Section 3
- Changes to any business process not part of the automation in scope
- Security or penetration testing
- Accessibility (WCAG) compliance beyond standard browser rendering

**Client-specific exclusions (add based on discovery):**
- [Specific feature the client mentioned but is not in scope]
- [System the client mentioned but is excluded]
- [User group not included]

---

## Section 5: Assumptions

List conditions that, if not true, would require a change order.

| # | Assumption | Impact if False |
|---|-----------|----------------|
| 1 | Client provides API credentials and test environment access within 5 business days of kickoff | Delays start of build phase; timeline extends day-for-day |
| 2 | [System] API is functional and returns data in the documented format | Integration design may require revision; subject to change order |
| 3 | Client designates one primary point of contact with authority to approve deliverables | Approval delays will extend timeline |
| 4 | Client's existing [AMS/LOS/CRM] is on version [X] or later | Older versions may lack required API capabilities |
| 5 | Client completes UAT within [N] business days of receiving test environment | Timeline extension if UAT window is missed |

---

## Section 6: Change Order Trigger Conditions

The following conditions require a formal Change Order before work proceeds. Lobbi will not perform out-of-scope work without a signed change order.

- Any deliverable not listed in Section 3
- Any system integration not listed in Section 3
- Any user group not listed in Section 3
- Performance requirements exceeding the data volumes in Section 3
- Any feature, function, or behavior not explicitly described in Section 3
- Request to modify any deliverable after client sign-off on that deliverable
- Discovery during build that client's technical environment requires approach changes not anticipated in this document (client's system is materially different from what was described)

---

## Section 7: Sign-Off

This document is the authoritative reference for the scope of the [Project Name] engagement.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Client Project Sponsor | | | |
| Client Technical Contact | | | |
| Lobbi Project Lead | | | |

By signing, both parties acknowledge that they have read and agree to the scope, exclusions, assumptions, and change order conditions defined in this document.

---

## Output Notes for the Skill

When generating this document:
- Use the client's actual system names and terminology — never generic placeholders in the final output
- Write acceptance criteria as testable pass/fail statements, not aspirations
- Flag any vague client request that cannot be written as a testable acceptance criterion — these must be resolved before the document is signed
- Every item in Section 3 must have corresponding acceptance criteria
- Every "I thought we discussed..." scenario from similar past projects should be pre-empted in Section 4
