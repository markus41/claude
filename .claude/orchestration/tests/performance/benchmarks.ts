/**
 * Performance Benchmarking Framework
 *
 * Establishes scalable infrastructure for measuring and validating performance
 * across all Claude orchestration enhancement systems.
 */

// ============================================================================
// BENCHMARK TYPES
// ============================================================================

export interface BenchmarkResult {
  /** Operation name */
  operation: string;

  /** System being tested */
  system: string;

  /** 50th percentile latency (ms) */
  p50: number;

  /** 95th percentile latency (ms) */
  p95: number;

  /** 99th percentile latency (ms) */
  p99: number;

  /** Throughput (operations/second) */
  throughput: number;

  /** Memory usage (MB) */
  memory: number;

  /** CPU usage (%) */
  cpu?: number;

  /** Total operations executed */
  totalOps: number;

  /** Successful operations */
  successfulOps: number;

  /** Failed operations */
  failedOps: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Test duration (ms) */
  duration: number;

  /** Timestamp */
  timestamp: Date;

  /** Additional metrics */
  customMetrics?: Record<string, number>;
}

export interface BenchmarkTarget {
  /** Operation name */
  operation: string;

  /** Target p50 latency (ms) */
  targetP50: number;

  /** Target p95 latency (ms) */
  targetP95: number;

  /** Target p99 latency (ms) */
  targetP99: number;

  /** Target throughput (ops/sec) */
  targetThroughput: number;

  /** Target memory (MB) */
  targetMemory: number;

  /** Target success rate (0-1) */
  targetSuccessRate: number;
}

export interface BenchmarkComparison {
  operation: string;
  actual: BenchmarkResult;
  target: BenchmarkTarget;

  /** Performance deltas */
  deltas: {
    p50: number;
    p95: number;
    p99: number;
    throughput: number;
    memory: number;
    successRate: number;
  };

  /** Overall pass/fail status */
  passed: boolean;

  /** Individual metric pass/fail */
  metrics: {
    p50: boolean;
    p95: boolean;
    p99: boolean;
    throughput: boolean;
    memory: boolean;
    successRate: boolean;
  };
}

// ============================================================================
// LATENCY TRACKING
// ============================================================================

export class LatencyTracker {
  private measurements: number[] = [];

  /**
   * Record a latency measurement
   */
  record(latencyMs: number): void {
    this.measurements.push(latencyMs);
  }

