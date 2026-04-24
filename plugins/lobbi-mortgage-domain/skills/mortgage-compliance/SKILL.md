---
description: Validate mortgage workflows against RESPA, TRID, HMDA, QM/ATR, ECOA, and FCRA requirements. Use when designing a new mortgage workflow for compliance review or auditing an existing process for regulatory gaps.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Federal Mortgage Compliance Checklist

Validate a mortgage workflow or operation against the major federal consumer mortgage regulations. For each regulation, the checklist identifies specific operational requirements, documentation standards, and common failure points.

---

## Section 1: RESPA (Real Estate Settlement Procedures Act)

**Regulation:** 12 CFR Part 1024 (Regulation X) — administered by CFPB

**Applicability:** Federally related mortgage loans — virtually all 1-4 family residential mortgage loans made by federally insured lenders or loans intended for sale to Fannie/Freddie

### Section 8 — Kickback/Fee-Splitting Prohibition

- [ ] No referral fees paid to any person for referring settlement service business
- [ ] No fee splitting where no services are actually performed (e.g., "desk fees," "access fees")
- [ ] AfBA (Affiliated Business Arrangement) disclosure provided when referring borrowers to an affiliated settlement service provider (title company under common ownership, etc.)
- [ ] AfBA disclosure is provided at or before time of referral (not at closing)
- [ ] AfBA disclosure meets required format: describes the arrangement, states the estimated charge, states borrower is not required to use the affiliated provider (with narrow exceptions)
- [ ] Marketing services agreements (MSA) reviewed by legal counsel: many are viewed as unlawful kickback arrangements by CFPB

**Common Section 8 violations to flag in workflow review:**
- Real estate agents receiving "marketing fees" from title companies, lenders, or other settlement service providers in exchange for referrals
- Builder or developer requiring use of affiliated settlement service providers as condition of purchase

### Section 9 — Seller-Required Title Insurance

- [ ] Seller is not requiring buyer to purchase title insurance from a specific company as a condition of the sale
- [ ] Buyer is free to shop for title insurance and settlement services

### Section 10 — Escrow Account Requirements

- [ ] Initial escrow deposit at closing does not exceed 2 months of escrow payments for any category
- [ ] Annual escrow analysis performed
- [ ] Annual escrow account statement provided to borrower within 30 days of analysis
- [ ] Escrow surplus refunded or credited if balance exceeds 2 months cushion
- [ ] Escrow shortage paid in 12-month catch-up if balance is deficient

**Citation:** 12 CFR 1024.17

### Servicing Transfer Notice

- [ ] Borrower notified of transfer of servicing at least 15 days before effective date (exception: RESPA allows 3 days for FHA)
- [ ] Notice includes: new servicer name, address, phone; effective date; statement that transfer does not affect loan terms; 60-day grace period for payments to wrong servicer

---

## Section 2: TRID (TILA-RESPA Integrated Disclosure)

**Regulation:** 12 CFR 1026.37-38 (Regulation Z) and 12 CFR 1024 (Regulation X) — CFPB

See the `disclosure-generator` skill for complete TRID workflow specification. Summary checklist:

- [ ] Loan Estimate issued within 3 business days of receiving 6-piece application
- [ ] No fees collected before LE issuance except bona fide credit report fee
- [ ] Zero-tolerance fees on LE do not increase on CD (unless valid changed circumstance)
- [ ] 10% tolerance bucket not exceeded in aggregate on CD vs. LE
- [ ] Changed circumstances documented within 3 business days of discovery; revised LE issued within 3 business days
- [ ] CD received by borrower at least 3 business days before consummation
- [ ] Any re-disclosure triggers (APR change, product change, prepayment penalty addition) result in new 3-business-day wait
- [ ] Tolerance cures paid within required timeframe if violations identified
- [ ] LE retained 3 years; CD retained 5 years post-consummation

---

## Section 3: HMDA (Home Mortgage Disclosure Act)

**Regulation:** 12 CFR 1003 (Regulation C) — administered by CFPB

