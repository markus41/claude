/**
 * Database-backed Template Registry
 *
 * Replaces the file-based registry with PostgreSQL storage and Redis caching.
 * Provides the same interface (ITemplateRegistry) for seamless migration.
 *
 * @version 2.0.0
 * @author Brookside BI
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type {
  ITemplateRegistry,
  TemplateRegistryEntry,
  TemplateListOptions,
  TemplateSearchOptions
} from '../types/template.js';
import {
  isDatabaseEnabled,
  getPrisma,
  getTemplate as dbGetTemplate,
  listTemplates as dbListTemplates,
  searchTemplates as dbSearchTemplates,
  upsertTemplate,
  deleteTemplate as dbDeleteTemplate,
  importLegacyTemplates,
  Template,
  TemplateFormat,
  TemplateSourceType,
} from '../../lib/database.js';
import {
  isCacheEnabled,
  getCachedTemplate,
  cacheTemplate,
  getCachedTemplateList,
  cacheTemplateList,
  getCachedSearch,
  cacheSearchResults,
  invalidateTemplate,
  clearAllCaches,
} from '../../lib/redis.js';

/**
 * Database-backed Template Registry
 *
 * Features:
 * - PostgreSQL storage for durability
 * - Redis caching for performance
 * - Automatic migration from file-based cache
 * - Fallback to file-based mode if database unavailable
 */
export class DatabaseTemplateRegistry implements ITemplateRegistry {
  private initialized = false;
  private useFallback = false;
  private legacyCachePath: string;

  constructor() {
    this.legacyCachePath = join(homedir(), '.claude', 'template-cache', 'registry.json');
  }

  /**
   * Initialize the registry
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!isDatabaseEnabled()) {
      console.log('[TemplateRegistry] Database disabled, using fallback mode');
      this.useFallback = true;
      this.initialized = true;
      return;
    }

    try {
      // Test database connection
      const prisma = getPrisma();
      await prisma.$queryRaw`SELECT 1`;

      // Check if we need to migrate from legacy cache
      await this.migrateFromLegacyCache();

      // Seed default templates if database is empty
      await this.seedDefaultTemplates();

      this.initialized = true;
      console.log('[TemplateRegistry] Initialized with database backend');
    } catch (error) {
      console.warn('[TemplateRegistry] Database unavailable, using fallback mode:', error);
      this.useFallback = true;
      this.initialized = true;
    }
  }

  /**
   * List all templates
   */
  async list(options: TemplateListOptions = {}): Promise<TemplateRegistryEntry[]> {
    await this.ensureInitialized();

    if (this.useFallback) {
      return this.listFromLegacyCache(options);
    }

    // Check cache first
    const cacheKey = {
      format: options.format,
      category: options.category,
      tags: options.tags,
    };

    const cached = await getCachedTemplateList(cacheKey);
    if (cached) {
      return this.applyPagination(
        cached.map(this.mapTemplateToEntry),
        options
      );
    }

    // Query database
    const templates = await dbListTemplates({
      format: options.format ? this.mapFormatFromString(options.format) : undefined,
      category: options.category,
      tags: options.tags,
      orderBy: options.sortBy === 'updatedAt' ? 'updatedAt' : options.sortBy,
      order: options.sortOrder,
      limit: 100, // Get more for caching
    });

    // Cache results
    await cacheTemplateList(templates, cacheKey);

    // Apply pagination and return
    return this.applyPagination(
      templates.map(this.mapTemplateToEntry),
      options
    );
  }

  /**
   * Search templates
   */
  async search(query: string, options: TemplateSearchOptions = {}): Promise<TemplateRegistryEntry[]> {
    await this.ensureInitialized();

    if (this.useFallback) {
      return this.searchFromLegacyCache(query, options);
    }

    // Check cache first
    const cacheOpts = {
      format: options.format,
      category: options.category,
    };

    const cached = await getCachedSearch(query, cacheOpts);
    if (cached) {
      return this.applyPagination(
        cached.map(this.mapTemplateToEntry),
        options
      );
    }

    // Query database
    const templates = await dbSearchTemplates(query, {
      format: options.format ? this.mapFormatFromString(options.format) : undefined,
      category: options.category,
      limit: options.limit || 50,
    });

    // Cache results
    await cacheSearchResults(query, templates, cacheOpts);

    return templates.map(this.mapTemplateToEntry);
  }

