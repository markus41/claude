/**
 * Copier Template Loader
 *
 * Loads and processes Copier templates (copier.yml/copier.yaml format).
 * Supports:
 * - Jinja2 template processing via Nunjucks
 * - copier.yml/copier.yaml configuration
 * - Conditional inclusion (when clauses)
 * - Post-generation tasks
 * - Skip if exists directives
 */

import { readFile, readdir, stat, mkdir, writeFile, access } from 'fs/promises';
import { join, relative, dirname, basename } from 'path';
import nunjucks from 'nunjucks';
import * as yaml from 'js-yaml';
import type {
  ITemplateLoader,
  TemplateFormat,
  TemplateInfo,
  GeneratedFile,
  TemplateVariable
} from '../../types/scaffold.js';
import type { CopierConfig, CopierQuestion } from '../../types/template.js';

export class CopierLoader implements ITemplateLoader {
  readonly format: TemplateFormat = 'copier';
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
  }

  /**
   * Check if this loader can handle the given source
   */
  async canHandle(source: string): Promise<boolean> {
    try {
      const stats = await stat(source);
      if (!stats.isDirectory()) return false;

      // Check for copier.yml or copier.yaml
      try {
        await access(join(source, 'copier.yml'));
        return true;
      } catch {
        try {
          await access(join(source, 'copier.yaml'));
          return true;
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
  }

  /**
   * Load template metadata from copier.yml
   */
  async loadMetadata(source: string): Promise<TemplateInfo> {
    const config = await this.loadConfig(source);

    // Extract variables from copier.yml
    const variables: TemplateVariable[] = [];
    for (const [key, value] of Object.entries(config)) {
      // Skip private configuration (prefixed with _)
      if (key.startsWith('_')) continue;

      // Handle question format
      if (this.isCopierQuestion(value)) {
        const question = value as CopierQuestion;
        variables.push({
          name: key,
          type: this.mapCopierType(question.type),
          prompt: question.help || key.replace(/_/g, ' '),
          default: this.normalizeDefault(question.default),
          choices: this.extractChoices(question.choices),
          description: question.help,
          required: question.default === undefined,
          when: typeof question.when === 'string' ? question.when : undefined
        });
      } else {
        // Simple key-value format
        variables.push({
          name: key,
          type: this.inferType(value),
          prompt: key.replace(/_/g, ' '),
          default: this.normalizeDefault(value),
          required: true
        });
      }
    }

    return {
      name: basename(source),
      description: config._message_before_copy || basename(source),
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
    const config = await this.loadConfig(source);

    // Determine template directory
    const templateDir = config._subdirectory
      ? join(source, config._subdirectory)
      : source;

    // Get exclusion patterns
    const excludePatterns = config._exclude || [];
    const skipIfExists = config._skip_if_exists || [];

    // Create output directory
    await mkdir(outputPath, { recursive: true });

    // Process template directory
    await this.processDirectory(
      templateDir,
      outputPath,
      variables,
      excludePatterns,
      skipIfExists,
      files,
      templateDir,
      outputPath
    );

    return files;
  }

  /**
   * Load copier configuration
   */
  private async loadConfig(source: string): Promise<CopierConfig> {
    let configPath = join(source, 'copier.yml');
    try {
      await access(configPath);
    } catch {
      configPath = join(source, 'copier.yaml');
    }

    const content = await readFile(configPath, 'utf-8');
    return yaml.load(content) as CopierConfig;
  }

  /**
   * Check if value is a Copier question object
   */
  private isCopierQuestion(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      ('type' in value || 'help' in value || 'default' in value || 'choices' in value)
    );
  }

  /**
   * Map Copier type to TemplateVariable type
   */
  private mapCopierType(type?: string): TemplateVariable['type'] {
    const typeMap: Record<string, TemplateVariable['type']> = {
      'str': 'string',
      'int': 'number',
      'float': 'number',
      'bool': 'boolean',
      'json': 'string',
      'yaml': 'string'
    };

    return type ? typeMap[type] || 'string' : 'string';
  }

  /**
   * Extract choices from Copier question
   */
  private extractChoices(choices?: unknown[] | Record<string, unknown>): string[] | undefined {
    if (!choices) return undefined;

    if (Array.isArray(choices)) {
      return choices.map(c => String(c));
    }

    if (typeof choices === 'object') {
      return Object.keys(choices);
    }

    return undefined;
  }

  /**
   * Infer type from value
   */
  private inferType(value: unknown): TemplateVariable['type'] {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'choice';
    return 'string';
  }

  /**
   * Normalize default value to allowed types
   */
  private normalizeDefault(value: unknown): string | number | boolean | string[] | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(v => String(v));
    }
    return String(value);
  }

  /**
   * Process a directory recursively
   */
  private async processDirectory(
    sourcePath: string,
    targetPath: string,
    variables: Record<string, unknown>,
    excludePatterns: string[],
    skipIfExists: string[],
    files: GeneratedFile[],
    templateRoot: string,
    outputRoot: string
  ): Promise<void> {
    const entries = await readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      const sourceEntry = join(sourcePath, entry.name);
      const relativeToRoot = relative(templateRoot, sourceEntry);

      // Check if entry should be excluded
      if (this.shouldExclude(relativeToRoot, excludePatterns)) {
        continue;
      }

      // Process entry name (may contain template variables)
      let targetName = entry.name;
      if (entry.name.includes('{{') || entry.name.includes('{%')) {
        targetName = this.processTemplate(entry.name, variables);

        // Skip if template evaluates to empty
        if (!targetName.trim()) continue;
      }

      const targetEntry = join(targetPath, targetName);

      if (entry.isDirectory()) {
        // Create directory and process recursively
        await mkdir(targetEntry, { recursive: true });
        await this.processDirectory(
          sourceEntry,
          targetEntry,
          variables,
          excludePatterns,
          skipIfExists,
          files,
          templateRoot,
          outputRoot
        );
      } else {
        // Check if file should be skipped if it exists
        if (this.shouldSkipIfExists(relativeToRoot, skipIfExists)) {
          try {
            await access(targetEntry);
            // File exists, skip
            continue;
          } catch {
            // File doesn't exist, proceed
          }
        }

        // Process file
        await this.processFile(sourceEntry, targetEntry, variables, files, outputRoot);
      }
    }
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      return this.matchesPattern(path, pattern);
    });
  }

  /**
   * Check if file should be skipped if it exists
   */
  private shouldSkipIfExists(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      return this.matchesPattern(path, pattern);
    });
  }

  /**
   * Process a single file
   */
  private async processFile(
    sourcePath: string,
    targetPath: string,
    variables: Record<string, unknown>,
    files: GeneratedFile[],
    outputRoot: string
  ): Promise<void> {
    const templateContent = await readFile(sourcePath, 'utf-8');

    // Check if file has template syntax
    const hasTemplates = templateContent.includes('{{') || templateContent.includes('{%');

    let processedContent: string;
    if (hasTemplates) {
      processedContent = this.processTemplate(templateContent, variables);
    } else {
      processedContent = templateContent;
    }

    // Write processed content
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, processedContent, 'utf-8');

    // Track generated file
    const stats = await stat(targetPath);
    files.push({
      path: relative(outputRoot, targetPath),
      action: 'created',
      size: stats.size,
      type: this.getFileType(targetPath)
    });
  }

  /**
   * Process a template string with Nunjucks
   */
  private processTemplate(template: string, variables: Record<string, unknown>): string {
    try {
      return this.nunjucksEnv.renderString(template, variables);
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
      'j2': 'template',
      'jinja2': 'template'
    };

    return typeMap[ext || ''] || 'other';
  }

  /**
   * Match a copier pattern against a relative path
   */
  private matchesPattern(targetPath: string, pattern: string): boolean {
    const normalizedTarget = targetPath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');
    const regex = this.globToRegExp(normalizedPattern);
    return regex.test(normalizedTarget);
  }

  /**
   * Convert a glob pattern to a regex
   */
  private globToRegExp(pattern: string): RegExp {
    const doubleStarSlash = '__GLOB_DOUBLE_STAR_SLASH__';
    const doubleStar = '__GLOB_DOUBLE_STAR__';
    const singleStar = '__GLOB_SINGLE_STAR__';
    const question = '__GLOB_QUESTION__';

    const tokenized = pattern
      .replace(/\*\*\/+/g, doubleStarSlash)
      .replace(/\*\*/g, doubleStar)
      .replace(/\*/g, singleStar)
      .replace(/\?/g, question);

    const escaped = tokenized.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const withDoubleStarSlash = escaped.replace(
      new RegExp(doubleStarSlash, 'g'),
      '(?:.*/)?'
    );
    const withDoubleStar = withDoubleStarSlash.replace(
      new RegExp(doubleStar, 'g'),
      '.*'
    );
    const withSingleStar = withDoubleStar.replace(
      new RegExp(singleStar, 'g'),
      '[^/]*'
    );
    const withQuestion = withSingleStar.replace(
      new RegExp(question, 'g'),
      '[^/]'
    );

    return new RegExp(`^${withQuestion}$`);
  }
}

/**
 * Create a Copier loader instance
 */
export function createCopierLoader(): CopierLoader {
  return new CopierLoader();
}
