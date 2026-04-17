#!/usr/bin/env node
// Smoke test for MCP v5.0.0 KB tools. Run: `node mcp-server/test/tools.test.js`
// Validates: all KB artifacts load, every artifact ≤ 2 KB, every tool returns non-empty.

import { getKb, listKb, formatKb } from "../src/kb.js";
import { statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_ROOT = join(__dirname, "..", "kb");
const MAX_BYTES = 2048;
let fail = 0;

function assert(cond, msg) {
  if (!cond) { console.error("FAIL:", msg); fail++; }
}

console.log("== MCP v5.0 KB smoke test ==");

// 1. Every category directory exists and has at least one artifact.
for (const cat of ["hooks", "topologies", "workflows", "channels", "lsp", "patterns", "autonomy"]) {
  const items = listKb(cat);
  console.log(`[${cat}] ${items.length} artifacts: ${items.join(", ")}`);
  assert(items.length > 0, `category ${cat} has no artifacts`);

  for (const name of items) {
    const art = getKb(cat, name);
    assert(art !== null, `${cat}/${name} failed to load`);
    if (!art) continue;
    assert(art.size <= MAX_BYTES, `${cat}/${name} is ${art.size} bytes (max ${MAX_BYTES})`);
    const rendered = formatKb(art);
    assert(rendered && rendered.length > 0, `${cat}/${name} rendered empty`);
  }
}

// 2. Reject invalid names.
try {
  getKb("hooks", "../etc/passwd");
  assert(false, "path traversal should have thrown");
} catch (e) {
  assert(String(e.message).includes("Invalid KB name"), "wrong error for traversal");
}

// 3. Reject unknown category.
try {
  getKb("nonexistent", "foo");
  assert(false, "unknown category should have thrown");
} catch (e) {
  assert(String(e.message).includes("Unknown KB category"), "wrong error for unknown category");
}

// 4. Non-existent artifact returns null (not throws).
const missing = getKb("hooks", "this-does-not-exist");
assert(missing === null, "missing artifact should return null");

console.log(`\n== ${fail === 0 ? "PASS" : `FAIL (${fail} errors)`} ==`);
process.exit(fail === 0 ? 0 : 1);
