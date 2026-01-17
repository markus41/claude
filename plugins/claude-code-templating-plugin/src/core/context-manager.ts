/**
 * Context Manager - Progressive Context Loading
 *
 * Manages context for template operations with progressive loading
 * to optimize token usage and improve performance across workflows.
 */

import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import glob from 'fast-glob';
import type {
  TemplateContext,
  EnvironmentContext,
  ProjectAnalysis,
} from '../types/scaffold.js';

/**
 * Context loading options
 */
export interface ContextLoadOptions {
  /** Maximum depth for directory traversal */
  maxDepth?: number;
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Maximum file size to read (bytes) */
  maxFileSize?: number;
  /** Maximum total context size (tokens) */
  maxContextTokens?: number;
}

/**
 * File context entry
 */
export interface FileContextEntry {
  /** Relative file path */
  path: string;
  /** File content (if loaded) */
  content?: string;
  /** File size in bytes */
  size: number;
  /** File extension */
  extension: string;
  /** Whether content was truncated */
  truncated?: boolean;
  /** Estimated token count */
  tokenCount?: number;
}

/**
 * Loaded context result
 */
export interface LoadedContext {
  /** Template context */
  templateContext: TemplateContext;
  /** Loaded files */
  files: FileContextEntry[];
  /** Project analysis */
  analysis?: ProjectAnalysis;
  /** Total token count */
  totalTokens: number;
  /** Loading statistics */
  stats: ContextStats;
}

/**
 * Context loading statistics
 */
export interface ContextStats {
  /** Files scanned */
  filesScanned: number;
  /** Files loaded */
  filesLoaded: number;
  /** Files skipped */
  filesSkipped: number;
  /** Total bytes loaded */
  bytesLoaded: number;
  /** Load duration in milliseconds */
  durationMs: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<ContextLoadOptions> = {
  maxDepth: 5,
  include: ['**/*'],
  exclude: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.lock',
    '*.log',
    '.env*',
    '*.min.js',
    '*.min.css',
    '*.map',
  ],
  maxFileSize: 100 * 1024, // 100KB
  maxContextTokens: 50000,
};

/**
 * Context Manager
 *
 * Efficiently loads and manages context for template operations,
 * using progressive loading to optimize token usage.
 */
export class ContextManager {
  private readonly options: Required<ContextLoadOptions>;
  private readonly contextCache: Map<string, LoadedContext> = new Map();