  /**
   * Get template by name
   */
  async get(name: string, version?: string): Promise<TemplateRegistryEntry | null> {
    await this.ensureInitialized();

    if (this.useFallback) {
      return this.getFromLegacyCache(name, version);
    }

    // Check cache first
    const cached = await getCachedTemplate(name, version);
    if (cached) {
      return this.mapTemplateToEntry(cached);
    }

    // Query database
    const template = await dbGetTemplate(name, version);
    if (!template) return null;

    // Cache result
    await cacheTemplate(template, !version);

    return this.mapTemplateToEntry(template);
  }

  /**
   * Register a template
   */
  async register(entry: TemplateRegistryEntry): Promise<void> {
    await this.ensureInitialized();

    if (this.useFallback) {
      // In fallback mode, we can't persist to database
      console.warn('[TemplateRegistry] Cannot register in fallback mode');
      return;
    }

    await upsertTemplate({
      name: entry.name,
      version: entry.version,
      description: entry.description,
      format: this.mapFormatFromString(entry.format),
      sourceType: this.mapSourceTypeFromString(entry.source.type),
      sourceLocation: entry.source.location,
      category: entry.category,
      tags: entry.tags || [],
      author: entry.author,
      isPublic: true,
    });

    // Invalidate cache
    await invalidateTemplate(entry.name, entry.version);
  }

  /**
   * Unregister a template
   */
  async unregister(name: string): Promise<void> {
    await this.ensureInitialized();

    if (this.useFallback) {
      console.warn('[TemplateRegistry] Cannot unregister in fallback mode');
      return;
    }

    await dbDeleteTemplate(name);
    await invalidateTemplate(name);
  }

