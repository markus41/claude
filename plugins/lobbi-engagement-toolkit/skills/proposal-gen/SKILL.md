---
description: Create a client proposal for a fixed-scope automation engagement with ROI projections, timeline, and investment summary. Use when converting a discovery call into a formal proposal document for an insurance, mortgage, or financial services prospect.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Proposal Generation

Produce a professional client proposal for a fixed-scope automation engagement. The proposal must be written in the client's language, position Lobbi's expertise in their specific vertical, and give the decision-maker everything they need to say yes.

## Inputs Required

Before generating the proposal, collect:
- Client company name, contact name, and title
- Industry vertical (insurance, mortgage, financial services)
- Discovery call summary: current process pain, desired outcome, systems involved
- Proposed scope: what will be automated
- Timeline estimate: phases and total weeks
- Investment amount: total project fee and payment milestones
- ROI data: current process hours, frequency, error rate (from discovery)

---

## Proposal Structure

### Header

```
[Client Company Name]
Automation Engagement Proposal

Prepared for: [Contact Name], [Title]
Prepared by: Lobbi
Date: [Date]
Valid through: [Date + 30 days]
```

---

### 1. Executive Summary

2–3 sentences maximum. State the problem in the client's language, the proposed solution, and the primary business outcome. This is what the executive reads when they don't read the rest.

**Format:**
> [Client company] faces [specific pain point] that costs the team [quantified cost or time]. Lobbi will deliver [solution description] — a fixed-scope, fixed-price automation that [primary benefit]. Based on your current process data, we project [lead ROI metric: e.g., $X annual savings / Y hours recovered / Z% error reduction] in the first year.

---

### 2. Business Challenge

2–3 paragraphs that demonstrate you understand the client's situation. Reference specific details from the discovery call. This section builds trust.

Cover:
- Current state: who does what, how often, how long, using which systems
- The cost: time, errors, delays, compliance risk, staff frustration, customer experience impact
- The trigger: why they are looking for a solution now

Quantify wherever possible. "Your CSR team spends 180 hours per month on manual policy changes" is more compelling than "a lot of time."

---

### 3. Proposed Solution

Describe the automation at the right level of detail — enough to be credible, not so much that it becomes a technical spec.

**Solution overview:** 1 paragraph describing what the automation does and how it connects their systems.

**Key capabilities:**
- [Capability 1] — [One-sentence description of what it does and why it matters]
- [Capability 2]
- [Capability 3]
- [Capability 4]

**How it works:** A brief process narrative (5–8 steps) describing the end-to-end flow from trigger to outcome. Use plain language. No technical jargon.

**What makes this different:** 1–2 sentences on Lobbi's specific advantage for this client's vertical (insurance expertise, mortgage regulatory knowledge, existing integrations with their systems).

---

### 4. Scope of Work

Numbered list of deliverables. Each deliverable must be specific enough that the client understands exactly what they are getting, and vague enough that minor implementation variations are not scope changes.

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | [Deliverable name] | [Plain English description — what it does, not how it's built] |
| 2 | | |
| 3 | | |

**Inclusions:**
- [Specific items included that might otherwise be assumed out]

**Exclusions:**
- [Critical items to call out as excluded — prevents post-award disappointment]

---

### 5. Timeline

Show the engagement as phases. Use weeks, not specific dates (avoids needing to update the proposal if the start date slips).

| Phase | Description | Duration |
|-------|-------------|---------|
| Kickoff and Discovery | Detailed requirements, system access, environment setup | Week 1 |
| Design | Workflow design, integration architecture, approval | Weeks 2–3 |
| Build | Development, unit testing, integration testing | Weeks 4–7 |
| User Acceptance Testing | Client UAT with Lobbi support | Weeks 8–9 |
| Go-Live and Hypercare | Production launch, monitoring, issue resolution | Weeks 10–11 |
| **Total** | | **11 weeks** |

**Key client responsibilities:**
- Provide system access and credentials within [N] days of kickoff
- Designate a primary point of contact with decision authority
- Complete UAT within the defined [N] business day window
- Provide feedback within [N] business days of each deliverable submission

Timeline assumes prompt client responsiveness. Delays in client responsibilities extend the timeline day-for-day.

---

### 6. Investment

Clear, simple pricing. Fixed-price proposals build trust.

| | |
|--|--|
| **Total Project Investment** | **$[Amount]** |
| Payment milestone 1: Project kickoff | $[Amount] (due upon signing) |
| Payment milestone 2: Design approval | $[Amount] |
| Payment milestone 3: UAT sign-off | $[Amount] |
| Payment milestone 4: Go-live | $[Amount] |

**What's included:**
- All design, development, testing, and deployment work defined in the Scope of Work
- [N] hours of UAT support
- [N]-day hypercare period post-launch
- Project management and status reporting throughout

**What's not included:**
- Third-party software licenses (if required — listed separately)
- Ongoing maintenance after the hypercare period (available under a separate support agreement)
- Work outside the defined scope (subject to change order)

---

### 7. ROI Summary

Show the financial case. Use numbers from the discovery call.

**Current annual cost of manual process:**

| Cost Component | Calculation | Annual Cost |
|---------------|-------------|------------|
| Staff time: [process] | [N hours/month × 12 × $[hourly rate]] | $[Amount] |
| Error rework cost | [N errors/month × [hours to fix] × 12 × $[rate]] | $[Amount] |
| Other costs (overtime, temp staff, etc.) | | $[Amount] |
| **Total annual cost** | | **$[Total]** |

**Automation savings:**

| | |
|--|--|
| Estimated time reduction | [X]% of manual hours eliminated |
| Annual savings | $[Amount] |
| First-year net benefit | Annual savings − Project investment = **$[Net]** |
| Payback period | **[N] months** |
| 3-year net benefit (10% discount) | **$[NPV]** |

*ROI projections are based on process data provided during discovery. Actual results will vary.*

---

### 8. Next Steps

Tell the client exactly what to do to move forward.

1. Review this proposal and confirm the scope aligns with your requirements
2. Schedule a 30-minute review call with your team if you have questions (link: [calendar link])
3. Sign the proposal and submit your kickoff payment to reserve your project start date
4. Lobbi will schedule the kickoff call within [N] business days of receipt of signed proposal and payment

**Proposal valid through:** [Date + 30 days]. Project start dates are subject to availability.

---

### Footer

```
Lobbi | thelobbi.io
[Contact email] | [Phone if applicable]

This proposal is confidential and prepared exclusively for [Client Company Name].
```

---

## Output Notes for the Skill

- Always write the Executive Summary last, after the full proposal is drafted
- ROI numbers must come from actual discovery call data — never fabricate figures
- If critical ROI data is missing (hours per process, frequency, hourly rate), note what to ask the client rather than estimating
- Payment milestone amounts should sum to the total investment
- Timeline weeks should reflect actual project complexity — do not default to a template duration without adjusting
- The proposal should feel like it was written for this specific client, not from a template
