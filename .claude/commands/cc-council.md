---
name: cc-council
intent: Run a multi-agent council review on any target with configurable protocols, scoped scoring, weighted voting, and state machine orchestration
tags:
  - claude-code-expert
  - command
  - council
  - review
  - multi-agent
  - orchestration
arguments:
  - name: target
    description: What to review — file paths, directory, PR URL, git diff, or "architecture" for full-project analysis
    required: true
    type: string
flags:
  # === Protocol & Preset ===
  - name: protocol
    description: Deliberation protocol governing how agents interact
    type: choice
    choices: [expert-panel, red-blue-team, six-thinking-hats, rapid-fire, delphi, blackboard]
    default: expert-panel
  - name: preset
    description: Pre-configured member set, thresholds, and timeouts
    type: choice
    choices: [quick, standard, security, performance, architecture, full, compliance, pre-merge]
    default: standard
  # === Scope & Focus ===
  - name: scope
    description: Analysis scopes to run (each has independent scoring)
    type: string
    default: "security,quality,performance"
  - name: focus
    description: Priority ordering of focus areas within scopes
    type: string
    default: "security,quality,performance"
  - name: depth
    description: Analysis depth — shallow skims structure, deep reads every line
    type: choice
    choices: [shallow, standard, deep, exhaustive]
    default: standard
  - name: language
    description: Override language detection (for mixed-language repos)
    type: string
  # === Member Control ===
  - name: members
    description: Comma-separated agent names to include (overrides preset selection)
    type: string
  - name: exclude
    description: Comma-separated agent names to exclude from preset
    type: string
  - name: lead
    description: Designate a lead agent who synthesizes and has tie-breaking weight
    type: string
  - name: model
    description: Override model for all council agents
    type: choice
    choices: [opus, sonnet, haiku]
  - name: member-model
    description: Per-member model override (format agent:model,agent:model)
    type: string
  # === Voting & Thresholds ===
  - name: threshold
    description: Minimum weighted score for approval (0.0-1.0)
    type: number
    default: 0.7
  - name: veto
    description: Comma-separated agents with veto power on critical findings
    type: string
    default: "security-reviewer"
  - name: require-unanimous
    description: Require all agents to approve (no dissenting votes)
    type: boolean
    default: false
  - name: min-confidence
    description: Minimum confidence for a finding to count (filters noise)
    type: number
    default: 0.5
  # === Scoring ===
  - name: scoring
    description: Scoring mode — weighted combines scope scores, pass-fail requires all scopes pass
    type: choice
    choices: [weighted, pass-fail, highest-concern]
    default: weighted
  - name: score-weights
    description: "Custom scope weights (format scope:weight) e.g. security:0.35,quality:0.25"
    type: string
  - name: pass-thresholds
    description: "Per-scope pass thresholds (format scope:threshold) e.g. security:85,quality:75"
    type: string
  # === Output & Format ===
  - name: format
    description: Output format for the review report
    type: choice
    choices: [markdown, json, inline, summary, github-pr, jira-comment]
    default: markdown
  - name: group-by
    description: How to group findings in the report
    type: choice
    choices: [severity, file, agent, scope, tag]
    default: severity
  - name: max-findings
    description: Maximum findings per agent (prevents report bloat)
    type: number
    default: 15
  - name: max-inline
    description: Maximum inline comments when format is inline or github-pr
    type: number
    default: 25
  - name: verbose
    description: Include agent reasoning and deliberation transcript
    type: boolean
    default: false
  - name: quiet
    description: Minimal output — decision and critical issues only
    type: boolean
    default: false
  # === Auto-Fix ===
  - name: auto-fix
    description: Automatically apply fixes for high-confidence findings
    type: boolean
    default: false
  - name: fix-confidence
    description: Minimum confidence to auto-apply a fix (0.0-1.0)
    type: number
    default: 0.85
  - name: fix-severity
    description: Minimum severity for auto-fix (critical only, or warning+critical)
    type: choice
    choices: [critical, warning, info]
    default: warning
  - name: fix-dry-run
    description: Show what auto-fix would change without applying
    type: boolean
    default: false
  # === Execution Control ===
  - name: dry-run
    description: Display council plan (members, protocol, scopes) without executing
    type: boolean
    default: false
  - name: timeout
    description: Maximum total council duration in seconds
    type: number
    default: 300
  - name: agent-timeout
    description: Maximum per-agent timeout in seconds
    type: number
    default: 60
  - name: parallel
    description: Maximum agents to run in parallel (for resource control)
    type: number
    default: 10
  - name: retry
    description: Retry failed agents up to N times
    type: number
    default: 1
  # === State & Resume ===
  - name: resume
    description: Resume a previous council session from state file
    type: string
  - name: save-state
    description: Save council state to file for later resume
    type: boolean
    default: true
  - name: state-dir
    description: Directory for council state files
    type: string
    default: ".council/sessions"
  # === Configuration ===
  - name: config
    description: Path to council configuration YAML file
    type: string
  - name: rules
    description: Path to additional rules file agents should enforce
    type: string
  - name: standards
    description: Coding standards profile to enforce (loads from .council/standards/)
    type: string
  # === Integration ===
  - name: diff-base
    description: Git ref to diff against (default HEAD~1 or main)
    type: string
  - name: changed-only
    description: Only review files changed since diff-base
    type: boolean
    default: false
  - name: post-to
    description: Post results to external service (github-pr, jira, slack)
    type: string
  - name: webhook
    description: Webhook URL to POST the JSON results to
    type: string
