/**
 * Universal Template Engine
 *
 * Extends Handlebars-based template processing with support for:
 * - Harness pipeline expressions (<+input>, <+pipeline.*>, etc.)
 * - YAML-aware processing with structure preservation
 * - Conditional file generation
 * - File path template processing
 * - Multiple template format support
 */

import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import * as yaml from 'js-yaml';
import type { TemplateContext, ITemplateEngine, ValidationResult } from '../types/scaffold.js';

export class TemplateEngine implements ITemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers including Harness-specific ones
   */
  private registerHelpers(): void {
    // String manipulation helpers
    this.handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
    this.handlebars.registerHelper('lowercase', (str: string) => str.toLowerCase());
    this.handlebars.registerHelper('capitalize', (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1)
    );
    this.handlebars.registerHelper('pascalCase', (str: string) =>
      str.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase()).replace(/[-_]/g, '')
    );
    this.handlebars.registerHelper('camelCase', (str: string) => {
      const pascal = str.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase()).replace(/[-_]/g, '');
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });
    this.handlebars.registerHelper('snakeCase', (str: string) =>
      str.replace(/[-\s]/g, '_').toLowerCase()
    );
    this.handlebars.registerHelper('kebabCase', (str: string) =>
      str.replace(/[_\s]/g, '-').toLowerCase()
    );
    this.handlebars.registerHelper('dotCase', (str: string) =>
      str.replace(/[-_\s]/g, '.').toLowerCase()
    );

    // Harness expression helpers
    this.handlebars.registerHelper('harnessInput', (name: string) => `<+input>.${name}`);
    this.handlebars.registerHelper('harnessVar', (name: string) => `<+variable>.${name}`);
    this.handlebars.registerHelper('harnessSecret', (name: string) => `<+secrets.getValue("${name}")>`);
    this.handlebars.registerHelper('harnessEnv', (name: string) => `<+env.${name}>`);
    this.handlebars.registerHelper('harnessPipeline', (path: string) => `<+pipeline>.${path}`);
    this.handlebars.registerHelper('harnessStage', (path: string) => `<+stage>.${path}`);
    this.handlebars.registerHelper('harnessService', (path: string) => `<+service>.${path}`);
    this.handlebars.registerHelper('harnessInfra', (path: string) => `<+infra>.${path}`);
    this.handlebars.registerHelper('harnessArtifact', (path: string) => `<+artifact>.${path}`);
    this.handlebars.registerHelper('harnessManifest', (path: string) => `<+manifest>.${path}`);

    // Date/time helpers
    this.handlebars.registerHelper('year', () => new Date().getFullYear());
    this.handlebars.registerHelper('date', (format?: string) => {
      const now = new Date();
      if (format === 'iso') return now.toISOString();
      if (format === 'short') return now.toLocaleDateString();
      if (format === 'long') return now.toLocaleString();
      return now.toISOString().split('T')[0];
    });
    this.handlebars.registerHelper('timestamp', () => Date.now());

    // Comparison helpers
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    // Logical helpers
    this.handlebars.registerHelper('and', (...args: unknown[]) => {
      const values = args.slice(0, -1);
      return values.every(Boolean);
    });
    this.handlebars.registerHelper('or', (...args: unknown[]) => {
      const values = args.slice(0, -1);
      return values.some(Boolean);
    });
    this.handlebars.registerHelper('not', (value: unknown) => !value);

    // Array helpers
    this.handlebars.registerHelper('join', (arr: unknown[], separator = ', ') =>
      Array.isArray(arr) ? arr.join(separator) : ''
    );
    this.handlebars.registerHelper('includes', (arr: unknown[], value: unknown) =>
      Array.isArray(arr) ? arr.includes(value) : false
    );
    this.handlebars.registerHelper('length', (arr: unknown[]) =>
      Array.isArray(arr) ? arr.length : 0
    );
    this.handlebars.registerHelper('first', (arr: unknown[]) =>
      Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined
    );
    this.handlebars.registerHelper('last', (arr: unknown[]) =>
      Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined
    );

    // JSON/YAML helpers
    this.handlebars.registerHelper('json', (obj: unknown, indent?: number) =>
      JSON.stringify(obj, null, indent || 2)
    );
    this.handlebars.registerHelper('yaml', (obj: unknown) =>
      yaml.dump(obj, { indent: 2, lineWidth: -1 })
    );

    // Comment helper (strips content from output)
    this.handlebars.registerHelper('comment', () => '');

    // Indent helper
    this.handlebars.registerHelper('indent', (text: string, spaces = 2) => {
      const indent = ' '.repeat(spaces);
      return text.split('\n').map(line => indent + line).join('\n');
    });

    // License helper
    this.handlebars.registerHelper('license', (type: string, year?: number, author?: string) => {
      const y = year || new Date().getFullYear();
      const a = author || 'Author';
      const licenses: Record<string, string> = {
        'MIT': `MIT License - Copyright (c) ${y} ${a}`,
        'Apache-2.0': `Apache License 2.0 - Copyright (c) ${y} ${a}`,
        'GPL-3.0': `GNU General Public License v3.0 - Copyright (c) ${y} ${a}`,
        'ISC': `ISC License - Copyright (c) ${y} ${a}`,
        'BSD-3-Clause': `BSD 3-Clause License - Copyright (c) ${y} ${a}`,
      };
      return licenses[type] || type;
    });

    // UUID helper
    this.handlebars.registerHelper('uuid', () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    });

    // Conditional file generation helper
    this.handlebars.registerHelper('skipFile', function(this: unknown, condition: boolean) {
      if (condition) {
        throw new Error('SKIP_FILE');
      }
      return '';
    });

    // Default helper (provides fallback value)
    this.handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) => {
      return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });

    // Replace helper
    this.handlebars.registerHelper('replace', (str: string, search: string, replace: string) => {
      return str.replace(new RegExp(search, 'g'), replace);
    });

    // Trim helper
    this.handlebars.registerHelper('trim', (str: string) => str.trim());
  }

  /**
   * Process a template string with context
   */
  processString(template: string, context: TemplateContext): string {
    try {
      const compiled = this.handlebars.compile(template, { noEscape: true });
      let result = compiled(this.buildContext(context));

      // Ensure output ends with exactly one newline for file content
      result = result.replace(/[\r\n]*$/, '') + '\n';

      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'SKIP_FILE') {
        throw error;
      }
      throw new Error(`Template processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process a template file with context
   */
  async processFile(templatePath: string, context: TemplateContext): Promise<string> {
    try {
      const templateContent = await readFile(templatePath, 'utf-8');
      return this.processString(templateContent, context);
    } catch (error) {
      if (error instanceof Error && error.message === 'SKIP_FILE') {
        throw error;
      }
      throw new Error(`Failed to process template file ${templatePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process filename template (removes template extensions and processes variables)
   */
  processFilename(templateFilename: string, context: TemplateContext): string {
    // Remove template extensions if present
    let filename = templateFilename;
    const extensions = ['.hbs', '.handlebars', '.j2', '.jinja2', '.template'];
    for (const ext of extensions) {
      if (filename.endsWith(ext)) {
        filename = filename.slice(0, -ext.length);
        break;
      }
    }

    // Process any template variables in filename
    try {
      const compiled = this.handlebars.compile(filename, { noEscape: true });
      let result = compiled(this.buildContext(context));

      // Remove any trailing newlines/whitespace
      result = result.trimEnd();

      return result;
    } catch (error) {
      throw new Error(`Failed to process filename ${templateFilename}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process YAML template with structure preservation
   */
  processYaml(template: string, context: TemplateContext): string {
    try {
      // First, process the template
      const processed = this.processString(template, context);

      // Parse and re-dump to ensure valid YAML structure
      const parsed = yaml.load(processed);
      return yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      });
    } catch (error) {
      throw new Error(`YAML template processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template);
  }

  /**
   * Load and register a partial from file
   */
  async loadPartial(name: string, path: string): Promise<void> {
    const content = await readFile(path, 'utf-8');
    this.registerPartial(name, content);
  }

  /**
   * Register a custom helper
   */
  registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    this.handlebars.registerHelper(name, fn);
  }

  /**
   * Validate template syntax without processing
   */
  validateTemplate(template: string): ValidationResult {
    try {
      this.handlebars.compile(template);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract variables used in a template
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>();
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const expression = match[1]!.trim();

      // Skip helper invocations
      if (expression.startsWith('#') || expression.startsWith('/') || expression.startsWith('^')) {
        continue;
      }

      // Extract the base variable name (before any dots or spaces)
      const varName = expression.split(/[\s.#/()]/)[0];
      if (varName && !this.isHelper(varName)) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  /**
   * Build complete context object for Handlebars
   */
  private buildContext(context: TemplateContext): Record<string, unknown> {
    const now = new Date();

    return {
      ...context.variables,
      ...context.computed,
      env: context.env || {
        cwd: process.cwd(),
        user: process.env.USER || process.env.USERNAME || 'unknown',
        timestamp: now.toISOString(),
        date: now.toLocaleDateString(),
        platform: process.platform
      }
    };
  }

  /**
   * Check if a name is a registered helper
   */
  private isHelper(name: string): boolean {
    const builtInHelpers = [
      'if', 'unless', 'each', 'with', 'lookup', 'log', 'blockHelperMissing', 'helperMissing'
    ];

    const customHelpers = [
      'uppercase', 'lowercase', 'capitalize', 'pascalCase', 'camelCase',
      'snakeCase', 'kebabCase', 'dotCase', 'year', 'date', 'timestamp',
      'eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'and', 'or', 'not',
      'join', 'includes', 'length', 'first', 'last', 'json', 'yaml',
      'comment', 'indent', 'license', 'uuid', 'skipFile', 'default',
      'replace', 'trim', 'harnessInput', 'harnessVar', 'harnessSecret',
      'harnessEnv', 'harnessPipeline', 'harnessStage', 'harnessService',
      'harnessInfra', 'harnessArtifact', 'harnessManifest'
    ];

    return builtInHelpers.includes(name) || customHelpers.includes(name);
  }

  /**
   * Create a context object with default values
   */
  createContext(
    variables: Record<string, unknown>,
    computed: Record<string, unknown> = {}
  ): TemplateContext {
    const now = new Date();

    return {
      variables,
      computed: {
        ...computed,
        // Auto-computed values
        timestamp: now.toISOString(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        year: now.getFullYear()
      },
      env: {
        cwd: process.cwd(),
        user: process.env.USER || process.env.USERNAME || 'unknown',
        timestamp: now.toISOString(),
        date: now.toLocaleDateString(),
        platform: process.platform
      }
    };
  }
}

/**
 * Create a default template engine instance
 */
export function createTemplateEngine(): TemplateEngine {
  return new TemplateEngine();
}
