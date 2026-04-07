#!/usr/bin/env node

import pino from 'pino';
import { startMcpServer, createScrapinServer } from './index.js';

const logger = pino({ name: 'scrapin-cli' });

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const enableMcp = args.includes('--mcp') || args.length === 0;
  const enableLsp = args.includes('--lsp');
  const enableCron = args.includes('--cron') || args.includes('--cron-only') || args.includes('--mcp');
  const cronOnly = args.includes('--cron-only');
  const runJob = args.includes('--run-job');
  const graphStats = args.includes('--graph-stats');

  const projectRoot = process.cwd();
  const configDir = 'config';
  const dataDir = 'data';

  // Print startup banner
  console.log(`
╔══════════════════════════════════════╗
║     scrapin-ain't-easy v1.0.0       ║
║  Documentation Intelligence Engine  ║
╚══════════════════════════════════════╝
`);

  if (graphStats) {
    const { graph } = await createScrapinServer({ projectRoot, configDir, dataDir, enableCron: false });
    const stats = await graph.stats();
    console.log('Knowledge Graph Statistics:');
    for (const [key, value] of Object.entries(stats)) {
      console.log(`  ${key}: ${value}`);
    }
    process.exit(0);
  }

  if (runJob) {
    const jobIdx = args.indexOf('--run-job');
    const jobId = args[jobIdx + 1];
    if (!jobId) {
      console.error('Usage: --run-job <job-id>');
      process.exit(1);
    }

    const { scheduler } = await createScrapinServer({ projectRoot, configDir, dataDir, enableCron: true });
    console.log(`Running job: ${jobId}`);
    await scheduler.runJobNow(jobId);
    console.log('Job completed');
    process.exit(0);
  }

  if (cronOnly) {
    const { scheduler } = await createScrapinServer({ projectRoot, configDir, dataDir, enableCron: true });
    scheduler.start();
    console.log('Cron scheduler running. Press Ctrl+C to stop.');

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
    console.log('Starting MCP server...');
    console.log(`  Config: ${configDir}/`);
    console.log(`  Data:   ${dataDir}/`);
    console.log(`  Cron:   ${enableCron ? 'enabled' : 'disabled'}`);
    console.log(`  LSP:    ${enableLsp ? 'enabled' : 'disabled'}`);
    console.log('');

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
