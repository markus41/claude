# Microsoft API Matrix

| API | Primary Use in TVS Deploy | Base URL | Auth | Typical Scopes/Roles |
|---|---|---|---|---|
| Microsoft Graph | Identity, Teams, groups, directory, OneDrive/SharePoint pointers | `https://graph.microsoft.com/v1.0` | OAuth2 bearer token | `Directory.ReadWrite.All`, `Group.ReadWrite.All`, `Team.Create` |
| Fabric REST | Workspace/lakehouse/notebook/pipeline operations | `https://api.fabric.microsoft.com/v1` | OAuth2 bearer token | Fabric admin/capacity/workspace permissions |
| Power Platform Admin | Environment lifecycle, governance, DLP policy management | `https://api.bap.microsoft.com` | OAuth2 bearer token | Power Platform Admin |
| Dataverse Web API | Entity CRUD for broker/task/subscription records | `https://<org>.crm.dynamics.com/api/data/v9.2` | OAuth2 bearer token | `user_impersonation`, table security roles |
| Azure Resource Manager (ARM) | Infra deployment state and resource management | `https://management.azure.com` | OAuth2 bearer token | `Contributor`, `Reader`, custom RBAC |
| Microsoft Purview | Catalog/classification and compliance lineage | `https://api.purview.azure.com` | OAuth2 bearer token | Purview Data Curator / Data Reader |
| Planner (Graph surface) | Task synchronization and assignment workflows | `https://graph.microsoft.com/v1.0/planner` | OAuth2 bearer token | `Tasks.ReadWrite`, group membership |
| SharePoint REST / Graph Drives | Data room artifacts and controlled file exchange | `https://<tenant>.sharepoint.com` / Graph drives | OAuth2 bearer token | `Sites.ReadWrite.All` |
| Exchange Online APIs (Graph / EWS legacy) | Mailbox lifecycle and notification workflows | Graph mail endpoints | OAuth2 bearer token | `Mail.ReadWrite`, Exchange admin roles |
| Teams APIs (Graph) | Team/channel provisioning and membership controls | `https://graph.microsoft.com/v1.0/teams` | OAuth2 bearer token | `Team.Create`, `Channel.Create`, `TeamMember.ReadWrite.All` |
| OneDrive APIs (Graph Drives) | Personal/team document operations and sharing | `https://graph.microsoft.com/v1.0/drives` | OAuth2 bearer token | `Files.ReadWrite.All` |

## Notes
- Prefer tenant-scoped app registrations with least-privilege app roles.
- Use helper scripts in `plugins/tvs-microsoft-deploy/scripts/api/` instead of inline curl for consistency.
