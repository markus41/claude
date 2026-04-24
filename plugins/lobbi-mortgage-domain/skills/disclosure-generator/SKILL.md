---
description: Generate TRID Loan Estimate and Closing Disclosure timing and accuracy specifications. Use when designing the disclosure workflow for a mortgage lender or broker to ensure TRID compliance.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# TRID Disclosure Workflow Design

Design the Loan Estimate and Closing Disclosure workflow to ensure full TRID (TILA-RESPA Integrated Disclosure) compliance. TRID violations are among the most commonly cited mortgage regulatory deficiencies — this specification covers timing, tolerance buckets, changed circumstance procedures, and recordkeeping requirements.

## TRID Overview and Applicability

TRID (implemented under Reg Z § 1026.37-38 and Reg X § 1024.7) applies to:
- Most closed-end consumer mortgage loans secured by real property
- Excludes: HELOCs, reverse mortgages, mobile home loans not secured by real property, loans made by a creditor who made fewer than 5 mortgages in the prior year

Consists of two required disclosures:
- **Loan Estimate (LE)** — Replaces Good Faith Estimate (GFE) and initial TIL
- **Closing Disclosure (CD)** — Replaces HUD-1 and final TIL

---

## Section 1: Loan Estimate Workflow

### 1a: Application Definition (6-Piece Trigger)

The LE clock starts when the borrower provides these 6 pieces of information:

1. Borrower's name
2. Borrower's income
3. Borrower's Social Security number
4. Property address
5. Estimated value of the property
6. Mortgage loan amount sought

**Important:** The creditor cannot require additional information beyond these 6 before providing a Loan Estimate. Pre-qualification worksheets or additional documentation can be requested in parallel, but the 6-piece receipt date is the application date.

**System requirement:** Log the exact date and time each of the 6 fields is captured. When all 6 are present, set `application_received_date`. This is the date the LE clock starts.

### 1b: LE Delivery Timing

- **LE must be delivered:** within 3 business days of application receipt
- **Business day for LE delivery:** any day the creditor's offices are open for business (includes Saturdays if office is open; excludes federal public holidays)
- **Delivery methods and constructive delivery:**
  - Hand delivery: received on day delivered
  - U.S. mail: assumed received 3 business days after mailing (so add 3 days to the 3-business-day LE window = effective 6 days from application if mailing)
  - Email: received on day sent (if consumer has agreed to electronic communications under E-SIGN Act)
- **Cannot collect fees before LE delivery** except bona fide credit report fee (typically $15–50)

**LE deadline calculator:**
```
application_received_date = first date all 6 triggers are present
le_due_date = application_received_date + 3 business days
(Count: skip Sundays and federal public holidays; include Saturdays if office open)

If mailing:
le_mail_by_date = application_received_date + 3 business days
le_constructive_receipt = le_mail_by_date + 3 more business days
```

### 1c: Fee Tolerance Buckets

TRID limits how much certain fees can change between the LE and the CD.

**Zero tolerance (cannot increase):**
- Creditor fees (origination charges, points, application fees)
- Transfer taxes
- Fees for required third-party services where borrower is NOT permitted to shop
  - Examples: appraisal, flood determination, credit report, upfront MIP/PMI
- Recording fees (at CD, cannot exceed LE by more than $10)

**10% tolerance (aggregate tolerance — total increase cannot exceed 10% of LE total):**
- Title services — if borrower selects from creditor-provided list
- Settlement services — if borrower selects from creditor-provided list
- Pest inspection — if required by state law or program
- Recording fees (aggregate with others in the bucket)

**No tolerance (can change without limit):**
- Prepaid interest
- Property insurance premium
- Amounts placed into escrow (initial escrow payment at closing)
- Third-party services where borrower shopped and selected their own provider
- Third-party fees for services not required by creditor

**Tolerance cure process:**
If at CD, any zero-tolerance or 10%-bucket fee exceeds tolerance:
- Creditor must provide a cure (refund) at or before consummation, or within 3 calendar days after consummation
- Cure amount = amount of the overcharge
- Cure is paid to the borrower; document cure in CD or separate documentation

### 1d: Changed Circumstance Events

A valid changed circumstance allows re-disclosure of a revised LE and resets the tolerance comparison baseline.

**Valid changed circumstance categories:**

| Category | Examples | Documentation Required |
|---------|---------|----------------------|
| Extraordinary event | Natural disaster affecting property; market disruption | News documentation, loss adjuster report |
| Information relied upon changes | Appraisal comes in different from estimate; title search reveals lien; income different from stated | Revised information + explanation of how it changed the fee |
| New information on borrower or property | Borrower adds or removes co-borrower; property use differs from disclosed | Written explanation |
| Interest rate locked | Fees tied to rate lock that changes when rate is locked | Lock confirmation |
| Borrower-requested change | Program change, loan amount change, property address change | Written or documented borrower request |
| Expiration of original LE | Borrower does not express intent to proceed within 10 business days | Log of LE delivery date and non-response |

**Changed circumstance documentation requirement:**
- Date of event or discovery
- Description of the changed circumstance (specific, not generic)
- Which fees changed as a result and why
- How the new fee amount was calculated
- Stored in loan file; must be available for examination

**Revised LE timing after changed circumstance:**
- Must be delivered within 3 business days of receiving information sufficient to establish the changed circumstance
- New comparison baseline = fees on the revised LE (replacing the original LE)
- Cannot use a revised LE to cure tolerances if issued less than 4 business days before consummation

