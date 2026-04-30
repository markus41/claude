---
name: Harness Code ↔ Linear Bridge
description: This skill should be used when implementing or debugging two-way sync between Linear issues and Harness Code (branches, PRs, deploys, Git Experience, custom approvals, triggers). Activates on "harness sync", "harness bridge", "linear-harness", "harness code linear".
version: 1.0.0
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Harness Code ↔ Linear Bridge

References:
- Harness API: https://apidocs.harness.io/
- Git Experience overview: https://developer.harness.io/docs/platform/git-experience/git-experience-overview/
- Bidir sync setup: https://developer.harness.io/docs/platform/git-experience/gitexp-bidir-sync-setup/
- Triggers: https://developer.harness.io/docs/platform/triggers/triggers-overview/
- Custom approvals: https://developer.harness.io/docs/platform/approvals/custom-approvals/
- Connectors via YAML: https://developer.harness.io/docs/platform/connectors/create-a-connector-using-yaml/
- Tags: https://developer.harness.io/docs/platform/tags/

## Architecture

```
┌──────────────┐   webhook   ┌──────────────┐   webhook   ┌────────────┐
│   Linear     │───────────▶ │ Bridge HTTP  │ ◀──────────│ Harness    │
│   API        │ ◀───────────│   handler    │───────────▶│ Code       │
└──────────────┘  GraphQL    └──────┬───────┘  REST API  └────────────┘
                                    │
                              SQLite state
                              (lib/state.ts)
```

The bridge holds:
- Linear issue ID ↔ Harness PR number
- Linear team ↔ Harness repo
- Linear cycle ↔ Harness pipeline tag
- Last successful sync cursor (per resource type)
- Webhook DLQ entries

## Mapping rules

### Linear Issue → Harness
- **Branch creation** on issue with `branch:` label → `POST /v1/repos/{repo}/branches` with `name = linear/{key}-{slug}`
- **Move to "In Progress"** → if PR exists, mark non-draft via `PATCH /v1/repos/{repo}/pulls/{n}`
- **Move to "Done"** → add label `linear:ready-to-merge` via `POST /v1/repos/{repo}/pulls/{n}/labels`
- **Archived** → close PR

### Harness → Linear Issue
- **PR opened** with `ENG-123` in title → look up issue, link via `attachmentLinkCreate`, set state to "In Review" if currently "In Progress"
- **PR review** changes → comment on issue
- **PR merged** → state to "Done"
- **Deploy succeeded/failed** → comment on issue + apply label `deployed:<env>` or reopen on failure

## Idempotency

Every Harness webhook event has `eventId`. The bridge:
1. Reads `eventId` first
2. Checks SQLite `events_processed` table
3. Inserts on success; on conflict, returns 200 (already processed)

Linear webhooks key off `delivery.id` similarly.

## Reconciliation loop

Every 6h the bridge runs `reconcile()`:
1. Page through Linear issues in mapped teams (last 30 days, via `updatedAt` filter)
2. For each, check linked PR exists in Harness
3. Page through Harness PRs in mapped repos
4. For each PR mentioning a Linear issue, check link exists in Linear
5. Report drift; auto-heal if safe (links only, not state changes)

## Custom approvals as Linear gates

Pattern: Harness pipeline has a Custom Approval step that calls back to the bridge:
```yaml
- step:
    type: CustomApproval
    name: Linear Approval
    spec:
      url: https://your-bridge.example.com/harness/approval
      method: POST
      requestBody: |
        { "issue": "ENG-123", "executionId": "<+execution.id>" }
```
The bridge:
1. Posts a comment on `ENG-123` with `[Approve via Harness] [Reject]` rendered as Linear smart-buttons
2. Waits for the user's reaction (`reactionCreate` event) or the assignee's status change
3. Calls back Harness with `{ "approved": true }` or `{ "rejected": true, "reason": "..." }`

## Tags propagation

Linear labels → Harness tags (1:1, lowercase, hyphenated). On sync the bridge:
- Adds Harness tag `linear:bug` for issues with `bug` label
- Adds Harness tag `linear:p1` for priority 1
- These tags filter pipeline executions, deploy timelines, etc.

## Connector auto-provisioning

On `/linear:setup --mode bridges`, the bridge:
1. Creates a Harness "Custom" connector pointing at the bridge URL
2. Stores Linear API key as a Harness Secret (`linear_api_key`)
3. Generates a YAML connector definition and posts via `POST /ng/api/connectors`
4. Linear reference is now available in pipelines as `<+connectors.linear>`

## Failure modes

| Failure | Behaviour |
|---------|-----------|
| Harness 401 | Refresh token; if still 401 alert and pause bridge |
| Harness 5xx | Backoff up to 3 retries → DLQ |
| Linear rate-limited | Wait for budget reset, retry |
| Webhook signature mismatch | Reject + log + alert (potential attack) |
| State store corruption | Halt bridge, require manual `/linear:harness-sync reconcile --apply` |

## Performance

- Webhook processing target: P95 < 200ms (most work happens async via queue)
- Reconcile job: ~30s for 1k issues + 200 PRs
- Bulk import: paced at 10 ops/sec to stay under both Linear and Harness rate limits
