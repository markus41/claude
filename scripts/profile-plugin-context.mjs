#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const BASELINE_PATH = path.join(ROOT, 'scripts', 'plugin-context-baseline.json');
const ALLOWED_TOKEN_GROWTH = 80;
const ALLOWED_LINE_GROWTH = 20;

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function getPluginStats(pluginName) {
  const pluginRoot = path.join(PLUGINS_DIR, pluginName);
  const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) return null;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const bootstrapFiles = manifest?.context?.bootstrapFiles ?? [];

  let lines = 0;
  let estimatedTokens = 0;

  for (const file of bootstrapFiles) {
    const fullPath = path.join(pluginRoot, file);
    if (!fs.existsSync(fullPath)) continue;
    const text = fs.readFileSync(fullPath, 'utf8');
    lines += text.split('\n').length;
    estimatedTokens += estimateTokens(text);
  }

  return {
    bootstrapFileCount: bootstrapFiles.length,
    lines,
    estimatedTokens,
    maxTokens: manifest?.context?.maxTokens ?? 0
  };
}

const baseline = fs.existsSync(BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'))
  : { plugins: {} };

const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const current = { plugins: {} };
let hasFailure = false;

console.log('Plugin context footprint profile:\n');
console.log('Plugin | Files | Lines | EstTokens | maxTokens');
console.log('--- | ---: | ---: | ---: | ---:');

for (const pluginName of pluginDirs) {
  const stats = getPluginStats(pluginName);
  if (!stats) continue;

  current.plugins[pluginName] = stats;
  console.log(`${pluginName} | ${stats.bootstrapFileCount} | ${stats.lines} | ${stats.estimatedTokens} | ${stats.maxTokens}`);

  const baselineStats = baseline.plugins?.[pluginName];
  if (!baselineStats) continue;

  const tokenDelta = stats.estimatedTokens - baselineStats.estimatedTokens;
  const lineDelta = stats.lines - baselineStats.lines;

  if (tokenDelta > ALLOWED_TOKEN_GROWTH) {
    console.error(`\n❌ ${pluginName}: estimated tokens regressed by ${tokenDelta} (> ${ALLOWED_TOKEN_GROWTH})`);
    hasFailure = true;
  }

  if (lineDelta > ALLOWED_LINE_GROWTH) {
    console.error(`\n❌ ${pluginName}: bootstrap lines regressed by ${lineDelta} (> ${ALLOWED_LINE_GROWTH})`);
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log('\n✅ Plugin context footprint is within regression thresholds.');
}

if (process.argv.includes('--write-baseline')) {
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`📝 Baseline written to ${path.relative(ROOT, BASELINE_PATH)}`);
}
