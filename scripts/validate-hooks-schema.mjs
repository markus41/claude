import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(repoRoot, 'schemas', 'hooks.schema.json');
const pluginsDir = path.join(repoRoot, 'plugins');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const allowedEvents = new Set(schema.$defs.hook.properties.event.enum);
const allowedTypes = new Set(schema.$defs.hook.properties.type.enum);
const allowedTopKeys = new Set(Object.keys(schema.properties));
const allowedHookKeys = new Set(Object.keys(schema.$defs.hook.properties));

function assert(condition, errors, message) {
  if (!condition) errors.push(message);
}

function validateHookFile(payload) {
  const errors = [];
  assert(payload && typeof payload === 'object' && !Array.isArray(payload), errors, 'root must be an object');
  if (errors.length) return errors;

  for (const key of Object.keys(payload)) {
    assert(allowedTopKeys.has(key), errors, `unknown root field "${key}"`);
  }

  assert(Array.isArray(payload.hooks), errors, 'hooks must be an array');

  if (!Array.isArray(payload.hooks)) return errors;

  payload.hooks.forEach((hook, index) => {
    const prefix = `hooks[${index}]`;
    assert(hook && typeof hook === 'object' && !Array.isArray(hook), errors, `${prefix} must be an object`);
    if (!hook || typeof hook !== 'object' || Array.isArray(hook)) return;

    for (const key of Object.keys(hook)) {
      assert(allowedHookKeys.has(key), errors, `${prefix} has unknown field "${key}"`);
    }

    assert(typeof hook.event === 'string', errors, `${prefix}.event is required and must be a string`);
    if (typeof hook.event === 'string') {
      assert(allowedEvents.has(hook.event), errors, `${prefix}.event "${hook.event}" is not allowed`);
    }

    assert(typeof hook.type === 'string', errors, `${prefix}.type is required and must be a string`);
    if (typeof hook.type === 'string') {
      assert(allowedTypes.has(hook.type), errors, `${prefix}.type "${hook.type}" is not allowed`);
    }

    if ('matcher' in hook) {
      assert(typeof hook.matcher === 'string' && hook.matcher.length > 0, errors, `${prefix}.matcher must be a non-empty string`);
    }

    if ('name' in hook) {
      assert(typeof hook.name === 'string' && hook.name.length > 0, errors, `${prefix}.name must be a non-empty string`);
    }

    if (hook.type === 'command') {
      assert(typeof hook.script === 'string' && hook.script.length > 0, errors, `${prefix}.script is required for command hooks`);
      assert(!('prompt' in hook), errors, `${prefix}.prompt is not allowed for command hooks`);
    }

    if (hook.type === 'prompt') {
      assert(typeof hook.prompt === 'string' && hook.prompt.length > 0, errors, `${prefix}.prompt is required for prompt hooks`);
      assert(!('script' in hook), errors, `${prefix}.script is not allowed for prompt hooks`);
    }
  });

  return errors;
}

const hookFiles = fs.readdirSync(pluginsDir)
  .map((pluginName) => path.join(pluginsDir, pluginName, 'hooks', 'hooks.json'))
  .filter((hookPath) => fs.existsSync(hookPath));

let hasErrors = false;
for (const hookPath of hookFiles) {
  const relativePath = path.relative(repoRoot, hookPath);
  const payload = JSON.parse(fs.readFileSync(hookPath, 'utf-8'));
  const errors = validateHookFile(payload);

  if (errors.length > 0) {
    hasErrors = true;
    console.error(`❌ ${relativePath}`);
    errors.forEach((error) => console.error(`   - ${error}`));
  } else {
    console.log(`✅ ${relativePath}`);
  }
}

if (hasErrors) process.exit(1);
console.log(`Validated ${hookFiles.length} hook configuration files against schemas/hooks.schema.json.`);
