import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/cli.ts',
        'src/lsp-server.ts',
        'src/lsp/**',
        'src/types/**',
      ],
      // Thresholds keep CI honest — a failing coverage check is a signal
      // that critical paths (MCP tool handlers, graph, vector) are drifting
      // below the floor. Raise these as the test suite grows.
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
    testTimeout: 30000,
  },
  // kuzu is a native addon — exclude it from Vite's bundler so the
  // dynamic import() in GraphAdapter falls through to the in-memory fallback
  // during tests, matching runtime behaviour when the native module is absent.
  optimizeDeps: {
    exclude: ['kuzu'],
  },
  ssr: {
    external: ['kuzu'],
  },
});
