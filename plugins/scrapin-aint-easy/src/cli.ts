#!/usr/bin/env node

import pino from 'pino';
import { startMcpServer, createScrapinServer } from './index.js';

const logger = pino({ name: 'scrapin-cli' });

const HELP_TEXT = `scrapin-ain't-easy — Documentation Intelligence Engine

Usage: scrapin-aint-easy [flags]

Flags:
  --mcp                Start the MCP server on stdio (default if no flags)
  --lsp                Start the LSP server on stdio
  --cron               Enable the cron scheduler alongside --mcp
  --cron-only          Run the cron scheduler with no MCP/LSP
  --run-job <id>       Run a single job once and exit
  --graph-stats        Print knowledge-graph stats and exit
  --version            Print version and exit
  --help, -h           Show this help text and exit

Valid job ids for --run-job:
  full-sweep, staleness-check, missing-doc-scan, openapi-sync,
  embedding-rebuild, algo-sweep, code-drift-scan, agent-drift-scan

Environment:
  NEO4J_URI                        Switch graph backend to Neo4j
  SCRAPIN_PUPPETEER_NO_SANDBOX=1   Opt in to launching Puppeteer without the sandbox
  SCRAPIN_ALERT_WEBHOOK_URL        https webhook for alerts (rejected if private/loopback)
  SCRAPIN_GIT_HOSTS                Additional comma-separated git hosts beyond the default list
`;

const KNOWN_FLAGS = new Set([
  '--mcp', '--lsp', '--cron', '--cron-only', '--run-job',
  '--graph-stats', '--version', '--help', '-h',
]);

// In MCP stdio mode, stdout is the protocol channel — any non-JSON write
// corrupts the host's message parser. Route all status chatter to stderr.
function status(msg: string): void {
  process.stderr.write(msg + '\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP_TEXT);
    process.exit(0);
  }
  if (args.includes('--version')) {
    process.stdout.write('scrapin-aint-easy v1.0.0\n');
    process.exit(0);
  }

  // Reject unknown flags (except values for --run-job) so a typo does not
  // silently launch the full server.
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (!a.startsWith('-')) continue;
    if (KNOWN_FLAGS.has(a)) continue;
    // --run-job <value>: skip the value slot
    if (i > 0 && args[i - 1] === '--run-job') continue;
    process.stderr.write(`Unknown flag: ${a}\nRun --help for usage.\n`);
    process.exit(2);
  }

  const enableMcp = args.includes('--mcp') || args.length === 0;
  const enableLsp = args.includes('--lsp');
  const enableCron = args.includes('--cron') || args.includes('--cron-only') || args.includes('--mcp');
  const cronOnly = args.includes('--cron-only');
  const runJob = args.includes('--run-job');
  const graphStats = args.includes('--graph-stats');

  const projectRoot = process.cwd();
  const configDir = 'config';
  const dataDir = 'data';

  // Startup banner goes to stderr to keep stdout clean for MCP.
  status(`
╔══════════════════════════════════════╗
║     scrapin-ain't-easy v1.0.0       ║
║  Documentation Intelligence Engine  ║
╚══════════════════════════════════════╝
`);

  if (graphStats) {
    const { graph } = await createScrapinServer({ projectRoot, configDir, dataDir, enableCron: false });
    const stats = await graph.stats();
    status('Knowledge Graph Statistics:');
    for (const [key, value] of Object.entries(stats)) {
      status(`  ${key}: ${value}`);
    }
    process.exit(0);
  }

  if (runJob) {
    const jobIdx = args.indexOf('--run-job');
    const jobId = args[jobIdx + 1];
    if (!jobId) {
      process.stderr.write('Usage: --run-job <job-id>\n');
      process.exit(1);
    }

    const { scheduler } = await createScrapinServer({ projectRoot, configDir, dataDir, enableCron: true });
    status(`Running job: ${jobId}`);
    await scheduler.runJobNow(jobId);
    status('Job completed');
    process.exit(0);
  }

  if (cronOnly) {
    const { scheduler } = await createScrapinServer({ projectRoot, configDir, dataDir, enableCron: true });
    scheduler.start();
    status('Cron scheduler running. Press Ctrl+C to stop.');

    process.on('SIGINT', () => {
      scheduler.stop();
      process.exit(0);
    });
    return;
  }

  if (enableLsp) {
    try {
      const { startLspServer } = await import('./lsp-server.js');
      const { graph, vector } = await createScrapinServer({ projectRoot, configDir, dataDir, enableCron });
      const { loadSources } = await import('./config/loader.js');
      const sources = await loadSources(configDir);
      await startLspServer(
        { transport: 'stdio' },
        graph,
        vector,
        sources,
      );
      logger.info('LSP server started');
    } catch (err) {
      logger.error({ err }, 'Failed to start LSP server');
    }
  }

  if (enableMcp) {
    status('Starting MCP server...');
    status(`  Config: ${configDir}/`);
    status(`  Data:   ${dataDir}/`);
    status(`  Cron:   ${enableCron ? 'enabled' : 'disabled'}`);
    status(`  LSP:    ${enableLsp ? 'enabled' : 'disabled'}`);

    await startMcpServer({
      projectRoot,
      configDir,
      dataDir,
      enableCron,
    });
  }
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
