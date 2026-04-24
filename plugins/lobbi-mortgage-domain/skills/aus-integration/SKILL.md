---
description: Design AUS (Automated Underwriting System) integration workflow specifications for DU, LP, and GUS. Use when integrating a mortgage LOS with Fannie Mae Desktop Underwriter, Freddie Mac Loan Product Advisor, or USDA GUS.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# AUS Integration Workflow Design

Design the integration workflow between a mortgage LOS and Automated Underwriting Systems (AUS): Fannie Mae Desktop Underwriter (DU), Freddie Mac Loan Product Advisor (LP), and USDA Guaranteed Underwriting System (GUS). Covers submission setup, findings interpretation, documentation requirements, and resubmission workflows.

## AUS System Overview

| AUS | Owner | Programs | Access Method |
|-----|-------|---------|--------------|
| Desktop Underwriter (DU) | Fannie Mae | Conventional Fannie, FHA, VA (via integration), USDA (via integration) | Fannie Mae Connect API + Selling & Servicing Guide |
| Loan Product Advisor (LP) | Freddie Mac | Conventional Freddie, FHA (via integration) | Freddie Mac API + Selling & Servicing Guide |
| GUS | USDA Rural Development | USDA Section 502 Guaranteed Rural Housing | GUS portal (direct entry or LOS integration) |

---

## Section 1: Connection Setup

**DU connection configuration:**

