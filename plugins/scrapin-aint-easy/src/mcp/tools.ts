import { z } from 'zod';
import pino from 'pino';
import { type GraphAdapter } from '../core/graph.js';
import { type VectorStore } from '../core/vector.js';
import { type EventBus } from '../core/event-bus.js';
import { toSourceId } from '../core/ids.js';
import { migrateLegacySourceIds } from '../core/source-migration.js';
import { type CrawlQueue } from '../crawler/crawl-queue.js';
import { type SourceConfig } from '../config/loader.js';

const logger = pino({ name: 'mcp:tools' });

// ── Tool input schemas ──

const SearchInput = z.object({
  query: z.string().describe('Natural language or symbol name to search for'),
  limit: z.coerce.number().min(1).max(50).default(10),
  label_filter: z.enum(['Source', 'Page', 'Symbol', 'Module', 'Example', 'AlgoNode', 'Pattern', 'AgentDef']).optional(),
});

const GraphQueryInput = z.object({
  start_id: z.string().describe('Node ID to start traversal from'),
  hops: z.coerce.number().min(1).max(5).default(2),
  edge_types: z.array(z.string()).optional(),
  include_siblings: z.coerce.boolean().default(false),
});

const AlgoSearchInput = z.object({
  query: z.string().describe('Algorithm name or description'),
  category: z.string().optional(),
  language: z.enum(['ts', 'py']).optional(),
  limit: z.coerce.number().min(1).max(20).default(5),
});

const AlgoDetailInput = z.object({
  name: z.string().describe('Exact algorithm name'),
});

const CrawlSourceInput = z.object({
  source_key: z.string().describe('Source key from sources.yaml'),
  force: z.coerce.boolean().default(false),
});

const DiffInput = z.object({
  source_key: z.string(),
  page_id: z.string().optional(),
});

const LspHoverInput = z.object({
  symbol: z.string(),
  package_hint: z.string().optional(),
});

const AddSourceInput = z.object({
  key: z.string(),
  name: z.string(),
  base_url: z.string().url(),
  sitemap: z.string().optional(),
  package_aliases: z.array(z.string()).default([]),
  concurrency: z.coerce.number().default(5),
  rps: z.coerce.number().default(2),
});

const AddAlgoSourceInput = z.object({
  key: z.string(),
  url: z.string(),
  type: z.enum(['github_repo', 'sitemap_crawl', 'single_page']),
  paths: z.array(z.string()).optional(),
});

const CodeDriftScanInput = z.object({
  project_root: z.string().optional(),
});

const AgentDriftStatusInput = z.object({});

const AgentDriftDetailInput = z.object({
  agent_id: z.string(),
});

const AgentDriftAckInput = z.object({
  agent_id: z.string(),
  notes: z.string().optional(),
});

const AgentDriftDiffInput = z.object({
  agent_id: z.string(),
});

const GraphStatsInput = z.object({});

// ── Response helpers ──

interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

function makeMetadata(source: string, cacheHit: boolean, ttlRemaining?: number): string {
  return [
    `**Source:** ${source}`,
    `**Timestamp:** ${new Date().toISOString()}`,
    `**Cache hit:** ${cacheHit}`,
    ttlRemaining !== undefined ? `**TTL remaining:** ${ttlRemaining}s` : '',
  ].filter(Boolean).join(' | ');
}

function textResponse(text: string, truncated = false, continueToken?: string): ToolResponse {
  const parts = [text];
  if (truncated) {
    parts.push('\n\n---\n*Response truncated. Use `continue_token` for next page.*');
    if (continueToken) parts.push(`\n\`continue_token: ${continueToken}\``);
  }
  const joined = parts.join('');
  return {
    content: [{ type: 'text', text: joined.slice(0, 16384) }],
  };
}

function errorResponse(message: string): ToolResponse {
  return {
    content: [{ type: 'text', text: `**Error:** ${message}` }],
    isError: true,
  };
}

// ── Tool definitions ──

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<unknown>;
  handler: (input: Record<string, unknown>) => Promise<ToolResponse>;
}

