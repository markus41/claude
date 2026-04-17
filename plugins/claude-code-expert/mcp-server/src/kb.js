// Knowledge Base loader for Claude Code Expert MCP v5.0.0
// Each artifact is ≤ 2 KB JSON (or .ts.txt for code) loaded lazily from kb/.
// No artifact is loaded into Node memory until a tool handler asks for it.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_ROOT = join(__dirname, "..", "kb");

const CATEGORIES = {
  hooks: { ext: ".json", label: "hook recipe" },
  topologies: { ext: ".json", label: "agent-team topology kit" },
  workflows: { ext: ".json", label: "workflow pack" },
  channels: { ext: ".ts.txt", label: "channel server implementation" },
  lsp: { ext: ".json", label: "LSP server config" },
  patterns: { ext: ".json", label: "agentic pattern template" },
  autonomy: { ext: ".json", label: "autonomy profile" },
};

function categoryDir(category) {
  if (!CATEGORIES[category]) {
    throw new Error(`Unknown KB category: ${category}. Known: ${Object.keys(CATEGORIES).join(", ")}`);
  }
  return join(KB_ROOT, category);
}

// List available artifact names for a category (names = filename without extension).
export function listKb(category) {
  const dir = categoryDir(category);
  if (!existsSync(dir)) return [];
  const { ext } = CATEGORIES[category];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => f.slice(0, -ext.length))
    .sort();
}

// Load one artifact. Returns { name, category, content, size } or null if not found.
export function getKb(category, name) {
  const dir = categoryDir(category);
  const { ext, label } = CATEGORIES[category];
  const safe = String(name || "").replace(/[^a-z0-9_-]/gi, "");
  if (!safe || safe !== String(name)) {
    throw new Error(`Invalid KB name: "${name}" (letters, digits, _ and - only)`);
  }
  const path = join(dir, `${safe}${ext}`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf8");
  const content = category === "channels" ? raw : JSON.parse(raw);
  return { name: safe, category, label, content, size: Buffer.byteLength(raw, "utf8") };
}

// Format an artifact as a markdown response body for a tool result.
export function formatKb(artifact) {
  if (!artifact) return null;
  const { name, category, label, content } = artifact;
  if (category === "channels") {
    return `# Channel server: ${name}\n\n\`\`\`typescript\n${content}\n\`\`\``;
  }
  // JSON artifacts — render summary, then full JSON.
  const lines = [`# ${label}: ${name}`, ""];
  if (content.summary) lines.push(content.summary, "");
  if (content.when_to_use) lines.push("**When to use:** " + content.when_to_use, "");
  lines.push("```json", JSON.stringify(content, null, 2), "```");
  return lines.join("\n");
}

// Return a "not found" message with suggestions.
export function notFoundMessage(category, requested) {
  const available = listKb(category);
  const { label } = CATEGORIES[category];
  if (available.length === 0) {
    return `No ${label}s installed. KB directory \`kb/${category}/\` is empty.`;
  }
  return `${label.charAt(0).toUpperCase() + label.slice(1)} "${requested}" not found.\n\nAvailable:\n${available.map((n) => `- \`${n}\``).join("\n")}`;
}
