import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const pluginRoot = path.join(repoRoot, 'plugins', 'home-assistant-architect');
const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
const registryDir = path.join(pluginRoot, '.claude-plugin', 'registry');
const readmePath = path.join(pluginRoot, 'README.md');
const hooksPath = path.join(pluginRoot, 'hooks', 'hooks.json');
const mcpPackagePath = path.join(pluginRoot, 'mcp-server', 'package.json');

const checkMode = process.argv.includes('--check');

type RegistryEntry = {
  id: string;
  path: string;
};

type RegistryFile = {
  kind: string;
  count: number;
  entries: RegistryEntry[];
};

const rel = (...parts: string[]) => path.join(...parts).replaceAll(path.sep, '/');

const listFiles = (dir: string, filter: (fileName: string, fullPath: string) => boolean): string[] => {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => filter(fileName, path.join(dir, fileName)))
    .sort((a, b) => a.localeCompare(b));
};

const listSkillEntries = (): RegistryEntry[] => {
  const skillsRoot = path.join(pluginRoot, 'skills');

  if (!existsSync(skillsRoot)) {
    return [];
  }

  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dirName) => existsSync(path.join(skillsRoot, dirName, 'SKILL.md')))
    .sort((a, b) => a.localeCompare(b))
    .map((dirName) => ({
      id: dirName,
      path: rel('skills', dirName, 'SKILL.md')
    }));
};

const registryData: Record<string, RegistryFile> = {
  commands: {
    kind: 'commands',
    entries: listFiles(path.join(pluginRoot, 'commands'), (fileName) => fileName.endsWith('.md')).map((fileName) => ({
      id: fileName.replace(/\.md$/, ''),
      path: rel('commands', fileName)
    })),
    count: 0
  },
  agents: {
    kind: 'agents',
    entries: listFiles(path.join(pluginRoot, 'agents'), (fileName) => fileName.endsWith('.md')).map((fileName) => ({
      id: fileName.replace(/\.md$/, ''),
      path: rel('agents', fileName)
    })),
    count: 0
  },
  skills: {
    kind: 'skills',
    entries: listSkillEntries(),
    count: 0
  },
  hooks: {
    kind: 'hooks',
    entries: [
      { id: 'hooks', path: rel('hooks', 'hooks.json') },
      ...listFiles(path.join(pluginRoot, 'hooks', 'scripts'), (fileName) => fileName.endsWith('.sh')).map((fileName) => ({
        id: fileName.replace(/\.sh$/, ''),
        path: rel('hooks', 'scripts', fileName)
      }))
    ],
    count: 0
  },
  mcpEntrypoints: {
    kind: 'mcpEntrypoints',
    entries: [],
    count: 0
  }
};

const hooksConfig = JSON.parse(readFileSync(hooksPath, 'utf-8')) as { hooks?: Record<string, unknown[]> };
const hookEvents = Object.keys(hooksConfig.hooks ?? {}).sort();
const hookEventEntries = hookEvents.map((eventName) => ({
  id: `event:${eventName}`,
  path: rel('hooks', 'hooks.json')
}));
registryData.hooks.entries = [...registryData.hooks.entries, ...hookEventEntries];

const mcpPackage = JSON.parse(readFileSync(mcpPackagePath, 'utf-8')) as { main?: string };
const mcpCandidates = [
  rel('mcp-server', 'src', 'index.ts'),
  mcpPackage.main ? rel('mcp-server', mcpPackage.main) : null
].filter((entry): entry is string => Boolean(entry));

registryData.mcpEntrypoints.entries = Array.from(new Set(mcpCandidates)).map((entryPath) => ({
  id: path.basename(entryPath).replace(/\.(c|m)?(j|t)s$/, ''),
  path: entryPath
}));

for (const registry of Object.values(registryData)) {
  registry.count = registry.entries.length;
}

const registryFiles: Record<string, string> = {
  commands: rel('.claude-plugin', 'registry', 'commands.json'),
  agents: rel('.claude-plugin', 'registry', 'agents.json'),
  skills: rel('.claude-plugin', 'registry', 'skills.json'),
  hooks: rel('.claude-plugin', 'registry', 'hooks.json'),
  mcpEntrypoints: rel('.claude-plugin', 'registry', 'mcp-entrypoints.json')
};

const writeJson = (filePath: string, data: unknown): string => `${JSON.stringify(data, null, 2)}\n`;

const pendingWrites: Array<{ filePath: string; content: string }> = [];
for (const [kind, relativePath] of Object.entries(registryFiles)) {
  const absolutePath = path.join(pluginRoot, relativePath);
  const content = writeJson(absolutePath, registryData[kind]);
  pendingWrites.push({ filePath: absolutePath, content });
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
manifest.registries = {
  commands: registryFiles.commands,
  agents: registryFiles.agents,
  skills: registryFiles.skills,
  hooks: registryFiles.hooks,
  mcpEntrypoints: registryFiles.mcpEntrypoints
};
manifest.registryCounts = Object.fromEntries(
  Object.entries(registryData).map(([kind, data]) => [kind, data.count])
);
const manifestContent = writeJson(manifestPath, manifest);
pendingWrites.push({ filePath: manifestPath, content: manifestContent });

const readme = readFileSync(readmePath, 'utf-8');
const summaryLines = [
  '<!-- registry-summary:start -->',
  `- Sub-agents: **${registryData.agents.count}**`,
  `- Commands: **${registryData.commands.count}**`,
  `- Skills: **${registryData.skills.count}**`,
  `- Hook entries (config, scripts, and hook events): **${registryData.hooks.count}**`,
  `- MCP entrypoints: **${registryData.mcpEntrypoints.count}**`,
  '<!-- registry-summary:end -->'
].join('\n');

const summaryPattern = /<!-- registry-summary:start -->[\s\S]*?<!-- registry-summary:end -->/;
if (!summaryPattern.test(readme)) {
  throw new Error('README is missing registry summary markers.');
}

const readmeContent = readme.replace(summaryPattern, summaryLines);
pendingWrites.push({ filePath: readmePath, content: readmeContent });

let driftDetected = false;
for (const pending of pendingWrites) {
  const current = existsSync(pending.filePath) ? readFileSync(pending.filePath, 'utf-8') : '';
  if (current !== pending.content) {
    driftDetected = true;
    if (!checkMode) {
      writeFileSync(pending.filePath, pending.content, 'utf-8');
      console.log(`updated ${path.relative(repoRoot, pending.filePath)}`);
    } else {
      console.error(`drift detected: ${path.relative(repoRoot, pending.filePath)}`);
    }
  }
}

if (checkMode && driftDetected) {
  process.exit(1);
}

if (!driftDetected) {
  console.log('registry and documentation are up to date');
}
