# /cc-orchestrate — Agent Team Templates & Multi-Agent Orchestration

Deploy pre-built agent team configurations for common development patterns. Choose between
subagent patterns (hub-and-spoke) and full Agent Teams (mesh coordination) based on your
task complexity.

## Usage

```bash
/cc-orchestrate                          # Interactive template picker
/cc-orchestrate --template builder-validator   # Deploy specific template
/cc-orchestrate --template qa-swarm            # QA testing swarm
/cc-orchestrate --list                         # List all available templates
/cc-orchestrate --status                       # Check running teams/subagents
/cc-orchestrate --dry-run                      # Show template without deploying
/cc-orchestrate --worktree                     # Set up git worktrees for parallel agents
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
    tools: [Read, Glob, Grep, WebSearch, WebFetch]

  researcher-b:
    role: Approach B Investigator
    model: sonnet
    responsibilities:
      - Same as researcher-a but for approach B
    tools: [Read, Glob, Grep, WebSearch, WebFetch]

  researcher-c:
    role: Approach C Investigator
    model: haiku
    responsibilities:
      - Quick feasibility check on approach C
      - Focus on blockers and deal-breakers
    tools: [Read, Glob, Grep, WebSearch]
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
self-coordinate by polling the task list and claiming unclaimed work.

---

## Dry Run Mode

When `/cc-orchestrate --dry-run --template builder-validator` is used:

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
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Auto-spawn review agent after git commit
if echo "$CMD" | grep -q "git commit"; then
  echo "Auto-triggering code review agent..." >&2
  # The review agent will be invoked by Claude in the next turn
fi

echo '{"decision": "approve"}'
```

---

## Template Comparison

| Template | Type | Agents | Cost | Time | Use Case |
|----------|------|--------|------|------|----------|
| builder-validator | Subagent | 2 | Low | 2-5 min | Standard feature work |
| qa-swarm | Team | 4-6 | High | 3-8 min | Thorough testing |
| feature-squad | Team | 3-4 | Medium | 5-15 min | Full-stack features |
| research-council | Subagent | 2-3 | Low | 3-5 min | Design decisions |
| refactor-pipeline | Subagent | 3 | Medium | 5-10 min | Large refactors |
| pr-review-board | Team | 3 | Medium | 3-5 min | Critical PR reviews |
| docs-sprint | Team | 3-4 | Medium | 5-15 min | Documentation updates |
| continuous-monitor | Headless | 1-4 | Very Low | Scheduled | Ongoing automation |

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
