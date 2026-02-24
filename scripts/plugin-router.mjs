#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT = process.cwd();

function tokenize(value) {
  return (value || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function scoreIntent(query, candidate) {
  const queryTokens = new Set(tokenize(query));
  const intentTokens = tokenize(candidate.intent);
  const tagTokens = (candidate.tags || []).flatMap(tokenize);
  const combined = [...intentTokens, ...tagTokens];
  const overlap = combined.filter((token) => queryTokens.has(token)).length;
  return overlap;
}

function penalty(value) {
  if (value === 'low') return 0;
  if (value === 'medium') return 1;
  return 2;
}

export function rankCandidates(query, candidates) {
  return [...candidates]
    .map((candidate) => ({
      candidate,
      score: scoreIntent(query, candidate) * 10 - penalty(candidate.risk) * 3 - penalty(candidate.cost)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const riskDiff = penalty(a.candidate.risk) - penalty(b.candidate.risk);
      if (riskDiff !== 0) return riskDiff;
      const costDiff = penalty(a.candidate.cost) - penalty(b.candidate.cost);
      if (costDiff !== 0) return costDiff;
      return String(a.candidate.path).localeCompare(String(b.candidate.path));
    })
    .map(({ candidate, score }) => ({ ...candidate, score }));
}

function loadIndex(pluginRoot, type) {
  const indexPath = path.join(pluginRoot, type, 'index.json');
  if (!fs.existsSync(indexPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  return parsed.entries || [];
}

function readMarkdownWithFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.startsWith('---\n')) return { frontmatter: {}, content: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { frontmatter: {}, content: raw };
  const frontmatter = yaml.load(raw.slice(4, end)) || {};
  const content = raw.slice(end + 4).replace(/^\n/, '');
  return { frontmatter, content };
}

export function routePluginMarkdown({ pluginName, query, type = 'commands' }) {
  const pluginRoot = path.join(ROOT, 'plugins', pluginName);
  const indexEntries = loadIndex(pluginRoot, type);
  if (indexEntries.length === 0) {
    throw new Error(`No ${type} index found for ${pluginName}. Run scripts/generate-plugin-indexes.mjs first.`);
  }

  const ranked = rankCandidates(query, indexEntries);
  const selected = ranked[0];
  if (!selected) return null;

  const selectedPath = path.join(pluginRoot, selected.path);
  const loaded = readMarkdownWithFrontmatter(selectedPath);

  return {
    selected: { ...selected, absolutePath: selectedPath },
    topCandidates: ranked.slice(0, 5),
    markdown: loaded.content,
    frontmatter: loaded.frontmatter
  };
}
