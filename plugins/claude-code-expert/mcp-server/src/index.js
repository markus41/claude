#!/usr/bin/env node

/**
 * Claude Code Documentation MCP Server
 *
 * Provides Claude Code plugin documentation as queryable MCP tools.
 * Indexes skills, commands, and agents so Claude can retrieve targeted
 * guidance and resolve a natural-language task into the best workflow.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = join(__dirname, "../..");
const DOC_SOURCES = [
  { type: "skill", dir: join(PLUGIN_ROOT, "skills"), fileName: "SKILL.md" },
  { type: "command", dir: join(PLUGIN_ROOT, "commands"), fileName: null },
  { type: "agent", dir: join(PLUGIN_ROOT, "agents"), fileName: null },
];

function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return { metadata: {}, body: content };
  }

  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    return { metadata: {}, body: content };
  }

  const raw = content.slice(4, end).split("\n");
  const metadata = {};
  let currentArrayKey = null;

  for (const line of raw) {
    if (!line.trim()) continue;
    const arrayMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (arrayMatch) {
      currentArrayKey = arrayMatch[1];
      metadata[currentArrayKey] = [];
      continue;
    }

    const listMatch = line.match(/^\s*-\s*(.+)$/);
    if (listMatch && currentArrayKey) {
      metadata[currentArrayKey].push(listMatch[1].trim().replace(/^['"]|['"]$/g, ""));
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (keyValueMatch) {
      currentArrayKey = null;
      metadata[keyValueMatch[1]] = keyValueMatch[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return {
    metadata,
    body: content.slice(end + 4).replace(/^\n/, ""),
  };
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[`_*#:/(){}\[\],.|]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function loadDocumentation() {
  const docs = [];

  for (const source of DOC_SOURCES) {
    if (!existsSync(source.dir)) continue;

    for (const entry of readdirSync(source.dir, { withFileTypes: true })) {
      let filePath;
      let id;

      if (source.type === "skill") {
        if (!entry.isDirectory()) continue;
        filePath = join(source.dir, entry.name, source.fileName);
        id = entry.name;
      } else {
        if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
        filePath = join(source.dir, entry.name);
        id = basename(entry.name, ".md");
      }

      if (!existsSync(filePath)) continue;

      const raw = readFileSync(filePath, "utf-8");
      const { metadata, body } = parseFrontmatter(raw);
      const titleLine = body.split("\n").find((line) => line.startsWith("# ")) || id;
      const title = titleLine.replace(/^#\s*/, "").trim();
      const summary = metadata.intent || metadata.description || body.split("\n").find((line) => line.trim()) || title;
      const keywords = unique([
        id,
        title,
        summary,
        ...(Array.isArray(metadata.tags) ? metadata.tags : []),
        ...(Array.isArray(metadata.inputs) ? metadata.inputs : []),
        ...(Array.isArray(metadata.triggers) ? metadata.triggers : []),
      ].flatMap(tokenize));

      docs.push({
        id,
        type: source.type,
        path: filePath.replace(`${PLUGIN_ROOT}/`, ""),
        title,
        summary,
        content: raw,
        body,
        metadata,
        keywords,
      });
    }
  }

  return docs;
}

const documentation = loadDocumentation();
const documentationById = new Map(documentation.map((doc) => [doc.id, doc]));

const TOPIC_MAP = Object.fromEntries(
  documentation.flatMap((doc) => [
    [doc.id, doc.id],
    [doc.title.toLowerCase(), doc.id],
    ...doc.keywords.map((keyword) => [keyword, doc.id]),
  ])
);

const TASK_HINTS = [
  {
    kind: "debug",
    match: ["bug", "issue", "error", "fail", "broken", "root cause", "flaky", "regression"],
    docs: ["cc-intel", "principal-engineer-strategist", "troubleshooting", "cc-debug"],
  },
  {
    kind: "architecture",
    match: ["architecture", "design", "refactor", "scalable", "migration", "approach", "smartest"],
    docs: ["cc-intel", "deep-code-intelligence", "principal-engineer-strategist", "cc-council"],
  },
  {
    kind: "orchestration",
    match: ["team", "parallel", "multi-agent", "orchestrate", "delegate", "swarm"],
    docs: ["cc-orchestrate", "team-orchestrator", "council-review", "agent-lifecycle"],
  },
  {
    kind: "research",
    match: ["docs", "official", "library", "research", "latest", "compare", "sources"],
    docs: ["research-routing", "research-orchestrator", "mcp-servers", "cc-mcp"],
  },
  {
    kind: "setup",
    match: ["setup", "install", "configure", "settings", "hooks", "claude", "mcp"],
    docs: ["cc-setup", "configuration", "settings-deep-dive", "cc-config"],
  },
];

