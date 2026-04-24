---
description: Design automated Power BI report distribution workflows via email and Microsoft Teams for scheduled delivery to executives and operational managers who do not log into Power BI directly.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Report Distributor

Produce a complete automated report distribution specification. Every report that must be delivered to stakeholders who do not access Power BI directly gets an explicit delivery mechanism, schedule, recipient list, and archive process.

## Delivery Channel Selection

Choose the delivery channel based on the recipient and the report's purpose:

| Scenario | Recommended Channel | Why |
|----------|--------------------|----|
| Executive wants PDF snapshot in email inbox | Power BI subscription (email with PDF attachment) | Simple, no technical setup, recipient needs no Power BI license |
| Team reviews report in weekly standup | Teams channel post (via Power Automate + export API) | Report appears in the channel where discussion happens |
| Report posted to SharePoint for reference | Power Automate → export PDF → save to SharePoint library | Creates an auditable archive alongside other business documents |
| Alert only when a threshold is breached | Power Automate conditional distribution | Prevents report fatigue — only sends when action is needed |
| External parties (carriers, regulators) | Export PDF via Power Automate → send from shared mailbox | Keeps a copy in the mailbox, uses firm email identity |

## Power BI Subscriptions (Email Delivery)

Native Power BI subscriptions are the simplest delivery mechanism. No code required.

**Configuration** (in Power BI Service > Report > Subscribe to report):

| Field | Value |
|-------|-------|
| Subject | [Report Name] — [Frequency] Report — {Report Page} |
| To | Recipient email addresses (comma-separated, max 50) |
| Frequency | Daily / Weekly / After data refresh |
| Time | Specify time in the report's timezone |
| Include attachment | PDF (recommended for archival) or PowerPoint |
| Link to report | Yes — include the clickable link |
| Start date | [Go-live date] |
| End date | Leave blank (ongoing) |

**Subscription matrix** (one row per subscription):

| Report | Page | Recipients | Frequency | Time (ET) | Attachment |
|--------|------|-----------|-----------|-----------|------------|
| Agency Production Dashboard | Executive Summary | Principal, VP Operations | Weekly | Monday 7:00 AM | PDF |
| Agency Production Dashboard | Producer Detail | Sales Manager | Weekly | Monday 7:00 AM | PDF |
| Claims Operations | Claims Summary | Claims Manager, Operations Director | Daily | 7:30 AM | PDF |
| Monthly Board Report | All pages | Board members DL | Monthly | 1st of month 7:00 AM | PDF |
| Renewal Pipeline | My Renewals | All producers (individual subscription per producer) | Daily | 8:00 AM | Link only (RLS personalizes the view) |

**Limitation of built-in subscriptions**: All recipients of a single subscription see the same data snapshot, regardless of their RLS role. For role-personalized content (each producer sees only their data), use one subscription per producer OR use the Power Automate export API with per-user embed tokens.

**License requirement**: Subscription sender must have Power BI Pro. Recipients do not need Power BI licenses to receive the email and PDF attachment.

## Power Automate Distribution Flow

Use Power Automate when: you need to export and send with conditional logic, attach the PDF to a shared mailbox thread, post to Teams, or trigger based on a threshold rather than a schedule.

**Flow specification — Weekly Operations Report**:

```
Flow name: Distribute Weekly Operations Report
Flow type: Scheduled cloud flow
Frequency: Weekly — every Monday at 6:30 AM ET

Step 1: Get report embed token
  Connector: HTTP
  Method: POST
  URI: https://api.powerbi.com/v1.0/myorg/groups/{env:WorkspaceId}/reports/{env:ReportId}/GenerateToken
  Authentication: Service principal (client credentials)
  Body: { "accessLevel": "View" }
  Output: embedToken (from response body)

Step 2: Export report to PDF
  Connector: HTTP
  Method: POST
  URI: https://api.powerbi.com/v1.0/myorg/groups/{env:WorkspaceId}/reports/{env:ReportId}/ExportTo
  Body: {
    "format": "PDF",
    "powerBIReportConfiguration": {
      "pages": [{ "pageName": "ExecutiveSummary" }, { "pageName": "ProducerDetail" }]
    }
  }
  Output: exportId (from response)

Step 3: Poll until export complete
  Do until exportStatus = "Succeeded"
    Delay: 10 seconds
    GET export status: /reports/{reportId}/exports/{exportId}
  Output: fileContent URL

Step 4: Get PDF file content
  Connector: HTTP
  Method: GET
  URI: [fileContent URL from Step 3]
  Output: pdfBytes

Step 5: Send email with PDF attachment
  Connector: Office 365 Outlook
  From: operations@[firm].com (shared mailbox — Send As)
  To: [environment variable: WeeklyReportDL]
  Subject: Weekly Operations Report — @{formatDateTime(utcNow(), 'MMMM d, yyyy')}
  Body: [Template — see below]
  Attachment name: Weekly-Operations-Report-@{formatDateTime(utcNow(), 'yyyy-MM-dd')}.pdf
  Attachment content: pdfBytes

Step 6: Save copy to SharePoint
  Connector: SharePoint
  Action: Create file
  Site: [operations site URL]
  Folder: /Reports/Weekly-Operations/[Year]
  File name: Weekly-Operations-@{formatDateTime(utcNow(), 'yyyy-MM-dd')}.pdf
  File content: pdfBytes

Step 7: Post to Teams channel
  Connector: Microsoft Teams
  Team: Operations
  Channel: Management-Reports
  Message: "Weekly Operations Report for week ending @{formatDateTime(utcNow(), 'MMM d')} is ready. PDF attached to this week's email distribution. [View live report]({env:ReportURL})"
```

