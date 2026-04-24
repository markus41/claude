---
description: Design automated renewal workflows with retention scoring and proactive outreach sequences. Use when building renewal automation for insurance agencies to reduce lapse rates and improve client retention.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Renewal Automator Workflow Design

Design a complete automated renewal workflow that scores client retention risk, triggers proactive outreach sequences, manages quote generation, and handles exception cases — all designed to maximize retention rates and reduce the manual burden on agency staff.

## Renewal Pipeline Architecture

The renewal automation runs as a background process that continuously monitors upcoming expirations and triggers the appropriate actions based on days-to-expiration and client retention score.

**Pipeline overview:**

```
Daily: Scan for upcoming expirations
  → 90 days: Enter renewal pipeline → Score retention risk → Route by tier
  → 60 days: Quote generation trigger → Deliver quote to agent
  → 30 days: Agent review flag → Client outreach
  → 14 days: Escalation if not resolved
  → 7 days: Final alert
  → Expiration: Lapse handling
```

---

## Component 1: Renewal Pipeline Setup

**Scanning criteria:**

Run nightly. Pull all policies from AMS where:
- `expiration_date` is between today and today + 90 days
- `policy_status` = 'Active'
- Not already in renewal pipeline (deduplicate)

**Pipeline entry data captured:**

| Field | Source |
|-------|--------|
| Policy number | AMS |
| Named insured | AMS |
| LOB | AMS |
| Carrier | AMS |
| Current premium | AMS |
| Expiration date | AMS |
| Agent of record | AMS |
| Client retention score | Calculated (see Component 2) |
| Renewal tier | Derived from retention score |
| Pipeline entry date | System timestamp |
| Status | New / Contacted / Quoted / Renewed / Non-renewed / Lapsed |

---

## Component 2: Retention Scoring Model

Score each client 0–100 at renewal pipeline entry. Higher score = higher retention risk.

**Scoring factors:**

| Factor | Condition | Risk Points |
|--------|-----------|------------|
| Claims history — frequency | 0 claims in 3 years | 0 |
| Claims history — frequency | 1 claim in 3 years | +5 |
| Claims history — frequency | 2+ claims in 3 years | +15 |
| Claims history — severity | Claims totaling > $[X] | +10 |
| Payment record | No late payments in 12 months | 0 |
| Payment record | 1–2 late payments | +8 |
| Payment record | 3+ late payments or NSF | +20 |
| Coverage changes last term | No mid-term changes | 0 |
| Coverage changes last term | Reduced coverage | +10 |
| Coverage changes last term | Cancelled endorsement | +8 |
| Relationship tenure | 5+ years with agency | −15 (protective) |
| Relationship tenure | 3–5 years | −8 |
| Relationship tenure | 1–3 years | 0 |
| Relationship tenure | < 1 year (first renewal) | +10 |
| Competitor pricing indicator | Premium increase > 15% at renewal | +20 |
| Competitor pricing indicator | Premium increase 5–15% | +10 |
| Multi-policy household/account | 3+ policies | −10 |
| Multi-policy household/account | 2 policies | −5 |
| Agent relationship quality | Agent-rated relationship score (1–5, entered in AMS) | −[5−score] × 3 |

**Retention risk tiers:**

| Score | Tier | Designation | Handling |
|-------|------|-------------|---------|
| 0–25 | A | Low risk | Automated outreach sequence |
| 26–50 | B | Medium risk | Automated + agent phone call at 30 days |
| 51–75 | C | High risk | Agent personal outreach starting at 90 days |
| 76–100 | D | Critical risk | Senior agent / principal involvement from pipeline entry |

---

## Component 3: Outreach Sequence Design

Sequences are triggered automatically based on days-to-expiration and retention tier.

**Tier A — Low risk automated sequence:**

| Day | Trigger | Channel | Content |
|-----|---------|---------|---------|
| −90 | Auto | Email | Renewal notice: policy expiring [date], we're already working on your renewal, no action needed |
| −60 | Auto | Email | Quote ready: [Carrier] has offered renewal at $[premium]; or: here are your options with premium comparison |
| −30 | Auto | Email | Action requested: confirm renewal by [date] to avoid a lapse in coverage |
| −14 | Auto | Email | Reminder: renewal in 14 days; one-click confirm link |
| −7 | Auto | Email + SMS (if opted in) | Final reminder: your policy expires in 7 days |

**Tier B — Medium risk with agent touchpoint:**

| Day | Trigger | Channel | Content |
|-----|---------|---------|---------|
| −90 | Auto | Email | Renewal notice (same as Tier A) |
| −60 | Auto | Email | Quote ready |
| −30 | Agent task | Phone call required | Agent calls to review coverage and confirm renewal; document outcome in AMS |
| −30 | Auto (if no call logged) | Email | Backup if agent has not called |
| −14 | Auto | Email | Reminder |
| −7 | Auto | Email + SMS | Final reminder |

**Tier C — High risk proactive outreach:**

| Day | Trigger | Channel | Content |
|-----|---------|---------|---------|
| −90 | Agent task | Phone call required | Agent calls to establish contact, discuss any changes, explain renewal process |
| −90 | Auto (backup) | Email | Renewal notice if agent call not completed by day −85 |
| −60 | Auto | Email | Quote options with premium comparison; agent copies on all communications |
| −45 | Agent task | Phone call | Agent follows up on quote; addresses any concerns about premium increase |
| −30 | Auto | Email | Confirm renewal or request meeting |
| −14 | Agent task | Phone call | Final personal outreach |
| −7 | Auto | Email + SMS | Final reminder |

**Tier D — Critical risk escalation:**

