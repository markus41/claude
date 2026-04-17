import { z } from 'zod';
import pino from 'pino';
import { createHash } from 'node:crypto';
import { type GraphAdapter } from '../core/graph.js';
import { type VectorStore } from '../core/vector.js';
import { type EventBus } from '../core/event-bus.js';
import { toSourceId } from '../core/ids.js';
import { migrateLegacySourceIds } from '../core/source-migration.js';
import type { AgentDriftDetector } from '../drift/agent-drift.js';
import { type CrawlQueue } from '../crawler/crawl-queue.js';
import { type SourceConfig } from '../config/loader.js';
import { readCrawlTelemetry } from '../crawler/telemetry.js';
import { emitWebhook } from '../integrations/webhook.js';

// Shared helper — collapses 11 copies of the same ternary scattered through
// the tool handlers.
function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
import {
  SearchInput,
  GraphQueryInput,
  AlgoSearchInput,
  AlgoDetailInput,
  CronStatusInput,
  CrawlSourceInput,
  DiffInput,
  LspHoverInput,
  AddSourceInput,
  AddAlgoSourceInput,
  CodeDriftScanInput,
  AgentDriftStatusInput,
  AgentDriftDetailInput,
  AgentDriftAckInput,
  AgentDriftDiffInput,
  GraphStatsInput,
  CrawlFailuresInput,
  SourceHealthInput,
  CodexBootstrapInput,
} from './schemas.js';

// Tool input schemas live in `./schemas.js` — keep all Zod shapes there so
// new tools cannot accidentally reference undeclared schemas.

const logger = pino({ name: 'mcp:tools' });

// ── Response helpers ──

interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

interface CursorPayload {
  tool: string;
  offset: number;
  queryHash: string;
  ts: number;
}

interface PaginationResult<T> {
  rows: T[];
  offset: number;
  pageSize: number;
  totalRows: number;
  nextCursor?: string;
}

function makeMetadata(source: string, cacheHit: boolean, ttlRemaining?: number): string {
  return [
    `**Source:** ${source}`,
    `**Timestamp:** ${new Date().toISOString()}`,
    `**Cache hit:** ${cacheHit}`,
    ttlRemaining !== undefined ? `**TTL remaining:** ${ttlRemaining}s` : '',
  ].filter(Boolean).join(' | ');
}

