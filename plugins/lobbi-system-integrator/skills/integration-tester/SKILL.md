---
description: Design integration test plans with mock, contract, and end-to-end testing specifications to validate API integrations before go-live and after changes.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Integration Tester

Produce a complete integration test plan for a system integration. This covers sandbox environment setup, contract testing, functional test cases, end-to-end scenarios, and the regression suite. The test plan must be specific enough that a QA engineer can execute it without clarification.

## Test Scope and Strategy

Define what is being tested and what is out of scope:

**In scope**:
- API connector: authentication, endpoint calls, request formation, response parsing
- Data mapping: field transformations, lookup table translations, null handling
- Error handling: retry behavior, DLQ routing, alert triggering
- End-to-end flow: source record change → integration processing → destination record created/updated

**Out of scope**:
- Source system business logic (tested by source system owner)
- Destination system business logic (tested by destination system owner)
- Network infrastructure performance
- Load/performance testing (separate engagement if required)

**Test environments**:

| Environment | Source System | Destination System | Integration | Purpose |
|-------------|--------------|-------------------|-------------|---------|
| Development | Mock server | Mock server | Local | Developer unit testing |
| Integration Test | Sandbox | Sandbox | Deployed | Full integration testing |
| UAT | Sandbox | UAT | Deployed | Business acceptance testing |
| Production | Production | Production | Deployed | Smoke test post-deployment only |

## Mock Server Design

For source or destination systems without a sandbox, build a mock server.

**Mock server tool selection**: WireMock (Java), Nock (Node.js), or MockServer (Docker). Choose based on the team's language stack.

**Mock endpoint definitions**:

For each API endpoint, define a mock that returns realistic test data:

```json
GET /policies?status=active&limit=100
Response 200:
{
  "data": [
    {
      "policy_id": "test-policy-001",
      "policy_number": "TEST-POL-2026-001",
      "client_id": "client-001",
      "effective_date": "2026-01-15",
      "premium_amount": 1250.00,
      "status_code": "A",
      "lob_code": "AU",
      "producer_npi": "1234567890",
      "notes": "Test policy for integration testing",
      "created_at": "2026-01-15T09:00:00-05:00",
      "modified_at": "2026-01-15T09:00:00-05:00"
    }
  ],
  "next_page_token": null,
  "has_more": false
}
```

**Error scenario mocks**:

| Scenario | Mock Configuration |
|----------|-------------------|
| Rate limit | Return 429 with `Retry-After: 5` on every 5th request |
| Service unavailable | Return 503 for 3 consecutive requests, then 200 |
| Auth failure | Return 401 when using any token other than the test token |
| Not found | Return 404 when record ID starts with "notfound-" |
| Validation failure | Return 400 with field error when premium_amount is negative |
| Duplicate | Return 409 when policy_number is "DUPLICATE-001" |

## Contract Tests

Contract tests verify the integration assumes the correct API shape. Run against both the mock and the real sandbox.

**Contract test suite**:

```typescript
describe('Source API Contract', () => {
  describe('GET /policies', () => {
    it('returns array in data field', async () => {
      const response = await apiClient.getPolicies();
      expect(Array.isArray(response.data)).toBe(true);
    });
    
    it('policy has required fields', async () => {
      const response = await apiClient.getPolicies({ limit: 1 });
      const policy = response.data[0];
      expect(policy).toHaveProperty('policy_id');
      expect(policy).toHaveProperty('policy_number');
      expect(policy).toHaveProperty('client_id');
      expect(policy).toHaveProperty('effective_date');
      expect(policy).toHaveProperty('premium_amount');
      expect(policy).toHaveProperty('status_code');
      expect(policy).toHaveProperty('lob_code');
    });
    
    it('effective_date is ISO 8601 date format', async () => {
      const response = await apiClient.getPolicies({ limit: 1 });
      const date = response.data[0].effective_date;
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    
    it('premium_amount is a number', async () => {
      const response = await apiClient.getPolicies({ limit: 1 });
      expect(typeof response.data[0].premium_amount).toBe('number');
    });
    
    it('pagination: next_page_token present when has_more is true', async () => {
      // Only meaningful if source has > limit records
      const response = await apiClient.getPolicies({ limit: 1 });
      if (response.has_more) {
        expect(response.next_page_token).toBeTruthy();
      }
    });
  });
  
  describe('Authentication', () => {
    it('returns 401 with invalid credentials', async () => {
      const badClient = createApiClient({ apiKey: 'invalid-key' });
      await expect(badClient.getPolicies()).rejects.toThrow(/401/);
    });
    
    it('token is refreshed before expiry', async () => {
      // Set token to expire in 30 seconds, wait 25 seconds, make a request
      // Verify a new token was acquired without a 401
      // [Implementation specific to auth mechanism]
    });
  });
});
```

**Run contract tests against real sandbox**: After running against mocks, run the same contract test suite against the actual sandbox API. Any failure indicates the API has changed from what the integration assumes — fix the integration before proceeding.

## Functional Test Cases

**Happy path test cases**:

| # | Test Case | Input | Expected Result | Verification |
|---|-----------|-------|-----------------|-------------|
| F-01 | Sync new policy | POST new policy to source sandbox | Policy created in destination with all mapped fields correct | GET policy from destination API, compare all mapped fields |
| F-02 | Sync policy update | Update premium_amount in source | Destination policy premium updated within 1 sync cycle | GET policy from destination, verify PremiumAmount updated |
| F-03 | Sync policy cancellation | Change status to "C" in source | Destination policy status changed to "Cancelled" | GET policy from destination, verify status |
| F-04 | LOB code translation: all codes | Create policy with each lob_code value | Each code mapped to correct destination LineOfBusiness | One test per LOB code |
| F-05 | Status code translation: all codes | Create policy with each status_code | Each code mapped correctly | One test per status code |
| F-06 | Producer lookup: known NPI | Policy with valid producer_npi | ProducerId set to correct GUID in destination | Verify ProducerId matches expected |
| F-07 | Producer lookup: unknown NPI | Policy with NPI not in mapping table | ProducerId set to null, unknown NPI logged | Verify null ProducerId + log entry |
| F-08 | Notes truncation | Notes field with 5000 characters | Notes truncated to 4000 chars, truncation logged | Verify destination notes length, verify log entry |
| F-09 | Null premium handling | Policy with null premium_amount | PremiumAmount set to 0.00 | Verify PremiumAmount = 0 |
| F-10 | Full pagination | Source has 250 policies | All 250 policies synced (3 pages of 100) | COUNT destination policies = 250 |

**Error handling test cases**:

| # | Test Case | Input | Expected Result | Verification |
|---|-----------|-------|-----------------|-------------|
| E-01 | Rate limit: single 429 | Mock returns 429 once, then 200 | Request retries successfully after Retry-After delay | Log shows retry; request succeeds |
| E-02 | Rate limit: exhausted retries | Mock returns 429 five times | Request sent to DLQ after 5 attempts | DLQ entry exists with AttemptCount = 5 |
| E-03 | Service unavailable: transient | Mock returns 503 twice, then 200 | Request retries and succeeds | Log shows retries; request succeeds |
| E-04 | Validation failure | Send policy with negative premium | Record sent to DLQ with ErrorCode = VALIDATION_FAILED | DLQ entry exists; error category = Permanent |
| E-05 | Duplicate record | Submit same policy_number twice | Second submission detected as 409, resolved via update | Destination has one record, not two; policy_id matches first |
| E-06 | Auth failure recovery | Token expires mid-sync | New token acquired, request retries | Log shows token refresh; no 401 surfaced to business logic |
| E-07 | Missing required reference | Policy references non-existent client_id | Record sent to exception queue with MISSING_REFERENCE error | Exception queue entry; source policy_id in record |
| E-08 | Alert trigger: DLQ > threshold | Insert 11 items into DLQ | Teams alert sent to integration channel | Teams message visible in channel |

## End-to-End Test Cases

Test the complete flow from source system change to destination record update:

| # | Scenario | Steps | Verification |
|---|----------|-------|-------------|
| E2E-01 | New business policy: full flow | 1. Create new policy in source AMS sandbox 2. Trigger sync 3. Wait for processing | Destination system has new policy with all fields correct; Teams notification sent (if configured); event log has success entry |
| E2E-02 | Policy cancellation: agent notification | 1. Cancel policy in source sandbox 2. Trigger sync | Destination policy cancelled; notification sent to assigned producer (verify in Teams or email); DLQ empty |
| E2E-03 | Multi-page sync: 250 records | 1. Create 250 test policies in source sandbox 2. Run full sync | All 250 in destination; reconciliation report shows 250/250 success; no DLQ entries; sync duration < 15 minutes |
| E2E-04 | Delta sync: only changed records | 1. Full sync 2. Update 5 records 3. Delta sync | Only 5 records synced in delta run; sync time proportionally faster than full sync |

## Regression Test Suite

Automate the happy path and critical error handling tests. Run on every deployment:

**Automated regression tests** (subset of functional tests that can be automated reliably):

- F-01 through F-05 (field mapping correctness)
- E-01, E-03, E-06 (retry behavior)
- E-05 (duplicate handling)
- E2E-01 (basic end-to-end)

**Regression run configuration**:
- Trigger: Every deployment to integration test environment (CI/CD pipeline step)
- Environment: Integration test environment with sandbox source and destination
- Duration target: < 10 minutes for the regression suite
- Pass/fail: Any test failure blocks deployment to UAT

**Test data management**:
- Create test records with IDs in the format `TEST-[YYYYMMDD]-[sequence]` to distinguish from real data
- Clean up test records after each test run (DELETE test records from sandbox)
- Maintain a fixed set of seed records for tests that require pre-existing data (e.g., producer with known NPI)

## Output Format

Deliver as:

1. Test scope and environment table
2. Mock server endpoint definitions (one section per endpoint)
3. Contract test suite (code blocks using the pattern above)
4. Functional test case catalog (complete table — happy path and error cases)
5. End-to-end scenario table
6. Regression suite definition (which tests are automated, run trigger, duration target)
7. Test data management approach (naming convention, cleanup procedure)
8. Go-live testing checklist (what must pass before production deployment: all functional tests, E2E-01, zero DLQ entries in integration test after 24 hours of testing)