aliases:
  - cc-review-council
  - cc-panel
  - cc-review-all
presets:
  - name: quick
    description: Fast 2-agent review — code quality + security scan
    flags:
      protocol: rapid-fire
      scope: "security,quality"
      threshold: 0.6
      depth: shallow
      timeout: 60
      agent-timeout: 30
  - name: standard
    description: Balanced 4-agent review — security, quality, tests, performance
    flags:
      protocol: expert-panel
      scope: "security,quality,performance,testing"
      threshold: 0.7
      depth: standard
      timeout: 180
  - name: security
    description: Deep security audit with red/blue adversarial protocol
    flags:
      protocol: red-blue-team
      scope: "security,secrets,injection,auth,dependencies"
      threshold: 0.9
      depth: deep
      veto: "security-reviewer,secrets-scanner"
      timeout: 300
  - name: performance
    description: Performance-focused review with profiling lens
    flags:
      protocol: expert-panel
      scope: "performance,complexity,queries,caching,memory"
      threshold: 0.7
      depth: deep
      lead: performance-analyst
      timeout: 180
  - name: architecture
    description: Architectural review using Six Thinking Hats deliberation
    flags:
      protocol: six-thinking-hats
      scope: "architecture,patterns,scalability,maintainability,coupling"
      threshold: 0.75
      depth: deep
      lead: architecture-reviewer
      timeout: 300
  - name: full
    description: All 10 agents, all scopes, blackboard protocol
    flags:
      protocol: blackboard
      scope: "security,quality,performance,testing,architecture,accessibility,api,docs,dependencies,secrets"
      threshold: 0.8
      depth: deep
      timeout: 600
  - name: compliance
    description: Compliance-grade review with pass-fail scoring and audit trail
    flags:
      protocol: expert-panel
      scoring: pass-fail
      scope: "security,quality,accessibility,docs"
      threshold: 0.85
      depth: exhaustive
      pass-thresholds: "security:90,quality:80,accessibility:90,docs:70"
      verbose: true
      save-state: true
      timeout: 600
  - name: pre-merge
    description: Lightweight pre-merge gate — changed files only, quick verdict
    flags:
      protocol: rapid-fire
      scope: "security,quality"
      threshold: 0.65
      depth: standard
      changed-only: true
      format: summary
      timeout: 90
inputs: []
risk: medium
cost: medium
description: Comprehensive multi-agent council review with 6 protocols, 10 specialists, scoped scoring (per-scope thresholds and weights), state machine orchestration, auto-fix, and 50+ configuration flags
---

# Agent Council Review

**Target:** `${target}` | **Protocol:** `${protocol}` | **Preset:** `${preset}` | **Depth:** `${depth}`

## State Machine

```
INIT → PLAN → FAN_OUT → ANALYZE → FAN_IN → DELIBERATE → SCORE → DECIDE → OUTPUT → [AUTO_FIX] → COMPLETE
  │                                                                                       │
  └── RESUME (from saved state) ──────────────────────────────────────────────────────────┘
```

