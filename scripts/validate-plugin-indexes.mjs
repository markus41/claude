#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const pluginsRoot = path.join(root, 'plugins');

function walk(dir, pred) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, pred));
    else if (e.isFile() && pred(p)) out.push(p);
  }
  return out;
}

function rel(base, p) {
  return path.relative(base, p).replace(/\\/g, '/');
}

let errors = 0;
for (const entry of fs.readdirSync(pluginsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const pluginRoot = path.join(pluginsRoot, entry.name);
  const indexPath = path.join(pluginRoot, 'index.json');

  if (!fs.existsSync(indexPath)) {
    console.error(`ERROR [${entry.name}] Missing index.json`);
    errors++;
    continue;
  }

  let idx;
  try {
    idx = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch (e) {
    console.error(`ERROR [${entry.name}] Invalid index.json: ${e.message}`);
    errors++;
    continue;
  }

  const checks = [
    ['commands', walk(path.join(pluginRoot, 'commands'), (p) => p.endsWith('.md'))],
    ['agents', walk(path.join(pluginRoot, 'agents'), (p) => p.endsWith('.md'))],
    ['skills', fs.existsSync(path.join(pluginRoot, 'skills'))
      ? fs.readdirSync(path.join(pluginRoot, 'skills'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(pluginRoot, 'skills', d.name, 'SKILL.md'))
        .filter((p) => fs.existsSync(p))
      : []],
  ];

  for (const [kind, files] of checks) {
    const expected = new Set(files.map((p) => rel(pluginRoot, p)));
    const listed = new Set(((idx.capabilities?.[kind]) || []).map((x) => x.path));

    for (const p of expected) {
      if (!listed.has(p)) {
        console.error(`ERROR [${entry.name}] Missing ${kind} entry for ${p}`);
        errors++;
      }
    }
    for (const p of listed) {
      if (!expected.has(p)) {
        console.error(`ERROR [${entry.name}] Stale ${kind} entry for ${p}`);
        errors++;
      }
      if (!fs.existsSync(path.join(pluginRoot, p))) {
        console.error(`ERROR [${entry.name}] Path does not exist: ${p}`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s).`);
  process.exit(1);
}

console.log('All plugin indexes are complete and valid.');
