# /cc-orchestrate — Agent Team Templates & Multi-Agent Orchestration

Deploy pre-built agent team configurations for common development patterns. Choose between
subagent patterns (hub-and-spoke) and full Agent Teams (mesh coordination) based on your
task complexity.

**Orchestration-first**: Claude should prefer to delegate work to specialized agents rather
than doing everything directly. Every agent's output gets a second-round audit. Idle agents
are detected and cleaned up automatically.

## Usage

```bash
/cc-orchestrate                          # Interactive template picker
/cc-orchestrate --template builder-validator   # Deploy specific template
/cc-orchestrate --template qa-swarm            # QA testing swarm
/cc-orchestrate --list                         # List all available templates
/cc-orchestrate --status                       # Check running teams/subagents
/cc-orchestrate --dry-run                      # Show template without deploying
/cc-orchestrate --worktree                     # Set up git worktrees for parallel agents
/cc-orchestrate --audit-depth quick|standard|thorough  # Set audit depth
/cc-orchestrate --lifecycle                    # Show agent lifecycle dashboard
/cc-orchestrate --cleanup                      # Force cleanup idle/stalled agents
```

---

## When to Use Subagents vs Agent Teams

### Decision Framework

```
Does the task need workers to communicate with each other?
├── NO → Use Subagents (hub-and-spoke)
│   • Workers report results to parent only
│   • Lower token cost (results summarized)
│   • No setup needed (built-in)
│   • Best for: research, review, focused deep-dives
│
└── YES → Use Agent Teams (mesh network)
    • Workers message each other directly
    • Shared task list with self-claiming
    • Higher cost (~3-5x, each is a full session)
    • Best for: multi-component features, debates, cross-layer work
```

### Cost Comparison

| Pattern | Agents | Tokens/Task | Best For |
|---------|--------|-------------|----------|
| Single agent | 1 | ~50k | Simple changes |
| Subagents | 1 lead + 2-4 workers | ~100-200k | Focused parallel work |
| Agent Team (small) | 3-5 teammates | ~250-500k | Multi-component features |
| Agent Team (swarm) | 5-10 teammates | ~500k-1M | Large-scale review/QA |

---

## Template Library

### Template 1: Builder-Validator (Subagent Pattern)

**When**: Any implementation task where quality matters.
**Pattern**: Builder implements, Validator reviews and catches issues.

```yaml
name: builder-validator
type: subagent
agents:
  lead:
    role: Coordinator
    model: sonnet
    responsibilities:
      - Receive task from user
      - Delegate implementation to Builder
      - Delegate review to Validator
      - Synthesize results and present to user

  builder:
    role: Implementation
    model: sonnet
    responsibilities:
      - Write code changes
      - Run tests
      - Fix failures
    tools: [Read, Write, Edit, Bash, Glob, Grep]

  validator:
    role: Quality Gate
    model: opus
    responsibilities:
      - Review all changes for bugs, security, performance
      - Run static analysis
      - Check test coverage
      - Report issues with severity ratings
    tools: [Read, Bash, Glob, Grep]
```

Deploy with:
```
/cc-orchestrate --template builder-validator
```

Creates `.claude/agents/`:
- `builder.md` — Implementation agent (Sonnet)
- `validator.md` — Review agent (Opus)

### Template 2: QA Swarm (Agent Team Pattern)

**When**: Need thorough testing from multiple perspectives.
**Pattern**: Multiple testers attack the system simultaneously, lead synthesizes.

```yaml
name: qa-swarm
type: agent-team
team_size: 4-6
agents:
  lead:
    role: QA Lead
    model: opus
    responsibilities:
      - Create testing task list
      - Assign testing domains to teammates
      - Synthesize results into prioritized bug report
      - Assign severity ratings

  functional-tester:
    role: Functional Testing
    model: sonnet
    responsibilities:
      - Test core user flows
      - Verify form validation
      - Check error handling
      - Test edge cases

  security-tester:
    role: Security Testing
    model: opus
    responsibilities:
      - Check for XSS, CSRF, injection
      - Verify authentication flows
      - Test authorization boundaries
      - Check credential handling

  performance-tester:
    role: Performance Testing
    model: sonnet
    responsibilities:
      - Identify N+1 queries
      - Check bundle sizes
      - Profile render performance
      - Test under concurrent load

  accessibility-tester:
    role: Accessibility Testing
    model: sonnet
    responsibilities:
      - WCAG 2.1 AA compliance
      - Screen reader compatibility
      - Keyboard navigation
      - Color contrast ratios

  integration-tester:
    role: Integration Testing
    model: sonnet
    responsibilities:
      - API contract validation
      - Third-party service mocks
      - Database state management
      - Event flow verification
```

