---
description: Design Exchange Online mail flow rules and shared mailbox configurations for insurance and financial services email routing and compliance.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Exchange Rules Designer

Produce a complete Exchange Online configuration specification covering mail flow rules, shared mailboxes, distribution lists, retention policies, and security settings. Output must be actionable by an Exchange administrator using the Exchange admin center or Exchange Online PowerShell.

## Mail Flow Rules

Design each rule as a complete specification. Rules are evaluated in priority order — lower number runs first.

**Rule specification template**:

```
Rule Name: [Descriptive name using verb-noun format]
Priority: [Number, 1 = highest]
Mode: Enforce (not Audit-only, unless testing)

Conditions (ALL must match unless noted):
  - [Condition type]: [Value]
  - [Condition type]: [Value]

Actions (applied when conditions match):
  - [Action type]: [Value]

Exceptions (rule does NOT apply when):
  - [Exception type]: [Value]

Comments: [Business rationale for this rule]
```

**Standard rules for insurance and financial services**:

*Inbound disclaimer rule* (required for compliance):
```
Rule Name: Add-Confidentiality-Disclaimer-Inbound
Priority: 10
Conditions:
  - Message direction: Inbound
  - Recipient domain is: [firm domain]
Actions:
  - Append disclaimer: [Standard confidentiality notice text]
  - Fallback action: Wrap (if disclaimer cannot be appended)
```

*PII content routing rule*:
```
Rule Name: Route-PII-To-Compliance-Review
Priority: 5
Conditions:
  - Message contains sensitive information type: U.S. Social Security Number
  - OR: Message contains sensitive information type: Credit Card Number
  - Sender is external
Actions:
  - Send copy (BCC) to: compliance@[firm].com
  - Apply message classification: Confidential
Exceptions:
  - Sender domain is in: [approved-carrier-domains.txt — list approved carriers]
```

*External email warning rule*:
```
Rule Name: Warn-On-External-Sender
Priority: 20
Conditions:
  - Sender is external
  - Recipient is internal
Actions:
  - Prepend subject with: [EXTERNAL]
  - Apply HTML disclaimer at top of body: "This email originated from outside the organization."
Exceptions:
  - Sender domain is in approved external partner list
```

*Block dangerous attachment types*:
```
Rule Name: Block-Dangerous-Attachments
Priority: 1
Conditions:
  - Attachment file extension matches: .exe, .bat, .cmd, .ps1, .vbs, .js, .msi, .com
Actions:
  - Reject message and notify sender with: "This file type is blocked by policy."
  - Notify: security@[firm].com
```

**Rule table summary** (output this for the specification document):

| Priority | Rule Name | Conditions | Actions | Exceptions |
|----------|-----------|------------|---------|------------|
| 1 | Block-Dangerous-Attachments | Attachment type match | Reject | — |
| 5 | Route-PII-To-Compliance-Review | PII content type | BCC compliance | Approved carriers |
| 10 | Add-Confidentiality-Disclaimer-Inbound | Inbound | Append disclaimer | — |
| 20 | Warn-On-External-Sender | External sender | Prepend [EXTERNAL] | Partner domains |

## Shared Mailbox Design

For each shared mailbox, produce:

**Mailbox identity**:
- **Display name**: Noun phrase describing the function (e.g., `Claims Intake`, `Renewals Team`, `New Business`)
- **Email address**: `[function]@[firm].com` (e.g., `claims@acmeins.com`)
- **Alias(es)**: List any additional accepted email addresses (e.g., `newclaims@acmeins.com` → delivered to `claims@acmeins.com`)

**Access permissions**:

| User/Group | Permission Type | Use Case |
|------------|----------------|----------|
| Claims Team DL | Full Access | Read and manage all messages |
| Claims Manager | Full Access + Send As | Can respond as the shared mailbox |
| Admin team | Full Access | IT administration only |

