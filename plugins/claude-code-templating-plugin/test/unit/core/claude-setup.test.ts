import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock('child_process', () => ({
  execFile: execFileMock,
}));

import { ClaudeSetupManager } from '../../../src/core/claude-setup.js';

describe('ClaudeSetupManager', () => {
  let tempRoot: string;

  beforeEach(async () => {
    execFileMock.mockReset();
    execFileMock.mockImplementation((_command, _args, _options, callback) => {
      callback?.(null, '', '');
      return {};
    });
    tempRoot = await mkdtemp(join(tmpdir(), 'claude-setup-'));
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it('creates the managed Claude workspace and context docs', async () => {
    await writeFile(
      join(tempRoot, 'package.json'),
      JSON.stringify({
        name: 'demo-app',
        dependencies: {
          react: '^18.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
        },
      }),
      'utf-8'
    );

    const manager = new ClaudeSetupManager();
    const result = await manager.ensureProjectSetup({
      mode: 'setup',
      projectRoot: tempRoot,
      installLsps: false,
    });

    expect(result.updatedFiles).toContain('README.md');
    expect(result.updatedFiles).toContain('CLAUDE.md');
    expect(result.updatedFiles).toContain('docs/context/project.md');

    const claudeMd = await readFile(join(tempRoot, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toContain('Reference Documents');

    const fingerprint = JSON.parse(await readFile(join(tempRoot, '.claude', 'fingerprint.json'), 'utf-8')) as {
      managedFiles: string[];
      project: string;
    };
    expect(fingerprint.project).toBe('demo-app');
    expect(fingerprint.managedFiles).toContain('README.md');
  });

  it('preserves an existing root README.md by default and adds a warning', async () => {
    await writeFile(join(tempRoot, 'package.json'), JSON.stringify({ name: 'demo-app' }), 'utf-8');
    await writeFile(join(tempRoot, 'README.md'), 'host README', 'utf-8');

    const manager = new ClaudeSetupManager();
    const result = await manager.ensureProjectSetup({
      mode: 'setup',
      projectRoot: tempRoot,
      installLsps: false,
    });

    expect(await readFile(join(tempRoot, 'README.md'), 'utf-8')).toBe('host README');
    expect(result.updatedFiles).not.toContain('README.md');
    expect(result.warnings).toContain(
      'Skipped overwriting existing README.md; rerun with --force to replace the managed template.'
    );
  });

  it('preserves an existing root CLAUDE.md by default and adds a warning', async () => {
    await writeFile(join(tempRoot, 'package.json'), JSON.stringify({ name: 'demo-app' }), 'utf-8');
    await writeFile(join(tempRoot, 'CLAUDE.md'), 'host CLAUDE', 'utf-8');

    const manager = new ClaudeSetupManager();
    const result = await manager.ensureProjectSetup({
      mode: 'update',
      projectRoot: tempRoot,
      installLsps: false,
    });

    expect(await readFile(join(tempRoot, 'CLAUDE.md'), 'utf-8')).toBe('host CLAUDE');
    expect(result.updatedFiles).not.toContain('CLAUDE.md');
    expect(result.warnings).toContain(
      'Skipped overwriting existing CLAUDE.md; rerun with --force to replace the managed template.'
    );
  });

  it('overwrites managed targets intentionally when force is true', async () => {
    await writeFile(join(tempRoot, 'package.json'), JSON.stringify({ name: 'demo-app' }), 'utf-8');
    await writeFile(join(tempRoot, 'README.md'), 'host README', 'utf-8');
    await writeFile(join(tempRoot, 'CLAUDE.md'), 'host CLAUDE', 'utf-8');
    await mkdir(join(tempRoot, '.claude', 'rules'), { recursive: true });
    await writeFile(join(tempRoot, '.claude', 'rules', 'coding.md'), 'old managed content', 'utf-8');

    const manager = new ClaudeSetupManager();
    const result = await manager.ensureProjectSetup({
      mode: 'setup',
      projectRoot: tempRoot,
      force: true,
      installLsps: false,
    });

    expect(await readFile(join(tempRoot, 'README.md'), 'utf-8')).toContain('# demo-app');
    expect(await readFile(join(tempRoot, 'CLAUDE.md'), 'utf-8')).toContain('Claude Operating Manual');
    expect(await readFile(join(tempRoot, '.claude', 'rules', 'coding.md'), 'utf-8')).toContain('# Coding Rules');
    expect(result.updatedFiles).toEqual(expect.arrayContaining(['README.md', 'CLAUDE.md', '.claude/rules/coding.md']));
    expect(result.warnings).not.toContain(
      expect.stringContaining('rerun with --force')
    );
  });

  it('adds local .claude docs for nested repositories under the root .claude tree', async () => {
    await writeFile(join(tempRoot, 'package.json'), JSON.stringify({ name: 'root-app' }), 'utf-8');
    const nestedRepo = join(tempRoot, '.claude', 'repositories', 'sample-repo');
    await mkdir(nestedRepo, { recursive: true });
    await writeFile(join(nestedRepo, 'package.json'), JSON.stringify({ name: 'nested-app' }), 'utf-8');

    const manager = new ClaudeSetupManager();
    const result = await manager.ensureProjectSetup({
      mode: 'update',
      projectRoot: tempRoot,
      installLsps: false,
    });

    expect(result.nestedRepositories).toContain('.claude/repositories/sample-repo');

    const nestedReadme = await readFile(join(nestedRepo, '.claude', 'README.md'), 'utf-8');
    expect(nestedReadme).toContain('Nested Repository Claude Workspace');
  });

  it('attempts to install relevant LSP packages for node-based projects', async () => {
    await writeFile(join(tempRoot, 'package.json'), JSON.stringify({ name: 'root-app' }), 'utf-8');

    const manager = new ClaudeSetupManager();
    const result = await manager.ensureProjectSetup({
      mode: 'setup',
      projectRoot: tempRoot,
    });

    expect(execFileMock).toHaveBeenCalledTimes(1);
    expect(execFileMock.mock.calls[0][0]).toBe('npm');
    expect(execFileMock.mock.calls[0][1]).toEqual(expect.arrayContaining([
      'install',
      '--save-dev',
      'typescript-language-server',
      'vscode-langservers-extracted',
      'yaml-language-server',
    ]));
    expect(result.installedLsps).toEqual(expect.arrayContaining([
      'typescript-language-server',
      'vscode-langservers-extracted',
      'yaml-language-server',
    ]));
  });
});
