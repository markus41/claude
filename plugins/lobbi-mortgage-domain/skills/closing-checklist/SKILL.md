---
description: Design pre-closing and post-closing checklist automation for mortgage loan closings. Use when automating the closing preparation workflow, closing day coordination, and post-closing package review for a mortgage lender or broker.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Closing Checklist Automation Design

Design the automated pre-closing and post-closing checklist workflow for mortgage loan closings, including condition clearance, CD issuance compliance, closing day coordination, post-closing package review, and trailing document tracking.

---

## Section 1: Pre-Closing Checklist

**Trigger:** CTC (Clear to Close) issued by underwriter

**Timeline:** CTC typically issued 3–10 days before closing. All pre-closing items below should target completion 24–48 hours before the scheduled closing date.

### 1a: Condition Clearance Verification

Before beginning any closing preparation, confirm all UW conditions are cleared:

| Check | Verified By | Method |
|-------|------------|--------|
| All CTC conditions marked cleared in LOS | Processor / Underwriter | LOS condition log |
| No outstanding stips remaining | Underwriter | Final approval document |
| Any PTD (Prior to Docs) conditions cleared | Processor | LOS |
| Any PTF (Prior to Funding) conditions noted | Closer | List carried to funding checklist |
| Flood cert confirmed: flood zone, standard vs. SFHA | Processor | Flood determination in file |
| Hazard insurance binder received and coverage adequate | Processor | Binder in file; coverage = replacement cost or min loan amount |
| Condo: HO-6 insurance if required by program | Processor | Binder in file |

### 1b: CD Issuance and TRID Compliance

- [ ] Final CD issued to borrower(s) with all parties correct
- [ ] CD delivery method documented: in-person / e-sign (timestamp) / mail (calculate 3-day receipt)
- [ ] 3-business-day waiting period calculated and closing date confirmed to be on or after waiting period expiry
- [ ] CD fees reconciled against LE: tolerance analysis complete; no violations
- [ ] If tolerance cure required: cure amount calculated, method determined, documented on CD or memo
- [ ] Seller CD (purchase only): separate CD for seller generated with seller-side transactions
- [ ] Borrower has received and confirmed receipt of CD (e-sign confirmation or acknowledgment)

### 1c: Title Review

- [ ] Final title commitment received
- [ ] Title company and agent confirmed for closing
- [ ] Effective date of title search within lender's acceptable window (typically 30–60 days pre-close)
- [ ] Exceptions reviewed and cleared (or accepted per lender guidelines):
  - Existing mortgage(s) to be paid off at closing — payoff figures received
  - Easements — recorded easements reviewed; none affecting marketability
  - Survey matters — if survey required, reviewed and acceptable
  - Liens — all liens addressed (paid off at closing or per lender exception)
  - HOA dues — current; no delinquency
- [ ] Vesting/how title will be taken: matches 1003 and approved by lender
- [ ] If leasehold: lease reviewed per program requirements

### 1d: Hazard and Flood Insurance Verification

| Item | Requirement |
|------|-------------|
| Hazard insurance binder | Effective date = on or before closing date; term at least 1 year |
| Coverage amount | Greater of: replacement cost or loan amount (cannot be less than loan amount) |
| Mortgagee clause | Correct lender name and ISAOA language |
| First year premium | Paid in advance (or at closing if escrowed — verify funds at closing) |
| Flood insurance (if required) | Coverage = minimum required (lesser of: loan amount, building replacement cost, $250K for NFIP) |
| Flood insurance mortgagee clause | Correct lender name |
| Flood first-year premium | Paid in advance or at closing |

### 1e: Wire Instructions Verification

- [ ] Wire instructions received from settlement agent / title company
- [ ] Wire instructions verified by callback to title company at number on file (NOT the number in the email — fraud risk)
- [ ] Confirm wire instructions have not changed since prior verification
- [ ] Documentation: log of when instructions were verified, who verified, callback number used
- [ ] Wire fraud warning provided to borrower in CD and separately: borrowers should never wire based on email alone; always call to verify using a number obtained independently

### 1f: Closing Agent Confirmation

- [ ] Settlement agent / closing attorney confirmed for scheduled date, time, and location
- [ ] Remote online notarization (RON) setup if applicable: notary confirmed, technology tested, state RON law confirmed
- [ ] Closing documents to be delivered to closing agent: method (electronic delivery / overnight / courier) and timeline confirmed
- [ ] POA (Power of Attorney) review: if any party is signing via POA, confirm POA is acceptable to lender (recorded or recordable, specific to the transaction, not expired)

### 1g: Loan Document Package

Before releasing loan documents to settlement agent:

- [ ] Final loan amount confirmed (no changes since last AUS and LOS)
- [ ] Interest rate and all loan terms confirmed (match rate lock)
- [ ] Loan documents generated in LOS or doc prep vendor
- [ ] Note reviewed: loan amount, interest rate, payment amount, maturity date, prepayment penalty (Y/N)
- [ ] Deed of Trust / Mortgage reviewed: property legal description, vesting, lender name, loan terms
- [ ] MERS Registration: if MERS is used, MERS MIN assigned and in documents
- [ ] Right to cancel (if refinance, non-purchase money): 3-business-day rescission period documents included

---

## Section 2: Closing Day Workflow

### 2a: Disbursement Authorization

**Before authorizing wire disbursement:**

