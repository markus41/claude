/**
 * Template Registry
 *
 * Central registry for discovering, searching, and managing templates.
 * Supports:
 * - Local template directories
 * - Remote template sources (Git, GitHub, NPM)
 * - Template metadata caching
 * - Search and filtering
 * - Version management
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import type {
  ITemplateRegistry,
  TemplateRegistryEntry,
  TemplateListOptions,
  TemplateSearchOptions
} from '../types/template.js';

interface RegistryCache {
  entries: TemplateRegistryEntry[];
  lastUpdated: string;
  version: string;
}

export class TemplateRegistry implements ITemplateRegistry {
  private cache: RegistryCache | null = null;
  private cacheDir: string;
  private cachePath: string;
  private cacheExpiry: number = 3600000; // 1 hour in milliseconds

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || join(homedir(), '.claude', 'template-cache');
    this.cachePath = join(this.cacheDir, 'registry.json');
  }

  /**
   * List all templates
   */
  async list(options: TemplateListOptions = {}): Promise<TemplateRegistryEntry[]> {
    await this.ensureCache();
    const entries = [...(this.cache?.entries || [])];
    return this.applyListOptions(entries, options);
  }

  /**
   * Search templates
   */
  async search(query: string, options: TemplateSearchOptions = {}): Promise<TemplateRegistryEntry[]> {
    await this.ensureCache();

    const searchLower = query.toLowerCase();
    let entries = [...(this.cache?.entries || [])];

    // Apply search filter
    entries = entries.filter(entry => {
      // Search in name
      if (entry.name.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in description (if enabled)
      if (options.searchDescription !== false && entry.description) {
        if (entry.description.toLowerCase().includes(searchLower)) {
          return true;
        }
      }

      // Search in tags (if enabled)
      if (options.searchTags !== false && entry.tags) {
        if (entry.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
          return true;
        }
      }

      return false;
    });

    // Apply additional filters from list options
    return this.applyListOptions(entries, { ...options });
  }

  /**
   * Get template by name
   */
  async get(name: string, version?: string): Promise<TemplateRegistryEntry | null> {
    await this.ensureCache();

    const entries = this.cache?.entries || [];

    if (version) {
      return entries.find(e => e.name === name && e.version === version) || null;
    }

    // Return latest version
    const matchingEntries = entries.filter(e => e.name === name);
    if (matchingEntries.length === 0) return null;

    const sorted = matchingEntries.sort((a, b) => {
      // Simple version comparison (assumes semver-like versions)
      return this.compareVersions(b.version, a.version);
    });

    return sorted[0] || null;
  }

  /**
   * Register a template
   */
  async register(entry: TemplateRegistryEntry): Promise<void> {
    await this.ensureCache();

    if (!this.cache) {
      this.cache = {
        entries: [],
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };
    }

    // Check if template already exists
    const existingIndex = this.cache.entries.findIndex(
      e => e.name === entry.name && e.version === entry.version
    );

    if (existingIndex >= 0) {
      // Update existing entry
      this.cache.entries[existingIndex] = entry;
    } else {
      // Add new entry
      this.cache.entries.push(entry);
    }

    this.cache.lastUpdated = new Date().toISOString();

    // Save cache
    await this.saveCache();
  }

  /**
   * Unregister a template
   */
  async unregister(name: string): Promise<void> {
    await this.ensureCache();

    if (!this.cache) return;

    // Remove all versions of the template
    this.cache.entries = this.cache.entries.filter(e => e.name !== name);
    this.cache.lastUpdated = new Date().toISOString();

    await this.saveCache();
  }

  /**
   * Refresh registry cache
   */
  async refresh(): Promise<void> {
    // Clear cache and reload from default sources
    this.cache = null;
    await this.loadDefaultTemplates();
  }

  /**
   * Ensure cache is loaded
   */
  private async ensureCache(): Promise<void> {
    if (this.cache) {
      // Check if cache is expired
      const cacheAge = Date.now() - new Date(this.cache.lastUpdated).getTime();
      if (cacheAge < this.cacheExpiry) {
        return;
      }
    }

    // Try to load cache from disk
    try {
      await access(this.cachePath);
      const content = await readFile(this.cachePath, 'utf-8');
      this.cache = JSON.parse(content);
    } catch {
      // Cache doesn't exist, load default templates
      await this.loadDefaultTemplates();
    }
  }

  /**
   * Load default templates
   */
  private async loadDefaultTemplates(): Promise<void> {
    this.cache = {
      entries: [
        // FastAPI templates
        {
          name: 'fastapi-microservice',
          version: '1.0.0',
          description: 'FastAPI microservice with PostgreSQL, Redis, and async support',
          format: 'cookiecutter',
          source: {
            type: 'github',
            location: 'tiangolo/cookiecutter-fastapi'
          },
          category: 'microservice',
          tags: ['python', 'fastapi', 'microservice', 'api', 'postgres'],
          author: 'Tiangolo',
          updatedAt: new Date().toISOString()
        },
        {
          name: 'fastapi-minimal',
          version: '1.0.0',
          description: 'Minimal FastAPI service template',
          format: 'cookiecutter',
          source: {
            type: 'github',
            location: 'tiangolo/cookiecutter-fastapi-minimal'
          },
          category: 'api',
          tags: ['python', 'fastapi', 'minimal', 'api'],
          author: 'Tiangolo',
          updatedAt: new Date().toISOString()
        },

        // Node.js templates
        {
          name: 'express-api',
          version: '1.0.0',
          description: 'Express.js REST API with TypeScript',
          format: 'cookiecutter',
          source: {
            type: 'github',
            location: 'express-typescript-template'
          },
          category: 'api',
          tags: ['nodejs', 'express', 'typescript', 'api'],
          updatedAt: new Date().toISOString()
        },
        {
          name: 'nestjs-api',
          version: '1.0.0',
          description: 'NestJS microservice with TypeScript',
          format: 'cookiecutter',
          source: {
            type: 'github',
            location: 'nestjs-microservice-template'
          },
          category: 'microservice',
          tags: ['nodejs', 'nestjs', 'typescript', 'microservice'],
          updatedAt: new Date().toISOString()
        },

        // React templates
        {
          name: 'react-app',
          version: '1.0.0',
          description: 'React application with TypeScript and Vite',
          format: 'cookiecutter',
          source: {
            type: 'github',
            location: 'react-vite-template'
          },
          category: 'webapp',
          tags: ['react', 'typescript', 'vite', 'frontend'],
          updatedAt: new Date().toISOString()
        },

        // Java templates
        {
          name: 'spring-boot-api',
          version: '1.0.0',
          description: 'Spring Boot REST API with JPA',
          format: 'maven-archetype',
          source: {
            type: 'url',
            location: 'https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent'
          },
          category: 'api',
          tags: ['java', 'spring-boot', 'api', 'jpa'],
          updatedAt: new Date().toISOString()
        },

        // Harness templates
        {
          name: 'harness-ci-pipeline',
          version: '1.0.0',
          description: 'Harness CI pipeline template with build and test stages',
          format: 'harness',
          source: {
            type: 'embedded',
            location: 'templates/harness/ci-pipeline'
          },
          category: 'pipeline',
          tags: ['harness', 'ci', 'pipeline', 'build'],
          author: 'Harness',
          updatedAt: new Date().toISOString()
        },
        {
          name: 'harness-cd-pipeline',
          version: '1.0.0',
          description: 'Harness CD pipeline template with deployment stages',
          format: 'harness',
          source: {
            type: 'embedded',
            location: 'templates/harness/cd-pipeline'
          },
          category: 'pipeline',
          tags: ['harness', 'cd', 'pipeline', 'deployment'],
          author: 'Harness',
          updatedAt: new Date().toISOString()
        }
      ],
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };

    await this.saveCache();
  }

  /**
   * Save cache to disk
   */
  private async saveCache(): Promise<void> {
    if (!this.cache) return;

    await mkdir(dirname(this.cachePath), { recursive: true });
    await writeFile(
      this.cachePath,
      JSON.stringify(this.cache, null, 2),
      'utf-8'
    );
  }

  /**
   * Sort entries by field
   */
  private sortEntries(
    entries: TemplateRegistryEntry[],
    sortBy: TemplateListOptions['sortBy'],
    sortOrder: 'asc' | 'desc'
  ): TemplateRegistryEntry[] {
    const sorted = [...entries].sort((a, b) => {
      let compareA: string | number | undefined;
      let compareB: string | number | undefined;

      switch (sortBy) {
        case 'name':
          compareA = a.name;
          compareB = b.name;
          break;
        case 'updatedAt':
          compareA = a.updatedAt || '';
          compareB = b.updatedAt || '';
          break;
        case 'downloads':
          compareA = a.downloads || 0;
          compareB = b.downloads || 0;
          break;
        case 'stars':
          compareA = a.stars || 0;
          compareB = b.stars || 0;
          break;
        default:
          return 0;
      }

      if (typeof compareA === 'string' && typeof compareB === 'string') {
        return sortOrder === 'asc'
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA);
      }

      if (typeof compareA === 'number' && typeof compareB === 'number') {
        return sortOrder === 'asc'
          ? compareA - compareB
          : compareB - compareA;
      }

      return 0;
    });

    return sorted;
  }

  /**
   * Apply list filtering, sorting, and pagination to entries
   */
  private applyListOptions(
    entries: TemplateRegistryEntry[],
    options: TemplateListOptions = {}
  ): TemplateRegistryEntry[] {
    let filtered = [...entries];

    if (options.format) {
      filtered = filtered.filter((entry) => entry.format === options.format);
    }

    if (options.category) {
      filtered = filtered.filter((entry) => entry.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.tags && options.tags!.some((tag) => entry.tags!.includes(tag))
      );
    }

    if (options.sortBy) {
      filtered = this.sortEntries(
        filtered,
        options.sortBy,
        options.sortOrder || 'asc'
      );
    }

    if (options.offset !== undefined) {
      filtered = filtered.slice(options.offset);
    }

    if (options.limit !== undefined) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Compare semver-like version strings
   */
  private compareVersions(a: string, b: string): number {
    const parsedA = this.parseVersion(a);
    const parsedB = this.parseVersion(b);

    if (!parsedA || !parsedB) {
      return a.localeCompare(b);
    }

    const maxLen = Math.max(parsedA.parts.length, parsedB.parts.length);
    for (let i = 0; i < maxLen; i += 1) {
      const partA = parsedA.parts[i] ?? 0;
      const partB = parsedB.parts[i] ?? 0;
      if (partA !== partB) {
        return partA < partB ? -1 : 1;
      }
    }

    if (parsedA.prerelease && !parsedB.prerelease) return -1;
    if (!parsedA.prerelease && parsedB.prerelease) return 1;
    if (parsedA.prerelease && parsedB.prerelease) {
      return parsedA.prerelease.localeCompare(parsedB.prerelease);
    }

    return 0;
  }

  /**
   * Parse a semver-like version string
   */
  private parseVersion(
    version: string
  ): { parts: number[]; prerelease?: string } | null {
    const match = version.trim().match(/^v?(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?$/);
    if (!match) {
      return null;
    }

    const parts = match[1]!.split('.').map((part) => Number(part));
    const prerelease = match[2];

    return {
      parts,
      prerelease: prerelease || undefined,
    };
  }
}

/**
 * Create a template registry instance
 */
export function createTemplateRegistry(cacheDir?: string): TemplateRegistry {
  return new TemplateRegistry(cacheDir);
}
