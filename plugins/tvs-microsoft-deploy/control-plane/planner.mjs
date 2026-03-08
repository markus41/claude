#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const PHASE_ORDER = [
  'identity',
  'data-platform',
  'app-platform',
  'collaboration-services'
];

const TYPE_TO_PHASE = {
  'entra.app': 'identity',
  'entra.group': 'identity',
  'azure.subscription': 'data-platform',
  'dataverse.environment': 'data-platform',
  'fabric.workspace': 'data-platform',
  'fabric.lakehouse': 'data-platform',
  'fabric.notebook': 'data-platform',
  'powerplatform.solution': 'app-platform',
  'automation.asset': 'app-platform',
  'teams.channel': 'collaboration-services',
  'sharepoint.site': 'collaboration-services'
};

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseSimpleYaml(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => ({ trimmed: line.trim(), indent: line.match(/^\s*/)[0].length }))
    .filter((line) => line.trimmed && !line.trimmed.startsWith('#'));

  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (let i = 0; i < lines.length; i += 1) {
    const { trimmed: line, indent } = lines[i];

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].value;

    if (line.startsWith('- ')) {
      if (!Array.isArray(parent)) throw new Error(`Invalid YAML list item near: ${line}`);
      const content = line.slice(2);
      if (content.includes(':')) {
        const [key, ...rest] = content.split(':');
        const valRaw = rest.join(':').trim();
        const item = {};
        if (valRaw) {
          item[key.trim()] = parseScalar(valRaw);
          parent.push(item);
          stack.push({ indent, value: item });
        } else {
          item[key.trim()] = {};
          parent.push(item);
          stack.push({ indent, value: item[key.trim()] });
        }
      } else {
        parent.push(parseScalar(content));
      }
      continue;
    }

    const [key, ...rest] = line.split(':');
    const valRaw = rest.join(':').trim();
    if (valRaw) {
      parent[key.trim()] = parseScalar(valRaw);
      continue;
    }

    let container = {};
    for (let j = i + 1; j < lines.length; j += 1) {
      if (lines[j].indent <= indent) break;
      if (lines[j].trimmed.startsWith('- ')) {
        container = [];
        break;
      }
      if (lines[j].indent > indent) {
        container = {};
        break;
      }
    }
    parent[key.trim()] = container;
    stack.push({ indent, value: container });
  }
  return root;
}

function readManifest(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  return filePath.endsWith('.json') ? JSON.parse(text) : parseSimpleYaml(text);
}

function mergeManifest(base, overlay) {
  const merged = { ...base, settings: { ...(base.settings || {}), ...(overlay.settings || {}) } };
  const byId = new Map((base.resources || []).map((r) => [r.id, { ...r }]));
  for (const delta of overlay.resources || []) {
    const existing = byId.get(delta.id) || {};
    byId.set(delta.id, { ...existing, ...delta });
  }
  merged.resources = [...byId.values()];
  return merged;
}

function topoSort(resources) {
  const byId = new Map(resources.map((r) => [r.id, r]));
  const pending = new Set(byId.keys());
  const sorted = [];

  while (pending.size) {
    let progressed = false;
    for (const id of [...pending]) {
      const r = byId.get(id);
      const deps = r.dependsOn || [];
      if (deps.every((dep) => !pending.has(dep))) {
        sorted.push(r);
        pending.delete(id);
        progressed = true;
      }
    }
    if (!progressed) {
      throw new Error('Cycle detected in manifest dependencies');
    }
  }

  return sorted.sort((a, b) => PHASE_ORDER.indexOf(TYPE_TO_PHASE[a.type]) - PHASE_ORDER.indexOf(TYPE_TO_PHASE[b.type]));
}

function buildPlan(manifest, mode = 'dry-run') {
  const ordered = topoSort(manifest.resources || []);
  const phases = PHASE_ORDER.map((phase) => ({
    name: phase,
    resources: ordered.filter((r) => TYPE_TO_PHASE[r.type] === phase)
  })).filter((p) => p.resources.length);

  return {
    mode,
    tenant: manifest.tenant,
    taiaWindDown: Boolean(manifest.settings?.taiaWindDown),
    phases: phases.map((p, phaseIndex) => ({
      phase: p.name,
      sequence: phaseIndex + 1,
      steps: p.resources.map((resource, stepIndex) => ({
        order: stepIndex + 1,
        id: resource.id,
        type: resource.type,
        action: resource.operation || (mode === 'execute' ? 'apply' : 'preview'),
        dependsOn: resource.dependsOn || []
      }))
    }))
  };
}

function main() {
  const args = process.argv.slice(2);
  const getArg = (name, fallback) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : fallback;
  };

  const basePath = getArg('--manifest');
  if (!basePath) {
    console.error('Usage: node planner.mjs --manifest <base.(yaml|json)> [--overlay <overlay.(yaml|json)> ...] [--mode dry-run|execute] [--out file]');
    process.exit(1);
  }

  const overlayPaths = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--overlay' && args[i + 1]) overlayPaths.push(args[i + 1]);
  }
  const mode = getArg('--mode', 'dry-run');
  const outPath = getArg('--out', null);

  const base = readManifest(basePath);
  const combined = overlayPaths.reduce((acc, overlayPath) => mergeManifest(acc, readManifest(overlayPath)), base);
  const plan = buildPlan(combined, mode);
  const serialized = JSON.stringify(plan, null, 2);

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, serialized + '\n');
  }

  console.log(serialized);
}

main();
