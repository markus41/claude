import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const marketplace = JSON.parse(fs.readFileSync('.claude-plugin/marketplace.json', 'utf8'));

test('marketplace exposes project-planner-plugin alias for project-management-plugin', () => {
  const plugin = marketplace.plugins.find((p) => p.name === 'project-planner-plugin');
  assert.ok(plugin, 'Expected project-planner-plugin entry in marketplace');
  assert.equal(plugin.source, './plugins/project-management-plugin');
});
