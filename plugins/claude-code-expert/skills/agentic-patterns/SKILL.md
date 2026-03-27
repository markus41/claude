# Agentic Design Patterns — Claude Code Expert

> Patterns from "Agentic Design Patterns" (Gulli & Sauco, 2025) applied to Claude Code development workflows, plugin architecture, and multi-agent orchestration.

## Applied Patterns

### 1. Prompt Chaining
**Relevance**: The backbone of sequential reasoning in Claude Code tasks — each output becomes the next prompt's context.
**Current Implementation**: `cc-intel` uses a 4-step chain: repo fingerprinting → gap analysis → evidence-driven planning → implementation scaffold. Hook scripts chain bash → JSON output → Claude interpretation.
**Enhancement**: Add explicit handoff objects between chain links (typed PromptChainResult interfaces) so each step's output is machine-readable and verifiable before passing forward.

### 2. Routing
**Relevance**: Claude Code must route requests to the right model, agent, or skill — wasting Opus on trivial tasks burns budget.
**Current Implementation**: `cc-orchestrate` and the model-routing skill implement cost/capability tiering: haiku for research, sonnet for implementation, opus for architecture. The `/model` command applies intent-based routing.
**Enhancement**: Formalize a routing schema — `{ intent, complexity, costBudget, latencyTarget }` — so every agent invocation passes through a deterministic routing function before selecting model or sub-agent.

### 3. Parallelization
**Relevance**: Multi-agent review councils, CI/CD pipeline analysis, and codebase scanning are all embarrassingly parallel.
**Current Implementation**: `cc-orchestrate` templates (qa-swarm, research-council, pr-review-board) fan out to parallel agents. The `cc-intel` deep scan fans out per-module analysis.
**Enhancement**: Add a join/reduce step that explicitly waits for all parallel branches and merges results through a structured aggregation agent rather than ad-hoc concatenation.

### 4. Reflection
**Relevance**: Code review loops, self-healing diagnostics, and audit scoring all require iterative self-improvement.
**Current Implementation**: The `audit-loop` skill runs repeated quality checks; `cc-troubleshoot` reflects on its own diagnosis; lessons-learned capture creates a session-level reflection log.
**Enhancement**: Implement a formal Reflector agent that receives any code output, scores it against a rubric, and returns structured `{ pass: bool, critique: string[], revisedOutput: string }` — enabling automatic retry loops.

### 5. Planning
**Relevance**: Before writing a single line, Claude Code must decompose complex tasks into an executable plan.
**Current Implementation**: `evidence-driven-planning` skill generates step-by-step plans with dependency graphs. `cc-setup` produces a 0-100 audit score and a remediation roadmap.
**Enhancement**: Adopt ReAct-style planning with explicit Thought → Action → Observation cycles, logging each cycle to a plan trace file so humans can audit the reasoning path.

### 6. Multi-Agent
**Relevance**: Complex Claude Code tasks — security audits, PR reviews, architecture migrations — exceed single-agent capacity and benefit from specialization.
**Current Implementation**: 16 specialized agents (principal-engineer-strategist, security-auditor, performance-profiler, etc.) can be assembled into councils via `cc-orchestrate`.
**Enhancement**: Implement a shared blackboard for inter-agent state (current findings, open questions, conflict flags) so agents can read each other's outputs mid-task rather than only receiving the orchestrator's summary.

### 7. Memory Management
**Relevance**: Claude Code sessions are ephemeral; cross-session context (lessons learned, repo fingerprints, past decisions) must be explicitly persisted and retrieved.
**Current Implementation**: `cc-memory` implements a 3-tier system: Tier 1 (rules/CLAUDE.md), Tier 2 (auto-memory files), Tier 3 (MCP semantic memory). Lessons-learned.md auto-grows via hooks.
**Enhancement**: Add memory decay and relevance scoring — stale memories that haven't been accessed in N sessions get archived, preventing context bloat. Implement a memory-retrieval agent that selects only relevant memories for each new task.

### 8. Guardrails
**Relevance**: Autonomous Claude Code agents editing production configs, committing code, or running bash commands need hard limits.
**Current Implementation**: The `enterprise-security` skill and `settings.json` permissions model define allowed tools. The security-guard hook validates operations before execution.
**Enhancement**: Add a pre-execution guardrail agent that evaluates any proposed bash command or file write against a policy engine (path scope, command allowlist, secret detection) and either approves, modifies, or blocks the action.

### 9. Evaluation and Monitoring
**Relevance**: Agent outputs — generated code, plans, configurations — must be measurable for quality, correctness, and drift.
**Current Implementation**: `cc-setup` generates audit scores; `session-analytics` tracks cost/token metrics; `cc-intel` produces quality signals per module.
**Enhancement**: Implement a continuous evaluation loop: after each agent action, an Evaluator agent scores the output (correctness, safety, style compliance) and logs to a structured eval log. Surface aggregate scores in the `/cc-status` dashboard.

