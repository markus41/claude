---
description: Design webhook event routing, payload validation, and retry logic for real-time event-driven integrations where source systems push policy changes, loan status updates, or payment events.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Webhook Orchestrator

Produce a complete webhook receiver and event routing specification. The output is the technical design a developer uses to build the webhook endpoint, event router, and retry infrastructure.

## Webhook Receiver Design

**Endpoint specification**:

| Field | Value |
|-------|-------|
| URL structure | `https://integrations.[firm].com/webhooks/{source-system}` |
| HTTP method | POST only (reject GET, PUT, DELETE with 405) |
| Content-Type required | `application/json` |
| TLS | Required — TLS 1.2 minimum. Reject HTTP (respond with 301 or close connection). |
| IP allowlist | If source system provides a list of static egress IPs, add them to the allowlist. Document the IP list and who to contact at the vendor when IPs change. |
| Response SLA | Respond with HTTP 200 within 5 seconds. Any processing beyond 5 seconds must be async (acknowledge immediately, process in background queue). |
| Endpoint authentication | Shared secret signature (HMAC) OR basic auth token in header — see Payload Validation section |

**Why respond immediately**: Webhook senders typically time out after 5-30 seconds and may retry if no response is received. All processing logic (database writes, downstream API calls, notifications) must happen asynchronously in a queue after the 200 response is sent.

**Response structure**:
```json
HTTP 200 OK
{
  "received": true,
  "event_id": "{deduplication-key-extracted-from-payload}",
  "queued_at": "2026-04-15T14:30:00Z"
}

HTTP 400 Bad Request (invalid payload structure):
{
  "error": "INVALID_PAYLOAD",
  "message": "Required field 'event_type' is missing"
}

HTTP 401 Unauthorized (signature validation failed):
{
  "error": "INVALID_SIGNATURE",
  "message": "Webhook signature does not match"
}
```

## Payload Validation

Validate every incoming webhook before processing. Reject invalid payloads at the receiver — do not pass them to the event queue.

### HMAC Signature Verification

Most modern webhook senders include a signature in the request headers. Verify it before processing:

```typescript
function validateHmacSignature(
  payload: string,         // raw request body as string — do NOT parse JSON first
  receivedSignature: string, // from header: X-Hub-Signature-256 or similar
  secret: string           // shared secret from Key Vault
): boolean {
  // Vendor format may be: sha256={hex-signature}
  const expectedSignature = 'sha256=' + 
    crypto.createHmac('sha256', secret)
          .update(payload, 'utf8')
          .digest('hex');
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(expectedSignature)
  );
}

// In the request handler:
const rawBody = req.body.toString('utf8'); // read as raw string before JSON parse
const signature = req.headers['x-webhook-signature'] as string;
if (!validateHmacSignature(rawBody, signature, webhookSecret)) {
  return res.status(401).json({ error: 'INVALID_SIGNATURE' });
}
const payload = JSON.parse(rawBody);
```

**Critical**: Read the raw body before parsing. JSON parsers may reorder fields, changing the string and breaking the HMAC comparison.

**Header name by vendor**: Each vendor uses a different header name. Document the exact header name:

| System | Signature Header | Format |
|--------|-----------------|--------|
| Generic / custom | X-Webhook-Signature | sha256={hex} |
| GitHub-style | X-Hub-Signature-256 | sha256={hex} |
| Stripe-style | Stripe-Signature | t={timestamp},v1={signature} |
| Custom vendor | X-[System]-Signature | {hex} |

For Stripe-style signatures (timestamp + signature), also validate that the timestamp is within 5 minutes of current time to prevent replay attacks.

### Source IP Validation

If the webhook source provides a static egress IP list:

```typescript
const ALLOWED_IPS = ['203.0.113.10', '203.0.113.11']; // document source

function validateSourceIP(requestIP: string): boolean {
  return ALLOWED_IPS.includes(requestIP);
}
```

Document where the IP list comes from and how to update it when the vendor changes their egress IPs.

### Payload Schema Validation

After signature verification, validate the payload structure:

```typescript
// Required fields for all events from this source
const requiredFields = ['event_type', 'event_id', 'timestamp', 'data'];

for (const field of requiredFields) {
  if (!(field in payload)) {
    return res.status(400).json({
      error: 'INVALID_PAYLOAD',
      message: `Required field '${field}' is missing`
    });
  }
}

// Validate event_type is a known type
const knownEventTypes = new Set([
  'policy.created', 'policy.updated', 'policy.cancelled',
  'claim.submitted', 'claim.status_changed',
  'payment.received', 'payment.failed'
]);

if (!knownEventTypes.has(payload.event_type)) {
  // Log unknown event type — do not reject (forward-compatibility)
  logger.warn('Unknown event type received', { eventType: payload.event_type });
  // Still return 200 — do not cause the sender to retry unknown future events
  return res.status(200).json({ received: true, note: 'event_type not handled' });
}
```

## Event Routing

Extract the event type and route to the appropriate handler. Use a registry pattern — avoid a giant switch statement.

**Event routing table**:

| Event Type | Handler Module | Downstream System | Priority |
|-----------|---------------|------------------|----------|
| `policy.created` | handlers/policy-created.ts | CRM, SharePoint, Teams notification | High |
| `policy.updated` | handlers/policy-updated.ts | CRM, SharePoint | Normal |
| `policy.cancelled` | handlers/policy-cancelled.ts | CRM, Teams alert, Renewal tracker | High |
| `claim.submitted` | handlers/claim-submitted.ts | Claims SharePoint library, Teams alert | High |
| `claim.status_changed` | handlers/claim-status.ts | Claims tracker, agent notification | Normal |
| `payment.received` | handlers/payment-received.ts | AMS, accounting system | High |
| `payment.failed` | handlers/payment-failed.ts | Agent alert, client outreach queue | High |

