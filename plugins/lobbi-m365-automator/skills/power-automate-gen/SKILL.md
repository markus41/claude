---
description: Design Power Automate flow specifications for business process automation including approvals, document routing, notifications, and M365 system synchronization.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Power Automate Generator

Produce a complete Power Automate flow specification. The output must be precise enough that a Power Platform developer can build the flow without clarification calls. Make all decisions explicitly — do not present alternatives.

## Flow Type Selection

Choose the flow type based on what starts the process:

| Trigger Category | Flow Type | When to Use |
|-----------------|-----------|-------------|
| Something happens in a system | Automated cloud flow | SharePoint item changes, email received, Teams message, form submitted |
| A person starts it manually | Instant cloud flow | Button in Teams/SharePoint, mobile trigger, manual data entry |
| Time-based | Scheduled cloud flow | Nightly sync, weekly report, monthly archive |
| External system calls in | Automated (HTTP trigger) | Webhook receiver, API-triggered process |

## Trigger Specification

Document the trigger with full configuration:

**SharePoint triggers**:
- Connector: SharePoint
- Action: "When an item is created" OR "When an item is created or modified"
- Site Address: Full SharePoint site URL
- List Name: Exact list display name
- Trigger condition (to avoid unnecessary runs): `@not(equals(triggerOutputs()?['body/Status/Value'], 'Archived'))`

**Email triggers**:
- Connector: Office 365 Outlook
- Action: "When a new email arrives (V3)"
- Folder: Inbox (or specific subfolder path)
- Filter: From address, subject contains, has attachments
- Include attachments: Yes/No

**Form submission triggers**:
- Connector: Microsoft Forms
- Action: "When a new response is submitted"
- Form ID: Name of the form (resolved to ID at build time)

**Scheduled triggers**:
- Frequency: Daily / Weekly / Monthly
- Start time: Specify time and timezone (e.g., 02:00 AM Eastern)
- Day of week (if weekly): Specify day

**HTTP request triggers**:
- Method: POST
- Authentication: API Key in header (key name: `X-API-Key`) OR OAuth (specify scope)
- Expected JSON schema: Document all expected fields with types

## Action Sequence

Design the complete action sequence. Number each step. Group related steps in a Scope action for error handling.

**Step template**:

```
Step N: [Action Name]
  Connector: [Connector name]
  Action: [Exact action name as shown in Power Automate]
  Inputs:
    - [Parameter]: [Value or dynamic content reference]
    - [Parameter]: [Value or dynamic content reference]
  Output stored as: [Variable or referenced downstream as...]
  Notes: [Any important configuration detail]
```

**Common action patterns for insurance and financial services**:

*Get related record*:
```
Step 2: Get client record from SharePoint
  Connector: SharePoint
  Action: Get item
  Site: [Site URL]
  List: Clients
  Id: [triggerOutputs()?['body/ClientID']]
```

*Send notification*:
```
Step 3: Post Teams notification
  Connector: Microsoft Teams
  Action: Post message in a chat or channel (V3)
  Post as: Flow bot
  Post in: Channel
  Team: [Team ID]
  Channel: [Channel ID]
  Message: New [item type] submitted by @{triggerOutputs()?['body/Author/DisplayName']} — [link]
```

*Send for approval*:
```
Step 4: Start approval
  Connector: Approvals
  Action: Start and wait for an approval (V2)
  Approval type: [See Approval Workflow Design section]
  Title: [Descriptive title with dynamic content]
  Assigned to: [Email addresses or dynamic content]
  Details: [Formatted details block]
  Item link: [Direct URL to the SharePoint item or Teams message]
  Item link description: View item
```

## Approval Workflow Design

Choose approval type based on business requirement:

| Approval Type | Use When |
|---------------|----------|
| First to respond | Any one approver's decision is sufficient (e.g., manager group) |
| Everyone must approve | All listed approvers must approve (e.g., dual-control for financial transactions) |
| Sequential | Approvers must respond in order (e.g., manager then director) — use multiple chained approvals |

**Approval configuration**:
- **Title**: `[Document Type] Approval Request — [Client Name] — [Date]`
- **Assigned to**: Specify either a fixed email, a dynamic field from the trigger, or an environment variable (for configurable approver lists)
- **Details**: Include all information the approver needs without leaving the approval card: what is being approved, requestor, key data points, links
- **Timeout**: Set the flow to send a reminder at 24 hours. If no response at 48 hours, escalate to secondary approver.

**Approval response handling**:

```
Condition: Approval outcome
  If Approve:
    Step A: Update SharePoint item Status to "Approved"
    Step B: Send confirmation email to requestor
    Step C: [Next business process step]
  If Reject:
    Step A: Update SharePoint item Status to "Rejected"
    Step B: Send rejection email to requestor with comments from approver
    Step C: Create Teams notification in manager channel
```

## Error Handling

Wrap the main action sequence in a Scope named "Try". Add a second Scope named "Catch" configured to run on failure of the Try scope.

**Catch scope contents**:
```
Step C1: Send failure notification email
  To: [IT admin email or DL]
  Subject: Flow failure: [Flow name] — [Timestamp]
  Body: 
    Flow: [Flow name]
    Run ID: @{workflow()?['run']?['name']}
    Error: @{result('Try')?[0]?['error']?['message']}
    Trigger data: [Key fields from trigger]

Step C2: Update item Status to "Error — Manual Review Required"
  [Only if a SharePoint item is involved]
```

**Configure Scope "Catch" run-after settings**: Check "has failed" and "has timed out" for the Try scope.

## Environment Variables

List all values that vary between environments (development, test, production) or between client deployments:

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| SiteUrl | String | SharePoint site URL | https://[tenant].sharepoint.com/sites/[site] |
| ApproverEmail | String | Primary approver email address | manager@firm.com |
| NotificationTeamId | String | Teams team GUID | [resolved at deploy time] |
| NotificationChannelId | String | Teams channel GUID | [resolved at deploy time] |

Use environment variables in all connector configurations — never hardcode URLs, email addresses, or IDs.

## Connection References

List all connection references the flow requires. One connection reference per connector. These are separate from environment variables:

| Connection Reference | Connector | Runs As |
|---------------------|-----------|---------|
| SharePoint-ServiceAccount | SharePoint | Service account (not user) |
| Outlook-Notifications | Office 365 Outlook | Service account |
| Teams-Bot | Microsoft Teams | Flow bot (no personal account) |
| Approvals-Service | Approvals | [Requesting user] |

Use service accounts for connectors that run automated actions. Use [requesting user] only for actions that must be attributed to the person who triggered the flow.

## Output Format

Deliver as:

1. Flow summary (one paragraph: what it does, when it runs, who is involved)
2. Trigger specification table
3. Action sequence (numbered steps using the template above)
4. Approval configuration (if applicable)
5. Error handling specification
6. Environment variable table
7. Connection reference table
8. Testing checklist (what scenarios to test before go-live: happy path, rejection path, timeout, missing data, error path)
9. Known limitations or manual steps required after flow runs
