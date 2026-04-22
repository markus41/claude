#!/usr/bin/env node
/**
 * Marketplace-wide validation.
 * Checks every plugin for the things that actually cause Claude Code cache errors on load:
 *   1. marketplace.json is valid JSON and every plugin source path resolves to a manifest
 *   2. Every plugin.json is valid JSON with required fields (name, version, description, author)
 *   3. Every file referenced from plugin.json commands/skills/agents/hooks exists and has YAML frontmatter
 *   4. MCP server entry-point args that reference ${CLAUDE_PLUGIN_ROOT} point to tracked files
 *   5. Every .md under commands/ agents/ hooks/ and every SKILL.md has YAML frontmatter,
 *      even when the manifest doesn't list it explicitly (Claude Code auto-discovers these dirs)
 *
 * Exits non-zero if any check fails.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const MARKETPLACE = path.join(ROOT, '.claude-plugin', 'marketplace.json');

const failures = [];
const fail = (msg) => failures.push(msg);

function hasFrontmatter(content) {
  return /^---\r?\n[\s\S]*?\r?\n---/.test(content);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateMarketplaceFile() {
  if (!fs.existsSync(MARKETPLACE)) {
    fail(`marketplace.json not found at ${MARKETPLACE}`);
    return null;
  }
  try {
    const m = readJson(MARKETPLACE);
    if (!Array.isArray(m.plugins)) {
      fail('marketplace.json: "plugins" must be an array');
      return null;
    }
    if (!m.name || !m.version) {
      fail('marketplace.json: "name" and "version" are required');
    }
    return m;
  } catch (err) {
    fail(`marketplace.json: invalid JSON — ${err.message}`);
    return null;
  }
}

function validatePluginManifest(plugin) {
  const pluginRoot = path.resolve(ROOT, plugin.source);
  const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) {
    fail(`${plugin.name}: missing manifest at ${path.relative(ROOT, manifestPath)}`);
    return null;
  }
  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (err) {
    fail(`${plugin.name}: invalid plugin.json — ${err.message}`);
    return null;
  }
  for (const field of ['name', 'version', 'description']) {
    if (!manifest[field]) fail(`${plugin.name}: plugin.json missing required "${field}"`);
  }
  if (!manifest.author) {
    fail(`${plugin.name}: plugin.json missing required "author"`);
  }
  return { pluginRoot, manifest };
}

function validateManifestReferences(plugin, pluginRoot, manifest) {
  for (const type of ['commands', 'agents', 'skills', 'hooks']) {
    const entries = manifest[type];
    if (!entries || typeof entries !== 'object') continue;
    for (const [key, value] of Object.entries(entries)) {
      if (typeof value !== 'string') continue;
      const full = path.join(pluginRoot, value);
      if (!fs.existsSync(full)) {
        fail(`${plugin.name}: ${type}/${key} references missing file ${value}`);
        continue;
      }
      const content = fs.readFileSync(full, 'utf8');
      if (!hasFrontmatter(content)) {
        fail(`${plugin.name}: ${type}/${key} (${value}) is missing YAML frontmatter`);
      }
    }
  }
}

function validateMcpServerPaths(plugin, pluginRoot, manifest) {
  const servers = manifest.mcpServers;
  if (!servers || typeof servers !== 'object' || Array.isArray(servers)) return;
  for (const [name, def] of Object.entries(servers)) {
    if (!def || !Array.isArray(def.args)) continue;
    for (const arg of def.args) {
      if (typeof arg !== 'string' || !arg.includes('${CLAUDE_PLUGIN_ROOT}')) continue;
      const rel = arg.replace(/.*\$\{CLAUDE_PLUGIN_ROOT\}\/?/, '');
      const full = path.join(pluginRoot, rel);
      if (!fs.existsSync(full)) {
        fail(`${plugin.name}: mcpServers.${name} entry point ${rel} does not exist (likely a gitignored build artifact)`);
      }
    }
  }
}

function validateDiscoveredFiles(plugin, pluginRoot) {
  // Claude Code auto-loads .md files from these directories; every file must have frontmatter
  // or the plugin load will fail with a cache error.
  const dirs = ['commands', 'agents', 'hooks'];
  for (const dir of dirs) {
    const full = path.join(pluginRoot, dir);
    if (!fs.existsSync(full)) continue;
    const entries = fs.readdirSync(full, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      // Skip documentation files in hooks/: README, ARCHITECTURE, EXAMPLES, HOOKS-SUMMARY, IMPLEMENTATION, VERIFICATION
      if (dir === 'hooks' && /^(README|ARCHITECTURE|EXAMPLES|HOOKS-SUMMARY|IMPLEMENTATION|VERIFICATION)\.md$/.test(entry.name)) continue;
      if (entry.name === 'README.md') continue;
      const filePath = path.join(full, entry.name);
      const content = fs.readFileSync(filePath, 'utf8');
      if (!hasFrontmatter(content)) {
        fail(`${plugin.name}: ${dir}/${entry.name} is missing YAML frontmatter (auto-discovered by Claude Code)`);
      }
    }
  }
  // SKILL.md under every skills/<name>/ directory
  const skillsRoot = path.join(pluginRoot, 'skills');
  if (fs.existsSync(skillsRoot)) {
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillFile = path.join(skillsRoot, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;
      const content = fs.readFileSync(skillFile, 'utf8');
      if (!hasFrontmatter(content)) {
        fail(`${plugin.name}: skills/${entry.name}/SKILL.md is missing YAML frontmatter`);
      }
    }
  }
}

function main() {
  console.log('Validating marketplace...\n');
  const marketplace = validateMarketplaceFile();
  if (!marketplace) {
    process.exit(1);
  }

  console.log(`Marketplace: ${marketplace.name} v${marketplace.version}`);
  console.log(`Plugins declared: ${marketplace.plugins.length}\n`);

  let ok = 0;
  for (const plugin of marketplace.plugins) {
    const before = failures.length;
    const result = validatePluginManifest(plugin);
    if (result) {
      validateManifestReferences(plugin, result.pluginRoot, result.manifest);
      validateMcpServerPaths(plugin, result.pluginRoot, result.manifest);
      validateDiscoveredFiles(plugin, result.pluginRoot);
    }
    if (failures.length === before) {
      console.log(`  OK  ${plugin.name}`);
      ok++;
    } else {
      console.log(`  ERR ${plugin.name}`);
    }
  }

  console.log(`\nResult: ${ok}/${marketplace.plugins.length} plugins valid`);

  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log('All plugins pass marketplace validation.');
}

main();
