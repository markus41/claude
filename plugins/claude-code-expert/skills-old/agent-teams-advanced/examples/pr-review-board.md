# Example: PR Review Board

**Scenario**: Review PR #247 — "feat(auth): add multi-tenant JWT validation"
This PR changes 12 files across `src/auth/`, `src/middleware/`, and `src/db/`.

---

## Mission Brief

| Field | Value |
|-------|-------|
| **Task** | Comprehensive review of PR #247: multi-tenant JWT validation |
| **Scope** | All 12 changed files in `src/auth/`, `src/middleware/`, `src/db/queries.ts` |
| **Out of Scope** | Infrastructure config, test fixtures, `*.md` documentation files |
| **Success Criteria** | All BLOCK findings identified or confirmed absent; consolidated report posted as PR comment |
| **Deadline** | Single session — no background agents |
| **Coordinator** | `principal-engineer-strategist` |

---

## Team Roster

| Agent | Role | Model | Scope | Output Contract |
|-------|------|-------|-------|-----------------|
| `security-auditor` | Security analysis | opus | `src/auth/token.ts`, `src/auth/middleware.ts`, `src/db/queries.ts`, all hook scripts in diff | `{ findings: [{ file, line, severity, description, recommendation }], blockers: string[] }` |
| `correctness-reviewer` | Logic and correctness | sonnet | `src/auth/`, `src/middleware/`, `src/db/queries.ts`, `src/store/session.ts` | Markdown list: bugs with `file:line`, severity H/M/L, reproduction scenario |
| `performance-analyst` | Performance review | sonnet | `src/auth/token.ts` (crypto ops), `src/db/queries.ts` (query plans), `src/middleware/rate-limiter.ts` | Table: `{ location, issue, estimated_impact_ms, fix }` |
| `style-enforcer` | Code style and TypeScript conventions | haiku | All `.ts` and `.tsx` files in the diff | List of violations with line refs and suggested rewrites; note if auto-fixable |

---

## Coordination Protocol

**Reports to**: Main conversation (coordinator writes consolidated comment)

**Reporting format**:

Each agent writes a fenced block tagged with its role:

```
<!-- security-auditor -->
[findings here]
<!-- /security-auditor -->
```

**Merge order**:
1. `security-auditor` runs first — any Critical findings are immediate BLOCKs and halt style review
2. `correctness-reviewer` and `performance-analyst` run in parallel
3. `style-enforcer` runs only if no Critical blockers from step 1
4. Coordinator aggregates all blocks into final review comment

**Conflict resolution**: If `correctness-reviewer` and `security-auditor` both flag `src/db/queries.ts:134` for different reasons, coordinator lists both findings separately and notes the overlap: "Two agents flagged this location — review both concerns together."

---

## Shared Context

All agents have read access to:

- The PR diff (changed files and line-by-line changes)
- `docs/context/architecture.md` — system design context
- `.claude/rules/security.md` — project security rules
- `src/auth/__tests__/` — existing test coverage (to understand what's already tested)
- The PR description: "Adds per-tenant JWT audience claim validation. Each tenant has a unique `aud` value registered in the tenants table."

No agent may modify any file during execution.

---

## Independent Scopes

| Agent | Owns | Must NOT touch |
|-------|------|----------------|
| `security-auditor` | JWT claim validation correctness, SQL injection risks, secret handling, input sanitization, token expiry enforcement | Performance bottlenecks, naming conventions |
| `correctness-reviewer` | Business logic correctness, error handling, edge cases (expired tokens, missing claims, unknown tenants), race conditions | Security analysis, style |
| `performance-analyst` | Crypto operation cost, DB query plan (missing indexes on `tenantId`), session store reads per request | Security, correctness, style |
| `style-enforcer` | TypeScript strict compliance, naming conventions, function length > 50 lines, `any` types, unused imports | Any substantive logic concerns |

---

## Merge Protocol

Coordinator produces this structure:

```markdown
## PR Review: feat(auth): add multi-tenant JWT validation

### BLOCK — Must fix before merge

**[security-auditor]** `src/db/queries.ts:134` — SQL injection via string concatenation
> Tenant ID from JWT is concatenated directly: `WHERE tenantId = '${claim.tid}'`
> Fix: Use parameterized query: `WHERE tenantId = $1`, pass `[claim.tid]`
> Severity: Critical

**[correctness-reviewer]** `src/auth/token.ts:89` — Token expiry not checked for service accounts
> `verifyToken()` skips `exp` check when `options.serviceAccount === true`
> Fix: Service accounts must still honor `exp`; use `maxAge` option instead of bypassing
> Severity: High

### REQUEST — Should fix before merge

**[performance-analyst]** `src/db/queries.ts:67` — Full table scan on tenant lookup
> No index on `tenants.slug` column used in hot path (called on every request)
> Fix: `CREATE INDEX CONCURRENTLY idx_tenants_slug ON tenants(slug)`
> Estimated impact: -40ms p99 under load

**[correctness-reviewer]** `src/auth/middleware.ts:210` — Missing error boundary for DB failure
> If tenants table is unreachable, function throws unhandled and returns 500
> Fix: Catch DB errors, return 401 with `WWW-Authenticate: Bearer error="temporarily_unavailable"`

### SUGGEST — Optional

**[style-enforcer]** `src/auth/token.ts` — Three functions exceed 50-line limit
> `validateMultiTenantClaims()` is 78 lines. Extract claim-type checks into helpers.

**[style-enforcer]** `src/middleware/rate-limiter.ts:12` — Implicit `any` on `req` parameter
> Add explicit type: `req: Request` from express

### PRAISE

**[security-auditor]** JWT audience validation pattern is well-structured — binding `aud` to tenant slug (not tenant UUID) prevents enumeration attacks. Good choice.

**[correctness-reviewer]** Error messages are non-leaking — no internal details exposed to clients.

### Agent Confidence

| Agent | Confidence | Notes |
|-------|------------|-------|
| security-auditor | High | Reviewed all auth paths; SQL injection is definitive |
| correctness-reviewer | High | Traced all code paths through token verification |
| performance-analyst | Medium | Index recommendation based on schema review; actual impact requires production query plan |
| style-enforcer | High | Automated scan; all findings are deterministic |
```

---

## Quality Gate

Before posting the consolidated review:

- [x] All 4 agents produced output in the required format
- [x] No disputed findings (security and correctness agents flagged different locations)
- [x] BLOCK findings include file:line and a concrete fix
- [x] Report contains no placeholder text from the template
- [x] Coordinator verified: 2 BLOCKs, 2 REQUESTs, 2 SUGGESTs, 2 PRAISEs — all from distinct agents