  /**
   * Calculate percentile value
   */
  percentile(p: number): number {
    if (this.measurements.length === 0) return 0;

    const sorted = this.measurements.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get all percentile statistics
   */
  getStats(): { p50: number; p95: number; p99: number; avg: number; min: number; max: number } {
    if (this.measurements.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
    }

    const sorted = this.measurements.slice().sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      p50: this.percentile(50),
      p95: this.percentile(95),
      p99: this.percentile(99),
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  /**
   * Reset all measurements
   */
  reset(): void {
    this.measurements = [];
  }

  /**
   * Get measurement count
   */
  count(): number {
    return this.measurements.length;
  }
}

// ============================================================================
// THROUGHPUT MEASUREMENT
// ============================================================================

export class ThroughputMeter {
  private operationCount = 0;
  private startTime: number | null = null;
  private endTime: number | null = null;

  /**
   * Start measuring throughput
   */
  start(): void {
    this.operationCount = 0;
    this.startTime = Date.now();
    this.endTime = null;
  }

  /**
   * Record an operation
   */
  recordOp(): void {
    this.operationCount++;
  }

  /**
   * Record multiple operations
   */
  recordOps(count: number): void {
    this.operationCount += count;
  }

  /**
   * Stop measuring and calculate throughput
   */
  stop(): { throughput: number; duration: number; totalOps: number } {
    this.endTime = Date.now();

    if (!this.startTime) {
      return { throughput: 0, duration: 0, totalOps: 0 };
    }

    const duration = this.endTime - this.startTime;
    const throughput = (this.operationCount / duration) * 1000; // ops/sec

    return {
      throughput,
      duration,
      totalOps: this.operationCount,
    };
  }

  /**
   * Get current throughput without stopping
   */
  current(): number {
    if (!this.startTime) return 0;

    const now = Date.now();
    const duration = now - this.startTime;
    return (this.operationCount / duration) * 1000;
  }
}

// ============================================================================
// MEMORY TRACKING
// ============================================================================

export class MemoryTracker {
  private baselineMemory: number | null = null;
  private measurements: number[] = [];

  /**
   * Set baseline memory usage
   */
  setBaseline(): void {
    this.baselineMemory = this.getCurrentMemoryMB();
  }

  /**
   * Record current memory usage
   */
  record(): void {
    this.measurements.push(this.getCurrentMemoryMB());
  }

  /**
   * Get current memory usage in MB
   */
  private getCurrentMemoryMB(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed / 1024 / 1024;
  }

  /**
   * Get memory statistics
   */
  getStats(): { baseline: number; peak: number; average: number; delta: number } {
    if (this.measurements.length === 0 || this.baselineMemory === null) {
      return { baseline: 0, peak: 0, average: 0, delta: 0 };
    }

    const peak = Math.max(...this.measurements);
    const sum = this.measurements.reduce((a, b) => a + b, 0);
    const average = sum / this.measurements.length;
    const delta = peak - this.baselineMemory;

    return {
      baseline: this.baselineMemory,
      peak,
      average,
      delta,
    };
  }

  /**
   * Reset measurements
   */
  reset(): void {
    this.measurements = [];
    this.baselineMemory = null;
  }
}

// ============================================================================
// BENCHMARK RUNNER
// ============================================================================

export interface BenchmarkOptions {
  /** Number of warmup iterations */
  warmupIterations?: number;

  /** Number of benchmark iterations */
  iterations: number;

  /** Concurrent operations */
  concurrency?: number;

  /** Duration in milliseconds (alternative to iterations) */
  duration?: number;

  /** Sample memory every N iterations */
  memorySampleRate?: number;
}

export class BenchmarkRunner {
  private latency = new LatencyTracker();
  private throughput = new ThroughputMeter();
  private memory = new MemoryTracker();
  private successCount = 0;
  private failureCount = 0;

  /**
   * Run a benchmark for an async operation
   */
  async run(
    operation: string,
    system: string,
    fn: () => Promise<void>,
    options: BenchmarkOptions
  ): Promise<BenchmarkResult> {
    // Reset trackers
    this.latency.reset();
    this.memory.reset();
    this.successCount = 0;
    this.failureCount = 0;

    // Set memory baseline
    this.memory.setBaseline();

    // Warmup phase
    if (options.warmupIterations && options.warmupIterations > 0) {
      await this.runIterations(fn, options.warmupIterations, 1, false);
      this.latency.reset();
      this.successCount = 0;
      this.failureCount = 0;
    }

    // Benchmark phase
    this.throughput.start();

    if (options.duration) {
      await this.runForDuration(fn, options.duration, options.concurrency || 1, options.memorySampleRate);
    } else {
      await this.runIterations(fn, options.iterations, options.concurrency || 1, true, options.memorySampleRate);
    }

    const throughputStats = this.throughput.stop();
    const latencyStats = this.latency.getStats();
    const memoryStats = this.memory.getStats();

    const totalOps = this.successCount + this.failureCount;
    const successRate = totalOps > 0 ? this.successCount / totalOps : 0;

    return {
      operation,
      system,
      p50: latencyStats.p50,
      p95: latencyStats.p95,
      p99: latencyStats.p99,
      throughput: throughputStats.throughput,
      memory: memoryStats.delta,
      totalOps,
      successfulOps: this.successCount,
      failedOps: this.failureCount,
      successRate,
      duration: throughputStats.duration,
      timestamp: new Date(),
    };
  }

  /**
   * Run iterations of the benchmark
   */
  private async runIterations(
    fn: () => Promise<void>,
    iterations: number,
    concurrency: number,
    trackMetrics: boolean,
    memorySampleRate?: number
  ): Promise<void> {
    const batches = Math.ceil(iterations / concurrency);

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - batch * concurrency);
      const promises: Promise<void>[] = [];

      for (let i = 0; i < batchSize; i++) {
        promises.push(this.runSingleOp(fn, trackMetrics));

        // Sample memory
        if (memorySampleRate && trackMetrics && i % memorySampleRate === 0) {
          this.memory.record();
        }
      }

      await Promise.all(promises);
      this.throughput.recordOps(batchSize);
    }
  }

  /**
   * Run benchmark for a specific duration
   */
  private async runForDuration(
    fn: () => Promise<void>,
    durationMs: number,
    concurrency: number,
    memorySampleRate?: number
  ): Promise<void> {
    const startTime = Date.now();
    let iteration = 0;

    while (Date.now() - startTime < durationMs) {
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrency; i++) {
        promises.push(this.runSingleOp(fn, true));

        // Sample memory
        if (memorySampleRate && iteration % memorySampleRate === 0) {
          this.memory.record();
        }

        iteration++;
      }

      await Promise.all(promises);
      this.throughput.recordOps(concurrency);
    }
  }

  /**
   * Run a single operation and track metrics
   */
  private async runSingleOp(fn: () => Promise<void>, trackMetrics: boolean): Promise<void> {
    const start = Date.now();

    try {
      await fn();

      if (trackMetrics) {
        const latency = Date.now() - start;
        this.latency.record(latency);
        this.successCount++;
      }
    } catch (error) {
      if (trackMetrics) {
        this.failureCount++;
      }
      // Continue benchmarking despite errors
    }
  }
}

