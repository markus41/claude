#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const MAX_LINES = 120;
const MAX_ESTIMATED_TOKENS = 600;

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const pluginName of pluginDirs) {
  const pluginRoot = path.join(PLUGINS_DIR, pluginName);
  const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) continue;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const contextEntry = manifest.contextEntry;
  if (!contextEntry || typeof contextEntry !== 'string') {
    fail(`${pluginName}: plugin manifest is missing required "contextEntry" field`);
    continue;
  }
  const contextPath = path.join(pluginRoot, contextEntry);

  if (!fs.existsSync(contextPath)) {
    fail(`${pluginName}: missing context entry file at ${contextEntry}`);
    continue;
  }

  const text = fs.readFileSync(contextPath, 'utf8');
  const lines = text.split('\n').length;
  const tokens = estimateTokens(text);

  if (lines > MAX_LINES) {
    fail(`${pluginName}: ${contextEntry} has ${lines} lines (max ${MAX_LINES})`);
  }

  if (tokens > MAX_ESTIMATED_TOKENS) {
    fail(`${pluginName}: ${contextEntry} estimated ${tokens} tokens (max ${MAX_ESTIMATED_TOKENS})`);
  }
}

if (process.exitCode !== 1) {
  console.log('✅ Plugin context entry checks passed.');
}
