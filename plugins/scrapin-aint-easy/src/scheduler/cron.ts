import cron from 'node-cron';
import pino from 'pino';
import { AsyncSemaphore } from '../core/semaphore.js';
import { type EventBus } from '../core/event-bus.js';
import { DriftMonitor } from './drift-monitor.js';

const logger = pino({ name: 'scheduler' });

export interface JobDefinition {
  id: string;
  schedule: string;
  description: string;
  expectedIntervalMs: number;
  handler: () => Promise<void>;
}

interface RunningJob {
  id: string;
  task: cron.ScheduledTask;
  schedule: string;
  description: string;
  expectedIntervalMs: number;
}

export class CronScheduler {
  private jobs: RunningJob[] = [];
  private readonly semaphore: AsyncSemaphore;
  private readonly driftMonitor: DriftMonitor;
  private running = false;

  constructor(
    private readonly maxConcurrentJobs: number,
    private readonly dataDir: string,
    private readonly eventBus: EventBus,
  ) {
    this.semaphore = new AsyncSemaphore(maxConcurrentJobs);
    this.driftMonitor = new DriftMonitor(dataDir, eventBus);
  }

  async initialize(): Promise<void> {
    await this.driftMonitor.initialize();

    // Check for missed jobs on startup
    const schedules = new Map<string, number>();
    for (const job of this.jobs) {
      schedules.set(job.id, job.expectedIntervalMs);
    }
    const missed = this.driftMonitor.getMissedJobs(schedules);
    if (missed.length > 0) {
      logger.warn({ missed }, 'Detected missed cron jobs since last run');
    }
  }

  registerJob(definition: JobDefinition): void {
    const { id, schedule, description, expectedIntervalMs, handler } = definition;

    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron schedule for job ${id}: ${schedule}`);
    }

    const task = cron.schedule(schedule, () => {
      void this.executeJob(id, handler, expectedIntervalMs);
    }, { scheduled: false });

    this.jobs.push({ id, task, schedule, description, expectedIntervalMs });
    logger.info({ jobId: id, schedule, description }, 'Registered cron job');
  }

  private async executeJob(jobId: string, handler: () => Promise<void>, expectedIntervalMs: number): Promise<void> {
    // Check for drift before running
    await this.driftMonitor.checkDrift(jobId, expectedIntervalMs);

    await this.eventBus.emit('scheduler:job-start', { jobId });
    const startTime = Date.now();

    try {
      await this.semaphore.run(async () => {
        logger.info({ jobId }, 'Starting cron job');
        await handler();
      });

      const durationMs = Date.now() - startTime;
      await this.driftMonitor.recordJobRun(jobId, durationMs, true);
      await this.eventBus.emit('scheduler:job-complete', { jobId, durationMs });
      logger.info({ jobId, durationMs }, 'Cron job completed');
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.driftMonitor.recordJobRun(jobId, durationMs, false, errorMsg);
      await this.eventBus.emit('scheduler:job-error', { jobId, error: errorMsg });
      logger.error({ jobId, err }, 'Cron job failed');
    }
  }

  async runJobNow(jobId: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) {
      throw new Error(`Unknown job: ${jobId}`);
    }

    logger.info({ jobId }, 'Running job on demand');
    // Find the handler from the registered definition
    // We need to store the handler reference
    const definition = this.jobDefinitions.get(jobId);
    if (!definition) {
      throw new Error(`No handler found for job: ${jobId}`);
    }
    await this.executeJob(jobId, definition.handler, job.expectedIntervalMs);
  }

  private jobDefinitions = new Map<string, JobDefinition>();

  registerJobWithDef(definition: JobDefinition): void {
    this.jobDefinitions.set(definition.id, definition);
    this.registerJob(definition);
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    for (const job of this.jobs) {
      job.task.start();
    }

    logger.info(`Started ${this.jobs.length} cron jobs (max concurrent: ${this.maxConcurrentJobs})`);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    for (const job of this.jobs) {
      job.task.stop();
    }

    logger.info('Stopped all cron jobs');
  }

  status(): Array<{ id: string; schedule: string; description: string; lastRun: string | null; running: boolean }> {
    return this.jobs.map((job) => {
      const lastRun = this.driftMonitor.getLastRun(job.id);
      return {
        id: job.id,
        schedule: job.schedule,
        description: job.description,
        lastRun: lastRun ? new Date(lastRun).toISOString() : null,
        running: this.running,
      };
    });
  }

  get isRunning(): boolean {
    return this.running;
  }
}
