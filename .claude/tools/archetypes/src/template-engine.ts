/**
 * Template Engine - Handles template processing and variable substitution
 *
 * Multi-engine support:
 * - Handlebars (default) - Simple templating with helpers
 * - Nunjucks - Advanced templating with inheritance and macros
 *
 * Features:
 * - Variable substitution
 * - Conditional sections
 * - Loops and iteration
 * - Custom helpers/filters for common patterns
 * - Partial/include support
 * - Template inheritance (Nunjucks)
 * - Macros (Nunjucks)
 */

import type { TemplateContext } from './types.js';
import { createTemplateEngine as createEngine } from './engines/index.js';
import type { ITemplateEngine } from './engines/ITemplateEngine.js';

export class TemplateEngine {
  private engine: ITemplateEngine;

  constructor(engineName: 'handlebars' | 'nunjucks' = 'handlebars') {
    this.engine = createEngine(engineName);
  }

  /**
   * Get the underlying engine instance
   */
  getEngine(): ITemplateEngine {
    return this.engine;
  }

  /**
   * Set the engine to use
   */
  setEngine(engineName: 'handlebars' | 'nunjucks'): void {
    this.engine = createEngine(engineName);
  }

  /**
   * Process a template string with context
   * Ensures output always ends with exactly one newline (for file content)
   */
  processString(templateString: string, context: TemplateContext): string {
    return this.engine.processString(templateString, context) as string;
  }

  /**
   * Process a template file with context
   */
  async processFile(templatePath: string, context: TemplateContext): Promise<string> {
    return await this.engine.processFile(templatePath, context);
  }

  /**
   * Process filename template (removes engine extension and processes variables)
   * Note: Filenames should never contain newline characters
   */
  processFilename(templateFilename: string, context: TemplateContext): string {
    return this.engine.processFilename(templateFilename, context);
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, template: string): void {
    this.engine.registerPartial(name, template);
  }

  /**
   * Load and register a partial from file
   */
  async loadPartial(name: string, path: string): Promise<void> {
    await this.engine.loadPartial(name, path);
  }

  /**
   * Validate template syntax without processing
   */
  validateTemplate(templateString: string): { valid: boolean; error?: string } {
    return this.engine.validateTemplate(templateString);
  }

  /**
   * Extract variables used in a template
   */
  extractVariables(templateString: string): string[] {
    return this.engine.extractVariables(templateString);
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
        date: now.toLocaleDateString()
      }
    };
  }
}

/**
 * Create a template engine instance with specified engine
 */
export function createTemplateEngine(engineName: 'handlebars' | 'nunjucks' = 'handlebars'): TemplateEngine {
  return new TemplateEngine(engineName);
}

/**
 * Auto-detect engine from file extension and create appropriate engine
 */
export function createEngineForFile(filename: string): TemplateEngine {
  if (filename.endsWith('.njk')) {
    return new TemplateEngine('nunjucks');
  }
  return new TemplateEngine('handlebars');
}
