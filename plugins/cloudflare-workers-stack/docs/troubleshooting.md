# Troubleshooting Cloudflare Workers

## Wrangler / build

### `Error: No event handlers were registered`
Your entry doesn't `export default` anything. Make sure `src/index.ts` exports an object with `fetch` / `scheduled` / `queue` / `email`.

### `Module not found: Can't resolve 'node:crypto'`
Add `nodejs_compat` to `compatibility_flags` in `wrangler.jsonc`.

### `Cannot find module '@workspace/shared-foo'`
- Run `pnpm install` at the workspace root
- Confirm the dep is `"workspace:*"` in your app's `package.json`
- The shared package's `main`/`exports` points to a TS source file (Wrangler's esbuild bundles TS)

### `error: TS5012: Cannot resolve '@cloudflare/workers-types'`
Add to `tsconfig.json`:
```json
{ "compilerOptions": { "types": ["@cloudflare/workers-types"] } }
```

### `wrangler types` writes nothing
You don't have any bindings declared. `wrangler types` only emits the `Env` interface from declared bindings.

### `compatibility_date is in the future`
You set a date Wrangler doesn't recognize yet. Use today or earlier.

## Runtime

### `Cannot find class 'X'` on deploy
Missing migration. Add:
```jsonc
"migrations": [{ "tag": "v1", "new_sqlite_classes": ["X"] }]
```

### `Service "foo" not found`
Service binding points to a Worker that doesn't exist in this account/env. Either deploy that Worker first or remove the binding.

### `D1_ERROR: too many SQL variables`
SQLite caps placeholders per statement. Batch in chunks (`?,?,?,?` up to ~999 values).

### `Vectorize error: dimension mismatch`
Your insert vector dim ≠ index dim. The index dim is immutable — re-create the index.

### `KV PUT: rate limited`
You're writing to the same key > 1×/sec. KV is read-optimized; rethink the write pattern (DO for high-frequency writes).

### `R2 EntityTooSmall on completeMultipartUpload`
A part (other than the last) is < 5 MB.

### `error 1042: Connection lost`
Hyperdrive: the upstream Postgres connection was reset. Common causes:
- IP allowlist missing Cloudflare's egress range
- Idle timeout at the Postgres side
- Pool exhausted upstream — increase Postgres `max_connections`

### `worker exceeded resource limits: cpu time`
You hit the CPU cap mid-request. Defer to a queue or DO alarm; cache aggressive; minimize per-request allocations.

## Durable Objects

### State seems to disappear between requests
- Forgot `await` on `storage.put`
- DO instance ids differ (`idFromName` vs `newUniqueId` mismatch)
- Migration tag missing → instance never persisted

### `alarm()` fired multiple times
Expected (at-least-once). Make `alarm()` idempotent.

### Concurrent calls race during init
Wrap init in:
```typescript
state.blockConcurrencyWhile(async () => {
  this.cache = await state.storage.get('state');
});
```

### `DurableObjectNamespace` undefined
Binding name in code doesn't match `wrangler.jsonc`. Re-run `wrangler types`.

## Auth / OAuth

### `JWT verify failed: kid not found`
Token signed with a key the consumer's JWKS doesn't list. Either old `kid` after rotation (serve both old + new during rotation) or wrong issuer.

### `redirect_uri_mismatch`
The redirect URI sent to `/authorize` doesn't match what's stored at code-redemption time. Bind the URI into the auth code record and check on `/token`.

### `CSRF state mismatch`
Always generate state with `crypto.randomUUID()`, store with the code, verify on callback.

## Local dev

### `wrangler dev` starts but `env.X` is undefined
You're hitting `*.workers.dev` (remote). Use `--local` (the default) or set local mocks. Some bindings (Vectorize, AI) require `--remote`.

### `EADDRINUSE: 8787`
Another `wrangler dev` is running. Kill it or pass `--port 8788`.

### Local D1 has stale schema
Re-apply migrations: `wrangler d1 migrations apply DB --local`. Or nuke `.wrangler/state` and re-run.

### `Cannot find tail` on `wrangler tail`
`wrangler tail` works against deployed Workers, not local dev. For local logs, use the `wrangler dev` terminal output.

## CI

### `wrangler-action` fails with `403`
API token lacks scope. Required at minimum:
- Account: Workers Scripts: Edit
- Account: Workers KV Storage: Edit (if KV)
- Account: D1: Edit (if D1)
- Account: Workers R2 Storage: Edit (if R2)
- Account: Vectorize: Edit (if Vectorize)
- Zone: Workers Routes: Edit (if routes)

### Deploy ok, but routes don't update
- `routes` block only applies for the matching `--env`
- Custom Domain set in dashboard takes precedence over `routes` in config

## Diagnostic dumps

```bash
wrangler whoami
wrangler tail <worker> --format pretty
wrangler d1 info DB
wrangler r2 bucket info my-bucket
wrangler vectorize info my-index
```
