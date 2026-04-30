---
name: Linear OAuth + Actor Authorization
description: This skill should be used when implementing Linear OAuth 2.0, OAuth actor authorization, or file-storage authentication. Activates on "linear oauth", "linear auth", "actor token", "linear-actor-token", "file storage".
version: 1.0.0
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Linear OAuth + Actor Authorization

References:
- OAuth 2.0: https://linear.app/developers/oauth-2-0-authentication
- Actor authorization: https://linear.app/developers/oauth-actor-authorization
- File storage: https://linear.app/developers/file-storage-authentication

## OAuth 2.0 Flow

### 1. Register app
Settings → API → Applications → New application. Capture:
- `LINEAR_OAUTH_CLIENT_ID`
- `LINEAR_OAUTH_CLIENT_SECRET`
- Redirect URI

### 2. Authorization redirect
```
https://linear.app/oauth/authorize?
  client_id=<id>&
  redirect_uri=<uri>&
  response_type=code&
  scope=read,write,issues:create,comments:create,admin&
  state=<csrf>&
  actor=user            # optional — request actor mode
```

### 3. Token exchange
```http
POST https://api.linear.app/oauth/token
Content-Type: application/x-www-form-urlencoded

code=<code>&redirect_uri=<uri>&client_id=<id>&client_secret=<secret>&grant_type=authorization_code
```
Returns:
```json
{
  "access_token": "lin_oauth_...",
  "token_type": "Bearer",
  "expires_in": 315360000,
  "scope": "read,write"
}
```
Linear OAuth tokens are long-lived (10 years!). Refresh tokens are not issued — re-auth on revoke.

## Actor Authorization

For agents acting on behalf of users:
- Include `actor=user` in the authorize URL
- After exchange, the OAuth token is **owned by the user**, not the app
- All API calls made with this token appear in Linear UI as performed by the user
- For mixed flows (some calls "as the app", some "as a user"), use the `Linear-Actor-Token` header per-call

```http
POST /graphql
Authorization: Bearer <app_oauth_token>
Linear-Actor-Token: <user_actor_token>
```

The actor token is a short-lived (5 min) JWT minted by your backend after verifying the user. The `lib/auth.ts` `mintActorToken(userId)` helper handles signing.

## File-Storage Authentication

Linear's file storage (S3-backed) uses pre-signed URLs:

1. Upload: call `fileUpload` mutation → receive `uploadUrl` + `headers`
2. PUT bytes to `uploadUrl` with the returned headers (don't add your Linear token there)
3. Download: GET the asset URL with the same Linear token in `Authorization` header

```ts
const res = await fetch(assetUrl, {
  headers: { Authorization: `Bearer ${apiKey}` }
});
```

If you proxy assets to end users, **mint a short-lived signed URL on your side** rather than handing out your Linear token.

## Rotation

- API keys: rotate quarterly
- OAuth client secret: rotate yearly or on suspected leak
- Actor tokens: never persist beyond 5 min
- On rotation, support old + new key for 24h overlap to avoid race conditions

## Scope selection guide
| Scope | Required for |
|-------|--------------|
| `read` | All read queries |
| `write` | All mutations except admin |
| `issues:create` | Narrow scope: only creating issues |
| `comments:create` | Narrow scope: comments only |
| `admin` | Workflow / team / webhook config |
| `agents:create` | Register Linear agent apps |
| `agents:signal` | Emit agent signals |
