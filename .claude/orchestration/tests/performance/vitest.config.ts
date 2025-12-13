import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000, // 2 minutes for long-running benchmarks
    hookTimeout: 30000,
    threads: false, // Disable threading for accurate performance measurement
    isolate: true,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './performance-results.json',
    },
    coverage: {
      enabled: false, // Disable coverage for benchmarks
    },
    benchmark: {
      include: ['**/*-perf.test.ts'],
      reporters: ['verbose'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../'),
    },
  },
});
