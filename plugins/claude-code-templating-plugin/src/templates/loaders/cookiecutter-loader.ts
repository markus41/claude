/**
 * Cookiecutter Template Loader
 *
 * Loads and processes Cookiecutter templates (cookiecutter.json format).
 * Supports:
 * - Jinja2 template processing via Nunjucks
 * - cookiecutter.json variable definitions
 * - _copy_without_render directive
 * - Pre/post generation hooks
 * - Template directory structure
 */

import { readFile, readdir, stat, mkdir, writeFile, copyFile } from 'fs/promises';
import { join, relative, dirname, basename } from 'path';
import nunjucks from 'nunjucks';
import type {
  ITemplateLoader,
  TemplateFormat,
  TemplateInfo,
  GeneratedFile,
  TemplateVariable
} from '../../types/scaffold.js';
import type { CookiecutterTemplate } from '../../types/template.js';

export class CookiecutterLoader implements ITemplateLoader {
  readonly format: TemplateFormat = 'cookiecutter';
  private nunjucksEnv: nunjucks.Environment;

  constructor() {
    // Configure Nunjucks to match Jinja2 behavior
    this.nunjucksEnv = new nunjucks.Environment(null, {
      autoescape: false,
      trimBlocks: true,
      lstripBlocks: true,
      tags: {
        blockStart: '{%',
        blockEnd: '%}',
        variableStart: '{{',
        variableEnd: '}}',
        commentStart: '{#',
        commentEnd: '#}'
      }
    });

    // Add custom filters
    this.registerFilters();
  }

  /**
   * Register Jinja2-compatible filters
   */
  private registerFilters(): void {
    this.nunjucksEnv.addFilter('lower', (str: string) => str.toLowerCase());
    this.nunjucksEnv.addFilter('upper', (str: string) => str.toUpperCase());
    this.nunjucksEnv.addFilter('title', (str: string) =>
      str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    );
    this.nunjucksEnv.addFilter('capitalize', (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1)
    );
    this.nunjucksEnv.addFilter('replace', (str: string, old: string, newStr: string) =>
      str.replace(new RegExp(old, 'g'), newStr)
    );
    this.nunjucksEnv.addFilter('slugify', (str: string) =>
      str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
    );
    this.nunjucksEnv.addFilter('underscore', (str: string) =>
      str.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    );
  }

