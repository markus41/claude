# Agentic Design Patterns — Claude Code Expert

> Comprehensive pattern catalog integrating Andrew Ng's four foundational patterns, Anthropic's
> workflow/agent taxonomy, and the extended patterns from Gulli & Sauco (2025). Each pattern
> includes a concrete Claude Code implementation template mapped to the 4-layer extension stack.

## Two Taxonomies, One Stack

### Andrew Ng's Four Foundational Patterns
Reflection, Tool Use, Planning, Multi-Agent — the building blocks that kicked off the field.

### Anthropic's Workflow vs Agent Distinction
Anthropic draws a critical line between **Workflows** (developer-controlled, deterministic paths)
and **Agents** (LLM-directed, autonomous processes). Most production systems are workflows,
not agents. This distinction prevents over-engineering.

| Type | Control | When to Use | Claude Code Example |
|------|---------|------------|-------------------|
| **Workflow** | Developer-defined path | Task is decomposable, steps are known | Prompt chain, routing, parallelization |
| **Agent** | LLM chooses next action | Task is open-ended, steps emerge at runtime | `cc-intel` deep analysis, `cc-troubleshoot` |

**Rule of thumb**: Start with the simplest workflow pattern that solves your problem. Escalate to
agents only when the task genuinely requires dynamic decision-making.

---

## Part 1: Workflow Patterns (Deterministic)

### 1. Prompt Chaining
Sequential LLM calls where each output feeds the next. The simplest multi-step pattern.

**When to use**: Task has 2-5 distinct phases with clear input/output contracts.
**Achieves**: Up to 15.6% better accuracy than monolithic prompts (Gulli & Sauco, 2025).

**4-Layer Implementation**:
```
Layer 1 (CLAUDE.md):
  "For multi-step analysis, use the chain: fingerprint → analyze → plan → implement"

Layer 2 (Skill):
  skills/deep-code-intelligence/SKILL.md defines the 4-step chain with
  explicit output schemas per step

Layer 3 (Hook):
  PostToolUse hook validates each chain step's output before the next begins
  hooks/chain-validator.sh checks JSON schema compliance

Layer 4 (Agent):
  agents/principal-engineer-strategist.md executes the chain with
  typed handoff objects between steps
```

**Template — Chain with Typed Handoffs**:
```yaml
chain:
  - step: fingerprint
    input: { repoPath: string }
    output: { languages: string[], frameworks: string[], services: string[] }
    agent: haiku  # cheap discovery
  - step: analyze
    input: $fingerprint.output
    output: { gaps: Gap[], risks: Risk[], strengths: string[] }
    agent: sonnet  # moderate reasoning
  - step: plan
    input: $analyze.output
    output: { steps: Step[], dependencies: DAG, estimatedCost: number }
    agent: opus  # deep planning
  - step: implement
    input: $plan.output
    output: { files: FileChange[], tests: string[], commitMessage: string }
    agent: sonnet  # execution
```

### 2. Routing
Classify input and direct to specialized handler. Prevents wasting expensive models on trivial tasks.

**When to use**: Requests vary widely in complexity or domain.

**4-Layer Implementation**:
```
Layer 1 (CLAUDE.md):
  "Route requests by complexity: trivial→haiku, standard→sonnet, architecture→opus"

Layer 2 (Skill):
  skills/model-routing/SKILL.md — decision matrix with cost/capability tables

Layer 3 (Hook):
  PreToolUse hook on Agent tool checks complexity signal before spawning

Layer 4 (Agent):
  Routing is a function, not an agent. The orchestrator applies the routing
  schema before delegating.
```

**Template — Intent Router**:
```yaml
router:
  classify:
    prompt: |
      Classify this request:
      - lookup: factual question, needs retrieval only
      - implement: code change with clear spec
      - analyze: needs deep reasoning or tradeoff analysis
      - debug: error diagnosis and fix
      - orchestrate: requires multiple agents
    model: haiku  # classification is cheap
  routes:
    lookup: { model: haiku, tools: [Read, Grep, Glob] }
    implement: { model: sonnet, tools: [Read, Write, Edit, Bash] }
    analyze: { model: opus, tools: [Read, Grep, Glob, Agent] }
    debug: { model: sonnet, tools: [Read, Grep, Bash, Agent] }
    orchestrate: { model: opus, tools: [Agent], pattern: orchestrator-workers }
```

### 3. Parallelization
Execute independent subtasks simultaneously, then merge results.

**When to use**: Subtasks are independent (no data dependency between them).
**Two variants**:
- **Sectioning**: Split work by domain (security agent + performance agent + style agent)
- **Voting**: Same task, multiple agents, majority wins (reduces variance)