Deploy with:
```
/cc-orchestrate --template qa-swarm
```

### Template 3: Feature Squad (Agent Team Pattern)

**When**: Building a feature that spans frontend, backend, and infrastructure.
**Pattern**: Specialists work their layer in parallel, coordinating via shared tasks.

```yaml
name: feature-squad
type: agent-team
team_size: 3-4
agents:
  lead:
    role: Tech Lead
    model: opus
    responsibilities:
      - Break feature into tasks per layer
      - Define API contracts between layers
      - Coordinate integration points
      - Run final integration tests

  frontend-dev:
    role: Frontend Developer
    model: sonnet
    responsibilities:
      - Implement UI components
      - Wire up API calls
      - Add client-side validation
      - Write component tests

  backend-dev:
    role: Backend Developer
    model: sonnet
    responsibilities:
      - Implement API endpoints
      - Write database migrations
      - Add server-side validation
      - Write API tests

  infra-dev:
    role: Infrastructure Developer
    model: sonnet
    responsibilities:
      - Update deployment configs
      - Add environment variables
      - Configure CI/CD pipeline
      - Write infrastructure tests
```

### Template 4: Research Council (Subagent Pattern)

**When**: Need to evaluate multiple approaches before committing to one.
**Pattern**: Multiple researchers explore different solutions, lead evaluates.

```yaml
name: research-council
type: subagent
agents:
  lead:
    role: Decision Maker
    model: opus
    responsibilities:
      - Define evaluation criteria
      - Spawn researchers for each approach
      - Compare findings
      - Recommend best approach with trade-offs

  researcher-a:
    role: Approach A Investigator
    model: sonnet
    responsibilities:
      - Research feasibility of approach A
      - Find examples and documentation
      - Estimate complexity and risks
      - Write pros/cons summary
    tools: [Read, Glob, Grep, mcp__firecrawl, mcp__perplexity]

  researcher-b:
    role: Approach B Investigator
    model: sonnet
    responsibilities:
      - Same as researcher-a but for approach B
    tools: [Read, Glob, Grep, mcp__firecrawl, mcp__perplexity]

  researcher-c:
    role: Approach C Investigator (optional)
    model: haiku
    responsibilities:
      - Quick feasibility check on approach C
      - Focus on blockers and deal-breakers
    tools: [Read, Glob, Grep, mcp__perplexity]
```

### Template 5: Refactor Pipeline (Subagent Pattern)

**When**: Large-scale refactoring (rename, extract, migrate API, upgrade dependency).
**Pattern**: Analyzer maps changes, Implementer applies them, Verifier validates.

```yaml
name: refactor-pipeline
type: subagent
agents:
  lead:
    role: Refactor Coordinator
    model: sonnet
    responsibilities:
      - Plan the refactor
      - Coordinate analyzer → implementer → verifier pipeline
      - Handle failures and rollbacks

  analyzer:
    role: Impact Analyzer
    model: sonnet
    responsibilities:
      - Find all affected files and references
      - Map dependency graph
      - Identify breaking changes
      - Produce change manifest
    tools: [Read, Glob, Grep]

  implementer:
    role: Change Applicator
    model: sonnet
    responsibilities:
      - Apply changes from manifest
      - Handle edge cases
      - Maintain backwards compatibility where needed
    tools: [Read, Write, Edit, Glob, Grep]

  verifier:
    role: Change Verifier
    model: sonnet
    responsibilities:
      - Run type checker
      - Run tests
      - Check for regressions
      - Verify no broken imports/references
    tools: [Read, Bash, Glob, Grep]
```

### Template 6: PR Review Board (Agent Team Pattern)

**When**: Critical PRs that need multi-perspective review.
**Pattern**: Multiple reviewers with different focuses, synthesized into one review.

```yaml
name: pr-review-board
type: agent-team
team_size: 3
agents:
  lead:
    role: Review Lead
    model: opus
    responsibilities:
      - Read the PR diff
      - Assign review perspectives
      - Synthesize all reviews into final assessment
      - Rate: approve / request changes / needs discussion

  correctness-reviewer:
    role: Correctness & Logic
    model: opus
    responsibilities:
      - Logic errors, edge cases, off-by-one
      - Null/undefined handling
      - Race conditions, concurrency issues
      - Business logic correctness

  security-reviewer:
    role: Security & Safety
    model: opus
    responsibilities:
      - OWASP Top 10 checks
      - Credential exposure
      - Input validation
      - Privilege escalation paths

  maintainability-reviewer:
    role: Code Quality
    model: sonnet
    responsibilities:
      - Code readability and naming
      - Test coverage
      - Documentation needs
      - Performance concerns
```

