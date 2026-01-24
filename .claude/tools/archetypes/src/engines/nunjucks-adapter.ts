/**
 * Nunjucks Template Engine Adapter
 *
 * Provides Nunjucks templating with:
 * - Template inheritance (extends, block)
 * - Macros for reusable components
 * - Custom filters (equivalent to Handlebars helpers)
 * - Async template loading
 * - Code-friendly escaping (not HTML-focused)
 */

import nunjucks from 'nunjucks';
import { readFile } from 'fs/promises';
import { dirname } from 'path';
import type { ITemplateEngine } from './ITemplateEngine.js';
import type { TemplateContext } from '../types.js';

/**
 * Custom Nunjucks loader that loads templates from memory
 */
class MemoryLoader extends nunjucks.Loader {
  async = false;

  constructor(private templates: Map<string, string>) {
    super();
  }

  getSource(name: string): nunjucks.LoaderSource {
    if (this.templates.has(name)) {
      return {
        src: this.templates.get(name)!,
        path: name,
        noCache: false,
      };
    }
    throw new Error(`Template not found: ${name}`);
  }
}

export class NunjucksAdapter implements ITemplateEngine {
  private env: nunjucks.Environment;
  private partials: Map<string, string> = new Map();
  private loader: MemoryLoader;

  constructor() {
    // Create memory loader for partials/templates
    this.loader = new MemoryLoader(this.partials);

    // Create environment with memory loader
    this.env = new nunjucks.Environment(this.loader, {
      autoescape: false, // Don't HTML-escape for code generation
      trimBlocks: true,
      lstripBlocks: true,
      throwOnUndefined: false,
    });

    this.registerFilters();
    this.registerGlobals();
  }

