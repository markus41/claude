---
description: Design borrower self-service portal specifications for mortgage brokers and lenders. Use when specifying a borrower-facing portal for loan status tracking, document upload, communication, and closing scheduling.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# Borrower Portal Specification

Design the feature specification and security requirements for a borrower-facing mortgage portal that allows applicants to track their loan status, upload required documents, communicate with their loan team, and manage closing logistics — reducing inbound calls and improving the borrower experience.

---

## Authentication

**Registration:**
- Initiated by loan officer or processor: system sends invitation email to borrower's email address on file
- Borrower creates password on first login (not pre-set by staff)
- Password requirements: minimum 10 characters, must include upper, lower, number; common passwords rejected
- Email verification: confirmation link expires in 48 hours; resend available

**Multi-Factor Authentication:**
- MFA required for all borrower accounts
- TOTP (authenticator app) or SMS OTP accepted
- MFA enrollment required on first login after password set
- Fallback: email OTP if phone number changes
- Session timeout: 20 minutes of inactivity; absolute limit 8 hours

**Session security:**
- HTTPS only; TLS 1.2 minimum
- Secure cookie flags (HttpOnly, Secure, SameSite=Strict)
- Session token invalidated on logout and on MFA re-authentication
- Concurrent session limit: 2 devices (additional login invalidates oldest session with notification)
- Failed login: 5 consecutive failures → 15-minute lockout (not full account lock — reduces abuse risk)

**Account recovery:**
- Password reset: email verification link (expires 30 minutes)
- MFA device lost: verified via security questions + email OTP; requires identity re-verification before full access restored
- Fraud alert: 3 failed recovery attempts → email notification to borrower and loan team notification

---

## Loan Status Dashboard

**Status overview:**

The primary view shows the borrower's current loan status with a visual progress indicator (milestone pipeline).

| Element | Content |
|---------|---------|
| Milestone progress bar | Visual pipeline showing current milestone highlighted; completed milestones checked |
| Current milestone name | Plain English (e.g., "Your loan is in underwriting") |
| Current milestone description | 2–3 sentences explaining what happens at this stage |
| Estimated closing date | Displayed when known; updated as timeline changes |
| Next action | What the borrower needs to do next (if anything) |
| Outstanding items | Count and list of items required from borrower (documents, signatures, decisions) |

**Milestone display for borrower (plain language):**

| Internal Milestone | Borrower-Facing Label | Borrower Description |
|-------------------|----------------------|---------------------|
| Application received | Application submitted | Your loan application has been received. We're reviewing the information and will be in touch soon. |
| Disclosures sent | Loan Estimate ready | Your Loan Estimate is ready for review. Please review and let us know you'd like to proceed. |
| Processing | We're gathering your documents | Our team is reviewing your file and may request additional documents. Watch for items in your portal. |
| Appraisal ordered | Appraisal in progress | We've ordered an appraisal of your property. The appraiser will contact you to schedule access. |
| Submitted to underwriting | In underwriting | Your complete file has been submitted to underwriting for a final decision. |
| Conditional approval | Approved — a few items needed | Great news! Your loan is approved. We need a few additional items before we can proceed. |
| Clear to close | You're cleared to close! | Everything is approved. We're preparing your closing documents. |
| CD issued | Review your Closing Disclosure | Your Closing Disclosure is ready. Please review carefully and confirm your closing appointment. |
| Closing scheduled | Closing scheduled | Your closing is scheduled for [date/time/location]. |
| Funded | Your loan is funded | Congratulations! Your loan has been funded. |

---

## Outstanding Conditions

**Conditions display:**

Show borrower only the conditions they can fulfill — not internal UW conditions requiring lender action.

| Column | Content |
|--------|---------|
| Condition name | Plain English label (e.g., "Most recent pay stub") |
| Description | What it is and why it is needed (1–2 sentences) |
| Status | Needed / Uploaded (pending review) / Accepted / Waived |
| Priority | Required before closing / Required for approval |
| Instructions | How to obtain and submit this document |
| Upload button | If status = Needed |

**Status lifecycle:**
```
Needed → [Borrower uploads] → Uploaded (pending review) → [Staff reviews] → Accepted or Returned with comments
```

If document is returned: borrower receives notification with specific reason; condition returns to Needed status.

---

## Document Upload

**Upload requirements:**
- Accepted file types: PDF, JPG, PNG, TIFF, HEIC
- Maximum file size: 25MB per file; 100MB per upload session
- Multiple files per condition: allowed (borrower can upload more than one file for a single condition if documents are split across pages)
- File naming: system assigns name based on condition + timestamp; borrower does not need to name files

