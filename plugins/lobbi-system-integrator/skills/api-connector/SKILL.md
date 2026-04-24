---
description: Design REST and SOAP API connector specifications with authentication, pagination, and error handling for insurance and financial services system integrations.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# API Connector Designer

Produce a complete API connector specification for a system-to-system integration. This document is the technical blueprint a developer uses to build the connector. Every decision about authentication, pagination, retries, and configuration is made explicitly.

## API Documentation Review

Before designing the connector, document what is known about the target API:

| Field | Value |
|-------|-------|
| API Name | [System name] REST/SOAP API |
| Base URL (sandbox) | https://sandbox.api.[system].com/v2 |
| Base URL (production) | https://api.[system].com/v2 |
| Authentication method | [OAuth 2.0 / API Key / Basic Auth / Mutual TLS] |
| API version | v2 (or current stable version) |
| Rate limit | 100 requests/minute per API key |
| Pagination style | Cursor / Offset / Page-based |
| Response format | JSON (application/json) |
| API documentation URL | [URL] |
| Sandbox availability | Yes / No |
| Support contact | [vendor support email or portal] |

## Authentication Flow Specification

Choose one of the following patterns based on the API's authentication method:

### OAuth 2.0 — Client Credentials (Machine-to-Machine)

Used when the integration runs as a background service without a user context:

```
Token endpoint: POST https://auth.[system].com/oauth/token
Request body (application/x-www-form-urlencoded):
  grant_type=client_credentials
  client_id={CLIENT_ID}        [from environment variable CLIENT_ID]
  client_secret={CLIENT_SECRET} [from Azure Key Vault]
  scope=policies:read claims:read clients:write

Response:
  {
    "access_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 3600
  }

Usage: Add to every request header:
  Authorization: Bearer {access_token}

Token storage:
  - Store in memory (process/worker scope) — never persist to disk or database
  - Refresh when: expires_in - 60 seconds (refresh 60 seconds before expiry)
  - Refresh mechanism: Re-POST to token endpoint with same credentials

Token refresh pseudocode:
  on startup: fetch_token()
  before each API call: if token_expires_at < now + 60s then fetch_token()
  on 401 response: fetch_token() then retry request once
```

### OAuth 2.0 — Authorization Code (User-Delegated, if required)

Used only if the API requires a specific user's identity for authorization:

```
Authorization endpoint: GET https://auth.[system].com/authorize
  ?response_type=code
  &client_id={CLIENT_ID}
  &redirect_uri=https://[your-app].com/callback
  &scope=policies:read
  &state={random-state-value}  [CSRF protection]

Token exchange: POST https://auth.[system].com/oauth/token
  grant_type=authorization_code
  code={code}
  redirect_uri=https://[your-app].com/callback
  client_id={CLIENT_ID}
  client_secret={CLIENT_SECRET}

Refresh token handling:
  Store refresh token in encrypted database field (not plaintext)
  Rotate refresh token on each use if API supports refresh token rotation
```

### API Key Authentication

```
Key placement: Header (preferred) or Query parameter
Header name: X-API-Key (or as specified by vendor)
Header format:
  X-API-Key: {API_KEY}

Storage:
  - Development: Local environment variable (never in source code)
  - Production: Azure Key Vault secret named "[system-name]-api-key"
  - Rotation: Rotate every 90 days; update Key Vault value without code change

Key per environment: Use separate API keys for sandbox and production. Never use the production API key in development or testing.
```

### Mutual TLS (mTLS)

For APIs requiring certificate-based authentication (common in regulated financial data APIs):

```
Client certificate: .pfx format stored in Azure Key Vault Certificate store
Certificate subject: CN=[firm-name]-integration, O=[Firm], C=US
Certificate validity: 1 year — calendar reminder 60 days before expiry
Renewal process: Generate CSR → vendor signs → import new cert to Key Vault → update connector config

TLS configuration:
  TLS version: 1.2 minimum (1.3 preferred)
  Certificate pinning: Enable if vendor provides a fixed certificate fingerprint
```

## Endpoint Inventory

Document every API endpoint the connector uses:

| # | Method | Path | Purpose | Request Parameters | Response |
|---|--------|------|---------|-------------------|----------|
| 1 | GET | /policies | List all policies | `?status=active&page_token={cursor}&limit=100` | Policy array + next_page_token |
| 2 | GET | /policies/{id} | Get single policy by ID | Path: `id` = policy ID | Policy object |
| 3 | POST | /policies | Create new policy | Request body: PolicyCreateRequest | Created policy object |
| 4 | PUT | /policies/{id} | Update policy | Path: `id`, Body: PolicyUpdateRequest | Updated policy object |
| 5 | GET | /clients/{clientId}/policies | Get policies for a client | Path: `clientId` | Policy array |
| 6 | POST | /claims | Submit a claim | Body: ClaimSubmitRequest | Claim object with claimId |

**Request schema** (for each POST/PUT endpoint, document the full schema):

