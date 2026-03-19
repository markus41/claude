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
  {
    kind: "ci-cd",
    match: ["ci", "cd", "pipeline", "github actions", "pre-commit", "automated review", "headless"],
    docs: ["cc-cicd", "cicd-integration", "agent-sdk"],
  },
  {
    kind: "model",
    match: ["model", "cost", "budget", "routing", "expensive", "cheap", "haiku", "sonnet", "opus"],
    docs: ["model-routing", "cost-optimization", "cc-perf"],
  },
  {
    kind: "security",
    match: ["security", "audit", "compliance", "soc2", "secrets", "enterprise", "hipaa", "gdpr", "permissions"],
    docs: ["enterprise-security", "permissions-security", "security-compliance-advisor", "cc-council"],
  },
  {
    kind: "context",
    match: ["context", "budget", "compact", "tokens", "anchor", "window", "overflow"],
    docs: ["cc-budget", "context-budgeting", "context-management", "context-anchoring"],
  },
  {
    kind: "plugin",
    match: ["plugin", "build plugin", "create plugin", "scaffold", "marketplace", "manifest"],
    docs: ["plugin-development", "plugin-architect", "cc-mcp"],
  },
  {
    kind: "performance",
    match: ["performance", "slow", "expensive", "optimize", "cache", "profiling", "waste"],
    docs: ["cc-perf", "session-analytics", "cost-optimization", "model-routing"],
  },
  {
    kind: "teams",
    match: ["agent team", "teammate", "worktree", "parallel session", "mesh", "coordinate"],
    docs: ["agent-teams-advanced", "teams-architect", "cc-orchestrate", "teams-collaboration"],
  },
  {
    kind: "prompt",
    match: ["prompt", "instructions", "claude.md", "rule writing", "effective prompt"],
    docs: ["prompt-engineering", "memory-instructions", "configuration"],
  },
  {
    kind: "tutorial",
    match: ["tutorial", "example", "walkthrough", "how to", "learn", "getting started"],
    docs: ["worked-examples", "cc-learn", "cc-help"],
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

// --- Model routing data for cc_docs_model_recommend ---
const MODEL_DATA = {
  "opus": { id: "claude-opus-4-6", inputCost: 15.00, outputCost: 75.00, cacheRead: 1.50, best: "architecture, complex debugging, security review" },
  "sonnet": { id: "claude-sonnet-4-6", inputCost: 3.00, outputCost: 15.00, cacheRead: 0.30, best: "implementation, code review, refactoring, test writing" },
  "haiku": { id: "claude-haiku-4-5-20251001", inputCost: 0.80, outputCost: 4.00, cacheRead: 0.08, best: "lookups, research, docs, simple Q&A, commit messages" },
};

const TASK_MODEL_MAP = [
  { patterns: ["architecture", "design", "complex", "security review", "audit"], model: "opus", reason: "Deep multi-step reasoning required" },
  { patterns: ["debug", "root cause", "hard bug", "race condition", "flaky"], model: "opus", reason: "Complex hypothesis evaluation" },
  { patterns: ["implement", "build", "create", "add feature", "refactor", "code review", "test"], model: "sonnet", reason: "Best cost/quality for code generation" },
  { patterns: ["search", "find", "lookup", "list", "grep", "read", "summarize", "research", "docs"], model: "haiku", reason: "Simple task, cheapest model sufficient" },
];

function recommendModel(task, budget) {
  const normalized = task.toLowerCase();
  let rec = { model: "sonnet", reason: "Default: good balance of cost and quality" };
  for (const entry of TASK_MODEL_MAP) {
    if (entry.patterns.some((p) => normalized.includes(p))) {
      rec = { model: entry.model, reason: entry.reason };
      break;
    }
  }
  const data = MODEL_DATA[rec.model];
  const estInputTokens = normalized.length > 100 ? 200000 : normalized.length > 50 ? 100000 : 50000;
  const estOutputTokens = Math.round(estInputTokens * 0.2);
  const estCost = (estInputTokens / 1e6) * data.inputCost + (estOutputTokens / 1e6) * data.outputCost;

  if (budget) {
    const budgetNum = parseFloat(budget.replace("$", ""));
    if (!isNaN(budgetNum) && estCost > budgetNum && rec.model !== "haiku") {
      const fallback = rec.model === "opus" ? "sonnet" : "haiku";
      const fbData = MODEL_DATA[fallback];
      const fbCost = (estInputTokens / 1e6) * fbData.inputCost + (estOutputTokens / 1e6) * fbData.outputCost;
      return {
        recommended: fallback, id: fbData.id, reason: `Budget constraint: ${rec.model} estimated at $${estCost.toFixed(2)} exceeds $${budgetNum.toFixed(2)}. Downgraded to ${fallback}.`,
        estimatedCost: `$${fbCost.toFixed(2)}`, originalRecommendation: rec.model,
      };
    }
  }
  return { recommended: rec.model, id: data.id, reason: rec.reason, estimatedCost: `$${estCost.toFixed(2)}` };
}

// --- Checklist data for cc_docs_checklist ---
const CHECKLISTS = {
  setup: [
    "1. Run `/init` to generate starter CLAUDE.md",
    "2. Review and customize CLAUDE.md (keep under 200 lines)",
    "3. Create `.claude/rules/` for path-scoped instructions",
    "4. Configure MCP servers in `.mcp.json` (`/cc-mcp add`)",
    "5. Set up hooks in settings.json (`/cc-hooks create`)",
    "6. Configure permissions (`/cc-config generate`)",
    "7. Install relevant plugins (`/cc-plugin install`)",
    "8. Run `/cc-setup --audit` to validate configuration",
    "9. Enable auto memory for cross-session learning",
    "10. Set model preferences in settings.json",
  ],
  review: [
    "1. Identify review scope (files, PR, architecture)",
    "2. Choose protocol: `/cc-council --protocol expert-panel` for standard, `red-blue-team` for adversarial",
    "3. Select preset: `quick` (fast), `standard`, `security`, `performance`, `full`",
    "4. Set depth: `standard` for most, `deep` for critical code",
    "5. Run the review and examine scoring",
    "6. Address HIGH and CRITICAL findings first",
    "7. Re-run on changed files to verify fixes",
  ],
  debug: [
    "1. Reproduce the issue and capture error messages",
    "2. Run `/cc-intel --mode debug` for root cause analysis",
    "3. Build hypothesis ladder (most likely, competing, edge case)",
    "4. Collect evidence for each hypothesis",
    "5. Use Opus model for complex debugging",
    "6. Check lessons-learned.md for known patterns",
    "7. Verify fix resolves root cause, not just symptom",
    "8. Update lessons-learned.md with fix and prevention",
  ],
  deploy: [
    "1. Run tests: `pnpm test`",
    "2. Run type check: `npx tsc --noEmit`",
    "3. Run lint: `npx eslint .`",
    "4. Run `/cc-council --preset pre-merge` on changed files",
    "5. Check for secrets or credentials in diff",
    "6. Verify CI pipeline passes",
    "7. Create PR with clear description",
    "8. Request review from appropriate team members",
  ],
  security: [
    "1. Run `/cc-council --preset security` on codebase",
    "2. Check for hardcoded secrets (API keys, passwords, tokens)",
    "3. Verify input validation on all external inputs",
    "4. Check authentication and authorization patterns",
    "5. Review dependency versions for known CVEs",
    "6. Verify no SQL injection, XSS, or command injection vectors",
    "7. Check file access patterns for path traversal",
    "8. Review hook scripts for injection vulnerabilities",
    "9. Audit MCP server configurations for over-permissive access",
    "10. Generate compliance report with `/cc-council --preset compliance`",
  ],
};

// --- Compare helper for cc_docs_compare ---
function compareDocuments(ids) {
  const docs = ids.map((id) => documentationById.get(id)).filter(Boolean);
  if (docs.length < 2) return null;

  const rows = docs.map((doc) => ({
    id: doc.id, type: doc.type, title: doc.title, summary: doc.summary,
    cost: doc.metadata.cost || "unknown", risk: doc.metadata.risk || "unknown",
    model: doc.metadata.model || "n/a",
  }));

  const header = "| Aspect | " + rows.map((r) => r.title).join(" | ") + " |";
  const divider = "|--------|" + rows.map(() => "--------").join("|") + "|";
  const typeRow = "| Type | " + rows.map((r) => r.type).join(" | ") + " |";
  const summaryRow = "| Purpose | " + rows.map((r) => r.summary.slice(0, 80)).join(" | ") + " |";
  const costRow = "| Cost | " + rows.map((r) => r.cost).join(" | ") + " |";
  const riskRow = "| Risk | " + rows.map((r) => r.risk).join(" | ") + " |";
  const modelRow = "| Model | " + rows.map((r) => r.model).join(" | ") + " |";

  return [header, divider, typeRow, summaryRow, costRow, riskRow, modelRow].join("\n");
}

const server = new Server(
  { name: "claude-code-docs", version: "3.0.0" },
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
    {
      name: "cc_docs_model_recommend",
      description:
        "Recommend the optimal Claude model for a task with cost estimate. Accepts a task description and optional budget ceiling.",
      inputSchema: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "Description of the task, e.g. 'refactor the auth module' or 'quick file lookup'.",
          },
          budget: {
            type: "string",
            description: "Optional cost ceiling, e.g. '$0.50' or '$2.00'. If the recommended model exceeds this, a cheaper alternative is suggested.",
          },
        },
        required: ["task"],
      },
    },
    {
      name: "cc_docs_checklist",
      description:
        "Get a step-by-step checklist for a common task type, aggregated from relevant commands and skills.",
      inputSchema: {
        type: "object",
        properties: {
          task_type: {
            type: "string",
            description: "Type of task to get a checklist for.",
            enum: ["setup", "review", "debug", "deploy", "security"],
          },
        },
        required: ["task_type"],
      },
    },
    {
      name: "cc_docs_compare",
      description:
        "Compare 2-3 commands, skills, or agents side-by-side. Returns a comparison table with purpose, cost, risk, and model.",
      inputSchema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { type: "string" },
            description: "Array of 2-3 topic IDs to compare, e.g. ['cc-intel', 'cc-council'] or ['builder-validator', 'qa-swarm'].",
          },
        },
        required: ["items"],
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

    case "cc_docs_model_recommend": {
      const result = recommendModel(args.task || "", args.budget);
      const lines = [
        `# Model Recommendation`,
        ``,
        `**Task:** ${args.task}`,
        `**Recommended model:** ${result.recommended} (\`${result.id}\`)`,
        `**Reason:** ${result.reason}`,
        `**Estimated cost:** ${result.estimatedCost}`,
      ];
      if (result.originalRecommendation) {
        lines.push(`**Original recommendation:** ${result.originalRecommendation} (exceeded budget)`);
      }
      if (args.budget) {
        lines.push(`**Budget:** ${args.budget}`);
      }
      lines.push(``, `## All models`, ``);
      for (const [name, data] of Object.entries(MODEL_DATA)) {
        lines.push(`- **${name}** (\`${data.id}\`): $${data.inputCost}/M input, $${data.outputCost}/M output — ${data.best}`);
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }

    case "cc_docs_checklist": {
      const taskType = args.task_type || "setup";
      const steps = CHECKLISTS[taskType];
      if (!steps) {
        return { content: [{ type: "text", text: `Unknown task type "${taskType}". Available: ${Object.keys(CHECKLISTS).join(", ")}` }] };
      }
      return {
        content: [{ type: "text", text: `# ${taskType.charAt(0).toUpperCase() + taskType.slice(1)} Checklist\n\n${steps.join("\n")}` }],
      };
    }

    case "cc_docs_compare": {
      const items = args.items || [];
      if (items.length < 2) {
        return { content: [{ type: "text", text: "Provide at least 2 topic IDs to compare." }] };
      }
      const table = compareDocuments(items.slice(0, 3));
      if (!table) {
        return { content: [{ type: "text", text: `Could not find documents for: ${items.join(", ")}. Use cc_docs_list_topics to see available IDs.` }] };
      }
      return {
        content: [{ type: "text", text: `# Comparison: ${items.join(" vs ")}\n\n${table}` }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
