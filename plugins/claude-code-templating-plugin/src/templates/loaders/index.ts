/**
 * Template Loaders
 *
 * Export all template loaders for different formats
 */

export { CookiecutterLoader, createCookiecutterLoader } from './cookiecutter-loader.js';
export { CopierLoader, createCopierLoader } from './copier-loader.js';
export { MavenArchetypeLoader, createMavenArchetypeLoader } from './maven-loader.js';
export { HarnessTemplateLoader, createHarnessTemplateLoader } from './harness-loader.js';

import type { ITemplateLoader, TemplateFormat } from '../../types/scaffold.js';
import { createCookiecutterLoader } from './cookiecutter-loader.js';
import { createCopierLoader } from './copier-loader.js';
import { createMavenArchetypeLoader } from './maven-loader.js';
import { createHarnessTemplateLoader } from './harness-loader.js';

/**
 * Get template loader for a specific format
 */
export function getLoaderForFormat(format: TemplateFormat): ITemplateLoader {
  switch (format) {
    case 'cookiecutter':
      return createCookiecutterLoader();
    case 'copier':
      return createCopierLoader();
    case 'maven-archetype':
      return createMavenArchetypeLoader();
    case 'harness':
      return createHarnessTemplateLoader();
    case 'handlebars':
      // TODO: Implement Handlebars loader
      throw new Error('Handlebars loader not yet implemented');
    case 'custom':
      throw new Error('Custom loader must be provided explicitly');
    default:
      throw new Error(`Unknown template format: ${format}`);
  }
}

/**
 * Get all available loaders
 */
export function getAllLoaders(): ITemplateLoader[] {
  return [
    createCookiecutterLoader(),
    createCopierLoader(),
    createMavenArchetypeLoader(),
    createHarnessTemplateLoader()
  ];
}

/**
 * Auto-detect template format from source
 */
export async function detectTemplateFormat(source: string): Promise<TemplateFormat | null> {
  const loaders = getAllLoaders();

  for (const loader of loaders) {
    if (await loader.canHandle(source)) {
      return loader.format;
    }
  }

  return null;
}
