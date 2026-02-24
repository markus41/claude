import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();

function collectManifestFiles(rootDir) {
  const manifests = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && fullPath.endsWith(path.join('.claude-plugin', 'plugin.json'))) {
        manifests.push(fullPath);
      }
    }
  }

  return manifests.sort();
}

function validateStartupContextFields(manifest, relativePath) {
  const errors = [];

  if (manifest.contextBudget !== undefined) {
    if (!Number.isInteger(manifest.contextBudget) || manifest.contextBudget <= 0) {
      errors.push('contextBudget must be a positive integer');
    }
  }

  if (manifest.loadPriority !== undefined) {
    if (!['high', 'medium', 'low'].includes(manifest.loadPriority)) {
      errors.push('loadPriority must be one of: high, medium, low');
    }
  }

  if (manifest.lazyPaths !== undefined) {
    if (!Array.isArray(manifest.lazyPaths) || manifest.lazyPaths.some((value) => typeof value !== 'string')) {
      errors.push('lazyPaths must be an array of strings');
    }
  }

  if (manifest.excludeFromInitialContext !== undefined) {
    if (typeof manifest.excludeFromInitialContext !== 'boolean') {
      errors.push('excludeFromInitialContext must be a boolean');
    }
  }

  return errors.map((message) => `${relativePath}: ${message}`);
}

const manifests = collectManifestFiles(repoRoot);
const allErrors = [];

for (const manifestPath of manifests) {
  const relativePath = path.relative(repoRoot, manifestPath);
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    allErrors.push(...validateStartupContextFields(manifest, relativePath));
  } catch (error) {
    allErrors.push(`${relativePath}: invalid JSON (${error.message})`);
  }
}

if (allErrors.length > 0) {
  for (const error of allErrors) {
    console.error(`❌ ${error}`);
  }
  process.exit(1);
}

console.log(`✅ Validated startup context manifest fields for ${manifests.length} plugin manifests.`);