export function createTools(
  graph: GraphAdapter,
  vector: VectorStore,
  _eventBus: EventBus,
  config: {
    configDir: string;
    dataDir: string;
    projectRoot: string;
    sources: Record<string, SourceConfig>;
    crawlQueue: CrawlQueue;
  },
): ToolDefinition[] {
  return [
    {
      name: 'scrapin_search',
      description: 'Semantic search across all documentation and algorithm nodes in the knowledge graph',
      inputSchema: SearchInput,
      handler: async (raw) => {
        const input = SearchInput.parse(raw);
        logger.info({ query: input.query, limit: input.limit }, 'scrapin_search');

        const vectorResults = await vector.search(input.query, input.limit, input.label_filter);
        const graphResults = await graph.search(input.query, input.limit);

        // Merge and deduplicate
        const seen = new Set<string>();
        const merged: Array<{ id: string; name: string; label: string; score: number; snippet: string }> = [];

        for (const r of vectorResults) {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            merged.push({ id: r.id, name: r.id, label: r.label, score: r.score, snippet: r.text.slice(0, 200) });
          }
        }
        for (const r of graphResults) {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            merged.push({ id: r.id, name: r.name, label: r.label, score: r.score, snippet: r.snippet });
          }
        }

        merged.sort((a, b) => b.score - a.score);
        const top = merged.slice(0, input.limit);

        const meta = makeMetadata('scrapin_search', false);
        const lines = top.map((r, i) =>
          `${i + 1}. **${r.name}** (${r.label}, score: ${r.score.toFixed(2)})\n   ${r.snippet}`,
        );

        return textResponse(`${meta}\n\n## Search Results (${top.length})\n\n${lines.join('\n\n')}`);
      },
    },

    {
      name: 'scrapin_graph_query',
      description: 'N-hop graph traversal from a node, optionally including sibling symbols',
      inputSchema: GraphQueryInput,
      handler: async (raw) => {
        const input = GraphQueryInput.parse(raw);
        logger.info({ startId: input.start_id, hops: input.hops }, 'scrapin_graph_query');

        const subgraph = await graph.traverse(
          input.start_id,
          input.hops,
          input.edge_types as import('../core/graph.js').EdgeType[] | undefined,
        );

        let siblings: import('../core/graph.js').SymbolNode[] = [];
        if (input.include_siblings) {
          siblings = await graph.siblings(input.start_id);
        }

        const meta = makeMetadata('scrapin_graph_query', false);
        const nodeLines = subgraph.nodes.map((n) => `- **${n.id}** (${n.label}): ${JSON.stringify(n.props).slice(0, 150)}`);
        const edgeLines = subgraph.edges.map((e) => `- ${e.from} --[${e.type}]--> ${e.to}`);
        const siblingLines = siblings.map((s) => `- ${s.name} (${s.kind})`);

        let text = `${meta}\n\n## Graph Traversal\n\n### Nodes (${subgraph.nodes.length})\n${nodeLines.join('\n')}\n\n### Edges (${subgraph.edges.length})\n${edgeLines.join('\n')}`;
        if (siblingLines.length > 0) {
          text += `\n\n### Siblings (${siblingLines.length})\n${siblingLines.join('\n')}`;
        }

        return textResponse(text, text.length > 16000);
      },
    },

    {
      name: 'scrapin_algo_search',
      description: 'Search the algorithm library by description, name, or category',
      inputSchema: AlgoSearchInput,
      handler: async (raw) => {
        const input = AlgoSearchInput.parse(raw);
        logger.info({ query: input.query, category: input.category }, 'scrapin_algo_search');

        const results = await vector.search(
          `${input.query} ${input.category ?? ''}`.trim(),
          input.limit,
          'AlgoNode',
        );

        const meta = makeMetadata('scrapin_algo_search', false);
        const lines = results.map((r, i) => `${i + 1}. **${r.id}** (score: ${r.score.toFixed(2)})\n   ${r.text.slice(0, 300)}`);

        return textResponse(`${meta}\n\n## Algorithm Search Results (${results.length})\n\n${lines.join('\n\n')}`);
      },
    },

    {
      name: 'scrapin_algo_detail',
      description: 'Get full detail for one algorithm including code examples and related algorithms',
      inputSchema: AlgoDetailInput,
      handler: async (raw) => {
        const input = AlgoDetailInput.parse(raw);
        logger.info({ name: input.name }, 'scrapin_algo_detail');

        const node = await graph.getNode(input.name);
        if (!node) {
          return errorResponse(`Algorithm "${input.name}" not found`);
        }

        const related = await graph.traverse(input.name, 1, ['RELATED_ALGO']);

        const meta = makeMetadata('scrapin_algo_detail', false);
        const props = node.props;
        let text = `${meta}\n\n## ${props['name'] ?? input.name}\n\n`;
        text += `**Category:** ${props['category'] ?? 'unknown'}\n`;
        text += `**Time complexity:** ${props['complexity_time'] ?? 'unknown'}\n`;
        text += `**Space complexity:** ${props['complexity_space'] ?? 'unknown'}\n`;
        text += `**Tags:** ${(props['tags'] as string) ?? 'none'}\n\n`;
        text += `### Description\n${props['description'] ?? 'No description'}\n\n`;

        if (props['code_ts']) {
          text += `### TypeScript\n\`\`\`typescript\n${props['code_ts']}\n\`\`\`\n\n`;
        }
        if (props['code_py']) {
          text += `### Python\n\`\`\`python\n${props['code_py']}\n\`\`\`\n\n`;
        }

        if (related.nodes.length > 1) {
          text += `### Related Algorithms\n`;
          for (const n of related.nodes) {
            if (n.id !== input.name) {
              text += `- ${n.props['name'] ?? n.id} (${n.props['category'] ?? ''})\n`;
            }
          }
        }

        return textResponse(text, text.length > 16000);
      },
    },

    {
      name: 'scrapin_crawl_source',
      description: 'Trigger an immediate crawl of a documentation source',
      inputSchema: CrawlSourceInput,
      handler: async (raw) => {
        const input = CrawlSourceInput.parse(raw);
        const sourceConfig = config.sources[input.source_key];
        if (!sourceConfig) {
          return errorResponse(`Unknown source_key: ${input.source_key}`);
        }

        const job = config.crawlQueue.enqueue(input.source_key, sourceConfig, input.force);
        logger.info({ sourceKey: input.source_key, force: input.force, jobId: job.id }, 'scrapin_crawl_source');
        const meta = makeMetadata('scrapin_crawl_source', false);
        return textResponse(`${meta}\n\nCrawl queued for source **${input.source_key}** with job_id \`${job.id}\` (force: \`${input.force}\`). Use \`scrapin_cron_status\` to monitor progress.`);
      },
    },

    {
      name: 'scrapin_diff',
      description: 'Show documentation changes since last crawl for a source',
      inputSchema: DiffInput,
      handler: async (raw) => {
        const input = DiffInput.parse(raw);
        logger.info({ sourceKey: input.source_key }, 'scrapin_diff');
        await migrateLegacySourceIds(graph);

        const pages = await graph.getNodesByLabel('Page');
        const sourceId = toSourceId(input.source_key);
        const sourcePages = pages.filter((p) => toSourceId(String(p.props['source_id'] ?? '')) === sourceId);
        const stale = sourcePages.filter((p) => p.props['stale'] === true);

        const meta = makeMetadata('scrapin_diff', false);
        let text = `${meta}\n\n## Documentation Diff: ${input.source_key}\n\n`;
        text += `**Total pages:** ${sourcePages.length}\n`;
        text += `**Stale pages:** ${stale.length}\n\n`;

        if (stale.length > 0) {
          text += `### Stale Pages\n`;
          for (const page of stale.slice(0, 20)) {
            text += `- ${page.props['title'] ?? page.id} (${page.props['url'] ?? 'no url'})\n`;
          }
        }

        return textResponse(text);
      },
    },

    {
      name: 'scrapin_lsp_hover',
      description: 'LSP-style symbol lookup — resolve a symbol name to its documentation',
      inputSchema: LspHoverInput,
      handler: async (raw) => {
        const input = LspHoverInput.parse(raw);
        logger.info({ symbol: input.symbol }, 'scrapin_lsp_hover');

        const results = await graph.search(input.symbol, 1);
        if (results.length === 0) {
          return textResponse(`No documentation found for symbol \`${input.symbol}\``);
        }

        const best = results[0];
        if (!best) {
          return textResponse(`No documentation found for symbol \`${input.symbol}\``);
        }

        const meta = makeMetadata('scrapin_lsp_hover', false);
        return textResponse(`${meta}\n\n## ${best.name}\n\n${best.snippet}`);
      },
    },

    {
      name: 'scrapin_cron_status',
      description: 'Get status of all cron jobs including drift detection information',
      inputSchema: z.object({}),
      handler: async () => {
        logger.info('scrapin_cron_status');
        const meta = makeMetadata('scrapin_cron_status', false);
        const status = config.crawlQueue.status();
        return textResponse(`${meta}\n\n${JSON.stringify(status, null, 2)}`);
      },
    },

    {
      name: 'scrapin_add_source',
      description: 'Register a new documentation source to be crawled',
      inputSchema: AddSourceInput,
      handler: async (raw) => {
        const input = AddSourceInput.parse(raw);
        logger.info({ key: input.key, baseUrl: input.base_url }, 'scrapin_add_source');
        await migrateLegacySourceIds(graph);
        const sourceId = toSourceId(input.key);

        await graph.upsertNode('Source', {
          id: sourceId,
          name: input.name,
          base_url: input.base_url,
          last_crawled: '',
          crawl_config: JSON.stringify({
            sitemap: input.sitemap,
            package_aliases: input.package_aliases,
            concurrency: input.concurrency,
            rps: input.rps,
          }),
        });

        const meta = makeMetadata('scrapin_add_source', false);
        return textResponse(`${meta}\n\nSource **${input.name}** (${input.key}) registered. Run \`scrapin_crawl_source\` to start crawling.`);
      },
    },

    {
      name: 'scrapin_add_algo_source',
      description: 'Register a new algorithm/pattern source to be indexed',
      inputSchema: AddAlgoSourceInput,
      handler: async (raw) => {
        const input = AddAlgoSourceInput.parse(raw);
        logger.info({ key: input.key, url: input.url }, 'scrapin_add_algo_source');

        const meta = makeMetadata('scrapin_add_algo_source', false);
        return textResponse(`${meta}\n\nAlgorithm source **${input.key}** registered. Run \`algo:index\` to start indexing.`);
      },
    },

    {
      name: 'scrapin_code_drift_scan',
      description: 'Trigger an immediate codebase drift scan to detect missing docs, deprecated usage, and stale references',
      inputSchema: CodeDriftScanInput,
      handler: async (raw) => {
        const input = CodeDriftScanInput.parse(raw);
        const root = input.project_root ?? config.projectRoot;
        logger.info({ projectRoot: root }, 'scrapin_code_drift_scan');

        try {
          const { CodeDriftScanner } = await import('../drift/code-drift.js');
          const scanner = new CodeDriftScanner(graph, root);
          const report = await scanner.scan();

          const { formatCodeDriftReport, saveDriftReport } = await import('../drift/drift-reporter.js');
          await saveDriftReport(report, 'code-drift', config.dataDir);

          const meta = makeMetadata('scrapin_code_drift_scan', false);
          return textResponse(`${meta}\n\n${formatCodeDriftReport(report)}`);
        } catch (err) {
          return errorResponse(`Code drift scan failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      name: 'scrapin_code_drift_report',
      description: 'Get the latest codebase drift report',
      inputSchema: z.object({}),
      handler: async () => {
        logger.info('scrapin_code_drift_report');
        const { readFile } = await import('node:fs/promises');
        const { join } = await import('node:path');
        const { readdirSync } = await import('node:fs');

        try {
          const reportsDir = join(config.dataDir, 'drift-reports');
          const files = readdirSync(reportsDir)
            .filter((f: string) => f.startsWith('code-drift-'))
            .sort()
            .reverse();

          if (files.length === 0) {
            return textResponse('No code drift reports found. Run `scrapin_code_drift_scan` first.');
          }

          const latest = files[0];
          if (!latest) {
            return textResponse('No code drift reports found.');
          }
          const raw = await readFile(join(reportsDir, latest), 'utf-8');
          const report = JSON.parse(raw);

          const { formatCodeDriftReport } = await import('../drift/drift-reporter.js');
          const meta = makeMetadata('scrapin_code_drift_report', true);
          return textResponse(`${meta}\n\n${formatCodeDriftReport(report)}`);
        } catch {
          return textResponse('No code drift reports available yet.');
        }
      },
    },

    {
      name: 'scrapin_agent_drift_status',
      description: 'List all agents with their drift scores and summaries',
      inputSchema: AgentDriftStatusInput,
      handler: async () => {
        logger.info('scrapin_agent_drift_status');

        try {
          const { AgentDriftDetector } = await import('../drift/agent-drift.js');
          const detector = new AgentDriftDetector(graph, join(config.projectRoot, '.claude', 'agents'), config.configDir);
          const reports = await detector.scan();

          const meta = makeMetadata('scrapin_agent_drift_status', false);
          const lines = reports.map((r) =>
            `| ${r.agent_id} | ${r.drift_type} | ${r.drift_score}/10 | ${r.changed_sections.join(', ') || 'none'} |`,
          );

          let text = `${meta}\n\n## Agent Drift Status\n\n`;
          text += `| Agent | Type | Score | Changed Sections |\n|---|---|---|---|\n`;
          text += lines.join('\n');
          text += `\n\n**Total agents:** ${reports.length}\n`;
          text += `**Drifted:** ${reports.filter((r) => r.drift_score > 0).length}\n`;
          text += `**High severity (>5):** ${reports.filter((r) => r.drift_score > 5).length}`;

          return textResponse(text);
        } catch (err) {
          return errorResponse(`Agent drift scan failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      name: 'scrapin_agent_drift_detail',
      description: 'Get full drift report for one specific agent',
      inputSchema: AgentDriftDetailInput,
      handler: async (raw) => {
        const input = AgentDriftDetailInput.parse(raw);
        logger.info({ agentId: input.agent_id }, 'scrapin_agent_drift_detail');

        try {
          const { AgentDriftDetector } = await import('../drift/agent-drift.js');
          const detector = new AgentDriftDetector(graph, join(config.projectRoot, '.claude', 'agents'), config.configDir);
          const reports = await detector.scan();
          const report = reports.find((r) => r.agent_id === input.agent_id);

          if (!report) {
            return errorResponse(`Agent "${input.agent_id}" not found`);
          }

          const meta = makeMetadata('scrapin_agent_drift_detail', false);
          let text = `${meta}\n\n## Agent Drift Detail: ${input.agent_id}\n\n`;
          text += `**Drift type:** ${report.drift_type}\n`;
          text += `**Drift score:** ${report.drift_score}/10\n`;
          text += `**File:** ${report.file_path}\n`;
          text += `**Previous hash:** ${report.previous_hash}\n`;
          text += `**Current hash:** ${report.current_hash}\n`;
          text += `**Changed sections:** ${report.changed_sections.join(', ') || 'none'}\n`;
          text += `**Recommendation:** ${report.recommendation}\n`;
          text += `**Detected at:** ${report.detected_at}\n`;

          if (report.contradictions && report.contradictions.length > 0) {
            text += `\n### Contradictions\n`;
            for (const c of report.contradictions) {
              text += `- **${c.agent_a}** vs **${c.agent_b}**: ${c.conflict_description}\n`;
            }
          }

          return textResponse(text);
        } catch (err) {
          return errorResponse(`Failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      name: 'scrapin_agent_drift_acknowledge',
      description: 'Mark agent drift as intentional and update the baseline hash',
      inputSchema: AgentDriftAckInput,
      handler: async (raw) => {
        const input = AgentDriftAckInput.parse(raw);
        logger.info({ agentId: input.agent_id }, 'scrapin_agent_drift_acknowledge');

        try {
          const { AgentDriftDetector } = await import('../drift/agent-drift.js');
          const detector = new AgentDriftDetector(graph, join(config.projectRoot, '.claude', 'agents'), config.configDir);
          await detector.acknowledgeAgentDrift(input.agent_id, input.notes);

          const meta = makeMetadata('scrapin_agent_drift_acknowledge', false);
          return textResponse(`${meta}\n\nAgent **${input.agent_id}** drift acknowledged. Baseline updated.`);
        } catch (err) {
          return errorResponse(`Failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      name: 'scrapin_agent_drift_diff',
      description: 'Show the exact markdown diff for an agent since its baseline',
      inputSchema: AgentDriftDiffInput,
      handler: async (raw) => {
        const input = AgentDriftDiffInput.parse(raw);
        logger.info({ agentId: input.agent_id }, 'scrapin_agent_drift_diff');

        try {
          const { AgentDriftDetector } = await import('../drift/agent-drift.js');
          const detector = new AgentDriftDetector(graph, join(config.projectRoot, '.claude', 'agents'), config.configDir);
          const diff = await detector.getAgentDiff(input.agent_id);

          const meta = makeMetadata('scrapin_agent_drift_diff', false);
          return textResponse(`${meta}\n\n## Diff for ${input.agent_id}\n\n\`\`\`diff\n${diff}\n\`\`\``);
        } catch (err) {
          return errorResponse(`Failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      name: 'scrapin_graph_stats',
      description: 'Get node/edge counts, index health, and last crawl times',
      inputSchema: GraphStatsInput,
      handler: async () => {
        logger.info('scrapin_graph_stats');
        const stats = await graph.stats();

        const meta = makeMetadata('scrapin_graph_stats', false);
        let text = `${meta}\n\n## Knowledge Graph Statistics\n\n`;
        text += `| Metric | Count |\n|---|---|\n`;
        for (const [key, value] of Object.entries(stats)) {
          text += `| ${key} | ${value} |\n`;
        }
        text += `\n**Vector store entries:** ${vector.size}`;

        return textResponse(text);
      },
    },
  ];
}

// Helper for join in handler closures
function join(...parts: string[]): string {
  return parts.join('/');
}
