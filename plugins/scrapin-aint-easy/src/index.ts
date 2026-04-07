import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import pino from 'pino';
import { GraphAdapter } from './core/graph.js';
import { VectorStore } from './core/vector.js';
import { EventBus } from './core/event-bus.js';
import { createTools, type ToolDefinition } from './mcp/tools.js';
import { createResources, type ResourceDefinition } from './mcp/resources.js';
import { createPrompts, type PromptDefinition } from './mcp/prompts.js';
import { CronScheduler } from './scheduler/cron.js';
import { createFullSweepJob } from './scheduler/jobs/full-sweep.js';
import { createStalenessCheckJob } from './scheduler/jobs/staleness-check.js';
import { createMissingDocScanJob } from './scheduler/jobs/missing-doc-scan.js';
import { createEmbeddingRebuildJob } from './scheduler/jobs/embedding-rebuild.js';
import { loadConfig, loadSources, type SourceConfig } from './config/loader.js';
import { DocCrawler } from './crawler/crawler.js';
import { CrawlQueue } from './crawler/crawl-queue.js';

const logger = pino({ name: 'scrapin-mcp' });

export interface ScrapinServerOptions {
  dataDir?: string;
  configDir?: string;
  projectRoot?: string;
  enableCron?: boolean;
}

export async function createScrapinServer(options: ScrapinServerOptions = {}): Promise<{
  server: Server;
  graph: GraphAdapter;
  vector: VectorStore;
  eventBus: EventBus;
  scheduler: CronScheduler;
}> {
  const projectRoot = options.projectRoot ?? process.cwd();
  const configDir = options.configDir ?? 'config';
  const dataDir = options.dataDir ?? 'data';

  const config = await loadConfig(configDir);
  const sources = await loadSources(configDir);

  // Initialize core services
  const eventBus = new EventBus();
  const graph = new GraphAdapter(dataDir, configDir);
  const vector = new VectorStore(dataDir);
  const crawlQueue = new CrawlQueue(eventBus);
  const crawler = new DocCrawler(graph, vector, config, eventBus);

  await graph.initialize();
  await vector.initialize();
  await crawler.initialize();

  crawlQueue.attachWorker(async ({ sourceKey, sourceConfig }) => {
    const stats = await crawler.crawlSource(sourceKey, sourceConfig);
    return { pagesProcessed: stats.pagesProcessed };
  });

  logger.info('Core services initialized');

  // Create MCP tools, resources, prompts
  const toolConfig = { configDir, dataDir, projectRoot, sources, crawlQueue };
  const tools = createTools(graph, vector, eventBus, toolConfig);
  const resources = createResources(graph, vector, { dataDir, configDir });
  const prompts = createPrompts();

  // Create MCP server
  const server = new Server(
    { name: 'scrapin-aint-easy', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: {
        type: 'object' as const,
        properties: Object.fromEntries(
          Object.entries((t.inputSchema as { shape?: Record<string, unknown> }).shape ?? {}).map(([key]) => [
            key,
            { type: 'string' },
          ]),
        ),
      },
    })),
  }));

  const toolMap = new Map<string, ToolDefinition>(tools.map((t) => [t.name, t]));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const tool = toolMap.get(toolName);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
    }

    try {
      const args = (request.params.arguments ?? {}) as Record<string, unknown>;
      return await tool.handler(args);
    } catch (err) {
      logger.error({ tool: toolName, err }, 'Tool execution failed');
      return {
        content: [{ type: 'text', text: `Tool error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  });

  // Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  }));

  const resourceMap = new Map<string, ResourceDefinition>(resources.map((r) => [r.uri, r]));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = resourceMap.get(request.params.uri);
    if (!resource) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }
    const content = await resource.handler();
    return {
      contents: [{ uri: request.params.uri, mimeType: resource.mimeType, text: content }],
    };
  });

  // Register prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: prompts.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  }));

  const promptMap = new Map<string, PromptDefinition>(prompts.map((p) => [p.name, p]));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const prompt = promptMap.get(request.params.name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${request.params.name}`);
    }
    const args = (request.params.arguments ?? {}) as Record<string, string>;
    const messages = await prompt.handler(args);
    return { messages };
  });

  // Set up scheduler
  const scheduler = new CronScheduler(
    config.cron.maxConcurrentJobs,
    dataDir,
    eventBus,
  );

  if (options.enableCron !== false) {
    const queueCrawl = async (key: string, sourceConfig: SourceConfig) => {
      const job = crawlQueue.enqueue(key, sourceConfig, false);
      logger.info({ key, jobId: job.id }, 'Crawl enqueued by cron');
    };

    scheduler.registerJobWithDef({
      id: 'full-sweep',
      schedule: '0 3 * * *',
      description: 'Full documentation sweep (daily 3am)',
      expectedIntervalMs: 24 * 60 * 60 * 1000,
      handler: createFullSweepJob(graph, vector, configDir, queueCrawl),
    });

    scheduler.registerJobWithDef({
      id: 'staleness-check',
      schedule: '*/30 * * * *',
      description: 'Check for stale documentation pages (every 30 min)',
      expectedIntervalMs: 30 * 60 * 1000,
      handler: createStalenessCheckJob(graph),
    });

    scheduler.registerJobWithDef({
      id: 'missing-doc-scan',
      schedule: '0 */6 * * *',
      description: 'Scan for undocumented symbols (every 6 hours)',
      expectedIntervalMs: 6 * 60 * 60 * 1000,
      handler: createMissingDocScanJob(graph),
    });

    scheduler.registerJobWithDef({
      id: 'embedding-rebuild',
      schedule: '0 4 * * 0',
      description: 'Rebuild vector index (weekly Sunday 4am)',
      expectedIntervalMs: 7 * 24 * 60 * 60 * 1000,
      handler: createEmbeddingRebuildJob(vector),
    });

    scheduler.registerJobWithDef({
      id: 'agent-drift-scan',
      schedule: '*/15 * * * *',
      description: 'Agent prompt drift detection (every 15 minutes)',
      expectedIntervalMs: 15 * 60 * 1000,
      handler: async () => {
        const { createAgentDriftScanJob } = await import('./scheduler/jobs/agent-drift-scan.js');
        const job = createAgentDriftScanJob(graph, eventBus, `${projectRoot}/.claude/agents`, configDir, dataDir);
        await job();
      },
    });

    scheduler.registerJobWithDef({
      id: 'code-drift-scan',
      schedule: '0 */4 * * *',
      description: 'Codebase API drift detection (every 4 hours)',
      expectedIntervalMs: 4 * 60 * 60 * 1000,
      handler: async () => {
        const { createCodeDriftScanJob } = await import('./scheduler/jobs/code-drift-scan.js');
        const job = createCodeDriftScanJob(graph, eventBus, projectRoot, dataDir);
        await job();
      },
    });

    scheduler.registerJobWithDef({
      id: 'algo-sweep',
      schedule: '0 2 * * 0',
      description: 'Re-index algorithm sources (weekly Sunday 2am)',
      expectedIntervalMs: 7 * 24 * 60 * 60 * 1000,
      handler: async () => {
        const { createAlgoSweepJob } = await import('./scheduler/jobs/algo-sweep.js');
        const job = createAlgoSweepJob(graph, vector, eventBus, configDir);
        await job();
      },
    });

    scheduler.registerJobWithDef({
      id: 'openapi-sync',
      schedule: '0 1 * * 1',
      description: 'OpenAPI spec sync (weekly Monday 1am)',
      expectedIntervalMs: 7 * 24 * 60 * 60 * 1000,
      handler: async () => {
        const { createOpenApiSyncJob } = await import('./scheduler/jobs/openapi-sync.js');
        const job = createOpenApiSyncJob(graph, vector, configDir);
        await job();
      },
    });

    await scheduler.initialize();
  }

  logger.info({
    tools: tools.length,
    resources: resources.length,
    prompts: prompts.length,
    cronJobs: scheduler.status().length,
  }, 'scrapin-aint-easy MCP server ready');

  return { server, graph, vector, eventBus, scheduler };
}

export async function startMcpServer(options: ScrapinServerOptions = {}): Promise<void> {
  const { server, scheduler } = await createScrapinServer(options);

  if (options.enableCron !== false) {
    scheduler.start();
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server running on stdio');
}