Each state is checkpointed. Use `--resume <session-id>` to restart from any failed state.

---

## Protocols

| Protocol | Agents Interact? | Rounds | Best For | Cost |
|----------|-----------------|--------|----------|------|
| **expert-panel** | After analysis | 1 | General code review | Medium |
| **red-blue-team** | Adversarial pairs | 2 | Security hardening | High |
| **six-thinking-hats** | Structured parallel | 6 perspectives | Architecture decisions | High |
| **rapid-fire** | No deliberation | 1 | Quick feedback, small PRs | Low |
| **delphi** | Anonymous rounds | 2-3 | Contentious decisions | High |
| **blackboard** | Shared knowledge space | Async | Large PRs, cross-cutting | Medium |

---

## Analysis Scopes & Scoring

Each scope is independently scored. The final decision uses either weighted combination or pass-fail gates.

### Security Scope (default weight: 0.30, pass threshold: 85/100)

**Checks:** OWASP Top 10, secrets exposure, SQL/NoSQL injection, XSS/CSRF, auth bypass, input validation, insecure dependencies, .env file exposure, CORS misconfiguration, rate limiting gaps

**Scoring deductions:**
```
Base 100
  -50  Hardcoded secrets or credentials
  -40  SQL/NoSQL injection vulnerability
  -30  XSS vulnerability
  -25  Authentication/authorization bypass
  -20  Critical dependency vulnerability (CVE)
  -15  Missing input validation on user-facing endpoint
  -10  High-severity dependency vulnerability
  -10  Missing CSRF protection
  -8   Insecure CORS configuration
  -5   Missing rate limiting
  -5   Validation gaps (non-critical)
```

### Quality Scope (default weight: 0.25, pass threshold: 75/100)

**Checks:** TypeScript/linting errors, async error handling, null safety, code duplication, cyclomatic complexity, naming conventions, SOLID violations, dead code, magic numbers

**Scoring deductions:**
```
Base 100
  -15  TypeScript strict-mode errors
  -12  Unhandled async/promise rejections
  -10  Code duplication (>20 lines identical)
  -10  Cyclomatic complexity > 15
  -8   Use of 'any' type (per occurrence, max -24)
  -8   Missing error boundaries
  -5   Naming convention violations
  -5   Magic numbers (unhelpful constants)
  -3   Unused imports/variables
  -3   Console.log left in production code
```

### Performance Scope (default weight: 0.20, pass threshold: 80/100)

**Checks:** N+1 queries, missing indexes, memory leaks, bundle size, caching gaps, O(n²+) algorithms, React anti-patterns (inline objects, missing deps), unnecessary re-renders

**Scoring deductions:**
```
Base 100
  -30  N+1 database queries
  -25  Memory leak (event listeners, effects without cleanup)
  -20  O(n²) or worse algorithm on unbounded input
  -15  Missing memoization on expensive computation
  -10  React inline objects/functions in render
  -10  Missing database index on queried column
  -8   Full library import when tree-shakeable
  -5   Missing pagination on list endpoint
  -5   Unnecessary re-renders
```

### Testing Scope (default weight: 0.10, pass threshold: 70/100)

**Checks:** Test coverage, edge case coverage, mock quality, integration test presence, test naming, assertion quality, flaky test indicators

**Scoring deductions:**
```
Base 100
  -25  No tests for new functionality
  -15  Critical path untested
  -12  Tests mock too much (>3 mocks per test)
  -10  Missing edge case coverage (nulls, empty, boundary)
  -8   Poor test names (test1, test2)
  -5   Snapshot tests without meaningful assertions
  -5   No integration/E2E tests for API endpoints
  -3   Assertion-free tests (test passes but proves nothing)
```

### Architecture Scope (default weight: 0.10, pass threshold: 70/100)

**Checks:** Coupling (afferent/efferent), cohesion, dependency direction, abstraction levels, module boundaries, circular dependencies, god objects/files, separation of concerns

**Scoring deductions:**
```
Base 100
  -25  Circular dependency between modules
  -20  God file (>500 lines with mixed concerns)
  -15  Layer violation (UI → DB direct)
  -12  Tight coupling (concrete dependency where interface expected)
  -10  Missing abstraction (business logic in controller/handler)
  -8   Inconsistent module boundaries
  -5   Single-use abstraction (premature)
  -5   Leaky abstraction (implementation details exposed)
```

