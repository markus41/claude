---
description: Review a system, workflow, or data model for GDPR and CCPA compliance. Use when assessing data collection, storage, processing, and deletion practices for insurance or financial services clients who handle EU or California resident data.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# GDPR and CCPA Compliance Review

Conduct a structured gap assessment of a system, workflow, or data model against GDPR (EU 2016/679) and CCPA/CPRA (California Civil Code § 1798.100 et seq.) requirements.

## Applicability Assessment

Before beginning the review, confirm applicability:

**GDPR applies if the client:**
- Offers goods/services to EU residents (regardless of client location)
- Monitors behavior of EU residents
- Has EU-based employees or customers

**CCPA/CPRA applies if the client:**
- Does business in California AND
- Has annual gross revenues > $25M, OR
- Buys/sells/receives/shares personal information of 100,000+ California consumers/households, OR
- Derives 50%+ of annual revenues from selling California consumers' personal information

If GDPR applies, CCPA is additive — address GDPR first, then CCPA delta requirements.

## Section 1: Lawful Basis for Processing

For each category of personal data processed, document the lawful basis (GDPR Art. 6):

| Data Category | Processing Purpose | Lawful Basis | Basis Documentation |
|--------------|-------------------|--------------|---------------------|
| [e.g., Contact info] | [e.g., Policy communications] | [e.g., Contract performance] | [e.g., Terms of service] |

**Lawful bases (choose one per purpose):**
- **Contract performance** (Art. 6(1)(b)) — Processing necessary to perform a contract with the data subject
- **Legitimate interests** (Art. 6(1)(f)) — Requires Legitimate Interests Assessment (LIA); document the balance test
- **Legal obligation** (Art. 6(1)(c)) — Cite the specific law requiring the processing
- **Consent** (Art. 6(1)(a)) — Must be freely given, specific, informed, unambiguous; withdrawable at any time
- **Vital interests** (Art. 6(1)(d)) — Narrow; life-threatening situations only
- **Public task** (Art. 6(1)(e)) — Government entities or delegated public functions

For special category data (health, financial, biometric — Art. 9), an additional Art. 9(2) basis is required. For insurance and mortgage clients, explicit consent or necessity for insurance/financial services contracts typically applies.

## Section 2: Data Minimization

- [ ] Each data field collected has a documented, specific purpose
- [ ] No fields collected "in case we need them later"
- [ ] Data collected is limited to what is adequate and relevant for the stated purpose
- [ ] Data subjects are not asked for more information than the specific transaction requires
- [ ] Periodic data minimization review process defined (at least annually)

**Gap identification:** List any data fields in the system with no documented purpose or where less data would suffice.

## Section 3: Data Subject Rights

For each right, document the current state and gaps:

| Right | GDPR Article | Current Implementation | Gap | Severity |
|-------|-------------|------------------------|-----|---------|
| Access (Subject Access Request) | Art. 15 | | | |
| Rectification | Art. 16 | | | |
| Erasure ("right to be forgotten") | Art. 17 | | | |
| Restriction of processing | Art. 18 | | | |
| Data portability | Art. 20 | | | |
| Object to processing | Art. 21 | | | |
| Not subject to automated decision-making | Art. 22 | | | |

**Response time requirements:**
- Initial acknowledgment: within 1 month (GDPR); 10 business days (CCPA)
- Full response: within 1 month extendable to 3 months with notice (GDPR); 45 days extendable 45 days with notice (CCPA)
- No charge for first request per 12-month period

**Erasure exceptions relevant to insurance/mortgage:** Legal obligation to retain records (regulatory retention requirements) creates a lawful basis to refuse erasure for those specific records — but non-required data must still be erased.

## Section 4: Consent Mechanisms

If consent is used as a lawful basis:
- [ ] Consent request is separate from other terms and conditions
- [ ] Consent language is plain, not buried in T&Cs
- [ ] Pre-ticked boxes are not used
- [ ] Granular consent: separate opt-in for each distinct purpose
- [ ] Consent withdrawal mechanism is as easy as giving consent
- [ ] Consent records maintained (who, when, what, how consent was given)
- [ ] Consent is re-requested if the purpose changes