**Upload flow:**
1. Borrower selects condition requiring a document
2. Upload instructions displayed (what the document must contain; example shown if available)
3. File selection (drag-and-drop or file picker)
4. Preview displayed: first page of PDF or image
5. Borrower confirms upload
6. System virus scans file (in-flight; typical < 5 seconds)
7. If scan fails: error message, file rejected
8. If scan passes: file stored; condition status changes to "Uploaded — pending review"
9. Loan team notified of document upload (in-system notification + email summary)

**Security:**
- Files stored in encrypted storage (AES-256 at rest)
- Access control: only borrower, co-borrower, and loan team can access uploaded files
- Files retained per lender's document retention policy; not accessible after loan is closed and retention period expires

---

## Secure Messaging

**Message thread structure:**
- One thread per loan (not per topic)
- Participants: borrower, co-borrower, loan officer, processor (as configured by loan team)
- Message history: complete history from application to close retained in loan file

**Messaging rules:**
- Borrower cannot initiate contact with a new party not added to their thread
- Files can be attached to messages (same file type and size limits as document upload — for informal back-and-forth; formal document submission uses the Conditions section)
- Read receipts: loan team can see when borrower has read a message (borrower can see when loan team has read a message)
- Response time display: "Typical response time: [N] business hours" set by lender

**Message notifications:**
- New message from loan team → email notification to borrower: "You have a new message in your portal" (no loan details in email)
- Unread message indicator in portal header
- SMS notification (optional, if borrower opts in): same content as email

**Wire fraud warning (pinned to message thread):**

A permanent, prominent notice displayed at the top of every message thread:

> **Important: Wire Fraud Warning**
> Our team will NEVER ask you to wire money based on an email or message alone. Before wiring any funds, call your loan officer directly at [loan officer phone number] to verify the wire instructions. Wire fraud is common and wires are irreversible.

---

## Closing Coordination

**CD review and acknowledgment:**

When CD is issued:
- Portal displays "Your Closing Disclosure is ready" banner
- CD PDF viewable in portal (full document)
- Key figures highlighted: cash to close, monthly payment, loan amount, interest rate
- Borrower must click "I have reviewed my Closing Disclosure" to acknowledge (does not constitute legal acknowledgment for TRID purposes — this is informational UX; formal LE/CD delivery compliance handled separately)
- 3-business-day wait countdown shown: "Closing available on or after [date]"

**Closing appointment:**

- Closing date, time, and location displayed once confirmed
- Option to add to calendar (ICS file download)
- Closing details:
  - Physical address or "Remote Online Notarization" with technology instructions
  - Who will be at closing (settlement agent name and contact)
  - What to bring: valid government-issued photo ID, any cashier's check (if not wiring), any items noted in CD
  - Wiring instructions (if applicable): displayed with mandatory fraud warning adjacent; instructions displayed only after loan team has verified with title company

**Wire instructions display:**

> **Your wire instructions — read before wiring**
>
> Before wiring any funds, call [title company name] directly at [verified phone number on file] to confirm these instructions have not changed. Do not send a wire based on this page alone — wire fraud is common.
>
> [Wire instructions displayed below]

---

## Post-Close

**After funding:**

- Loan status changes to "Your loan is funded — congratulations!"
- First payment information displayed: due date, amount, servicer name and payment address
- If loan is transferred to a servicer: servicer contact information displayed
- Escrow analysis information: if escrow account established, explanation of initial setup and when first annual analysis will occur
- Portal access continues for 30 days post-close (borrower can download documents they uploaded; read message history)

---

## Portal Security Requirements Summary

| Requirement | Specification |
|-------------|--------------|
| Encryption in transit | TLS 1.2 minimum; TLS 1.3 preferred |
| Encryption at rest | AES-256 for all stored documents and PII |
| Authentication | Email + password + MFA (TOTP or SMS OTP) |
| Session management | 20-minute inactivity timeout; 8-hour absolute |
| Password policy | 10+ characters; complexity enforced; breach list checked |
| MFA required | Yes — all users, no bypass |
| Audit logging | All login attempts (success/fail), document uploads, message sends, status page views |
| Penetration testing | Annual third-party pen test |
| OWASP Top 10 | Addressed in design and verified in security testing |
| Data residency | US-only hosting if handling US borrower PII |
| Vendor assessment | If hosted by third party, SOC 2 Type II required |

---

## Output Format

Deliver two artifacts:

1. **Portal Feature Specification** — User story format (as a [borrower / loan officer / processor], I can [action] so that [benefit]) with acceptance criteria for each feature

2. **Security Requirements Specification** — Authentication, session management, encryption, audit logging, and testing requirements; input validation requirements for all borrower-submitted data
