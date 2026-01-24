/**
 * Handlebars Template Engine Adapter
 *
 * Provides Handlebars templating with custom helpers for:
 * - String manipulation (case conversions)
 * - Date/time formatting
 * - Comparison and logical operations
 * - Array operations
 * - JSON formatting
 */

import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import type { ITemplateEngine } from './ITemplateEngine.js';
import type { TemplateContext } from '../types.js';

export class HandlebarsAdapter implements ITemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // String manipulation helpers
    this.handlebars.registerHelper('uppercase', (str: string) => {
      if (!str) return '';
      return str.toUpperCase();
    });

    this.handlebars.registerHelper('lowercase', (str: string) => {
      if (!str) return '';
      return str.toLowerCase();
    });

    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    this.handlebars.registerHelper('pascalCase', (str: string) => {
      if (!str) return '';
      return str.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
    });

    this.handlebars.registerHelper('camelCase', (str: string) => {
      if (!str) return '';
      const pascal = str.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      if (!str) return '';
      return str.replace(/-/g, '_').toLowerCase();
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      if (!str) return '';
      return str.replace(/_/g, '-').toLowerCase();
    });

    // Date/time helpers
    this.handlebars.registerHelper('year', () => new Date().getFullYear());

    this.handlebars.registerHelper('now', (format?: string) => {
      const now = new Date();
      if (format === 'iso') {
        return now.toISOString();
      }
      if (format === 'date') {
        return now.toLocaleDateString();
      }
      if (format === 'time') {
        return now.toLocaleTimeString();
      }
      return now.toISOString();
    });

    this.handlebars.registerHelper('formatDate', (date: Date | string, format?: string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (format === 'iso') {
        return d.toISOString();
      }
      if (format === 'date') {
        return d.toLocaleDateString();
      }
      if (format === 'time') {
        return d.toLocaleTimeString();
      }
      return d.toISOString();
    });

    // Comparison helpers
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

    // Logical helpers
    this.handlebars.registerHelper('and', (...args: unknown[]) => {
      // Last argument is Handlebars options object
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

    // JSON helpers
    this.handlebars.registerHelper('json', (obj: unknown, indent?: number) =>
      JSON.stringify(obj, null, indent || 2)
    );

    // Default helper (provide fallback value)
    this.handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) =>
      value !== undefined && value !== null && value !== '' ? value : defaultValue
    );

    // Pluralize helper (simple English pluralization)
    this.handlebars.registerHelper('pluralize', (word: string, count?: number) => {
      if (count === 1) return word;

      // Simple pluralization rules
      if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') ||
          word.endsWith('ch') || word.endsWith('sh')) {
        return word + 'es';
      }
      if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
        return word.slice(0, -1) + 'ies';
      }
      return word + 's';
    });

    // Singularize helper (simple English singularization)
    this.handlebars.registerHelper('singularize', (word: string) => {
      if (word.endsWith('ies')) {
        return word.slice(0, -3) + 'y';
      }
      if (word.endsWith('es') && (word.endsWith('ses') || word.endsWith('xes') ||
          word.endsWith('zes') || word.endsWith('ches') || word.endsWith('shes'))) {
        return word.slice(0, -2);
      }
      if (word.endsWith('s') && !word.endsWith('ss')) {
        return word.slice(0, -1);
      }
      return word;
    });

    // Comment helper (strips content from output)
    this.handlebars.registerHelper('comment', () => '');

    // Indent helper
    this.handlebars.registerHelper('indent', (text: string, spaces = 2) => {
      const indent = ' '.repeat(spaces);
      return text.split('\n').map(line => indent + line).join('\n');
    });

    // License helper
    this.handlebars.registerHelper('license', (type: string) => {
      const licenses: Record<string, string> = {
        'MIT': 'MIT License - Copyright (c) {{year}} {{author}}',
        'Apache-2.0': 'Apache License 2.0',
        'GPL-3.0': 'GNU General Public License v3.0',
        'ISC': 'ISC License'
      };
      return licenses[type] || type;
    });
  }

  /**
   * Process a template string with context
   * Ensures output always ends with exactly one newline (for file content)
   */
  processString(templateString: string, context: TemplateContext): string {
    try {
      const template = this.handlebars.compile(templateString);
      let result = template(this.buildContext(context));

      // Ensure output ends with exactly one newline
      result = result.replace(/[\r\n]*$/, '') + '\n';

      return result;
    } catch (error) {
      throw new Error(`Handlebars template processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process a template string without appending newline (for filenames and paths)
   */
  private processTemplate(templateString: string, context: TemplateContext): string {
    try {
      const template = this.handlebars.compile(templateString);
      return template(this.buildContext(context));
    } catch (error) {
      throw new Error(`Handlebars template processing failed: ${error instanceof Error ? error.message : String(error)}`);
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
      throw new Error(`Failed to process template file ${templatePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process filename template (removes .hbs extension and processes variables)
   * Note: Filenames should never contain newline characters
   */
  processFilename(templateFilename: string, context: TemplateContext): string {
    // Remove .hbs extension if present
    let filename = templateFilename;
    if (filename.endsWith('.hbs')) {
      filename = filename.slice(0, -4);
    }

    // Process any template variables in filename (without appending newline)
    let result = this.processTemplate(filename, context);

    // Remove any trailing newlines/whitespace that might have been in the template
    result = result.trimEnd();

    return result;
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
   * Validate template syntax without processing
   */
  validateTemplate(templateString: string): { valid: boolean; error?: string } {
    try {
      this.handlebars.compile(templateString);
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
  extractVariables(templateString: string): string[] {
    const variables = new Set<string>();
    const variablePattern = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = variablePattern.exec(templateString)) !== null) {
      const expression = match[1].trim();
      // Extract the base variable name (before any dots or spaces)
      const varName = expression.split(/[\s.#/]/)[0];
      if (varName && !this.isHelper(varName)) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  /**
   * Check if a name is a registered helper
   */
  private isHelper(name: string): boolean {
    const helpers = [
      'if', 'unless', 'each', 'with', 'lookup', 'log',
      'uppercase', 'lowercase', 'capitalize', 'pascalCase', 'camelCase',
      'snakeCase', 'kebabCase', 'year', 'now', 'formatDate', 'eq', 'ne', 'gt', 'lt',
      'gte', 'lte', 'and', 'or', 'not', 'join', 'includes', 'length',
      'json', 'comment', 'indent', 'license', 'default', 'pluralize', 'singularize'
    ];
    return helpers.includes(name);
  }

  /**
   * Get the file extension for Handlebars templates
   */
  getExtension(): string {
    return '.hbs';
  }

  /**
   * Get the engine name
   */
  getName(): string {
    return 'handlebars';
  }

  /**
   * Build complete context object for Handlebars
   */
  private buildContext(context: TemplateContext): Record<string, unknown> {
    return {
      ...context.variables,
      ...context.computed,
      env: context.env,
    };
  }
}

/**
 * Create a Handlebars template engine instance
 */
export function createHandlebarsAdapter(): HandlebarsAdapter {
  return new HandlebarsAdapter();
}
