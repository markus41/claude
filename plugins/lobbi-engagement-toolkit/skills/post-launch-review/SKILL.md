---
description: Conduct a post-go-live assessment and identify optimization opportunities for a completed automation engagement. Use 30-60 days after an automation launch to validate outcomes, capture lessons learned, and identify expansion opportunities.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Post-Launch Review

Conduct a structured post-go-live assessment of a completed Lobbi automation engagement. The review validates that the automation is delivering its promised outcomes, captures what went well and what to improve, and identifies opportunities for a Phase 2 expansion conversation.

## Timing and Setup

**Recommended timing:** 30–60 days post-go-live. Early enough that memory is fresh; late enough that initial launch anomalies have settled and meaningful production data exists.

**Meeting format:** 60-minute video call with client. Participants: client project sponsor, client operational SME (person using the automation daily), Lobbi PM, Lobbi account lead.

**Pre-meeting data collection:** Gather the metrics below before the meeting so the conversation is data-driven, not anecdotal.

---

## Section 1: Outcome Validation

Compare actual performance against the projections from the original ROI calculator.

### Processing Metrics

Pull from system logs, AMS/LOS reports, or monitoring dashboards:

| Metric | Projected | Actual | Variance | Notes |
|--------|-----------|--------|---------|-------|
| Daily transaction volume | [N] | [N] | [+/-X%] | |
| Straight-through processing rate | [X]% | [X]% | [+/-X pts] | |
| Average processing time per transaction | [N] min | [N] min | [+/-X%] | |
| Error rate | [X]% | [X]% | [+/-X pts] | |
| Exception rate (manual review required) | [X]% | [X]% | [+/-X pts] | |
| System uptime / availability | ≥99% | [X]% | | |

### Financial Outcomes

| Metric | Projected (Year 1 annualized) | Actual (30/60-day run rate × 12) | Variance |
|--------|-------------------------------|----------------------------------|---------|
| Annual hours recovered | [N] hours | [N] hours | [+/-X%] |
| Annual labor savings | $[X] | $[X] | [+/-X%] |
| Annual error cost reduction | $[X] | $[X] | [+/-X%] |
| **Total annual savings** | **$[X]** | **$[X]** | **[+/-X%]** |

**Variance explanation:** For any metric where actual performance is more than 10% below projection, document the root cause:
- Volume lower than expected (business seasonality? adoption lag?)
- Straight-through rate lower than expected (exception categories not anticipated?)
- Error rate higher than expected (data quality issues? edge cases not covered?)

### User Adoption

- Number of users trained: [N]
- Number of users actively using the automation: [N] ([X]% adoption rate)
- Transactions still processed manually (should be zero for in-scope workflows): [N]
- If adoption < 100%: identify the users/teams not using the automation and the reason

---

## Section 2: System Health Check

Assess whether the automation is operating reliably in production.

| Health Indicator | Status | Notes |
|-----------------|--------|-------|
| Integration error rate (external API calls) | [Green <1% / Amber 1-5% / Red >5%] | |
| Processing volume vs. capacity (% of limit) | [Green <70% / Amber 70-85% / Red >85%] | |
| SLA compliance (processing within defined time window) | [Green >99% / Amber 95-99% / Red <95%] | |
| Exception queue backlog | [Green = 0 / Amber = 1-5 / Red = 5+] | |
| Failed notification / communication count | [N] since go-live | |
| Manual overrides or workarounds in use | [Y/N — list if Y] | |
| Any unplanned outages since go-live | [N incidents, total downtime] | |

**Outstanding issues (known bugs or limitations identified in production):**

| Issue | Severity | Workaround in use | Resolution status |
|-------|---------|------------------|------------------|
| [Issue description] | Critical / High / Medium / Low | [Yes / No — describe] | [Scheduled fix date / Backlogged] |

---

## Section 3: User Feedback Collection

Gather structured feedback from end users and managers. Conduct either as a survey (sent before the review meeting) or as a facilitated discussion during the meeting.

**For end users (people who interact with the automation daily):**

1. On a scale of 1–5, how satisfied are you with the automation? [Average score]
2. What is the biggest improvement compared to the old manual process?
3. What is the most frustrating thing about the current automation?
4. Are there situations where you still do this process manually? If yes, why?
5. Is there anything you expected the automation to do that it doesn't?

