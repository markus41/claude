---
name: Vitest Coverage in Pool Workers
description: Use when the user asks about testing Workers with Vitest, @cloudflare/vitest-pool-workers, code coverage with @vitest/coverage-v8, integration tests for Durable Objects / D1 / KV / R2, or CI test setup for Workers monorepos.
version: 0.1.0
---

# Vitest in Workers Runtime, with Coverage

`@cloudflare/vitest-pool-workers` runs Vitest **inside the actual Workers runtime** (workerd) — your tests have real bindings (DO, D1, KV, R2, AI mocked or real, Vectorize mocked, etc.) instead of mocked stubs.

Pair with `@vitest/coverage-v8` for coverage that includes Worker code as it actually runs.

## Install

```bash
pnpm add -D vitest @cloudflare/vitest-pool-workers @vitest/coverage-v8 @cloudflare/workers-types
```

## Config

`vitest.config.ts`:
```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          compatibilityDate: '2026-04-15',
          compatibilityFlags: ['nodejs_compat'],
          // Override or add per-test bindings
          kvNamespaces: ['TEST_KV'],
          d1Databases: ['TEST_DB'],
          r2Buckets: ['TEST_BUCKET'],
          durableObjects: { COUNTER: 'Counter' },
          bindings: { STAGE: 'test' },
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/__fixtures__/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

`tsconfig.json` (test-side):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": [
      "@cloudflare/workers-types",
      "@cloudflare/vitest-pool-workers"
    ]
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

## Basic test

```typescript
import { env, fetchMock, SELF, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import worker from '../src/index';

describe('synth-agent', () => {
  it('handles a meeting create', async () => {
    const req = new Request('http://localhost/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' },
      body: JSON.stringify({ title: 'Q1 review' }),
    });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBeTruthy();
  });
});
```

## Real D1 in tests

The pool spins up a local D1 database per test file (or worker) automatically. Apply migrations once:

```typescript
import { env, applyD1Migrations } from 'cloudflare:test';
import { beforeAll } from 'vitest';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
```

Where `TEST_MIGRATIONS` is an injected fixture binding pointing to your migrations folder (configure in `defineWorkersConfig`).

## Durable Object tests

```typescript
import { env, runInDurableObject, runDurableObjectAlarm } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('SynthesisAgent DO', () => {
  it('appends chunks transactionally', async () => {
    const id = env.AGENT.idFromName('test-meeting');
    const stub = env.AGENT.get(id);

    await stub.start('test-meeting');
    await stub.appendChunk('a');
    await stub.appendChunk('b');

    await runInDurableObject(stub, async (instance, ctx) => {
      const state = await ctx.storage.get<{ transcript: string[] }>('state');
      expect(state?.transcript).toEqual(['a', 'b']);
    });
  });

  it('alarm flushes to R2', async () => {
    const id = env.AGENT.idFromName('flush-test');
    const stub = env.AGENT.get(id);
    await stub.start('flush-test');
    await stub.appendChunk('hello');

    // Force the alarm to fire now
    const ran = await runDurableObjectAlarm(stub);
    expect(ran).toBe(true);

    const obj = await env.MEETINGS_BUCKET.get('flush-test.txt');
    expect(await obj?.text()).toBe('hello');
  });
});
```

## Mocking external fetches

```typescript
import { fetchMock } from 'cloudflare:test';
import { beforeAll, afterEach, afterAll } from 'vitest';

beforeAll(() => fetchMock.activate());
afterEach(() => fetchMock.assertNoPendingInterceptors());
afterAll(() => fetchMock.deactivate());

it('calls upstream API', async () => {
  fetchMock.get('https://api.example.com')
    .intercept({ path: '/health' })
    .reply(200, { ok: true });

  const res = await fetch('https://api.example.com/health');
  expect(res.ok).toBe(true);
});
```

## Calling your Worker as a black box: `SELF`

```typescript
import { SELF } from 'cloudflare:test';

it('returns 401 without auth', async () => {
  const res = await SELF.fetch('http://localhost/meetings');
  expect(res.status).toBe(401);
});
```

`SELF` runs your Worker through wrangler-built routes, applying middleware, auth, etc.

## Testing Tail Workers

```typescript
import { env, createTailEvent } from 'cloudflare:test';

it('forwards exceptions to Slack queue', async () => {
  const event = createTailEvent({
    scriptName: 'synth-agent',
    outcome: 'exception',
    exceptions: [{ name: 'Error', message: 'D1 timed out', stack: '...', timestamp: Date.now() }],
    logs: [],
    eventTimestamp: Date.now(),
    event: null,
  });

  await tailWorker.tail([event], env, createExecutionContext());

  const slackMsg = await env.SLACK_QUEUE.peek();
  expect(slackMsg.body.text).toContain('D1 timed out');
});
```

## Coverage with thresholds

`pnpm test --coverage` shows a table; configured thresholds fail CI if you drop below:

```
=== Coverage summary ===
Statements   : 87.4% ( 2154/2465 )
Branches     : 78.2% ( 614/785 )
Functions    : 84.6% ( 269/318 )
Lines        : 87.4% ( 2154/2465 )
```

## CI integration (GitHub Actions)

```yaml
- name: Test with coverage
  run: pnpm -r test --coverage --reporter=junit --outputFile=test-results/junit.xml

- name: Publish junit
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: vitest
    path: test-results/junit.xml
    reporter: jest-junit

- name: Upload coverage
  uses: codecov/codecov-action@v4
  with:
    files: ./apps/*/coverage/lcov.info
```

## Per-app monorepo pattern

Every Worker app has its own `vitest.config.ts` that extends a shared base:

```typescript
// vitest.base.ts
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export const baseConfig = defineWorkersConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
```

```typescript
// apps/synth-agent/vitest.config.ts
import { mergeConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.base.js';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default mergeConfig(baseConfig, defineWorkersConfig({
  test: {
    poolOptions: {
      workers: { wrangler: { configPath: './wrangler.jsonc' } },
    },
  },
}));
```

## Pitfalls

- **`describe`/`it` outside the workers pool**: Vitest still runs other patterns (e.g. unit tests for shared packages) in the Node pool. You can mix pools per-file via `pool: 'workers'` in test config or per-`describe` directives — but be deliberate about which.
- **`process.env` access in Workers tests**: doesn't work the same. Use `env.X` from `cloudflare:test`.
- **`fetch` inside DOs going through `fetchMock`**: yes, because the DO runs in the same pool.
- **Coverage missing files** because they were never imported: add to `coverage.include` glob; v8 only counts files Vitest sees.
- **Long alarm-driven flows in tests**: use `runDurableObjectAlarm(stub)` to fire alarms synchronously rather than waiting real-time.
- **AI binding in tests**: by default mocked. Provide `experimental_remote: true` to hit real Workers AI for integration tests (slower, paid).
- **Forgetting `waitOnExecutionContext`** before assertions: `ctx.waitUntil` work won't have completed.
