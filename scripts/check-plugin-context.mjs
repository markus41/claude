#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const MAX_LINES = 120;
const MAX_ESTIMATED_TOKENS = 750;
const MAX_CONTEXT_MAX_TOKENS = 1200;
const SUMMARY_OR_INDEX_FILE = /(?:^|\/)(?:[^/]*summary|index)\.md$/i;
const REQUIRED_EXCLUDE_GLOBS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/*.zip',
  '**/*.tar*'
];
const DEEPER_DOCS_DECISION_TABLE_HEADER = /\|\s*Signal\s*\|\s*Open docs\s*\|\s*Why\s*\|/i;

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

  const bootstrapFiles = manifest?.context?.bootstrapFiles;
  if (!Array.isArray(bootstrapFiles) || bootstrapFiles.length === 0) {
    fail(`${pluginName}: plugin cannot be published without context.bootstrapFiles`);
    continue;
  }

  const summaryPath = path.join(pluginRoot, "CONTEXT_SUMMARY.md");
  if (!fs.existsSync(summaryPath)) {
    fail(`${pluginName}: plugin cannot be published without CONTEXT_SUMMARY.md`);
    continue;
  }

  const claudeGuidePath = path.join(pluginRoot, 'CLAUDE.md');
  if (!fs.existsSync(claudeGuidePath)) {
    fail(`${pluginName}: plugin cannot be published without CLAUDE.md`);
    continue;
  }

  for (const bootstrapFile of bootstrapFiles) {
    if (!SUMMARY_OR_INDEX_FILE.test(bootstrapFile)) {
      fail(`${pluginName}: bootstrap file ${bootstrapFile} must be a summary/index markdown file`);
    }
  }

  if (manifest?.context?.maxTokens > MAX_CONTEXT_MAX_TOKENS) {
    fail(`${pluginName}: context.maxTokens is ${manifest.context.maxTokens} (max ${MAX_CONTEXT_MAX_TOKENS})`);
  }

  const excludeGlobs = manifest?.context?.excludeGlobs;
  const missingExcludeGlobs = REQUIRED_EXCLUDE_GLOBS.filter((glob) => !excludeGlobs?.includes(glob));
  if (missingExcludeGlobs.length > 0) {
    fail(`${pluginName}: context.excludeGlobs is missing defaults: ${missingExcludeGlobs.join(', ')}`);
  }

  const summaryText = fs.readFileSync(summaryPath, 'utf8');
  if (!/when to open deeper docs/i.test(summaryText) || !DEEPER_DOCS_DECISION_TABLE_HEADER.test(summaryText)) {
    fail(`${pluginName}: CONTEXT_SUMMARY.md must include a "when to open deeper docs" decision table`);
  }

  for (const bootstrapFile of bootstrapFiles) {
    const contextPath = path.join(pluginRoot, bootstrapFile);

    if (!fs.existsSync(contextPath)) {
      fail(`${pluginName}: missing bootstrap context file at ${bootstrapFile}`);
      continue;
    }

    const text = fs.readFileSync(contextPath, 'utf8');
    const lines = text.split('\n').length;
    const tokens = estimateTokens(text);

    if (lines > MAX_LINES) {
      fail(`${pluginName}: ${bootstrapFile} has ${lines} lines (max ${MAX_LINES})`);
    }

    if (tokens > MAX_ESTIMATED_TOKENS) {
      fail(`${pluginName}: ${bootstrapFile} estimated ${tokens} tokens (max ${MAX_ESTIMATED_TOKENS})`);
    }
  }
}

if (process.exitCode !== 1) {
  console.log('✅ Plugin context entry checks passed.');
}
