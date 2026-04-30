---
name: Workers RPC Entrypoints
description: Use when the user asks about WorkerEntrypoint, typed service bindings, RPC between Workers, Workers RPC over the network, returning structured data (not Response objects), or replacing fetch-style internal APIs with native function calls.
version: 0.1.0
---

# Workers RPC: Typed Worker-to-Worker Calls

Workers RPC replaces the "service binding + fetch JSON" pattern with **direct typed method calls** between Workers. The transport is the same fast in-process bridge that powers DOs; the surface is just plain methods.

## Why use it over `fetch` service bindings

| Aspect | `fetch` service binding | RPC `WorkerEntrypoint` |
|--------|------------------------|------------------------|
| Type safety | manual ts types on body shapes | end-to-end inferred |
| Boilerplate | URL parsing + JSON encode/decode | zero — call a method |
| Performance | one HTTP roundtrip simulated | direct in-process call |
| Streaming | manually with chunked response | return `ReadableStream` |
| Returning rich types | only JSON-serializable | structured-cloneable + Web APIs |
| Errors | HTTP status codes | thrown errors propagate |

## Define the entrypoint (oauth-provider)

```typescript
// apps/oauth-provider/src/index.ts
import { WorkerEntrypoint } from 'cloudflare:workers';
import * as jose from 'jose';

export interface Env {
  PRIVATE_JWK_RS256: string;
  PUBLIC_JWK_RS256: string;
  ISSUER: string;
  AUDIENCE: string;
  KEY_ID: string;
}

export class OAuthEntrypoint extends WorkerEntrypoint<Env> {
  async issueAccessToken(userId: string, scope: string): Promise<string> {
    const key = await jose.importJWK(JSON.parse(this.env.PRIVATE_JWK_RS256), 'RS256');
    return await new jose.SignJWT({ sub: userId, scope })
      .setProtectedHeader({ alg: 'RS256', kid: this.env.KEY_ID, typ: 'JWT' })
      .setIssuer(this.env.ISSUER)
      .setAudience(this.env.AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('15m')
      .setJti(crypto.randomUUID())
      .sign(key);
  }

  async verify(token: string): Promise<{ userId: string; tenantId: string; scope: string } | null> {
    try {
      const JWKS = jose.createRemoteJWKSet(new URL(`${this.env.ISSUER}/.well-known/jwks.json`));
      const { payload } = await jose.jwtVerify(token, JWKS, {
        issuer: this.env.ISSUER, audience: this.env.AUDIENCE
      });
      return {
        userId: payload.sub as string,
        tenantId: (payload as any).tenantId,
        scope: (payload.scope as string) ?? '',
      };
    } catch {
      return null;
    }
  }

  // Streaming RPC — return a ReadableStream
  async *streamSessionEvents(sessionId: string): AsyncGenerator<{ type: string; payload: unknown }> {
    // ... fan-out from a Durable Object, etc.
  }
}

// Default fetch handler still required (for HTTP endpoints like /authorize, /token)
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // ... HTTP handlers
    return new Response('ok');
  }
};
```

## Bind from a consumer Worker (synth-agent)

```jsonc
// apps/synth-agent/wrangler.jsonc
"services": [
  { "binding": "AUTH", "service": "oauth-provider", "entrypoint": "OAuthEntrypoint" }
]
```

Then in code:

```typescript
import type { OAuthEntrypoint } from '@workspace/oauth-provider';   // shared types

export interface Env {
  AUTH: Service<OAuthEntrypoint>;
  // ... other bindings
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const token = req.headers.get('Authorization')?.slice(7);
    if (!token) return new Response('unauthorized', { status: 401 });

    // Typed RPC call — IDE autocompletes, compiler enforces
    const verified = await env.AUTH.verify(token);
    if (!verified) return new Response('unauthorized', { status: 401 });

    return Response.json({ userId: verified.userId });
  }
};
```

## Sharing types via the workspace

In a pnpm-workspaces monorepo:

```jsonc
// apps/oauth-provider/package.json
{
  "name": "@workspace/oauth-provider",
  "exports": {
    ".": "./src/types.ts"
  }
}
```

