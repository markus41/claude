# @tvs/mcp-graph-server

MCP server exposing Microsoft Graph API, Dataverse, Fabric, and Planner operations as tools for Claude Code. Built for the TVS Holdings multi-entity multi-tenant Microsoft ecosystem.

## Tools (18 total)

### Entra ID (4)
| Tool | Description |
|------|-------------|
| `tvs_user_lookup` | Look up user by UPN or display name |
| `tvs_license_assignment` | Assign/remove M365 license for a user |
| `tvs_conditional_access_status` | Get conditional access policy status |
| `tvs_group_membership` | List group members or check membership |

### Dataverse (4)
| Tool | Description |
|------|-------------|
| `tvs_table_query` | Query Dataverse table with OData filter |
| `tvs_record_create` | Create a record in a Dataverse table |
| `tvs_record_update` | Update an existing Dataverse record |
| `tvs_solution_status` | Get solution deployment status |

### Fabric (4)
| Tool | Description |
|------|-------------|
| `tvs_workspace_list` | List Fabric workspaces |
| `tvs_notebook_status` | Get notebook execution status |
| `tvs_pipeline_run` | Trigger a Fabric pipeline run |
| `tvs_refresh_schedule` | Get/set semantic model refresh schedule |

### Planner (3)
| Tool | Description |
|------|-------------|
| `tvs_task_create` | Create a Planner task |
| `tvs_task_update` | Update a Planner task status |
| `tvs_plan_status` | Get plan completion status |

### Graph (3)
| Tool | Description |
|------|-------------|
| `tvs_teams_channel_list` | List Teams channels |
| `tvs_sharepoint_sites` | List SharePoint sites |
| `tvs_mail_send` | Send email via Graph API |

## Setup

### 1. Install dependencies

```bash
cd plugins/tvs-microsoft-deploy/mcp-server
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Environment variables

Set credentials via one of these methods:

**Option A: Direct token (dev/testing)**
```bash
export GRAPH_TOKEN="eyJ0eXAiOi..."        # Graph API access token
export FABRIC_TOKEN="eyJ0eXAiOi..."       # Fabric API access token (optional)
```

**Option B: Client credentials (production)**
```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

**Dataverse environment URLs (optional, defaults to prod)**
```bash
export TVS_DATAVERSE_ENV_URL="org-tvs-prod.crm.dynamics.com"
export CONSULTING_DATAVERSE_ENV_URL="org-consulting-prod.crm.dynamics.com"
```

### 4. Configure in `.mcp.json`

Add the server to the project root `.mcp.json`:

```json
{
  "mcpServers": {
    "tvs-graph": {
      "command": "node",
      "args": [
        "plugins/tvs-microsoft-deploy/mcp-server/dist/server.js"
      ],
      "env": {
        "GRAPH_TOKEN": "${GRAPH_TOKEN}",
        "AZURE_TENANT_ID": "${AZURE_TENANT_ID}",
        "AZURE_CLIENT_ID": "${AZURE_CLIENT_ID}",
        "AZURE_CLIENT_SECRET": "${AZURE_CLIENT_SECRET}",
        "TVS_DATAVERSE_ENV_URL": "${TVS_DATAVERSE_ENV_URL}",
        "CONSULTING_DATAVERSE_ENV_URL": "${CONSULTING_DATAVERSE_ENV_URL}",
        "FABRIC_TOKEN": "${FABRIC_TOKEN}"
      }
    }
  }
}
```

## Multi-tenant support

Every tool accepts an optional `tenant_id` parameter to override the default tenant. This enables cross-tenant operations across TVS Holdings entities (TVS, Consulting, TAIA).

## Authentication flow

1. If `GRAPH_TOKEN` env var is set, it is used directly (no refresh).
2. If `AZURE_CLIENT_ID` + `AZURE_CLIENT_SECRET` + `AZURE_TENANT_ID` are set, client credentials flow is used with automatic token caching.
3. Fabric and Dataverse tokens use the same client credentials with their respective scopes.

## Required Graph API permissions

| Tool category | Required scopes |
|---------------|----------------|
| Entra ID | `User.Read.All`, `Group.Read.All`, `Policy.Read.All`, `Directory.Read.All` |
| License mgmt | `User.ReadWrite.All`, `Directory.ReadWrite.All` |
| Planner | `Tasks.ReadWrite`, `Group.ReadWrite.All` |
| Mail | `Mail.Send` |
| SharePoint | `Sites.Read.All` |
| Teams | `Channel.ReadBasic.All`, `Team.ReadBasic.All` |

Fabric and Dataverse use separate token scopes acquired automatically.

## Logging

All API calls are logged to stderr in JSON format (does not interfere with stdio MCP transport). Log entries include timestamps, request URLs, and error details.
