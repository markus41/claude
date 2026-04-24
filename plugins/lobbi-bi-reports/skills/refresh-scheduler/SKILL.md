---
description: Design Power BI dataset refresh scheduling, on-premises gateway configuration, and failure alerting to ensure dashboards display current data for operational decision-making.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Refresh Scheduler

Produce a complete Power BI refresh schedule and gateway configuration specification. Every dataset in the Power BI workspace gets an explicit refresh schedule, failure alerting configuration, and gateway assignment. No dataset is left with default settings.

## Refresh Frequency Selection

Choose the refresh frequency based on how often the data changes and how stale data would be tolerated:

| Report Type | Recommended Refresh | Maximum Staleness | Mode |
|------------|--------------------|--------------------|------|
| Executive dashboard (monthly KPIs) | Daily at 6 AM | 24 hours | Import |
| Operational report (daily pipeline review) | Every 3 hours during business hours | 3 hours | Import |
| Real-time operations (claims intake, loan status) | DirectQuery (no refresh needed) | Near-real-time | DirectQuery |
| Weekly management report | Sunday night at 11 PM | 7 days | Import |
| Monthly board report | 1st of month at 4 AM | 1 month | Import |

**Business hours constraint**: Schedule refreshes at off-peak hours to avoid competing with user report access and database peak load.
- Pre-business hours refresh: 5–7 AM (reports ready when staff arrive)
- Midday refresh: 12 PM (lunch-hour data update for afternoon reviews)
- After-hours refresh: 8–10 PM (data loaded overnight from batch systems)

**Maximum refreshes per day**: Power BI Pro supports 8 refreshes per day per dataset. Power BI Premium supports 48 per day. Plan the schedule within these limits.

## Dataset Refresh Schedule

Define a refresh schedule for every dataset in the workspace:

| Dataset Name | Refresh Frequency | Times (ET) | Days | Max Retries | Notes |
|-------------|------------------|-----------|------|-------------|-------|
| Agency Production Dashboard | Daily | 6:00 AM | Mon–Sun | 3 | Depends on AMS nightly batch completing by 4 AM |
| Claims Operations | Every 3 hours | 6AM, 9AM, 12PM, 3PM, 6PM | Mon–Fri | 2 | No weekend refresh — claims staff not working |
| Renewal Pipeline Tracker | Daily | 5:30 AM | Mon–Fri | 3 | Weekends not needed |
| Monthly Board Report | Monthly | 4:00 AM | 1st of month | 3 | Run manually if 1st falls on weekend |
| Producer Scorecard | Daily | 6:00 AM | Mon–Fri | 3 | |
| KPI Targets Dataset | On-demand | Manual | N/A | 1 | Targets updated by Finance monthly — manual trigger |

**Timezone**: All schedules are entered in the dataset's configured timezone. Set the dataset timezone in Power BI Service > Settings > Datasets > Scheduled refresh > Time zone. Use the firm's primary timezone (e.g., US Eastern).

## On-Premises Data Gateway Configuration

Required for any dataset connecting to: SQL Server (on-premises), local file shares, SharePoint on-premises, or any source behind the corporate firewall.

**Gateway cluster architecture**:

```
Gateway Cluster: [FirmName]-PBI-Gateway-Cluster
  Primary node: [server-name-1] (active)
  Secondary node: [server-name-2] (standby — failover)
```

Use a two-node cluster for high availability. If the primary node fails, Power BI automatically routes to the secondary node with no interruption.

**Server requirements**:
- OS: Windows Server 2019 or 2022
- RAM: Minimum 8 GB (16 GB recommended for > 5 concurrent datasets refreshing)
- CPU: 4 cores minimum
- Network: Must have outbound HTTPS to `*.servicebus.windows.net` on port 443 and 5671/5672
- Disk: 10 GB free space (for temp files during large refreshes)
- Location: Same network segment as the SQL Server or data sources. Do not install on the SQL Server itself.

**Gateway service account**:
- Create a dedicated service account: `svc-pbi-gateway@[firm].com` or local service account
- Permissions: Read access to the SQL Server databases used by Power BI
- Domain joined: Yes — gateway must be domain-joined to authenticate to on-premises SQL
- Do not run the gateway as a local admin or personal user account

**Gateway installation checklist**:
- [ ] Download gateway installer from `https://go.microsoft.com/fwlink/?LinkId=2116849`
- [ ] Install as on-premises data gateway (not personal mode)
- [ ] Sign in with the Power BI service account (must have Power BI Pro or PPU license)
- [ ] Register the gateway in the target Azure region
- [ ] Add the secondary node using the same Recovery Key from the primary installation
- [ ] Configure the gateway service to run as the dedicated service account