**4-Layer Implementation**:
```
Layer 1 (CLAUDE.md):
  "For code review, run security/performance/style agents in parallel"

Layer 2 (Skill):
  skills/council-review/SKILL.md — fan-out templates with merge protocols

Layer 3 (Hook):
  No hook needed — parallelism is orchestrator-managed

Layer 4 (Agent):
  agents/council-coordinator.md fans out to N agents, collects results,
  runs structured aggregation (not ad-hoc concatenation)
```

**Template — Parallel Review with Structured Merge**:
```yaml
parallel:
  fan_out:
    - agent: security-reviewer
      model: sonnet
      prompt: "Review for OWASP Top 10, secrets exposure, injection risks"
      output: { findings: Finding[], severity: 'critical'|'high'|'medium'|'low' }
    - agent: performance-reviewer
      model: sonnet
      prompt: "Review for N+1 queries, memory leaks, bundle size, algorithmic complexity"
      output: { findings: Finding[], impact: 'blocking'|'degraded'|'minor' }
    - agent: style-reviewer
      model: haiku
      prompt: "Review for naming conventions, dead code, consistency with existing patterns"
      output: { findings: Finding[], category: 'style'|'consistency'|'cleanup' }
  merge:
    strategy: structured_aggregation  # not concatenation
    dedup: true  # remove duplicate findings across agents
    rank_by: severity_then_confidence
    output: { findings: Finding[], summary: string, score: 0-100 }
```

### 4. Evaluator-Optimizer Loop
A generator produces output; an evaluator scores it; the generator refines based on feedback.
Repeat until quality threshold is met or max iterations reached.

**When to use**: Output quality matters more than speed. Code generation, configuration authoring,
prompt engineering.

**4-Layer Implementation**:
```
Layer 1 (CLAUDE.md):
  "Generated configs must pass the evaluator with score >= 80 before committing"

Layer 2 (Skill):
  skills/agentic-patterns/SKILL.md (this file) — loop template

Layer 3 (Hook):
  PreToolUse hook on Write/Edit can trigger evaluation before file save

Layer 4 (Agent):
  agents/evaluator-optimizer.md — runs the generate→evaluate→refine cycle
```

**Template — Eval-Optimize Loop**:
```yaml
evaluator_optimizer:
  max_iterations: 3
  quality_threshold: 80  # 0-100 score
  generator:
    model: sonnet
    prompt: "Generate {artifact} meeting these requirements: {spec}"
    output: { artifact: string, reasoning: string }
  evaluator:
    model: opus  # evaluator should be at least as capable as generator
    rubric:
      - correctness: "Does the output meet all requirements?"
      - completeness: "Are edge cases handled?"
      - style: "Does it follow project conventions?"
      - safety: "Are there security concerns?"
    output: { score: 0-100, pass: boolean, critique: string[], suggestions: string[] }
  refine:
    input: { original: $generator.output, critique: $evaluator.output }
    prompt: "Revise the artifact addressing each critique point. Do not regress on passing criteria."
  on_pass: commit
  on_max_iterations: present_best_with_warnings
```

### 5. Orchestrator-Workers
A central orchestrator dynamically breaks work into subtasks and delegates to workers.
Unlike parallelization, the orchestrator decides what to delegate at runtime.

**When to use**: Task decomposition isn't known upfront — the orchestrator must reason about
what workers are needed.

**4-Layer Implementation**:
```
Layer 1 (CLAUDE.md):
  "For complex features, use orchestrator-workers pattern via /cc-orchestrate"

Layer 2 (Skill):
  skills/agent-teams/SKILL.md — team topology patterns

Layer 3 (Hook):
  PostToolUse hook on Agent tracks worker results for the orchestrator

Layer 4 (Agent):
  agents/team-orchestrator.md — dynamic delegation with result synthesis
```

**Template — Dynamic Orchestrator**:
```yaml
orchestrator_workers:
  orchestrator:
    model: opus
    system: |
      You are a lead engineer. Analyze the task, decompose it into subtasks,
      and delegate each to the most appropriate worker. After all workers report,
      synthesize a final result. You may spawn additional workers if gaps emerge.
    tools: [Agent, Read, Grep, Glob, TodoWrite]
  workers:
    available:
      - name: implementer
        model: sonnet
        specialty: "Write code changes"
      - name: tester
        model: sonnet
        specialty: "Write and run tests"
      - name: reviewer
        model: sonnet
        specialty: "Review code for bugs and style"
      - name: researcher
        model: haiku
        specialty: "Look up docs, search codebase, find examples"
    spawn_policy: on_demand  # orchestrator decides which workers to use
  coordination:
    shared_state: todo_list  # workers update shared TodoWrite
    max_workers: 5
    timeout_per_worker: 120s
```

---

## Part 2: Agent Patterns (LLM-Directed)

### 6. Reflection (Self-Critique)
Agent reviews its own output before presenting it. The simplest agent pattern.