```typescript
// apps/oauth-provider/src/types.ts
export type { OAuthEntrypoint } from './index.js';
```

Now `import type { OAuthEntrypoint } from '@workspace/oauth-provider'` works in any consumer.

## Returning rich types

You can return:
- Primitives, arrays, plain objects (structured clone)
- `Date`, `Map`, `Set`, typed arrays
- `ReadableStream`, `WritableStream`
- `Request`, `Response`
- `Blob`, `File`
- Other RPC stubs (you can hand a stub of one entrypoint to another!)

What you **can't**:
- Functions / classes with prototypes (other than the listed Web APIs)
- DOM nodes (no DOM in Workers anyway)
- Circular references

## Streaming responses via RPC

```typescript
export class TranscriptEntrypoint extends WorkerEntrypoint<Env> {
  async streamTranscript(meetingId: string): Promise<ReadableStream<Uint8Array>> {
    const obj = await this.env.BUCKET.get(`transcripts/${meetingId}.txt`);
    if (!obj) throw new Error('not found');
    return obj.body!;     // Worker streams it across the RPC boundary
  }
}

// Consumer
const stream = await env.TRANSCRIPT.streamTranscript(meetingId);
return new Response(stream, { headers: { 'Content-Type': 'text/plain' }});
```

## Returning a stub for further calls (capability passing)

```typescript
export class SessionEntrypoint extends WorkerEntrypoint<Env> {
  async startSession(userId: string): Promise<SessionHandle> {
    const sessionId = crypto.randomUUID();
    return new SessionHandle(this.env, sessionId, userId);
  }
}

export class SessionHandle {
  constructor(private env: Env, public sessionId: string, public userId: string) {}
  async append(chunk: string) { /* ... */ }
  async close() { /* ... */ }
}
```

Consumer holds the returned `SessionHandle` and calls `.append(...)` directly, no further routing logic needed. This is essentially capability-based design at the Worker level.

## Errors

Throwing inside an entrypoint propagates to the caller as a thrown JS error:

```typescript
async verify(token: string) {
  if (!token) throw new Error('token required');
  // ...
}

// Consumer
try {
  await env.AUTH.verify(t);
} catch (e) {
  // e instanceof Error, e.message === 'token required'
}
```

For typed errors, throw subclasses; the message survives. Custom error classes are *not* preserved across the boundary — receivers get a plain `Error`. Encode the type in the message or return a discriminated union.

## RPC over the network (cross-zone)

For the same RPC surface across separate Cloudflare accounts or for explicit network calls, use the `Service` binding with `entrypoint` plus an HTTPS route. The transport switches transparently; latency goes from microseconds to 10s of ms. Stable typed signatures, no JSON.

## Testing with `vitest-pool-workers`

```typescript
import { describe, it, expect } from 'vitest';
import { env, runInDurableObject } from 'cloudflare:test';
import worker from '../src/index';

describe('OAuthEntrypoint', () => {
  it('verifies a fresh token', async () => {
    // Set up a stub or use the real OAuth Worker via service binding in test config
    const t = await env.AUTH.issueAccessToken('user-1', 'read');
    const v = await env.AUTH.verify(t);
    expect(v?.userId).toBe('user-1');
  });
});
```

## When to keep `fetch` service bindings

- Your downstream is a public HTTP API anyway (no point introducing two surfaces)
- You truly need URL paths / methods as the routing primitive (REST style)
- Backwards compat with non-Worker consumers

For all internal Worker-to-Worker RPC in a monorepo, prefer `WorkerEntrypoint`.

## Pitfalls

- **Forgetting `entrypoint` in the service binding**: defaults to a `fetch` handler. Add `"entrypoint": "ClassName"`.
- **Exporting the class as default**: it must be a *named* export.
- **Non-cloneable return types**: e.g. returning a class instance with methods → silently loses methods on the consumer side. Return plain objects (or RPC stubs).
- **Throwing custom error classes** and expecting `instanceof` to work on the consumer: it won't. Use error codes in the message.
- **Importing the class itself** rather than `import type`: pulls the entire downstream Worker code into your bundle. Always `import type`.
- **Holding RPC stubs across requests** in module-level state: stubs are tied to the request that created them. Get a fresh stub each request.