### Accessibility Scope (default weight: 0.05, pass threshold: 90/100)

**Checks:** Semantic HTML, ARIA labels, keyboard navigation, form labels, focus management, alt text, color contrast, screen reader support, reduced motion support

**Scoring deductions:**
```
Base 100
  -20  Missing keyboard navigation
  -15  Non-semantic HTML (div-soup)
  -12  Missing ARIA labels on interactive elements
  -12  Forms without associated labels
  -10  Missing alt text on images
  -15  Focus trap or broken focus order
  -5   Insufficient color contrast
  -5   Missing prefers-reduced-motion support
```

### Overall Score Calculation

**Weighted mode (default):**
```
overall = Σ(scope_score × scope_weight) / Σ(scope_weight)

Default weights: security:0.30, quality:0.25, performance:0.20,
                 testing:0.10, architecture:0.10, accessibility:0.05
```

**Pass-fail mode:**
```
Each scope must independently meet its pass threshold.
Overall = PASS if all scopes pass, FAIL if any scope fails.
Report shows: scope → score/threshold → PASS|FAIL
```

**Highest-concern mode:**
```
overall = min(scope_scores)
Decision based on the weakest scope.
```

---

## Council Members

### Core Members (always available)

```yaml
code-reviewer:
  role: "Code quality, maintainability, and best practices"
  scopes: [quality]
  model: sonnet
  weight: 1.0
  focus: [clean-code, SOLID, DRY, naming, organization, error-handling]

security-reviewer:
  role: "Security vulnerabilities, threats, and risk assessment"
  scopes: [security, secrets]
  model: sonnet
  weight: 0.9
  veto_power: true
  focus: [OWASP, auth, injection, XSS, CSRF, secrets, input-validation]

test-strategist:
  role: "Test coverage, quality, and testing strategy"
  scopes: [testing]
  model: sonnet
  weight: 0.8
  focus: [coverage, edge-cases, mocking, integration, assertions]

performance-analyst:
  role: "Performance, efficiency, and resource optimization"
  scopes: [performance]
  model: haiku
  weight: 0.7
  focus: [complexity, N+1, memory, caching, bundle-size, rendering]

architecture-reviewer:
  role: "Design patterns, structure, and system architecture"
  scopes: [architecture]
  model: opus
  weight: 0.9
  focus: [patterns, coupling, cohesion, boundaries, scalability, abstractions]
```

### Conditional Members (auto-activated by file type or `--members`)

```yaml
accessibility-reviewer:
  role: "WCAG compliance and inclusive design"
  scopes: [accessibility]
  model: haiku
  weight: 0.6
  condition: "*.tsx, *.jsx, *.html, *.css, *.vue, *.svelte detected"

api-reviewer:
  role: "API design, REST conventions, backward compatibility"
  scopes: [quality, architecture]
  model: haiku
  weight: 0.6
  condition: "API routes, controllers, or OpenAPI spec detected"

docs-reviewer:
  role: "Documentation completeness and accuracy"
  scopes: [quality]
  model: haiku
  weight: 0.5
  condition: "README, docs/, JSDoc, or docstring changes detected"

secrets-scanner:
  role: "Credential exposure and secret management"
  scopes: [security, secrets]
  model: sonnet
  weight: 0.9
  veto_power: true
  condition: ".env, config, credentials, or key patterns detected"

dependency-auditor:
  role: "Supply chain security and dependency health"
  scopes: [security, dependencies]
  model: haiku
  weight: 0.6
  condition: "package.json, requirements.txt, go.mod, Cargo.toml changes"
```

### Custom Members (via `--config`)

```yaml
council:
  custom_members:
    - name: domain-expert
      role: "Business logic validation"
      model: sonnet
      weight: 0.8
      scopes: [quality]
      focus:
        - "Domain model correctness"
        - "Business rule enforcement"
        - "Data integrity constraints"
      veto_power: false
    - name: i18n-reviewer
      role: "Internationalization compliance"
      model: haiku
      weight: 0.5
      scopes: [quality, accessibility]
      focus:
        - "Hardcoded strings"
        - "RTL support"
        - "Locale handling"
```