### 10. Human-in-the-Loop (HITL)
**Relevance**: High-stakes operations (force push, production deploy, destructive refactors) require human approval before execution.
**Current Implementation**: The git-workflow rules prevent dangerous operations. `cc-orchestrate` builder-validator template pauses for review. Settings.json permission prompts are HITL checkpoints.
**Enhancement**: Add explicit HITL pause points in long-running orchestrations — serialize the current agent state, present a summary to the user, and resume only on explicit confirmation. Support async approval via a webhook or CLI prompt.

### 11. Exception Handling
**Relevance**: Agents fail — tools timeout, APIs error, bash commands exit non-zero. Robust agents must recover gracefully.
**Current Implementation**: The self-healing protocol (PostToolUseFailure hook → lessons-learned capture → fix) provides session-level exception handling. `cc-troubleshoot` diagnoses hook and tool failures.
**Enhancement**: Build a structured ExceptionHandler agent that receives any tool failure, classifies it (transient/permanent, tool/logic/permission), and selects a recovery strategy (retry, fallback tool, escalate to human).

### 12. Exploration
**Relevance**: Discovering the best approach to a new codebase, architecture pattern, or library requires structured exploration rather than guessing.
**Current Implementation**: `cc-intel` uses repo-fingerprinting to discover tech stack and patterns. The research-routing skill directs exploratory queries to Perplexity/Context7.
**Enhancement**: Implement a Monte Carlo Tree Search-inspired exploration pattern: try multiple approaches in parallel, score each with the Evaluator, and commit to the highest-scoring branch.

### 13. A2A Communication
**Relevance**: Agents in a council must exchange findings, delegate sub-tasks, and signal completion without going through the human.
**Current Implementation**: Agents in `cc-orchestrate` templates communicate via shared output files and the orchestrator's message bus. The MCP server exposes agent state as queryable tools.
**Enhancement**: Adopt a formal A2A message schema `{ from, to, type: 'delegate'|'inform'|'query'|'ack', payload }` and route all inter-agent messages through a message broker agent. Log all A2A traffic for auditability.

### 14. Resource-Aware Optimization
**Relevance**: Token budgets, API rate limits, and cost ceilings constrain what agents can do — plans must adapt to available resources.
**Current Implementation**: `cc-budget` tracks token spend per session; model-routing selects cheaper models for low-complexity tasks; context-budgeting skill manages window usage.
**Enhancement**: Implement a Resource Monitor that tracks real-time token/cost spend against the session budget and dynamically adjusts agent model selection, output verbosity, and parallelism level to stay within budget.

### 15. Prioritization
**Relevance**: When multiple tasks or issues compete for agent attention, a principled prioritization scheme prevents thrashing.
**Current Implementation**: `cc-orchestrate` templates define agent execution order. The `evidence-driven-planning` skill ranks implementation steps by dependency and risk.
**Enhancement**: Add a Priority Queue agent that scores pending tasks by `urgency × impact ÷ effort` and feeds them to executors in ranked order, re-scoring dynamically as new information arrives.

### 16. Goal Setting
**Relevance**: Agents without explicit, measurable goals drift. Goals frame what "done" looks like and enable progress tracking.
**Current Implementation**: `cc-setup` generates a configuration goal (0-100 score) with explicit targets. `cc-orchestrate` templates define team goals per template.
**Enhancement**: Formalize a Goal object `{ description, successCriteria: string[], metric: fn, deadline }` at orchestration start. The Evaluator checks progress against successCriteria after each agent turn.

### 17. Reasoning Techniques
**Relevance**: Different problems require different reasoning modes — chain-of-thought for logic, tree-of-thought for exploration, analogical for pattern matching.
**Current Implementation**: The `deep-code-intelligence` skill applies structured reasoning to code analysis. The `council-review` skill uses multi-perspective critique.
**Enhancement**: Tag each task with a reasoning mode at routing time. Chain-of-thought for debugging, tree-of-thought for architecture decisions, analogical for library selection. Pass the reasoning mode hint in the system prompt.

### 18. Feedback Loops
**Relevance**: Continuous improvement requires closing the loop between output quality and future behavior.
**Current Implementation**: The self-healing protocol is a manual feedback loop — errors are captured and inform future sessions. Lessons-learned.md is the feedback store.
**Enhancement**: Automate the feedback loop: Evaluator scores → stored in structured eval log → weekly aggregation agent identifies patterns → proposes new rules for `.claude/rules/` → human approves → rules auto-deploy.

### 19. Probabilistic Reasoning
**Relevance**: Code risk estimation, security vulnerability severity, and performance impact are inherently probabilistic.
**Current Implementation**: `cc-intel` produces qualitative risk signals. The security skill classifies vulnerabilities by severity.
**Enhancement**: Add confidence scores to all agent outputs — `{ finding, confidence: 0-1, evidence: string[] }`. The aggregation layer weights high-confidence findings more heavily in final reports.