### Template 7: Documentation Sprint (Agent Team Pattern)

**When**: Need to update docs across the project after major changes.
**Pattern**: Multiple writers document different areas in parallel.

```yaml
name: docs-sprint
type: agent-team
team_size: 3-4
agents:
  lead:
    role: Docs Coordinator
    model: sonnet
    responsibilities:
      - Identify areas needing documentation
      - Assign sections to writers
      - Review consistency and accuracy

  api-documenter:
    role: API Documentation
    model: sonnet
    responsibilities:
      - Document all API endpoints
      - Generate request/response examples
      - Update OpenAPI/Swagger specs

  guide-writer:
    role: Guide & Tutorial Writer
    model: sonnet
    responsibilities:
      - Write setup guides
      - Create how-to tutorials
      - Update README files

  reference-writer:
    role: Reference Documentation
    model: haiku
    responsibilities:
      - Generate type/interface docs
      - Document configuration options
      - Update changelog
```

### Template 8: Continuous Monitor (Headless/Cron Pattern)

**When**: Ongoing automated checks running on a schedule.
**Pattern**: Headless Claude Code instances running via cron.

```yaml
name: continuous-monitor
type: headless-cron
schedules:
  daily-quality:
    cron: "0 9 * * *"
    prompt: "Run code quality check on changed files in last 24 hours. Report issues."
    model: haiku

  daily-deps:
    cron: "0 10 * * 1"
    prompt: "Check for outdated dependencies. Create update PR if safe."
    model: sonnet

  daily-security:
    cron: "0 8 * * *"
    prompt: "Scan for new security vulnerabilities in dependencies."
    model: sonnet

  pr-review:
    trigger: "on-pr-open"
    prompt: "Review this PR for correctness, security, and test coverage."
    model: opus
```

---

## Git Worktree Setup for Parallel Agents

When `/cc-orchestrate --worktree` is used, set up parallel development:

```bash
# Create worktrees for parallel agent work
git worktree add ../project-agent-1 -b feature/agent-1-work
git worktree add ../project-agent-2 -b feature/agent-2-work
git worktree add ../project-agent-3 -b feature/agent-3-work

# Each worktree gets its own Claude Code instance
# with full CLAUDE.md, settings, and MCP access

# After work completes, compare and merge:
git checkout main
git merge feature/agent-1-work  # Take the best parts
git worktree remove ../project-agent-1
```

### Worktree Management

```bash
# List active worktrees
git worktree list

# Clean up after agents finish
git worktree prune

# Or use Claude's built-in --worktree flag
claude --worktree  # Creates isolated worktree automatically
```

---

## Team Primitives Reference

Agent Teams use these coordination primitives:

| Primitive | Purpose | Usage |
|-----------|---------|-------|
| `TeamCreate` | Start a new team | Define team name, roles, lead |
| `TaskCreate` | Add work item | Assignee, priority, dependencies |
| `TaskUpdate` | Update status | Mark complete, blocked, add notes |
| `TaskList` | View all tasks | Filter by status, assignee |
| `SendMessage` | Direct message | Teammate-to-teammate communication |
| `TeamDelete` | Dissolve team | Clean up after work complete |

Task files live on disk at `~/.claude/tasks/{team-name}/` as JSON. Teammates
self-coordinate by polling via `TaskList` and claiming work by calling
`TaskUpdate` to set themselves as assignee.

---

## Dry Run Mode

When `/cc-orchestrate --dry-run` is used without `--template`, it lists all available
templates with their type, agent count, and estimated cost. When used with
`--template`, it shows the full deployment plan for that template:

Example: `/cc-orchestrate --dry-run --template builder-validator`:

```
=== Orchestration Plan (Dry Run) ===

Template: Builder-Validator
Type: Subagent pattern (hub-and-spoke)
Estimated token cost: ~150-200k tokens

Would create:
  .claude/agents/builder.md         (Sonnet, implementation)
  .claude/agents/validator.md       (Opus, quality review)

Agent flow:
  1. Lead receives task from user
  2. Lead spawns Builder subagent
     → Builder implements changes, runs tests
     → Builder returns: {files_changed, test_results, notes}
  3. Lead spawns Validator subagent
     → Validator reviews all changes
     → Validator returns: {issues[], severity, verdict}
  4. Lead synthesizes and presents to user

Prerequisites:
  ✓ .claude/agents/ directory exists
  ✓ Git repo initialized
  ✗ No existing builder.md (would create)
  ✗ No existing validator.md (would create)

No files written. Run without --dry-run to deploy.
```