---

## Presets

| Preset | Agents | Protocol | Scopes | Threshold | Timeout | Best For |
|--------|--------|----------|--------|-----------|---------|----------|
| **quick** | 2 | rapid-fire | security, quality | 0.60 | 60s | Small PRs, quick sanity |
| **standard** | 4 | expert-panel | security, quality, performance, testing | 0.70 | 180s | Regular code review |
| **security** | 4 | red-blue-team | security, secrets, injection, auth, deps | 0.90 | 300s | Auth changes, API endpoints |
| **performance** | 3 | expert-panel | performance, complexity, queries, caching | 0.70 | 180s | Database, hot path changes |
| **architecture** | 5 | six-thinking-hats | architecture, patterns, scalability | 0.75 | 300s | New features, refactors |
| **full** | 10 | blackboard | all 10 scopes | 0.80 | 600s | Major releases, critical paths |
| **compliance** | 5 | expert-panel | security, quality, a11y, docs (pass-fail) | 0.85 | 600s | Audit, compliance reviews |
| **pre-merge** | 2 | rapid-fire | security, quality (changed files only) | 0.65 | 90s | CI gate, pre-merge check |

---

## Orchestration Workflow

### Phase 0: Pre-Flight (State: INIT)

1. **Validate target** — resolve paths, check existence, detect type (files/dir/PR/git-diff)
2. **Detect language** — scan extensions, respect `--language` override
3. **Load config** — merge defaults → config file → CLI flags (CLI wins)
4. **Check resume** — if `--resume`, load saved state and skip to failed phase

### Phase 1: Plan the Council (State: PLAN)

1. Select members from preset
2. Apply `--members` override (replaces preset selection) or `--exclude` (removes from preset)
3. Auto-detect conditional members from target file types (skip if `--members` given)
4. Assign models: `--model` global override → `--member-model` per-agent → preset defaults
5. Designate `--lead` agent (gets 1.2x weight multiplier and synthesizer role)
6. Compute scope weights from `--score-weights` or defaults
7. Compute pass thresholds from `--pass-thresholds` or defaults
8. **Checkpoint state** (save council plan for `--dry-run` or resume)
9. If `--dry-run`: display plan and exit

**Dry-run output:**
```
Council Plan
══════════════════════════════════════════
Target:    src/auth/
Protocol:  expert-panel
Preset:    standard
Depth:     standard
Timeout:   180s (60s per agent)

Members (4):
  1. code-reviewer     [sonnet]  weight=1.0  scopes=[quality]
  2. security-reviewer [sonnet]  weight=0.9  scopes=[security] VETO
  3. test-strategist   [sonnet]  weight=0.8  scopes=[testing]
  4. performance-analyst [haiku] weight=0.7  scopes=[performance]

Scopes & Weights:
  security:    0.30 (pass ≥ 85)
  quality:     0.25 (pass ≥ 75)
  performance: 0.20 (pass ≥ 80)
  testing:     0.10 (pass ≥ 70)

Scoring: weighted | Threshold: 0.70
Estimated cost: ~150k tokens | ~$0.45
```

### Phase 2: Prepare Context (State: FAN_OUT)

For each member, prepare a **scoped context bundle** containing only what they need:

| Agent | Gets | Doesn't Get |
|-------|------|-------------|
| code-reviewer | Full diff, file structure, linting output | Dependency trees, test results |
| security-reviewer | Diff, dependency files, env patterns, auth flows | Test files, style files |
| test-strategist | Diff, existing test files, coverage report | Style files, docs |
| performance-analyst | Diff, query patterns, bundle analysis | Test files, docs |
| architecture-reviewer | File tree, module graph, dependency directions | Individual line diffs |

**Key principle**: Minimum viable context per agent. Less noise = better findings.

### Phase 3: Parallel Analysis (State: ANALYZE)

Spawn ALL agents simultaneously using parallel Agent tool calls:

```
// All in ONE message for true parallelism:
Agent(name="code-reviewer", prompt=code_context, subagent_type="code-reviewer")
Agent(name="security-reviewer", prompt=security_context, subagent_type="general-purpose")
Agent(name="test-strategist", prompt=test_context, subagent_type="general-purpose")
Agent(name="performance-analyst", prompt=perf_context, subagent_type="general-purpose")
```