| Configuration Item | Required Value |
|--------------------|---------------|
| Fannie Mae Seller/Servicer ID | [Client's Seller/Servicer number] |
| DU API credentials | Obtained through Fannie Mae Connect; stored securely in LOS credential vault |
| Submission format | MISMO 3.4 XML (current standard) |
| Response format | DU findings XML + PDF findings report |
| Environment | Production (separate from test/sandbox) |
| Network access | Fannie Mae whitelists IP addresses — provide production IPs to Fannie Mae |

**LP connection configuration:**

| Configuration Item | Required Value |
|--------------------|---------------|
| Freddie Mac Seller/Servicer ID | [Client's Seller/Servicer number] |
| LP API credentials | Obtained through Freddie Mac Loan Advisor Suite portal |
| Submission format | MISMO XML or ULDD format |
| Response format | LP feedback certificate XML + PDF |
| Environment | Production |

**GUS connection configuration:**

| Configuration Item | Description |
|--------------------|-------------|
| USDA GUS access | GUS web portal or LOS-GUS integration (not all LOS have native GUS API) |
| USDA Business Partner ID | Client's USDA lender ID |
| If LOS integration not available | Manual GUS submission with copy of findings stored in LOS document management |

**Credential management:**
- AUS credentials stored in LOS encrypted credential vault (never in plain text config files)
- Credentials rotated per AUS provider policy (typically annually)
- Separate sandbox/test credentials for pre-production testing
- Service account credentials (not tied to individual employee)

---

## Section 2: Submission Workflow

**When to submit to AUS:**

| Event | Action |
|-------|--------|
| Borrower has expressed intent to proceed and application is complete | Initial AUS submission |
| Any of the following data changes | Resubmission required (see Section 4) |
| Final submission before underwriting | Submit current AUS run; findings in file |

**Loan setup before AUS submission:**

1. Confirm loan program (Conventional Fannie / Conventional Freddie / FHA / VA / USDA / other)
2. Map program to AUS: Conventional → DU or LP (client's choice or program eligibility); FHA → DU or LP (FHA accepts both); USDA → GUS; VA → DU (VA-approved lender with DU access)
3. Confirm all 1003 data is complete in LOS — AUS submission pulls from 1003 data
4. If both DU and LP are being run: submit to both; use more favorable findings

**LOS-to-AUS data mapping:**

The LOS MISMO XML export must correctly map 1003 data to AUS fields. Critical mappings to validate:

| 1003 Field | AUS Field | Common Mapping Error |
|-----------|-----------|---------------------|
| Borrower SSN | BorrowerSSN | Dashes stripped correctly |
| Property address (all components) | PropertyStreetAddress, City, State, ZIP | ZIP+4 if required |
| Loan amount | BaseLoanAmount | Must match LE; not purchase price |
| Property value / sales price | PropertyEstimatedValue (lower of appraised or sales) | Using purchase price before appraisal |
| Monthly income — all types | MonthlyIncome by income type | Bonus/overtime — 24-month average required |
| Monthly obligations | MonthlyLiability — each installment/revolving debt | Missing liabilities from credit report |
| Housing expense | HousingExpense (PI + taxes + insurance + HOA) | Escrow estimate must be included |
| Loan purpose | LoanPurposetype | Cash-out vs. rate-term distinction |
| Occupancy | PropertyUsageType | Investment property inputs differently |

---

## Section 3: Findings Interpretation

### 3a: DU Findings

**DU recommendation types:**

| DU Recommendation | Meaning | Workflow |
|------------------|---------|---------|
| Approve/Eligible | Loan meets Fannie Mae guidelines; DU has determined it is eligible for delivery | Proceed to processing using DU findings documentation requirements |
| Approve/Ineligible | DU approves the risk but loan is ineligible for delivery to Fannie for some reason (e.g., loan limit exceeded, property type) | Cannot deliver to Fannie; explore other options (Freddie, portfolio) |
| Refer | DU cannot approve; manual underwriting may be performed per Fannie guidelines | Manual UW required; more conservative documentation standards |
| Refer with Caution | DU has identified elevated risk factors; manual UW very unlikely to approve | Explore alternative programs or restructure |
| Out of Scope | Loan type not supported by DU (e.g., construction, reverse, HELOC) | Use appropriate AUS for loan type |

**DU Approve/Eligible documentation requirements (Documentation Type matrix):**

| Asset/Liability | DU Documentation Level | What to Collect |
|----------------|------------------------|----------------|
| Salaried income (stable employment 2 years) | Full documentation | 30-day pay stubs + W-2s (2 years) |
| W-2 only | W-2 waiver (DU may waive returns for W-2 employees) | Verify DU findings message for waiver |
| Self-employed | Full documentation — always | 2 years tax returns (personal + business) + YTD P&L |
| Bank accounts | Standard (2 months statements) | Most loans: 2 months most recent statements |
| Retirement accounts | If needed for reserves | 2 months or quarterly statement |
| Gift funds | Gift letter + donor bank statement | DU findings will specify if gift is acceptable |

**Reading DU findings for required verifications:**

The DU findings report lists specific verifications required. These override general Selling Guide requirements. Process:
1. Print or save DU findings report to loan file immediately upon receipt
2. Processor creates conditions checklist based on DU-listed verifications (not generic checklist)
3. If DU says "No income documentation required" — document this finding; do not require documentation anyway
4. If DU requires a verification not expected — research Selling Guide for explanation; do not override DU

### 3b: LP Findings

**LP feedback certificate types:**

| LP Recommendation | Meaning | Workflow |
|------------------|---------|---------|
| Accept | LP recommends the loan for purchase; reduced documentation applies | Use LP-specified documentation requirements |
| Caution | LP is unable to recommend; elevated risk; manual UW may be considered | LP Seller/Servicer Guide manual UW criteria apply |

**LP Accept documentation requirements:**

Similar to DU but with Freddie Mac-specific variations. Key differences from DU:
- LP uses the term "feedback certificate" for findings
- LP "ACE" (Automated Collateral Evaluation): if LP issues ACE, appraisal may be waived — verify in feedback certificate before ordering appraisal
- LP "LPA" verification messages differ in wording from DU — use Freddie Seller/Servicer Guide as reference
- For FHA loans run through LP: LP findings are for risk only; FHA program guidelines still apply for eligibility

**LP Accept — property eligibility notes:**

LP feedback certificate identifies property eligibility (e.g., condo project approval status, manufactured housing eligibility). If LP flags a property eligibility condition, resolve before submission to UW.

### 3c: GUS Findings (USDA)

**GUS recommendation types:**

| GUS Recommendation | Meaning | Workflow |
|-------------------|---------|---------|
| Accept | USDA accepts the loan; proceed with standard USDA documentation | Standard USDA processing |
| Refer | Manual underwriting by USDA-approved lender required | Follow USDA HB-1-3555 manual UW guidelines |
| Refer with Caution | Significant risk factors; manual UW unlikely to succeed | Discuss with USDA underwriter; restructure or explore other programs |

**USDA-specific eligibility requirements (GUS will flag these):**

- [ ] Property is in an eligible rural area (USDA Rural Development map — verify address before application)
- [ ] Borrower income does not exceed USDA income limits for the area (adjusted for household size and county)
- [ ] Guarantee fee calculated correctly (upfront guarantee fee: 1% of loan amount; annual fee: 0.35% of remaining principal)
- [ ] Conditional commitment from USDA obtained before closing

**GUS conditional commitment workflow:**

1. GUS Accept received
2. Loan packaged per USDA requirements and submitted to USDA Rural Development (state office or national processing center, depending on state)
3. USDA issues Conditional Commitment (Form RD 1980-18)
4. Conditional commitment received and stored in file
5. Any conditions on commitment cleared before closing
6. Final loan closing package submitted to USDA post-closing for issuance of Form 1980-17 (Loan Note Guarantee)

---

## Section 4: Resubmission Triggers

Any of the following changes requires AUS resubmission before final underwriting approval:

| Change | Resubmission Required |
|--------|----------------------|
| Loan amount change | Yes |
| Property address change | Yes |
| Borrower added or removed | Yes |
| Income change (new employer, loss of employment, change in income amount) | Yes |
| New liability added or removed | Yes |
| Credit score change (new credit report pulled) | Yes — if new score materially different |
| Occupancy change | Yes |
| Property type change | Yes |
| Loan program change | Yes — new AUS appropriate for new program |
| Rate lock (if rate affects fees run through AUS) | May require resubmission if DTI changes |
| 120 days elapsed since prior AUS run | Resubmission strongly recommended; some investors require it |

**Resubmission workflow:**
1. Update LOS with corrected data
2. Run new AUS submission
3. Store new findings in loan file; note date and reason for resubmission
4. If DU recommendation improved: use new findings as basis for documentation
5. If DU recommendation worsened: discuss with UW before proceeding; may need to restructure or switch programs

---

## Output Format

Deliver two artifacts:

1. **AUS Submission Workflow** — Step-by-step process for initial submission, findings interpretation decision tree, and resubmission workflow for DU, LP, and GUS

2. **Findings Interpretation Guide** — Reference document for processors and underwriters covering all recommendation types, documentation requirements by DU/LP recommendation, GUS-specific eligibility requirements, and common AUS error resolutions
