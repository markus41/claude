// Guardrail state for keeping Claude Code on task.
//
// Introduces a small set of task-scoped artifacts that live next to (or
// independently of) the existing project state:
//
//   anchor.json        — focus receipt ("do X, don't do Y")
//   scope.json         — file/command allowlist + override ledger
//   done-when.json     — explicit completion criteria + evidence
//   breadcrumbs.jsonl  — append-only log of tool calls for drift auditing
//
// Active context resolution:
//   1. The first project with status IN_PROGRESS, if any.
//   2. Otherwise an ephemeral `.claude/pm-session/` directory so users can
//      use these guardrails without running /pm:init first.
//
// All writes go through the shared withLock() primitive from pm-state.mjs.

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { projectsRoot, listProjects, withLock } from './pm-state.mjs';
import { matchOverengineering } from './overengineering-rules.mjs';

// ---------------------------------------------------------------------------
// Active-context resolution
// ---------------------------------------------------------------------------

export function sessionDir() {
  const base = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return join(base, '.claude', 'pm-session');
}

export function activeContextDir() {
  const active = listProjects().find((p) => p.project.status === 'IN_PROGRESS');
  if (active) return active.dir;
  const fallback = sessionDir();
  mkdirSync(fallback, { recursive: true });
  return fallback;
}

export function activeContextSummary() {
  const active = listProjects().find((p) => p.project.status === 'IN_PROGRESS');
  if (active) return { kind: 'project', id: active.id, dir: active.dir };
  return { kind: 'session', id: null, dir: sessionDir() };
}

// ---------------------------------------------------------------------------
// Focus anchor (upgrade A)
// ---------------------------------------------------------------------------

const ANCHOR_FILE = 'anchor.json';
const ANCHOR_MD = 'focus.md';

export function readAnchor(dir = activeContextDir()) {
  const file = join(dir, ANCHOR_FILE);
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

export async function setAnchor({ doItem, dontItem, task_id = null }) {
  if (!doItem || typeof doItem !== 'string') throw new Error('doItem is required');
  const dir = activeContextDir();
  mkdirSync(dir, { recursive: true });
  const record = {
    version: 1,
    active: true,
    do: doItem.trim(),
    dont: (dontItem || '').trim() || null,
    task_id,
    set_at: new Date().toISOString(),
    cleared_at: null,
  };
  await withLock(join(dir, '.locks', 'anchor.lock'), async () => {
    writeFileSync(join(dir, ANCHOR_FILE), JSON.stringify(record, null, 2) + '\n');
    const md = [
      '---',
      `set_at: ${record.set_at}`,
      record.task_id ? `task_id: ${record.task_id}` : null,
      '---',
      '',
      `DO: ${record.do}`,
      record.dont ? `DON'T: ${record.dont}` : "DON'T: (no explicit guardrails)",
      '',
    ].filter((l) => l !== null).join('\n');
    writeFileSync(join(dir, ANCHOR_MD), md);
  });
  return record;
}

export async function clearAnchor() {
  const dir = activeContextDir();
  const current = readAnchor(dir);
  if (!current) return null;
  const next = { ...current, active: false, cleared_at: new Date().toISOString() };
  await withLock(join(dir, '.locks', 'anchor.lock'), async () => {
    writeFileSync(join(dir, ANCHOR_FILE), JSON.stringify(next, null, 2) + '\n');
  });
  return next;
}

export function formatAnchorReminder(anchor) {
  if (!anchor || !anchor.active) return null;
  const lines = [`DO: ${anchor.do}`];
  if (anchor.dont) lines.push(`DON'T: ${anchor.dont}`);
  if (anchor.task_id) lines.push(`TASK: ${anchor.task_id}`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Scope lock (upgrade B)
// ---------------------------------------------------------------------------

const SCOPE_FILE = 'scope.json';

export function readScope(dir = activeContextDir()) {
  const file = join(dir, SCOPE_FILE);
  if (!existsSync(file)) return { version: 1, active: false, allowlist: [], overrides: [] };
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return { version: 1, active: false, allowlist: [], overrides: [] }; }
}

export async function setScope(patterns) {
  if (!Array.isArray(patterns)) throw new Error('patterns must be an array');
  const dir = activeContextDir();
  mkdirSync(dir, { recursive: true });
  const record = {
    version: 1,
    active: patterns.length > 0,
    allowlist: dedupe(patterns.map(String)),
    overrides: [],
    set_at: new Date().toISOString(),
  };
  await withLock(join(dir, '.locks', 'scope.lock'), async () => {
    writeFileSync(join(dir, SCOPE_FILE), JSON.stringify(record, null, 2) + '\n');
  });
  return record;
}

export async function addScopePatterns(patterns) {
  const current = readScope();
  return setScope(dedupe([...(current.allowlist || []), ...patterns]));
}

export async function removeScopePatterns(patterns) {
  const current = readScope();
  return setScope((current.allowlist || []).filter((p) => !patterns.includes(p)));
}

export async function recordOverride({ path, reason }) {
  const dir = activeContextDir();
  mkdirSync(dir, { recursive: true });
  await withLock(join(dir, '.locks', 'scope.lock'), async () => {
    const current = readScope(dir);
    current.overrides = current.overrides || [];
    current.overrides.push({ ts: new Date().toISOString(), path, reason });
    writeFileSync(join(dir, SCOPE_FILE), JSON.stringify(current, null, 2) + '\n');
  });
}

export function isInScope(absPath, { allowlist, baseDir } = {}) {
  if (!allowlist || allowlist.length === 0) return true;
  const base = baseDir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const rel = relative(base, absPath).split(sep).join('/');
  // Never treat paths that escape the base as in-scope — those bypass
  // any containment the user configured.
  if (rel.startsWith('..')) return false;
  for (const pattern of allowlist) {
    if (globMatch(pattern, rel)) return true;
  }
  return false;
}

// Minimal glob: supports * and ** only (no brace expansion, no negation).
// Sufficient for scope patterns like "src/auth/**" or "tests/*.test.mjs".
export function globMatch(pattern, subject) {
  const re = new RegExp(
    '^' +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '§§DOUBLE§§')
        .replace(/\*/g, '[^/]*')
        .replace(/§§DOUBLE§§/g, '.*') +
      '$',
  );
  return re.test(subject);
}

function dedupe(arr) { return Array.from(new Set(arr)); }

// ---------------------------------------------------------------------------
// Done-when contract (upgrade C)
// ---------------------------------------------------------------------------

const DONE_FILE = 'done-when.json';

export function readDoneWhen(dir = activeContextDir()) {
  const file = join(dir, DONE_FILE);
  if (!existsSync(file)) return null;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
}

export async function setDoneWhen({ criteria, task_id = null }) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error('criteria must be a non-empty array of strings');
  }
  const dir = activeContextDir();
  mkdirSync(dir, { recursive: true });
  const record = {
    version: 1,
    active: true,
    task_id,
    set_at: new Date().toISOString(),
    criteria: criteria.map((c, i) => ({
      id: `c${i + 1}`,
      text: String(c).trim(),
      evidence: null,
      met_at: null,
    })),
  };
  await withLock(join(dir, '.locks', 'done.lock'), async () => {
    writeFileSync(join(dir, DONE_FILE), JSON.stringify(record, null, 2) + '\n');
  });
  return record;
}