**Data source credentials in the gateway**:

| Data Source | Connection String | Authentication | Credential Owner |
|-------------|-----------------|----------------|-----------------|
| AMS SQL Server | Server=[ams-server]; Database=[AMSProd] | Windows Auth (service account) | IT Admin |
| Reporting SQL View | Server=[rpt-server]; Database=[Reports] | SQL Auth (separate read-only user) | IT Admin |

Credentials are stored encrypted in the gateway. Rotate SQL Auth passwords every 90 days and update the gateway data source credentials in Power BI Service > Manage Connections and Gateways.

## Failure Alerting

Configure alerts so refresh failures are caught and addressed before stakeholders notice stale data.

**Alert channels**:
1. Power BI Service email notification: Enabled for all datasets. Sends to the dataset owner.
2. Microsoft Teams notification: Power Automate flow posts to the IT Operations Teams channel when any dataset refresh fails.
3. Escalation: If the same dataset fails 3 consecutive refreshes, an escalation email goes to the BI lead and department manager.

**Power BI Service email configuration**:
For each dataset in Power BI Service > Settings > Scheduled refresh:
- Send refresh failure notifications to: Dataset owner (auto) + add `bi-support@[firm].com`

**Power Automate failure alert flow** (build this flow):
```
Trigger: Power BI — Refresh a dataset (status trigger)
  When dataset refresh fails:

Action 1: Post to Teams channel
  Team: IT Operations
  Channel: BI-Alerts
  Message: 
    "Dataset refresh FAILED:
    Dataset: @{triggerOutputs()?['body/datasetName']}
    Workspace: @{triggerOutputs()?['body/workspaceName']}
    Failure time: @{triggerOutputs()?['body/refreshStartTime']}
    Error: @{triggerOutputs()?['body/serviceExceptionJson']}
    Action required: Check gateway status and data source connectivity."

Action 2: Send email
  To: bi-support@[firm].com
  Subject: [ACTION REQUIRED] Power BI Refresh Failure — @{triggerOutputs()?['body/datasetName']}
  Body: [Same details as Teams message with link to the dataset settings page]
```

**Alert on repeated failures** (add to the flow):
```
Condition: If consecutive failure count > 3
  (Track failure count in SharePoint list: DatasetName, FailureCount, LastFailureTime)
  Then: Also send email to bi-lead@[firm].com and [department manager email]
```

## Dataflow Refresh Design

If Power BI dataflows are used (recommended for shared transformation logic):

**Dataflow refresh must complete before dependent dataset refresh**:
```
Refresh sequence:
  1. Dim_Clients dataflow — 5:00 AM (runtime ~5 min)
  2. Dim_Producers dataflow — 5:00 AM (parallel with Dim_Clients)
  3. Fact_Policies dataflow — 5:10 AM (after dimensions complete)
  4. Agency Production dataset — 5:45 AM (after all dataflows complete, buffer 25 min)
  5. Producer Scorecard dataset — 5:45 AM (parallel with step 4)
```

**Configure dataflow enhanced refresh**: In Premium workspaces, use the Enhanced Refresh API to trigger dataset refreshes programmatically after the dataflow completes, instead of relying on scheduled time buffers.

## Programmatic Refresh (Premium / XMLA)

For Power BI Premium workspaces, use the REST API to trigger refresh programmatically instead of relying on scheduled times:

**POST refresh via REST API** (called from Power Automate or Azure Data Factory):
```
POST https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/datasets/{datasetId}/refreshes
Authorization: Bearer {service principal token}
Content-Type: application/json

{
  "notifyOption": "MailOnFailure",
  "type": "Full",
  "commitMode": "transactional",
  "objects": [
    { "table": "Fact_Policies" }
  ]
}
```

Use this pattern to: trigger a refresh immediately after the AMS nightly batch job completes (not at a fixed time), avoid unnecessary refreshes when source data has not changed, and control the refresh order precisely.

**Check refresh status** (poll until complete):
```
GET https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/datasets/{datasetId}/refreshes?$top=1
```

## Output Format

Deliver as:

1. Dataset refresh schedule table (all datasets with frequency, times, days, retry count)
2. Gateway cluster specification (server names, requirements, service account)
3. Data source credentials table (source, connection string, auth type)
4. Failure alerting configuration (email + Teams flow specification)
5. Dataflow refresh sequencing diagram (if dataflows are used)
6. Programmatic refresh API spec (if Premium workspace)
7. Monitoring dashboard spec (what to show on an IT operations screen: last refresh time, next scheduled refresh, success/failure count for trailing 7 days)
8. Post-deployment checklist (verify gateway is online, test-trigger each dataset manually, verify failure alert fires)
