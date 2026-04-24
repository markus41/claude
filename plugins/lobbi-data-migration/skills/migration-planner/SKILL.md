---
description: Build a phased data migration plan with cutover strategy, risk register, and go/no-go criteria for system transition engagements.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Migration Planner

Produce a complete data migration plan. This is the governing document for the migration engagement. It covers strategy selection, phase design, cutover planning, risk management, and go/no-go decision criteria. The output must be sufficient for a project sponsor to approve and a technical team to execute.

## Migration Strategy Selection

Choose one of two strategies based on the factors below:

### Big Bang Migration

All data migrated in a single cutover window. Old system decommissioned immediately.

**Use when**:
- Data volume is small enough to complete within the cutover window (typically < 4 hours of business downtime)
- Systems cannot run in parallel (licensing, data integrity, technical constraints)
- Business has tolerance for a planned maintenance window
- Data model is simple and migration is low-risk

**Risks**: If anything goes wrong during the window, rollback is the only option.

### Phased Migration

Data migrated in multiple phases. Both systems run in parallel during the transition.

**Use when**:
- Data volume is too large for a single cutover window
- Business cannot accept extended downtime
- Migration has high complexity (multiple entity types with complex dependencies)
- Stakeholder confidence is best built by migrating lower-risk data first

**Risks**: Dual-system operation increases cost and complexity. Data must be kept synchronized during the parallel period.

**Decision for this engagement**:

| Factor | Assessment | Points Toward |
|--------|-----------|--------------|
| Total data volume | [Volume] | Big Bang / Phased |
| Cutover window available | [Hours available] | |
| Business continuity requirement | [Can/cannot tolerate downtime] | |
| System parallel operation possible | Yes / No | |
| Migration complexity | Simple / Medium / Complex | |

**Selected strategy**: [Big Bang / Phased] — [One paragraph rationale]

## Phased Migration Design

(Complete this section only if phased migration is selected)

**Phase definition principles**:
1. Migrate reference data first (agents, products, coverage types, lookup tables)
2. Migrate master data second (clients, accounts)
3. Migrate transactional data third (policies, loans, claims) in dependency order
4. Migrate attachments and documents last (largest volume, least time-sensitive)

**Phase plan**:

| Phase | Name | Entities | Record Count | Est. Duration | Go-Live Date | Success Criteria |
|-------|------|---------|-------------|--------------|-------------|-----------------|
| 0 | Reference Data | Agents, Products, Coverage Types, State Codes | ~500 records | 2 hours | [Date] | All reference records verified in destination |
| 1 | Master Data | Clients, Contacts | 12,450 | 4 hours | [Date] | 99.9% records migrated; reconciliation passed |
| 2 | Policies (Active) | Active policies only | 28,450 | 8 hours | [Date] | All active policies visible in new system; agents can work |
| 3 | Policies (Historical) | Cancelled, Expired policies | 9,750 | 4 hours | [Date] | Historical data available for lookup |
| 4 | Claims and Activities | Claims, Notes, Activities | 4,100 | 3 hours | [Date] | All open claims visible; closed claims accessible |
| 5 | Attachments | Document files | 28,000 files | 2 days | [Date] | All documents accessible via new system |

**Verification gate between phases**: After each phase completes, a defined reconciliation check must pass before the next phase begins. If the gate fails, pause and investigate before proceeding. Document the verification queries and acceptance criteria for each gate.

**Dual-write period**: During phases 2-4, new records created in the old system must also be captured and migrated to the new system. Specify:
- Delta capture mechanism: Change Data Capture (CDC) on source tables, or scheduled sync of modified_at timestamp
- Delta sync frequency: Every 4 hours during business hours
- Delta sync cutoff: T-24 hours before final cutover (last delta before final cutover)
- Final delta: Captured within the cutover window (old system in read-only mode)

## Cutover Planning

### Cutover Window Calculation

Estimate the cutover window duration:

| Task | Duration |
|------|----------|
| Freeze source system (read-only mode) | 5 minutes |
| Final delta capture (records modified since last sync) | ~30 minutes (estimate) |
| Final delta load | ~15 minutes |
| Post-migration validation (automated reconciliation) | ~60 minutes |
| Business validation (key workflow smoke tests) | ~60 minutes |
| Go/no-go decision point | 15 minutes |
| User access switched to new system | 15 minutes |
| Rollback window (if go-live does not proceed) | ~120 minutes |
| Total cutover window | ~5-6 hours |

**Cutover timing**: Schedule the cutover window outside business hours. For insurance agencies: Friday evening or Saturday morning. For mortgage operations: avoid month-end (25th-5th of following month).

**Cutover calendar**:
- T-30 days: Complete final pre-migration dry run in test environment
- T-14 days: Confirm all data cleansing complete; final test migration
- T-7 days: Send user communication about cutover date and time
- T-3 days: Confirm rollback tested; confirm support team on standby
- T-1 day: Business owner sign-off on readiness; IT sign-off on environment
- T-0 (cutover day): Execute cutover runbook