| Day | Trigger | Channel | Content |
|-----|---------|---------|---------|
| −90 | Escalation alert | Task to principal/senior agent | Flag for immediate personal attention |
| −90 | Agent task | Phone call required | Senior agent / principal calls personally |
| −60 | Auto | Email | Quote with cover letter from principal |
| −60 | Agent task | Optional: in-person or video meeting | Review relationship, address concerns, negotiate if applicable |
| −45 | Agent task | Phone call | Follow-up on quote decision |
| −30 | Agent task | Phone call | Status check |
| −14 | Agent task | Phone call | Final outreach |
| −7 | Auto | Email + SMS | Final reminder |

---

## Component 4: Quote Generation

**Automatic re-marketing rules:**

| Condition | Action |
|-----------|--------|
| Carrier offering renewal (no non-renewal notice) + premium increase < 5% | Auto-generate renewal quote from current carrier; present to agent for review |
| Premium increase 5–15% | Trigger market comparison: current carrier + [N] alternative carriers |
| Premium increase > 15% | Trigger full market sweep: all appointed carriers for this LOB |
| Carrier issuing non-renewal | Trigger immediate full market sweep; notify agent and client |
| Client credit score dropped significantly (if available) | Flag for agent review before quoting; some carriers will increase or non-renew |

**Carrier selection logic:**

For market comparisons, submit to carriers in this priority order:
1. Carriers with active binding authority for this LOB and risk profile
2. Carriers with preferred appointments (higher commission or volume commitment)
3. All remaining appointed carriers
4. E&S markets (only if admitted market cannot accommodate the risk)

**Quote comparison delivery to agent:**

- Quote comparison table (carrier, premium, key coverage differences, AM Best rating)
- Recommended carrier (system recommendation based on premium and coverage quality score)
- Flag any coverage differences between current and proposed (always highlight if proposed offers less coverage)
- Agent reviews and selects; selection logged

---

## Component 5: Client Communication Templates

**Renewal notification email (Day −90, all tiers):**

> Subject: Your [LOB] policy renews [date] — we're already working on it
>
> Dear [Client First Name],
>
> Your [LOB] policy with [Carrier] (policy #[number]) renews on [date]. We wanted you to know early so you have plenty of time to review your coverage and options.
>
> Over the next few weeks, we'll:
> - Review your current coverage to make sure it still fits your needs
> - Check market pricing so you always know you're getting a competitive rate
> - Send you your renewal options with our recommendation
>
> You don't need to do anything right now. We'll reach out again around [60-day date] with your renewal options.
>
> If anything has changed this year — new vehicle, home renovation, business change, or new family members — please reply to this email or call us so we can make sure your coverage is up to date.
>
> [Agent Name] | [Agency Name] | [Phone] | [Email]

**Premium increase explanation (for increases > 10%):**

> Subject: Your renewal options — here's what changed and what we're doing about it
>
> Dear [Client First Name],
>
> Your policy is up for renewal on [date], and I want to be upfront with you: the renewal premium has increased this year.
>
> Here's the situation:
> - **Current premium:** $[current]
> - **[Carrier]'s renewal offer:** $[new premium] (+[X]%)
> - **Why:** [Carrier] has cited [rate increase reason — e.g., statewide rate filing, claims trend in your area, changes in your policy]
>
> I've already shopped your coverage with [N] other carriers. Here's what I found:
>
> | Carrier | Premium | Key Differences |
> |---------|---------|----------------|
> | [Carrier A] | $[premium] | [Same coverage / note differences] |
> | [Carrier B] | $[premium] | [Same coverage / note differences] |
>
> **My recommendation:** [Recommendation and brief rationale]
>
> I'll call you [date] to walk through the options together. If you'd like to talk sooner, my direct line is [phone].
>
> [Agent Name]

**Bind confirmation (sent immediately upon binding renewal):**

> Subject: Your [LOB] policy is renewed — here's your confirmation
>
> Dear [Client First Name],
>
> Your [LOB] policy is renewed and active. Here are your coverage details:
>
> | | |
> |--|--|
> | Policy number | [Number] |
> | Carrier | [Carrier] |
> | Coverage period | [Start date] – [End date] |
> | Annual premium | $[Amount] |
> | Payment plan | [Plan] |
>
> Your policy documents will be available within [N] business days. You can always access them through [portal link].
>
> [Agent Name]

---

## Component 6: Exception Handling

**Non-renewal by carrier:**

1. Non-renewal notice received from carrier → alert to agent (same day; do not wait for routine renewal pipeline)
2. Client notified immediately (do not wait for 60-day pipeline trigger)
3. Full market sweep triggered immediately
4. Agent personally calls client within 24 hours to explain and present options
5. Timeline compressed: quote → bind before non-renewal effective date

**Client non-response escalation:**

| Day | Action |
|-----|--------|
| −14: No response to any outreach | Agent task: final personal call attempt; document outcome |
| −7: Still no response | Certified mail / registered email with delivery confirmation: "Your policy expires in 7 days; contact us immediately to avoid a lapse" |
| Expiration: No bind | Policy lapses; client notified immediately of lapse consequences; re-application process explained |

**Mid-renewal scope changes:**

- Client requests coverage change during renewal process → endorsement workflow triggered; renewal quote updated if coverage change affects premium
- Client adds or removes a risk (vehicle, property location) → re-quote with updated information before binding

---

## Output Format

Deliver three artifacts:

1. **Renewal Workflow Specification** — Step-by-step process for each pipeline stage, exception cases, and system triggers

2. **Retention Scoring Model** — Scoring table with factor weights, tier thresholds, and update frequency

3. **Communication Template Library** — All email/SMS templates with variable placeholders identified and instructions for conditional logic (e.g., show premium increase table only if increase > 10%)
