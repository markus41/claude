---
name: OAuth Provider Worker
description: Use when the user asks about building an OAuth 2.0 / OIDC provider on Cloudflare Workers, RS256 JWTs, JWKS endpoints, refresh tokens, or PKCE at the edge.
version: 0.1.0
---

# OAuth Provider on Workers

A minimal OIDC-compatible identity provider as a Worker. Uses:
- **KV** for sessions and refresh tokens
- **Durable Objects** for atomic auth-code redemption (single-use)
- **AI Gateway / Workers Secrets** for the RSA private key
- **JWKS** at `/.well-known/jwks.json`

## Endpoints

| Path | Purpose |
|------|---------|
| `GET /.well-known/openid-configuration` | OIDC discovery doc |
| `GET /.well-known/jwks.json` | Public keys (RS256) |
| `GET /authorize` | Browser-facing login page → issues code |
| `POST /token` | Code/refresh → access + id token |
| `GET /userinfo` | Returns claims for the bearer token |
| `POST /revoke` | Revoke a token |

## RSA key handling

Generate once, store as Worker secret:
```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in private.pem -pubout -out public.pem

# Store private as JWK:
node -e "
const { exportJWK, importPKCS8 } = require('jose');
const fs = require('fs');
(async () => {
  const key = await importPKCS8(fs.readFileSync('private.pem','utf8'), 'RS256');
  console.log(JSON.stringify(await exportJWK(key)));
})();
" | wrangler secret put PRIVATE_JWK_RS256
```

Public JWK (with `kid`) goes in KV or static asset for the `/jwks.json` endpoint.

## Issue tokens (jose at edge)

```typescript
import * as jose from 'jose';

async function issueAccessToken(env: Env, userId: string, scope: string): Promise<string> {
  const jwk = JSON.parse(env.PRIVATE_JWK_RS256);
  const key = await jose.importJWK(jwk, 'RS256');

  return await new jose.SignJWT({ sub: userId, scope })
    .setProtectedHeader({ alg: 'RS256', kid: env.KEY_ID, typ: 'JWT' })
    .setIssuer(env.ISSUER)
    .setAudience(env.AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('15m')
    .setJti(crypto.randomUUID())
    .sign(key);
}
```

## JWKS endpoint

```typescript
if (url.pathname === '/.well-known/jwks.json') {
  const publicJwk = JSON.parse(env.PUBLIC_JWK_RS256);
  return Response.json({
    keys: [{ ...publicJwk, kid: env.KEY_ID, use: 'sig', alg: 'RS256' }]
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' }
  });
}
```

Resource servers (your other Workers) verify against this:
```typescript
import * as jose from 'jose';
const JWKS = jose.createRemoteJWKSet(new URL(`${env.ISSUER}/.well-known/jwks.json`));
const { payload } = await jose.jwtVerify(token, JWKS, {
  issuer: env.ISSUER, audience: env.AUDIENCE
});
```

## PKCE auth code flow

```typescript
// /authorize
const params = new URL(req.url).searchParams;
const challenge = params.get('code_challenge')!;
const method = params.get('code_challenge_method')!;     // must be 'S256'
const redirectUri = params.get('redirect_uri')!;
const state = params.get('state')!;

// Render login page or redirect to upstream IdP...
// On success:
const code = crypto.randomUUID();
const id = env.AUTH_CODES.idFromName(code);
await env.AUTH_CODES.get(id).fetch('https://internal/store', {
  method: 'POST',
  body: JSON.stringify({ userId, challenge, method, redirectUri, scope })
});
return Response.redirect(`${redirectUri}?code=${code}&state=${state}`);
```

Use a **Durable Object** to store codes — it gives single-use redemption (atomic delete-on-read), which KV can't guarantee.

```typescript
// /token (grant_type=authorization_code)
const id = env.AUTH_CODES.idFromName(code);
const stored = await env.AUTH_CODES.get(id).fetch('https://internal/redeem', {
  method: 'POST',
  body: JSON.stringify({ codeVerifier })
});
if (!stored.ok) return new Response('invalid_grant', { status: 400 });
const { userId, scope } = await stored.json();

const accessToken = await issueAccessToken(env, userId, scope);
const refreshToken = crypto.randomUUID();
await env.REFRESH_TOKENS.put(refreshToken, JSON.stringify({ userId, scope }), {
  expirationTtl: 30 * 24 * 3600
});

return Response.json({
  access_token: accessToken,
  token_type: 'Bearer',
  expires_in: 900,
  refresh_token: refreshToken,
  id_token: await issueIdToken(env, userId)
});
```

## Cron rotation

```jsonc
"triggers": { "crons": ["0 3 * * *"] }
```

```typescript
async scheduled(event, env, ctx) {
  // Rotate stale sessions, revoke expired tokens, etc.
  await pruneExpiredKv(env);
}
```

## Pitfalls

- **JWT `aud` mismatch** — every consumer must agree on the audience.
- **Including the private key in `vars`** — public; always a Worker secret.
- **Re-using `kid`** across rotations — always generate a fresh `kid`; serve old + new in JWKS during the rotation window.
- **No `setExpirationTime`** — opens a permanent token. Always set; 15m is a good default for access tokens.
- **Storing access tokens** in KV/DO — they're short-lived by design. Only refresh tokens belong in storage.
- **PKCE with `plain` method** — must require `S256`. Reject `plain` outright.