**Applicability (2018 and later thresholds):**
- Depository institutions: ≥100 closed-end originations OR ≥200 open-end originations in each of 2 prior years
- Non-depository institutions: ≥100 closed-end originations OR ≥200 open-end originations in prior year

### Data Collection

- [ ] HMDA data fields collected for every covered transaction (see LAR field list below)
- [ ] Monitoring information collected: ethnicity, race, sex of borrower (using standard GMI form or equivalent)
- [ ] Monitoring information collection occurs at application (not at closing)
- [ ] Borrowers informed of right not to provide GMI; if not provided, note method of visual observation or surname
- [ ] HMDA data entered in LOS at point of collection; not reconstructed post-close

**Required LAR data points (key fields):**

| Category | Fields |
|---------|--------|
| Loan identifiers | ULI (Universal Loan Identifier), application date, action taken, action taken date |
| Property | Property type, occupancy type, manufactured home indicators, property address (census tract) |
| Applicant | Ethnicity, race, sex, age, credit score type, credit score |
| Income | Gross annual income |
| Loan terms | Loan amount, loan purpose, loan type, lien status, interest rate, rate spread, HOEPA status, QM status |
| Costs | Total origination charges, points, lender credits, total loan costs |
| Underwriting | DTI ratio, combined LTV, property value, AUS name and result |
| Denial reasons | If denied: up to 4 denial reasons |

### LAR Submission

- [ ] LAR submitted to CFPB HMDA filing platform by March 1 following the calendar year
- [ ] LAR tested for validity errors before submission
- [ ] Resubmission process defined if CFPB identifies errors after submission
- [ ] LAR publicly available upon request after submission

**Citation:** 12 CFR 1003.5

---

## Section 4: QM/ATR (Qualified Mortgage / Ability to Repay)

**Regulation:** 12 CFR 1026.43 (Regulation Z) — Dodd-Frank § 1412-1413 — CFPB

**Applicability:** All closed-end consumer mortgage loans; excludes open-end credit (HELOCs), reverse mortgages, timeshare loans, certain temporary bridge loans

### Ability to Repay (General Standard)

For any mortgage loan, creditor must make a reasonable, good-faith determination that the borrower can repay:

- [ ] Income or assets verified and documented (pay stubs, W-2s, tax returns, bank statements)
- [ ] Employment status verified
- [ ] Monthly mortgage payment calculated using fully-amortizing rate (not teaser rate)
- [ ] All monthly mortgage payments considered (all loans on the property)
- [ ] All non-mortgage debt obligations considered (from credit report)
- [ ] Debt-to-income ratio calculated and documented
- [ ] Credit history reviewed
- [ ] Simultaneous loan (if any) considered in repayment analysis

**Documentation retained:** All ATR documentation retained for 3 years post-consummation

### Qualified Mortgage Safe Harbor / Rebuttable Presumption

A QM provides a legal safe harbor (or rebuttable presumption for higher-priced QMs) that ATR has been met.

**General QM requirements (effective March 2021 rule):**

- [ ] No negative amortization
- [ ] No interest-only period
- [ ] No balloon payment (exceptions: small creditor balloon QM)
- [ ] Loan term does not exceed 30 years
- [ ] Points and fees do not exceed 3% for loans ≥$114,847 (2023 threshold; adjust annually)
- [ ] For rate-spread QM: APR does not exceed APOR by more than 2.25% (first lien, loan ≥$114,847)

**GSE/Agency QM (temporary patch expired October 1, 2022):**

As of October 2022, GSE eligible loans no longer automatically qualify as QM under the GSE patch. Loans must meet General QM criteria.

**FHA QM:** FHA loans meeting FHA guidelines generally qualify as QM per HUD rule.

**VA QM:** VA loans meeting VA guidelines generally qualify under CFPB rule.

**USDA QM:** USDA guaranteed loans generally qualify under CFPB rule.

---

## Section 5: ECOA (Equal Credit Opportunity Act)

**Regulation:** 12 CFR 1002 (Regulation B) — administered by CFPB and DOJ

**Applicability:** All creditors who regularly extend credit

