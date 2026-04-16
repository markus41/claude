import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { type EventBus } from '../core/event-bus.js';
import { type SourceConfig } from '../config/loader.js';

const logger = pino({ name: 'crawl-queue' });

export type CrawlJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface CrawlJob {
  id: string;
  sourceKey: string;
  sourceConfig: SourceConfig;
  force: boolean;
  status: CrawlJobStatus;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface CrawlStatusSnapshot {
  queuedCount: number;
  runningJobs: Array<{
    id: string;
    sourceKey: string;
    force: boolean;
    startedAt: string;
  }>;
  lastCompletionBySource: Record<string, string>;
  lastErrorBySource: Record<string, string>;
}

interface WorkerContext {
  sourceKey: string;
  sourceConfig: SourceConfig;
  force: boolean;
  jobId: string;
}
interface WorkerResult {
  pagesProcessed?: number;
}

export class CrawlQueue {
  private readonly queuedBySource = new Map<string, CrawlJob[]>();
  private readonly runningBySource = new Map<string, CrawlJob>();
  private readonly completedBySource = new Map<string, CrawlJob>();
  private readonly failedBySource = new Map<string, CrawlJob>();
  private worker?: (ctx: WorkerContext) => Promise<WorkerResult>;

  constructor(private readonly eventBus: EventBus) {}

  attachWorker(worker: (ctx: WorkerContext) => Promise<WorkerResult>): void {
    this.worker = worker;
  }

  enqueue(sourceKey: string, sourceConfig: SourceConfig, force: boolean): CrawlJob {
    const existingRunning = this.runningBySource.get(sourceKey);
    const existingQueued = this.queuedBySource.get(sourceKey) ?? [];

    if (!force) {
      const existing = existingRunning ?? existingQueued[0];
      if (existing) {
        return existing;
      }
    }

    const job: CrawlJob = {
      id: randomUUID(),
      sourceKey,
      sourceConfig,
      force,
      status: 'queued',
      enqueuedAt: new Date().toISOString(),
    };

    existingQueued.push(job);
    this.queuedBySource.set(sourceKey, existingQueued);

    void this.eventBus.emit('crawl:queued', {
      sourceKey,
      jobId: job.id,
      force,
    });

    void this.runNext(sourceKey);

    return job;
  }

  status(): CrawlStatusSnapshot {
    const queuedCount = [...this.queuedBySource.values()].reduce((count, queue) => count + queue.length, 0);
    const runningJobs = [...this.runningBySource.values()].map((job) => ({
      id: job.id,
      sourceKey: job.sourceKey,
      force: job.force,
      startedAt: job.startedAt ?? job.enqueuedAt,
    }));

    const lastCompletionBySource = Object.fromEntries(
      [...this.completedBySource.entries()]
        .filter(([, job]) => Boolean(job.completedAt))
        .map(([sourceKey, job]) => [sourceKey, job.completedAt as string]),
    );

    const lastErrorBySource = Object.fromEntries(
      [...this.failedBySource.entries()]
        .filter(([, job]) => Boolean(job.error))
        .map(([sourceKey, job]) => [sourceKey, job.error as string]),
    );

    return {
      queuedCount,
      runningJobs,
      lastCompletionBySource,
      lastErrorBySource,
    };
  }

  private async runNext(sourceKey: string): Promise<void> {
    if (!this.worker || this.runningBySource.has(sourceKey)) {
      return;
    }

    const queue = this.queuedBySource.get(sourceKey);
    if (!queue || queue.length === 0) {
      return;
    }

    const job = queue.shift();
    if (!job) {
      return;
    }

    if (queue.length === 0) {
      this.queuedBySource.delete(sourceKey);
    }

    job.status = 'running';
    job.startedAt = new Date().toISOString();
    this.runningBySource.set(sourceKey, job);

    await this.eventBus.emit('crawl:start', {
      sourceKey,
      url: job.sourceConfig.base_url,
    });

    try {
      const startedAt = Date.now();
      const result = await this.worker({
        sourceKey,
        sourceConfig: job.sourceConfig,
        force: job.force,
        jobId: job.id,
      });

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      this.completedBySource.set(sourceKey, job);

      await this.eventBus.emit('crawl:complete', {
        sourceKey,
        pagesProcessed: result.pagesProcessed ?? 0,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      job.error = message;
      this.failedBySource.set(sourceKey, job);

      await this.eventBus.emit('crawl:error', {
        sourceKey,
        url: job.sourceConfig.base_url,
        error: message,
      });
      logger.error({ sourceKey, jobId: job.id, err }, 'Crawl job failed');
    } finally {
      this.runningBySource.delete(sourceKey);
      void this.runNext(sourceKey);
    }
  }
}