---

## Auto-Trigger Configuration

Configure agents to activate automatically based on context:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/auto-review-on-commit.sh"
        }]
      }
    ]
  }
}
```

#### auto-review-on-commit.sh
```bash
#!/bin/bash
INPUT=$(head -c 65536)
if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo '{"decision": "approve"}'
  exit 0
fi

CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Auto-spawn review agent after git commit (not amend, not stash)
if printf '%s' "$CMD" | grep -q "^git commit "; then
  echo "Auto-triggering code review agent..." >&2
  # The review agent will be invoked by Claude in the next turn
fi

echo '{"decision": "approve"}'
```

---

## Template Comparison

| Template | Type | Agents (lead + workers) | Cost | Time | Use Case |
|----------|------|------------------------|------|------|----------|
| builder-validator | Subagent | 3 (1 lead + 2 workers) | Low | 2-5 min | Standard feature work |
| qa-swarm | Team | 6 (1 lead + 5 testers) | High | 3-8 min | Thorough testing |
| feature-squad | Team | 4 (1 lead + 3 devs) | Medium | 5-15 min | Full-stack features |
| research-council | Subagent | 3-4 (1 lead + 2-3 researchers) | Low | 3-5 min | Design decisions |
| refactor-pipeline | Subagent | 4 (1 lead + 3 workers) | Medium | 5-10 min | Large refactors |
| pr-review-board | Team | 4 (1 lead + 3 reviewers) | Medium | 3-5 min | Critical PR reviews |
| docs-sprint | Team | 4 (1 lead + 3 writers) | Medium | 5-15 min | Documentation updates |
| continuous-monitor | Headless | 1 per schedule | Very Low | Scheduled | Ongoing automation |

---

## Custom Templates

Create your own templates in `.claude/orchestration/`:

```markdown
# .claude/orchestration/my-template.md

## Template: My Custom Team
Type: agent-team
Agents: 3

### Lead Agent
- Model: opus
- Role: Coordinator
- Prompt: {custom system prompt}

### Worker 1
- Model: sonnet
- Role: {custom role}
- Tools: [Read, Write, Edit, Bash]
- Prompt: {custom system prompt}

### Worker 2
- Model: sonnet
- Role: {custom role}
- Tools: [Read, Grep, Glob]
- Prompt: {custom system prompt}
```

Then deploy: `/cc-orchestrate --template my-template`

---

## Mandatory Audit Loop

**Every agent's work is audited before acceptance. This is non-negotiable.**

### How It Works

```
Agent completes task
       ↓
Orchestrator spawns audit agent (code-reviewer or audit-reviewer)
       ↓
Audit agent checks:
  - Completeness: did the agent do everything asked?
  - Correctness: is the output right?
  - Consistency: does it match project style?
  - Security: any vulnerabilities introduced?
  - Testing: are new things tested?
       ↓
Verdict:
  PASS → accept work, include in deliverables
  PASS_WITH_NOTES → accept with logged improvement notes
  FAIL → return to original agent with specific fixes (max 2 rework rounds)
```

### Audit Depth

Control how thorough the audit is:

| Depth | Checks | Model | Cost | When to Use |
|-------|--------|-------|------|-------------|
| `quick` | completeness, correctness | haiku | Low | Simple changes, trusted agents |
| `standard` | + consistency, security | sonnet | Medium | Normal development work |
| `thorough` | + testing, documentation | opus | High | Critical changes, production deploys |

### Cross-Audit for Teams

In teams with 3+ agents, use round-robin cross-auditing:

```
Agent A → audited by Agent B
Agent B → audited by Agent C
Agent C → audited by Agent A
```

This distributes audit load and provides diverse review perspectives.

---

## Agent Lifecycle Management

### Orchestration-First Principle

Claude should **prefer to orchestrate** rather than do work directly:

1. Break the task into discrete work units
2. Assign each to the best-fit agent type
3. Run agents in parallel where possible
4. Monitor agent health with periodic check-ins
5. Audit every agent's output
6. Clean up idle/stalled agents
7. Synthesize results

**Direct work is the fallback, not the default.**

### Agent Health States

| State | Meaning | Action |
|-------|---------|--------|
| `active` | Producing output | None — let it work |
| `idle` | No output >60s | Send check-in message |
| `stalled` | No response >120s | Evaluate: redirect or terminate |
| `completed` | Task done | Collect results immediately |
| `orphaned` | Lost reference | Terminate and log |
| `errored` | Unrecoverable error | Collect partial output, terminate |

### Check-In Protocol

Every 2 minutes during orchestration:

```
1. List all spawned agent IDs
2. For each agent:
   - Active → continue
   - Idle >60s → SendMessage: "Status check: progress on [{task}]?"
   - No response to check-in >30s → mark stalled
   - Stalled >180s → terminate, reassign if needed
   - Completed → collect results, release
