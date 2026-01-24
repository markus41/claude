/**
 * Template Engine Interface
 *
 * Defines the contract for template engine adapters (Handlebars, Nunjucks, etc.)
 */

import type { TemplateContext } from '../types.js';

/**
 * Template engine adapter interface
 */
export interface ITemplateEngine {
  /**
   * Process a template string with context
   * @param templateString - The template content
   * @param context - Template variables and environment
   * @returns Processed template output
   */
  processString(templateString: string, context: TemplateContext): string | Promise<string>;

  /**
   * Process a template file with context
   * @param templatePath - Path to the template file
   * @param context - Template variables and environment
   * @returns Processed template output
   */
  processFile(templatePath: string, context: TemplateContext): Promise<string>;

  /**
   * Process filename template (removes engine extension and processes variables)
   * @param templateFilename - Filename with template variables
   * @param context - Template variables and environment
   * @returns Processed filename
   */
  processFilename(templateFilename: string, context: TemplateContext): string;

  /**
   * Register a partial/include template
   * @param name - Partial identifier
   * @param template - Template content
   */
  registerPartial(name: string, template: string): void;

  /**
   * Load and register a partial from file
   * @param name - Partial identifier
   * @param path - Path to partial file
   */
  loadPartial(name: string, path: string): Promise<void>;

  /**
   * Validate template syntax without processing
   * @param templateString - Template content to validate
   * @returns Validation result
   */
  validateTemplate(templateString: string): { valid: boolean; error?: string };

  /**
   * Extract variables used in a template
   * @param templateString - Template content
   * @returns Array of variable names
   */
  extractVariables(templateString: string): string[];

  /**
   * Get the file extension for this engine's templates
   * @returns File extension (e.g., '.hbs', '.njk')
   */
  getExtension(): string;

  /**
   * Get the engine name
   * @returns Engine identifier (e.g., 'handlebars', 'nunjucks')
   */
  getName(): string;
}

/**
 * Template engine registry for managing multiple engines
 */
export class TemplateEngineRegistry {
  private engines: Map<string, ITemplateEngine> = new Map();
  private defaultEngine?: string;

  /**
   * Register a template engine
   */
  register(name: string, engine: ITemplateEngine, isDefault: boolean = false): void {
    this.engines.set(name, engine);
    if (isDefault || !this.defaultEngine) {
      this.defaultEngine = name;
    }
  }

  /**
   * Get engine by name
   */
  get(name: string): ITemplateEngine | undefined {
    return this.engines.get(name);
  }

  /**
   * Get default engine
   */
  getDefault(): ITemplateEngine {
    if (!this.defaultEngine || !this.engines.has(this.defaultEngine)) {
      throw new Error('No default template engine registered');
    }
    return this.engines.get(this.defaultEngine)!;
  }

  /**
   * Get engine by file extension
   */
  getByExtension(extension: string): ITemplateEngine | undefined {
    const normalizedExt = extension.startsWith('.') ? extension : `.${extension}`;
    for (const engine of this.engines.values()) {
      if (engine.getExtension() === normalizedExt) {
        return engine;
      }
    }
    return undefined;
  }

  /**
   * List all registered engines
   */
  list(): string[] {
    return Array.from(this.engines.keys());
  }

  /**
   * Check if an engine is registered
   */
  has(name: string): boolean {
    return this.engines.has(name);
  }
}
