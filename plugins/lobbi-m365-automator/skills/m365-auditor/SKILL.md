---
description: Design Microsoft 365 audit log query specifications and compliance reporting for FINRA, state insurance examiner, and internal audit requirements in financial services tenants.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# M365 Auditor

Produce a Microsoft 365 audit specification that covers audit log query design, report templates, alert rules, and retention configuration for financial services compliance requirements. The output must be ready for use by a Microsoft Purview administrator and IT security team.

## Audit Log Sources and Enablement

Verify and document audit enablement status for each workload:

| Workload | Audit Source | Enable Command |
|----------|-------------|----------------|
| Exchange Online | Microsoft Purview Audit | Enabled by default for E3/E5 |
| SharePoint Online | Microsoft Purview Audit | Enabled by default |
| Microsoft Teams | Microsoft Purview Audit | Enabled by default |
| Azure AD / Entra ID | Microsoft Purview Audit | Enabled by default |
| Power Platform | Microsoft Purview Audit | Must be enabled per environment |
| Microsoft Defender for O365 | Defender portal | Separate configuration |

**Audit log retention tier**:

| License | Retention Period | Coverage |
|---------|-----------------|----------|
| E3 or Business Premium | 90 days | Standard audit |
| E5 | 1 year | Standard + advanced audit |
| Microsoft Purview Audit (Premium) add-on | 1 year or 10 years | Advanced audit events |

For FINRA-regulated broker-dealers: 10-year retention add-on is required for broker communications (FINRA Rule 17a-4). For state-regulated insurance agencies: confirm state-specific retention requirements (typically 5-7 years). Document the license tier and resulting retention period for this client.

## Key Audit Event Categories

### User Authentication and Identity

Events to capture and review:

| Operation | Description | Risk Signal |
|-----------|-------------|-------------|
| UserLoggedIn | Successful sign-in | Baseline — look for anomalous locations |
| UserLoginFailed | Failed sign-in | >5 failures = potential brute force |
| MFADenied | MFA challenge denied | User denying legitimate login |
| UserPasswordChanged | Password change | Verify it was user-initiated |
| Set-MsolUserPassword | Admin password reset | Privilege action — must be logged |
| Add member to role | Role assignment | Any admin role grant requires review |
| Remove member from role | Role removal | Ensure it was authorized offboarding |

### Document Access and Sharing

| Operation | Description | Risk Signal |
|-----------|-------------|-------------|
| FileAccessed | File opened or downloaded | Baseline — look for bulk access |
| FileDownloaded | File downloaded to device | >50 files in 1 hour = alert |
| SharingInvitationCreated | External share initiated | Any sharing outside approved domains |
| AnonymousLinkCreated | Anyone link created | Should be blocked by policy — if seen, alert |
| FileDeleted | File deleted | Bulk deletion (>20 files) = alert |
| FileModified | File edited | Useful for content audit trails |

### Email Activity

| Operation | Description | Risk Signal |
|-----------|-------------|-------------|
| Send | Email sent | High volume from single user |
| SendAs | Email sent as another identity | Any occurrence warrants review |
| HardDelete | Email permanently deleted | During investigation period = alert |
| MessageForwardingRuleEnabled | Auto-forward rule created | External auto-forward = data exfiltration risk |
| New-InboxRule | New inbox rule | Check destination for external address |

### Teams Activity

| Operation | Description | Risk Signal |
|-----------|-------------|-------------|
| TeamCreated | New team created | Verify naming policy compliance |
| MemberAddedToTeam | Member added | External guest added = review |
| ChatMessageSent | Chat message | Keyword detection for compliance |
| FileUploadedToChannel | File uploaded | Large file uploads |
| MeetingRecordingCreated | Recording started | Verify recording policy compliance |

### Admin Configuration Changes

| Operation | Description | Risk Signal |
|-----------|-------------|-------------|
| Set-TransportRule | Mail flow rule changed | All changes require change ticket |
| Set-AdminAuditLogConfig | Audit config changed | Attempt to disable auditing = critical alert |
| New-RoleGroupMember | Admin role granted | Privileged access change |
| Set-RetentionCompliancePolicy | Retention policy changed | Compliance risk |

## Query Design Templates

Provide ready-to-use Search-UnifiedAuditLog PowerShell query templates.

**Weekly security summary query**:
```powershell
# Run every Monday for prior week
$StartDate = (Get-Date).AddDays(-7).ToString("MM/dd/yyyy")
$EndDate = (Get-Date).ToString("MM/dd/yyyy")

# Authentication failures
Search-UnifiedAuditLog -StartDate $StartDate -EndDate $EndDate `
  -Operations "UserLoginFailed" `
  -ResultSize 1000 |
  Select-Object -ExpandProperty AuditData |
  ConvertFrom-Json |
  Select-Object CreationTime, UserId, Operation, ClientIPAddress, UserAgent |
  Export-Csv ".\weekly-auth-failures.csv" -NoTypeInformation

# External sharing events
Search-UnifiedAuditLog -StartDate $StartDate -EndDate $EndDate `
  -Operations "SharingInvitationCreated","AnonymousLinkCreated" `
  -ResultSize 1000 |
  Select-Object -ExpandProperty AuditData |
  ConvertFrom-Json |
  Select-Object CreationTime, UserId, Operation, ObjectId, TargetUserOrGroupName |
  Export-Csv ".\weekly-external-sharing.csv" -NoTypeInformation

# Admin role changes
Search-UnifiedAuditLog -StartDate $StartDate -EndDate $EndDate `
  -Operations "Add member to role.","Remove member from role." `
  -ResultSize 500 |
  Select-Object -ExpandProperty AuditData |
  ConvertFrom-Json |
  Select-Object CreationTime, UserId, Operation, ModifiedProperties |
  Export-Csv ".\weekly-role-changes.csv" -NoTypeInformation
```