**When to use**: Any code generation or analysis where a second look catches errors.

**4-Layer Implementation**:
```
Layer 3 (Hook):
  PostToolUse hook on Write/Edit triggers a self-review pass

Layer 4 (Agent):
  agents/audit-reviewer.md — second-round review agent
```

**Template — Self-Review Loop**:
```yaml
reflection:
  generate:
    prompt: "Solve this problem: {task}"
  self_review:
    prompt: |
      Review your solution. Check for:
      1. Off-by-one errors
      2. Unhandled edge cases (null, empty, boundary values)
      3. Missing error handling at system boundaries
      4. Inconsistency with existing code patterns
      Return: { issues: string[], revised: string | null }
  policy:
    if_issues_found: revise_and_present  # auto-fix before showing user
    max_revisions: 2
```

### 7. ReAct Planning (Thought → Action → Observation)
Agent explicitly reasons before acting, observes the result, then reasons again.

**When to use**: Debugging, investigation, any task where the next step depends on what you learn.

**Template — ReAct Cycle**:
```yaml
react:
  system: |
    For each step, follow this cycle:
    THOUGHT: What do I know? What do I need to find out? What's my hypothesis?
    ACTION: Execute one tool call to test the hypothesis.
    OBSERVATION: What did I learn? Does it confirm or refute my hypothesis?
    Repeat until the task is complete or you need human input.
  trace_log: .claude/traces/{task_id}.jsonl  # auditable reasoning trail
  max_cycles: 20
  escalation: ask_human  # if stuck after max_cycles
```

### 8. Multi-Agent with Shared Blackboard
Multiple specialized agents work on a shared problem, reading and writing to a common
state store (the "blackboard"). Agents can see each other's findings in real-time.

**When to use**: Cross-domain analysis where findings in one area inform another
(e.g., security finding reveals performance issue).

**Template — Blackboard Protocol**:
```yaml
blackboard:
  store: .claude/blackboard/{session_id}.json
  schema:
    findings: Finding[]
    open_questions: Question[]
    conflicts: Conflict[]
    decisions: Decision[]
  agents:
    - role: security-analyst
      reads: [findings, open_questions]
      writes: [findings, open_questions, conflicts]
    - role: performance-analyst
      reads: [findings, open_questions]
      writes: [findings, open_questions]
    - role: architect
      reads: [findings, conflicts, open_questions]
      writes: [decisions, findings]
  protocol:
    1. Each agent reads blackboard before starting
    2. Agents write findings as they discover them
    3. If agent A's finding conflicts with agent B's, write to conflicts[]
    4. Architect resolves conflicts and writes decisions[]
    5. All agents re-read decisions before finalizing
  merge: architect_synthesizes
```

---

## Part 3: Supporting Patterns

### 9. Guardrails (Pre/Post Execution)
Hard limits on what agents can do. Implemented as hooks, not agents.

**4-Layer Implementation**:
```
Layer 3 (Hook — this is the primary layer):
  PreToolUse on Bash:
    - Block destructive commands (rm -rf, DROP TABLE, git push --force)
    - Block secret exposure (echo $API_KEY)
    - Enforce path scoping (no writes outside project root)
  PreToolUse on Write/Edit:
    - Block writes to .env, credentials.json, *.pem
    - Enforce file size limits
  PostToolUse on Bash:
    - Scan output for leaked secrets
```

### 10. Human-in-the-Loop (HITL) Checkpoints
Pause execution at defined points for human approval.

**Template — HITL Gates**:
```yaml
hitl:
  gates:
    - trigger: before_commit
      summary: "Show diff summary, ask for approval"
      timeout: 300s  # auto-cancel if no response
    - trigger: before_deploy
      summary: "Show deployment plan, target environment, rollback strategy"
      requires: explicit_yes
    - trigger: on_conflict
      summary: "Multiple agents disagree — present options to human"
      present: { options: ConflictResolution[], recommendation: string }
  resume: from_checkpoint  # don't restart, resume where paused
```

### 11. Exception Handling & Recovery
Structured error classification and recovery strategies.

**Template — Error Recovery**:
```yaml
exception_handling:
  classify:
    transient: [timeout, rate_limit, network_error]
    permanent: [file_not_found, permission_denied, invalid_syntax]
    ambiguous: [exit_code_1, empty_output]
  strategies:
    transient: retry_with_backoff(max=3, base=2s)
    permanent: escalate_to_human
    ambiguous: try_alternative_approach
  fallback_chain:
    - primary: Bash("npm test")
    - fallback_1: Bash("npx jest --no-coverage")
    - fallback_2: Bash("node --test")
    - final: report_failure_with_context
```

### 12. Memory & Feedback Loops
Cross-session learning through structured memory persistence.

