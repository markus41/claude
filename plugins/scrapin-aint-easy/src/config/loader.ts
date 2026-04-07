import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import yaml from 'js-yaml';
import { z } from 'zod';
import pino from 'pino';
import { DEFAULT_CONFIG, type ScrapinConfig } from './defaults.js';

const logger = pino({ name: 'config' });

const SourceSchema = z.object({
  name: z.string(),
  base_url: z.string().url(),
  sitemap: z.string().optional(),
  sitemap_filter: z.string().optional(),
  openapi_spec: z.string().nullable().optional(),
  package_aliases: z.array(z.string()).default([]),
  concurrency: z.number().min(1).max(50).default(5),
  rps: z.number().min(0.1).max(100).default(2),
  retry_attempts: z.number().min(0).max(10).default(3),
  backoff: z.enum(['exponential', 'linear']).default('exponential'),
  auth_env: z.string().optional(),
});

export type SourceConfig = z.infer<typeof SourceSchema>;

const SourcesFileSchema = z.object({
  sources: z.record(z.string(), SourceSchema),
});

const AlgoSourceSchema = z.object({
  key: z.string(),
  url: z.string(),
  type: z.enum(['github_repo', 'sitemap_crawl', 'single_page']),
  paths: z.array(z.string()).optional(),
  extract_mode: z.string().optional(),
});

export type AlgoSourceConfig = z.infer<typeof AlgoSourceSchema>;

const AlgoSourcesFileSchema = z.object({
  algo_sources: z.array(AlgoSourceSchema),
});

const RateLimitSchema = z.object({
  source: z.string(),
  concurrency: z.number().min(1),
  rps: z.number().min(0.1),
});

const RateLimitsFileSchema = z.object({
  rate_limits: z.array(RateLimitSchema).default([]),
});

export async function loadConfig(configDir: string): Promise<ScrapinConfig> {
  const configPath = join(configDir, 'scrapin.yaml');
  if (!existsSync(configPath)) {
    logger.info('No scrapin.yaml found, using defaults');
    return { ...DEFAULT_CONFIG, configDir };
  }

  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = yaml.load(raw) as Partial<ScrapinConfig>;
    return { ...DEFAULT_CONFIG, ...parsed, configDir };
  } catch (err) {
    logger.error({ err }, 'Failed to load config');
    return { ...DEFAULT_CONFIG, configDir };
  }
}

export async function loadSources(configDir: string): Promise<Record<string, SourceConfig>> {
  const filePath = join(configDir, 'sources.yaml');
  if (!existsSync(filePath)) {
    logger.warn('No sources.yaml found');
    return {};
  }

  const raw = await readFile(filePath, 'utf-8');
  const parsed = yaml.load(raw);
  const validated = SourcesFileSchema.parse(parsed);
  logger.info(`Loaded ${Object.keys(validated.sources).length} documentation sources`);
  return validated.sources;
}

export async function loadAlgoSources(configDir: string): Promise<AlgoSourceConfig[]> {
  const filePath = join(configDir, 'algo-sources.yaml');
  if (!existsSync(filePath)) {
    logger.warn('No algo-sources.yaml found');
    return [];
  }

  const raw = await readFile(filePath, 'utf-8');
  const parsed = yaml.load(raw);
  const validated = AlgoSourcesFileSchema.parse(parsed);
  logger.info(`Loaded ${validated.algo_sources.length} algorithm sources`);
  return validated.algo_sources;
}

export async function loadRateLimits(configDir: string): Promise<Map<string, { concurrency: number; rps: number }>> {
  const filePath = join(configDir, 'rate-limits.yaml');
  const map = new Map<string, { concurrency: number; rps: number }>();

  if (!existsSync(filePath)) return map;

  const raw = await readFile(filePath, 'utf-8');
  const parsed = yaml.load(raw);
  const validated = RateLimitsFileSchema.parse(parsed);

  for (const rl of validated.rate_limits) {
    map.set(rl.source, { concurrency: rl.concurrency, rps: rl.rps });
  }

  return map;
}