Each agent returns structured JSON findings + vote (see Finding Structure below).

**Timeout handling**: If `--agent-timeout` exceeded, use partial output. If zero output, mark agent as `timed_out`.
**Retry**: If agent fails and `--retry > 0`, re-spawn once with simplified context.

### Phase 4: Collect Results (State: FAN_IN)

1. Parse JSON output from each agent
2. Validate finding structure (skip malformed, log warning)
3. Assign unique IDs: `{agent}-{file}-{line_start}` hash
4. Filter by `--min-confidence` (drop below threshold)
5. Cap at `--max-findings` per agent
6. Record agent vote and completion status

**Checkpoint state** (save findings + votes for resume)

### Phase 5: Deliberation (State: DELIBERATE)

Protocol-specific synthesis:

**Expert Panel:**
1. Group findings by file → line range
2. Identify consensus (2+ agents flagged same issue) → boost confidence 1.2x
3. Identify conflicts (agents disagree on severity) → flag for lead resolution
4. Lead agent (if designated) resolves conflicts with tie-breaking authority

**Red Team / Blue Team:**
1. Partition findings: concerns = "attack vectors", approvals/observations = "defenses"
2. Match: each attack with any corresponding defense
3. Undefended attacks → critical findings
4. Defended attacks → resolved (lower severity)
5. Produce attack surface assessment + residual risk score

**Six Thinking Hats:**
1. White (Facts) → Metrics, line counts, test coverage data
2. Red (Feelings) → Developer experience, readability, frustration points
3. Black (Caution) → All critical + warning findings
4. Yellow (Benefits) → Approvals, well-done patterns, strengths
5. Green (Creativity) → Alternative approaches, refactoring ideas
6. Blue (Process) → Synthesis, priority ranking, action items

**Rapid Fire:**
1. Take top 3 findings per agent (highest severity × confidence)
2. No deliberation → aggregate and rank
3. Fastest path to decision

**Delphi:**
1. Round 1: Independent analysis (standard)
2. Anonymize all findings (strip agent names)
3. Share aggregate to all agents
4. Round 2: Agents revise their assessment
5. Convergence check: if delta > 10%, take Round 2; else keep Round 1

**Blackboard:**
1. All findings posted to shared space
2. Cross-reference: link findings by file, tag, and theme
3. Cluster into topics (security cluster, quality cluster, etc.)
4. Rank clusters by severity × confidence × frequency

### Phase 6: Score (State: SCORE)

Calculate per-scope scores using deduction tables:

```python
for scope in active_scopes:
    score = 100
    for finding in findings_for_scope(scope):
        deduction = DEDUCTION_TABLE[scope][finding.category]
        score -= deduction * finding.confidence
    scope_scores[scope] = max(0, score)

if scoring_mode == "weighted":
    overall = sum(score * weight for scope, score, weight in scope_scores) / sum(weights)
elif scoring_mode == "pass-fail":
    overall = "PASS" if all(score >= threshold for score, threshold in scope_thresholds) else "FAIL"
elif scoring_mode == "highest-concern":
    overall = min(scope_scores.values())
```

### Phase 7: Decision (State: DECIDE)

```python
# Check veto conditions first
for veto_agent in veto_agents:
    if agent_has_critical_finding(veto_agent, confidence >= 0.8):
        decision = "changes-requested"
        reason = f"Vetoed by {veto_agent}: {critical_finding}"
        break

# Check unanimous requirement
if require_unanimous and any(vote.decision != "approve"):
    decision = "changes-requested"

# Weighted voting
if not vetoed and not unanimous_failed:
    score = weighted_vote_calculation(votes, members)
    if score >= threshold:
        decision = "approved"
    elif score < (threshold - 0.25):
        decision = "changes-requested"
    else:
        decision = "reviewed"
```

### Phase 8: Output (State: OUTPUT)

Generate report in `--format`:

**Markdown** — Full report with scope scores, findings tables, consensus, conflicts, auto-fixable items
**JSON** — Machine-readable with full metadata (for CI integration)
**Inline** — Findings as `file:line: [severity] message` (for editor integration)
**Summary** — Executive summary: decision + top 5 issues + scope scores
**GitHub PR** — Formatted for GitHub PR comment with review decision
**Jira Comment** — Formatted for Jira issue comment

