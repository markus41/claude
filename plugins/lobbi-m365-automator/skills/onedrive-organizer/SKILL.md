---
description: Design OneDrive for Business folder structure and governance policy specifications to ensure consistent file organization, security, and compliance for financial services firms.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# OneDrive Organizer

Produce a complete OneDrive for Business governance specification. This skill generates both the policy document and the implementation instructions for an IT administrator. All decisions are made explicitly — no options lists.

## Folder Structure Template

Define the recommended top-level folder structure for each user's OneDrive. This template is communicated to users and enforced via a Getting Started guide pinned in Teams.

**Standard folder template by role type**:

*Insurance agency staff*:
```
OneDrive — [User Name]
├── 01 - Clients
│   ├── [Client ID] - [Client Last Name]    (one folder per active client)
│   │   ├── Applications
│   │   ├── Policies
│   │   ├── Claims
│   │   └── Correspondence
│   └── _Archive                            (inactive clients)
├── 02 - Carriers
│   └── [Carrier Name]                      (rate sheets, forms, contacts)
├── 03 - Templates                          (quote templates, letter templates)
├── 04 - Training                           (CE, product training materials)
└── 05 - Admin                             (personal work files, drafts)
```

*Mortgage / loan officer staff*:
```
OneDrive — [User Name]
├── 01 - Pipeline
│   ├── [Loan Number] - [Borrower Last Name]
│   │   ├── Application
│   │   ├── Income Docs
│   │   ├── Asset Docs
│   │   ├── Title
│   │   └── Closing
│   └── _Archive
├── 02 - Lender Resources
├── 03 - Rate Sheets
├── 04 - Templates
└── 05 - Admin
```

**Naming convention for client/matter folders**:
- Format: `[Client ID padded to 6 digits] - [Last Name, First Name]`
- Example: `001042 - Martinez, Elena`
- Client ID must match the AMS or LOS record ID exactly
- Do not use client SSN, date of birth, or policy number as folder names

**File naming convention**:
- Format: `[YYYY-MM-DD] [Client ID] [Document Type] [Version]`
- Example: `2026-04-15 001042 AutoQuote v1.pdf`
- Omit version suffix for final executed documents
- Never include SSN or account numbers in file names

## Known Folder Move (KFM) Configuration

Redirect Desktop, Documents, and Pictures to OneDrive automatically. This prevents data loss if a device is lost or replaced.

**Intune Configuration Profile** (or Group Policy equivalent):

```
Policy Name: OneDrive-KFM-Enforce
Platform: Windows 10/11
Profile type: Settings catalog
Settings:
  - Silently move Windows known folders to OneDrive: Enabled
    Tenant ID: [AAD Tenant ID]
  - Prevent users from redirecting their Windows known folders to their PC: Enabled
  - Silently sign in users to the OneDrive sync app with their Windows credentials: Enabled
```

**macOS equivalent** (Intune MDM):
```
Payload Type: Custom
Bundle ID: com.microsoft.OneDrive
Key: KFMSilentOptIn: [Tenant ID]
Key: KFMSilentOptInWithNotification: True
```

**Communication to users**: Send a notification 2 weeks before KFM is enforced. Explain what is moving, where it is going, and that files will be accessible from any device. Provide the IT helpdesk number for questions.

## Sharing Policy

OneDrive sharing settings are managed tenant-wide in SharePoint admin center and can be restricted per user via sensitivity labels or Intune policy.

**Recommended settings for insurance and financial services**:

| Setting | Recommended Value | Rationale |
|---------|------------------|-----------|
| External sharing | New and existing guests | Allows client document exchange with authentication |
| Default link type | Specific people | Prevents accidental broad sharing |
| Expiration for guest links | 14 days | Limits lingering external access |
| Expiration for "anyone" links | Disabled — "Anyone" links blocked | Regulatory requirement |
| Guest access to files | Requires Microsoft/Google account | No anonymous access |
| Storage per user | 1 TB (Microsoft 365 default) | |

