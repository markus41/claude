---
description: Detect scope creep in client requests and generate formal change order documentation. Use when a client requests something outside the agreed project scope during an active engagement.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Change Order Guard

Assess whether a client request falls within or outside the agreed project scope, and if outside, generate a formal Change Order Request document. Protects both the client relationship and Lobbi's margin.

## Step 1: Scope Creep Detection

Compare the client's request against the signed Scope Definition Document.

**Inputs required:**
- Client's request (exact wording)
- Signed Scope Definition Document (or summary of agreed scope)
- Current project phase

**Assessment checklist:**

- [ ] Is the requested feature/function explicitly listed in Section 3 (In Scope)?
- [ ] Is the requested feature/function explicitly listed in Section 4 (Out of Scope)?
- [ ] Is the request covered by a reasonable interpretation of an existing deliverable's acceptance criteria?
- [ ] Is the request implied by an existing deliverable but not explicitly called out?
- [ ] Does the request affect a system not listed in the Scope of Work integrations?
- [ ] Does the request affect a user group not listed in the Scope of Work?
- [ ] Does the request require new data flows not covered by existing integration specifications?

**Assessment outcome:**

| Finding | Action |
|---------|--------|
| Explicitly in scope | Proceed — document as clarification, not a change |
| Reasonably implied by existing scope | Use professional judgment; if ambiguous, clarify with client before proceeding |
| Not in scope (not explicitly excluded) | Requires change order |
| Explicitly out of scope | Requires change order; refer to Section 4 of signed scope doc |
| Assumption violated (Section 5) | Requires change order; reference specific assumption |

---

## Step 2: Scope Conversation Guide

Before generating the change order document, have the scope conversation diplomatically. The goal is to protect the project without making the client feel penalized.

**What to say — framework:**

1. **Acknowledge the request genuinely**
   > "That's a great idea and I can see exactly why you'd want it."

2. **Reference the signed scope document — not as a weapon, but as a shared reference**
   > "When we designed the project scope together, we focused on [what's in scope]. This request goes a bit beyond what we scoped out at the time."

3. **Frame the change order as a solution, not a barrier**
   > "The good news is we can absolutely add this. I just need to put together a quick change order so we both know exactly what's being added, what it will cost, and how it affects our timeline."

4. **Set the expectation clearly**
   > "I'll have a change order to you by [date]. Once it's signed, we can slot it into the build schedule."

**What NOT to say:**
- "That's out of scope" (sounds adversarial)
- "We can't do that" (sounds incapable)
- "The contract says..." (sounds lawyerly)
- "We'll just add it in" (sounds like you're doing it for free — establishes a bad precedent)

**When the client pushes back:**
> "I completely understand the frustration — in an ideal world everything would be covered in the original price. The challenge is that if we add things without tracking them formally, it creates confusion about what's included going forward and puts the project at risk. The change order process is actually protecting your investment as much as ours."

---

## Step 3: Change Order Request Document

Generate the formal change order once scope assessment confirms the request is outside the signed scope.

---

**CHANGE ORDER REQUEST**

**Project:** [Project Name]
**Client:** [Client Company]
**Change Order #:** CO-[N] (increment per project)
**Prepared by:** [Lobbi PM Name]
**Date:** [Date]
**Status:** Pending Client Approval

---

**1. Change Description**

Provide a specific description of what is being added, modified, or changed. Write in plain language.

> [Client] has requested: [exact description of the request]
>
> This change involves: [what needs to be built or modified to satisfy the request]

---

**2. Scope Basis**

Explain why this is a change order — reference the specific section of the signed scope document.

> The original Scope of Work ([document date, version]) [does not include / explicitly excludes] this functionality. Reference:
> - Section 3 (In Scope): [what is in scope that is related]
> - Section 4 (Out of Scope): [if explicitly excluded, cite it]
> - Section 5 (Assumption [N]): [if an assumption was violated, cite it]

---

**3. Business Justification**

Why does the client want this change? One sentence — confirms mutual understanding.

> The client needs this capability because [reason from client's perspective].

---

**4. Timeline Impact**

| | Before This Change | With This Change |
|--|--|--|
| Estimated go-live | [Date] | [Date] |
| Timeline extension | — | +[N] business days |
| Phase affected | — | [Build / UAT / Other] |

**Impact explanation:**
> This change requires [N days] of additional [design / development / testing] and will [push the current UAT start date / delay go-live / not affect the timeline if completed in parallel].

---

**5. Investment**

| | |
|--|--|
| Additional project investment | $[Amount] |
| Payment due | [Upon signing / At next milestone] |

**Scope of additional work:**
- [Work item 1]
- [Work item 2]
- [Work item 3]

**New deliverable acceptance criteria:**
- [Specific, testable criteria for the change order deliverable]

---

**6. Impact on Existing Deliverables**

Does this change affect any already-signed-off deliverables?

- [ ] No — this is an additive change only
- [ ] Yes — affects [deliverable name]; [describe impact; re-sign-off required? Y/N]

---

**7. Dependencies**

What the client must provide before work on this change can begin:
- [Dependency 1: e.g., updated system credentials, additional data mapping]
- [Dependency 2]

**Work on this change order begins only after client sign-off and payment are received.**

---

**Approval**

By signing below, both parties agree that this change order modifies the original Scope of Work for the [Project Name] engagement. All other terms and conditions of the original agreement remain in effect.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Client Project Sponsor | | | |
| Lobbi Project Lead | | | |

---

## Step 4: Change Order Log

Maintain a running log of all change orders for the engagement:

| CO # | Description | Date Submitted | Date Approved | Investment | Timeline Impact | Status |
|------|-------------|----------------|---------------|-----------|-----------------|--------|
| CO-001 | | | | $[X] | +[N] days | Approved / Pending / Declined |

**Notes on change order management:**
- Never begin work on a change order before it is signed — verbal approvals do not protect Lobbi
- Send change orders within 24 hours of the scope conversation
- If a client declines a change order but still wants the feature, document the declination in writing and confirm the feature will not be included
- Declined change orders are documented and deferred to a potential Phase 2 conversation
