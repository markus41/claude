/**
 * Home Assistant MCP Server
 *
 * Model Context Protocol server for Home Assistant integration with Claude.
 * Provides tools for device control, automation management, and state queries.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration
const HA_URL = process.env.HA_URL || "http://homeassistant.local:8123";
const HA_TOKEN = process.env.HA_TOKEN || "";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// HTTP client for HA API
async function haFetch(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${HA_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HA API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Tool definitions
const TOOLS = [
  {
    name: "ha_get_state",
    description: "Get the current state of a Home Assistant entity",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: {
          type: "string",
          description: "The entity ID (e.g., light.living_room)",
        },
      },
      required: ["entity_id"],
    },
  },
  {
    name: "ha_set_state",
    description: "Set the state of a Home Assistant entity",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: {
          type: "string",
          description: "The entity ID",
        },
        state: {
          type: "string",
          description: "The new state value",
        },
        attributes: {
          type: "object",
          description: "Optional attributes to set",
        },
      },
      required: ["entity_id", "state"],
    },
  },
  {
    name: "ha_call_service",
    description: "Call a Home Assistant service",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Service domain (e.g., light, switch, climate)",
        },
        service: {
          type: "string",
          description: "Service name (e.g., turn_on, turn_off)",
        },
        target: {
          type: "object",
          description: "Target entities, areas, or devices",
          properties: {
            entity_id: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
            area_id: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
            },
          },
        },
        data: {
          type: "object",
          description: "Service call data (e.g., brightness, temperature)",
        },
      },
      required: ["domain", "service"],
    },
  },
  {
    name: "ha_list_entities",
    description: "List Home Assistant entities, optionally filtered by domain",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Optional domain filter (e.g., light, switch, sensor)",
        },
        area: {
          type: "string",
          description: "Optional area filter",
        },
      },
    },
  },
  {
    name: "ha_search_entities",
    description: "Search for entities by name or attributes",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
        limit: {
          type: "number",
          description: "Maximum results (default: 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "ha_get_history",
    description: "Get state history for an entity",
    inputSchema: {
      type: "object",
      properties: {
        entity_id: {
          type: "string",
          description: "The entity ID",
        },
        hours: {
          type: "number",
          description: "Hours of history to retrieve (default: 24)",
        },
      },
      required: ["entity_id"],
    },
  },
  {
    name: "ha_create_automation",
    description: "Create a new Home Assistant automation",
    inputSchema: {
      type: "object",
      properties: {
        alias: {
          type: "string",
          description: "Automation name",
        },
        description: {
          type: "string",
          description: "Automation description",
        },
        trigger: {
          type: "array",
          description: "Automation triggers",
        },
        condition: {
          type: "array",
          description: "Optional conditions",
        },
        action: {
          type: "array",
          description: "Actions to perform",
        },
      },
      required: ["alias", "trigger", "action"],
    },
  },
  {
    name: "ha_trigger_automation",
    description: "Manually trigger an automation",
    inputSchema: {
      type: "object",
      properties: {
        automation_id: {
          type: "string",
          description: "The automation entity ID",
        },
      },
      required: ["automation_id"],
    },
  },
  {
    name: "ha_get_logs",
    description: "Get Home Assistant error logs",
    inputSchema: {
      type: "object",
      properties: {
        lines: {
          type: "number",
          description: "Number of log lines (default: 50)",
        },
      },
    },
  },
  {
    name: "ollama_generate",
    description: "Generate text using local Ollama LLM",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The prompt to send to Ollama",
        },
        model: {
          type: "string",
          description: "Model to use (default: llama3.2:3b)",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "ollama_list_models",
    description: "List available Ollama models",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Tool handlers
async function handleTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "ha_get_state": {
      const state = await haFetch(`/api/states/${args.entity_id}`);
      return {
        entity_id: state.entity_id,
        state: state.state,
        attributes: state.attributes,
        last_changed: state.last_changed,
        last_updated: state.last_updated,
      };
    }

    case "ha_set_state": {
      const result = await haFetch(`/api/states/${args.entity_id}`, {
        method: "POST",
        body: JSON.stringify({
          state: args.state,
          attributes: args.attributes || {},
        }),
      });
      return result;
    }

    case "ha_call_service": {
      const payload: any = {};
      if (args.data) Object.assign(payload, args.data);
      if (args.target) payload.target = args.target;

      const result = await haFetch(
        `/api/services/${args.domain}/${args.service}`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      return { success: true, result };
    }

    case "ha_list_entities": {
      let states = await haFetch("/api/states");

      if (args.domain) {
        states = states.filter((s: any) =>
          s.entity_id.startsWith(`${args.domain}.`)
        );
      }

      return states.map((s: any) => ({
        entity_id: s.entity_id,
        state: s.state,
        friendly_name: s.attributes?.friendly_name,
      }));
    }

    case "ha_search_entities": {
      const states = await haFetch("/api/states");
      const query = args.query.toLowerCase();
      const limit = args.limit || 10;

      const matches = states
        .filter((s: any) => {
          const name = s.attributes?.friendly_name?.toLowerCase() || "";
          const id = s.entity_id.toLowerCase();
          return name.includes(query) || id.includes(query);
        })
        .slice(0, limit)
        .map((s: any) => ({
          entity_id: s.entity_id,
          state: s.state,
          friendly_name: s.attributes?.friendly_name,
        }));

      return matches;
    }

    case "ha_get_history": {
      const hours = args.hours || 24;
      const start = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const history = await haFetch(
        `/api/history/period/${start}?filter_entity_id=${args.entity_id}`
      );

      return history[0] || [];
    }

    case "ha_create_automation": {
      const automation = {
        alias: args.alias,
        description: args.description || "",
        trigger: args.trigger,
        condition: args.condition || [],
        action: args.action,
        mode: "single",
      };

      const result = await haFetch("/api/config/automation/config", {
        method: "POST",
        body: JSON.stringify(automation),
      });

      return { success: true, automation_id: result };
    }

    case "ha_trigger_automation": {
      await haFetch("/api/services/automation/trigger", {
        method: "POST",
        body: JSON.stringify({
          entity_id: args.automation_id,
        }),
      });
      return { success: true, triggered: args.automation_id };
    }

    case "ha_get_logs": {
      const logs = await haFetch("/api/error_log");
      const lines = args.lines || 50;
      return logs.split("\n").slice(-lines).join("\n");
    }

    case "ollama_generate": {
      const model = args.model || "llama3.2:3b";
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: args.prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const result = await response.json();
      return { response: result.response, model };
    }

    case "ollama_list_models": {
      const response = await fetch(`${OLLAMA_URL}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const result = await response.json();
      return result.models.map((m: any) => ({
        name: m.name,
        size: Math.round(m.size / 1024 / 1024 / 1024 * 100) / 100 + " GB",
        modified: m.modified_at,
      }));
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Create and run server
async function main() {
  const server = new Server(
    {
      name: "home-assistant-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleTool(name, args || {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Handle resource listing
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "hass://entities",
        name: "All Entities",
        description: "List of all Home Assistant entities",
        mimeType: "application/json",
      },
      {
        uri: "hass://automations",
        name: "Automations",
        description: "List of all automations",
        mimeType: "application/json",
      },
    ],
  }));

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === "hass://entities") {
      const states = await haFetch("/api/states");
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              states.map((s: any) => ({
                entity_id: s.entity_id,
                state: s.state,
                friendly_name: s.attributes?.friendly_name,
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    if (uri === "hass://automations") {
      const states = await haFetch("/api/states");
      const automations = states.filter((s: any) =>
        s.entity_id.startsWith("automation.")
      );
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(automations, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Home Assistant MCP Server running on stdio");
}

main().catch(console.error);
