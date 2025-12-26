# Council Review Command

**Command:** `/council:review`
**Purpose:** Start a focused code review using council deliberation

## Quick Start

```bash
# Review current changes
/council:review

# Review specific files
/council:review src/auth/**/*.ts

# Review with specific protocol
/council:review --protocol=red-blue-team

# Quick review (3 agents, 1 round)
/council:review --quick

# Thorough review (7 agents, 3 rounds)
/council:review --thorough
```

## Usage Patterns

### By Scope

```bash
# Review current git diff
/council:review

# Review specific PR
/council:review --pr=456

# Review specific commit
/council:review --commit=abc123

# Review file pattern
/council:review --files="src/**/*.ts"

# Review specific function or class
/council:review --symbol="UserAuthenticator.login"
```

### By Protocol

```bash
# Adversarial stress test
/council:review --protocol=adversarial

# Security-focused
/council:review --protocol=red-blue-team

# Quick consensus
/council:review --protocol=rapid-fire

# Balanced perspectives
/council:review --protocol=six-thinking-hats

# Team coordination
/council:review --protocol=autogen-team

# Positive-focused
/council:review --protocol=appreciative-inquiry
```

### By Focus Area

```bash
# Security review
/council:review --focus=security

# Performance review
/council:review --focus=performance

# Architecture review
/council:review --focus=architecture

# Full review (all aspects)
/council:review --focus=all
```

## Options

| Option | Description | Example |
|--------|-------------|---------|
| `--protocol` | Deliberation protocol to use | `--protocol=round-robin` |
| `--size` | Panel size (quick/standard/thorough/full) | `--size=thorough` |
| `--focus` | Primary review focus | `--focus=security` |
| `--files` | File pattern to review | `--files="src/**/*.ts"` |
| `--pr` | Pull request number | `--pr=123` |
| `--commit` | Commit hash | `--commit=abc123` |
| `--quick` | Shorthand for --size=quick | N/A |
| `--thorough` | Shorthand for --size=thorough | N/A |
| `--blocking` | Require approval before merge | N/A |
| `--async` | Run in background, notify when complete | N/A |

## Review Workflow

### 1. Automatic Scope Detection
```yaml
if: --files specified
  scope: Specified files
elif: --pr specified
  scope: All files changed in PR
elif: --commit specified
  scope: Files changed in commit
else:
  scope: Current git diff (uncommitted changes)
```

### 2. Focus-Based Agent Selection
```yaml
focus: security
  agents:
    - security-sentinel-agent (primary)
    - devils-advocate-agent
    - integration-specialist-agent

focus: performance
  agents:
    - performance-guardian-agent (primary)
    - code-architect-agent
    - test-advocate-agent

focus: architecture
  agents:
    - code-architect-agent (primary)
    - maintainability-advocate-agent
    - domain-expert-agent

focus: all (default)
  agents:
    - All available agents based on panel size
```

### 3. Protocol Execution
```
Execute selected deliberation protocol with chosen agents
```

### 4. Verdict Generation
```yaml
output:
  - Verdict decision (APPROVE/APPROVE_WITH_CHANGES/REQUEST_CHANGES/REJECT)
  - Findings by category and severity
  - Action items (if changes needed)
  - Confidence level
  - Minority opinions (if any)
```

### 5. Integration Actions
```yaml
if: --blocking flag
  action: Block PR merge if verdict is not APPROVE

if: verdict == REQUEST_CHANGES or REJECT
  action: Create TODO items for required fixes

if: Jira integration enabled
  action: Post verdict summary as Jira comment
```

## Example Sessions

### Example 1: Security-Focused Red/Blue Team Review
```bash
$ /council:review --protocol=red-blue-team --focus=security src/auth/**

✓ Council Review Started
  Protocol: Red/Blue Team
  Focus: Security
  Scope: 12 files in src/auth/
  Teams: Red (3 agents), Blue (3 agents), Adjudicator (1)

⚔️ Battle Round 1:
  [Red Team] Found 5 potential vulnerabilities:
    🚨 CRITICAL: SQL injection in password reset (src/auth/reset.ts:45)
    ⚠️ HIGH: JWT signature not verified (src/auth/jwt.ts:23)
    📝 MEDIUM: Rate limiting insufficient (src/auth/login.ts:12)
    💡 LOW: Session timeout too long (config/auth.json:7)
    💡 LOW: Password requirements weak (src/auth/password.ts:89)

  [Blue Team] Proposing mitigations:
    ✅ BLUE-MIT-001: Parameterized query for password reset
    ✅ BLUE-MIT-002: Add JWT signature verification
    ✅ BLUE-MIT-003: Redis-based rate limiter
    ✅ BLUE-MIT-004: Reduce session timeout to 30min
    ✅ BLUE-MIT-005: Enforce stronger password policy

⚔️ Battle Round 2:
  [Red Team] Testing mitigations...
    ✅ SQL injection fix verified
    ✅ JWT verification works
    ✅ Rate limiting effective
    ⚠️ Session timeout still exploitable via token refresh
    ✅ Password policy sufficient

  [Blue Team] Refining:
    ✅ BLUE-MIT-004-v2: Add token refresh limit per session

⚔️ Battle Round 3:
  [Red Team] All mitigations validated ✓
  [Blue Team] Ready for production ✓

[Adjudicator] Verdict: APPROVE_WITH_CHANGES
  Required Actions (Blocking):
    - Apply BLUE-MIT-001 (SQL injection fix)
    - Apply BLUE-MIT-002 (JWT verification)
    - Apply BLUE-MIT-003 (Rate limiting)
    - Apply BLUE-MIT-004-v2 (Session management)
    - Apply BLUE-MIT-005 (Password policy)

  Confidence: 0.95 (Red and Blue teams reached consensus)
  Residual Risk: LOW
  Estimated Effort: 2-3 hours

✓ Review Complete (Duration: 18 minutes)
```

