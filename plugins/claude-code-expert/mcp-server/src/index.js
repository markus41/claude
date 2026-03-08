#!/usr/bin/env node

/**
 * Claude Code Documentation MCP Server
 *
 * Provides Claude Code documentation as queryable MCP tools.
 * Each tool covers a specific documentation area.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, "../../skills");

// Build documentation index from skill files
function loadDocumentation() {
  const docs = {};
  if (!existsSync(SKILLS_DIR)) return docs;

  for (const dir of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const skillPath = join(SKILLS_DIR, dir.name, "SKILL.md");
    if (existsSync(skillPath)) {
      docs[dir.name] = readFileSync(skillPath, "utf-8");
    }
  }
  return docs;
}

const documentation = loadDocumentation();

// Topic search index
const TOPIC_MAP = {
  cli: "cli-reference",
  "command-line": "cli-reference",
  flags: "cli-reference",
  arguments: "cli-reference",
  install: "cli-reference",
  installation: "cli-reference",
  config: "configuration",
  configuration: "configuration",
  "claude-md": "configuration",
  "claude.md": "configuration",
  "settings.json": "settings-deep-dive",
  settings: "settings-deep-dive",
  "settings.local": "settings-deep-dive",
  permissions: "permissions-security",
  security: "permissions-security",
  allow: "permissions-security",
  deny: "permissions-security",
  hooks: "hooks-system",
  "pre-tool-use": "hooks-system",
  "post-tool-use": "hooks-system",
  notification: "hooks-system",
  stop: "hooks-system",
  mcp: "mcp-servers",
  "model-context-protocol": "mcp-servers",
  servers: "mcp-servers",
  sdk: "agent-sdk",
  "agent-sdk": "agent-sdk",
  "claude-code-sdk": "agent-sdk",
  agents: "agent-sdk",
  "sub-agents": "agent-sdk",
  subagents: "agent-sdk",
  ide: "ide-integrations",
  vscode: "ide-integrations",
  jetbrains: "ide-integrations",
  terminal: "ide-integrations",
  "vs-code": "ide-integrations",
  commands: "slash-commands",
  "slash-commands": "slash-commands",
  shortcuts: "slash-commands",
  keyboard: "slash-commands",
  context: "context-management",
  compact: "context-management",
  clear: "context-management",
  "context-window": "context-management",
  memory: "memory-instructions",
  instructions: "memory-instructions",
  rules: "memory-instructions",
  "auto-memory": "memory-instructions",
  tools: "tools-reference",
  read: "tools-reference",
  write: "tools-reference",
  edit: "tools-reference",
  glob: "tools-reference",
  grep: "tools-reference",
  bash: "tools-reference",
  thinking: "extended-thinking",
  "extended-thinking": "extended-thinking",
  ultrathink: "extended-thinking",
  git: "git-integration",
  commit: "git-integration",
  pr: "git-integration",
  "pull-request": "git-integration",
  branch: "git-integration",
  testing: "testing-workflows",
  tests: "testing-workflows",
  tdd: "testing-workflows",
  cost: "cost-optimization",
  pricing: "cost-optimization",
  tokens: "cost-optimization",
  models: "cost-optimization",
  "model-routing": "cost-optimization",
  troubleshoot: "troubleshooting",
  debug: "troubleshooting",
  error: "troubleshooting",
  fix: "troubleshooting",
  doctor: "troubleshooting",
  teams: "teams-collaboration",
  collaboration: "teams-collaboration",
  enterprise: "teams-collaboration",
  organization: "teams-collaboration",
  "env-vars": "cli-reference",
  environment: "cli-reference",
  bedrock: "cli-reference",
  vertex: "cli-reference",
  foundry: "cli-reference",
  oauth: "mcp-servers",
  "agent-teams": "agent-sdk",
  teammates: "agent-sdk",
  remote: "agent-sdk",
  teleport: "agent-sdk",
  sandbox: "settings-deep-dive",
  statusline: "settings-deep-dive",
  "status-line": "settings-deep-dive",
  mtls: "cli-reference",
  "client-cert": "cli-reference",
  login: "cli-reference",
  auth: "cli-reference",
};

const server = new Server(
  { name: "claude-code-docs", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cc_docs_search",
      description:
        "Search Claude Code documentation by topic. Returns comprehensive documentation for the matching area (CLI, configuration, hooks, MCP, SDK, permissions, tools, IDE, git, testing, cost, troubleshooting, teams, settings, etc.)",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Topic to search for (e.g., 'hooks', 'mcp servers', 'settings.json', 'permissions', 'cli flags', 'keyboard shortcuts', 'extended thinking', 'cost optimization')",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "cc_docs_list_topics",
      description:
        "List all available Claude Code documentation topics and their descriptions.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "cc_docs_full_reference",
      description:
        "Get the complete documentation for a specific topic area. Use cc_docs_list_topics first to see available topics.",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description:
              "Exact topic key (e.g., 'cli-reference', 'hooks-system', 'mcp-servers', 'settings-deep-dive')",
            enum: Object.keys(documentation),
          },
        },
        required: ["topic"],
      },
    },
    {
      name: "cc_docs_env_vars",
      description:
        "Get a reference of all Claude Code environment variables (API keys, provider selection, behavior flags, proxy settings).",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "cc_docs_settings_schema",
      description:
        "Get the complete settings.json schema with all configuration options, permission patterns, hook configuration, and env var settings.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "cc_docs_troubleshoot",
      description:
        "Get troubleshooting guidance for a specific Claude Code issue or error message.",
      inputSchema: {
        type: "object",
        properties: {
          issue: {
            type: "string",
            description:
              "The issue description or error message to troubleshoot",
          },
        },
        required: ["issue"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "cc_docs_search": {
      const query = (args.query || "").toLowerCase().trim();
      const words = query.split(/\s+/);

      // Find best matching topic
      let bestMatch = null;
      for (const word of words) {
        if (TOPIC_MAP[word]) {
          bestMatch = TOPIC_MAP[word];
          break;
        }
      }

      // Fuzzy match if no exact match
      if (!bestMatch) {
        for (const [key, value] of Object.entries(TOPIC_MAP)) {
          if (query.includes(key) || key.includes(query)) {
            bestMatch = value;
            break;
          }
        }
      }

      // Full text search across all docs
      if (!bestMatch) {
        let maxScore = 0;
        for (const [topic, content] of Object.entries(documentation)) {
          const lowerContent = content.toLowerCase();
          let score = 0;
          for (const word of words) {
            const matches = lowerContent.split(word).length - 1;
            score += matches;
          }
          if (score > maxScore) {
            maxScore = score;
            bestMatch = topic;
          }
        }
      }

      if (bestMatch && documentation[bestMatch]) {
        return {
          content: [
            {
              type: "text",
              text: `# Documentation: ${bestMatch}\n\n${documentation[bestMatch]}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `No documentation found for "${args.query}". Available topics: ${Object.keys(documentation).join(", ")}`,
          },
        ],
      };
    }

    case "cc_docs_list_topics": {
      const topics = Object.keys(documentation).map((key) => {
        const firstLine = documentation[key].split("\n").find((l) => l.startsWith("# ")) || key;
        return `- **${key}**: ${firstLine.replace(/^#\s*/, "")}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `# Available Claude Code Documentation Topics\n\n${topics.join("\n")}\n\nUse \`cc_docs_full_reference\` with a topic key to get complete documentation.`,
          },
        ],
      };
    }

    case "cc_docs_full_reference": {
      const topic = args.topic;
      if (documentation[topic]) {
        return {
          content: [{ type: "text", text: documentation[topic] }],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Topic "${topic}" not found. Available: ${Object.keys(documentation).join(", ")}`,
          },
        ],
      };
    }

    case "cc_docs_env_vars": {
      const envDocs = documentation["cli-reference"] || "";
      const envSection = envDocs.split("## Environment Variables")[1]?.split("\n## ")[0] || "";
      return {
        content: [
          {
            type: "text",
            text: `# Claude Code Environment Variables\n\n${envSection || "See cli-reference documentation for full environment variables list."}`,
          },
        ],
      };
    }

    case "cc_docs_settings_schema": {
      const settingsDocs = documentation["settings-deep-dive"] || "";
      return {
        content: [{ type: "text", text: settingsDocs }],
      };
    }

    case "cc_docs_troubleshoot": {
      const troubleDocs = documentation["troubleshooting"] || "";
      const issue = (args.issue || "").toLowerCase();

      // Find relevant section
      const sections = troubleDocs.split("### ");
      let relevant = [];
      for (const section of sections) {
        if (section.toLowerCase().includes(issue) || issue.split(/\s+/).some((w) => section.toLowerCase().includes(w))) {
          relevant.push("### " + section);
        }
      }

      if (relevant.length > 0) {
        return {
          content: [
            {
              type: "text",
              text: `# Troubleshooting: ${args.issue}\n\n${relevant.join("\n\n")}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `# Troubleshooting: ${args.issue}\n\n${troubleDocs}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
