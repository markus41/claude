---
description: Design integration error classification, retry strategies, and dead-letter handling for insurance and financial services system integrations.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Error Handler

Produce a complete error handling design for a system integration. Every error category gets an explicit retry strategy, escalation path, and resolution workflow. The output is the technical specification a developer implements in the integration layer.

## Error Taxonomy

Classify every possible error into one of three categories. The category determines the retry strategy.

### Category 1: Transient Errors (Retry Eligible)

The error is temporary. The operation will likely succeed if retried.

| Error Type | HTTP Status | Example | Detection Method |
|-----------|-------------|---------|-----------------|
| Rate limit exceeded | 429 | API throttled | HTTP status + Retry-After header |
| Service temporarily unavailable | 503 | Destination system down for maintenance | HTTP status |
| Network timeout | — | Connection timed out after 30s | Exception: ConnectTimeoutError, ReadTimeoutError |
| Gateway timeout | 504 | Reverse proxy upstream timeout | HTTP status |
| Service overloaded | 500 with "retry" in body | Some APIs return 500 for transient overload | HTTP status + body inspection |
| Database deadlock | — | SQL deadlock on destination DB write | Exception: SqlException with error code 1205 |

**Retry strategy for transient errors**:
```
Algorithm: Exponential backoff with full jitter

base_delay = 1 second
max_delay = 60 seconds
max_attempts = 5
jitter = random(0, base_delay)

wait_time(attempt) = min(base_delay * 2^attempt + jitter, max_delay)

Attempt 1: 0s (immediate)
Attempt 2: ~2s (base*2 + jitter)
Attempt 3: ~4s (base*4 + jitter)
Attempt 4: ~8s (base*8 + jitter)
Attempt 5: ~16s (base*16 + jitter)
After attempt 5: Send to dead-letter queue
```

**Rate limit (429) special handling**: If the response includes a `Retry-After` header, use that value instead of the exponential backoff calculation. The `Retry-After` value is authoritative.

### Category 2: Permanent Errors (Do Not Retry)

The operation will fail regardless of how many times it is retried. Retrying wastes resources and delays detection.

| Error Type | HTTP Status | Example | Action |
|-----------|-------------|---------|--------|
| Validation failure | 400, 422 | Required field missing, invalid format | Send to exception queue for manual correction |
| Record not found | 404 | Foreign key reference points to non-existent record | Log, skip record, increment missing-reference counter |
| Duplicate record | 409 | Policy already exists in destination | Check for existing record, update instead of create |
| Authorization failure | 403 | API key lacks permission for this endpoint | Alert admin — permission configuration issue, not data issue |
| Schema mismatch | 400 | API contract changed, field rejected | Alert integration team — API upgrade may be needed |
| Business rule violation | 422 with specific error code | Destination rejects policy date in past | Send to exception queue, notify business team |

**Duplicate record (409) handling**:
```
On 409 response:
  1. Extract the existing record identifier from the 409 response body
  2. Issue a GET request to fetch the existing record
  3. Compare key fields: if destination record matches source, mark as "already synced" and continue
  4. If destination record differs, issue a PUT/PATCH to update the existing record
  5. If update succeeds: log "409 resolved via update"
  6. If update fails: send to exception queue
```

### Category 3: Business Errors (Route to Exception Queue)

The operation is technically valid but cannot be processed automatically due to a business rule or data quality issue.

| Error Type | Example | Exception Queue Category |
|-----------|---------|------------------------|
| Missing required reference | Policy references an unknown producer NPI | "Unknown Reference" |
| Data quality issue | Client name is blank, required by destination | "Data Quality" |
| Authorization mismatch | Policy for a client from a different agency than expected | "Business Rule Violation" |
| Out-of-bounds value | Premium amount is negative | "Data Quality" |
| Duplicate natural key | Policy number already exists with different data | "Duplicate — Requires Review" |

## Retry Implementation

### Retry Pseudocode

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorCategory = classifyError(error);
      
      if (errorCategory !== ErrorCategory.TRANSIENT) {
        // Non-transient: do not retry
        throw new NonRetryableError(error, errorCategory);
      }
      
      if (attempt === config.maxAttempts) {
        // Exhausted retries
        throw new RetriesExhaustedError(error, attempt);
      }
      
      const delay = calculateBackoff(attempt, config, error);
      logger.warn('Transient error, retrying', { attempt, delay, error: error.message });
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

function calculateBackoff(attempt: number, config: RetryConfig, error: Error): number {
  // Respect Retry-After header if present
  if (error instanceof ApiError && error.retryAfterSeconds) {
    return error.retryAfterSeconds * 1000;
  }
  
  const exponential = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * config.baseDelayMs;
  return Math.min(exponential + jitter, config.maxDelayMs);
}
```

### Error Classification

```typescript
enum ErrorCategory {
  TRANSIENT = 'TRANSIENT',
  PERMANENT = 'PERMANENT',
  BUSINESS = 'BUSINESS'
}

