import pino from 'pino';
import { type GraphAdapter } from '../core/graph.js';
import { type VectorStore } from '../core/vector.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const logger = pino({ name: 'mcp:resources' });

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: () => Promise<string>;
}

export function createResources(
  graph: GraphAdapter,
  vector: VectorStore,
  config: { dataDir: string; configDir: string },
): ResourceDefinition[] {
  return [
    {
      uri: 'scrapin://graph/summary',
      name: 'Knowledge Graph Summary',
      description: 'Current state of the documentation knowledge graph including node/edge counts',
      mimeType: 'application/json',
      handler: async () => {
        const stats = await graph.stats();
        return JSON.stringify({
          timestamp: new Date().toISOString(),
          vector_entries: vector.size,
          graph: stats,
        }, null, 2);
      },
    },

    {
      uri: 'scrapin://snapshots/latest',
      name: 'Latest Snapshots',
      description: 'List of most recent documentation snapshots',
      mimeType: 'application/json',
      handler: async () => {
        const snapshotsDir = join(config.dataDir, 'snapshots');
        if (!existsSync(snapshotsDir)) {
          return JSON.stringify({ snapshots: [] });
        }

        const dirs = readdirSync(snapshotsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);

        const snapshots: Array<{ source: string; files: number }> = [];
        for (const dir of dirs) {
          const files = readdirSync(join(snapshotsDir, dir)).length;
          snapshots.push({ source: dir, files });
        }

        return JSON.stringify({ snapshots }, null, 2);
      },
    },

    {
      uri: 'scrapin://drift/latest',
      name: 'Latest Drift Reports',
      description: 'Most recent code and agent drift detection reports',
      mimeType: 'application/json',
      handler: async () => {
        const reportsDir = join(config.dataDir, 'drift-reports');
        if (!existsSync(reportsDir)) {
          return JSON.stringify({ reports: [] });
        }

        const files = readdirSync(reportsDir)
          .filter((f) => f.endsWith('.json'))
          .sort()
          .reverse()
          .slice(0, 10);

        const reports: Array<{ file: string; content: unknown }> = [];
        for (const file of files) {
          try {
            const raw = await readFile(join(reportsDir, file), 'utf-8');
            reports.push({ file, content: JSON.parse(raw) });
          } catch {
            logger.debug({ file }, 'Failed to read drift report');
          }
        }

        return JSON.stringify({ reports }, null, 2);
      },
    },

    {
      uri: 'scrapin://config/sources',
      name: 'Configured Documentation Sources',
      description: 'All registered documentation sources and their crawl configuration',
      mimeType: 'application/json',
      handler: async () => {
        const sourcesPath = join(config.configDir, 'sources.yaml');
        if (!existsSync(sourcesPath)) {
          return JSON.stringify({ sources: {} });
        }
        const raw = await readFile(sourcesPath, 'utf-8');
        return raw;
      },
    },

    {
      uri: 'scrapin://config/algo-sources',
      name: 'Configured Algorithm Sources',
      description: 'All registered algorithm and pattern sources',
      mimeType: 'application/json',
      handler: async () => {
        const algoPath = join(config.configDir, 'algo-sources.yaml');
        if (!existsSync(algoPath)) {
          return JSON.stringify({ algo_sources: [] });
        }
        const raw = await readFile(algoPath, 'utf-8');
        return raw;
      },
    },
  ];
}
