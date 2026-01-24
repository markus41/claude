/**
 * Base Template Engine Adapter
 *
 * Abstract base class providing common functionality for all template engine adapters.
 * Implements shared behavior like context building, filename processing, helper management,
 * and statistics tracking.
 *
 * @module engines/base-adapter
 */

import { readFile } from 'fs/promises';
import type {
  ITemplateEngine,
  EngineInfo,
  EngineConfig,
  ValidationResult,
  HelperFunction,
  EngineStats,
  EngineLifecycleHooks,
} from './types.js';
import type { TemplateContext } from '../types/scaffold.js';

/**
 * Abstract base class for template engine adapters
 *
 * Provides common functionality:
 * - Context building with environment variables
 * - Helper/partial registration tracking
 * - Statistics collection
 * - Lifecycle hook management
 * - Error handling
 * - Filename processing utilities
 */
export abstract class BaseTemplateEngineAdapter implements ITemplateEngine {
  protected config: EngineConfig;
  protected helpers: Map<string, HelperFunction>;
  protected partials: Map<string, string>;
  protected stats: EngineStats;
  protected hooks: EngineLifecycleHooks;
  protected initialized: boolean;

  /**
   * Create a new template engine adapter
   * @param config - Engine configuration
   * @param hooks - Lifecycle hooks
   */
  constructor(config: EngineConfig = {}, hooks: EngineLifecycleHooks = {}) {
    this.config = {
      autoEscape: true,
      strict: false,
      cache: true,
      ...config,
    };
    this.helpers = new Map();
    this.partials = new Map();
    this.hooks = hooks;
    this.initialized = false;
    this.stats = {
      templatesProcessed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      errors: 0,
      warnings: 0,
    };
  }

