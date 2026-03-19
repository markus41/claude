import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync } from 'fs';
import { ClaudeProjectSetupManager } from '../../../src/core/claude-setup.js';

describe('ClaudeProjectSetupManager', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('creates a managed Claude baseline and nested repository .claude directories', async () => {
    const projectPath = await mkdtemp(join(tmpdir(), 'claude-setup-'));
    tempDirectories.push(projectPath);

    await writeFile(join(projectPath, 'package.json'), JSON.stringify({
      name: 'demo-app',
      dependencies: {
        react: '^18.0.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
        vitest: '^1.0.0',
      },
    }, null, 2));
    await writeFile(join(projectPath, 'tsconfig.json'), '{"compilerOptions":{"strict":true}}');
    await writeFile(join(projectPath, 'package-lock.json'), '{}');
    await mkdir(join(projectPath, '.claude', 'repositories', 'service-a'), { recursive: true });
    await writeFile(join(projectPath, '.claude', 'repositories', 'service-a', 'package.json'), '{"name":"service-a"}');

    const commandRunner = vi.fn().mockResolvedValue({ command: 'noop', success: true });
    const manager = new ClaudeProjectSetupManager(undefined, commandRunner);

    const result = await manager.synchronizeProject(projectPath, { mode: 'setup' });

    expect(result.filesWritten).toContain('CLAUDE.md');
    expect(result.filesWritten).toContain('docs/context/project.md');
    expect(result.repositoriesUpdated).toContain('.claude/repositories/service-a');

    const rootClaude = await readFile(join(projectPath, 'CLAUDE.md'), 'utf-8');
    const manifest = await readFile(join(projectPath, '.claude', 'lsp', 'manifest.json'), 'utf-8');
    const nestedClaude = await readFile(join(projectPath, '.claude', 'repositories', 'service-a', '.claude', 'CLAUDE.md'), 'utf-8');

    expect(rootClaude).toContain('Reference Documents');
    expect(manifest).toContain('typescript-language-server');
    expect(nestedClaude).toContain('Nested Repository Guidance');
    expect(commandRunner).toHaveBeenCalled();
  });

  it('updates the managed README section without duplicating it', async () => {
    const projectPath = await mkdtemp(join(tmpdir(), 'claude-setup-'));
    tempDirectories.push(projectPath);

    await writeFile(join(projectPath, 'README.md'), '# Existing Project\n\nCustom intro.\n');
    await writeFile(join(projectPath, 'package.json'), JSON.stringify({ name: 'existing-project' }, null, 2));

    const manager = new ClaudeProjectSetupManager(undefined, vi.fn().mockResolvedValue({ command: 'noop', success: true }));

    await manager.synchronizeProject(projectPath, { mode: 'update', installLsps: false });
    await manager.synchronizeProject(projectPath, { mode: 'update', installLsps: false });

    const readme = await readFile(join(projectPath, 'README.md'), 'utf-8');
    const markerCount = (readme.match(/claude-code-templating-plugin:setup:start/g) || []).length;

    expect(readme).toContain('Custom intro.');
    expect(readme).toContain('Claude Code Setup');
    expect(markerCount).toBe(1);
  });
});