### 1e: Intent to Proceed

- Borrower must express intent to proceed before creditor may collect any fees beyond credit report
- "Intent to proceed" can be: verbal, written, or e-signed acknowledgment
- System should capture: date, time, method, and staff member who received intent (for verbal)
- Loan file must document that no fees were collected before intent to proceed

---

## Section 2: Closing Disclosure Workflow

### 2a: CD Delivery Timing

- **CD must be received:** at least 3 business days before consummation
- **Business day for CD:** ALL calendar days except Sundays and federal public holidays (broader definition than LE business day)
- **If using mail:** add 3 business days for constructive receipt → effective 6 calendar days before closing

**CD delivery compliance checklist:**
- [ ] CD issued to all borrowers who are primarily liable on the loan
- [ ] If purchase: separate CD issued to seller (seller's page only required)
- [ ] Date of CD receipt documented (e-sign confirmation or delivery confirmation)
- [ ] 3-business-day waiting period begins day after receipt
- [ ] Closing date confirmed to be after waiting period expires

**CD receipt date matrix:**

| Delivery Method | Assumed Receipt | 3-Business-Day Clock Starts |
|----------------|----------------|--------------------------|
| In person or electronic (with E-SIGN consent) | Day of delivery | Day after delivery |
| U.S. mail | 3 business days after mailing | Day after assumed receipt (6 days total) |

**Example:**
- Closing on Tuesday
- CD must be received no later than Thursday of the prior week (assuming Monday = day 1, Tuesday = day 2, Wednesday = day 3, Thursday = day 4 — no, count differently)
- Correct: for Tuesday closing → received by Thursday of prior week (Friday would also work if Friday, Saturday, Monday before Tuesday all count as business days)

**Actual calculation:** Count back from consummation date. Day 1 = business day before consummation, Day 2 = business day before Day 1, Day 3 = business day before Day 2. CD must be received on or before Day 3.

### 2b: CD Triggers for Re-Disclosure (3-Day Reset)

If the CD is reissued with certain changes after delivery, the 3-business-day waiting period resets.

| Change | New 3-Day Wait Required? |
|--------|--------------------------|
| APR increases by more than 1/8 of 1% (1/4% for irregulars) | Yes |
| Loan product changes (e.g., fixed to ARM) | Yes |
| Prepayment penalty added | Yes |
| Decrease in APR | No (borrower benefit — no re-wait required) |
| Non-triggering fee changes (e.g., increased cash to close not due to above) | No |

**Practical implication for workflow:**
- Any change to the CD within 4 business days of closing that could trigger an APR change needs immediate underwriter/compliance review
- Establish a "CD change freeze" period: no substantive changes to fees after CD is issued without compliance sign-off

### 2c: CD vs. LE Comparison and Tolerance Cure

At CD stage, compare each fee against the LE baseline:

| Step | Action |
|------|--------|
| 1 | Pull all fees from the final LE (or latest revised LE for each fee category) |
| 2 | Compare each fee on the CD to the LE |
| 3 | Apply tolerance bucket rules (zero / 10% / no tolerance) |
| 4 | Calculate aggregate 10% bucket variance |
| 5 | Identify any tolerance violations |
| 6 | Calculate cure amount for each violation |
| 7 | Document cure in CD (or confirm separate cure payment timing) |

**Cure documentation:**
- Record the cure amount, date paid, and method (applied to closing costs or check to borrower)
- Retain in loan file — regulators look for cures as evidence of original tolerance violation

### 2d: Post-Consummation CD Requirements

In certain cases, a corrected CD must be provided after closing:

- Non-numerical clerical errors on CD: corrected CD delivered within 60 calendar days of consummation
- Numerical errors (changes that affect APR, loan terms, or amounts): corrected CD within 3 business days of discovery
- Remediation: if post-consummation CD reflects borrower paid more than permitted, refund within 3 business days of discovery

---

## Section 3: Record-Keeping Requirements

| Document | Retention Period | Required Content |
|---------|-----------------|-----------------|
| Initial Loan Estimate | 3 years from consummation | LE as delivered; evidence of delivery; application date |
| All revised LEs | 3 years from consummation | Revised LE; changed circumstance documentation |
| Intent to proceed | 3 years from consummation | Date, method, staff member (if verbal) |
| Closing Disclosure | 5 years from consummation | CD as delivered; evidence of 3-day receipt |
| All revised CDs | 5 years from consummation | Revised CD; reason for revision; delivery evidence |
| Tolerance cure documentation | 3 years | Amount, date, method |
| Changed circumstance file | 3 years | Date of event, description, fees affected |

**Delivery confirmation requirements:**
- E-sign: system-generated timestamp of when borrower opened/signed; retain in loan file
- Mail: retain copy of mailing + calculated constructive receipt date
- In-person: retain signed acknowledgment of receipt

---

## Output Format

Deliver two artifacts:

1. **TRID Disclosure Workflow Specification** — Process flows for LE issuance, changed circumstance handling, CD issuance, and post-consummation corrections; with decision trees for tolerance analysis and re-disclosure triggers

2. **Tolerance Matrix** — Complete fee tolerance table with examples for each bucket; changed circumstance documentation template; CD vs. LE comparison checklist
