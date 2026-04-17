import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export interface CrawlFailureRecord {
  sourceKey: string;
  url: string;
  error: string;
  statusCode?: number;
  at: string;
}

export interface CrawlRunRecord {
  runId: string;
  sourceKey: string;
  startedAt: string;
  completedAt: string;
  pagesProcessed: number;
  pagesSkipped: number;
  errors: number;
}

export interface SourceHealthRecord {
  sourceKey: string;
  successCount: number;
  failureCount: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  avgFreshnessHours: number;
}

interface TelemetryState {
  failures: CrawlFailureRecord[];
  runs: CrawlRunRecord[];
  health: Record<string, SourceHealthRecord>;
}

const MAX_FAILURES = 200;
const MAX_RUNS = 200;

function telemetryPath(dataDir: string): string {
  return join(dataDir, 'telemetry', 'crawl-telemetry.json');
}

// Serialize all telemetry writes per-dataDir so concurrent cron jobs cannot
// race on read-modify-write and drop records. The original implementation
// had no lock; up to 3 jobs could run in parallel and the last writer won.
const writeQueues = new Map<string, Promise<unknown>>();

async function serialized<T>(dataDir: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeQueues.get(dataDir) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeQueues.set(
    dataDir,
    next.catch(() => undefined),
  );
  return next;
}

async function readState(dataDir: string): Promise<TelemetryState> {
  const path = telemetryPath(dataDir);
  if (!existsSync(path)) {
    return { failures: [], runs: [], health: {} };
  }
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as TelemetryState;
  } catch {
    return { failures: [], runs: [], health: {} };
  }
}

async function writeState(dataDir: string, state: TelemetryState): Promise<void> {
  const path = telemetryPath(dataDir);
  if (!existsSync(dirname(path))) {
    await mkdir(dirname(path), { recursive: true });
  }
  await writeFile(path, JSON.stringify(state, null, 2), 'utf-8');
}

export async function recordCrawlFailure(dataDir: string, failure: CrawlFailureRecord): Promise<void> {
  await serialized(dataDir, async () => {
    const state = await readState(dataDir);
    state.failures.unshift(failure);
    state.failures = state.failures.slice(0, MAX_FAILURES);

    const health = state.health[failure.sourceKey] ?? {
      sourceKey: failure.sourceKey,
      successCount: 0,
      failureCount: 0,
      avgFreshnessHours: 0,
    };
    health.failureCount += 1;
    health.lastFailureAt = failure.at;
    state.health[failure.sourceKey] = health;

    await writeState(dataDir, state);
  });
}

export async function recordCrawlRun(dataDir: string, run: CrawlRunRecord): Promise<void> {
  await serialized(dataDir, async () => {
    const state = await readState(dataDir);
    state.runs.unshift(run);
    state.runs = state.runs.slice(0, MAX_RUNS);

    const health = state.health[run.sourceKey] ?? {
      sourceKey: run.sourceKey,
      successCount: 0,
      failureCount: 0,
      avgFreshnessHours: 0,
    };
    if (run.errors === 0) {
      health.successCount += 1;
      health.lastSuccessAt = run.completedAt;
    }

    const freshnessHours = Math.max(0, (Date.now() - Date.parse(run.completedAt)) / 36e5);
    health.avgFreshnessHours = health.avgFreshnessHours === 0
      ? freshnessHours
      : ((health.avgFreshnessHours * 0.8) + (freshnessHours * 0.2));
    state.health[run.sourceKey] = health;

    await writeState(dataDir, state);
  });
}

export async function readCrawlTelemetry(dataDir: string): Promise<TelemetryState> {
  return readState(dataDir);
}
