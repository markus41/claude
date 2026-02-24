import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, utimes, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createContextManager } from '../../../src/core/context-manager.js';

describe('ContextManager cache invalidation', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'context-manager-'));
    await mkdir(join(workspace, 'src'), { recursive: true });
    await writeFile(join(workspace, 'src', 'index.ts'), 'export const value = 1;\n', 'utf-8');
    await writeFile(join(workspace, 'package.json'), '{"name":"cache-test"}\n', 'utf-8');
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('returns cached context when options and files are unchanged', async () => {
    const manager = createContextManager();

    const first = await manager.loadContext(workspace, { project: 'demo' });
    const second = await manager.loadContext(workspace, { project: 'demo' });

    expect(second).toBe(first);
  });

  it('invalidates cache when effective load options change', async () => {
    const manager = createContextManager();

    const first = await manager.loadContext(workspace, { project: 'demo' });
    const second = await manager.loadContext(
      workspace,
      { project: 'demo' },
      { maxFileSize: 10 }
    );

    expect(second).not.toBe(first);
    expect(second.files.some((file) => file.truncated)).toBe(true);
  });

  it('invalidates cache when scanned files change', async () => {
    const manager = createContextManager();

    const first = await manager.loadContext(workspace, { project: 'demo' });

    const targetFile = join(workspace, 'src', 'index.ts');
    await writeFile(targetFile, 'export const value = 2;\n', 'utf-8');

    const now = new Date();
    await utimes(targetFile, now, now);

    const second = await manager.loadContext(workspace, { project: 'demo' });

    expect(second).not.toBe(first);
    expect(second.files.find((file) => file.path === 'src/index.ts')?.content).toContain('value = 2');
  });
});
