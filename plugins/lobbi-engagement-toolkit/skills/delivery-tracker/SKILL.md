---
description: Generate milestone tracking configurations and progress report templates for fixed-scope engagements. Use when setting up project delivery tracking at engagement kickoff or when a client needs a status update format.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Delivery Tracker

Generate a milestone tracking structure and weekly status report template for a fixed-scope Lobbi engagement. Establishes delivery cadence, client visibility, and escalation triggers from day one.

## Standard Lobbi Engagement Phases

Every fixed-scope engagement follows these phases. Adjust durations based on project complexity.

| Phase | # | Name | Standard Duration | Key Output |
|-------|---|------|------------------|------------|
| 1 | Kickoff | 1 week | Kickoff meeting, system access confirmed, project plan finalized |
| 2 | Discovery and Design | 1–2 weeks | Workflow design document, integration specs, client approval |
| 3 | Build Sprint 1 | 2–3 weeks | Core automation built, internal testing complete |
| 4 | Build Sprint 2 | 1–2 weeks (if needed) | Integrations complete, exception handling, end-to-end testing |
| 5 | User Acceptance Testing | 1–2 weeks | UAT environment delivered, client tests and approves |
| 6 | Go-Live | 1 week | Production deployment, smoke testing, go-live confirmation |
| 7 | Hypercare | 1–2 weeks | Monitoring, issue resolution, transition to steady state |

---

## Milestone Tracker Template

For each milestone in the engagement, document:

| # | Milestone | Phase | Deliverables | Acceptance Criteria | Client Dependencies | Target Date | Status | Health |
|---|-----------|-------|-------------|---------------------|---------------------|------------|--------|--------|
| 1 | Kickoff complete | Kickoff | Kickoff meeting held; project plan shared; system access received | PM confirms all access credentials received and tested; project plan distributed | Client provides system credentials within 3 business days of contract signing | [Date] | Not Started | |
| 2 | Design approved | Discovery/Design | Workflow design document; integration spec; data mapping | Client signs off on design document | Client subject matter expert available for 2 design sessions | [Date] | Not Started | |
| 3 | Build Sprint 1 complete | Build | Core automation functional in dev environment; Lobbi internal QA passed | Lobbi QA checklist complete; PM demo to client (informational, not sign-off) | None | [Date] | Not Started | |
| 4 | Build Sprint 2 complete | Build | All integrations functional; exception handling complete; end-to-end test passed | End-to-end test log reviewed and approved by Lobbi PM | None | [Date] | Not Started | |
| 5 | UAT complete | UAT | UAT environment available to client; UAT test script provided | Client executes test script; all critical test cases pass; client signs UAT sign-off sheet | Client designates UAT testers; client commits [N] business days to UAT | [Date] | Not Started | |
| 6 | Go-live | Go-Live | Production deployment complete; smoke test passed; client operations team confirmed ready | Smoke test passed; client confirms production transactions processing correctly | Client confirms go-live date; client business team available on go-live day | [Date] | Not Started | |
| 7 | Hypercare complete | Hypercare | Hypercare period ended; known issues resolved or documented; runbook delivered | Zero critical open issues; client confirms readiness to operate independently | Client reports issues within 4 business hours during hypercare | [Date] | Not Started | |

**Status values:** Not Started | In Progress | Complete | Blocked | At Risk

**Health RAG:**
- Green: On track; no issues
- Amber: Minor risk or delay; recoverable without timeline change
- Red: Significant risk; timeline impact likely or already occurring

---

## Client Dependency Register

Track all items Lobbi needs from the client to proceed. Delays in these items extend the project timeline day-for-day.

| # | Dependency | Needed By | Needed For | Requested Date | Received Date | Status | Days Delayed |
|---|-----------|---------|-----------|----------------|---------------|--------|-------------|
| 1 | System credentials: [System] | [Date] | Build Sprint 1 start | [Date] | | Pending | |
| 2 | Subject matter expert: design sessions | [Date] | Design phase | [Date] | | Pending | |
| 3 | UAT testers designated | [Date] | UAT phase | [Date] | | Pending | |
| 4 | Go-live date confirmation | [Date] | Go-live planning | [Date] | | Pending | |

---

## Weekly Status Report Template

Send every Friday by 3:00 PM to the client point of contact and copy the Lobbi account lead.

---

**[Project Name] — Weekly Status Report**
**Week of:** [Monday date] – [Friday date]
**Report #:** [N]
**Prepared by:** [PM Name]

---

**Project Health**

| | |
|--|--|
| Overall | [Green / Amber / Red] |
| Schedule | [Green / Amber / Red] |
| Scope | [Green / Amber / Red] |
| Client Dependencies | [Green / Amber / Red] |

---

**This Week — Completed**

- [Specific accomplishment with outcome, not just activity]
- [e.g., "Completed integration between Applied EPIC and email platform — tested with 50 sample policy records, all passing"]
- [e.g., "Resolved exception handling for out-of-state policies — routing to manual review queue as designed"]

---

**Next Week — Planned**

- [What Lobbi will do next week]
- [Be specific enough that the client knows what to expect]

---

**Milestone Status**

| Milestone | Target Date | Status | Health | Notes |
|-----------|------------|--------|--------|-------|
| [Milestone] | [Date] | [Status] | [RAG] | [If Amber/Red: brief explanation] |

---

**Open Decisions Needed**

Items the client must decide this week for work to proceed:

| # | Decision Required | Context | Decision Needed By | Owner |
|---|------------------|---------|-------------------|-------|
| 1 | [Decision] | [Why it's needed] | [Date] | [Client contact] |

If no decisions are currently needed, write: *No client decisions required this week.*

---

**Risks and Blockers**

| # | Risk / Blocker | Impact | Mitigation | Owner | Status |
|---|---------------|--------|-----------|-------|--------|
| 1 | [Risk description] | [Timeline / scope / budget] | [What Lobbi is doing about it] | [Owner] | Active / Resolved |

If no risks or blockers, write: *No open risks or blockers.*

---

**Pending Client Dependencies**

| Dependency | Needed By | Status |
|-----------|---------|--------|
| [Item] | [Date] | Received / Pending — [N] days outstanding |

---

*Next report: [following Friday date]*
*Questions or concerns? Reply to this email or schedule time: [calendar link]*

---

## Escalation Trigger Conditions

The following conditions require escalation beyond the standard weekly status report cadence. Escalate within 24 hours by phone (not email only).

| Trigger | Escalation Action |
|---------|------------------|
| Client dependency overdue by 3+ business days | Direct call to client sponsor + written notification of timeline impact |
| Critical blocker with no clear resolution path | Immediate call to client; engage account lead |
| Any milestone slipping by 5+ business days | Client call + revised project plan within 3 business days |
| Scope change request received | Follow change order process (see change-order-guard skill) |
| Client satisfaction concern raised by any team member | Account lead involved within 24 hours |
| Any security or data incident | Immediate notification per incident response protocol |

---

## Kickoff Checklist

Use at project kickoff to ensure tracking infrastructure is in place before build begins.

- [ ] Milestone tracker shared with client and internal team
- [ ] Weekly status report cadence confirmed with client POC
- [ ] Client dependency register populated with all known items
- [ ] Client escalation contact (name + direct phone) confirmed
- [ ] Lobbi PM added to client communication channels (Slack, Teams, email)
- [ ] Project folder structure created (shared with client)
- [ ] First weekly status report scheduled for end of Week 1
