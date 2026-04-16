import pino from 'pino';
import { type GraphAdapter } from '../../core/graph.js';
import { type EventBus } from '../../core/event-bus.js';

const logger = pino({ name: 'job:code-drift-scan' });

export function createCodeDriftScanJob(
  graph: GraphAdapter,
  eventBus: EventBus,
  projectRoot: string,
  dataDir: string,
): () => Promise<void> {
  return async () => {
    logger.info('Starting codebase drift scan');

    const { CodeDriftScanner } = await import('../../drift/code-drift.js');
    const scanner = new CodeDriftScanner(graph, projectRoot);
    const report = await scanner.scan();

    await eventBus.emit('drift:code', {
      missingCount: report.missing_docs.length,
      deprecatedCount: report.deprecated_usage.length,
      staleCount: report.stale_docs.length,
    });

    // Save report
    const { saveDriftReport } = await import('../../drift/drift-reporter.js');
    const reportPath = await saveDriftReport(report, 'code-drift', dataDir);

    logger.info({
      filesScanned: report.files_scanned,
      missingDocs: report.missing_docs.length,
      deprecatedUsage: report.deprecated_usage.length,
      staleDocs: report.stale_docs.length,
      reportPath,
    }, 'Code drift scan completed');
  };
}