3. Report cleanup summary
```

### Cleanup Triggers

Cleanup runs automatically:
- Every 2 minutes during orchestration
- After fan-in (before producing results)
- Before session ends (final sweep)
- On `--cleanup` flag (manual trigger)

### Token Budget Management

```
Per-agent budget = total_budget / num_agents

If agent > 150% per-agent budget → flag for review
If total > 80% budget → switch remaining to cheaper models
If total > 95% budget → terminate non-essential agents, alert user
```

### No Orphaned Agents Rule

Before producing final output, the orchestrator MUST:
1. List all agents spawned during this session
2. Confirm each is completed or terminated
3. Collect any uncollected results
4. Log force-terminated agents and note any data loss

---

## Template 9: Audited Builder (Subagent Pattern with Audit Loop)

**When**: Any implementation task where quality is critical and every change must be verified.
**Pattern**: Builder implements, Audit Reviewer catches gaps, Builder fixes, re-audit.

```yaml
name: audited-builder
type: subagent
agents:
  lead:
    role: Orchestrator
    model: sonnet
    responsibilities:
      - Receive task, break into work units
      - Spawn builder for implementation
      - Spawn audit-reviewer to verify
      - If audit fails: send fixes back to builder
      - Max 2 rework rounds, then escalate
      - Clean up all agents when done

  builder:
    role: Implementation
    model: sonnet
    responsibilities:
      - Implement code changes
      - Write tests
      - Run tests, fix failures
    tools: [Read, Write, Edit, Bash, Glob, Grep]

  audit-reviewer:
    role: Second-Round Auditor
    model: opus
    responsibilities:
      - Review all builder changes
      - Check completeness, correctness, security, tests
      - Produce audit verdict: PASS / PASS_WITH_NOTES / FAIL
      - If FAIL: list specific fixes needed
    tools: [Read, Bash, Glob, Grep]
```

### Flow

```
User Task → Builder implements → Audit Reviewer checks
                                       ↓
                    PASS → deliver to user
                    FAIL → Builder fixes → Audit re-checks (max 2x)
                                       ↓
                              Still FAIL → escalate to user
```

---

## Template 10: Full-Stack Squad with Audit (Agent Team + Audit)

**When**: Multi-layer feature with cross-cutting audit.
**Pattern**: Parallel specialists + cross-audit + final synthesis.

```yaml
name: audited-squad
type: agent-team
team_size: 5
agents:
  lead:
    role: Tech Lead & Orchestrator
    model: opus
    responsibilities:
      - Decompose feature into frontend/backend/infra tasks
      - Assign tasks, monitor progress
      - Run cross-audit: frontend audits backend, backend audits infra
      - Final integration test and synthesis
      - Lifecycle management: check-in, cleanup idle agents

  frontend-dev:
    role: Frontend Specialist
    model: sonnet
    audit_by: backend-dev  # cross-audit assignment

  backend-dev:
    role: Backend Specialist
    model: sonnet
    audit_by: infra-dev  # cross-audit assignment

  infra-dev:
    role: Infrastructure Specialist
    model: sonnet
    audit_by: frontend-dev  # cross-audit assignment

  final-auditor:
    role: Integration Auditor
    model: opus
    responsibilities:
      - After cross-audits pass, review entire changeset holistically
      - Check integration points between layers
      - Verify no gaps between frontend/backend contract
      - Final quality gate