If `--post-to`: POST results to specified service
If `--webhook`: POST JSON to webhook URL

### Phase 9: Auto-Fix (State: AUTO_FIX, optional)

If `--auto-fix`:
1. Filter: `auto_fixable == true` AND `confidence >= fix-confidence` AND `severity >= fix-severity`
2. If `--fix-dry-run`: show planned changes without applying
3. Sort by file to batch edits
4. Apply each fix via Edit tool
5. Run quick validation (typecheck/lint) after fixes
6. Report: applied, skipped (low confidence), skipped (test files)

---

## Configuration File

Full configuration via `--config path/to/council.yaml`:

```yaml
council:
  # Defaults
  default_protocol: expert-panel
  default_preset: standard
  default_depth: standard
  default_format: markdown

  # Voting
  voting:
    approval_threshold: 0.7
    require_unanimous_on_critical: false
    veto_agents: [security-reviewer, secrets-scanner]
    min_confidence: 0.5

  # Scoring
  scoring:
    mode: weighted    # weighted | pass-fail | highest-concern
    scope_weights:
      security: 0.30
      quality: 0.25
      performance: 0.20
      testing: 0.10
      architecture: 0.10
      accessibility: 0.05
    pass_thresholds:
      security: 85
      quality: 75
      performance: 80
      testing: 70
      architecture: 70
      accessibility: 90

  # Member configuration
  members:
    code-reviewer:
      model: sonnet
      weight: 1.0
      enabled: true
    security-reviewer:
      model: sonnet
      weight: 0.9
      veto_power: true
    architecture-reviewer:
      model: opus         # Use opus for architectural analysis
      weight: 0.9
    accessibility-reviewer:
      enabled: true       # Force-enable (normally conditional)
      weight: 0.8

  # Custom focus overrides
  focus_overrides:
    security-reviewer:
      - "OWASP Top 10"
      - "Authentication bypass"
      - "Rate limiting"
      - "CORS configuration"
      - "CSP headers"

  # Output
  output:
    format: markdown
    group_by: severity
    max_findings_per_agent: 15
    max_inline_comments: 25
    include_suggestions: true
    include_confidence: true
    include_reasoning: false

  # Auto-fix
  auto_fix:
    enabled: false
    min_confidence: 0.85
    min_severity: warning
    skip_patterns:
      - "**/*.test.*"
      - "**/*.spec.*"
      - "**/migrations/**"
      - "**/__snapshots__/**"
    require_confirmation: true

  # File filtering
  filters:
    include: ["src/**", "lib/**", "app/**"]
    exclude: ["**/node_modules/**", "**/*.generated.*", "**/dist/**"]

  # Execution
  execution:
    timeout: 300
    agent_timeout: 60
    max_parallel: 10
    retry_failed: 1
    save_state: true
    state_dir: ".council/sessions"

  # Coding standards (loaded by all agents)
  standards:
    enforce: true
    profile: default    # loads from .council/standards/default.yaml
    on_violation: warning

  # Custom members
  custom_members: []

  # Integration
  integration:
    post_to: null       # github-pr | jira | slack | null
    webhook: null
    diff_base: null     # auto-detect
```

---

## Finding Structure

```json
{
  "id": "sec-review-src/auth/handler.ts-42",
  "agent": "security-reviewer",
  "type": "concern",
  "severity": "critical",
  "scope": "security",
  "file": "src/auth/handler.ts",
  "line_start": 42,
  "line_end": 48,
  "content": "SQL query constructed from user input without parameterization",
  "suggestion": "Use parameterized query: db.query('SELECT * FROM users WHERE id = $1', [userId])",
  "confidence": 0.95,
  "tags": ["sql-injection", "owasp-a03", "input-validation"],
  "auto_fixable": true,
  "deduction": 40,
  "category": "sql-injection"
}
```

## Decision Output