- [ ] All PTF (Prior to Funding) conditions cleared
- [ ] Signed closing package received from settlement agent (wet or e-sign)
- [ ] Closing affidavit / compliance agreement executed
- [ ] Note signed by all borrowers
- [ ] Deed of Trust / Mortgage signed by all vested parties
- [ ] Right to cancel executed (refi) — confirm 3-day rescission period has run (or waiver executed if applicable)
- [ ] Funds confirmed received: borrower's closing funds wired in or cashier's check confirmed
- [ ] Closing disclosure re-reviewed post-signing: no changes from issued CD (if changes, additional disclosure may be required)
- [ ] HMDA data confirmed for LAR reporting

### 2b: Wire Release

- [ ] Funding department approves wire release
- [ ] Wire released to settlement agent escrow account
- [ ] Wire confirmation number saved in LOS
- [ ] Settlement agent confirms receipt of wire
- [ ] Disbursement date = funding date (used for first payment due date calculation and HMDA)

### 2c: Closing Package Receipt Confirmation

After closing is complete:
- [ ] Settlement agent sends executed closing package to lender (overnight or electronic)
- [ ] Package received and logged (date received)
- [ ] Receipt acknowledgment sent to settlement agent

---

## Section 3: Post-Closing Package Review

**Trigger:** Executed closing package received from settlement agent

**Timeline:** Must be completed within lender's investor delivery commitment (typically 15–30 days post-close)

### 3a: Document Review Checklist

**Note review:**
- [ ] All borrowers have signed (wet or e-sign per investor requirements)
- [ ] Loan amount matches final CD and LOS
- [ ] Interest rate matches final CD and rate lock confirmation
- [ ] Monthly payment matches final CD (PI only)
- [ ] Maturity date correct
- [ ] Prepayment penalty terms correct (or none, if applicable)
- [ ] Endorsement required: blank endorsement or to specific investor / MERS

**Deed of Trust / Mortgage review:**
- [ ] All parties have signed (all vested owners)
- [ ] Notary acknowledgment complete (notary seal legible, notary commission expiration date valid on date of signing)
- [ ] Legal description of property matches title commitment and survey
- [ ] Loan amount correct
- [ ] Lender name correct (not prior lender if refinance)

**Title insurance:**
- [ ] ALTA Lender's Title Insurance Policy (or binder pending recording) received
- [ ] Policy amount = loan amount
- [ ] Policy insures lender in first lien position (for purchase or rate/term refi)
- [ ] Named insured = lender (or MERS as nominee, if applicable)
- [ ] Exceptions reviewed and acceptable

**Final inspection (construction and FHA/VA/USDA if required):**
- [ ] Final inspection report received (if required by program)
- [ ] Inspector sign-off that property is complete and meets program requirements

### 3b: Recording

- [ ] Deed of Trust / Mortgage sent to county recorder (via settlement agent or lender directly)
- [ ] Recording confirmed: recorded document number received and stored
- [ ] Recorded document received and stored in loan file
- [ ] Deed (purchase): confirm deed recorded and available

---

## Section 4: Trailing Document Tracker

After closing, several documents are received over time. Track each by expected receipt date with alerts.

| Document | Expected Receipt | Alert Threshold | Owner |
|---------|-----------------|-----------------|-------|
| Recorded Deed of Trust / Mortgage | 2–8 weeks post-close (varies by county) | Alert at 30 days if not received | Post-close |
| Final Title Insurance Policy | 2–6 weeks post-close | Alert at 45 days | Post-close |
| Final inspection (if pending at close) | Per condition timeline | Alert at condition due date | Post-close |
| Survey (if ordered post-close) | 1–3 weeks | Alert at 21 days | Post-close |
| MERS registration confirmation | Within 5 business days | Alert at 7 days | Post-close |
| Investor delivery receipt | Per investor commitment (15–30 days) | Alert at delivery deadline −5 days | Shipping |

---

## Section 5: MERS Registration Workflow

If client uses MERS (Mortgage Electronic Registration Systems):

1. MIN (MERS Identification Number) assigned in LOS before document generation
2. MIN printed on Note and Deed of Trust
3. MERS registration submitted: borrower name, property address, loan amount, MIN, originator ID, servicer ID
4. MERS registration confirmation received and stored
5. If loan sold: MERS transfer-of-beneficial-rights (TOBR) update submitted within investor's required timeframe

---

## Section 6: Shipping and Investor Delivery

**Investor delivery package (custodian file):**

| Document | Delivery Format |
|---------|----------------|
| Original Note (with endorsement) | Original physical or SMART Doc e-note |
| Original Deed of Trust (or certified copy if recording pending) | Original or certified copy |
| Title insurance policy or binder | Original or digital policy |
| Any riders / addenda to Note | Original |
| Allonge (if applicable) | Original |

**Shipping checklist:**
- [ ] Correct investor identified and delivery address confirmed
- [ ] Shipping method: overnight with signature required (for originals)
- [ ] Tracking number saved in LOS
- [ ] Investor receipt confirmation received and stored
- [ ] If e-delivery: e-vault transfer confirmed; investor acknowledgment received

---

## Output Format

Deliver three artifacts:

1. **Pre-Closing Checklist** — Automated checklist with each item, responsible role, trigger event, verification method, and alert threshold

2. **Post-Closing Checklist** — Document review checklist for each document type with acceptance criteria

3. **Trailing Document Tracker** — Template for tracking all post-close documents with expected receipt dates, alert thresholds, and escalation path for aged items