  /**
   * Check if this loader can handle the given source
   */
  async canHandle(source: string): Promise<boolean> {
    try {
      const stats = await stat(source);
      if (!stats.isDirectory()) return false;

      // Check for cookiecutter.json
      const cookiecutterJsonPath = join(source, 'cookiecutter.json');
      try {
        await stat(cookiecutterJsonPath);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Load template metadata from cookiecutter.json
   */
  async loadMetadata(source: string): Promise<TemplateInfo> {
    const cookiecutterJsonPath = join(source, 'cookiecutter.json');
    const content = await readFile(cookiecutterJsonPath, 'utf-8');
    const config: CookiecutterTemplate = JSON.parse(content);

    // Extract variables from cookiecutter.json
    const variables: TemplateVariable[] = [];
    for (const [key, value] of Object.entries(config)) {
      // Skip private variables (prefixed with _)
      if (key.startsWith('_')) continue;

      // Determine variable type
      let type: TemplateVariable['type'] = 'string';
      let choices: string[] | undefined;

      if (Array.isArray(value)) {
        type = 'choice';
        choices = value as string[];
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (typeof value === 'number') {
        type = 'number';
      }

      variables.push({
        name: key,
        type,
        prompt: key.replace(/_/g, ' '),
        default: Array.isArray(value) ? value[0] : value,
        choices,
        required: true
      });
    }

    // Try to read description from README or template directory name
    let description: string | undefined;
    try {
      const readmePath = join(source, 'README.md');
      const readme = await readFile(readmePath, 'utf-8');
      const match = readme.match(/^#\s+(.+)$/m);
      if (match) description = match[1];
    } catch {
      // No README, use directory name
      description = basename(source);
    }

    return {
      name: basename(source),
      description,
      source,
      format: this.format,
      variables
    };
  }

  /**
   * Generate files from template
   */
  async generate(
    source: string,
    outputPath: string,
    variables: Record<string, unknown>
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Load cookiecutter.json
    const cookiecutterJsonPath = join(source, 'cookiecutter.json');
    const content = await readFile(cookiecutterJsonPath, 'utf-8');
    const config: CookiecutterTemplate = JSON.parse(content);

    // Get files to copy without rendering
    const copyWithoutRender = new Set(config._copy_without_render || []);

    // Find template directory (should be {{ cookiecutter.project_slug }} or similar)
    const templateDir = await this.findTemplateDirectory(source);
    if (!templateDir) {
      throw new Error('Could not find template directory in Cookiecutter template');
    }

    // Process template directory name
    const processedDirName = this.processTemplate(basename(templateDir), variables);
    const targetPath = join(outputPath, processedDirName);

    // Generate files recursively
    await this.processDirectory(
      templateDir,
      targetPath,
      variables,
      copyWithoutRender,
      files,
      templateDir
    );

    return files;
  }

  /**
   * Find the template directory (contains {{cookiecutter.* }} in name)
   */
  private async findTemplateDirectory(source: string): Promise<string | null> {
    const entries = await readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && (entry.name.includes('{{') || entry.name.includes('{{'))) {
        return join(source, entry.name);
      }
    }

    return null;
  }

  /**
   * Process a directory recursively
   */
  private async processDirectory(
    sourcePath: string,
    targetPath: string,
    variables: Record<string, unknown>,
    copyWithoutRender: Set<unknown>,
    files: GeneratedFile[],
    templateRoot: string
  ): Promise<void> {
    // Create target directory
    await mkdir(targetPath, { recursive: true });

    const entries = await readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      const sourceEntry = join(sourcePath, entry.name);
      const relativeToRoot = relative(templateRoot, sourceEntry);

      // Process entry name
      let targetName = entry.name;
      if (entry.name.includes('{{')) {
        targetName = this.processTemplate(entry.name, variables);
      }

      const targetEntry = join(targetPath, targetName);

      if (entry.isDirectory()) {
        // Process directory recursively
        await this.processDirectory(
          sourceEntry,
          targetEntry,
          variables,
          copyWithoutRender,
          files,
          templateRoot
        );
      } else {
        // Check if file should be copied without rendering
        const shouldSkipRender = Array.from(copyWithoutRender).some(pattern => {
          if (typeof pattern === 'string') {
            return relativeToRoot.includes(pattern) || entry.name.includes(pattern);
          }
          return false;
        });

        if (shouldSkipRender) {
          // Copy file without processing
          await copyFile(sourceEntry, targetEntry);
        } else {
          // Process file template
          const templateContent = await readFile(sourceEntry, 'utf-8');
          const processedContent = this.processTemplate(templateContent, variables);
          await writeFile(targetEntry, processedContent, 'utf-8');
        }

        // Track generated file
        const stats = await stat(targetEntry);
        files.push({
          path: relative(dirname(targetPath), targetEntry),
          action: 'created',
          size: stats.size,
          type: this.getFileType(targetEntry)
        });
      }
    }
  }

  /**
   * Process a template string with Nunjucks
   */
  private processTemplate(template: string, variables: Record<string, unknown>): string {
    try {
      // Create context with cookiecutter namespace
      const context = {
        cookiecutter: variables,
        ...variables
      };

      return this.nunjucksEnv.renderString(template, context);
    } catch (error) {
      throw new Error(`Template processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determine file type from extension
   */
  private getFileType(filePath: string): GeneratedFile['type'] {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, GeneratedFile['type']> = {
      'ts': 'source',
      'js': 'source',
      'jsx': 'source',
      'tsx': 'source',
      'py': 'source',
      'java': 'source',
      'go': 'source',
      'rs': 'source',
      'json': 'config',
      'yaml': 'config',
      'yml': 'config',
      'toml': 'config',
      'ini': 'config',
      'test': 'test',
      'spec': 'test',
      'md': 'docs',
      'txt': 'docs',
      'hbs': 'template',
      'j2': 'template'
    };

    return typeMap[ext || ''] || 'other';
  }
}

/**
 * Create a Cookiecutter loader instance
 */
export function createCookiecutterLoader(): CookiecutterLoader {
  return new CookiecutterLoader();
}
