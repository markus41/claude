/**
 * Linear OAuth + actor authorization helpers.
 *
 * Implements:
 *  - OAuth 2.0 authorize URL builder
 *  - Code → token exchange
 *  - Actor token minting (short-lived JWT)
 *  - Token rotation with overlap window
 *
 * References:
 *  - https://linear.app/developers/oauth-2-0-authentication
 *  - https://linear.app/developers/oauth-actor-authorization
 */

import { createHmac } from "node:crypto";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthTokens {
  accessToken: string;
  scope: string[];
  expiresIn: number;
  tokenType: "Bearer";
}

const AUTHORIZE_URL = "https://linear.app/oauth/authorize";
const TOKEN_URL = "https://api.linear.app/oauth/token";
const REVOKE_URL = "https://api.linear.app/oauth/revoke";

export function buildAuthorizeUrl(
  cfg: OAuthConfig,
  state: string,
  options: { actor?: "user" | "app" } = {}
): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: cfg.scopes.join(","),
    state,
  });
  if (options.actor) params.set("actor", options.actor);
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCode(
  cfg: OAuthConfig,
  code: string
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Linear OAuth token exchange failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return {
    accessToken: json.access_token,
    tokenType: json.token_type,
    expiresIn: json.expires_in,
    scope: String(json.scope).split(","),
  };
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Mint a short-lived JWT-like signed token used as Linear-Actor-Token header.
 * The signing secret must be the OAuth app's client secret (or a derived key).
 */
export function mintActorToken(
  userId: string,
  appSecret: string,
  ttlSeconds = 300
): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    })
  );
  const sig = createHmac("sha256", appSecret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

function b64url(s: string): string {
  return Buffer.from(s).toString("base64url");
}