  constructor(options?: ContextLoadOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Load context from a directory
   */
  async loadContext(
    basePath: string,
    variables: Record<string, unknown> = {},
    options?: Partial<ContextLoadOptions>
  ): Promise<LoadedContext> {
    const startTime = Date.now();
    const opts = { ...this.options, ...options };

    // Check cache
    const cacheKey = this.getCacheKey(basePath, variables);
    const cached = this.contextCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats: ContextStats = {
      filesScanned: 0,
      filesLoaded: 0,
      filesSkipped: 0,
      bytesLoaded: 0,
      durationMs: 0,
    };

    // Find files - returns string[] when stats is not true
    const files = await glob(opts.include, {
      cwd: basePath,
      ignore: opts.exclude,
      deep: opts.maxDepth,
      onlyFiles: true,
    });

    stats.filesScanned = files.length;

    // Load files progressively
    const loadedFiles: FileContextEntry[] = [];
    let totalTokens = 0;

    for (const filePath of files) {
      if (totalTokens >= opts.maxContextTokens) {
        stats.filesSkipped++;
        continue;
      }

      const fullPath = join(basePath, filePath);
      const fileStat = await stat(fullPath);

      // Skip large files
      if (fileStat.size > opts.maxFileSize) {
        loadedFiles.push({
          path: filePath,
          size: fileStat.size,
          extension: extname(filePath),
          truncated: true,
        });
        stats.filesSkipped++;
        continue;
      }

      // Skip binary files
      if (this.isBinaryFile(filePath)) {
        loadedFiles.push({
          path: filePath,
          size: fileStat.size,
          extension: extname(filePath),
        });
        stats.filesSkipped++;
        continue;
      }

      try {
        const content = await readFile(fullPath, 'utf-8');
        const tokenCount = this.estimateTokens(content);

        // Check if adding this file exceeds limit
        if (totalTokens + tokenCount > opts.maxContextTokens) {
          // Truncate content to fit
          const remainingTokens = opts.maxContextTokens - totalTokens;
          const truncatedContent = this.truncateToTokens(content, remainingTokens);

          loadedFiles.push({
            path: filePath,
            content: truncatedContent,
            size: fileStat.size,
            extension: extname(filePath),
            truncated: true,
            tokenCount: remainingTokens,
          });

          totalTokens = opts.maxContextTokens;
          stats.filesLoaded++;
          stats.bytesLoaded += Buffer.byteLength(truncatedContent);
          break;
        }

        loadedFiles.push({
          path: filePath,
          content,
          size: fileStat.size,
          extension: extname(filePath),
          tokenCount,
        });

        totalTokens += tokenCount;
        stats.filesLoaded++;
        stats.bytesLoaded += fileStat.size;
      } catch {
        // Skip files that can't be read
        stats.filesSkipped++;
      }
    }

    // Build template context
    const templateContext = this.buildTemplateContext(basePath, variables);

    // Analyze project if possible
    const analysis = await this.analyzeProject(basePath, loadedFiles);

    stats.durationMs = Date.now() - startTime;

    const result: LoadedContext = {
      templateContext,
      files: loadedFiles,
      analysis,
      totalTokens,
      stats,
    };

    // Cache result
    this.contextCache.set(cacheKey, result);

    return result;
  }

  /**
   * Build template context from variables and environment
   */
  buildTemplateContext(
    basePath: string,
    variables: Record<string, unknown>
  ): TemplateContext {
    const now = new Date();

    const env: EnvironmentContext = {
      cwd: basePath,
      user: process.env.USER || process.env.USERNAME || 'unknown',
      timestamp: now.toISOString(),
      date: now.toLocaleDateString(),
      platform: process.platform,
    };

    return {
      variables,
      computed: {
        timestamp: now.toISOString(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        year: now.getFullYear(),
        projectName: basePath.split(/[\\/]/).pop() || 'project',
      },
      env,
    };
  }

  /**
   * Get context for specific files
   */
  async getFileContext(
    basePath: string,
    filePaths: string[]
  ): Promise<FileContextEntry[]> {
    const entries: FileContextEntry[] = [];

    for (const filePath of filePaths) {
      const fullPath = join(basePath, filePath);

      if (!existsSync(fullPath)) {
        continue;
      }

      try {
        const fileStat = await stat(fullPath);
        const content = await readFile(fullPath, 'utf-8');

        entries.push({
          path: filePath,
          content,
          size: fileStat.size,
          extension: extname(filePath),
          tokenCount: this.estimateTokens(content),
        });
      } catch {
        // Skip files that can't be read
      }
    }

    return entries;
  }

  /**
   * Clear context cache
   */
  clearCache(): void {
    this.contextCache.clear();
  }

  /**
   * Analyze project from loaded files
   */
  private async analyzeProject(
    _basePath: string,
    files: FileContextEntry[]
  ): Promise<ProjectAnalysis | undefined> {
    const analysis: ProjectAnalysis = {
      projectType: 'unknown',
      language: 'unknown',
      frameworks: [],
      patterns: [],
      suggestedVariables: {},
    };

    // Check for package.json
    const packageJson = files.find((f) => f.path === 'package.json');
    if (packageJson?.content) {
      try {
        const pkg = JSON.parse(packageJson.content);
        analysis.language = 'typescript';
        analysis.projectType = 'webapp';

        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['react']) analysis.frameworks.push('react');
        if (deps['next']) analysis.frameworks.push('nextjs');
        if (deps['express']) analysis.frameworks.push('express');
        if (deps['fastify']) analysis.frameworks.push('fastify');
        if (deps['prisma']) analysis.frameworks.push('prisma');
      } catch {
        // Ignore parse errors
      }
    }

    // Check for Python files
    const requirementsTxt = files.find(
      (f) => f.path === 'requirements.txt' || f.path === 'pyproject.toml'
    );
    if (requirementsTxt) {
      analysis.language = 'python';
      analysis.projectType = 'api';

      if (requirementsTxt.content?.includes('fastapi')) {
        analysis.frameworks.push('fastapi');
      }
      if (requirementsTxt.content?.includes('django')) {
        analysis.frameworks.push('django');
      }
    }

    // Check for Java files
    const pomXml = files.find((f) => f.path === 'pom.xml');
    if (pomXml) {
      analysis.language = 'java';
      analysis.projectType = 'microservice';

      if (pomXml.content?.includes('spring-boot')) {
        analysis.frameworks.push('spring-boot');
      }
    }

    // Check for Go files
    const goMod = files.find((f) => f.path === 'go.mod');
    if (goMod) {
      analysis.language = 'go';
      analysis.projectType = 'microservice';
    }

    // Check for Terraform
    const tfFiles = files.filter((f) => f.extension === '.tf');
    if (tfFiles.length > 0) {
      analysis.language = 'hcl';
      analysis.projectType = 'infrastructure';
      analysis.frameworks.push('terraform');
    }

    return analysis;
  }

  /**
   * Check if file is binary
   */
  private isBinaryFile(filename: string): boolean {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
      '.woff', '.woff2', '.ttf', '.eot',
      '.pdf', '.zip', '.tar', '.gz',
      '.exe', '.dll', '.so', '.dylib',
      '.pyc', '.class', '.o',
    ];

    const ext = extname(filename).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  /**
   * Estimate token count for content
   * Rough approximation: ~4 characters per token
   */
  private estimateTokens(content: string): number {
    return Math.ceil(content.length / 4);
  }

  /**
   * Truncate content to approximate token count
   */
  private truncateToTokens(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (content.length <= maxChars) {
      return content;
    }

    // Truncate at line boundary if possible
    const truncated = content.substring(0, maxChars);
    const lastNewline = truncated.lastIndexOf('\n');

    if (lastNewline > maxChars * 0.8) {
      return truncated.substring(0, lastNewline) + '\n... [truncated]';
    }

    return truncated + '... [truncated]';
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    basePath: string,
    variables: Record<string, unknown>
  ): string {
    return `${basePath}:${JSON.stringify(variables)}`;
  }
}

/**
 * Create context manager instance
 */
export function createContextManager(
  options?: ContextLoadOptions
): ContextManager {
  return new ContextManager(options);
}

export default ContextManager;
