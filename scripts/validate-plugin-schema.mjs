#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PLUGINS_DIR = path.join(ROOT, 'plugins');
const pluginSchemaPath = path.join(ROOT, 'schemas', 'plugin.schema.json');
const hooksSchemaPath = path.join(ROOT, 'schemas', 'hooks.schema.json');

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
const pluginSchema = JSON.parse(fs.readFileSync(pluginSchemaPath, 'utf8'));
const hooksSchema = JSON.parse(fs.readFileSync(hooksSchemaPath, 'utf8'));
const validatePlugin = ajv.compile(pluginSchema);
const validateHooks = ajv.compile(hooksSchema);

const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

const issues = [];

function formatErrors(errors = []) {
  return errors.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
}

for (const pluginName of pluginDirs) {
  const pluginRoot = path.join(PLUGINS_DIR, pluginName);
  const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  const hooksPath = path.join(pluginRoot, 'hooks', 'hooks.json');

  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!validatePlugin(manifest)) {
      issues.push(`${pluginName}: invalid .claude-plugin/plugin.json -> ${formatErrors(validatePlugin.errors)}`);
    }
    if (manifest?.context?.entry !== manifest?.contextEntry) {
      issues.push(`${pluginName}: context.entry must match contextEntry for compatibility`);
    }
  } else {
    issues.push(`${pluginName}: missing .claude-plugin/plugin.json`);
  }

  if (fs.existsSync(hooksPath)) {
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
    if (!validateHooks(hooks)) {
      issues.push(`${pluginName}: invalid hooks/hooks.json -> ${formatErrors(validateHooks.errors)}`);
    }
    if (hooks.plugin !== pluginName) {
      issues.push(`${pluginName}: hooks.plugin must be "${pluginName}"`);
    }
  }
}

if (issues.length) {
  console.error('Plugin schema validation failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(`Validated ${pluginDirs.length} plugins against canonical plugin and hooks schemas.`);
