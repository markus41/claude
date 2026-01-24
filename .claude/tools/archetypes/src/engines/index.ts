/**
 * Template Engine Module
 *
 * Provides a multi-engine templating system with support for:
 * - Handlebars (default) - Simple templating with helpers
 * - Nunjucks - Advanced templating with inheritance and macros
 *
 * Usage:
 * ```typescript
 * import { createTemplateEngine } from './engines';
 *
 * const engine = createTemplateEngine('nunjucks');
 * const result = await engine.processString('Hello {{ name }}!', context);
 * ```
 */

export { ITemplateEngine, TemplateEngineRegistry } from './ITemplateEngine.js';
export { HandlebarsAdapter, createHandlebarsAdapter } from './handlebars-adapter.js';
export { NunjucksAdapter, createNunjucksAdapter } from './nunjucks-adapter.js';

import { TemplateEngineRegistry } from './ITemplateEngine.js';
import { createHandlebarsAdapter } from './handlebars-adapter.js';
import { createNunjucksAdapter } from './nunjucks-adapter.js';
import type { ITemplateEngine } from './ITemplateEngine.js';

/**
 * Global template engine registry
 */
let globalRegistry: TemplateEngineRegistry | undefined;

/**
 * Get or create the global template engine registry
 */
export function getRegistry(): TemplateEngineRegistry {
  if (!globalRegistry) {
    globalRegistry = new TemplateEngineRegistry();

    // Register default engines
    globalRegistry.register('handlebars', createHandlebarsAdapter(), true);
    globalRegistry.register('nunjucks', createNunjucksAdapter());
  }
  return globalRegistry;
}

/**
 * Create a template engine by name
 */
export function createTemplateEngine(name: 'handlebars' | 'nunjucks' = 'handlebars'): ITemplateEngine {
  const registry = getRegistry();
  const engine = registry.get(name);

  if (!engine) {
    throw new Error(`Template engine '${name}' not found`);
  }

  return engine;
}

/**
 * Get template engine by file extension
 */
export function getEngineByExtension(extension: string): ITemplateEngine | undefined {
  const registry = getRegistry();
  return registry.getByExtension(extension);
}

/**
 * Reset the global registry (useful for testing)
 */
export function resetRegistry(): void {
  globalRegistry = undefined;
}