### Example 2: Quick Round Robin Review
```bash
$ /council:review --protocol=round-robin --quick src/api/users.ts

✓ Council Review Started
  Protocol: Round Robin
  Panel: 3 agents
  Scope: src/api/users.ts (247 lines)

🔄 Round 1 (Initial Analysis):
  [security-sentinel] "API handles user CRUD. Auth middleware on line 12 ✓
                       Input validation present ✓ Rate limiting missing ⚠️"

  [code-architect] "Building on security review, architecture follows REST
                    conventions ✓ Good separation of concerns ✓
                    Consider extracting validation to middleware"

  [test-advocate] "Expanding on architecture points, test coverage is 78%.
                   Missing tests for error cases ⚠️ Happy path well covered ✓"

🔄 Round 2 (Refinement):
  [security-sentinel] "On my rate limiting concern: This is user-facing API,
                       recommend 100 req/min per IP"

  [code-architect] "Agree with rate limiting. On validation extraction,
                    pattern: app.use(validate(userSchema)) before routes"

  [test-advocate] "Support both suggestions. For tests, add: invalid input,
                   unauthorized access, non-existent user"

✓ Verdict: APPROVE_WITH_CHANGES
  Required:
    - Add rate limiting (100 req/min)
    - Add error case tests (3 scenarios)

  Recommended:
    - Extract validation to middleware (cleaner code)

  Confidence: 0.85
  Estimated Effort: 1 hour

✓ Review Complete (Duration: 6 minutes)
```

### Example 3: Six Thinking Hats Balanced Review
```bash
$ /council:review --protocol=six-thinking-hats src/payments/checkout.ts

✓ Council Review Started
  Protocol: Six Thinking Hats
  Scope: src/payments/checkout.ts (412 lines)

🎩 White Hat (Facts):
  - 412 lines of code
  - Handles Stripe integration
  - Test coverage: 92%
  - Dependencies: stripe@12.1.0, zod@3.21.0
  - No known CVEs in dependencies

🎩 Red Hat (Intuition):
  - Feels complex, potential for errors
  - Concern about error handling in payment flow
  - Uneasy about refund logic
  - Good: Clear function names inspire confidence

🎩 Black Hat (Risks):
  - Risk: Double-charging if idempotency key fails
  - Risk: Refund race condition (lines 234-267)
  - Risk: PCI compliance - are we storing card data? (Need to verify)
  - Risk: Currency conversion rounding errors

🎩 Yellow Hat (Benefits):
  - Benefit: Comprehensive error handling
  - Benefit: Stripe's infrastructure is battle-tested
  - Benefit: Idempotency keys prevent most double-charges
  - Benefit: High test coverage gives confidence

🎩 Green Hat (Alternatives):
  - Alternative: Use Stripe Checkout (hosted page) instead of custom
  - Alternative: Implement pessimistic locking for refunds
  - Alternative: Add circuit breaker for Stripe API calls
  - Alternative: Pre-calculate currency conversions

🎩 Blue Hat (Meta):
  Summary: Code is generally solid with good test coverage and error handling.
  Three risks identified (double-charge, refund race, PCI compliance).
  Recommendation: APPROVE_WITH_CHANGES
    1. Add pessimistic locking for refund transactions (HIGH priority)
    2. Verify PCI compliance (audit card data handling) (CRITICAL)
    3. Consider circuit breaker for resilience (MEDIUM)

  Balanced Perspective:
    - Strengths outweigh weaknesses
    - Identified risks are addressable
    - Team has shown good practices (tests, error handling)
    - With fixes, code is production-ready

✓ Verdict: APPROVE_WITH_CHANGES
  Confidence: 0.88 (All hats considered, balanced view achieved)

✓ Review Complete (Duration: 14 minutes)
```

## Integration

### With Git Workflow
```bash
# Auto-review on commit
git commit → triggers /council:review --quick

# Block merge on PR
PR created → /council:review --blocking --thorough
```

### With Jira
```bash
# Link verdict to issue
/council:review → Posts verdict as Jira comment with action items
```

### With CI/CD
```bash
# In .gitlab-ci.yml or .github/workflows/
council-review:
  script:
    - /council:review --protocol=red-blue-team --blocking
  rules:
    - if: $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"
```

## Tips

1. **Match Protocol to Scope**
   - Small changes: `rapid-fire`
   - Security-sensitive: `red-blue-team`
   - Architecture decisions: `autogen-team` or `six-thinking-hats`

2. **Use Focus for Efficiency**
   - Don't review everything if you know the concern area
   - `--focus=security` for auth changes
   - `--focus=performance` for algorithm changes

3. **Balance Thoroughness and Speed**
   - `--quick` for PRs <100 lines
   - `--standard` (default) for most PRs
   - `--thorough` for critical changes

4. **Async for Long Reviews**
   - `--async` runs in background
   - Get notified when verdict ready
   - Good for large PRs

---

**Agent:** council-convener-agent
**Model:** sonnet
**Activation:** User invokes `/council:review`
