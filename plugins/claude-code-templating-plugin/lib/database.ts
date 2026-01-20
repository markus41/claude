/**
 * ============================================================================
 * CLAUDE CODE TEMPLATING PLUGIN - DATABASE CLIENT
 * ============================================================================
 * Shared database client that connects to the jira-orchestrator Neon database.
 * Provides type-safe access to Template and TemplateGeneration models.
 *
 * @version 2.0.0
 * @author Brookside BI
 * ============================================================================
 */

import 'dotenv/config';
import { PrismaClient, TemplateFormat, TemplateSourceType } from '../../jira-orchestrator/lib/generated/prisma/index.js';
import type { Template, TemplateGeneration, Prisma } from '../../jira-orchestrator/lib/generated/prisma/index.js';

// Re-export types for use in the templating plugin
export { Template, TemplateGeneration, TemplateFormat, TemplateSourceType };
export type { Prisma };

// ============================================================================
// PRISMA CLIENT SINGLETON
// ============================================================================

let prisma: PrismaClient | null = null;

/**
 * Get the shared Prisma client instance
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

/**
 * Disconnect from the database
 */
export async function disconnect(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Check if database feature is enabled
 */
export function isDatabaseEnabled(): boolean {
  return process.env.FEATURE_TEMPLATE_DB_ENABLED !== 'false' &&
         !!process.env.DATABASE_URL;
}

// ============================================================================
// TEMPLATE CRUD OPERATIONS
// ============================================================================

/**
 * Create or update a template
 */
export async function upsertTemplate(
  template: Prisma.TemplateCreateInput
): Promise<Template> {
  const db = getPrisma();

  return db.template.upsert({
    where: {
      name_version: {
        name: template.name,
        version: template.version,
      },
    },
    create: template,
    update: {
      description: template.description,
      sourceLocation: template.sourceLocation,
      category: template.category,
      tags: template.tags,
      author: template.author,
      authorEmail: template.authorEmail,
      readme: template.readme,
      variables: template.variables,
      isPublic: template.isPublic,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get a template by name and optionally version
 */
export async function getTemplate(
  name: string,
  version?: string
): Promise<Template | null> {
  const db = getPrisma();

  if (version) {
    return db.template.findUnique({
      where: {
        name_version: { name, version },
      },
    });
  }

  // Get latest version
  return db.template.findFirst({
    where: { name },
    orderBy: { version: 'desc' },
  });
}

/**
 * List templates with filtering
 */
export async function listTemplates(options: {
  format?: TemplateFormat;
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'name' | 'downloads' | 'stars' | 'updatedAt';
  order?: 'asc' | 'desc';
}): Promise<Template[]> {
  const db = getPrisma();

  const where: Prisma.TemplateWhereInput = {
    isPublic: true,
  };

  if (options.format) {
    where.format = options.format;
  }

  if (options.category) {
    where.category = options.category;
  }

  if (options.tags && options.tags.length > 0) {
    where.tags = {
      hasSome: options.tags,
    };
  }

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  return db.template.findMany({
    where,
    take: options.limit || 50,
    skip: options.offset || 0,
    orderBy: {
      [options.orderBy || 'updatedAt']: options.order || 'desc',
    },
  });
}

/**
 * Search templates by query
 */
export async function searchTemplates(
  query: string,
  options?: {
    format?: TemplateFormat;
    category?: string;
    limit?: number;
  }
): Promise<Template[]> {
  return listTemplates({
    search: query,
    format: options?.format,
    category: options?.category,
    limit: options?.limit,
  });
}

/**
 * Delete a template
 */
export async function deleteTemplate(
  name: string,
  version?: string
): Promise<void> {
  const db = getPrisma();

  if (version) {
    await db.template.delete({
      where: {
        name_version: { name, version },
      },
    });
  } else {
    // Delete all versions
    await db.template.deleteMany({
      where: { name },
    });
  }
}

/**
 * Increment template download count
 */
export async function incrementDownloads(templateId: string): Promise<void> {
  const db = getPrisma();

  await db.template.update({
    where: { id: templateId },
    data: {
      downloads: { increment: 1 },
    },
  });
}

// ============================================================================
// TEMPLATE GENERATION TRACKING
// ============================================================================

/**
 * Record a template generation event
 */
export async function recordGeneration(
  generation: Prisma.TemplateGenerationCreateInput
): Promise<TemplateGeneration> {
  const db = getPrisma();

  // Also increment downloads on the template
  if (generation.template?.connect?.id && generation.success) {
    await incrementDownloads(generation.template.connect.id);
  }

  return db.templateGeneration.create({
    data: generation,
  });
}

/**
 * Get generation history for a template
 */
export async function getGenerationHistory(
  templateId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<TemplateGeneration[]> {
  const db = getPrisma();

  return db.templateGeneration.findMany({
    where: { templateId },
    take: options?.limit || 20,
    skip: options?.offset || 0,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get generation statistics for a template
 */
export async function getGenerationStats(templateId: string): Promise<{
  totalGenerations: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number | null;
}> {
  const db = getPrisma();

  const stats = await db.templateGeneration.aggregate({
    where: { templateId },
    _count: { _all: true },
    _avg: { durationMs: true },
  });

  const successCount = await db.templateGeneration.count({
    where: { templateId, success: true },
  });

  return {
    totalGenerations: stats._count._all,
    successCount,
    failureCount: stats._count._all - successCount,
    avgDurationMs: stats._avg.durationMs,
  };
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Import templates from legacy JSON format
 */
export async function importLegacyTemplates(
  entries: Array<{
    name: string;
    version: string;
    description?: string;
    format: string;
    source: { type: string; location: string };
    category?: string;
    tags?: string[];
    author?: string;
    updatedAt?: string;
  }>
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const db = getPrisma();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      // Map format string to enum
      const format = mapFormatToEnum(entry.format);
      const sourceType = mapSourceTypeToEnum(entry.source.type);

      await db.template.upsert({
        where: {
          name_version: {
            name: entry.name,
            version: entry.version,
          },
        },
        create: {
          name: entry.name,
          version: entry.version,
          description: entry.description,
          format,
          sourceType,
          sourceLocation: entry.source.location,
          category: entry.category,
          tags: entry.tags || [],
          author: entry.author,
          isPublic: true,
        },
        update: {
          description: entry.description,
          sourceLocation: entry.source.location,
          category: entry.category,
          tags: entry.tags || [],
          author: entry.author,
        },
      });
      imported++;
    } catch (error) {
      errors.push(`Failed to import ${entry.name}@${entry.version}: ${error}`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

/**
 * Map format string to TemplateFormat enum
 */
function mapFormatToEnum(format: string): TemplateFormat {
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
 * Map source type string to TemplateSourceType enum
 */
function mapSourceTypeToEnum(sourceType: string): TemplateSourceType {
  const mapping: Record<string, TemplateSourceType> = {
    'embedded': TemplateSourceType.EMBEDDED,
    'local': TemplateSourceType.LOCAL,
    'github': TemplateSourceType.GITHUB,
    'npm': TemplateSourceType.NPM,
    'url': TemplateSourceType.URL,
  };
  return mapping[sourceType.toLowerCase()] || TemplateSourceType.EMBEDDED;
}