  /**
   * Initialize the engine (called lazily on first use)
   * Subclasses can override to perform initialization
   */
  protected async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.hooks.onInit?.(this);
    this.initialized = true;
  }

  /**
   * Process a template string with context
   */
  abstract processString(template: string, context: TemplateContext): string;

  /**
   * Process a template file with context
   */
  async processFile(path: string, context: TemplateContext): Promise<string> {
    await this.initialize();

    const startTime = Date.now();

    try {
      await this.hooks.beforeProcess?.(path, context);

      const templateContent = await readFile(path, 'utf-8');
      let result = this.processString(templateContent, context);

      result = await this.hooks.afterProcess?.(result, templateContent, context) || result;

      // Track statistics
      const duration = Date.now() - startTime;
      this.updateStats(duration);

      return result;
    } catch (error) {
      this.stats.errors++;
      await this.hooks.onError?.(error as Error, path, context);

      if (error instanceof Error && error.message === 'SKIP_FILE') {
        throw error;
      }

      throw new Error(
        `Failed to process template file ${path}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process filename template
   * Removes template extensions and processes variables
   */
  processFilename(filename: string, context: TemplateContext): string {
    // Remove template extensions
    let processedFilename = this.removeTemplateExtension(filename);

    // Process any template variables in filename
    try {
      return this.processString(processedFilename, context).trimEnd();
    } catch (error) {
      throw new Error(
        `Failed to process filename ${filename}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove template extension from filename
   */
  protected removeTemplateExtension(filename: string): string {
    const engineInfo = this.getEngineInfo();
    const extensions = [...engineInfo.extensions, '.template'];

    for (const ext of extensions) {
      if (filename.endsWith(ext)) {
        return filename.slice(0, -ext.length);
      }
    }

    return filename;
  }

  /**
   * Register a partial template
   */
  abstract registerPartial(name: string, template: string): void;

  /**
   * Register a helper function
   */
  abstract registerHelper(name: string, fn: HelperFunction): void;

  /**
   * Validate template syntax
   */
  abstract validateTemplate(template: string): ValidationResult;

  /**
   * Extract variable names from template
   */
  abstract extractVariables(template: string): string[];

  /**
   * Get engine information
   */
  abstract getEngineInfo(): EngineInfo;

  /**
   * Build complete context object from TemplateContext
   * Merges variables, computed values, and environment
   */
  protected buildContext(context: TemplateContext): Record<string, unknown> {
    const now = new Date();

    // Ensure env context exists with defaults
    const env = context.env || {
      cwd: process.cwd(),
      user: process.env.USER || process.env.USERNAME || 'unknown',
      timestamp: now.toISOString(),
      date: now.toLocaleDateString(),
      platform: process.platform,
    };

    // Merge all context sources
    return {
      ...context.variables,
      ...context.computed,
      env,
    };
  }

  /**
   * Create a default template context
   */
  protected createDefaultContext(
    variables: Record<string, unknown> = {}
  ): TemplateContext {
    const now = new Date();

    return {
      variables,
      computed: {
        timestamp: now.toISOString(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        year: now.getFullYear(),
      },
      env: {
        cwd: process.cwd(),
        user: process.env.USER || process.env.USERNAME || 'unknown',
        timestamp: now.toISOString(),
        date: now.toLocaleDateString(),
        platform: process.platform,
      },
    };
  }

  /**
   * Update engine statistics
   */
  protected updateStats(durationMs: number): void {
    this.stats.templatesProcessed++;
    this.stats.totalProcessingTime += durationMs;
    this.stats.averageProcessingTime =
      this.stats.totalProcessingTime / this.stats.templatesProcessed;
  }

  /**
   * Get engine statistics
   */
  public getStats(): EngineStats {
    return { ...this.stats };
  }

  /**
   * Reset engine statistics
   */
  public resetStats(): void {
    this.stats = {
      templatesProcessed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      errors: 0,
      warnings: 0,
    };
  }

  /**
   * Dispose of engine resources
   */
  async dispose(): Promise<void> {
    await this.hooks.onDispose?.(this);
    this.helpers.clear();
    this.partials.clear();
    this.initialized = false;
  }

  /**
   * Register standard helpers common to all engines
   * Subclasses should call this and add engine-specific helpers
   */
  protected registerStandardHelpers(): void {
    // String manipulation
    this.registerHelper('uppercase', (str: string) => str.toUpperCase());
    this.registerHelper('lowercase', (str: string) => str.toLowerCase());
    this.registerHelper('capitalize', (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1)
    );
    this.registerHelper('trim', (str: string) => str.trim());

    // Case conversions
    this.registerHelper('pascalCase', (str: string) =>
      str.replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase()).replace(/[-_]/g, '')
    );
    this.registerHelper('camelCase', (str: string) => {
      const pascal = str
        .replace(/(^|[-_])([a-z])/g, (_, __, c) => c.toUpperCase())
        .replace(/[-_]/g, '');
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });
    this.registerHelper('snakeCase', (str: string) =>
      str.replace(/[-\s]/g, '_').toLowerCase()
    );
    this.registerHelper('kebabCase', (str: string) =>
      str.replace(/[_\s]/g, '-').toLowerCase()
    );
    this.registerHelper('dotCase', (str: string) =>
      str.replace(/[-_\s]/g, '.').toLowerCase()
    );

    // Date/time
    this.registerHelper('year', () => new Date().getFullYear());
    this.registerHelper('date', (format?: string) => {
      const now = new Date();
      if (format === 'iso') return now.toISOString();
      if (format === 'short') return now.toLocaleDateString();
      if (format === 'long') return now.toLocaleString();
      return now.toISOString().split('T')[0];
    });
    this.registerHelper('timestamp', () => Date.now());

    // Utilities
    this.registerHelper('default', (value: unknown, defaultValue: unknown) =>
      value !== undefined && value !== null && value !== '' ? value : defaultValue
    );
    this.registerHelper('replace', (str: string, search: string, replace: string) =>
      str.replace(new RegExp(search, 'g'), replace)
    );

    // UUID generation
    this.registerHelper('uuid', () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
    );

    // License helper
    this.registerHelper('license', (type: string, year?: number, author?: string) => {
      const y = year || new Date().getFullYear();
      const a = author || 'Author';
      const licenses: Record<string, string> = {
        MIT: `MIT License - Copyright (c) ${y} ${a}`,
        'Apache-2.0': `Apache License 2.0 - Copyright (c) ${y} ${a}`,
        'GPL-3.0': `GNU General Public License v3.0 - Copyright (c) ${y} ${a}`,
        ISC: `ISC License - Copyright (c) ${y} ${a}`,
        'BSD-3-Clause': `BSD 3-Clause License - Copyright (c) ${y} ${a}`,
      };
      return licenses[type] || type;
    });
  }

  /**
   * Check if a variable name is a registered helper
   */
  protected isHelper(name: string): boolean {
    return this.helpers.has(name);
  }

  /**
   * Check if a partial is registered
   */
  protected hasPartial(name: string): boolean {
    return this.partials.has(name);
  }

  /**
   * Get all registered helper names
   */
  protected getHelperNames(): string[] {
    return Array.from(this.helpers.keys());
  }

  /**
   * Get all registered partial names
   */
  protected getPartialNames(): string[] {
    return Array.from(this.partials.keys());
  }

  /**
   * Ensure output ends with exactly one newline
   */
  protected normalizeOutput(output: string): string {
    return output.replace(/[\r\n]*$/, '') + '\n';
  }

  /**
   * Handle template processing errors consistently
   */
  protected handleProcessingError(error: unknown): never {
    if (error instanceof Error && error.message === 'SKIP_FILE') {
      throw error;
    }

    throw new Error(
      `Template processing failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