**Exceptions process**: If a specific user or team requires external sharing beyond the default (e.g., a legal team sharing documents with outside counsel), document the exception, the business justification, and the duration. Implement via a dedicated SharePoint document library with external sharing enabled, rather than loosening OneDrive tenant policy.

**Approved external domains**: Maintain a list of approved external domains in SharePoint admin center > Policies > Sharing > Limit external sharing to specific domains. Include only carrier, TPA, and known partner domains. Do not add client personal email domains to the allowlist.

## Sync Client Configuration

Manage OneDrive sync client behavior via Intune or Group Policy:

| Setting | Value | Notes |
|---------|-------|-------|
| Selective sync enabled | Yes | Users choose which SharePoint libraries to sync — do not force-sync all |
| Block syncing of specific file types | .exe, .bat, .ps1 | Prevent executable sync |
| Upload bandwidth throttling | Automatic | Prevent OneDrive from consuming all bandwidth during business hours |
| Files On-Demand | Enabled | Files appear in Explorer without consuming local storage until opened |
| Co-authoring | Enabled | Multiple users can edit Office documents simultaneously |

**Maximum sync path length**: Configure registry key `HKLM\SOFTWARE\Microsoft\OneDrive\MaxSyncedFileNameLength = 255` if users have deeply nested folder structures that exceed Windows path limits.

## Retention Policy for Departed Employees

When a user leaves the firm, their OneDrive data must be retained for the regulatory period before deletion:

**30-day preservation window**:
1. On user offboarding, add the account to the "Offboarded Staff" retention group
2. Transfer secondary owner: Assign the departed user's manager as secondary owner of their OneDrive. Manager receives email with link.
3. Block external sharing immediately upon offboarding

**Manager access duration**: Manager retains access for 30 days to retrieve work files. After 30 days, access is removed and the account enters preservation.

**Preservation period**: Apply the applicable retention label based on role:
- Regulated roles (broker-dealer, insurance producer): 7 years before deletion
- Non-regulated staff: 3 years before deletion
- Apply via Microsoft Purview Data Lifecycle Management policy targeting the departed user's OneDrive

**Deletion process**: After the retention period expires, an IT admin reviews the account via the Purview Data Lifecycle dashboard and initiates deletion. Document the deletion with a record: user name, date departed, retention period applied, date of deletion, authorized by.

## Storage Quota Management

**Per-user quota**: 1 TB by default for Microsoft 365 E3/E5. Increase to 5 TB for users who manage large media files (marketing, training). Managed in SharePoint admin center > Active sites > [User OneDrive site] > Storage.

**Quota monitoring**:
- Alert when user reaches 85% of quota: Automated email to user and IT
- Alert when user reaches 95%: IT reviews and either extends quota or assists with archiving
- Monthly report: Export all users at >80% quota for proactive management

**SharePoint Online storage pool**: Monitor tenant-wide storage usage (SharePoint admin center > Reports > Storage). Add storage in 1 TB increments when within 20% of pool limit.

## File Naming and Compliance

**PII in file names**: Train users that file names containing Social Security Numbers, account numbers, or dates of birth are prohibited. Configure Microsoft Purview Data Loss Prevention to alert when a file named with a pattern matching SSN format (`\d{3}-\d{2}-\d{4}`) is uploaded to OneDrive. DLP rule action: generate alert, do not block (to avoid workflow disruption; enforce training instead).

**Executable files**: Block upload of .exe, .bat, .cmd, .ps1, .vbs files via Intune MDM policy and SharePoint / OneDrive block download policy. These file types have no legitimate storage purpose in client file management OneDrives.

## Output Format

Deliver as:

1. Folder structure templates per role type (formatted directory tree)
2. File naming convention guide (one-page reference for end users)
3. KFM Intune configuration profile specification
4. Sharing policy table with values and rationale
5. Sync client configuration table
6. Offboarding and data retention procedure (numbered steps)
7. Storage quota management policy
8. User communication templates (KFM rollout announcement, offboarding data access notice)
9. IT implementation checklist (what to configure in SharePoint admin center, Intune, and Purview before rollout)