**Email body template**:
```
Subject: Weekly Operations Report — [Date]

[Firm Name] — Weekly Operations Summary

Report period: [Start Date] through [End Date]

This week's report is attached as a PDF. Key sections:
• Executive Summary — Production vs. target, retention snapshot
• Producer Detail — Individual producer performance
• Open Items — Renewals due next 30 days, claims requiring attention

To view the live interactive report, click here: [Report URL]

Questions? Contact [Operations Manager name] or reply to this email.

This report is generated automatically every Monday morning. 
Report data last refreshed: [Last refresh time from dataset]
```

## Conditional Distribution

Send the report only when a specific condition is met (e.g., a KPI falls below threshold):

**Flow specification — Claims Alert**:

```
Flow name: Send Claims Alert When Threshold Exceeded
Flow type: Scheduled — daily at 8:00 AM

Step 1: Get KPI value from dataset
  Connector: Power BI
  Action: Run a query against a dataset (DAX)
  Workspace: [workspace]
  Dataset: Claims Operations
  DAX query: 
    EVALUATE
    ROW(
      "OpenClaimsOver60Days", CALCULATE([Open Claim Count], Fact_Claims[DaysOpen] > 60)
    )
  Output: OpenClaimsOver60Days value

Step 2: Condition
  If OpenClaimsOver60Days > 10:
    Step 2a: Export report page to PDF (claims aging page only)
    Step 2b: Send email to Claims Manager and Director
      Subject: [ATTENTION] @{OpenClaimsOver60Days} claims over 60 days — review required
      Body: As of today, @{OpenClaimsOver60Days} claims have been open for more than 60 days. 
            This exceeds the threshold of 10. The aging report is attached.
      Attachment: Claims aging PDF

  Else:
    Step 2c: No action (do not send)
    [Optional: Log "no alert needed" to SharePoint list for audit trail]
```

## Recipient Management

Maintain distribution lists in a SharePoint list rather than hardcoding email addresses in flows:

**SharePoint list: Report Distribution List**

| Column | Type | Example |
|--------|------|---------|
| ReportName | Text | Weekly Operations Report |
| RecipientEmail | Text | jsmith@acmeins.com |
| RecipientRole | Text | Principal |
| Active | Boolean | Yes |
| StartDate | Date | 2026-01-01 |
| EndDate | Date | (blank = ongoing) |

**Flow modification**: In Step 5 (send email), instead of a hardcoded "To" address, use:
```
Get items from SharePoint: ReportDistributionList
Filter: ReportName = "Weekly Operations Report" AND Active = "Yes" AND StartDate <= Today AND (EndDate = blank OR EndDate >= Today)
To: Join(Select(items, 'RecipientEmail'), ';')
```

This allows Operations to add and remove recipients by editing a SharePoint list — no flow editing required.

## Report Snapshot Archiving

Every automatically distributed report is saved to SharePoint for historical reference:

**Archive folder structure**:
```
SharePoint: Operations Site
  /Reports
    /Weekly-Operations
      /2026
        Weekly-Operations-2026-04-07.pdf
        Weekly-Operations-2026-04-14.pdf
    /Monthly-Board
      /2026
        Board-Report-2026-04-01.pdf
    /Claims-Alerts
      /2026
        Claims-Alert-2026-04-15.pdf
```

**Naming convention**: `[ReportType]-[YYYY-MM-DD].pdf`

**Retention**: Apply the SharePoint retention label `Management-Reports-7yr` to the `/Reports` library. This satisfies state insurance examination requests for historical performance data.

## Output Format

Deliver as:

1. Delivery channel selection rationale (one paragraph per report explaining why the channel was chosen)
2. Power BI subscription matrix (full table with all subscriptions)
3. Power Automate flow specifications (one section per flow, using the step-template format)
4. Email body templates (one per report type)
5. Conditional distribution logic (threshold values and alert criteria)
6. Recipient management SharePoint list schema
7. Archive folder structure
8. License and permission requirements (who needs what Power BI license for each delivery mechanism)
9. Testing checklist (send test distribution to IT team, verify PDF renders correctly, verify SharePoint archive saves, verify Teams post appears)
