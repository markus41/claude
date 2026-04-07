import pino from 'pino';
import { type GraphAdapter } from '../../core/graph.js';
import { type EventBus } from '../../core/event-bus.js';

const logger = pino({ name: 'job:agent-drift-scan' });

export function createAgentDriftScanJob(
  graph: GraphAdapter,
  eventBus: EventBus,
  agentsDir: string,
  configDir: string,
  dataDir: string,
): () => Promise<void> {
  return async () => {
    logger.info('Starting agent drift scan');

    const { AgentDriftDetector } = await import('../../drift/agent-drift.js');
    const detector = new AgentDriftDetector(graph, agentsDir, configDir);
    const reports = await detector.scan();

    for (const report of reports) {
      if (report.drift_score > 0) {
        await eventBus.emit('drift:agent', {
          agentId: report.agent_id,
          driftScore: report.drift_score,
          driftType: report.drift_type,
        });
      }
    }

    // Save report
    const { saveDriftReport } = await import('../../drift/drift-reporter.js');
    const reportPath = await saveDriftReport(reports, 'agent-drift', dataDir);

    const highDrift = reports.filter((r) => r.drift_score > 5);
    logger.info({
      agentsScanned: reports.length,
      drifted: reports.filter((r) => r.drift_score > 0).length,
      highDrift: highDrift.length,
      reportPath,
    }, 'Agent drift scan completed');

    if (highDrift.length > 0) {
      logger.warn(
        { agents: highDrift.map((r) => ({ id: r.agent_id, score: r.drift_score })) },
        'High-severity agent drift detected — review recommended',
      );
    }
  };
}
