import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import pino from 'pino';
import { type EventBus } from '../core/event-bus.js';

const logger = pino({ name: 'drift-monitor' });

export interface CronDriftEvent {
  job_id: string;
  expected_interval_ms: number;
  actual_interval_ms: number;
  drift_ratio: number;
  last_run: string;
  scheduled_next: string;
}

interface JobRunRecord {
  job_id: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  success: boolean;
  error?: string;
}

export class DriftMonitor {
  private lastRuns = new Map<string, number>();
  private readonly logPath: string;

  constructor(
    private readonly dataDir: string,
    private readonly eventBus: EventBus,
  ) {
    this.logPath = join(dataDir, 'logs', 'cron-log.jsonl');
  }

  async initialize(): Promise<void> {
    const logsDir = join(this.dataDir, 'logs');
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true });
    }

    // Reconstruct last-run times from log file
    if (existsSync(this.logPath)) {
      try {
        const raw = await readFile(this.logPath, 'utf-8');
        const lines = raw.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const record = JSON.parse(line) as JobRunRecord;
            const ts = new Date(record.completed_at).getTime();
            const existing = this.lastRuns.get(record.job_id);
            if (!existing || ts > existing) {
              this.lastRuns.set(record.job_id, ts);
            }
          } catch {
            // Skip malformed lines
          }
        }
        logger.info(`Reconstructed last-run times for ${this.lastRuns.size} jobs from log`);
      } catch {
        logger.info('No cron log found, starting fresh');
      }
    }
  }

  async recordJobRun(jobId: string, durationMs: number, success: boolean, error?: string): Promise<void> {
    const now = new Date();
    const record: JobRunRecord = {
      job_id: jobId,
      started_at: new Date(now.getTime() - durationMs).toISOString(),
      completed_at: now.toISOString(),
      duration_ms: durationMs,
      success,
      error,
    };

    this.lastRuns.set(jobId, now.getTime());

    // Append to log
    try {
      const line = JSON.stringify(record) + '\n';
      await writeFile(this.logPath, line, { flag: 'a' });
    } catch (err) {
      logger.error({ err, jobId }, 'Failed to write cron log');
    }
  }

  async checkDrift(jobId: string, expectedIntervalMs: number): Promise<CronDriftEvent | null> {
    const lastRun = this.lastRuns.get(jobId);
    if (!lastRun) return null;

    const now = Date.now();
    const actualIntervalMs = now - lastRun;
    const driftRatio = actualIntervalMs / expectedIntervalMs;

    // Emit drift event if actual interval is > 2x expected
    if (driftRatio > 2.0) {
      const event: CronDriftEvent = {
        job_id: jobId,
        expected_interval_ms: expectedIntervalMs,
        actual_interval_ms: actualIntervalMs,
        drift_ratio: driftRatio,
        last_run: new Date(lastRun).toISOString(),
        scheduled_next: new Date(lastRun + expectedIntervalMs).toISOString(),
      };

      logger.warn({ event }, 'Cron drift detected');
      await this.eventBus.emit('drift:cron', { jobId, driftRatio });

      // Log to drift-specific log
      const driftLogPath = join(this.dataDir, 'logs', 'cron-drift.log');
      try {
        await writeFile(driftLogPath, JSON.stringify(event) + '\n', { flag: 'a' });
      } catch {
        // Non-critical
      }

      return event;
    }

    return null;
  }

  getLastRun(jobId: string): number | undefined {
    return this.lastRuns.get(jobId);
  }

  getMissedJobs(schedules: Map<string, number>): string[] {
    const missed: string[] = [];
    const now = Date.now();

    for (const [jobId, intervalMs] of schedules) {
      const lastRun = this.lastRuns.get(jobId);
      if (lastRun && (now - lastRun) > intervalMs * 2) {
        missed.push(jobId);
      }
    }

    return missed;
  }
}
