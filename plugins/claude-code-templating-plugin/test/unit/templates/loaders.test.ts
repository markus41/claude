/**
 * Template Loader Tests
 *
 * Unit tests for loader path reporting and glob behavior.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { CookiecutterLoader } from '../../../src/templates/loaders/cookiecutter-loader.js';
import { CopierLoader } from '../../../src/templates/loaders/copier-loader.js';
import { HarnessTemplateLoader } from '../../../src/templates/loaders/harness-loader.js';

const tempDirs: string[] = [];
const normalizePath = (value: string): string => value.replace(/\\/g, '/');

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

describe('Template Loaders', () => {
  it('cookiecutter honors copy_without_render globs and reports paths from output root', async () => {
    const baseDir = await createTempDir('cookiecutter-');
    const templateRoot = join(baseDir, 'template');
    await mkdir(templateRoot, { recursive: true });

    const cookiecutterConfig = {
      project_slug: 'demo',
      _copy_without_render: ['**/*.png'],
    };

    await writeFile(
      join(templateRoot, 'cookiecutter.json'),
      JSON.stringify(cookiecutterConfig, null, 2),
      'utf-8'
    );

    const templateDir = join(templateRoot, '{{ cookiecutter.project_slug }}');
    await mkdir(join(templateDir, 'static'), { recursive: true });

    await writeFile(
      join(templateDir, 'README.md'),
      'Project {{ cookiecutter.project_slug }}',
      'utf-8'
    );
    await writeFile(
      join(templateDir, 'static', 'logo.png'),
      'raw {{ cookiecutter.project_slug }}',
      'utf-8'
    );

    const outputDir = join(baseDir, 'output');
    const loader = new CookiecutterLoader();
    const files = await loader.generate(templateRoot, outputDir, {
      project_slug: 'my-app',
    });

    const paths = files.map((file) => normalizePath(file.path)).sort();
    expect(paths).toEqual(['my-app/README.md', 'my-app/static/logo.png'].sort());

    const readme = await readFile(join(outputDir, 'my-app', 'README.md'), 'utf-8');
    expect(readme).toContain('my-app');

    const logo = await readFile(join(outputDir, 'my-app', 'static', 'logo.png'), 'utf-8');
    expect(logo).toContain('{{ cookiecutter.project_slug }}');
  });

  it('copier applies glob excludes/skip-if-exists and reports paths from output root', async () => {
    const baseDir = await createTempDir('copier-');
    const templateRoot = join(baseDir, 'template');
    await mkdir(templateRoot, { recursive: true });

    const copierConfig = [
      '_message_before_copy: Test',
      '_exclude:',
      '  - "**/*.skip"',
      '_skip_if_exists:',
      '  - "docs/**"',
      'project_name: Demo',
      '',
    ].join('\n');

    await writeFile(join(templateRoot, 'copier.yml'), copierConfig, 'utf-8');
    await writeFile(join(templateRoot, 'keep.txt'), 'Project {{ project_name }}', 'utf-8');
    await writeFile(join(templateRoot, 'ignored.skip'), 'skip', 'utf-8');
    await mkdir(join(templateRoot, 'docs'), { recursive: true });
    await writeFile(join(templateRoot, 'docs', 'readme.md'), 'Doc {{ project_name }}', 'utf-8');

    const outputDir = join(baseDir, 'output');
    await mkdir(join(outputDir, 'docs'), { recursive: true });
    await writeFile(join(outputDir, 'docs', 'readme.md'), 'existing', 'utf-8');

    const loader = new CopierLoader();
    const files = await loader.generate(templateRoot, outputDir, {
      project_name: 'NewName',
    });

    const paths = files.map((file) => normalizePath(file.path));
    expect(paths).toContain('keep.txt');
    expect(paths).not.toContain('docs/readme.md');
    expect(paths).not.toContain('ignored.skip');

    const keep = await readFile(join(outputDir, 'keep.txt'), 'utf-8');
    expect(keep).toContain('NewName');

    const docs = await readFile(join(outputDir, 'docs', 'readme.md'), 'utf-8');
    expect(docs).toBe('existing');

    await expect(access(join(outputDir, 'ignored.skip'))).rejects.toThrow();
  });

  it('harness loader reports paths from output root', async () => {
    const baseDir = await createTempDir('harness-');
    const templateFile = join(baseDir, 'template.yaml');
    const outputDir = join(baseDir, 'output');

    const harnessTemplate = [
      'template:',
      '  name: Example Template',
      '  identifier: example_template',
      '  versionLabel: "1.0.0"',
      '  type: Step',
      '  spec:',
      '    type: ShellScript',
      '    spec:',
      '      source:',
      '        type: Inline',
      '        spec:',
      '          script: "echo <+input>.message"',
      '',
    ].join('\n');

    await writeFile(templateFile, harnessTemplate, 'utf-8');

    const loader = new HarnessTemplateLoader();
    const files = await loader.generate(templateFile, outputDir, {
      message: 'hello',
    });

    expect(files).toHaveLength(1);
    expect(normalizePath(files[0]!.path)).toBe('example_template.yaml');

    const output = await readFile(join(outputDir, 'example_template.yaml'), 'utf-8');
    expect(output).toContain('hello');
  });
});
