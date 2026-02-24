#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const pluginsRoot = path.join(repoRoot, 'plugins');
const checkMode = process.argv.includes('--check');

function walk(dir, predicate = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
}

function readSummary(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/);
  let i = 0;
  if (lines[0]?.trim() === '---') {
    i = 1;
    while (i < lines.length && lines[i].trim() !== '---') i++;
    i++;
  }
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('#')) return line.replace(/^#+\s*/, '').slice(0, 120);
    return line.replace(/^[-*]\s*/, '').slice(0, 120);
  }
  return 'No summary available';
}

function inferDomain(name, relPath) {
  const s = `${name} ${relPath}`.toLowerCase();
  if (/(security|trust|policy|verify|compliance|audit)/.test(s)) return 'security';
  if (/(deploy|release|pipeline|helm|eks|iac|infra)/.test(s)) return 'deployment';
  if (/(test|harness|qa|quality)/.test(s)) return 'testing';
  if (/(data|database|sql|db)/.test(s)) return 'data';
  if (/(ui|frontend|design|react|animation)/.test(s)) return 'frontend';
  if (/(automation|workflow|orchestrator|command)/.test(s)) return 'automation';
  return 'general';
}

function inferRisk(name, summary) {
  const s = `${name} ${summary}`.toLowerCase();
  if (/(delete|destroy|production|security|credential|secret|rollback)/.test(s)) return 'high';
  if (/(deploy|migrate|configure|policy|registry)/.test(s)) return 'medium';
  return 'low';
}

function inferTools(text) {
  const s = text.toLowerCase();
  const tools = [];
  const patterns = [
    ['bash', /(bash|shell|sh\b|terminal)/],
    ['git', /\bgit\b/],
    ['node', /(node|npm|pnpm|yarn)/],
    ['docker', /docker/],
    ['kubernetes', /(kubernetes|kubectl|helm|eks)/],
    ['terraform', /terraform/],
    ['python', /python/],
    ['database', /(sql|postgres|database|redis)/],
  ];
  for (const [name, re] of patterns) if (re.test(s)) tools.push(name);
  return tools.length ? tools : ['markdown'];
}

function mkId(plugin, type, relPath) {
  const stem = relPath.replace(/\\/g, '/').replace(/\.[^.]+$/, '').replace(/\//g, '.').toLowerCase();
  return `${plugin}:${type}:${stem}`;
}

function buildEntries(pluginName, pluginRoot, type) {
  const rel = (p) => path.relative(pluginRoot, p).replace(/\\/g, '/');
  if (type === 'commands') {
    return walk(path.join(pluginRoot, 'commands'), (p) => p.endsWith('.md')).map((p) => {
      const rp = rel(p);
      const name = `/mp:${path.basename(p, '.md')}`;
      const summary = readSummary(p);
      return {
        id: mkId(pluginName, 'command', rp),
        name,
        path: rp,
        summary,
        tags: {
          domain: inferDomain(name, rp),
          triggerTerms: [path.basename(p, '.md').toLowerCase(), path.basename(path.dirname(p)).toLowerCase()].filter(Boolean),
          riskLevel: inferRisk(name, summary),
          expectedTools: inferTools(`${name} ${summary} ${rp}`),
        },
      };
    });
  }
  if (type === 'agents') {
    return walk(path.join(pluginRoot, 'agents'), (p) => p.endsWith('.md')).map((p) => {
      const rp = rel(p);
      const name = path.basename(p, '.md');
      const summary = readSummary(p);
      return {
        id: mkId(pluginName, 'agent', rp), name, path: rp, summary,
        tags: {
          domain: inferDomain(name, rp),
          triggerTerms: [name.toLowerCase()],
          riskLevel: inferRisk(name, summary),
          expectedTools: inferTools(`${summary} ${rp}`),
        },
      };
    });
  }
  if (type === 'skills') {
    const skillsRoot = path.join(pluginRoot, 'skills');
    if (!fs.existsSync(skillsRoot)) return [];
    return fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(skillsRoot, d.name, 'SKILL.md'))
      .filter((p) => fs.existsSync(p))
      .map((p) => {
        const rp = rel(p);
        const name = path.basename(path.dirname(p));
        const summary = readSummary(p);
        return {
          id: mkId(pluginName, 'skill', rp), name, path: rp, summary,
          tags: {
            domain: inferDomain(name, rp),
            triggerTerms: [name.toLowerCase().replace(/-/g, ' ')],
            riskLevel: inferRisk(name, summary),
            expectedTools: inferTools(`${summary} ${rp}`),
          },
        };
      });
  }
  if (type === 'hooks') {
    return walk(path.join(pluginRoot, 'hooks'), (p) => /\.(sh|bash|ps1|js|ts)$/.test(p)).map((p) => {
      const rp = rel(p);
      const name = path.basename(p);
      return {
        id: mkId(pluginName, 'hook', rp),
        name,
        path: rp,
        summary: `Hook script ${name}`,
        tags: {
          domain: inferDomain(name, rp),
          triggerTerms: [name.replace(/\.[^.]+$/, '').toLowerCase()],
          riskLevel: inferRisk(name, rp),
          expectedTools: inferTools(rp),
        },
      };
    });
  }
  return [];
}

function buildKeyDocs(pluginName, pluginRoot) {
  const rel = (p) => path.relative(pluginRoot, p).replace(/\\/g, '/');
  const docs = [];
  for (const name of ['README.md', 'CLAUDE.md']) {
    const p = path.join(pluginRoot, name);
    if (fs.existsSync(p)) {
      docs.push({ id: mkId(pluginName, 'doc', rel(p)), path: rel(p), summary: readSummary(p) });
    }
  }
  for (const p of walk(path.join(pluginRoot, 'docs'), (f) => f.endsWith('.md')).slice(0, 10)) {
    docs.push({ id: mkId(pluginName, 'doc', rel(p)), path: rel(p), summary: readSummary(p) });
  }
  return docs;
}

function buildIndex(pluginDirName) {
  const pluginRoot = path.join(pluginsRoot, pluginDirName);
  const index = {
    schemaVersion: 1,
    plugin: {
      id: pluginDirName,
      root: `plugins/${pluginDirName}`,
    },
    capabilities: {
      commands: buildEntries(pluginDirName, pluginRoot, 'commands'),
      agents: buildEntries(pluginDirName, pluginRoot, 'agents'),
      skills: buildEntries(pluginDirName, pluginRoot, 'skills'),
      hooks: buildEntries(pluginDirName, pluginRoot, 'hooks'),
    },
    keyDocs: buildKeyDocs(pluginDirName, pluginRoot),
  };
  return index;
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

let changed = 0;
for (const entry of fs.readdirSync(pluginsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const pluginName = entry.name;
  const pluginRoot = path.join(pluginsRoot, pluginName);
  const outPath = path.join(pluginRoot, 'index.json');
  const generated = stableJson(buildIndex(pluginName));
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : null;

  if (existing !== generated) {
    changed++;
    if (!checkMode) fs.writeFileSync(outPath, generated, 'utf-8');
    console.log(`${checkMode ? 'OUTDATED' : 'UPDATED'} ${path.relative(repoRoot, outPath)}`);
  }
}

if (checkMode && changed > 0) {
  console.error(`\n${changed} plugin index file(s) are out of date. Run: node scripts/generate-plugin-indexes.mjs`);
  process.exit(1);
}

console.log(`Done. ${changed === 0 ? 'All plugin index files are current.' : `Changed: ${changed}`}`);