- **Full Access**: Read messages, mark as read/unread, move, delete. Does not grant send permission.
- **Send As**: Send email that appears to come from the shared mailbox address. Preferred over Send on Behalf for clean external presentation.
- **Send on Behalf**: Sends as "User on behalf of Shared Mailbox" — visible in the From field. Use only when explicit attribution is required.

**Auto-reply configuration**:
- **Out-of-hours reply**: Configure if the mailbox handles time-sensitive inquiries. Specify message text and hours.
- **Vacation/closure reply**: Template for holiday closures. Specify trigger dates and message.

**Folder structure** (configure via Outlook after mailbox creation):

| Folder | Purpose |
|--------|---------|
| New — Unassigned | Incoming, not yet picked up by a team member |
| In Progress — [Staff Name] | Moved when a staff member begins working it |
| Pending Client Response | Waiting for client reply |
| Escalated | Needs manager attention |
| Closed | Completed, archived monthly |

**Retention policy**: Apply the same retention label used on related SharePoint libraries (e.g., `FINRA-7yr` for broker-dealer operations).

**Litigation hold**: Enable if this mailbox receives communications that may be subject to regulatory examination or legal discovery.

## Distribution Lists

For each distribution group:

| List Name | Email Address | Membership | Moderation | External Senders |
|-----------|--------------|------------|------------|-----------------|
| Claims Team | claims-team@acmeins.com | Claims staff (by AD group) | None | Blocked |
| Agency Principals | principals@acmeins.com | Owner/principals | Manager approval | Blocked |
| All Staff | allstaff@acmeins.com | All employees | IT moderated | Blocked |
| Carrier Partners | carriers@acmeins.com | Internal + approved carriers | None | Specific domains only |

**Moderation**: Enable for all-staff lists and any list where uncontrolled sends could cause noise. Specify who the moderator is.

**External sender policy**: Block external senders from distribution lists by default. Explicitly allow external senders only for carrier partner lists and only from approved domains.

## Email Retention Policies

Apply Microsoft Purview retention labels to Exchange mailboxes:

| Policy Name | Applies To | Retention Period | Action at End |
|-------------|-----------|------------------|---------------|
| FINRA-Broker-7yr | Broker-dealer staff mailboxes | 7 years | Delete |
| State-Insurance-5yr | Insurance agency staff | 5 years | Delete |
| General-Staff-3yr | All other staff | 3 years | Delete |
| Compliance-Indefinite | Compliance mailbox | Indefinite (litigation hold) | Review |

**Litigation hold**: Enable on the mailbox itself via `Set-Mailbox -LitigationHoldEnabled $true`. Do not rely on retention policies alone for legal hold — they can be removed by admins.

**In-place archive**: Enable for staff with mailboxes exceeding 10 GB or in regulated roles. Auto-archive items older than 2 years to the online archive.

## Anti-Spam and Security

**Safe senders list** (tenant-level, not per-user): Add approved carrier and partner domains. Managed via Exchange admin center > Threat Policies > Anti-spam > Allowed sender domains.

**Blocked senders**: List any domains that have been sources of phishing or spam specific to the firm.

**Quarantine policy**:
- High-confidence phishing: Quarantine, notify recipient
- Malware: Block, no notification to recipient
- Spam: Deliver to Junk folder, allow end-user release after review

**Email encryption**:
- **Sensitivity labels for encryption**: Apply `Confidential` sensitivity label to emails containing PII. Label triggers Office Message Encryption.
- **S/MIME**: Implement only if a specific counterparty requires certificate-based signing (rare — document the business requirement).
- **OME (Office Message Encryption)**: Use for all encrypted external communications. Recipient receives a link and authenticates via Microsoft or Google account to read.

## Output Format

Deliver as:

1. Mail flow rule table (priority-ordered summary) followed by detailed spec per rule
2. Shared mailbox specifications (one section per mailbox with all fields)
3. Distribution list table
4. Retention policy assignment table
5. Security configuration (quarantine, encryption, anti-spam)
6. PowerShell command outline (parameter stubs for each object to be created — not full scripts)
7. Post-configuration verification checklist
