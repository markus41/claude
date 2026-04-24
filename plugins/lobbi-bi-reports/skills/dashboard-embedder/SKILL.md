---
description: Design embedded analytics integration specifications for embedding Power BI dashboards in SharePoint pages, Power Apps, Teams tabs, and custom web portals.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Dashboard Embedder

Produce a complete embedded analytics specification for surfacing Power BI reports inside a client application. The choice of embedding approach, authentication design, and RLS configuration is made explicitly based on the embedding context provided.

## Embedding Context Selection

Identify the embedding context and select the approach:

| Context | Approach | Complexity | License Required |
|---------|----------|------------|-----------------|
| SharePoint Online page | Built-in Power BI web part | Low — no code | Power BI Pro per viewer |
| Power Apps canvas app | Power BI tile control | Low — no code | Power BI Pro per viewer |
| Microsoft Teams tab | Power BI Teams app or web part | Low — configuration only | Power BI Pro per viewer |
| Custom web portal (internal) | Power BI Embedded REST API + JavaScript SDK | High — development required | Power BI Pro per viewer OR Premium capacity |
| Custom web portal (external / client-facing) | Power BI Embedded API with service principal (app-owns-data) | High | Power BI Embedded A-SKU or Premium P-SKU |
| SharePoint Framework (SPFx) web part | Custom SPFx component with Embedded SDK | High | Power BI Pro per viewer |

## SharePoint Online Embedding (No-Code)

For SharePoint pages, use the built-in Power BI web part:

**Configuration steps**:
1. Edit the SharePoint page
2. Add web part: Power BI
3. Link: Paste the report URL from Power BI Service (Report URL, not workspace URL)
4. Display mode: Fit to width (recommended) or Fit to page
5. Enable filtering: Decide per report — enable if users need to interact with slicers; disable if the page is a read-only executive summary
6. Publish the page

**Limitation**: The viewer must have a Power BI Pro license. If the organization has Power BI Premium Per User (PPU) or Premium capacity, viewers without Pro licenses can view reports embedded on SharePoint pages.

**Access control**: The SharePoint page inherits SharePoint permissions. The report's Row-Level Security (RLS) in Power BI applies on top of page access. A user who can view the page will only see data their RLS role permits.

**Recommendation for insurance/financial services**: Embed operational reports on SharePoint sites scoped to the relevant department. Do not embed firm-wide financial reports on SharePoint sites accessible to all staff.

## Power Apps Embedding (No-Code)

For Power Apps canvas apps, use the Power BI tile control:

**Configuration steps**:
1. In Power Apps Studio, insert > Charts > Power BI Tile
2. Workspace: Select the Power BI workspace
3. Report: Select the report
4. Tile: Select a specific dashboard tile OR select the full report page
5. Set the tile control's Height and Width to fill the available screen space
6. Set `ShowFilter = true` if users need slicer interaction

**Cross-filtering**: To pass a filter from Power Apps into the embedded report, use the `Filter` property of the Power BI Tile control:
```
Filter: "Table/Column eq '" & Gallery1.Selected.ClientID & "'"
```

**License note**: Users running the Power App must have both a Power Apps license and a Power BI Pro license. Confirm both are assigned to the target user group.

## Teams Tab Embedding

For Microsoft Teams tabs:

**Option A — Power BI native Teams app** (recommended for interactive use):
1. Open the Teams channel
2. Add tab > Power BI
3. Select the report
4. Report appears as an interactive tab with full slicer and filter functionality
5. Viewers need Power BI Pro licenses

**Option B — Website tab** (for a pinned read-only view):
1. Add tab > Website
2. URL: Use the report's embed URL (Power BI Service > Share > Embed in website or portal)
3. This creates a public embed if "Embed in website" is used — do not use for confidential financial data
4. For internal-only: Use the Power BI native Teams app (Option A) instead

For financial services: Always use Option A. Never use the public "Embed in website" URL for reports containing client financial data or production metrics.

## Custom Portal Embedding (Developer-Required)

Two authentication patterns. Choose based on whether users have Azure AD accounts:

### User-Owns-Data (Internal Staff Portal)

Users authenticate with their own Azure AD (Microsoft 365) account. The report is displayed in their security context, including RLS roles assigned to their identity.

**Authentication flow**:
1. User authenticates to the portal via Azure AD (MSAL.js or similar)
2. Portal backend acquires an Azure AD token for the Power BI API scope (`https://analysis.windows.net/powerbi/api/.default`)
3. Portal frontend loads the Power BI JavaScript SDK
4. Call `powerbi.embed()` with the report embed URL and access token
5. Power BI Service validates the user's token and applies their RLS role

