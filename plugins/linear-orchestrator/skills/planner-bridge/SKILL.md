---
name: Microsoft Planner ↔ Linear Bridge
description: This skill should be used when implementing or debugging two-way sync between Linear issues and Microsoft Planner via Microsoft Graph delta queries. Activates on "planner sync", "planner bridge", "microsoft planner", "graph delta", "tasks.readwrite".
version: 1.0.0
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Microsoft Planner ↔ Linear Bridge

Reference: https://learn.microsoft.com/en-us/graph/api/resources/planner-overview

## Auth

App-only (client credentials) flow:
- `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`
- Token endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- Scopes (admin-consented): `Tasks.ReadWrite.All`, `Group.Read.All`, `User.Read.All`, `Files.ReadWrite.All` (for attachment mirror)

```ts
const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
  method: "POST",
  body: new URLSearchParams({
    client_id, client_secret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default"
  })
});
```

Tokens expire at 60 min; refresh proactively at 50 min.

## Delta queries (efficient incremental sync)

Initial bootstrap:
```
GET /planner/plans/{planId}/tasks/delta
```
Returns first batch + `@odata.nextLink` (for paging) and eventually `@odata.deltaLink` (the cursor).

Subsequent polls:
```
GET <deltaLink>
```
Returns only changed tasks since the last call.

The bridge stores `deltaLink` per plan in `lib/state.ts`. TTL is 30 days; on expiry, full re-bootstrap.

## Mapping table

| Planner field | Linear field |
|---------------|--------------|
| `title` | `title` |
| `details.description` | `description` (markdown) |
| `bucketId` | `state` (via bucket → state map) |
| `assignments` (AAD user IDs) | `assignee` (via email) |
| `dueDateTime` | `dueDate` |
| `percentComplete` | `state` (0=Triage, 50=In Progress, 100=Done) |
| `appliedCategories` | `priority` + first label |
| `details.checklist` | sub-issues (mapped 1:1) |
| `details.references` | attachments (link-only) |

## Sync direction

| Linear → Planner | Planner → Linear |
|------------------|------------------|
| Webhook on `Issue` create/update → POST/PATCH `/planner/tasks/{id}` | Delta poll → GraphQL mutations |
| Webhook on `Comment` create → no direct equivalent; appended to task description with timestamp | Task description change → re-fetch issue, reconcile |
| Webhook on `Reaction` → ignored | Task `appliedCategories` change → label add/remove |

## User mapping

By **email** (case-insensitive). If Linear user's email isn't in AAD, the bridge:
- Logs a warning the first time
- Stores the mapping as "unmapped"
- On Planner side, leaves task unassigned

`GET /users?$filter=mail eq 'alice@acme.com'` returns the AAD user. Cache in SQLite for 24h.

## Sub-issue ↔ checklist

Planner has no real sub-tasks. Linear sub-issues map to entries in `details.checklist` (max 20 per task). The bridge:
- Creates a checklist entry per sub-issue
- Maintains the link via `customAttributes` on the Planner side
- On checklist toggle (`isChecked: true`), transitions the corresponding Linear sub-issue to "Done"

## Priority encoding

Planner has 4 priority slots (1-10 mapped to "Urgent", "Important", "Medium", "Low"). Linear's 5 levels (None, Urgent, High, Medium, Low) collapse to:
- Linear None → Planner 5 (Medium)
- Linear Urgent → Planner 1 (Urgent)
- Linear High → Planner 3 (Important)
- Linear Medium → Planner 5 (Medium)
- Linear Low → Planner 9 (Low)

Plus an `appliedCategory` for color coding (red/orange/yellow/green/blue).

## Cycle / project encoding

Planner has no cycle concept. The bridge encodes cycle membership in the task title prefix:
- `[Cycle: Sprint 23] Fix login bug`

A bridge utility re-titles tasks on cycle transitions (`updateCycle` webhook).

Linear projects map to Planner **plans**: one Linear project ↔ one Planner plan. The mapping is stored in plugin state; users configure via `/linear:planner-sync map`.

## Attachments

When a Linear issue's attachment is uploaded:
1. Bridge fetches the asset bytes (auth via `Authorization: Bearer <linear_key>`)
2. Uploads to OneDrive/SharePoint via `PUT /drives/{driveId}/items/{path}:content`
3. Adds reference to Planner task: `PATCH /planner/tasks/{id}/details` setting `references["<onedrive-url>"]`

For Planner → Linear, references are link-only attachments (no byte copy).

## Throttling

Microsoft Graph: 600 reqs / 30s per app per tenant. Bridge implements:
- Token bucket (capacity 600, refill 20/s)
- Retry on 429 / 503 with `Retry-After` header
- Backoff up to 3 attempts → DLQ

## Failure modes

| Failure | Behaviour |
|---------|-----------|
| Graph 401 | Refresh token; on second 401, pause bridge + alert |
| Graph 403 | Likely missing admin consent on scope; alert with required scope name |
| Graph 429 | Honor `Retry-After`, backoff |
| Delta token expired | Re-bootstrap (full scan) |
| AAD user not found | Skip assignment, log warning |
| Planner plan deleted | Disable mapping; preserve historic links |

## Limitations

- Planner has no native @-mentions in task descriptions — Linear mentions render as plain `@email`
- Planner doesn't support markdown — descriptions are plain text. The bridge strips markdown on outbound and converts inbound to literal text (preserving links).
- Planner caps tasks per plan at 7,500 — bridge alerts at 90% capacity.
- Planner doesn't track activity history — bridge keeps its own audit trail in SQLite.
