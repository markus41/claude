# TAIA FMO Sale Preparation Sprint

> **Workflow:** tvs-microsoft-deploy / taia-sale-prep
> **Duration:** 3-4 weeks (target completion: 4 weeks before June 2026 close)
> **Owner:** Markus (#10, Global Admin)
> **Hard deadline:** FMO sale closing June 2026
> **Depends on:** week1-critical-path.md (all steps must be complete)

---


## Operational Runbook Additions

- Run `/tvs:taia-readiness` before any buyer-facing checkpoint publication.
- Use `workflows/taia-day0-day30.md` as the transition execution plan after close.
- Enforce `hooks/taia-winddown-guard.sh` for destructive command safety in TAIA tenant context.

---

## Dependency Graph

```
week1-critical-path.md (ALL) ──┐
                                │
[1] Carrier normalization ──────┤
         │                      │
         ├── blocks [3] Buyer report (carrier portfolio data)
         └── blocks [4] A3 decommission gate (data completeness)
                                │
[2] Michelle Office Scripts ────┤
         │                      │
         ├── blocks [3] Buyer report (commission volume figures)
         └── blocks [5] Data room (reconciled financials)
                                │
[3] Power BI buyer report ──────┤
         │                      │
         ├── blocks [5] Data room (report included in package)
         └── informs [4] A3 decommission gate (buyer value prop)
                                │
[4] A3 decommission gate ───────┤
         │                      │
         ├── if SELL: [5] Data room includes A3 access docs
         └── if DECOMMISSION: separate archive workflow
                                │
[5] Data room preparation ──────┤
         │                      │
         └── blocks buyer due diligence start
                                │
[6] Post-sale TVS contract ─────┘
         │
         └── independent, drafted in parallel, finalized after sale
```

---

## Step 1: Carrier Normalization Sprint Completion

**Command:** `/tvs:normalize-carriers`
**Agent:** platform-agent (FORGE)
**Duration estimate:** 5-8 business days (started in Week 1, completes here)
**Depends on:** week1-critical-path.md Step 1 (A3 extract) and Step 6 (sprint start)

### Context
Carrier normalization began during Week 1. This step completes the sprint by resolving
the manual review queue and producing the final canonical carrier dataset that feeds the
buyer report and data room.

### Execution Sequence
1. **Resolve manual review queue** (target: under 50 records from Week 1):
   - Markus or TAIA ops team resolves ambiguous carrier matches
   - Decision log captured in `carrier-normalization-decisions.json`
2. **Final canonical carrier table**:
   - All carriers mapped to canonical IDs
   - Commission records fully cross-referenced
   - Product lines categorized: Life, Health, P&C, Annuity, Medicare Supplement
3. **Carrier portfolio summary**:
   - Total unique carriers (target: 80-200 depending on FMO size)
   - Active vs. inactive split
   - Commission volume per carrier (trailing 12 months)
   - Top 10 carriers by commission volume
4. **Export for downstream**:
   - `canonical-carriers.csv` for Power BI
   - `carrier-commission-map.json` for data room
   - `normalization-audit-trail.json` for due diligence

### Success Criteria
- 100% of carrier records mapped to canonical IDs
- Commission-to-carrier coverage at 99%+
- Manual review queue fully resolved (0 remaining)
- Carrier portfolio summary reviewed and approved by Markus

### Rollback Plan
- Source data in Blob Storage is immutable; re-run normalization if logic changes
- Manual decisions logged and reversible

---

## Step 2: Michelle Office Scripts for Commission Reconciliation

**Duration estimate:** 3-5 business days
**Depends on:** Step 1 (normalized carrier data)

### Context
Michelle handles commission reconciliation using Office 365 tools. These scripts automate
the comparison of A3 commission records against carrier statements to produce reconciled
figures for the buyer report.

### Execution Sequence
1. **Excel Power Query scripts**:
   - Load `canonical-carriers.csv` into Excel data model
   - Load A3 `commissions.ndjson` (converted to CSV) as second source
   - Match commission records to carrier statements by carrier ID + period
   - Flag discrepancies exceeding $50 or 2% variance
2. **Reconciliation workflow**:
   - Auto-match: commissions within tolerance (<2% and <$50)
   - Manual review: discrepancies flagged for Michelle
   - Write-off: immaterial differences documented
3. **Output deliverables**:
   - `commission-reconciliation-summary.xlsx` -- aggregate by carrier, by month
   - `commission-discrepancy-log.xlsx` -- all flagged items with resolution
   - `trailing-12m-commission-total.xlsx` -- buyer headline number
4. **Power Automate flow** (optional):
   - Notify Markus when reconciliation completes
   - Upload final files to SharePoint `TAIA-Sale-Prep` document library

### Success Criteria
- Reconciliation covers trailing 24 months of commission data
- Discrepancy rate below 3% of total commission volume
- All flagged discrepancies resolved or documented as write-offs
- Trailing 12-month total matches within 1% of A3 aggregate

### Rollback Plan
- Power Query scripts are non-destructive; source data unchanged
- If reconciliation logic is wrong: fix query, re-run against same source

---

## Step 3: Power BI Buyer Report

**Duration estimate:** 3-5 business days
**Depends on:** Step 1 (carrier portfolio) + Step 2 (commission volumes)

### Context
The buyer report is the primary sales document for the TAIA FMO. It presents carrier
portfolio, commission volume trends, agent count, and operational metrics in a format
buyers expect during FMO acquisitions.

### Execution Sequence
1. **Semantic model** (Power BI Desktop):
   - Import canonical carrier table
   - Import reconciled commission data
   - Import broker count from A3 `brokers` extract
   - Build star schema: Fact_Commissions, Dim_Carrier, Dim_Broker, Dim_Time
2. **Report pages**:
   - **Executive Summary**: Total commission volume (T12M), carrier count, agent count, YoY trend
   - **Carrier Portfolio**: Top carriers by volume, product line mix, carrier concentration risk
   - **Commission Trends**: Monthly/quarterly trends, seasonal patterns, growth rate
   - **Agent Analysis**: Active agent count, production per agent, retention rate
   - **Operational Metrics**: Average processing time, error rate, automation level
3. **Publish to Power BI Service**:
   - Workspace: `TAIA-Sale-Analytics`
   - Row-level security: Markus-only access until buyer NDA signed
   - Schedule refresh: daily during sale prep period
4. **Export static PDF** for data room inclusion

### Success Criteria
- Report covers all 5 required pages with accurate data
- Commission totals match Michelle reconciliation within $100
- Agent count matches A3 broker extract document count
- Report published and accessible in Power BI Service
- PDF export included in data room package

### Rollback Plan
- Report is read-only visualization; no source data modification
- If data errors found: refresh semantic model after fixing source
- PDF can be regenerated at any time from Power BI

---

## Step 4: A3 Decommission Decision Gate

**Duration estimate:** 1 business day (decision meeting)
**Depends on:** Step 1 (carrier data complete) + Step 3 (buyer report informs decision)

### Context
The A3 Firebase platform is either sold as part of the TAIA FMO (value-add for buyer)
or decommissioned with data archived to Fabric. This is a Markus decision captured as a
Jira issue.

### Decision Framework

| Factor | Sell with TAIA | Decommission |
|--------|---------------|--------------|
| Buyer wants A3 access | Yes -- include in sale | No -- archive only |
| A3 has ongoing operational value | Increases sale price | Firebase costs saved |
| Data migration complete to Fabric | Not required pre-sale | Required before shutdown |
| Technical debt / maintenance burden | Buyer assumes liability | Rosa avoids future cost |
| Timeline risk | No migration needed | Must archive before close |

### Execution Sequence
1. **Schedule decision meeting**: Markus + any sale advisors
2. **Present decision matrix** with buyer report data
3. **Record decision** in Jira issue `TAIA-XXX`:
   - Decision: SELL or DECOMMISSION
   - Rationale documented
   - Downstream impact acknowledged
4. **If SELL**:
   - Include A3 admin credentials transfer in sale agreement
   - Document Firebase project handover procedure
   - Add A3 access documentation to data room
5. **If DECOMMISSION**:
   - Trigger `a3_archive_validate` Fabric notebook (see full-platform.md)
   - Set Firebase project deletion date for 30 days post-close
   - Export all data to Fabric lakehouse as permanent archive

### Success Criteria
- Decision documented in Jira with rationale
- Downstream workflow updated based on decision
- Stakeholders notified of decision and impact
- No ambiguity: SELL or DECOMMISSION, not "decide later"

### Rollback Plan
- Decision can be reversed up until sale agreement is signed
- If SELL decision reversed to DECOMMISSION: trigger archive workflow immediately
- If DECOMMISSION reversed to SELL: re-enable Firebase access, update data room

---

## Step 5: Data Room Preparation

**Duration estimate:** 3-5 business days
**Depends on:** Steps 1-4 (all preceding steps feed into data room)

### Context
The data room is a secure SharePoint site containing all due diligence materials for the
TAIA FMO buyer. It must be sanitized (no PII leakage beyond what buyer needs) and
professionally organized.

### Execution Sequence
1. **Create SharePoint site**: `TAIA-DataRoom` with restricted access
2. **Folder structure**:
   ```
   TAIA-DataRoom/
     01-Executive-Summary/
       buyer-report.pdf (from Step 3)
       company-overview.docx
     02-Financial/
       commission-reconciliation-summary.xlsx (from Step 2)
       trailing-12m-commission-total.xlsx
       revenue-projections.xlsx
     03-Carrier-Portfolio/
       canonical-carriers.csv (from Step 1)
       carrier-contracts/ (scanned PDFs if available)
       product-line-summary.xlsx
     04-Agent-Roster/
       agent-list-sanitized.csv (names, states, production tiers -- no SSN/DOB)
       agent-retention-analysis.xlsx
     05-Technology/
       a3-platform-overview.docx (if selling with A3)
       data-architecture-diagram.pdf
       api-documentation/ (if applicable)
     06-Legal/
       corporate-structure.pdf
       material-contracts-list.xlsx
       compliance-certifications/
     07-Operations/
       operational-procedures.docx
       staffing-overview.xlsx
       vendor-list.xlsx
   ```
3. **Sanitization review**:
   - Remove all SSN, DOB, bank account numbers from agent data
   - Replace broker PII with anonymized IDs where possible
   - Legal review of all documents before buyer access
4. **Access controls**:
   - Markus: Full control
   - Buyer (post-NDA): Read-only, no download (initially)
   - Download enabled after LOI signed
5. **Watermarking**: Apply dynamic watermark to all PDF exports

### Success Criteria
- All 7 folders populated with complete, sanitized documents
- No PII leakage in sanitized exports (spot-check 10% of records)
- SharePoint access controls verified by identity-agent (SHIELD)
- Buyer NDA template ready for execution
- Markus sign-off on data room completeness

### Rollback Plan
- Data room is a copy of source data; no source modification
- If PII found post-publication: immediately revoke buyer access, sanitize, re-publish
- SharePoint versioning allows rollback to previous document versions

---

## Step 6: Post-Sale TVS Service Contract Structure

**Duration estimate:** Ongoing (drafted in parallel, finalized after sale)
**Depends on:** No strict technical dependency; business dependency on sale terms

### Context
After TAIA FMO sale, TVS may provide transitional services to the buyer (broker support,
commission processing, technology handover). This contract defines scope, duration, and
pricing.

### Execution Sequence
1. **Draft service catalog**:
   - Commission processing support (3-6 month transition)
   - Broker communication relay (until buyer establishes own channels)
   - A3 platform support (if sold with TAIA)
   - Data migration assistance (if buyer wants to move off A3)
2. **Pricing model** (based on TVS Stripe tiers):
   - Basic support: $640/month (40 hours) -- commission processing only
   - Standard support: $1,200/month (80 hours) -- commission + broker support
   - Full transition: Custom quote -- includes technology handover
3. **Contract terms**:
   - Duration: 3-month minimum, 12-month maximum
   - 30-day termination notice
   - SLA: 48-hour response time, 5 business day resolution
4. **Internal cost analysis**:
   - VA time allocation from existing Philippines team
   - Markus oversight: 2-4 hours/week during transition
   - Target margin: 40%+ on service contract revenue
5. **Template preparation**: Standard MSA + SOW template in SharePoint

### Success Criteria
- Service catalog with 3 tiers drafted and priced
- Internal cost model showing positive margin on all tiers
- MSA + SOW templates reviewed by legal counsel
- Contract ready for negotiation within 48 hours of sale agreement

### Rollback Plan
- Contract is pre-sale preparation; no technical rollback needed
- If sale falls through: archive templates for future use
- If terms change: revise SOW while keeping MSA framework

---

## Overall TAIA Sale Readiness Checklist

All items must be green before entering buyer due diligence:

- [ ] Carrier data 100% normalized and reconciled
- [ ] Commission figures independently validated
- [ ] Power BI buyer report published and reviewed
- [ ] A3 decision (SELL/DECOMMISSION) recorded in Jira
- [ ] Data room populated, sanitized, and access-controlled
- [ ] Post-sale service contract templates drafted
- [ ] Legal counsel review complete on all data room materials
- [ ] Markus final sign-off on sale readiness

## Timeline Summary

| Week | Focus | Key Deliverables |
|------|-------|-----------------|
| 1 | Steps 1-2 | Carrier normalization done, reconciliation running |
| 2 | Steps 2-3 | Reconciliation complete, buyer report in progress |
| 3 | Steps 3-5 | Buyer report published, A3 decision made, data room build |
| 4 | Steps 5-6 | Data room complete, service contract drafted, final review |

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Carrier data quality worse than expected | High | Medium | Extra 3-day buffer for manual cleanup |
| Commission discrepancies exceed 5% | High | Low | Escalate to TAIA ops team for source correction |
| A3 decision delayed | Medium | Medium | Default to DECOMMISSION if no decision by Week 3 |
| Buyer NDA delayed | Medium | Low | Prepare data room regardless; gate access at publish |
| Legal review backlog | Medium | Medium | Engage counsel in Week 1, not Week 3 |