function textResponse(text: string, pagination?: Omit<PaginationResult<unknown>, 'rows'>): ToolResponse {
  const paginationBlock = pagination
    ? [
      '',
      '## Pagination',
      `- offset: ${pagination.offset}`,
      `- page_size: ${pagination.pageSize}`,
      `- returned: ${Math.max(0, Math.min(pagination.totalRows - pagination.offset, pagination.pageSize))}`,
      `- total_rows: ${pagination.totalRows}`,
      `- next_cursor: ${pagination.nextCursor ? `\`${pagination.nextCursor}\`` : 'null'}`,
    ].join('\n')
    : '';
  const joined = `${text}${paginationBlock}`;
  return {
    content: [{ type: 'text', text: joined.slice(0, 16384) }],
  };
}

function hashQuery(tool: string, query: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify({ tool, query })).digest('hex');
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
}

function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as Partial<CursorPayload>;
    if (
      typeof parsed.tool !== 'string'
      || typeof parsed.offset !== 'number'
      || !Number.isFinite(parsed.offset)
      || parsed.offset < 0
      || typeof parsed.queryHash !== 'string'
      || typeof parsed.ts !== 'number'
    ) {
      throw new Error('Malformed cursor payload');
    }
    return { tool: parsed.tool, offset: parsed.offset, queryHash: parsed.queryHash, ts: parsed.ts };
  } catch {
    throw new Error('Invalid cursor encoding');
  }
}

// Safe wrapper around paginateRows — collapses the `try { page = ... }
// catch { return errorResponse(...) }` block that was copy-pasted into 5+
// handlers.
type PaginateOutcome<T> =
  | { ok: true; page: PaginationResult<T> }
  | { ok: false; response: ToolResponse };

export function safePaginate<T>(
  tool: string,
  rows: T[],
  params: { cursor?: string; page_size: number },
  query: Record<string, unknown>,
): PaginateOutcome<T> {
  try {
    return { ok: true, page: paginateRows(tool, rows, params, query) };
  } catch (err) {
    return { ok: false, response: errorResponse(`Invalid cursor: ${errMsg(err)}`) };
  }
}

export function paginateRows<T>(
  tool: string,
  rows: T[],
  params: { cursor?: string; page_size: number },
  query: Record<string, unknown>,
): PaginationResult<T> {
  const queryHash = hashQuery(tool, query);
  let offset = 0;
  if (params.cursor) {
    const payload = decodeCursor(params.cursor);
    if (payload.tool !== tool) throw new Error(`Cursor is for tool "${payload.tool}", not "${tool}"`);
    if (payload.queryHash !== queryHash) throw new Error('Cursor does not match current query parameters');
    offset = payload.offset;
  }

  const pageSize = params.page_size;
  const slice = rows.slice(offset, offset + pageSize);
  const nextOffset = offset + slice.length;
  const nextCursor = nextOffset < rows.length
    ? encodeCursor({ tool, offset: nextOffset, queryHash, ts: Date.now() })
    : undefined;

  return {
    rows: slice,
    offset,
    pageSize,
    totalRows: rows.length,
    nextCursor,
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
  // Lazily load and cache a single AgentDriftDetector per createTools scope.
  // Collapses what was previously four verbatim `new AgentDriftDetector(...)`
  // constructions across agent-drift-related handlers.
  let detectorPromise: Promise<AgentDriftDetector> | undefined;
  const getDetector = async (): Promise<AgentDriftDetector> => {
    if (!detectorPromise) {
      detectorPromise = (async () => {
        const { AgentDriftDetector } = await import('../drift/agent-drift.js');
        return new AgentDriftDetector(
          graph,
          join(config.projectRoot, '.claude', 'agents'),
          config.configDir,
        );
      })();
    }
    return detectorPromise;
  };

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

        merged.sort((a, b) => {
          const freshnessA = a.id.includes('page::') ? 0.05 : 0;
          const freshnessB = b.id.includes('page::') ? 0.05 : 0;
          const centralityA = a.label === 'Symbol' ? 0.1 : 0;
          const centralityB = b.label === 'Symbol' ? 0.1 : 0;
          // Freshness decay keyed off `now` is a planned extension; for now
          // the score is just base + modifiers.
          const scoreA = a.score + freshnessA + centralityA;
          const scoreB = b.score + freshnessB + centralityB;
          return scoreB - scoreA;
        });
        const top = merged.slice(0, input.limit);
        const pp = safePaginate('scrapin_search', top, input, {
          query: input.query,
          limit: input.limit,
          label_filter: input.label_filter,
        });
        if (!pp.ok) return pp.response;
        const page = pp.page;

        const meta = makeMetadata('scrapin_search', false);
        const lines = page.rows.map((r, i) =>
          `${page.offset + i + 1}. **${r.name}** (${r.label}, score: ${r.score.toFixed(2)})\n   ${r.snippet}`,
        );

        return textResponse(
          `${meta}\n\n## Search Results (${top.length})\n\n${lines.join('\n\n')}`,
          page,
        );
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

        const allRows = [
          ...subgraph.nodes.map((n) => ({ kind: 'node' as const, line: `- **${n.id}** (${n.label}): ${JSON.stringify(n.props).slice(0, 150)}` })),
          ...subgraph.edges.map((e) => ({ kind: 'edge' as const, line: `- ${e.from} --[${e.type}]--> ${e.to}` })),
          ...siblings.map((s) => ({ kind: 'sibling' as const, line: `- ${s.name} (${s.kind})` })),
        ];

        const pp = safePaginate('scrapin_graph_query', allRows, input, {
          start_id: input.start_id,
          hops: input.hops,
          edge_types: input.edge_types,
          include_siblings: input.include_siblings,
        });
        if (!pp.ok) return pp.response;
        const page = pp.page;

        const nodeLines = page.rows.filter((r) => r.kind === 'node').map((r) => r.line);
        const edgeLines = page.rows.filter((r) => r.kind === 'edge').map((r) => r.line);
        const siblingLines = page.rows.filter((r) => r.kind === 'sibling').map((r) => r.line);

        const meta = makeMetadata('scrapin_graph_query', false);
        let text = `${meta}\n\n## Graph Traversal\n\n### Nodes (${subgraph.nodes.length})\n${nodeLines.join('\n') || '- (none on this page)'}\n\n### Edges (${subgraph.edges.length})\n${edgeLines.join('\n') || '- (none on this page)'}`;
        if (siblings.length > 0) {
          text += `\n\n### Siblings (${siblings.length})\n${siblingLines.join('\n') || '- (none on this page)'}`;
        }

        return textResponse(text, page);
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
        const pp = safePaginate('scrapin_algo_search', results, input, {
          query: input.query,
          category: input.category,
          language: input.language,
          limit: input.limit,
        });
        if (!pp.ok) return pp.response;
        const page = pp.page;

        const meta = makeMetadata('scrapin_algo_search', false);
        const lines = page.rows.map((r, i) => `${page.offset + i + 1}. **${r.id}** (score: ${r.score.toFixed(2)})\n   ${r.text.slice(0, 300)}`);

        return textResponse(`${meta}\n\n## Algorithm Search Results (${results.length})\n\n${lines.join('\n\n')}`, page);
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

        return textResponse(text);
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

        const pp = safePaginate('scrapin_diff', stale, input, {
          source_key: input.source_key,
          page_id: input.page_id,
        });
        if (!pp.ok) return pp.response;
        const page = pp.page;

        if (stale.length > 0) {
          text += `### Stale Pages\n`;
          for (const stalePage of page.rows) {
            text += `- ${stalePage.props['title'] ?? stalePage.id} (${stalePage.props['url'] ?? 'no url'})\n`;
          }
        }

        return textResponse(text, page);
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
      inputSchema: CronStatusInput,
      handler: async (raw) => {
        const input = CronStatusInput.parse(raw);
        logger.info('scrapin_cron_status');
        // The cron status response is a fixed 8-row summary; pagination is
        // only exposed for API uniformity and is a no-op here.
        void input;
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
          const reportRaw = await scanner.scan();
          const { applyDriftSuppressions } = await import('../drift/suppression.js');
          const report = await applyDriftSuppressions(config.configDir, reportRaw);

          const { formatCodeDriftReport, saveDriftReport } = await import('../drift/drift-reporter.js');
          await saveDriftReport(report, 'code-drift', config.dataDir);

          const meta = makeMetadata('scrapin_code_drift_scan', false);
          return textResponse(`${meta}\n\n${formatCodeDriftReport(report)}`);
        } catch (err) {
          return errorResponse(`Code drift scan failed: ${errMsg(err)}`);
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
      handler: async (raw) => {
        const input = AgentDriftStatusInput.parse(raw);
        logger.info('scrapin_agent_drift_status');

        try {
          const detector = await getDetector();
          const reports = await detector.scan();

          const pp = safePaginate('scrapin_agent_drift_status', reports, input, {});
          if (!pp.ok) return pp.response;
          const page = pp.page;

          const meta = makeMetadata('scrapin_agent_drift_status', false);
          const lines = page.rows.map((r) =>
            `| ${r.agent_id} | ${r.drift_type} | ${r.drift_score}/10 | ${r.changed_sections.join(', ') || 'none'} |`,
          );

          let text = `${meta}\n\n## Agent Drift Status\n\n`;
          text += `| Agent | Type | Score | Changed Sections |\n|---|---|---|---|\n`;
          text += lines.join('\n');
          text += `\n\n**Total agents:** ${reports.length}\n`;
          text += `**Drifted:** ${reports.filter((r) => r.drift_score > 0).length}\n`;
          text += `**High severity (>5):** ${reports.filter((r) => r.drift_score > 5).length}`;
          if (reports.some((r) => r.drift_score > 7)) {
            await emitWebhook('drift.agent.high', { count: reports.filter((r) => r.drift_score > 7).length });
          }

          return textResponse(text, page);
        } catch (err) {
          return errorResponse(`Agent drift scan failed: ${errMsg(err)}`);
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
          const detector = await getDetector();
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
          return errorResponse(`Failed: ${errMsg(err)}`);
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
          const detector = await getDetector();
          await detector.acknowledgeAgentDrift(input.agent_id, input.notes);

          const meta = makeMetadata('scrapin_agent_drift_acknowledge', false);
          return textResponse(`${meta}\n\nAgent **${input.agent_id}** drift acknowledged. Baseline updated.`);
        } catch (err) {
          return errorResponse(`Failed: ${errMsg(err)}`);
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
          const detector = await getDetector();
          const diff = await detector.getAgentDiff(input.agent_id);

          const meta = makeMetadata('scrapin_agent_drift_diff', false);
          return textResponse(`${meta}\n\n## Diff for ${input.agent_id}\n\n\`\`\`diff\n${diff}\n\`\`\``);
        } catch (err) {
          return errorResponse(`Failed: ${errMsg(err)}`);
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

    {
      name: 'scrapin_crawl_failures',
      description: 'List recent crawl failures with grouped triage hints',
      inputSchema: CrawlFailuresInput,
      handler: async (raw) => {
        const input = CrawlFailuresInput.parse(raw);
        const telemetry = await readCrawlTelemetry(config.dataDir);
        const filtered = telemetry.failures
          .filter((f) => !input.source_key || f.sourceKey === input.source_key)
          .slice(0, input.limit);
        if (filtered.length === 0) {
          return textResponse('No crawl failures recorded.');
        }
        const lines = filtered.map((f) => `- [${f.at}] **${f.sourceKey}** ${f.url}\n  - ${f.error}`);
        return textResponse(`## Crawl Failures (${filtered.length})\n\n${lines.join('\n')}`);
      },
    },

    {
      name: 'scrapin_source_health',
      description: 'Show A-F health scores by source based on success ratio and freshness',
      inputSchema: SourceHealthInput,
      handler: async () => {
        const telemetry = await readCrawlTelemetry(config.dataDir);
        const rows = Object.values(telemetry.health).map((h) => {
          const total = h.successCount + h.failureCount;
          const successRate = total === 0 ? 1 : h.successCount / total;
          const freshnessPenalty = Math.min(0.4, h.avgFreshnessHours / 72);
          const score = Math.max(0, Math.min(1, successRate - freshnessPenalty));
          const grade = score >= 0.9 ? 'A' : score >= 0.8 ? 'B' : score >= 0.7 ? 'C' : score >= 0.6 ? 'D' : 'F';
          return `| ${h.sourceKey} | ${grade} | ${(successRate * 100).toFixed(0)}% | ${h.avgFreshnessHours.toFixed(1)}h |`;
        });
        return textResponse(`## Source Health\n\n| Source | Grade | Success Rate | Avg Freshness |\n|---|---|---|---|\n${rows.join('\n') || '| n/a | n/a | n/a | n/a |'}`);
      },
    },

    {
      name: 'scrapin_codex_bootstrap',
      description: 'Generate Codex MCP + AGENTS bootstrap for this plugin',
      inputSchema: CodexBootstrapInput,
      handler: async (raw) => {
        const input = CodexBootstrapInput.parse(raw);
        const root = input.project_root ?? config.projectRoot;
        const snippet = [
          'codex mcp add scrapin --command node --arg plugins/scrapin-aint-easy/dist/cli.js --arg --mcp',
          '',
          '[mcp_servers.scrapin]',
          'command = "node"',
          'args = ["plugins/scrapin-aint-easy/dist/cli.js", "--mcp"]',
        ].join('\n');

        if (input.write_agents_file) {
          const { writeFile } = await import('node:fs/promises');
          await writeFile(
            join(root, 'AGENTS.md'),
            'Always use the `scrapin` MCP server for docs crawling, graph search, and drift checks before manual scraping.\n',
            { encoding: 'utf-8' },
          );
        }
        return textResponse(`## Codex Bootstrap\n\n\`\`\`\n${snippet}\n\`\`\`\n\nWrote AGENTS.md: ${input.write_agents_file ? 'yes' : 'no'}`);
      },
    },
  ];
}

// Helper for join in handler closures
function join(...parts: string[]): string {
  return parts.join('/');
}
