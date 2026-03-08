---
name: council-review
description: Domain knowledge for multi-agent council review protocols, orchestration patterns, scoring systems, and deliberation frameworks
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
triggers:
  - council review
  - agent council
  - multi-agent review
  - code review council
  - deliberation protocol
  - blackboard pattern
  - expert panel review
  - red blue team
  - six thinking hats
  - weighted voting
---

# Council Review Skill

Domain knowledge for orchestrating multi-agent review councils with structured deliberation protocols.

## Use For
- Running `/cc-council` reviews with appropriate protocol selection
- Configuring council members, weights, and voting thresholds
- Understanding when to use each deliberation protocol
- Interpreting council scores and making go/no-go decisions
- Setting up auto-fix pipelines with confidence thresholds
- Integrating council reviews into CI/CD pipelines

## Protocol Selection Guide

### Decision Tree

```
What are you reviewing?
├── Security-sensitive code (auth, payments, secrets)
│   └── Use: red-blue-team --preset security
├── Architecture or design decision
│   └── Use: six-thinking-hats --preset architecture
├── Small PR (<100 lines)
│   └── Use: rapid-fire --preset quick
├── Large PR (>500 lines, multi-file)
│   └── Use: blackboard --preset full
├── Contentious change (team disagreement)
│   └── Use: delphi --preset standard
└── Regular code change
    └── Use: expert-panel --preset standard
```

### Protocol Comparison

| Protocol | Rounds | Agent Interaction | Token Cost | Quality | Speed |
|----------|--------|-------------------|------------|---------|-------|
| rapid-fire | 1 | None | Low | Good | Fast |
| expert-panel | 1-2 | After analysis | Medium | High | Medium |
| blackboard | Async | Shared space | Medium | High | Medium |
| red-blue-team | 2 | Adversarial | High | Very High | Slow |
| six-thinking-hats | 6 views | Structured | High | Very High | Slow |
| delphi | 2-3 | Anonymous | Highest | Highest | Slowest |

## Orchestration Best Practices

### Fan-Out / Fan-In
- **Always** spawn all agents in a single message for true parallelism
- Each agent gets **scoped context** — only the files/info they need
- Use `run_in_background: false` so results come back synchronously
- Handle partial failures: if 3/4 agents respond, proceed with 3

### Context Scoping
Giving each agent the minimum viable context:
- Reduces token cost by 40-60%
- Improves finding quality (less noise to filter)
- Prevents agents from commenting outside their specialty

### Weight Calibration
Default weights reflect review importance:
```
code-reviewer:         1.0  (always relevant)
security-reviewer:     0.9  (high impact, veto power)
architecture-reviewer: 0.9  (structural decisions matter)
test-strategist:       0.8  (coverage critical for confidence)
performance-analyst:   0.7  (important but often subjective)
accessibility-reviewer: 0.6 (important for frontend)
api-reviewer:          0.6  (important for API changes)
dependency-auditor:    0.6  (important for supply chain)
docs-reviewer:         0.5  (lower weight, rarely blocks)
```

### Veto Power
- Only `security-reviewer` and `secrets-scanner` have default veto
- Veto triggers on: critical finding + confidence >= 0.8
- Veto overrides weighted voting — always results in `changes-requested`
- Rationale: security issues must never be approved by majority vote

### Consensus Detection
When 2+ agents flag the same file+line range:
- Boost confidence by 1.2x
- Mark as "consensus" in report (stronger signal)
- These findings are almost always valid

### Conflict Resolution
When agents disagree on severity:
- Lead agent (if designated) has tie-breaking authority
- Otherwise: higher-weight agent's assessment wins
- Always report the conflict with both perspectives

## Scoring System

### Scope Independence
Each scope (security, quality, performance, etc.) is scored independently on a 0-100 scale. This prevents a strong quality score from masking a weak security score.

### Deduction Tables
Findings map to deductions via category lookup tables. The deduction is multiplied by the finding's confidence score, so low-confidence findings have proportionally less impact.

### Scoring Modes

**Weighted (default)**: Scope scores are combined using configurable weights. Good for overall quality assessment where trade-offs are acceptable.

**Pass-fail**: Each scope must independently meet its threshold. Good for compliance and gating — no scope can compensate for another.

**Highest-concern**: Overall score equals the weakest scope. Most conservative mode — forces attention to the weakest area.

## Auto-Fix Guidelines

### When to Auto-Fix
- Formatting and style issues (confidence typically 0.95+)
- Import organization (high confidence, mechanical)
- Type annotations (when TypeScript can infer)
- Simple null checks (optional chaining additions)

### When NOT to Auto-Fix
- Business logic changes (too context-dependent)
- Architecture refactoring (requires human judgment)
- Test modifications (risk of masking real failures)
- Migration files (must be append-only)
- Generated files (will be overwritten)

### Safety Checks
After auto-fix:
1. Run `--fix-dry-run` first to preview changes
2. Auto-fix respects `skip_patterns` in config
3. Post-fix validation: lint + typecheck
4. If validation fails: revert the fix, report as "fix-failed"

## CI/CD Integration

### Pre-Merge Gate
```bash
# In CI pipeline:
/cc-council . --preset pre-merge --format json --changed-only > council-result.json
# Check exit code: 0=approved, 1=changes-requested, 2=error
```

### Quality Gate Thresholds
Recommended thresholds by environment:
```
Development:  --threshold 0.5  (permissive, speed over safety)
Staging:      --threshold 0.7  (balanced)
Production:   --threshold 0.85 (strict)
Compliance:   --threshold 0.9 --scoring pass-fail (audit-grade)
```

## State Machine & Resume

The council saves state at each phase boundary. If a phase fails (e.g., network timeout during fan-out), you can resume from the last checkpoint:

```
/cc-council --resume <session-id>
```

State includes:
- Council plan (members, protocol, scopes)
- Raw agent outputs (findings + votes)
- Deliberation results (consensus, conflicts)
- Score calculations

This means you never lose work from a partially completed council.
