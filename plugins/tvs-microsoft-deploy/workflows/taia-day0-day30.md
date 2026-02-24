# TAIA Day 0 - Day 30 Transition Plan

> **Scope:** Immediate post-close stabilization for TAIA FMO sale
> **Window:** Day 0 through Day 30

## Objectives

- Protect buyer continuity while reducing TAIA operational risk.
- Preserve evidentiary logs and financial reconciliation artifacts.
- Execute controlled offboarding of TAIA-owned identity/assets.

## Milestones

### Day 0-2: Control & Communications
- Freeze non-approved production changes in TAIA tenant.
- Confirm buyer and transition contacts.
- Publish incident escalation matrix and on-call coverage.

### Day 3-7: Data & Access Hardening
- Verify data-room access review + least privilege.
- Export remaining mailbox/legal hold artifacts.
- Revalidate archive integrity for A3 data and carrier outputs.

### Day 8-14: Service Rationalization
- Disable unused automations and scheduled jobs.
- Reduce paid licenses to transition baseline.
- Confirm all critical scripts run from TVS-owned credentials.

### Day 15-21: Knowledge Transfer
- Deliver runbooks (identity, data, communications).
- Walk through known issues, exceptions, and breakglass paths.
- Get buyer acknowledgement on pending risk items.

### Day 22-30: Exit Readiness Gate
- Complete final readiness run (`/tvs:taia-readiness --strict`).
- Produce closeout packet and sign-off log.
- Execute decommission actions that were deferred until acceptance.

## Exit Criteria

- No unresolved P1/P2 items tied to TAIA transition.
- Buyer confirms receipt of data room package and runbooks.
- TAIA decommission queue approved and time-boxed.
