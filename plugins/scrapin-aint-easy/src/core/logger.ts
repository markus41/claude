/**
 * Shared pino logger factory with redact paths configured for common
 * credential-bearing fields. Modules that log fetch-style request/response
 * data (crawlers, webhook emitter, auth-adjacent paths) should prefer
 * `createLogger(name)` over calling `pino({ name })` directly so a key
 * embedded in a URL, header, or error object is not written verbatim
 * into `data/logs/` or MCP tool error responses.
 *
 * The rest of the codebase will migrate to this factory gradually; each
 * site only needs to swap `pino({ name })` → `createLogger(name)`.
 */

import pino from 'pino';

const REDACT_PATHS = [
  // direct header / credential field names
  '*.authorization',
  '*.Authorization',
  '*.api_key',
  '*.apiKey',
  '*.password',
  '*.secret',
  '*.token',
  '*.access_token',
  '*.refresh_token',
  // nested inside `headers`, `request`, `response`, `config`
  '*.headers.authorization',
  '*.headers.Authorization',
  '*.headers["x-api-key"]',
  '*.request.headers.authorization',
  '*.response.headers.authorization',
  '*.config.headers.authorization',
  // env-style
  'FIRECRAWL_API_KEY',
  'GITHUB_TOKEN',
  'NEO4J_PASSWORD',
];

export function createLogger(name: string): pino.Logger {
  return pino({
    name,
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
  });
}