```json
{
  "session_id": "council-2026-03-08-143022",
  "decision": "changes-requested",
  "overall_score": 72,
  "threshold": 0.7,
  "scoring_mode": "weighted",
  "duration_seconds": 145,
  "protocol": "expert-panel",
  "preset": "standard",
  "scope_scores": {
    "security": {"score": 60, "threshold": 85, "pass": false, "deductions": 3},
    "quality": {"score": 82, "threshold": 75, "pass": true, "deductions": 5},
    "performance": {"score": 90, "threshold": 80, "pass": true, "deductions": 1},
    "testing": {"score": 75, "threshold": 70, "pass": true, "deductions": 2}
  },
  "members": {
    "responded": 4,
    "timed_out": 0,
    "malformed": 0,
    "total": 4
  },
  "findings": {
    "critical": 1,
    "warning": 5,
    "info": 8,
    "total": 14,
    "auto_fixable": 3
  },
  "consensus_items": 2,
  "conflict_items": 1,
  "votes": [
    {"agent": "code-reviewer", "decision": "approve", "confidence": 0.85, "weight": 1.0},
    {"agent": "security-reviewer", "decision": "changes-requested", "confidence": 0.92, "weight": 0.9, "veto": true},
    {"agent": "test-strategist", "decision": "approve", "confidence": 0.78, "weight": 0.8},
    {"agent": "performance-analyst", "decision": "approve", "confidence": 0.80, "weight": 0.7}
  ],
  "veto_triggered": true,
  "veto_reason": "security-reviewer: SQL injection in auth handler (confidence: 0.95)"
}
```

---

## Examples

### Quick sanity check on changed files
```
/cc-council . --preset quick --changed-only
```

### Standard review of a directory
```
/cc-council src/api/ --preset standard
```

### Security audit with maximum scrutiny
```
/cc-council src/auth/ --preset security --threshold 0.95 --depth exhaustive
```

### Architecture review with Six Hats and opus model
```
/cc-council . --preset architecture --model opus --verbose
```

### Full review with auto-fix for warnings
```
/cc-council src/ --preset full --auto-fix --fix-severity warning --format markdown
```

### Compliance review with pass-fail gates
```
/cc-council src/ --preset compliance --pass-thresholds "security:90,quality:85"
```

### CI pre-merge gate (changed files, summary output)
```
/cc-council . --preset pre-merge --format json --post-to github-pr
```

### Custom members with per-agent model override
```
/cc-council src/ --members code-reviewer,security-reviewer,architecture-reviewer --member-model architecture-reviewer:opus,security-reviewer:sonnet
```

### Resume a failed council session
```
/cc-council --resume council-2026-03-08-143022
```

### Dry run to preview council plan and cost estimate
```
/cc-council src/ --preset full --dry-run
```

### Custom config with webhook integration
```
/cc-council src/ --config .council.yaml --webhook https://hooks.slack.com/services/xxx
```

### Review only specific scopes
```
/cc-council src/ --scope "security,testing" --members security-reviewer,test-strategist
```

### Exclude docs review from full preset
```
/cc-council src/ --preset full --exclude docs-reviewer,accessibility-reviewer
```

---

## Error Handling

| Error | Detection | Recovery | Impact |
|-------|-----------|----------|--------|
| Agent timeout | No response in `agent-timeout` | Use partial output; mark incomplete | Reduced coverage |
| Malformed JSON | Parse failure | Extract text findings; mark degraded | Findings lack metadata |
| All agents fail | Zero responses | Fall back to single code-reviewer | Degraded but functional |
| Target not found | Path doesn't exist | Suggest similar paths; abort | No review |
| Config invalid | YAML parse error | Report errors; use defaults | Default settings |
| State corrupt | Resume fails | Offer restart from scratch | Full re-run |
| Webhook failure | POST returns non-2xx | Retry once; log warning | Results not forwarded |

---

## Integration Points

| System | How | Flag |
|--------|-----|------|
| `/cc-orchestrate` | Council as validator step in builder-validator template | N/A (template config) |
| `/cc-setup` | Council findings feed audit score (+20% weight) | N/A (automatic) |
| `/cc-memory` | Repeated findings → promote to `.claude/rules/` | N/A (automatic) |
| GitHub PR | Post review comment + inline findings | `--post-to github-pr` |
| Jira | Post comment to linked issue | `--post-to jira` |
| Slack | Forward summary to channel | `--webhook <url>` |
| CI/CD | JSON output for pipeline gates | `--format json` |

## Skills Used
- council-review
- cli-reference
- tools-reference
- permissions-security
- cost-optimization
