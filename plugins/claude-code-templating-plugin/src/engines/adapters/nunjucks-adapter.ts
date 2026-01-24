/**
 * Nunjucks Template Engine Adapter
 *
 * @module engines/adapters/nunjucks-adapter
 * @status TO_BE_IMPLEMENTED
 */

import { BaseTemplateEngineAdapter } from '../base-adapter.js';
import type { EngineInfo, ValidationResult, HelperFunction, NunjucksConfig } from '../types.js';
import type { TemplateContext } from '../../types/scaffold.js';

/**
 * Nunjucks template engine adapter (Jinja2-compatible)
 * TODO: Implement for Copier/Cookiecutter compatibility
 */
export class NunjucksEngineAdapter extends BaseTemplateEngineAdapter {
  constructor(config?: NunjucksConfig) {
    super(config);
  }

  processString(_template: string, _context: TemplateContext): string {
    throw new Error('NunjucksEngineAdapter not yet implemented');
  }

  registerPartial(name: string, template: string): void {
    this.partials.set(name, template);
  }

  registerHelper(name: string, fn: HelperFunction): void {
    this.helpers.set(name, fn);
  }

  validateTemplate(_template: string): ValidationResult {
    throw new Error('Not implemented');
  }

  extractVariables(_template: string): string[] {
    return [];
  }

  getEngineInfo(): EngineInfo {
    return {
      type: 'nunjucks',
      name: 'Nunjucks',
      version: '3.2.4',
      extensions: ['.njk', '.nunjucks', '.j2', '.jinja2'],
      capabilities: {
        partials: true,
        helpers: false,
        inheritance: true,
        async: true,
        streaming: false,
        autoEscape: true,
        filters: true,
        macros: true,
        includes: true,
        layouts: true,
      },
      description: 'Nunjucks template engine (Jinja2-compatible)',
      available: true,
    };
  }
}