### Cutover Runbook

Numbered steps for the cutover execution team:

1. Send "cutover starting" notification to all staff (email + Teams)
2. Disable new record creation in source system (set to read-only or take offline)
3. Record source record counts: `SELECT COUNT(*) FROM [each entity]` — save to cutover log
4. Run final delta capture (modified_at > last sync timestamp)
5. Load final delta to destination
6. Run automated reconciliation: compare source counts to destination counts per entity
7. Run business validation scenarios (see go/no-go criteria)
8. Go/no-go decision meeting (15 minutes) — see criteria below
9. If GO: Update DNS / URL configuration to point to new system; send go-live notification
10. If NO-GO: Execute rollback procedure (see rollback-coordinator skill)

### Dual-System Operation

During the parallel period (if phased), define which system is the system of record for each entity:

| Entity | System of Record | Read From | Notes |
|--------|-----------------|-----------|-------|
| Agents | New system (after Phase 0) | New system | |
| Clients | Old system (until Phase 1 complete) | Old system | Sync to new system every 4 hours |
| Active Policies | Old system (until Phase 2 complete) | Old system | |
| New Policies written after Phase 2 | New system | New system | New business written in new system after Phase 2 |

Staff must know which system to use for which task during each phase. Provide a one-page reference card.

## Risk Register

| # | Risk | Probability | Impact | Risk Score | Mitigation | Owner | Contingency |
|---|------|-------------|--------|-----------|------------|-------|-------------|
| R-01 | Migration takes longer than cutover window | Medium | High | High | Dry run proves performance; have cloud scale-up ready | IT Lead | Execute rollback; reschedule cutover |
| R-02 | Data quality issues discovered during cutover | Low | High | Medium | Data profiling and dry run catch issues in advance | Data Lead | Rollback; fix data; reschedule |
| R-03 | Key business workflow fails in new system | Medium | High | High | UAT period includes all critical workflows | PM | Rollback; engage vendor support |
| R-04 | Delta capture misses records during parallel period | Low | High | Medium | Verify CDC configuration; monitor delta counts | IT Lead | Manual reconciliation; identify gaps |
| R-05 | Rollback fails (destination data corrupts source) | Very Low | Critical | High | Rollback tested in dry run; source system in read-only during cutover | IT Lead | Restore source from backup taken at T-0 |
| R-06 | Staff resistance to new system | Medium | Medium | Medium | Training completed before cutover; super-users identified | PM / Business | Extended parallel period; additional training |
| R-07 | Vendor support unavailable during cutover window | Low | High | Medium | Confirm vendor on-call support for cutover window | PM | Emergency escalation contact confirmed |

## Go/No-Go Criteria Checklist

The go/no-go decision is made at Step 8 of the cutover runbook. All of the following must be met to proceed:

**Automated validation** (must pass 100%):
- [ ] Record count reconciliation: destination count = source count ± 0.01% for each entity
- [ ] Financial reconciliation: sum of PremiumAmount in destination = sum in source ± $0.01
- [ ] Zero critical errors in migration job log
- [ ] Referential integrity check: zero orphaned records in destination
- [ ] RLS / permissions check: test user can access only their authorized data

**Performance validation**:
- [ ] New system page load time < 3 seconds for key screens
- [ ] Report query completes in < 30 seconds for standard reports with full data volume

**Business validation** (business owner confirms):
- [ ] Look up 5 specific client records by name — all found with correct data
- [ ] Look up 5 specific policy records by policy number — all found with correct premium
- [ ] Run standard production report — data matches source system report
- [ ] Create a new test record — saves successfully
- [ ] Retrieve a document attachment — opens correctly

**Organizational readiness**:
- [ ] All staff training completed (training completion rate > 95%)
- [ ] Super-users briefed and available for cutover day
- [ ] IT support team on standby for 48 hours post-cutover
- [ ] Vendor support confirmed on call

**Rollback readiness**:
- [ ] Source system backup confirmed and restorable (tested T-3 days)
- [ ] Rollback procedure rehearsed and documented
- [ ] Rollback decision authority confirmed (who can call rollback and when)

**Rollback point of no return**: Rollback is feasible until T+4 hours after user access is switched to the new system. After T+4 hours, new records created in the destination make rollback impractical. The go/no-go meeting must surface any critical issues before this window closes.

## Output Format

Deliver as:

1. Migration strategy decision with rationale
2. Phase plan table (if phased) with entity list, record counts, durations, and success criteria
3. Delta sync specification (mechanism, frequency, cutoff)
4. Cutover window calculation table
5. Cutover runbook (numbered steps)
6. Dual-system operation reference (which system for which task, per phase)
7. Risk register (full table with all fields)
8. Go/no-go criteria checklist (formatted as a checklist with sign-off lines)
9. Project timeline (phases → testing → training → dry run → cutover)
10. Communication plan (who is notified, when, with what message, for each major milestone)