```

---

## Pattern-Based Templates (NEW)

These templates are built on the agentic design patterns from `skills/agentic-patterns/SKILL.md`.
Use `--auto-pattern` to let the pattern-router agent select the best template automatically.

### Template 9: Eval-Optimizer Loop (Subagent Pattern)

**When**: Quality-critical output — generated configs, API designs, complex algorithms.
**Pattern**: Generator produces, evaluator scores against rubric, generator refines. Iterates until threshold met.

```yaml
name: eval-optimizer
type: subagent
pattern: evaluator-optimizer  # from agentic-patterns skill
agents:
  lead:
    role: Orchestrator
    model: sonnet
    responsibilities:
      - Parse requirements and define quality rubric
      - Delegate generation to Generator
      - Delegate evaluation to Evaluator
      - Feed critique back to Generator for refinement
      - Accept when score >= threshold or max iterations reached

  generator:
    role: Artifact Creator
    model: sonnet
    tools: [Read, Write, Edit, Bash, Grep, Glob]
    prompt: |
      Generate the requested artifact meeting all requirements.
      If this is a refinement pass, address every critique point
      from the evaluator. Do not regress on previously passing criteria.

  evaluator:
    role: Quality Scorer
    model: opus  # evaluator should be >= generator capability
    tools: [Read, Grep, Glob, Bash]
    prompt: |
      Score the artifact against the rubric. For each dimension
      (correctness, completeness, style, safety), provide:
      - Score (0-100)
      - Specific issues found
      - Concrete suggestions for improvement
      Return structured JSON with { score, pass, critique[], suggestions[] }.

config:
  quality_threshold: 80
  max_iterations: 3
  on_stuck: escalate_to_human  # if score doesn't improve across 2 iterations
  estimated_cost: "$0.15-0.60"
```

### Template 10: Orchestrator-Workers (Dynamic Subagent Pattern)

**When**: Task decomposition isn't known upfront — the orchestrator must reason about what to delegate.
**Pattern**: Central orchestrator analyzes task, spawns workers on-demand, synthesizes results.

```yaml
name: orchestrator-workers
type: subagent
pattern: orchestrator-workers  # from agentic-patterns skill
agents:
  orchestrator:
    role: Lead Engineer
    model: opus
    tools: [Agent, Read, Grep, Glob, TodoWrite]
    prompt: |
      Analyze the task. Decompose into subtasks. For each subtask,
      spawn the best-fit worker. You may spawn additional workers
      if gaps emerge from earlier results. Synthesize all worker
      outputs into a coherent deliverable.
    rules:
      - Never implement directly — always delegate to workers
      - Spawn at most 5 workers to control cost
      - Track progress via TodoWrite
      - Audit every worker's output before accepting

  worker_pool:
    available:
      - name: implementer
        model: sonnet
        tools: [Read, Write, Edit, Bash, Grep, Glob]
        specialty: "Write and modify code"
      - name: tester
        model: sonnet
        tools: [Read, Write, Bash, Grep, Glob]
        specialty: "Write tests and verify correctness"
      - name: reviewer
        model: sonnet
        tools: [Read, Grep, Glob, Bash]
        specialty: "Review code for bugs, style, and security"
      - name: researcher
        model: haiku
        tools: [Read, Grep, Glob, Bash, WebSearch]
        specialty: "Search codebase, find examples, look up docs"
    spawn_policy: on_demand  # orchestrator decides which to use

config:
  max_workers: 5
  timeout_per_worker: 120s
  estimated_cost: "$0.20-1.00"
```

### Template 11: Blackboard Council (Agent Team Pattern)

**When**: Cross-domain analysis where findings in one area inform another.
**Pattern**: Agents share a blackboard (common state store). Each reads findings from others
and contributes their own. An architect resolves conflicts.

```yaml
name: blackboard-council
type: team
pattern: multi-agent-blackboard  # from agentic-patterns skill
agents:
  architect:
    role: Lead Architect & Conflict Resolver
    model: opus
    tools: [Read, Write, Edit, Grep, Glob, Agent, TodoWrite]
    prompt: |
      You lead a cross-domain council. Read the shared blackboard
      for findings from all analysts. Resolve conflicts between
      findings. Write final decisions. Synthesize the complete
      analysis when all analysts have reported.
    reads: [findings, conflicts, open_questions]
    writes: [decisions, findings]

  security_analyst:
    role: Security Domain Expert
    model: sonnet
    tools: [Read, Grep, Glob, Bash]
    prompt: |
      Analyze the codebase for security issues. Read the shared
      blackboard for context from other analysts. Write your
      findings to the blackboard. If your finding conflicts with
      another analyst's, write to conflicts[].
    reads: [findings, open_questions]
    writes: [findings, open_questions, conflicts]

  performance_analyst:
    role: Performance Domain Expert
    model: sonnet
    tools: [Read, Grep, Glob, Bash]
    reads: [findings, open_questions]
    writes: [findings, open_questions]

  reliability_analyst:
    role: Reliability & Testing Expert
    model: sonnet
    tools: [Read, Grep, Glob, Bash]
    reads: [findings, open_questions]
    writes: [findings, open_questions, conflicts]