// ============================================================================
// COMPARISON UTILITIES
// ============================================================================

/**
 * Compare benchmark results against targets
 */
export function compareBenchmark(
  result: BenchmarkResult,
  target: BenchmarkTarget
): BenchmarkComparison {
  const deltas = {
    p50: ((result.p50 - target.targetP50) / target.targetP50) * 100,
    p95: ((result.p95 - target.targetP95) / target.targetP95) * 100,
    p99: ((result.p99 - target.targetP99) / target.targetP99) * 100,
    throughput: ((result.throughput - target.targetThroughput) / target.targetThroughput) * 100,
    memory: ((result.memory - target.targetMemory) / target.targetMemory) * 100,
    successRate: ((result.successRate - target.targetSuccessRate) / target.targetSuccessRate) * 100,
  };

  const metrics = {
    p50: result.p50 <= target.targetP50,
    p95: result.p95 <= target.targetP95,
    p99: result.p99 <= target.targetP99,
    throughput: result.throughput >= target.targetThroughput,
    memory: result.memory <= target.targetMemory,
    successRate: result.successRate >= target.targetSuccessRate,
  };

  const passed = Object.values(metrics).every(v => v);

  return {
    operation: result.operation,
    actual: result,
    target,
    deltas,
    passed,
    metrics,
  };
}

/**
 * Format benchmark result for display
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  return `
Benchmark: ${result.system} - ${result.operation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Latency:
  P50: ${result.p50.toFixed(2)}ms
  P95: ${result.p95.toFixed(2)}ms
  P99: ${result.p99.toFixed(2)}ms

Throughput: ${result.throughput.toFixed(2)} ops/sec

Memory: ${result.memory.toFixed(2)} MB

Operations:
  Total: ${result.totalOps}
  Successful: ${result.successfulOps}
  Failed: ${result.failedOps}
  Success Rate: ${(result.successRate * 100).toFixed(2)}%

Duration: ${result.duration.toFixed(2)}ms
Timestamp: ${result.timestamp.toISOString()}
`;
}

/**
 * Format comparison result for display
 */
export function formatComparison(comparison: BenchmarkComparison): string {
  const statusIcon = (passed: boolean) => passed ? '✓' : '✗';
  const deltaSign = (delta: number) => delta > 0 ? '+' : '';

  return `
Comparison: ${comparison.operation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: ${statusIcon(comparison.passed)} ${comparison.passed ? 'PASSED' : 'FAILED'}

Metric Breakdown:
  P50: ${statusIcon(comparison.metrics.p50)} ${comparison.actual.p50.toFixed(2)}ms (target: ${comparison.target.targetP50}ms, ${deltaSign(comparison.deltas.p50)}${comparison.deltas.p50.toFixed(1)}%)
  P95: ${statusIcon(comparison.metrics.p95)} ${comparison.actual.p95.toFixed(2)}ms (target: ${comparison.target.targetP95}ms, ${deltaSign(comparison.deltas.p95)}${comparison.deltas.p95.toFixed(1)}%)
  P99: ${statusIcon(comparison.metrics.p99)} ${comparison.actual.p99.toFixed(2)}ms (target: ${comparison.target.targetP99}ms, ${deltaSign(comparison.deltas.p99)}${comparison.deltas.p99.toFixed(1)}%)
  Throughput: ${statusIcon(comparison.metrics.throughput)} ${comparison.actual.throughput.toFixed(2)} ops/sec (target: ${comparison.target.targetThroughput}, ${deltaSign(comparison.deltas.throughput)}${comparison.deltas.throughput.toFixed(1)}%)
  Memory: ${statusIcon(comparison.metrics.memory)} ${comparison.actual.memory.toFixed(2)}MB (target: ${comparison.target.targetMemory}MB, ${deltaSign(comparison.deltas.memory)}${comparison.deltas.memory.toFixed(1)}%)
  Success Rate: ${statusIcon(comparison.metrics.successRate)} ${(comparison.actual.successRate * 100).toFixed(2)}% (target: ${(comparison.target.targetSuccessRate * 100).toFixed(2)}%, ${deltaSign(comparison.deltas.successRate)}${comparison.deltas.successRate.toFixed(1)}%)
`;
}