export async function markCriterionMet({ id, evidence }) {
  if (!id) throw new Error('id is required');
  if (!evidence || !String(evidence).trim()) throw new Error('evidence is required');
  const dir = activeContextDir();
  return withLock(join(dir, '.locks', 'done.lock'), async () => {
    const current = readDoneWhen(dir);
    if (!current) throw new Error('no done-when contract active; run /pm:done-when first');
    const hit = (current.criteria || []).find((c) => c.id === id || c.text === id);
    if (!hit) throw new Error(`criterion not found: ${id}`);
    hit.evidence = String(evidence).trim();
    hit.met_at = new Date().toISOString();
    writeFileSync(join(dir, DONE_FILE), JSON.stringify(current, null, 2) + '\n');
    return hit;
  });
}

export function unmetCriteria(record) {
  if (!record) return [];
  return (record.criteria || []).filter((c) => !c.met_at);
}

// ---------------------------------------------------------------------------
// Breadcrumbs + drift auditor (upgrade E)
// ---------------------------------------------------------------------------

const BREADCRUMB_FILE = 'breadcrumbs.jsonl';

export function recordBreadcrumb(entry) {
  // Single-line append; jsonl format. No lock needed because append(2) is
  // atomic under POSIX line buffering for small writes, and Windows
  // tolerates it for our sub-4k line sizes.
  const dir = activeContextDir();
  mkdirSync(dir, { recursive: true });
  const ts = entry.ts || new Date().toISOString();
  const line = JSON.stringify({ ...entry, ts }) + '\n';
  appendFileSync(join(dir, BREADCRUMB_FILE), line);
}

export function readBreadcrumbs(dir = activeContextDir()) {
  const file = join(dir, BREADCRUMB_FILE);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

export function analyzeDrift({ since = null } = {}) {
  const crumbs = readBreadcrumbs();
  const anchor = readAnchor();
  const scope = readScope();
  const done = readDoneWhen();

  const filtered = since ? crumbs.filter((c) => c.ts >= since) : crumbs;
  const classified = filtered.map((c) => {
    const reasons = [];
    if (scope.active && c.target && c.scope_ok === false) reasons.push('out-of-scope');
    if (c.tool === 'Edit' || c.tool === 'Write') {
      if (c.overengineering_hits && c.overengineering_hits.length) {
        reasons.push(`overengineering: ${c.overengineering_hits.join(', ')}`);
      }
    }
    const advances = (c.criterion_hint && done)
      || (c.tool === 'Bash' && c.target && /(test|pnpm|npm|vitest|jest|pytest|cargo)/.test(c.target));
    return { ...c, drift: reasons, advances: !!advances };
  });

  const totals = {
    turns: classified.length,
    drift_turns: classified.filter((c) => c.drift.length).length,
    advancing_turns: classified.filter((c) => c.advances).length,
  };
  totals.drift_ratio = totals.turns ? +(totals.drift_turns / totals.turns).toFixed(3) : 0;
  return {
    context: activeContextSummary(),
    anchor,
    scope_active: !!scope.active,
    done_criteria_total: (done?.criteria || []).length,
    done_criteria_met: (done?.criteria || []).filter((c) => c.met_at).length,
    totals,
    entries: classified,
  };
}

// ---------------------------------------------------------------------------
// Overengineering detector (upgrade D)
// ---------------------------------------------------------------------------

export function detectOverengineering({ diff, path }) {
  return matchOverengineering({ diff, path });
}