```json
PolicyCreateRequest:
{
  "client_id": "string (required) — must match AMS client ID format",
  "effective_date": "string (required) — ISO 8601 date: YYYY-MM-DD",
  "expiration_date": "string (required) — ISO 8601 date, must be after effective_date",
  "line_of_business": "string (required) — enum: AUTO, HOME, LIFE, COMMERCIAL",
  "carrier_code": "string (required) — 6-character carrier code",
  "written_premium": "number (required) — decimal, 2 places, USD",
  "producer_id": "string (required) — must match producer record in system",
  "endorsements": "array (optional) — array of EndorsementRequest objects",
  "notes": "string (optional) — max 500 characters"
}
```

**Response schema** (for each endpoint, document key response fields used by the connector):

```json
PolicyObject:
{
  "policy_id": "string — system-assigned unique ID",
  "policy_number": "string — human-readable policy number",
  "status": "string — enum: ACTIVE, CANCELLED, EXPIRED, PENDING",
  "client_id": "string",
  "created_at": "string — ISO 8601 datetime",
  "updated_at": "string — ISO 8601 datetime",
  ...
}
```

**HTTP status codes and meanings** (specific to this API):

| Status Code | Meaning | Connector Action |
|------------|---------|-----------------|
| 200 | Success | Process response body |
| 201 | Created | Extract `policy_id` from response |
| 400 | Bad request — validation error | Parse error details, log, send to DLQ |
| 401 | Unauthorized | Refresh token, retry once |
| 403 | Forbidden — permission issue | Do not retry, alert admin |
| 404 | Record not found | Log as warning, skip record |
| 409 | Conflict — duplicate record | Check for existing record, update instead |
| 422 | Unprocessable entity | Validation failure — log field errors, send to DLQ |
| 429 | Rate limited | Respect Retry-After header, implement backoff (see rate-limiter skill) |
| 500 | Server error | Retry with backoff up to 3 times, then alert |
| 503 | Service unavailable | Retry with backoff, alert if > 5 minutes |

## Pagination Handling

**Cursor-based pagination** (most modern APIs):

```
First request: GET /policies?limit=100
Response: { "data": [...100 items...], "next_page_token": "abc123", "has_more": true }

Subsequent request: GET /policies?limit=100&page_token=abc123
Continue until: "has_more": false OR "next_page_token" is null/absent

Safety limit: Maximum 1000 pages (100,000 records). If limit reached, log a warning and alert operations — this indicates an unexpectedly large dataset.
```

**Offset-based pagination**:

```
Request: GET /policies?offset=0&limit=100
Next:    GET /policies?offset=100&limit=100
Stop when: response array length < limit (last page)

Safety limit: offset <= 100000
```

**Page-number pagination**:

```
Request: GET /policies?page=1&per_page=100
Next: increment page by 1
Stop when: response contains "total_pages" and current page >= total_pages, OR response array is empty
```

## Connector Configuration Schema

Define the configuration fields that can be set per deployment (per client, per environment):

```typescript
interface ConnectorConfig {
  // Environment
  baseUrl: string;              // API base URL (sandbox vs. production)
  environment: 'sandbox' | 'production';
  
  // Authentication
  clientId: string;             // OAuth client ID
  clientSecretKeyVaultName: string;  // Key Vault secret name for client secret
  tokenEndpoint: string;        // OAuth token endpoint URL
  
  // Rate limiting
  requestsPerMinute: number;    // Default: 80 (80% of API limit as safety buffer)
  
  // Retry
  maxRetries: number;           // Default: 3
  retryBaseDelayMs: number;     // Default: 1000 (1 second)
  
  // Pagination
  pageSize: number;             // Default: 100 (or API max)
  maxPages: number;             // Safety limit — default: 1000
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  correlationIdHeader: string;  // Header name for correlation ID (for tracing)
}
```

All configuration values are loaded at startup from environment variables or Azure Key Vault. No values are hardcoded in the connector code.

**Per-environment configuration** (deploy separate configs per environment):

| Config Key | Sandbox Value | Production Value |
|-----------|--------------|-----------------|
| baseUrl | https://sandbox.api.[system].com/v2 | https://api.[system].com/v2 |
| clientId | [sandbox-client-id] | [prod-client-id] (from Key Vault) |
| requestsPerMinute | 80 | 80 |
| logLevel | debug | info |

## Request Correlation

Add a correlation ID to every outbound request for end-to-end tracing:

```
X-Correlation-ID: {uuid}  (generate per request)
X-Request-ID: {uuid}      (if vendor supports; link to vendor's support cases)
```

Log the correlation ID with every request and response. When a vendor support ticket is needed, provide the X-Correlation-ID from the failed request.

## Output Format

Deliver as:

1. API overview table (base URLs, auth method, rate limit, pagination style)
2. Authentication flow specification (complete — one of the four patterns above)
3. Endpoint catalog table
4. Request and response schemas (for each POST/PUT endpoint)
5. HTTP status code handling table
6. Pagination algorithm (pseudocode)
7. Connector configuration schema (TypeScript interface or equivalent)
8. Per-environment configuration table
9. Security checklist (credential storage, secret rotation schedule, TLS requirements)
10. Sandbox testing guide (which endpoints to test, what test data to use, expected responses)