## Section 5: Retention Periods

- [ ] Retention period defined for each data category
- [ ] Retention periods are the minimum necessary for the stated purpose
- [ ] Regulatory minimum retention periods are documented with citation
- [ ] Automated deletion or anonymization process exists at end of retention period
- [ ] Retention periods are communicated to data subjects in the privacy notice
- [ ] Backup and archive systems are included in the retention/deletion scope

## Section 6: Cross-Border Data Transfers

If personal data is transferred outside the EU/EEA:
- [ ] Transfer mechanism documented for each destination country/system
- **Adequacy decision** (Art. 45) — GDPR automatically permits transfers to adequate countries (UK, Canada, Israel, Japan, etc. — check current Commission list)
- **Standard Contractual Clauses** (Art. 46(2)(c)) — Current SCCs (June 2021 version) must be executed with data importers
- **Binding Corporate Rules** (Art. 47) — For intra-group transfers
- [ ] Supplementary measures assessed where SCCs alone may be insufficient (Schrems II)
- [ ] Transfer impact assessment (TIA) conducted for high-risk destinations

## Section 7: Data Processor Agreements

For each third-party vendor that processes personal data on the client's behalf:
- [ ] Data Processing Agreement (DPA) executed (GDPR Art. 28)
- DPA must include: subject matter, duration, nature and purpose, type of data, categories of data subjects, controller obligations and rights, processor obligations (Art. 28(3))
- [ ] Sub-processor list maintained and approved
- [ ] Vendor security assessment completed
- [ ] DPA renewal/review cycle defined

## Section 8: Breach Notification

- [ ] Incident response procedure addresses personal data breaches specifically
- [ ] Supervisory authority notification within 72 hours of becoming aware (GDPR Art. 33) — even if investigation is incomplete
- [ ] Individual notification required when breach likely results in high risk to individuals (Art. 34)
- [ ] Breach log maintained (even for breaches not reported to authority)
- [ ] CCPA addition: Written notice to California AG and affected consumers for breaches of unencrypted/unredacted personal information

## Section 9: Privacy by Design

- [ ] Privacy impact assessments (DPIA) conducted for high-risk processing (Art. 35)
- [ ] Default settings protect privacy (most restrictive by default)
- [ ] Privacy considered in system design, not added post-build
- [ ] Data protection officer (DPO) appointed if required (Art. 37 — required for large-scale systematic monitoring or processing of special categories)

## CCPA-Specific Additions

**Do Not Sell or Share My Personal Information:**
- [ ] "Do Not Sell or Share" link on homepage and any page where data is collected
- [ ] Opt-out honored within 15 business days
- [ ] Opted-out consumers' data not sold/shared for 12 months without renewed consent

**Consumer Request Handling:**
- [ ] 45-day response window (extendable 45 more days with notice)
- [ ] Two or more designated methods for submitting requests (toll-free number + web form minimum)
- [ ] Request verification process that does not require creating an account
- [ ] Training for staff who handle consumer requests

**Financial Incentive Disclosure:**
- [ ] If financial incentives are offered in exchange for personal information, a clear disclosure of the material value of the data is provided

**Privacy Notice Requirements (CCPA):**
- [ ] Categories of personal information collected
- [ ] Purposes for collection
- [ ] Categories of third parties with whom information is shared
- [ ] Consumer rights listed and instructions for exercising them
- [ ] Updated at least annually

## Output Format

Produce a **GDPR/CCPA Gap Report** with:

1. **Applicability Determination** — Which laws apply and why
2. **Gap Table** — Each finding with: requirement → current state → gap description → severity (Critical/High/Medium/Low) → remediation step → regulatory citation
3. **Priority Remediation Plan** — Top 10 items ordered by severity and effort
4. **Evidence Required** — What documentation the client must produce to demonstrate compliance
