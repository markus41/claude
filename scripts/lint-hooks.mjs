import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MAX_PROMPT_LENGTH = 280;
const EVENTS = new Set(['SessionStart','UserPromptSubmit','PreToolUse','PostToolUse','Stop','SessionEnd','PreCompact','TaskCompleted']);
const SEVERITIES = new Set(['advisory','warn','block']);
const SCOPES = new Set(['session','prompt','tool','task']);

function listHookFiles() {
  return fs.readdirSync(path.join(ROOT, 'plugins'))
    .map((plugin) => path.join(ROOT, 'plugins', plugin, 'hooks', 'hooks.json'))
    .filter((file) => fs.existsSync(file));
}

function rel(file) { return path.relative(ROOT, file); }
function fail(errors) {
  for (const e of errors) console.error(`❌ ${e}`);
  process.exit(1);
}

const errors = [];
for (const file of listHookFiles()) {
  const raw = fs.readFileSync(file, 'utf8');
  let data;
  try { data = JSON.parse(raw); } catch (err) { errors.push(`${rel(file)} invalid JSON: ${err.message}`); continue; }

  for (const field of ['$schema','version','plugin','hooks']) {
    if (!(field in data)) errors.push(`${rel(file)} missing root field '${field}'`);
  }
  if (data.version !== '2.0.0') errors.push(`${rel(file)} must use version 2.0.0`);
  if (!Array.isArray(data.hooks) || data.hooks.length === 0) errors.push(`${rel(file)} must define non-empty hooks array`);

  const ids = new Set();
  const triggerPatterns = new Set();
  (data.hooks || []).forEach((hook, idx) => {
    const prefix = `${rel(file)} hooks[${idx}]`;
    for (const field of ['id','event','severity','description','trigger','handlers']) {
      if (!(field in hook)) errors.push(`${prefix} missing '${field}'`);
    }
    if (hook.id) {
      if (ids.has(hook.id)) errors.push(`${prefix} duplicate id '${hook.id}'`);
      ids.add(hook.id);
    }
    if (!EVENTS.has(hook.event)) errors.push(`${prefix} has invalid event '${hook.event}'`);
    if (!SEVERITIES.has(hook.severity)) errors.push(`${prefix} has invalid severity '${hook.severity}'`);

    const trigger = hook.trigger || {};
    if (!SCOPES.has(trigger.scope)) errors.push(`${prefix} trigger.scope must be one of ${[...SCOPES].join(', ')}`);
    const patternKey = JSON.stringify({
      event: hook.event,
      scope: trigger.scope,
      tools: trigger.tools || [],
      files: trigger.file_patterns || [],
      commands: trigger.command_patterns || [],
      prompts: trigger.prompt_patterns || [],
      tasks: trigger.task_types || []
    });
    if (triggerPatterns.has(patternKey)) errors.push(`${prefix} duplicates an existing trigger pattern`);
    triggerPatterns.add(patternKey);

    if (!Array.isArray(hook.handlers) || hook.handlers.length === 0) {
      errors.push(`${prefix} must include at least one handler`);
      return;
    }
    hook.handlers.forEach((handler, hidx) => {
      const hPrefix = `${prefix} handlers[${hidx}]`;
      if (!handler.type) errors.push(`${hPrefix} missing 'type'`);
      if (handler.prompt && handler.prompt.length > MAX_PROMPT_LENGTH) {
        errors.push(`${hPrefix} prompt exceeds ${MAX_PROMPT_LENGTH} chars (${handler.prompt.length})`);
      }
      if (handler.prompt && handler.prompt.length > 180 && !handler.doc_ref) {
        errors.push(`${hPrefix} long prompt should provide doc_ref guidance`);
      }
    });
  });
}

if (errors.length) fail(errors);
console.log('✅ Hook lint passed');