  /**
   * Refresh registry cache
   */
  async refresh(): Promise<void> {
    await clearAllCaches();

    if (!this.useFallback) {
      // Re-seed default templates
      await this.seedDefaultTemplates();
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Migrate from legacy file-based cache
   */
  private async migrateFromLegacyCache(): Promise<void> {
    try {
      await access(this.legacyCachePath);
      const content = await readFile(this.legacyCachePath, 'utf-8');
      const cache = JSON.parse(content);

      if (cache.entries && Array.isArray(cache.entries)) {
        const result = await importLegacyTemplates(cache.entries);
        console.log(`[TemplateRegistry] Migrated ${result.imported} templates from legacy cache`);

        if (result.errors.length > 0) {
          console.warn('[TemplateRegistry] Migration errors:', result.errors);
        }
      }
    } catch {
      // No legacy cache to migrate
    }
  }

  /**
   * Seed default templates if database is empty
   */
  private async seedDefaultTemplates(): Promise<void> {
    const prisma = getPrisma();
    const count = await prisma.template.count();

    if (count > 0) return;

    const defaultTemplates = this.getDefaultTemplates();
    const result = await importLegacyTemplates(defaultTemplates);
    console.log(`[TemplateRegistry] Seeded ${result.imported} default templates`);
  }

  /**
   * Get default templates
   */
  private getDefaultTemplates() {
    return [
      {
        name: 'fastapi-microservice',
        version: '1.0.0',
        description: 'FastAPI microservice with PostgreSQL, Redis, and async support',
        format: 'cookiecutter',
        source: { type: 'github', location: 'tiangolo/cookiecutter-fastapi' },
        category: 'microservice',
        tags: ['python', 'fastapi', 'microservice', 'api', 'postgres'],
        author: 'Tiangolo',
      },
      {
        name: 'express-api',
        version: '1.0.0',
        description: 'Express.js REST API with TypeScript',
        format: 'cookiecutter',
        source: { type: 'github', location: 'express-typescript-template' },
        category: 'api',
        tags: ['nodejs', 'express', 'typescript', 'api'],
      },
      {
        name: 'react-app',
        version: '1.0.0',
        description: 'React application with TypeScript and Vite',
        format: 'cookiecutter',
        source: { type: 'github', location: 'react-vite-template' },
        category: 'webapp',
        tags: ['react', 'typescript', 'vite', 'frontend'],
      },
      {
        name: 'harness-ci-pipeline',
        version: '1.0.0',
        description: 'Harness CI pipeline template with build and test stages',
        format: 'harness',
        source: { type: 'embedded', location: 'templates/harness/ci-pipeline' },
        category: 'pipeline',
        tags: ['harness', 'ci', 'pipeline', 'build'],
        author: 'Harness',
      },
      {
        name: 'harness-cd-pipeline',
        version: '1.0.0',
        description: 'Harness CD pipeline template with deployment stages',
        format: 'harness',
        source: { type: 'embedded', location: 'templates/harness/cd-pipeline' },
        category: 'pipeline',
        tags: ['harness', 'cd', 'pipeline', 'deployment'],
        author: 'Harness',
      },
    ];
  }

  /**
   * Map Template to TemplateRegistryEntry
   */
  private mapTemplateToEntry = (template: Template): TemplateRegistryEntry => {
    return {
      name: template.name,
      version: template.version,
      description: template.description || undefined,
      format: this.mapFormatToString(template.format),
      source: {
        type: this.mapSourceTypeToString(template.sourceType),
        location: template.sourceLocation || '',
      },
      category: template.category || undefined,
      tags: template.tags || [],
      author: template.author || undefined,
      downloads: template.downloads,
      stars: template.stars,
      updatedAt: template.updatedAt.toISOString(),
    };
  };

  /**
   * Map format string to enum
   */
  private mapFormatFromString(format: string): TemplateFormat {
    const mapping: Record<string, TemplateFormat> = {
      'handlebars': TemplateFormat.HANDLEBARS,
      'cookiecutter': TemplateFormat.COOKIECUTTER,
      'copier': TemplateFormat.COPIER,
      'maven-archetype': TemplateFormat.MAVEN_ARCHETYPE,
      'harness': TemplateFormat.HARNESS,
    };
    return mapping[format.toLowerCase()] || TemplateFormat.HANDLEBARS;
  }

  /**
   * Map format enum to string
   */
  private mapFormatToString(format: TemplateFormat): string {
    const mapping: Record<TemplateFormat, string> = {
      [TemplateFormat.HANDLEBARS]: 'handlebars',
      [TemplateFormat.COOKIECUTTER]: 'cookiecutter',
      [TemplateFormat.COPIER]: 'copier',
      [TemplateFormat.MAVEN_ARCHETYPE]: 'maven-archetype',
      [TemplateFormat.HARNESS]: 'harness',
    };
    return mapping[format] || 'handlebars';
  }

  /**
   * Map source type string to enum
   */
  private mapSourceTypeFromString(sourceType: string): TemplateSourceType {
    const mapping: Record<string, TemplateSourceType> = {
      'embedded': TemplateSourceType.EMBEDDED,
      'local': TemplateSourceType.LOCAL,
      'github': TemplateSourceType.GITHUB,
      'npm': TemplateSourceType.NPM,
      'url': TemplateSourceType.URL,
    };
    return mapping[sourceType.toLowerCase()] || TemplateSourceType.EMBEDDED;
  }

  /**
   * Map source type enum to string
   */
  private mapSourceTypeToString(sourceType: TemplateSourceType): string {
    const mapping: Record<TemplateSourceType, string> = {
      [TemplateSourceType.EMBEDDED]: 'embedded',
      [TemplateSourceType.LOCAL]: 'local',
      [TemplateSourceType.GITHUB]: 'github',
      [TemplateSourceType.NPM]: 'npm',
      [TemplateSourceType.URL]: 'url',
    };
    return mapping[sourceType] || 'embedded';
  }

  /**
   * Apply pagination to results
   */
  private applyPagination(
    entries: TemplateRegistryEntry[],
    options: TemplateListOptions
  ): TemplateRegistryEntry[] {
    let result = [...entries];

    if (options.offset !== undefined) {
      result = result.slice(options.offset);
    }

    if (options.limit !== undefined) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  // ========================================================================
  // FALLBACK METHODS (Legacy file-based)
  // ========================================================================

  private async listFromLegacyCache(options: TemplateListOptions): Promise<TemplateRegistryEntry[]> {
    try {
      const content = await readFile(this.legacyCachePath, 'utf-8');
      const cache = JSON.parse(content);
      let entries = cache.entries || [];

      if (options.format) {
        entries = entries.filter((e: TemplateRegistryEntry) => e.format === options.format);
      }

      if (options.category) {
        entries = entries.filter((e: TemplateRegistryEntry) => e.category === options.category);
      }

      return this.applyPagination(entries, options);
    } catch {
      return [];
    }
  }

  private async searchFromLegacyCache(query: string, options: TemplateSearchOptions): Promise<TemplateRegistryEntry[]> {
    const entries = await this.listFromLegacyCache(options);
    const searchLower = query.toLowerCase();

    return entries.filter(entry =>
      entry.name.toLowerCase().includes(searchLower) ||
      entry.description?.toLowerCase().includes(searchLower) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  private async getFromLegacyCache(name: string, version?: string): Promise<TemplateRegistryEntry | null> {
    const entries = await this.listFromLegacyCache({});

    if (version) {
      return entries.find(e => e.name === name && e.version === version) || null;
    }

    const matching = entries.filter(e => e.name === name);
    return matching[0] || null;
  }
}

/**
 * Create a database-backed template registry instance
 */
export function createDatabaseTemplateRegistry(): DatabaseTemplateRegistry {
  return new DatabaseTemplateRegistry();
}