**Routing implementation pattern**:

```typescript
const eventHandlers: Record<string, EventHandler> = {
  'policy.created': policyCreatedHandler,
  'policy.updated': policyUpdatedHandler,
  'policy.cancelled': policyCancelledHandler,
  'claim.submitted': claimSubmittedHandler,
  'claim.status_changed': claimStatusHandler,
  'payment.received': paymentReceivedHandler,
  'payment.failed': paymentFailedHandler,
};

// In webhook receiver (after validation):
await eventQueue.enqueue({
  eventType: payload.event_type,
  eventId: payload.event_id,
  timestamp: payload.timestamp,
  data: payload.data,
  receivedAt: new Date().toISOString(),
  source: 'ams-webhook'
});

// In queue consumer:
const handler = eventHandlers[event.eventType];
if (handler) {
  await handler.process(event);
} else {
  logger.warn('No handler registered', { eventType: event.eventType });
}
```

**Fanout**: For events that trigger multiple downstream actions, the handler orchestrates all actions. Each action is independent — if one fails, the others should still proceed (use Promise.allSettled, not Promise.all).

## Idempotency Design

The source system may send the same event multiple times (network retry, system restart). The receiver must be idempotent — processing the same event twice must produce the same result as processing it once.

**Deduplication key extraction**:
- Use `event_id` from the payload as the deduplication key. If absent, compute: `sha256(event_type + JSON.stringify(data) + timestamp)`.

**Idempotency store** (choose based on scale):
- Low volume (< 1000 events/day): SharePoint list with event_id column, indexed
- Medium volume: Redis cache with TTL
- High volume: Azure Table Storage

**Deduplication check**:

```typescript
async function isDuplicate(eventId: string): Promise<boolean> {
  // Check idempotency store (Redis example)
  const exists = await redis.exists(`webhook:processed:${eventId}`);
  return exists === 1;
}

async function markProcessed(eventId: string): Promise<void> {
  // Store with 7-day TTL (covers any reasonable retry window)
  await redis.setex(`webhook:processed:${eventId}`, 7 * 24 * 3600, '1');
}

// In queue consumer:
if (await isDuplicate(event.eventId)) {
  logger.info('Duplicate event discarded', { eventId: event.eventId });
  return; // silently discard
}
await processEvent(event);
await markProcessed(event.eventId);
```

## Retry and Dead-Letter Handling

**Retry strategy for failed processing** (not for the HTTP response — that must be immediate):

| Attempt | Delay Before Retry | Trigger |
|---------|-------------------|---------|
| 1 (initial) | 0 | Queue consumption |
| 2 (first retry) | 30 seconds | Processing failure |
| 3 (second retry) | 5 minutes | Processing failure |
| 4 (third retry) | 30 minutes | Processing failure |
| Dead letter | — | 3rd retry failure |

Use Azure Service Bus or equivalent with built-in dead-letter queue (DLQ) support. Each queue message has a `DeliveryCount` property — move to DLQ when delivery count > 3.

**Dead-letter queue schema** (stored in SharePoint list or database for operational review):

| Field | Type | Description |
|-------|------|-------------|
| EventId | Text | Original deduplication key |
| EventType | Text | |
| ReceivedAt | DateTime | When the webhook arrived |
| FailedAt | DateTime | When processing failed |
| AttemptCount | Integer | How many times processing was attempted |
| ErrorCode | Text | Error classification |
| ErrorMessage | Text | Full error message |
| Payload | Multiline text | Full JSON payload (truncated if > 10KB) |
| Status | Choice | New; Under Review; Reprocessed; Discarded |
| AssignedTo | Person | Who is investigating |

**DLQ monitoring**: Check the DLQ depth daily. If > 50 items: alert the integration team. If > 100 items: escalate to the integration owner.

**Manual reprocess**: Provide a utility function that reads a DLQ item and resubmits it to the processing queue with `force = true` (bypasses idempotency check). Require a human to confirm before reprocessing to prevent accidental double-processing of payment events.

## Alerting

| Alert Condition | Severity | Notification |
|----------------|----------|-------------|
| DLQ depth > 10 | Warning | Teams alert to integration channel |
| DLQ depth > 50 | High | Email + Teams to integration lead |
| Signature validation failure (> 5 in 1 hour) | High | Security team — may indicate spoofing attempt |
| Webhook endpoint down (no 200 responses for 10 min) | Critical | PagerDuty / on-call |
| Processing latency > 30 seconds | Warning | Performance alert |

## Event Log

Log every received webhook regardless of processing outcome:

```typescript
interface WebhookEventLog {
  eventId: string;
  eventType: string;
  source: string;
  receivedAt: string;     // ISO 8601
  payloadHash: string;    // sha256 of payload — not the payload itself (may contain PII)
  signatureValid: boolean;
  processingResult: 'queued' | 'duplicate_discarded' | 'rejected_invalid' | 'processed' | 'dead_lettered';
  processingDurationMs?: number;
  error?: string;
}
```

Retain event logs for 90 days. For regulated events (payment received, policy created), retain for 7 years per the standard retention policy.

## Output Format

Deliver as:

1. Webhook receiver specification (endpoint URL, method, TLS, IP allowlist, response SLA)
2. Payload validation specification (HMAC verification code pattern, source IP check, schema validation)
3. Event routing table (event type → handler → downstream system)
4. Idempotency design (deduplication key, storage choice, TTL)
5. Retry and DLQ specification (retry schedule, DLQ schema, reprocess workflow)
6. Alert rule table
7. Event log schema
8. Infrastructure requirements (queue service, idempotency store, logging destination)
9. Testing scenarios (happy path, duplicate event, invalid signature, unknown event type, DLQ processing)