function scoreDoc(doc, queryTokens) {
  const haystack = `${doc.id} ${doc.title} ${doc.summary} ${doc.body}`.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (doc.id === token) score += 12;
    if (doc.keywords.includes(token)) score += 8;
    if (doc.title.toLowerCase().includes(token)) score += 6;
    if (doc.summary.toLowerCase().includes(token)) score += 4;
    const matches = haystack.split(token).length - 1;
    score += Math.min(matches, 5);
  }

  return score;
}

function extractSnippet(doc, queryTokens) {
  const lines = doc.body.split("\n");
  let bestIndex = 0;
  let bestScore = -1;

  lines.forEach((line, index) => {
    const normalized = line.toLowerCase();
    const score = queryTokens.reduce((acc, token) => acc + (normalized.includes(token) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  const start = Math.max(bestIndex - 1, 0);
  const end = Math.min(bestIndex + 3, lines.length);
  return lines.slice(start, end).join("\n").trim();
}

function rankDocuments(query, limit = 5) {
  const queryTokens = unique(tokenize(query));
  return documentation
    .map((doc) => ({ doc, score: scoreDoc(doc, queryTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, score }) => ({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      summary: doc.summary,
      path: doc.path,
      score,
      snippet: extractSnippet(doc, queryTokens),
    }));
}

function resolveTask(query) {
  const normalized = String(query || "").toLowerCase();
  const hinted = TASK_HINTS
    .filter((hint) => hint.match.some((token) => normalized.includes(token)))
    .flatMap((hint) => hint.docs)
    .map((id) => documentationById.get(id))
    .filter(Boolean);

  const ranked = rankDocuments(query, 6).map((entry) => documentationById.get(entry.id)).filter(Boolean);
  const combined = unique([...hinted, ...ranked].map((doc) => doc.id))
    .map((id) => documentationById.get(id))
    .filter(Boolean);

  const commands = combined.filter((doc) => doc.type === "command").slice(0, 3);
  const agents = combined.filter((doc) => doc.type === "agent").slice(0, 3);
  const skills = combined.filter((doc) => doc.type === "skill").slice(0, 4);

  const workflow = [];
  if (commands[0]) workflow.push(`Start with \`${commands[0].id}\` for the highest leverage workflow.`);
  if (skills[0]) workflow.push(`Load \`${skills[0].id}\` to improve reasoning quality and decision framing.`);
  if (agents[0]) workflow.push(`Invoke \`${agents[0].id}\` when you need a specialist pass or second opinion.`);
  if (commands[1]) workflow.push(`Follow with \`${commands[1].id}\` if the task expands into orchestration or review.`);

  return { commands, agents, skills, workflow };
}

const server = new Server(
  { name: "claude-code-docs", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cc_docs_search",
      description:
        "Search Claude Code expert documentation across skills, commands, and agents. Returns ranked matches with short snippets and exact file paths.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Natural-language topic to search for, such as 'root cause analysis', 'hooks', 'orchestrate review board', or 'best refactor strategy'.",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "cc_docs_list_topics",
      description: "List all available documentation topics grouped by type.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cc_docs_full_reference",
      description: "Get the complete documentation for a specific topic key.",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Exact topic key, e.g. 'cc-intel', 'deep-code-intelligence', or 'principal-engineer-strategist'.",
            enum: documentation.map((doc) => doc.id),
          },
        },
        required: ["topic"],
      },
    },
    {
      name: "cc_docs_env_vars",
      description: "Get a reference of Claude Code environment variables from the CLI reference docs.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cc_docs_settings_schema",
      description: "Get the settings.json schema guidance from the settings deep-dive docs.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "cc_docs_troubleshoot",
      description: "Get troubleshooting guidance for a specific Claude Code issue or error message.",
      inputSchema: {
        type: "object",
        properties: {
          issue: {
            type: "string",
            description: "Issue description or error message.",
          },
        },
        required: ["issue"],
      },
    },
    {
      name: "cc_docs_resolve_task",
      description:
        "Resolve a natural-language engineering task into the best commands, agents, and skills to load next.",
      inputSchema: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description:
              "Natural-language task, e.g. 'find the safest fix for a flaky websocket reconnect bug'.",
          },
        },
        required: ["task"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  switch (name) {
    case "cc_docs_search": {
      const matches = rankDocuments(args.query || "", 5);
      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No documentation found for "${args.query}". Try a broader query or list topics first.`,
            },
          ],
        };
      }

      const body = matches
        .map(
          (match, index) =>
            `## ${index + 1}. ${match.title}\n- Topic: \`${match.id}\` (${match.type})\n- Path: \`${match.path}\`\n- Score: ${match.score}\n- Summary: ${match.summary}\n- Snippet:\n\n${match.snippet}`
        )
        .join("\n\n");

      return { content: [{ type: "text", text: `# Search results for: ${args.query}\n\n${body}` }] };
    }

    case "cc_docs_list_topics": {
      const groups = ["command", "agent", "skill"].map((type) => {
        const docs = documentation
          .filter((doc) => doc.type === type)
          .map((doc) => `- \`${doc.id}\`: ${doc.summary}`)
          .join("\n");
        return `## ${type[0].toUpperCase()}${type.slice(1)}s\n${docs}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `# Available Claude Code Expert Topics\n\n${groups.join("\n\n")}`,
          },
        ],
      };
    }

    case "cc_docs_full_reference": {
      const topic = documentationById.get(args.topic) || documentationById.get(TOPIC_MAP[String(args.topic || "").toLowerCase()]);
      if (!topic) {
        return {
          content: [{ type: "text", text: `Topic "${args.topic}" not found.` }],
        };
      }
      return { content: [{ type: "text", text: topic.content }] };
    }

    case "cc_docs_env_vars": {
      const envDocs = documentationById.get("cli-reference")?.body || "";
      const envSection = envDocs.split("## Environment Variables")[1]?.split("\n## ")[0]?.trim();
      return {
        content: [
          {
            type: "text",
            text: `# Claude Code Environment Variables\n\n${envSection || "See cli-reference documentation for the full environment variable catalog."}`,
          },
        ],
      };
    }

    case "cc_docs_settings_schema": {
      const settingsDocs = documentationById.get("settings-deep-dive");
      return {
        content: [{ type: "text", text: settingsDocs?.content || "settings-deep-dive documentation not found." }],
      };
    }

    case "cc_docs_troubleshoot": {
      const issue = String(args.issue || "").toLowerCase();
      const troubleshooting = documentationById.get("troubleshooting");
      if (!troubleshooting) {
        return { content: [{ type: "text", text: "Troubleshooting documentation not found." }] };
      }

      const sections = troubleshooting.body.split("### ");
      const relevant = sections
        .filter((section) => issue.split(/\s+/).some((word) => word && section.toLowerCase().includes(word)))
        .map((section) => `### ${section}`);

      return {
        content: [
          {
            type: "text",
            text: `# Troubleshooting: ${args.issue}\n\n${relevant.length > 0 ? relevant.join("\n\n") : troubleshooting.body}`,
          },
        ],
      };
    }

    case "cc_docs_resolve_task": {
      const task = String(args.task || "");
      const resolution = resolveTask(task);
      const formatDocs = (docs) => docs.map((doc) => `- \`${doc.id}\` (${doc.type}): ${doc.summary}`).join("\n") || "- None";
      return {
        content: [
          {
            type: "text",
            text:
              `# Task resolution: ${task}\n\n` +
              `## Recommended commands\n${formatDocs(resolution.commands)}\n\n` +
              `## Recommended agents\n${formatDocs(resolution.agents)}\n\n` +
              `## Recommended skills\n${formatDocs(resolution.skills)}\n\n` +
              `## Suggested workflow\n${resolution.workflow.map((step, index) => `${index + 1}. ${step}`).join("\n") || "1. Search documentation and choose a starting command."}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