### 20. Causal Reasoning
**Relevance**: Root cause analysis, performance regression investigation, and bug triage require understanding cause-effect chains, not just correlation.
**Current Implementation**: `cc-troubleshoot` traces error chains. `root-cause-analysis` skill applies 5-why methodology.
**Enhancement**: Build a Causal Graph agent that constructs an explicit DAG of cause-effect relationships from logs, test failures, and code changes — enabling counterfactual analysis ("if we revert X, does Y go away?").

### 21. Analogical Reasoning
**Relevance**: Recognizing that a new problem matches a known pattern (e.g., "this is the Observer pattern") speeds solution selection.
**Current Implementation**: The `deep-code-intelligence` skill recognizes architectural patterns in code. The `repo-fingerprinting` skill identifies tech stack patterns.
**Enhancement**: Maintain a pattern library (design patterns, anti-patterns, common failure modes) as a vector store. When analyzing code, retrieve the top-3 analogous patterns and present them with similarity scores to guide the solution approach.

## Pattern Interaction Map

```
User Request
    │
    ▼
[Routing] ──────────────────────────────────────────────────────┐
    │                                                            │
    ▼                                                            ▼
[Goal Setting] ← [Prioritization]                    [Resource-Aware Optimization]
    │                                                            │
    ▼                                                            │
[Planning] ← [Reasoning Techniques]                             │
    │                 │                                          │
    ├─────────────────┘                                          │
    ▼                                                            │
[Parallelization] ──→ [Multi-Agent] ←── [A2A Communication]    │
    │                      │                                     │
    │                      ▼                                     │
    │              [Memory Management] ←─────────────────────────┘
    │                      │
    ▼                      ▼
[Prompt Chaining] → [Reflection] ←── [Guardrails]
    │                      │
    ▼                      ▼
[Exception Handling] → [Evaluation & Monitoring]
    │                      │
    ▼                      ▼
[HITL] ←────── [Feedback Loops] ──→ [Exploration]
                       │
              [Probabilistic Reasoning]
              [Causal Reasoning]
              [Analogical Reasoning]
```

### Key Synergies
- **Routing + Resource-Aware Optimization**: Route to cheaper models when budget is tight
- **Planning + Reflection**: Reflect after each plan step to catch errors early
- **Multi-Agent + A2A + Memory**: Agents share findings via blackboard, persisted across sessions
- **Guardrails + HITL**: Guardrails handle automatic rejections; HITL handles ambiguous cases
- **Evaluation + Feedback Loops**: Continuous scoring feeds the improvement cycle

## Quick Reference: Pattern → Command Mapping

| Pattern | Primary Command | Supporting Skill |
|---------|-----------------|-----------------|
| Prompt Chaining | `/cc-intel` | `deep-code-intelligence` |
| Routing | `/model` | `model-routing` |
| Parallelization | `/cc-orchestrate` | `council-review` |
| Reflection | `/cc-troubleshoot` | `audit-loop` |
| Planning | `/cc-setup` | `evidence-driven-planning` |
| Multi-Agent | `/cc-orchestrate` | `agent-teams` |
| Memory | `/cc-memory` | `cc-memory` |
| Guardrails | `/cc-hooks` | `enterprise-security` |
| Evaluation | `/cc-intel` | `session-analytics` |
| HITL | `/cc-orchestrate` | `builder-validator` |
| Exception Handling | `/cc-troubleshoot` | `self-healing` |
| Exploration | `/cc-intel` | `research-routing` |
| A2A Communication | `/cc-orchestrate` | `multi-agent-review` |
| Resource Optimization | `/cc-budget` | `context-budgeting` |
| Prioritization | `/cc-orchestrate` | `evidence-driven-planning` |
| Goal Setting | `/cc-setup` | `audit-loop` |
| Reasoning Techniques | `/cc-intel` | `deep-code-intelligence` |
| Feedback Loops | hooks (auto) | `self-healing` |
| Probabilistic Reasoning | `/cc-intel` | `root-cause-analysis` |
| Causal Reasoning | `/cc-troubleshoot` | `root-cause-analysis` |
| Analogical Reasoning | `/cc-intel` | `repo-fingerprinting` |

## References
- Gulli, A. & Sauco, M. (2025). *Agentic Design Patterns*. O'Reilly Media.
- Repository: github.com/Mathews-Tom/Agentic-Design-Patterns
- Claude Code SDK Docs: docs.anthropic.com/claude-code
- Related Skill: `skills/model-routing/SKILL.md`
- Related Skill: `skills/council-review/SKILL.md`
- Related Skill: `skills/research-routing/SKILL.md`