  /**
   * Register all custom filters (equivalent to Handlebars helpers)
   */
  private registerFilters(): void {
    // String manipulation filters
    this.env.addFilter('pascalCase', (str: string) => {
      if (!str) return '';
      return str.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
    });

    this.env.addFilter('camelCase', (str: string) => {
      if (!str) return '';
      const pascal = str.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    this.env.addFilter('kebabCase', (str: string) => {
      if (!str) return '';
      return str.replace(/_/g, '-').toLowerCase();
    });

    this.env.addFilter('snakeCase', (str: string) => {
      if (!str) return '';
      return str.replace(/-/g, '_').toLowerCase();
    });

    this.env.addFilter('uppercase', (str: string) => {
      if (!str) return '';
      return str.toUpperCase();
    });

    this.env.addFilter('lowercase', (str: string) => {
      if (!str) return '';
      return str.toLowerCase();
    });

    this.env.addFilter('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Comparison filters (return boolean for use in if statements)
    this.env.addFilter('eq', (a: unknown, b: unknown) => a === b);
    this.env.addFilter('ne', (a: unknown, b: unknown) => a !== b);
    this.env.addFilter('gt', (a: number, b: number) => a > b);
    this.env.addFilter('lt', (a: number, b: number) => a < b);
    this.env.addFilter('gte', (a: number, b: number) => a >= b);
    this.env.addFilter('lte', (a: number, b: number) => a <= b);

    // Logical filters
    this.env.addFilter('and', (...args: unknown[]) => {
      // Nunjucks passes all arguments including context
      const values = args.slice(0, -1);
      return values.every(Boolean);
    });

    this.env.addFilter('or', (...args: unknown[]) => {
      const values = args.slice(0, -1);
      return values.some(Boolean);
    });

    this.env.addFilter('not', (value: unknown) => !value);

    // Array filters
    this.env.addFilter('includes', (arr: unknown[], value: unknown) => {
      return Array.isArray(arr) ? arr.includes(value) : false;
    });

    // JSON filter
    this.env.addFilter('json', (obj: unknown, indent?: number) => {
      return JSON.stringify(obj, null, indent || 2);
    });

    // Default filter (provide fallback value)
    this.env.addFilter('default', (value: unknown, defaultValue: unknown) => {
      return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });

    // Pluralize filter (simple English pluralization)
    this.env.addFilter('pluralize', (word: string, count?: number) => {
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

    // Singularize filter (simple English singularization)
    this.env.addFilter('singularize', (word: string) => {
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

    // Date/time filters
    this.env.addFilter('now', (format?: string) => {
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

    this.env.addFilter('formatDate', (date: Date | string, format?: string) => {
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
  }

  /**
   * Register global functions and values
   */
  private registerGlobals(): void {
    // Make date helpers available as globals too
    this.env.addGlobal('year', new Date().getFullYear());
    this.env.addGlobal('now', () => new Date().toISOString());
    this.env.addGlobal('date', () => new Date().toLocaleDateString());
  }

  /**
   * Process a template string with context
   */
  processString(templateString: string, context: TemplateContext): string {
    try {
      const template = nunjucks.compile(templateString, this.env);
      let result = template.render(this.buildContext(context));

      // Ensure output ends with exactly one newline
      result = result.replace(/[\r\n]*$/, '') + '\n';

      return result;
    } catch (error) {
      throw new Error(`Nunjucks template processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process a template file with context
   */
  async processFile(templatePath: string, context: TemplateContext): Promise<string> {
    try {
      const templateContent = await readFile(templatePath, 'utf-8');

      // Create a new environment for this file with path-based loader
      const fileEnv = new nunjucks.Environment(
        new nunjucks.FileSystemLoader(dirname(templatePath)),
        {
          autoescape: false,
          trimBlocks: true,
          lstripBlocks: true,
          throwOnUndefined: false,
        }
      );

      // Copy filters and globals to file environment
      this.copyFiltersAndGlobals(fileEnv);

      const result = fileEnv.renderString(templateContent, this.buildContext(context));

      // Ensure output ends with exactly one newline
      return result.replace(/[\r\n]*$/, '') + '\n';
    } catch (error) {
      throw new Error(`Failed to process template file ${templatePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Copy filters and globals to another environment
   */
  private copyFiltersAndGlobals(targetEnv: nunjucks.Environment): void {
    // Re-register all filters
    const filters = [
      'pascalCase', 'camelCase', 'kebabCase', 'snakeCase',
      'uppercase', 'lowercase', 'capitalize',
      'eq', 'ne', 'gt', 'lt', 'gte', 'lte',
      'and', 'or', 'not',
      'includes', 'json', 'default',
      'pluralize', 'singularize',
      'now', 'formatDate'
    ];

    filters.forEach(name => {
      const filter = this.env.getFilter(name);
      if (filter) {
        targetEnv.addFilter(name, filter);
      }
    });

    // Re-register globals
    targetEnv.addGlobal('year', new Date().getFullYear());
    targetEnv.addGlobal('now', () => new Date().toISOString());
    targetEnv.addGlobal('date', () => new Date().toLocaleDateString());
  }

  /**
   * Process filename template (removes .njk extension and processes variables)
   */
  processFilename(templateFilename: string, context: TemplateContext): string {
    // Remove .njk extension if present
    let filename = templateFilename;
    if (filename.endsWith('.njk')) {
      filename = filename.slice(0, -4);
    }

    try {
      const template = nunjucks.compile(filename, this.env);
      let result = template.render(this.buildContext(context));

      // Remove any trailing newlines/whitespace
      result = result.trimEnd();

      return result;
    } catch (error) {
      throw new Error(`Failed to process filename template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Register a partial template (for extends/include)
   */
  registerPartial(name: string, template: string): void {
    this.partials.set(name, template);
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
      nunjucks.compile(templateString, this.env);
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

    // Match Nunjucks variable syntax: {{ variable }}
    const variablePattern = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g;
    let match;

    while ((match = variablePattern.exec(templateString)) !== null) {
      const varPath = match[1].trim();
      // Get the root variable name (before any dots)
      const rootVar = varPath.split('.')[0];
      if (rootVar && !this.isBuiltIn(rootVar)) {
        variables.add(rootVar);
      }
    }

    // Also match {% set %} statements
    const setPattern = /\{%\s*set\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((match = setPattern.exec(templateString)) !== null) {
      const varName = match[1].trim();
      if (!this.isBuiltIn(varName)) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }

  /**
   * Check if a name is a built-in Nunjucks feature
   */
  private isBuiltIn(name: string): boolean {
    const builtIns = [
      'loop', 'super', 'caller', 'joiner',
      'year', 'now', 'date', 'env', 'computed', 'variables',
      'range', 'cycler', 'dict'
    ];
    return builtIns.includes(name);
  }

  /**
   * Get the file extension for Nunjucks templates
   */
  getExtension(): string {
    return '.njk';
  }

  /**
   * Get the engine name
   */
  getName(): string {
    return 'nunjucks';
  }

  /**
   * Build complete context object for Nunjucks
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
 * Create a Nunjucks template engine instance
 */
export function createNunjucksAdapter(): NunjucksAdapter {
  return new NunjucksAdapter();
}