**For managers / team leads:**

1. Has the automation delivered the time savings you expected?
2. Have there been any operational issues caused by the automation?
3. How has the automation affected team capacity? (New tasks taken on? Headcount impact?)
4. How has customer or partner response to the new process been?
5. What would make the biggest difference in Phase 2?

**Summary of feedback themes:**
- Positive themes: [List the 2–3 things users are happiest about]
- Negative themes: [List the 2–3 most common complaints or frustrations]
- Unmet expectations: [List any expectations not met by the automation]

---

## Section 4: Lessons Learned

Capture what went well and what to do differently — for Lobbi's internal improvement, not for client delivery.

**What went well:**

| Category | Observation |
|---------|-------------|
| Discovery / scoping | [e.g., "Detailed ROI data collected upfront made the proposal compelling and set realistic expectations"] |
| Technical | [e.g., "Applied EPIC API performed reliably — no rate limiting issues"] |
| Delivery | [e.g., "Client UAT testers were well-prepared because of the test script we provided"] |
| Client relationship | [e.g., "Weekly status reports kept the sponsor informed and reduced ad-hoc check-in requests"] |

**What to improve:**

| Category | Issue | Root Cause | Change for Next Project |
|---------|-------|------------|-------------------------|
| Discovery | [e.g., "Volume projections were 30% high — client estimated, didn't measure"] | Client estimated from memory | Ask for 90-day historical data, not estimates |
| Technical | [e.g., "Carrier portal API changed without notice mid-build"] | No version lock / change notification | Add API versioning check to integration checklist |
| Delivery | [e.g., "UAT started 5 days late due to client unavailability"] | UAT timeline not confirmed at kickoff | Lock UAT dates and testers at project kickoff |

**What surprised us:**

| Surprise | Impact | How we handled it |
|---------|--------|------------------|
| [e.g., "3x more exception types than anticipated"] | [+1 week to build] | [Change order / absorbed] |

---

## Section 5: Optimization Opportunities

Identify improvements that fall within the existing system — quick wins that improve performance without a new engagement.

**Quick wins (no change order required, configurable changes):**

| Opportunity | Current State | Improved State | Effort | Owner |
|------------|--------------|----------------|--------|-------|
| [e.g., "Add 2 new exception category auto-resolutions"] | Manual review | Auto-resolved | Low | Lobbi |
| [e.g., "Increase notification email personalization"] | Generic template | Personalized | Low | Lobbi |

**Tune-ups (minor change order, < $2K):**

| Opportunity | Business Benefit | Estimated Investment |
|------------|-----------------|---------------------|
| [Improvement] | [Quantified benefit] | $[X] |

---

## Section 6: Phase 2 Expansion Roadmap

Based on the review, identify the most compelling opportunities for a Phase 2 engagement. These are new automations or significant extensions — not quick wins.

**Expansion opportunities (prioritized by client interest and ROI potential):**

| Priority | Opportunity | Current State | Proposed Automation | Estimated ROI | Client Interest |
|---------|------------|--------------|---------------------|--------------|----------------|
| 1 | [e.g., "Policy renewal outreach sequence"] | Manual renewal calls | Automated 90/60/30-day sequence | $[X]/year | High / Medium / Low |
| 2 | | | | | |
| 3 | | | | | |

**Recommended next step:**

> Based on this review, we recommend scheduling a 60-minute discovery call focused on [top Phase 2 opportunity]. This would build directly on the current automation and [rationale for why it's the right next step].

---

## Output Format

Produce a **Post-Launch Review Report** structured as:

1. **Executive Summary** — 3–5 bullet points covering: outcomes vs. projections, system health, user adoption, top lesson, top Phase 2 recommendation
2. **Outcome Validation** — Tables from Section 1
3. **System Health** — Table from Section 2 with green/amber/red summary
4. **User Feedback Summary** — Themes from Section 3
5. **Lessons Learned** — Internal retrospective from Section 4
6. **Optimization Opportunities** — Quick wins from Section 5
7. **Phase 2 Roadmap** — Expansion opportunities from Section 6

The report is suitable for sharing with the client sponsor as a professional engagement closeout document.
