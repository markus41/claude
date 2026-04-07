import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/cli.ts'],
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