blackboard:
  schema:
    findings: "{ agent, domain, finding, severity, evidence, confidence }"
    open_questions: "{ agent, question, context, priority }"
    conflicts: "{ agent_a, agent_b, topic, position_a, position_b }"
    decisions: "{ architect, topic, decision, rationale }"
  protocol:
    1. All analysts read blackboard before starting
    2. Analysts write findings as they discover them
    3. Analysts check for conflicts with existing findings
    4. Architect resolves conflicts after all analysts report
    5. All agents re-read decisions before finalizing

config:
  estimated_cost: "$0.50-2.00"
```

### Template 12: ReAct Debugger (Subagent Pattern)

**When**: Debugging or investigation where the next step depends on what you discover.
**Pattern**: Explicit Thought → Action → Observation cycles with an auditable trace.

```yaml
name: react-debugger
type: subagent
pattern: react-planning  # from agentic-patterns skill
agents:
  debugger:
    role: Investigator
    model: sonnet
    tools: [Read, Grep, Glob, Bash, Edit]
    prompt: |
      For each step, follow this cycle:
      THOUGHT: State your hypothesis about the issue.
      ACTION: Execute ONE tool call to test it.
      OBSERVATION: What did you learn? Confirm or refute?
      Log each cycle. Continue until root cause is found.
    rules:
      - Maximum 20 cycles before escalating
      - Log each cycle to .claude/traces/{task_id}.jsonl
      - If stuck for 3+ cycles, try a different approach
      - Present findings as: root cause, evidence chain, fix

config:
  max_cycles: 20
  trace_log: true
  escalation: ask_human
  estimated_cost: "$0.05-0.30"
```

### Template 13: Specialist Fan-Out (Subagent Pattern)

**When**: You need N distinct lenses on the same target (upgrade audit, architecture review,
multi-perspective triage). Lightweight version of the Blackboard Council (Template 11) — use
this when Round-1 findings are enough and cross-round critique is not worth the extra spawn cost.

**Pattern**: Spawn N named specialists in parallel in a single message. Each returns structured
findings for one lens. Orchestrator (the main session) reads all outputs and synthesizes
in-context.

**Critical reliability rule**: use **named specialists** (architecture-specialist,
performance-specialist, security-specialist, dx-specialist, ux-specialist, researcher,
code-reviewer). Do not fall back to `Explore` / `general-purpose` — those carry no scaffolding
system prompt and your user-prompt would have to grow 2-3x to compensate, landing in the
Agent-tool's prompt-budget reject zone. See `skills/prompt-budget-preflight/SKILL.md`.

```yaml
name: specialist-fanout
type: subagent
pattern: parallelization  # from agentic-patterns skill
agents:
  architecture-specialist:
    role: Architecture, coupling, invariants, blast radius
    model: opus
    prompt_budget_words: 400
  performance-specialist:
    role: Latency, memory, throughput, cache hits, startup time
    model: opus
    prompt_budget_words: 400
  security-specialist:
    role: Threat modeling, credential leakage, SSRF, supply chain
    model: opus
    prompt_budget_words: 400
  dx-specialist:
    role: Error messages, observability, tooling, iteration speed
    model: sonnet
    prompt_budget_words: 400
  ux-specialist:
    role: Discoverability, flows, progressive disclosure, first-use
    model: sonnet
    prompt_budget_words: 400
  researcher:
    role: Innovation lens — LLM-in-the-loop / frontier patterns
    model: sonnet
    prompt_budget_words: 400
  code-reviewer:
    role: Junior / obvious-wins — duplication, naming, dead code
    model: sonnet
    prompt_budget_words: 400

coordination:
  round_1: parallel_spawn  # single message, all 7 Agent tool calls
  round_2: in_context_synthesis  # orchestrator reads all outputs
  upgrade_path: >
    For real Round-2 critique where agents react to each others' findings,
    use Template 11 (blackboard-council) instead — the blackboard MCP primitive
    gives agents a way to read peer findings without the orchestrator having
    to forward them.

config:
  spawn_mode: parallel
  reject_rate_budget: 0.05  # target < 5% after specialist-first routing
  estimated_cost: "$0.50-1.50"
  observed_wall_clock: >
    One session's 7-specialist run: 58s / 129s / 251s / 288s / 302s / 329s / 490s.
    Bounded by slowest (architecture outlier at 8 min, 43 tool uses). Mean ~264s.
    Total across 7 agents: ~680k tokens.
