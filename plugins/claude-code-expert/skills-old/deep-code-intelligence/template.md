<!--
execution: fork
agent: principal-engineer-strategist
context: isolated
-->

# Deep Code Intelligence — Analysis Output Template

## Task

[One-line description, e.g., "Refactor authentication middleware to support multi-tenant token validation without breaking existing session handling"]

---

## Evidence Table

All claims must be backed by file-level evidence. Never assert without a citation.

| Claim | Evidence | File:Line | Confidence |
|-------|----------|-----------|------------|
| [e.g., "Token validation is synchronous and blocks the event loop"] | [e.g., "`verifyToken()` uses `crypto.createHash` in a tight loop with no async/await"] | `src/auth/middleware.ts:42-67` | High |
| [e.g., "Session store has no TTL enforcement"] | [e.g., "`sessions` Map is never pruned; entries accumulate indefinitely"] | `src/store/session.ts:18` | High |
| [e.g., "Multi-tenant isolation relies only on a runtime check, not DB-level constraint"] | [e.g., "WHERE clause constructed by string concatenation: `WHERE tenantId = '${id}'`"] | `src/db/queries.ts:134` | Medium |
| [Add rows for each material finding] | | | |

---

## Invariant Map

These behaviors MUST NOT change after implementation. They are the behavioral contracts
that downstream code, tests, and integrations depend on.

- **[Invariant 1]**: [e.g., "`authenticate(req)` must return `{ userId, tenantId, roles }` — shape cannot change"]
- **[Invariant 2]**: [e.g., "Failed auth must respond with HTTP 401, never 500, for invalid tokens"]
- **[Invariant 3]**: [e.g., "`req.user` must be set before any route handler executes"]
- **[Invariant 4]**: [e.g., "Session expiry behavior must remain: 30 min idle, 8 hr absolute max"]
- **[Add invariants discovered during analysis]**

---

## Failure Mode Analysis

| Scenario | Probability | Impact | Mitigation |
|----------|-------------|--------|------------|
| [e.g., "Token secret rotation causes mass session invalidation"] | Medium | High — all users logged out | [e.g., "Use dual-key verification: accept both old and new secret during 5-min rotation window"] |
| [e.g., "Race condition in session write under high concurrency"] | Low | Medium — duplicate sessions | [e.g., "Wrap session creation in optimistic lock with retry"] |
| [e.g., "DB connection pool exhaustion during auth spike"] | Low | Critical — auth service down | [e.g., "Add circuit breaker; fall back to JWT-only validation if DB unavailable"] |
| [e.g., "Tenant ID spoofing via malformed JWT claim"] | Low | Critical — data breach | [e.g., "Validate tenant claim against allowlist from DB, not JWT alone"] |
| [Add rows for each identified failure mode] | | | |

---

## Implementation Plan

### Phase 1 — Safe Foundation (no behavior change)
**Goal**: Establish the base without breaking anything. All existing tests must still pass.

1. [e.g., "Extract `verifyToken()` into a standalone async function in `src/auth/token.ts`"]
2. [e.g., "Add TTL enforcement to session store (prune on read, background sweep every 5 min)"]
3. [e.g., "Write unit tests covering the 4 invariants listed above BEFORE touching any logic"]

**Checkpoint**: `pnpm test` passes. No functional change detectable.

### Phase 2 — Core Change
**Goal**: Implement the primary behavior change.

1. [e.g., "Add `tenantId` parameter to `authenticate()` signature with backward-compatible default"]
2. [e.g., "Replace string-concatenated SQL with parameterized query in `src/db/queries.ts:134`"]
3. [e.g., "Implement multi-tenant token validation: verify `aud` claim matches tenant slug"]

**Checkpoint**: New integration tests pass. Manual test: login as two different tenants, confirm isolation.

### Phase 3 — Hardening
**Goal**: Make the implementation production-ready.

1. [e.g., "Add circuit breaker around DB auth call (use `opossum` or manual counter)"]
2. [e.g., "Add structured logging for auth failures: `{ event, tenantId, reason, elapsed }`"]
3. [e.g., "Update CHANGELOG.md and API docs"]

**Checkpoint**: `pnpm test && pnpm test:e2e` passes. Load test shows p99 < 50ms.

---

## Verification Contract

Exact commands to run to confirm success. No vague "verify it works" steps.

```bash
# 1. Type check — must produce zero errors
npx tsc --noEmit

# 2. Lint — must produce zero new errors
npx eslint src/auth/ src/store/ src/db/queries.ts

# 3. Unit tests — all must pass, coverage must not drop
pnpm test --coverage

# 4. Integration test for multi-tenant isolation
pnpm test src/auth/__tests__/multi-tenant.test.ts

# 5. E2E smoke test
pnpm test:e2e --grep "authentication"

# 6. Manual regression check
# - Login as tenant A, verify access to tenant A resources only
# - Login as tenant B, verify access to tenant B resources only
# - Attempt expired token, verify 401 response
# - Rotate secret, verify 5-min dual-key window works
```

---

## Risk Register

| # | Risk | Likelihood | Impact | Owner | Mitigation |
|---|------|------------|--------|-------|------------|
| 1 | [e.g., "Async refactor introduces subtle timing bugs in middleware chain"] | Medium | High | [e.g., "auth team"] | [e.g., "Add integration tests covering middleware execution order before merge"] |
| 2 | [e.g., "Session store TTL change causes premature logout for existing users"] | Low | Medium | [e.g., "platform team"] | [e.g., "Deploy with feature flag; monitor session duration metrics for 24h"] |
| 3 | [e.g., "Multi-tenant changes increase auth latency beyond SLA"] | Low | Medium | [e.g., "infra team"] | [e.g., "Benchmark before/after; add DB index on `tenantId` column if needed"] |

---

## Rollback Protocol

If the deployment causes a regression, follow these steps in order:

1. **Detect**: Alert fires on [e.g., "auth_failure_rate > 5% for 2 min"] or [e.g., "HTTP 500 rate spikes"]
2. **Communicate**: Post in [e.g., "#incidents Slack channel"]: "Rolling back auth changes, ETA 5 min"
3. **Revert deployment**:
   ```bash
   # Azure Container Apps
   az containerapp revision list --name myapp --resource-group myRG
   az containerapp ingress traffic set --name myapp --resource-group myRG \
     --revision-weight <previous-revision>=100
   ```
4. **Verify rollback**: Run `pnpm test:e2e --grep "authentication"` against production URL
5. **Preserve state**: Do NOT drop or migrate the DB back — old code handles old schema
6. **Post-mortem**: File issue with reproduction steps before re-attempting the change