**License requirement**: Each user viewing the embedded report must have a Power BI Pro license. Premium Per User also satisfies this requirement.

**Implementation note**: Do not store the Azure AD token in browser local storage — use in-memory token storage. Implement token refresh before the token expires (tokens expire in ~1 hour).

### App-Owns-Data (External Client Portal)

Used when viewers do not have Azure AD accounts in the firm's tenant (external clients, agents on a portal, public-facing tools).

**Authentication flow**:
1. Register an Azure AD app registration with Power BI API permissions (`Report.Read.All`, `Dataset.Read.All`)
2. Service principal authenticates to Azure AD using client credentials (client ID + client secret or certificate)
3. Backend calls Power BI REST API to generate an embed token: `POST /reports/{reportId}/GenerateToken`
4. Embed token has a specified lifespan (max 1 hour) and can include RLS claims
5. Frontend loads Power BI JS SDK, calls `powerbi.embed()` with embed token
6. Embed token expires — backend must refresh it before expiry and provide the updated token to the frontend

**Embed token with RLS**:
```json
POST https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/reports/{reportId}/GenerateToken
{
  "accessLevel": "View",
  "identities": [
    {
      "username": "{client-portal-user-identifier}",
      "roles": ["AgentRole"],
      "datasets": ["{datasetId}"]
    }
  ]
}
```

**License requirement**: Power BI Embedded A-SKU (Azure capacity) or Premium P-SKU. The capacity node size depends on the number of concurrent users and report complexity. Start with A1 for < 50 concurrent users, scale up as needed.

**Security**: Store the client secret in Azure Key Vault. Never embed it in frontend code or configuration files. Rotate the secret every 90 days.

## Row-Level Security Design

Define RLS for every embedding scenario that shows user-specific data:

**RLS role matrix**:

| Role Name | Filter Rule | Assigned To (AAD Group) |
|-----------|-------------|------------------------|
| ProducerView | Producers[Email] = USERPRINCIPALNAME() | Producers AD Group |
| ManagerView | No filter — sees all | Managers AD Group |
| BranchView | Branch[BranchID] IN VALUES(UserBranch[BranchID]) | Branch staff per branch |

**Dynamic RLS using a security table** (for complex multi-level access):
1. Create a `UserSecurity` table in the Power BI dataset mapping email to allowed entities (branches, producers, clients)
2. RLS rule: `UserSecurity[UserEmail] = USERPRINCIPALNAME()`
3. The security table drives all other table filters via relationships
4. Refresh the `UserSecurity` table whenever user assignments change

**RLS testing checklist**:
- [ ] Log in as a producer — verify only their own policies appear
- [ ] Log in as a manager — verify all policies visible
- [ ] Verify KPI totals reflect filtered data, not firm-wide total
- [ ] Test with a user in multiple RLS roles (if applicable)

## Performance Optimization

**Report optimization for embedding**:
- Limit each page to 20 visuals or fewer. More visuals = longer render time.
- Use Import mode where possible. DirectQuery adds latency per visual render.
- Pre-aggregate fact tables using Power Query grouping before loading into the model
- Set incremental refresh on large fact tables (see refresh-scheduler skill)

**Embed container sizing**:
```javascript
const embedConfig = {
  type: 'report',
  id: reportId,
  embedUrl: embedUrl,
  accessToken: accessToken,
  settings: {
    filterPaneEnabled: false,   // hide filter pane for cleaner embed
    navContentPaneEnabled: false, // hide page navigation if showing single page
    background: models.BackgroundType.Transparent  // match portal background
  }
};
const report = powerbi.embed(embedContainer, embedConfig);

// Responsive sizing — call on window resize
report.updateSettings({
  layoutType: models.LayoutType.Custom,
  customLayout: {
    pageSize: { type: models.PageSizeType.Custom, width: container.clientWidth, height: container.clientHeight }
  }
});
```

## Output Format

Deliver as:

1. Embedding approach selection with rationale (one paragraph per context being embedded)
2. Authentication flow diagram (text-format sequence diagram)
3. Step-by-step configuration instructions (for no-code scenarios) or implementation spec (for SDK scenarios)
4. RLS role matrix
5. License requirement summary per user type
6. Security checklist (token storage, secret rotation, access control)
7. Performance optimization notes
8. Post-deployment verification steps (how to confirm the embed is working correctly for each user role)
