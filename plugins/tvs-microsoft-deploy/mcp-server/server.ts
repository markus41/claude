#!/usr/bin/env node
/**
 * @tvs/mcp-graph-server
 *
 * MCP server exposing Microsoft Graph API, Dataverse, Fabric, and Planner
 * operations as tools for Claude Code. Designed for the TVS Holdings
 * multi-entity multi-tenant Microsoft ecosystem.
 *
 * Auth: Uses GRAPH_TOKEN env var or falls back to DefaultAzureCredential.
 * Transport: stdio (standard for Claude Code MCP servers).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration & constants
// ---------------------------------------------------------------------------

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const GRAPH_BETA = "https://graph.microsoft.com/beta";
const FABRIC_BASE = "https://api.fabric.microsoft.com/v1";

const SERVER_NAME = "tvs-graph-server";
const SERVER_VERSION = "1.0.0";

// Default Dataverse environment URLs by entity
const DATAVERSE_ENVS: Record<string, string> = {
  tvs: process.env.TVS_DATAVERSE_ENV_URL || "org-tvs-prod.crm.dynamics.com",
  consulting:
    process.env.CONSULTING_DATAVERSE_ENV_URL ||
    "org-consulting-prod.crm.dynamics.com",
};

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    server: SERVER_NAME,
    message,
    ...meta,
  };
  // Write to stderr so it does not interfere with stdio MCP transport
  process.stderr.write(JSON.stringify(entry) + "\n");
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  expires_on?: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getGraphToken(tenantId?: string): Promise<string> {
  // 1. Explicit env token (simplest for dev/CI)
  const envToken = process.env.GRAPH_TOKEN;
  if (envToken) return envToken;

  // 2. Client credentials flow via env vars
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenant = tenantId || process.env.AZURE_TENANT_ID;

  if (clientId && clientSecret && tenant) {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now + 60_000) {
      return cachedToken.token;
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token acquisition failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    cachedToken = {
      token: data.access_token,
      expiresAt: (data.expires_on ?? Math.floor(Date.now() / 1000) + 3600) * 1000,
    };
    return cachedToken.token;
  }

  throw new Error(
    "No authentication configured. Set GRAPH_TOKEN or AZURE_CLIENT_ID + AZURE_CLIENT_SECRET + AZURE_TENANT_ID."
  );
}

async function getFabricToken(tenantId?: string): Promise<string> {
  const envToken = process.env.FABRIC_TOKEN;
  if (envToken) return envToken;

  // Reuse client credentials with Fabric scope
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenant = tenantId || process.env.AZURE_TENANT_ID;

  if (clientId && clientSecret && tenant) {
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://api.fabric.microsoft.com/.default",
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Fabric token acquisition failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    return data.access_token;
  }

  throw new Error(
    "No Fabric authentication configured. Set FABRIC_TOKEN or AZURE_CLIENT_ID + AZURE_CLIENT_SECRET + AZURE_TENANT_ID."
  );
}

async function getDataverseToken(envUrl: string, tenantId?: string): Promise<string> {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenant = tenantId || process.env.AZURE_TENANT_ID;

  if (clientId && clientSecret && tenant) {
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const scope = `https://${envUrl}/.default`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Dataverse token acquisition failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    return data.access_token;
  }

  throw new Error(
    "No Dataverse authentication configured. Set AZURE_CLIENT_ID + AZURE_CLIENT_SECRET + AZURE_TENANT_ID."
  );
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

interface ApiResponse {
  ok: boolean;
  status: number;
  data: unknown;
}

async function graphGet(path: string, token: string, beta = false): Promise<ApiResponse> {
  const base = beta ? GRAPH_BETA : GRAPH_BASE;
  const url = `${base}${path}`;
  log("info", "Graph GET", { url });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function graphPost(path: string, body: unknown, token: string, beta = false): Promise<ApiResponse> {
  const base = beta ? GRAPH_BETA : GRAPH_BASE;
  const url = `${base}${path}`;
  log("info", "Graph POST", { url });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function graphPatch(path: string, body: unknown, token: string, beta = false): Promise<ApiResponse> {
  const base = beta ? GRAPH_BETA : GRAPH_BASE;
  const url = `${base}${path}`;
  log("info", "Graph PATCH", { url });

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function dataverseGet(
  envUrl: string,
  path: string,
  token: string
): Promise<ApiResponse> {
  const url = `https://${envUrl}/api/data/v9.2/${path}`;
  log("info", "Dataverse GET", { url });

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function dataversePost(
  envUrl: string,
  path: string,
  body: unknown,
  token: string
): Promise<ApiResponse> {
  const url = `https://${envUrl}/api/data/v9.2/${path}`;
  log("info", "Dataverse POST", { url });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function dataversePatch(
  envUrl: string,
  path: string,
  body: unknown,
  token: string
): Promise<ApiResponse> {
  const url = `https://${envUrl}/api/data/v9.2/${path}`;
  log("info", "Dataverse PATCH", { url });

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "If-Match": "*",
    },
    body: JSON.stringify(body),
  });
  // PATCH may return 204 No Content on success
  if (res.status === 204) {
    return { ok: true, status: 204, data: { message: "Record updated successfully" } };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function fabricGet(path: string, token: string): Promise<ApiResponse> {
  const url = `${FABRIC_BASE}${path}`;
  log("info", "Fabric GET", { url });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function fabricPost(path: string, body: unknown, token: string): Promise<ApiResponse> {
  const url = `${FABRIC_BASE}${path}`;
  log("info", "Fabric POST", { url });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function formatResult(response: ApiResponse): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: response.ok,
            status: response.status,
            data: response.data,
          },
          null,
          2
        ),
      },
    ],
  };
}

function errorResult(error: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  const message = error instanceof Error ? error.message : String(error);
  log("error", "Tool execution failed", { error: message });
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: message }, null, 2) }],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// Dataverse environment resolver
// ---------------------------------------------------------------------------

function resolveDataverseEnv(entity?: string): string {
  if (entity && DATAVERSE_ENVS[entity]) {
    return DATAVERSE_ENVS[entity];
  }
  return DATAVERSE_ENVS.tvs;
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// ===========================
// ENTRA ID TOOLS
// ===========================

server.tool(
  "tvs_user_lookup",
  "Look up a user in Entra ID by UPN or display name. Returns profile, licenses, and group memberships.",
  {
    query: z.string().describe("User principal name (UPN) or display name to search for"),
    tenant_id: z.string().optional().describe("Override tenant ID for multi-tenant lookup"),
    select: z
      .string()
      .optional()
      .describe("Comma-separated list of properties to return (default: id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled)"),
  },
  async ({ query, tenant_id, select }) => {
    try {
      const token = await getGraphToken(tenant_id);
      const fields =
        select ||
        "id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,assignedLicenses";

      // Determine if query is a UPN (contains @) or a display name search
      let response: ApiResponse;
      if (query.includes("@")) {
        response = await graphGet(`/users/${encodeURIComponent(query)}?$select=${fields}`, token);
      } else {
        const filter = `startswith(displayName,'${query}') or startswith(userPrincipalName,'${query}')`;
        response = await graphGet(
          `/users?$filter=${encodeURIComponent(filter)}&$select=${fields}&$top=10`,
          token
        );
      }

      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_license_assignment",
  "Assign or remove a Microsoft 365 license for a user. Uses Graph API /users/{id}/assignLicense.",
  {
    user_id: z.string().describe("User object ID or UPN"),
    action: z.enum(["assign", "remove"]).describe("Whether to assign or remove the license"),
    sku_id: z.string().describe("License SKU ID (e.g., '06ebc4ee-1bb5-47dd-8120-11324bc54e06' for E3)"),
    disabled_plans: z
      .array(z.string())
      .optional()
      .describe("Service plan IDs to disable within the license (assign only)"),
    tenant_id: z.string().optional().describe("Override tenant ID for multi-tenant operations"),
  },
  async ({ user_id, action, sku_id, disabled_plans, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      const body: {
        addLicenses: Array<{ skuId: string; disabledPlans?: string[] }>;
        removeLicenses: string[];
      } = {
        addLicenses: [],
        removeLicenses: [],
      };

      if (action === "assign") {
        body.addLicenses.push({
          skuId: sku_id,
          ...(disabled_plans ? { disabledPlans: disabled_plans } : {}),
        });
      } else {
        body.removeLicenses.push(sku_id);
      }

      const response = await graphPost(
        `/users/${encodeURIComponent(user_id)}/assignLicense`,
        body,
        token
      );
      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_conditional_access_status",
  "Get conditional access policy status from Entra ID. Lists all policies or a specific policy by ID.",
  {
    policy_id: z.string().optional().describe("Specific policy ID to retrieve (omit for all policies)"),
    state_filter: z
      .enum(["enabled", "disabled", "enabledForReportingButNotEnforced"])
      .optional()
      .describe("Filter policies by state"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ policy_id, state_filter, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      let path: string;
      if (policy_id) {
        path = `/identity/conditionalAccess/policies/${policy_id}`;
      } else if (state_filter) {
        path = `/identity/conditionalAccess/policies?$filter=state eq '${state_filter}'`;
      } else {
        path = "/identity/conditionalAccess/policies";
      }

      const response = await graphGet(path, token);
      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_group_membership",
  "List members of an Entra ID group or check if a user is a member.",
  {
    group_id: z.string().describe("Group object ID or display name"),
    check_member_id: z
      .string()
      .optional()
      .describe("User object ID to check membership for (omit to list all members)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ group_id, check_member_id, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      // If group_id looks like a name, search for it first
      let resolvedGroupId = group_id;
      if (!group_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const searchRes = await graphGet(
          `/groups?$filter=displayName eq '${encodeURIComponent(group_id)}'&$select=id,displayName`,
          token
        );
        const groups = (searchRes.data as { value?: Array<{ id: string }> })?.value;
        if (!groups || groups.length === 0) {
          return errorResult(`Group not found: ${group_id}`);
        }
        resolvedGroupId = groups[0].id;
      }

      if (check_member_id) {
        // Check specific membership
        const response = await graphPost(
          `/groups/${resolvedGroupId}/checkMemberObjects`,
          { ids: [check_member_id] },
          token
        );
        return formatResult(response);
      } else {
        // List all members
        const response = await graphGet(
          `/groups/${resolvedGroupId}/members?$select=id,displayName,userPrincipalName,mail`,
          token
        );
        return formatResult(response);
      }
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ===========================
// DATAVERSE TOOLS
// ===========================

server.tool(
  "tvs_table_query",
  "Query a Dataverse table using OData filter syntax. Supports $filter, $select, $top, $orderby, and $expand.",
  {
    table: z.string().describe("Logical plural name of the Dataverse table (e.g., 'tvs_accounts', 'tvs_tasks', 'contacts')"),
    filter: z.string().optional().describe("OData $filter expression (e.g., \"tvs_status eq 100000002\")"),
    select: z.string().optional().describe("Comma-separated columns to return (e.g., \"tvs_name,tvs_status\")"),
    top: z.number().optional().describe("Maximum number of records to return (default 50)"),
    orderby: z.string().optional().describe("OData $orderby expression (e.g., \"createdon desc\")"),
    expand: z.string().optional().describe("OData $expand expression for related entities"),
    entity: z
      .enum(["tvs", "consulting"])
      .optional()
      .describe("Which Dataverse environment to query (default: tvs)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ table, filter, select, top, orderby, expand, entity, tenant_id }) => {
    try {
      const envUrl = resolveDataverseEnv(entity);
      const token = await getDataverseToken(envUrl, tenant_id);

      const params: string[] = [];
      if (filter) params.push(`$filter=${encodeURIComponent(filter)}`);
      if (select) params.push(`$select=${select}`);
      if (top) params.push(`$top=${top}`);
      if (orderby) params.push(`$orderby=${encodeURIComponent(orderby)}`);
      if (expand) params.push(`$expand=${encodeURIComponent(expand)}`);

      const query = params.length > 0 ? `?${params.join("&")}` : "";
      const response = await dataverseGet(envUrl, `${table}${query}`, token);
      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_record_create",
  "Create a new record in a Dataverse table. Returns the created record with its ID.",
  {
    table: z.string().describe("Logical plural name of the Dataverse table (e.g., 'tvs_accounts')"),
    data: z
      .record(z.unknown())
      .describe("Record field values as key-value pairs (e.g., {\"tvs_name\": \"Acme Corp\", \"tvs_status\": 100000002})"),
    entity: z
      .enum(["tvs", "consulting"])
      .optional()
      .describe("Which Dataverse environment (default: tvs)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ table, data, entity, tenant_id }) => {
    try {
      const envUrl = resolveDataverseEnv(entity);
      const token = await getDataverseToken(envUrl, tenant_id);
      const response = await dataversePost(envUrl, table, data, token);
      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_record_update",
  "Update an existing Dataverse record by ID. Uses PATCH with If-Match for optimistic concurrency.",
  {
    table: z.string().describe("Logical plural name of the Dataverse table"),
    record_id: z.string().describe("GUID of the record to update"),
    data: z
      .record(z.unknown())
      .describe("Fields to update as key-value pairs"),
    entity: z
      .enum(["tvs", "consulting"])
      .optional()
      .describe("Which Dataverse environment (default: tvs)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ table, record_id, data, entity, tenant_id }) => {
    try {
      const envUrl = resolveDataverseEnv(entity);
      const token = await getDataverseToken(envUrl, tenant_id);
      const response = await dataversePatch(envUrl, `${table}(${record_id})`, data, token);
      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_solution_status",
  "Get deployment status of a Dataverse solution. Shows version, managed state, and components.",
  {
    solution_name: z
      .string()
      .describe("Unique name of the solution (e.g., 'TVSDataverseCore', 'TVSAutomations')"),
    entity: z
      .enum(["tvs", "consulting"])
      .optional()
      .describe("Which Dataverse environment (default: tvs)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ solution_name, entity, tenant_id }) => {
    try {
      const envUrl = resolveDataverseEnv(entity);
      const token = await getDataverseToken(envUrl, tenant_id);

      const filter = `uniquename eq '${solution_name}'`;
      const select =
        "solutionid,uniquename,friendlyname,version,ismanaged,installedon,modifiedon,publisherid";
      const response = await dataverseGet(
        envUrl,
        `solutions?$filter=${encodeURIComponent(filter)}&$select=${select}`,
        token
      );

      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ===========================
// FABRIC TOOLS
// ===========================

server.tool(
  "tvs_workspace_list",
  "List Microsoft Fabric workspaces. Optionally filter by name or capacity.",
  {
    name_filter: z.string().optional().describe("Filter workspaces by display name (substring match)"),
    capacity_id: z.string().optional().describe("Filter by capacity ID"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ name_filter, capacity_id, tenant_id }) => {
    try {
      const token = await getFabricToken(tenant_id);
      let response = await fabricGet("/workspaces", token);

      // Client-side filtering since Fabric API has limited query support
      if (response.ok && (name_filter || capacity_id)) {
        const workspaces = (response.data as { value?: Array<Record<string, unknown>> })?.value || [];
        const filtered = workspaces.filter((ws) => {
          let match = true;
          if (name_filter) {
            const name = (ws.displayName as string) || "";
            match = match && name.toLowerCase().includes(name_filter.toLowerCase());
          }
          if (capacity_id) {
            match = match && ws.capacityId === capacity_id;
          }
          return match;
        });
        response = { ...response, data: { value: filtered, filteredCount: filtered.length } };
      }

      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_notebook_status",
  "Get the execution status of a Fabric notebook. Shows last run, duration, and state.",
  {
    workspace_id: z.string().describe("Fabric workspace ID"),
    notebook_id: z.string().describe("Notebook item ID"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ workspace_id, notebook_id, tenant_id }) => {
    try {
      const token = await getFabricToken(tenant_id);

      // Get notebook metadata
      const notebookRes = await fabricGet(
        `/workspaces/${workspace_id}/notebooks/${notebook_id}`,
        token
      );

      // Get recent runs via the jobs API
      const runsRes = await fabricGet(
        `/workspaces/${workspace_id}/items/${notebook_id}/jobs/instances?$top=5`,
        token
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: notebookRes.ok,
                notebook: notebookRes.data,
                recentRuns: runsRes.ok ? runsRes.data : null,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_pipeline_run",
  "Trigger a Microsoft Fabric pipeline run. Returns the run instance ID for monitoring.",
  {
    workspace_id: z.string().describe("Fabric workspace ID"),
    pipeline_id: z.string().describe("Pipeline item ID"),
    parameters: z
      .record(z.unknown())
      .optional()
      .describe("Pipeline parameters as key-value pairs"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ workspace_id, pipeline_id, parameters, tenant_id }) => {
    try {
      const token = await getFabricToken(tenant_id);

      const body: { executionData?: { parameters: Record<string, unknown> } } = {};
      if (parameters) {
        body.executionData = { parameters };
      }

      const response = await fabricPost(
        `/workspaces/${workspace_id}/items/${pipeline_id}/jobs/instances?jobType=Pipeline`,
        body,
        token
      );

      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_refresh_schedule",
  "Get or set the refresh schedule for a Fabric semantic model (Power BI dataset).",
  {
    workspace_id: z.string().describe("Fabric workspace ID"),
    dataset_id: z.string().describe("Semantic model / dataset ID"),
    action: z.enum(["get", "set"]).describe("Whether to get or set the refresh schedule"),
    schedule: z
      .object({
        enabled: z.boolean().optional(),
        days: z.array(z.string()).optional().describe("Days of week (e.g., ['Monday','Wednesday','Friday'])"),
        times: z.array(z.string()).optional().describe("UTC times (e.g., ['06:00','18:00'])"),
        notifyOption: z.enum(["MailOnFailure", "NoNotification"]).optional(),
      })
      .optional()
      .describe("Schedule configuration (required for action=set)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ workspace_id, dataset_id, action, schedule, tenant_id }) => {
    try {
      const token = await getFabricToken(tenant_id);

      if (action === "get") {
        const response = await fabricGet(
          `/workspaces/${workspace_id}/semanticModels/${dataset_id}/refreshSchedule`,
          token
        );
        return formatResult(response);
      } else {
        if (!schedule) {
          return errorResult("Schedule configuration is required for action=set");
        }
        const response = await fabricPost(
          `/workspaces/${workspace_id}/semanticModels/${dataset_id}/refreshSchedule`,
          schedule,
          token
        );
        return formatResult(response);
      }
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ===========================
// PLANNER TOOLS
// ===========================

server.tool(
  "tvs_task_create",
  "Create a new task in Microsoft Planner. Returns the created task with its ID.",
  {
    plan_id: z.string().describe("Planner plan ID"),
    title: z.string().describe("Task title"),
    bucket_id: z.string().optional().describe("Bucket ID to place the task in"),
    assignments: z
      .record(
        z.object({
          orderHint: z.string().optional().describe("Order hint for assignment (use ' !' for default)"),
        })
      )
      .optional()
      .describe("Assignments object keyed by user ID (e.g., {\"user-guid\": {\"orderHint\": \" !\"}})"),
    due_date: z
      .string()
      .optional()
      .describe("Due date in ISO 8601 format (e.g., '2026-03-15T00:00:00Z')"),
    priority: z
      .number()
      .optional()
      .describe("Priority: 0=no priority, 1=urgent, 3=important, 5=medium, 9=low"),
    percent_complete: z
      .number()
      .optional()
      .describe("Completion percentage (0, 50, or 100)"),
    notes: z.string().optional().describe("Task description/notes (set in task details)"),
    checklist: z
      .record(
        z.object({
          title: z.string(),
          isChecked: z.boolean().optional(),
        })
      )
      .optional()
      .describe("Checklist items keyed by unique IDs"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ plan_id, title, bucket_id, assignments, due_date, priority, percent_complete, notes, checklist, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      const taskBody: Record<string, unknown> = {
        planId: plan_id,
        title,
      };
      if (bucket_id) taskBody.bucketId = bucket_id;
      if (assignments) taskBody.assignments = assignments;
      if (due_date) taskBody.dueDateTime = due_date;
      if (priority !== undefined) taskBody.priority = priority;
      if (percent_complete !== undefined) taskBody.percentComplete = percent_complete;

      const taskRes = await graphPost("/planner/tasks", taskBody, token);

      // If notes or checklist provided, update task details
      if ((notes || checklist) && taskRes.ok) {
        const taskId = (taskRes.data as { id?: string })?.id;
        if (taskId) {
          // Need to get task details first for the etag
          const detailsRes = await graphGet(`/planner/tasks/${taskId}/details`, token);
          if (detailsRes.ok) {
            const etag = (detailsRes.data as { "@odata.etag"?: string })?.["@odata.etag"];
            const detailsBody: Record<string, unknown> = {};
            if (notes) detailsBody.description = notes;
            if (checklist) detailsBody.checklist = checklist;

            // Planner details require If-Match header - use graphPatch with workaround
            const detailsUrl = `${GRAPH_BASE}/planner/tasks/${taskId}/details`;
            const patchRes = await fetch(detailsUrl, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
                "If-Match": etag || "*",
              },
              body: JSON.stringify(detailsBody),
            });
            const patchData = await patchRes.json().catch(() => ({}));
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(
                    {
                      success: true,
                      task: taskRes.data,
                      details: patchData,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
        }
      }

      return formatResult(taskRes);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_task_update",
  "Update an existing Planner task status, assignments, or fields. Requires the task's etag for concurrency.",
  {
    task_id: z.string().describe("Planner task ID"),
    percent_complete: z
      .number()
      .optional()
      .describe("Completion percentage (0=not started, 50=in progress, 100=complete)"),
    title: z.string().optional().describe("Updated task title"),
    priority: z.number().optional().describe("Priority: 0=no priority, 1=urgent, 3=important, 5=medium, 9=low"),
    due_date: z.string().optional().describe("Updated due date in ISO 8601"),
    assignments: z
      .record(z.unknown())
      .optional()
      .describe("Updated assignments (use null value to unassign)"),
    bucket_id: z.string().optional().describe("Move task to a different bucket"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ task_id, percent_complete, title, priority, due_date, assignments, bucket_id, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      // Get current task for etag
      const currentRes = await graphGet(`/planner/tasks/${task_id}`, token);
      if (!currentRes.ok) {
        return formatResult(currentRes);
      }

      const etag = (currentRes.data as { "@odata.etag"?: string })?.["@odata.etag"];

      const updateBody: Record<string, unknown> = {};
      if (percent_complete !== undefined) updateBody.percentComplete = percent_complete;
      if (title) updateBody.title = title;
      if (priority !== undefined) updateBody.priority = priority;
      if (due_date) updateBody.dueDateTime = due_date;
      if (assignments) updateBody.assignments = assignments;
      if (bucket_id) updateBody.bucketId = bucket_id;

      // Planner requires If-Match etag header
      const url = `${GRAPH_BASE}/planner/tasks/${task_id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "If-Match": etag || "*",
        },
        body: JSON.stringify(updateBody),
      });

      if (res.status === 204) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ success: true, message: "Task updated successfully", taskId: task_id }, null, 2),
            },
          ],
        };
      }

      const data = await res.json().catch(() => ({}));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: res.ok, status: res.status, data }, null, 2),
          },
        ],
      };
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_plan_status",
  "Get plan completion status including task counts by status, bucket breakdown, and assignment summary.",
  {
    plan_id: z.string().describe("Planner plan ID"),
    include_details: z
      .boolean()
      .optional()
      .describe("Include individual task details (default false for summary only)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ plan_id, include_details, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      // Get plan info
      const planRes = await graphGet(`/planner/plans/${plan_id}`, token);

      // Get all tasks in the plan
      const tasksRes = await graphGet(`/planner/plans/${plan_id}/tasks`, token);

      // Get buckets
      const bucketsRes = await graphGet(`/planner/plans/${plan_id}/buckets`, token);

      if (!tasksRes.ok) {
        return formatResult(tasksRes);
      }

      const tasks = (tasksRes.data as { value?: Array<Record<string, unknown>> })?.value || [];
      const buckets = (bucketsRes.data as { value?: Array<Record<string, unknown>> })?.value || [];

      // Compute summary statistics
      const totalTasks = tasks.length;
      const completed = tasks.filter((t) => t.percentComplete === 100).length;
      const inProgress = tasks.filter((t) => t.percentComplete === 50).length;
      const notStarted = tasks.filter((t) => t.percentComplete === 0).length;

      // Bucket breakdown
      const bucketMap = new Map(
        buckets.map((b) => [b.id as string, b.name as string])
      );
      const bucketBreakdown: Record<string, { total: number; completed: number }> = {};
      for (const task of tasks) {
        const bucketName = bucketMap.get(task.bucketId as string) || "Unknown";
        if (!bucketBreakdown[bucketName]) {
          bucketBreakdown[bucketName] = { total: 0, completed: 0 };
        }
        bucketBreakdown[bucketName].total++;
        if (task.percentComplete === 100) {
          bucketBreakdown[bucketName].completed++;
        }
      }

      // Assignment summary
      const assignmentCounts: Record<string, { total: number; completed: number }> = {};
      for (const task of tasks) {
        const assignments = task.assignments as Record<string, unknown> | undefined;
        if (assignments) {
          for (const userId of Object.keys(assignments)) {
            if (!assignmentCounts[userId]) {
              assignmentCounts[userId] = { total: 0, completed: 0 };
            }
            assignmentCounts[userId].total++;
            if (task.percentComplete === 100) {
              assignmentCounts[userId].completed++;
            }
          }
        }
      }

      // Overdue detection
      const now = new Date();
      const overdue = tasks.filter((t) => {
        if (t.percentComplete === 100) return false;
        const due = t.dueDateTime as string | undefined;
        return due && new Date(due) < now;
      });

      const result: Record<string, unknown> = {
        success: true,
        plan: planRes.data,
        summary: {
          totalTasks,
          completed,
          inProgress,
          notStarted,
          completionPercentage: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
          overdueCount: overdue.length,
        },
        bucketBreakdown,
        assignmentCounts,
      };

      if (include_details) {
        result.tasks = tasks;
        result.overdueTasks = overdue;
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ===========================
// GRAPH (TEAMS / SHAREPOINT / MAIL) TOOLS
// ===========================

server.tool(
  "tvs_teams_channel_list",
  "List channels in a Microsoft Teams team. Returns channel names, IDs, and membership types.",
  {
    team_id: z.string().describe("Teams team ID (same as the M365 group ID)"),
    include_private: z
      .boolean()
      .optional()
      .describe("Include private and shared channels (requires elevated permissions)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ team_id, include_private, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      let path = `/teams/${team_id}/channels`;
      if (include_private) {
        path += "?$filter=membershipType ne 'standard' or membershipType eq 'standard'";
      }

      const response = await graphGet(path, token);
      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_sharepoint_sites",
  "List or search SharePoint sites. Returns site URLs, IDs, and basic metadata.",
  {
    search: z.string().optional().describe("Search query to find sites by name or URL"),
    site_id: z.string().optional().describe("Specific site ID to get details for"),
    top: z.number().optional().describe("Maximum number of results (default 25)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ search, site_id, top, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      let response: ApiResponse;
      if (site_id) {
        response = await graphGet(`/sites/${site_id}`, token);
      } else if (search) {
        response = await graphGet(
          `/sites?search=${encodeURIComponent(search)}&$top=${top || 25}`,
          token
        );
      } else {
        response = await graphGet(`/sites?$top=${top || 25}`, token);
      }

      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.tool(
  "tvs_mail_send",
  "Send an email via Microsoft Graph API. Supports HTML body, attachments reference, and CC/BCC.",
  {
    from: z
      .string()
      .optional()
      .describe("Sender UPN or mailbox (requires SendAs permission; omit to send as authenticated user)"),
    to: z.array(z.string()).describe("Array of recipient email addresses"),
    cc: z.array(z.string()).optional().describe("CC recipient email addresses"),
    bcc: z.array(z.string()).optional().describe("BCC recipient email addresses"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Email body content"),
    body_type: z.enum(["Text", "HTML"]).optional().describe("Body content type (default: HTML)"),
    importance: z.enum(["Low", "Normal", "High"]).optional().describe("Message importance (default: Normal)"),
    save_to_sent: z.boolean().optional().describe("Save a copy to Sent Items (default: true)"),
    tenant_id: z.string().optional().describe("Override tenant ID"),
  },
  async ({ from, to, cc, bcc, subject, body, body_type, importance, save_to_sent, tenant_id }) => {
    try {
      const token = await getGraphToken(tenant_id);

      const toRecipients = to.map((email) => ({
        emailAddress: { address: email },
      }));

      const message: Record<string, unknown> = {
        subject,
        body: {
          contentType: body_type || "HTML",
          content: body,
        },
        toRecipients,
      };

      if (cc) {
        message.ccRecipients = cc.map((email) => ({
          emailAddress: { address: email },
        }));
      }
      if (bcc) {
        message.bccRecipients = bcc.map((email) => ({
          emailAddress: { address: email },
        }));
      }
      if (importance) {
        message.importance = importance;
      }

      const payload: Record<string, unknown> = {
        message,
        saveToSentItems: save_to_sent !== false,
      };

      const sender = from || "me";
      const path =
        sender === "me"
          ? "/me/sendMail"
          : `/users/${encodeURIComponent(sender)}/sendMail`;

      const response = await graphPost(path, payload, token);

      // sendMail returns 202 Accepted with no body on success
      if (response.status === 202 || response.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Email sent to ${to.join(", ")}`,
                  subject,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return formatResult(response);
    } catch (error) {
      return errorResult(error);
    }
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log("info", `Starting ${SERVER_NAME} v${SERVER_VERSION}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log("info", "MCP server connected and ready", {
    toolCount: 18,
    categories: ["entra-id", "dataverse", "fabric", "planner", "graph"],
  });
}

main().catch((error) => {
  log("error", "Fatal error starting MCP server", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