**On-demand examination evidence query** (for regulatory examiner requests):
```powershell
# Query specific user activity for examination period
param(
  [string]$UserEmail,
  [string]$StartDate,  # MM/dd/yyyy
  [string]$EndDate     # MM/dd/yyyy
)

$Operations = @(
  "Send","FileAccessed","FileDownloaded","FileDeleted",
  "UserLoggedIn","UserLoginFailed","SharingInvitationCreated"
)

Search-UnifiedAuditLog -StartDate $StartDate -EndDate $EndDate `
  -UserIds $UserEmail `
  -Operations $Operations `
  -ResultSize 5000 |
  Select-Object -ExpandProperty AuditData |
  ConvertFrom-Json |
  Select-Object CreationTime, UserId, Operation, ObjectId, ClientIPAddress, UserAgent |
  Sort-Object CreationTime |
  Export-Csv ".\examination-evidence-$UserEmail.csv" -NoTypeInformation
```

## Report Templates

### Weekly Security Summary

Delivered every Monday. Sections:

1. Authentication overview: Total sign-ins, failed sign-ins by user, MFA events, new IP addresses
2. Sharing activity: External shares initiated, anonymous links (should be zero), external guests added to Teams
3. Privilege changes: Admin role grants and removals, policy changes
4. Anomaly highlights: Any event exceeding alert thresholds from the prior week
5. Open items: Alerts from prior week requiring follow-up

### Monthly Compliance Report

Delivered first business day of each month. Sections:

1. User activity summary: Active users, inactive users (>30 days no sign-in)
2. Data loss prevention: DLP policy match counts by policy, false positive rate
3. External collaboration: External users with active access, external shares, guest users added/removed
4. Retention compliance: Items subject to retention policies, holds applied
5. Admin activity log: All admin actions during the month
6. Incidents: Any security incidents, escalations, or exceptions granted

### Examination Evidence Package

On-demand, per examiner request. Contents:

1. Cover memo: Scope of request, date range, custodians included
2. Email activity export: All sent/received emails for specified users and period (Exchange audit log)
3. Document access log: All file access and sharing events for specified users
4. Communication archive: Teams chat export (requires Microsoft Purview eDiscovery)
5. Chain of custody statement: How data was extracted, who extracted it, what tools were used

## Alert Rules

Configure Microsoft Sentinel or Microsoft Defender for Identity (or equivalent SIEM) to alert on:

| Alert Name | Condition | Severity | Notification |
|-----------|-----------|----------|-------------|
| Bulk file download | >50 files downloaded by one user in 60 minutes | High | Security team email + Teams post |
| External auto-forward detected | New-InboxRule with external forward destination | Critical | Immediate page to security lead |
| Anonymous link created | AnonymousLinkCreated operation detected | High | Security team email |
| Admin role granted | Add member to role (any admin role) outside change window | Medium | IT manager email |
| Audit config changed | Set-AdminAuditLogConfig | Critical | Immediate page — auditing may be compromised |
| Login from new country | User authenticates from country not in baseline | Medium | User notification + security team |
| Multiple failed MFA | >3 MFA failures for one user in 30 minutes | High | Security team email |
| Mass email deletion | >100 emails HardDeleted in 24 hours | High | Security team email |

## Audit Log Retention Configuration

Document the retention configuration to be applied:

```powershell
# Set 10-year audit retention for regulated users (FINRA)
Set-MailboxAuditBypassAssociation -Identity "service@firm.com" -AuditBypassEnabled $false

# Enable mailbox auditing for all users (verify it's on)
Get-Mailbox -ResultSize Unlimited |
  Where-Object {$_.AuditEnabled -eq $false} |
  Set-Mailbox -AuditEnabled $true

# Verify audit log retention tier
Get-AdminAuditLogConfig | Select-Object UnifiedAuditLogIngestionEnabled, AdminAuditLogEnabled
```

For Microsoft Purview Audit (Premium) 10-year retention: Must be assigned per-user via the Compliance portal > Audit > Audit retention policies. Create a policy with 10-year duration and assign to all licensed users in regulated roles.

## Output Format

Deliver as:

1. Audit enablement status table (workload, enabled/not, retention period)
2. Key event catalog organized by category (authentication, document, email, Teams, admin)
3. PowerShell query library (one code block per query template, with usage instructions)
4. Alert rule table with all fields
5. Report templates (one section per report type with exact contents list)
6. Retention configuration steps
7. Regulatory mapping (which specific FINRA rules, state insurance regulations, or internal policies each audit control satisfies)
