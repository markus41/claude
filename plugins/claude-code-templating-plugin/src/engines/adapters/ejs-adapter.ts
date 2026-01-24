/**
 * EJS Template Engine Adapter
 *
 * @module engines/adapters/ejs-adapter
 * @status TO_BE_IMPLEMENTED
 */

import { BaseTemplateEngineAdapter } from '../base-adapter.js';
import type { EngineInfo, ValidationResult, HelperFunction, EJSConfig } from '../types.js';
import type { TemplateContext } from '../../types/scaffold.js';

/**
 * EJS template engine adapter
 * TODO: Implement for JavaScript-native templating
 */
export class EJSEngineAdapter extends BaseTemplateEngineAdapter {
  constructor(config?: EJSConfig) {
    super(config);
  }

  processString(_template: string, _context: TemplateContext): string {
    throw new Error('EJSEngineAdapter not yet implemented');
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
      type: 'ejs',
      name: 'EJS',
      version: '3.x',
      extensions: ['.ejs'],
      capabilities: {
        partials: true,
        helpers: false,
        inheritance: false,
        async: false,
        streaming: false,
        autoEscape: true,
        filters: false,
        macros: false,
        includes: true,
        layouts: false,
      },
      description: 'EJS embedded JavaScript templates',
      available: true,
    };
  }
}