**4-Layer Implementation**:
```
Layer 1 (CLAUDE.md):
  rules/lessons-learned.md — auto-growing error/fix knowledge base

Layer 3 (Hook):
  PostToolUseFailure → captures error to lessons-learned.md
  SessionStart → loads lessons-learned.md as context

Layer 2 (Skill):
  skills/self-healing-advanced/SKILL.md — pattern detection, rule promotion
  skills/memory-instructions/SKILL.md — 3-tier memory architecture
```

**Feedback Loop**:
```
Agent produces output
    → Evaluator scores output
    → Score logged to .claude/eval-log/{date}.jsonl
    → Weekly: aggregation detects patterns (3+ similar low scores)
    → Pattern promoted to .claude/rules/ as permanent rule
    → Future sessions apply rule automatically
```

### 13. Resource-Aware Optimization
Dynamic model/agent selection based on remaining budget.

**Template — Budget-Aware Routing**:
```yaml
resource_aware:
  budget:
    max_tokens: 500000
    max_cost: $2.00
  checkpoints:
    - at: 25%_remaining
      action: downgrade_all_agents_to_haiku
    - at: 10%_remaining
      action: complete_current_task_only
    - at: 5%_remaining
      action: save_state_and_stop
  dynamic_routing:
    if budget > 75%: use_optimal_model_per_task
    if budget 25-75%: prefer_sonnet_over_opus
    if budget < 25%: haiku_only
```

---

## Part 4: Pattern Selection Decision Tree

```
Is the task decomposable into known steps?
├── YES → Is it sequential?
│   ├── YES → Prompt Chaining (#1)
│   └── NO → Are subtasks independent?
│       ├── YES → Parallelization (#3)
│       └── NO → Orchestrator-Workers (#5)
├── PARTIALLY → Do you know the first step but not the rest?
│   └── YES → ReAct Planning (#7)
└── NO → Is quality critical?
    ├── YES → Evaluator-Optimizer Loop (#4)
    └── NO → Single agent with Reflection (#6)

Do multiple domains need to coordinate?
├── YES → Multi-Agent with Blackboard (#8)
└── NO → Single agent or simple chain

Does input vary widely in type/complexity?
├── YES → Routing (#2)
└── NO → Direct to appropriate pattern
```

## Part 5: Anti-Patterns (What NOT to Do)

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| **Agent for everything** | 25x cost increase, token waste | Start with simplest workflow, escalate only when needed |
| **No evaluation** | Garbage in, garbage out across chain | Add evaluator at every handoff point |
| **Concatenation as merge** | Duplicate findings, no ranking | Use structured aggregation with dedup |
| **Same model everywhere** | Overpaying for simple tasks | Route: haiku for lookup, sonnet for impl, opus for arch |
| **Infinite loops** | Agent retries forever on permanent errors | Max iterations + error classification |
| **Monolithic agent** | Context overflow on complex tasks | Decompose into chain or orchestrator-workers |
| **No HITL gates** | Destructive action without approval | Add gates before commits, deploys, destructive ops |

## Quick Reference: Pattern → 4-Layer Mapping

| Pattern | L1 CLAUDE.md | L2 Skill | L3 Hook | L4 Agent |
|---------|-------------|----------|---------|----------|
| Prompt Chaining | Chain order | `deep-code-intelligence` | `chain-validator` | `principal-engineer-strategist` |
| Routing | Complexity rules | `model-routing` | PreToolUse check | (function, not agent) |
| Parallelization | Review protocol | `council-review` | — | `council-coordinator` |
| Eval-Optimizer | Quality threshold | (this skill) | PreToolUse on Write | `evaluator-optimizer` |
| Orchestrator-Workers | Delegation rules | `agent-teams` | PostToolUse tracking | `team-orchestrator` |
| Reflection | — | `self-healing-advanced` | PostToolUse review | `audit-reviewer` |
| ReAct Planning | — | `deep-code-intelligence` | — | `principal-engineer-strategist` |
| Blackboard | — | `council-review` | — | `council-coordinator` |
| Guardrails | Forbidden ops | `enterprise-security` | Pre/PostToolUse | — |
| HITL | Approval gates | — | PreToolUse prompt | — |
| Exception Handling | — | `self-healing-advanced` | PostToolUseFailure | `claude-code-debugger` |
| Memory/Feedback | lessons-learned | `memory-instructions` | SessionStart/Failure | — |
| Resource-Aware | Budget rules | `cost-optimization` | — | — |

## References
- Ng, A. (2024). "Agentic Design Patterns" — four foundational patterns.
- Anthropic (2024). "Building Effective Agents" — workflow vs agent taxonomy.
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. O'Reilly Media.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
- Related: `skills/model-routing/SKILL.md`, `skills/council-review/SKILL.md`
- Related: `skills/agent-teams/SKILL.md`, `skills/deep-code-intelligence/SKILL.md`
