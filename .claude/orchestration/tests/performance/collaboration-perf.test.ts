/**
 * Agent Collaboration Framework - Performance Benchmarks
 *
 * Validates message broker throughput, queue depth handling,
 * and concurrent producer/consumer scaling to drive measurable
 * communication efficiency across distributed agent systems.
 */

import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import {
  BenchmarkRunner,
  BenchmarkTarget,
  compareBenchmark,
  formatBenchmarkResult,
  formatComparison,
} from './benchmarks';
import { DistributedDatabase } from '../../distributed/database';
import { TaskQueue } from '../../distributed/task-queue';
import { WorkerManager } from '../../distributed/worker-manager';
import { Coordinator } from '../../distributed/coordinator';
import { TaskSubmission } from '../../distributed/types';

// ============================================================================
// PERFORMANCE TARGETS
// ============================================================================

const TARGETS: Record<string, BenchmarkTarget> = {
  messageEnqueue: {
    operation: 'messageEnqueue',
    targetP50: 5,           // 5ms p50
    targetP95: 10,          // 10ms p95
    targetP99: 20,          // 20ms p99
    targetThroughput: 10000, // 10,000 msg/sec
    targetMemory: 50,        // 50MB memory delta
    targetSuccessRate: 0.999, // 99.9% success
  },
  messageDequeue: {
    operation: 'messageDequeue',
    targetP50: 3,
    targetP95: 8,
    targetP99: 15,
    targetThroughput: 12000,
    targetMemory: 40,
    targetSuccessRate: 0.999,
  },
  taskSubmission: {
    operation: 'taskSubmission',
    targetP50: 10,
    targetP95: 25,
    targetP99: 50,
    targetThroughput: 1000,
    targetMemory: 100,
    targetSuccessRate: 0.995,
  },
  workerAssignment: {
    operation: 'workerAssignment',
    targetP50: 15,
    targetP95: 35,
    targetP99: 75,
    targetThroughput: 500,
    targetMemory: 80,
    targetSuccessRate: 0.99,
  },
  queueDepth100k: {
    operation: 'queueDepth100k',
    targetP50: 10,
    targetP95: 30,
    targetP99: 60,
    targetThroughput: 5000,
    targetMemory: 500,
    targetSuccessRate: 0.999,
  },
  concurrentProducers: {
    operation: 'concurrentProducers',
    targetP50: 20,
    targetP95: 50,
    targetP99: 100,
    targetThroughput: 8000,
    targetMemory: 200,
    targetSuccessRate: 0.995,
  },
  concurrentConsumers: {
    operation: 'concurrentConsumers',
    targetP50: 25,
    targetP95: 60,
    targetP99: 120,
    targetThroughput: 7000,
    targetMemory: 250,
    targetSuccessRate: 0.995,
  },
};

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Collaboration Framework Performance', () => {
  let db: DistributedDatabase;
  let taskQueue: TaskQueue;
  let workerManager: WorkerManager;
  let coordinator: Coordinator;
  let runner: BenchmarkRunner;

  beforeEach(async () => {
    // Initialize in-memory database
    db = new DistributedDatabase(':memory:');
    await db.initialize();

    taskQueue = new TaskQueue(db);
    workerManager = new WorkerManager(db);

    coordinator = new Coordinator(db, {
      heartbeatCheckIntervalMs: 1000,
      timeoutCheckIntervalMs: 1000,
      deadWorkerThresholdMs: 5000,
      maxConcurrentTasks: 1000,
      defaultTaskTimeoutMs: 30000,
      defaultRetryPolicy: {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 5000,
        backoffFactor: 2,
      },
      loadBalancer: {
        strategy: 'least-loaded',
        considerCapabilities: true,
        respectAffinity: false,
        maxLoadThreshold: 10,
      },
    });

    runner = new BenchmarkRunner();
  });

  afterEach(async () => {
    await coordinator?.shutdown();
    await db?.close();
  });

  // ==========================================================================
  // MESSAGE THROUGHPUT BENCHMARKS
  // ==========================================================================

  it('should handle high message enqueue throughput', async () => {
    const result = await runner.run(
      'messageEnqueue',
      'Collaboration',
      async () => {
        const task: TaskSubmission = {
          type: 'test-task',
          payload: { data: 'benchmark' },
          priority: 'normal',
        };
        await taskQueue.submit(task);
      },
      {
        warmupIterations: 100,
        iterations: 10000,
        memorySampleRate: 100,
      }
    );

    console.log(formatBenchmarkResult(result));

    const comparison = compareBenchmark(result, TARGETS.messageEnqueue);
    console.log(formatComparison(comparison));

    expect(comparison.passed).toBe(true);
  });

  it('should handle high message dequeue throughput', async () => {
    // Pre-populate queue
    for (let i = 0; i < 1000; i++) {
      await taskQueue.submit({
        type: 'test-task',
        payload: { iteration: i },
        priority: 'normal',
      });
    }

    const result = await runner.run(
      'messageDequeue',
      'Collaboration',
      async () => {
        await taskQueue.getPending({ limit: 1 });
      },
      {
        warmupIterations: 50,
        iterations: 1000,
        memorySampleRate: 50,
      }
    );

    console.log(formatBenchmarkResult(result));

    const comparison = compareBenchmark(result, TARGETS.messageDequeue);
    console.log(formatComparison(comparison));

    expect(comparison.passed).toBe(true);
  });

  // ==========================================================================
  // TASK SUBMISSION BENCHMARKS
  // ==========================================================================

  it('should maintain low latency for task submissions', async () => {
    // Register a worker
    await workerManager.register({
      name: 'benchmark-worker',
      capabilities: ['test'],
      maxLoad: 100,
    });

    const result = await runner.run(
      'taskSubmission',
      'Collaboration',
      async () => {
        await coordinator.submitTask({
          type: 'test-task',
          payload: { test: true },
          requiredCapabilities: ['test'],
        });
      },
      {
        warmupIterations: 50,
        iterations: 1000,
        memorySampleRate: 50,
      }
    );

    console.log(formatBenchmarkResult(result));

    const comparison = compareBenchmark(result, TARGETS.taskSubmission);
    console.log(formatComparison(comparison));

    expect(comparison.passed).toBe(true);
  });

  // ==========================================================================
  // WORKER ASSIGNMENT BENCHMARKS
  // ==========================================================================

  it('should efficiently assign tasks to workers', async () => {
    // Register multiple workers
    for (let i = 0; i < 10; i++) {
      await workerManager.register({
        name: `worker-${i}`,
        capabilities: ['test'],
        maxLoad: 10,
      });
    }

    // Pre-populate queue
    const taskIds: string[] = [];
    for (let i = 0; i < 100; i++) {
      const taskId = await taskQueue.submit({
        type: 'test-task',
        payload: { iteration: i },
        priority: 'normal',
        requiredCapabilities: ['test'],
      });
      taskIds.push(taskId);
    }

    let taskIndex = 0;
    const result = await runner.run(
      'workerAssignment',
      'Collaboration',
      async () => {
        const taskId = taskIds[taskIndex % taskIds.length];
        const workers = await workerManager.getActive();
        if (workers.length > 0) {
          await taskQueue.assign(taskId, workers[0].id);
        }
        taskIndex++;
      },
      {
        warmupIterations: 20,
        iterations: 500,
        memorySampleRate: 25,
      }
    );

    console.log(formatBenchmarkResult(result));

    const comparison = compareBenchmark(result, TARGETS.workerAssignment);
    console.log(formatComparison(comparison));

    expect(comparison.passed).toBe(true);
  });

  // ==========================================================================
  // QUEUE DEPTH BENCHMARKS
  // ==========================================================================

  it('should handle queue depth of 100,000 messages', async () => {
    // Register workers to prevent queue saturation alerts
    for (let i = 0; i < 5; i++) {
      await workerManager.register({
        name: `worker-${i}`,
        capabilities: ['test'],
        maxLoad: 20,
      });
    }

    // Pre-populate with 100k messages
    console.log('Pre-populating queue with 100,000 messages...');
    const startPop = Date.now();

    for (let i = 0; i < 100000; i++) {
      await taskQueue.submit({
        type: 'test-task',
        payload: { index: i },
        priority: i % 100 === 0 ? 'high' : 'normal',
      });

      if (i % 10000 === 0) {
        console.log(`Populated ${i} messages...`);
      }
    }

    console.log(`Population took ${Date.now() - startPop}ms`);

    // Benchmark dequeue performance
    const result = await runner.run(
      'queueDepth100k',
      'Collaboration',
      async () => {
        await taskQueue.getPending({ limit: 10 });
      },
      {
        warmupIterations: 10,
        iterations: 5000,
        memorySampleRate: 100,
      }
    );

    console.log(formatBenchmarkResult(result));

    const comparison = compareBenchmark(result, TARGETS.queueDepth100k);
    console.log(formatComparison(comparison));

    expect(comparison.passed).toBe(true);
  }, 120000); // 2 minute timeout

  // ==========================================================================
  // CONCURRENT PRODUCER/CONSUMER BENCHMARKS
  // ==========================================================================

  it('should scale with concurrent producers', async () => {
    const result = await runner.run(
      'concurrentProducers',
      'Collaboration',
      async () => {
        await taskQueue.submit({
          type: 'concurrent-test',
          payload: { timestamp: Date.now() },
          priority: 'normal',
        });
      },
      {
        warmupIterations: 100,
        iterations: 10000,
        concurrency: 10, // 10 concurrent producers
        memorySampleRate: 100,
      }
    );

    console.log(formatBenchmarkResult(result));

    const comparison = compareBenchmark(result, TARGETS.concurrentProducers);
    console.log(formatComparison(comparison));

    expect(comparison.passed).toBe(true);
  });

  it('should scale with concurrent consumers', async () => {
    // Pre-populate queue
    for (let i = 0; i < 10000; i++) {
      await taskQueue.submit({
        type: 'concurrent-test',
        payload: { index: i },
        priority: 'normal',
      });
    }

    const result = await runner.run(
      'concurrentConsumers',
      'Collaboration',
      async () => {
        await taskQueue.getPending({ limit: 5 });
      },
      {
        warmupIterations: 50,
        iterations: 7000,
        concurrency: 10, // 10 concurrent consumers
        memorySampleRate: 100,
      }
    );

    console.log(formatBenchmarkResult(result));

    const comparison = compareBenchmark(result, TARGETS.concurrentConsumers);
    console.log(formatComparison(comparison));

    expect(comparison.passed).toBe(true);
  });
});
