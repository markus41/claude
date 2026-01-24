/**
 * Python Bridge Adapter (Copier/Cookiecutter)
 *
 * @module engines/adapters/python-adapter
 * @status TO_BE_IMPLEMENTED
 */

import { BaseTemplateEngineAdapter } from '../base-adapter.js';
import type { EngineInfo, ValidationResult, HelperFunction, PythonBridgeConfig } from '../types.js';
import type { TemplateContext } from '../../types/scaffold.js';

/**
 * Python bridge adapter for native Copier/Cookiecutter execution
 * TODO: Implement Python subprocess execution
 */
export class PythonBridgeAdapter extends BaseTemplateEngineAdapter {
  constructor(config?: PythonBridgeConfig) {
    super(config);
  }

  processString(_template: string, _context: TemplateContext): string {
    throw new Error('PythonBridgeAdapter not yet implemented');
  }

  registerPartial(name: string, template: string): void {
    // Python templates don't use partials in the same way
    this.partials.set(name, template);
  }

  registerHelper(name: string, fn: HelperFunction): void {
    // Python templates use Jinja2 filters/functions
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
      type: 'python',
      name: 'Python Bridge (Copier/Cookiecutter)',
      version: '1.0.0',
      extensions: ['.copier', '.cookiecutter'],
      capabilities: {
        partials: false,
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
      description: 'Python bridge for native Copier/Cookiecutter execution',
      available: true,
    };
  }
}