```

**Step-by-step orchestrator script**:

1. Pick a scope and a stable `run_id` (e.g. `20260417-council-X`).
2. Compose a 5-section minimum-viable prompt per specialist using the template in
   `skills/prompt-budget-preflight/SKILL.md`. Each prompt under ~400 words.
3. Spawn all N in ONE message with parallel `Agent` tool calls.
4. Wait for completion notifications. Do not poll; do not tail output files.
5. For each result: skim the structured findings. Optionally call
   `cc_blackboard_append` to persist for the upgrade-to-Template-11 path.
6. Synthesize in-context: dedupe, rank, bundle complementary items.

**Escalation path**: if any single agent's prompt exceeds ~400 words, or a second round of
agent-to-agent critique is needed, switch to Template 11 (Blackboard Council) and use the
`cc_blackboard_append` / `cc_blackboard_read` MCP tools (`skills/orchestration-blackboard`).

---

## Pattern Selection Guide

Use `--auto-pattern` to let the `pattern-router` agent select automatically, or choose manually:

```
What kind of task is it?
├── Simple implementation → builder-validator (Template 1)
├── Quality-critical output → eval-optimizer (Template 9)
├── Unknown decomposition → orchestrator-workers (Template 10)
├── Multi-domain analysis → blackboard-council (Template 11)
├── Bug investigation → react-debugger (Template 12)
├── Multi-component feature → feature-squad (Template 3)
├── Testing campaign → qa-swarm (Template 2)
├── Design decision → research-council (Template 4)
├── Large refactor → refactor-pipeline (Template 5)
├── Critical PR review → pr-review-board (Template 6)
├── Documentation → docs-sprint (Template 7)
└── Ongoing monitoring → continuous-monitor (Template 8)
```

---

## Updated Template Comparison

| Template | Type | Pattern | Agents | Cost | Audit | Use Case |
|----------|------|---------|--------|------|-------|----------|
| builder-validator | Subagent | Prompt Chain | 3 | Low | Single review | Standard feature work |
| **audited-builder** | Subagent | Chain + Reflection | 3 | Medium | Full audit loop | Quality-critical features |
| qa-swarm | Team | Parallelization | 6 | High | Peer review | Thorough testing |
| feature-squad | Team | Orchestrator-Workers | 4 | Medium | Lead review | Full-stack features |
| **audited-squad** | Team | Orch-Workers + Eval | 5 | High | Cross-audit + final | Critical full-stack work |
| research-council | Subagent | Parallelization | 3-4 | Low | Source validation | Design decisions |
| refactor-pipeline | Subagent | Prompt Chain | 4 | Medium | Verifier step | Large refactors |
| pr-review-board | Team | Parallelization | 4 | Medium | Cross-review | Critical PR reviews |
| docs-sprint | Team | Parallelization | 4 | Medium | Accuracy check | Documentation updates |
| continuous-monitor | Headless | Routing | 1/schedule | Very Low | Automated | Ongoing automation |
| **eval-optimizer** | Subagent | Eval-Optimizer | 3 | Medium | Rubric scoring | Quality-critical artifacts |
| **orchestrator-workers** | Subagent | Orchestrator-Workers | 1+N | Variable | Lead audit | Dynamic task decomposition |
| **blackboard-council** | Team | Blackboard | 4 | High | Architect resolves | Cross-domain deep analysis |
| **react-debugger** | Subagent | ReAct | 1 | Low | Trace log | Investigation & debugging |
| **specialist-fanout** | Subagent | Parallelization | 5-7 | Medium-High | In-context synthesis | Multi-lens upgrade audit / review |

---

## Lifecycle Dashboard

When `/cc-orchestrate --lifecycle` is used, display:

```
=== Agent Lifecycle Dashboard ===

Active Agents: 3
  [abc123] code-reviewer    ACTIVE   2m 15s   ~12k tokens
  [def456] test-writer      IDLE     1m 30s   ~8k tokens   ← check-in sent
  [ghi789] security-review  COMPLETED 0m 45s  ~5k tokens   ← results ready

Completed: 2
  [jkl012] researcher       DONE     3m 20s   ~15k tokens  results: collected
  [mno345] doc-writer       DONE     2m 10s   ~6k tokens   results: collected

Terminated: 1
  [pqr678] builder          STALLED  5m 00s   ~20k tokens  reason: no response

Total Tokens: ~66k | Budget: 200k (33% used)
Audit Status: 2/3 passed, 1 pending
```