function classifyError(error: unknown): ErrorCategory {
  if (error instanceof ApiError) {
    if ([429, 503, 504].includes(error.status)) return ErrorCategory.TRANSIENT;
    if (error.status === 500 && error.body?.includes('retry')) return ErrorCategory.TRANSIENT;
    if ([400, 403, 422].includes(error.status)) return ErrorCategory.PERMANENT;
    if (error.status === 409) return ErrorCategory.PERMANENT; // handled separately
    if (error.status === 404) return ErrorCategory.PERMANENT;
  }
  if (error instanceof NetworkError) return ErrorCategory.TRANSIENT;
  if (error instanceof ValidationError) return ErrorCategory.PERMANENT;
  if (error instanceof BusinessRuleError) return ErrorCategory.BUSINESS;
  
  // Unknown errors: treat as transient for safety, but cap at 2 retries
  return ErrorCategory.TRANSIENT;
}
```

## Dead-Letter Queue Design

The DLQ is the landing zone for records that failed all retry attempts. It must support manual review and reprocessing.

**DLQ storage**: SharePoint list (for small integrations) or Azure Table Storage (for high-volume integrations).

**DLQ schema**:

| Column | Type | Description |
|--------|------|-------------|
| RecordId | Text | Auto-generated GUID |
| IntegrationName | Text | Which integration produced this DLQ entry |
| SourceSystem | Text | |
| DestinationSystem | Text | |
| OperationType | Choice | Create / Update / Delete / Sync |
| ErrorTimestamp | DateTime | When the final failure occurred |
| ErrorCategory | Choice | Transient-Exhausted / Permanent / Business |
| ErrorCode | Text | HTTP status or exception type |
| ErrorMessage | Text | Full error message (truncated to 2000 chars) |
| AttemptCount | Integer | Total attempts made |
| SourceRecordId | Text | ID of the record in the source system |
| SourcePayload | Multiline text | JSON payload sent to destination (redacted if contains PII) |
| ResponseBody | Multiline text | Response from destination system |
| Status | Choice | New / Under Investigation / Resolved / Discarded |
| AssignedTo | Person | |
| ResolutionNotes | Multiline text | How it was resolved |
| ResolvedAt | DateTime | |

**PII redaction in DLQ**: Before storing the SourcePayload, redact sensitive fields (SSN, account numbers, dates of birth). Replace with `[REDACTED]`. Store only enough context to identify and reproduce the issue.

**DLQ monitoring dashboard** (Power BI report page or SharePoint view):
- Open DLQ items by category (Transient-Exhausted / Permanent / Business)
- DLQ items by integration and source system
- DLQ age distribution: how many items are 0-24h, 1-7d, 7-30d, >30d old
- Resolution rate: what % of DLQ items are resolved within 24 hours

## Manual Reprocess Workflow

Provide a safe reprocess mechanism for DLQ items:

**Reprocess single item**:
1. DLQ reviewer reads the DLQ item and the error message
2. Corrects the underlying issue (fixes source data, adds missing reference, updates mapping)
3. Updates the DLQ item Status to "Under Investigation" and AssignedTo their name
4. Calls the reprocess function with `forceReprocess: true` (bypasses idempotency check for this item)
5. Monitors the processing result
6. If successful: updates DLQ Status to "Resolved", adds resolution note
7. If still failing: escalates to integration team

**Reprocess function**:
```typescript
async function reprocessDlqItem(
  dlqItemId: string,
  forceReprocess: boolean = false
): Promise<void> {
  const item = await dlqStore.getItem(dlqItemId);
  if (!item) throw new Error(`DLQ item not found: ${dlqItemId}`);
  
  logger.info('Manual DLQ reprocess initiated', { dlqItemId, forceReprocess });
  
  await integrationQueue.enqueue({
    ...JSON.parse(item.sourcePayload),
    _dlqReprocess: true,
    _forceReprocess: forceReprocess,
    _dlqItemId: dlqItemId
  });
}
```

**Bulk reprocess** (for systematic failures fixed by a configuration change):
- Export DLQ items to CSV, filter to the affected error code, resubmit in batches
- Maximum 100 items per bulk reprocess — prevents overwhelming the destination API

## Alert Thresholds

| Condition | Threshold | Severity | Notification |
|-----------|-----------|----------|-------------|
| Error rate (any category) | > 5% of events in 15 minutes | High | Teams alert to integration channel |
| DLQ depth | > 10 items | Warning | Teams alert |
| DLQ depth | > 50 items | High | Email + Teams to integration lead |
| DLQ depth | > 100 items | Critical | Escalation to department manager + CTO |
| Consecutive failures for same source record | > 3 | Warning | Specific alert: "Record [ID] failing repeatedly" |
| 429 rate limit hit | Any | Info | Log only (backoff handles it automatically) |
| 503 duration > 5 minutes | — | High | Downstream system outage likely — notify stakeholders |
| Auth failure (403/401) | Any | High | Credential or permission issue — notify IT immediately |

## Error Log Retention

| Error Category | Retention Period | Storage |
|---------------|-----------------|---------|
| Transient (resolved) | 30 days | Integration event log |
| Permanent errors | 90 days | Integration event log |
| Business errors (DLQ) | 7 years (if related to financial transactions) | SharePoint + archive |
| Auth failures | 1 year | Security log |

## Output Format

Deliver as:

1. Error taxonomy table (three categories with all error types)
2. Retry strategy specification (algorithm with pseudocode)
3. Error classification function (pseudocode)
4. DLQ schema (full table with all fields)
5. DLQ monitoring dashboard specification
6. Manual reprocess workflow (numbered steps + pseudocode)
7. Alert threshold table
8. Error log retention policy
9. Integration-specific error codes (any error codes unique to the source or destination API, with handling instructions)