### Fair Lending (Anti-Discrimination)

- [ ] No discrimination based on: race, color, religion, national origin, sex, marital status, age (provided applicant has capacity to contract), receipt of public assistance income, or exercise of any right under the Consumer Credit Protection Act
- [ ] Pricing policies applied consistently across all borrowers (no steering to higher-cost products based on protected class)
- [ ] Fair lending monitoring program in place (pricing analysis, denial rate analysis by protected class)

### Adverse Action Notices

- [ ] Written notice of adverse action provided within 30 days of receiving completed application (for denial, counteroffers not accepted, withdrawal after file was complete)
- [ ] Notice content:
  - Statement that credit was denied, or specific action taken
  - Name and address of creditor
  - Statement of ECOA provisions (right not to be discriminated against)
  - Name and address of federal agency that administers compliance
  - **Principal reason(s) for adverse action** — specific to the applicant (not generic)
- [ ] If credit score was a factor: FCRA credit score disclosure included (see Section 6)
- [ ] Notice delivered within required timeframe (30 days from completed application; 30 days from withdrawal if file was complete)

**Citation:** 12 CFR 1002.9

### Appraisal Copy Delivery

- [ ] Copy of appraisal, other written valuations, and AVM reports provided to applicant promptly upon completion (or at least 3 business days before consummation, whichever is earlier)
- [ ] This right applies even if application is denied or withdrawn
- [ ] Applicant waiver: applicant may waive the timing requirement (but still must receive the appraisal before consummation)
- [ ] Waiver form used and retained if applicable

**Citation:** 12 CFR 1002.14

### GMI Collection

- [ ] Ethnicity, race, and sex of applicant collected on applications for purchase/refi of 1-4 family dwellings
- [ ] Applicant informed of right not to provide this information
- [ ] Information obtained from visual observation or surname if not provided voluntarily
- [ ] GMI used only for fair lending monitoring; not used in credit decision

---

## Section 6: FCRA (Fair Credit Reporting Act)

**Regulation:** 15 USC § 1681 et seq. — administered by FTC and CFPB

**Applicability:** Any creditor who uses a consumer report in connection with a credit decision

### Permissible Purpose

- [ ] Credit report pulled only for a permissible purpose: credit transaction initiated by consumer (application for mortgage)
- [ ] Credit report not pulled without borrower's written authorization
- [ ] Authorization obtained before or at time of application (typically included in loan application signature page)
- [ ] Re-pull authorization: if credit is re-pulled later in the process (e.g., refresh before closing), authorization covers this or new authorization obtained

### Adverse Action — FCRA Credit Score Disclosure

When credit report or credit score is a factor in an adverse action:

- [ ] Credit score disclosure notice provided as part of or with the adverse action notice
- [ ] Disclosure includes:
  - Credit score obtained
  - Range of possible scores under the model used
  - Key factors that adversely affected the score (up to 4)
  - Date the score was obtained
  - Name and address of CRA that provided the report

### FACTA Red Flags Rule (Identity Theft)

- [ ] Written Identity Theft Prevention Program (ITPP) in place
- [ ] ITPP identifies red flags applicable to mortgage origination (e.g., alerts on credit report, suspicious activity on accounts, suspicious documents, suspicious personal information)
- [ ] Staff trained to identify and respond to red flags
- [ ] Program reviewed and updated periodically
- [ ] Oversight by senior management or board

**Citation:** 16 CFR Part 681 (Red Flags Rule)

---

## Output Format

Produce a **Federal Mortgage Compliance Checklist** organized by regulation, with:

- Each requirement as a binary checklist item (compliant / not compliant / N/A)
- Regulatory citation for each requirement
- Risk rating for each gap (Critical = enforcement risk; High = examination finding likely; Medium = likely cited; Low = best practice)
- Remediation action for each gap
- Evidence required to demonstrate compliance

Accompany with:
- **Priority Gap List** — Top 10 compliance gaps by risk rating, with owner and target remediation date
- **Open Items** — Items requiring client clarification to complete the assessment
