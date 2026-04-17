---
name: prompt-engineering
description: Crafting effective prompts, CLAUDE.md instructions, rules, agent system prompts, and skill bodies for optimal Claude Code behavior
allowed-tools:
  - Read
  - Glob
  - Grep
triggers:
  - prompt engineering
  - write better prompts
  - claude.md writing
  - effective instructions
  - prompt template
  - agent prompt
  - rule writing
---

# Prompt Engineering Skill

You help users write instructions that Claude Code follows reliably. Your focus is turning vague intent into precise, actionable directives.

## Goal

Enable users to craft system prompts, CLAUDE.md files, rules, agent directives, and skill bodies that consistently produce the desired behavior. Strong prompts reduce misunderstandings, increase adherence, and make cross-session knowledge transfer possible.

## Why Prompt Clarity Matters

Claude Code reads instructions at multiple levels:
- **CLAUDE.md** — Project-wide workflow and tooling guide (200 lines, stable)
- **Rules** — Path-scoped behavioral constraints (short, actionable, domain-specific)
- **Agent system prompts** — Role definition and mandatory workflow (50-150 lines)
- **Skill bodies** — Reusable workflows with concrete examples (80-200 lines)
- **Task-level instructions** — One-shot guidance for a specific session

Ambiguous instructions lead to repeated misunderstandings. Precise instructions compound across sessions into reliable behavior.

## CLAUDE.md Writing Best Practices

CLAUDE.md is the stable, long-term reference. It should be boring and reliable.

**Keep it under 200 lines per file.** If you need more, split into `.claude/rules/`.

**Use markdown headers and bullets for visual hierarchy.** Avoid walls of prose.

**Write concrete, verifiable instructions.** Not "Format code properly" but "Use 2-space indentation for YAML, 4-space for Python."

**Use imperative mood.** "Run tests before committing" not "Tests should be run."

**Avoid contradictions.** Review all CLAUDE.md and rules files periodically. If two files say opposite things, merge or clarify.

**Use @path imports for large reference material.** Example: `@.claude/rules/code-style.md` loads that file inline.

**Split large workflow guides into `.claude/rules/`.** CLAUDE.md is your workflow summary; rules are your enforcement.

**Timestamp key decisions.** If you record that "We use Sonnet for most tasks, Opus for architecture" add a date. That helps future sessions know if a decision is stale.

Example CLAUDE.md structure:

```markdown
# Project Name

## Workflow
- When to use which agent/model
- Standard tool order
- When to use orchestration vs single-agent

## Build & Test
- Install: `pnpm install`
- Test: `npm test`

## Key Rules
1. Commit messages: `type(scope): description`
2. No `git add -A` — specific files only
3. Type check before pushing

## Models
| Task | Model | Why |
|------|-------|-----|
| Research | haiku | Fast lookups, cost-efficient |
| Implementation | sonnet | Balance of speed and quality |
| Architecture | opus | Deep reasoning for big decisions |

## When to Use This Plugin
- Need to understand repo structure
- Need multi-agent review or orchestration
```

## Rule File Design

Rules are short, actionable, domain-specific. They are injected as system instructions when Claude Code is working on matching files.

**When to use rules vs CLAUDE.md vs skills:**
- **CLAUDE.md** — Workflow, tooling, when to call which agent
- **Rules** — Constraints that must always apply (code style, git workflow, testing requirements)
- **Skills** — Reusable workflows users can call on demand

**Path scoping with frontmatter.** Add a `paths:` field to apply a rule only to certain files:

```yaml
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
```

This rule only activates when Claude is editing TypeScript files.

**Glob pattern reference:**
- `**/*.ts` — Any .ts file in any directory
- `src/**/*` — Anything under src/
- `*.md` — Markdown files in current directory
- `**/tests/**` — Anything under a tests/ directory

**Keep rules short and actionable.** If a rule is longer than 50 lines, you are writing documentation, not a rule. Move it to a skill or agent prompt.

**One topic per file.** Use descriptive filenames: `code-style.md`, `git-workflow.md`, `docker-k8s.md`.

**Avoid contradictions between rules and CLAUDE.md.** The rules are injected on top of CLAUDE.md, so both are active. If they conflict, the last injected instruction wins, but that is confusing.

## Agent System Prompt Design

Agent prompts are role definitions plus mandatory workflows. They fit in 50-150 lines.

**Start with role and specialization.** "You are an expert in Go backend architecture with deep knowledge of gRPC, database optimization, and observability."

**Define mandatory workflow steps.** Not suggestions — steps the agent must follow:
```
1. Analyze the codebase for existing patterns
2. Build an evidence table (file path, pattern, decision)
3. Propose 3+ options with tradeoff analysis
4. Recommend one option with rollback path
5. Output a markdown summary and a code diff
```

**Specify what to output.** "Deliver your answer as: (1) a markdown table comparing approaches, (2) your recommendation with one-line rationale, (3) a code snippet showing the change."

**Include anti-patterns and constraints.** "Do not suggest a rewrite without first profiling. Do not skip migration scripts. Do not assume Redis is available."

**Set tools list to minimum required.** More tools = more wrong decisions. If an agent only needs Read and Grep, do not give it Write.

**Match model to task complexity.** Use haiku for lookups, sonnet for implementation, opus for architecture tradeoffs.

Example agent system prompt:

```yaml
---
name: schema-refactor-agent
description: Proposes database schema migrations with data transformation strategy
tools:
  - Read
  - Grep
  - Bash
model: claude-sonnet-4-6
---

# Schema Refactor Agent

You are an expert database schema architect. Your role is to propose schema migrations that minimize downtime and data loss.

## Mandatory Workflow

1. Identify all tables, indexes, and constraints affected by the requested change
2. Find all code that uses those tables (queries, ORM models, stored procedures)
3. Build a migration plan with three phases: (1) add new column/table, (2) migrate data, (3) deprecate old column/table
4. Specify rollback for each phase
5. Output: markdown summary, SQL migration file, rollback SQL file, evidence table of affected code

## Constraints

- Do not propose blocking migrations without explicit approval
- Assume the database has 1M+ rows; test any migration on large datasets
- Always include a dry-run flag in migration scripts
- Do not drop columns without 2 weeks of deprecation warning
```

## Skill Body Writing

Skills are user-callable, reusable workflows. They have a Goal, structured steps, examples, and cross-references.

**Clear Goal section.** One sentence: "Guide users through creating a custom agent for a specific task."

**Structured workflow with numbered steps.** Each step should be clear enough that someone could follow it:

```markdown
## Workflow

1. **Identify the task specialization.** Is this agent for code review? Architecture? Testing? Performance optimization? The specialization determines the mandatory workflow and tool list.

2. **Define the system prompt.** Write a role statement, mandatory workflow, and tool constraints (see Agent System Prompt Design above).

3. **Test the agent on a sample task.** Create a test task and run it through the agent twice to ensure the output is consistent.

4. **Capture lessons in the prompt.** If the agent made a wrong decision, update the system prompt with an anti-pattern constraint.

5. **Document the agent in .claude/agents/.** Use the same format as built-in agents.
```

**Concrete examples at each step.** Do not say "write a prompt" — show a prompt. Do not say "test it" — show what testing looks like.

**Cross-references to related skills.** "See Skill: Agent Lifecycle Management for how to hook up agent startup and shutdown."

**Triggers that match user intent language.** If a user says "write a prompt" or "make better instructions," that should trigger this skill.

## Task Prompting Patterns

When guiding Claude on a one-shot task (not a reusable rule or skill), use these patterns:

**Structured decomposition.** Break complex requests into steps:
- What is the input?
- What transformations should happen?
- What is the output format?
- What is success criteria?

Example:
```
Task: Audit code for security vulnerabilities

Input: src/ directory with TypeScript backend code
Steps:
  1. Find all HTTP handlers and check for input validation
  2. Find all database queries and check for SQL injection protection
  3. Find all auth checks and verify they cover all endpoints
  4. Find all secrets usage and verify they use environment variables, not hardcoded
Output: Markdown report with findings, severity, and fix suggestion for each
Success: All findings are real security issues (no false positives), fixes are actionable
```

**Explicit constraints.** State what NOT to do:
```
Do not:
- Suggest refactors unless they fix the security issue
- Report missing error handling as a security issue (that is a separate audit)
- Suggest using an external library unless absolutely necessary
```

**Success criteria.** Define what "done" looks like:
```
Done when:
- All critical vulnerabilities are identified and documented
- Each finding includes: file path, line number, risk description, fix code
- Report is under 200 lines (focus on real issues)
- At least one finding is verified with a code example
```

**Context provision.** Give Claude relevant file paths and background:
```
Background: This is a payment processing microservice. It handles credit card data and must comply with PCI-DSS. Auth is OAuth2 via an internal service. Database is PostgreSQL with parameterized queries.

Focus: Payment endpoints (/api/pay/*), webhook handlers (/webhooks/*), and credential storage
```

**Output format specification.** Be explicit:
```
Output format:
| Finding | File | Line | Severity | Fix |
|---------|------|------|----------|-----|
| ... | ... | ... | CRITICAL/HIGH/MED | ... |

Then append a "Test Plan" section with commands to verify each fix.
```

## Extended Thinking Triggers

Claude can reason at three depths. Use the right depth for the task.

**"Think step by step"** — Basic reasoning chain. Use for:
- Logic puzzles, tracing through code flow
- Debugging where the issue is non-obvious
- Evaluating tradeoffs between 2-3 options

**"Think hard"** — Deeper analysis. Use for:
- Architecture decisions affecting multiple services
- Root-cause debugging of production issues
- Evaluating 5+ options with complex tradeoffs

**"Ultrathink"** — Maximum reasoning depth. Use for:
- Designing a new system from scratch
- Root-cause of a multi-layer failure (e.g., race condition + cache + auth)
- Complex cost/performance optimization

Do not use extended thinking for every task. It slows down responses and is not always needed. Reserve it for work that requires genuine depth.

## Anti-Patterns to Avoid

**Vague instructions:** "Be careful" or "Handle errors properly" do not tell Claude what to do. Instead: "Wrap database calls in try-catch. Log errors with file path and line number. Do not swallow errors silently."

**Contradictory rules across files:** If CLAUDE.md says "Use Sonnet for implementation" and a rule says "Always use Opus," Claude will be confused. Decide once and document clearly.

**Over-specification that constrains useful behavior:** "Always use the simplest possible solution" prevents Claude from choosing the right tool for the job. Instead: "Prefer built-in libraries over external dependencies unless it reduces code by 50+ lines."

**Under-specification that leads to inconsistency:** "Write good tests" is ambiguous. Instead: "Each test should verify one behavior. Use descriptive names: `test_paymentProcessor_rejectsExpiredCard_returnsError`."

**Prompt bloat:** Too many instructions reduce adherence. Each instruction competes for attention. Keep CLAUDE.md and rules short. Put supporting detail in linked files.

**Embedding dynamic data in CLAUDE.md:** Do not hardcode current costs, team size, or list of services. Use auto memory or external config files. CLAUDE.md should be stable.

**Mixing levels of instruction:** CLAUDE.md should not duplicate the agent's system prompt. CLAUDE.md says "use the Architect agent for big decisions." The Architect agent says "what you do when you are an architect."

## Template Library

Use these templates as starting points for your own instructions.

### 1. Bug Fix Request Template

```markdown
# Fix [Bug Title]

## Symptom
[What the user observes]

## Expected Behavior
[What should happen instead]

## Environment
- Code: [file path, function name]
- Conditions: [what triggers the bug]
- Impact: [who is affected, severity]

## Constraints
- Do not refactor unless necessary to fix the bug
- Preserve backward compatibility
- Add a test that reproduces the bug and verifies the fix

## Success Criteria
- Bug is fixed: [specific test that now passes]
- Root cause is documented: [why the bug happened]
- Rollback path exists: [how to undo the fix if needed]
```

### 2. Feature Implementation Template

```markdown
# Implement [Feature Name]

## Goal
[One sentence: what the user can do that they cannot do now]

## Requirements
- [Specific, verifiable requirement]
- [Do not assume implementation details]

## Out of Scope
- [What is NOT included in this feature]

## Acceptance Criteria
- Feature works for [happy path scenario]
- Feature rejects invalid input [specific examples]
- Tests cover [list of scenarios]
- Documentation updated: [which files]

## Notes
- [Any constraints, dependencies, or gotchas]
```

### 3. Code Review Request Template

```markdown
# Review [Module/PR]

## What Changed
[Summary of changes]

## Focus Areas
- [Specific aspects to review: performance, security, correctness, style]

## Constraints
- Do not suggest major refactors unless they fix a real issue
- Assume the code will be maintained for 2+ years

## Output Format
| Issue | Severity | Location | Recommendation |
|-------|----------|----------|-----------------|
| ... | CRITICAL/HIGH/MED/LOW | file:line | ... |

Then append a "Commend" section for things done well.
```

### 4. Refactoring Task Template

```markdown
# Refactor [Component/Module]

## Current State
- [What exists now, why it is hard to maintain]
- [Technical debt, performance issue, design smell]

## Target State
- [How it should work after refactoring]
- [Why this is better: maintainability, performance, correctness]

## Constraints
- API must remain backward compatible
- No new dependencies
- Rollback plan required

## Success Criteria
- Tests pass: [which test suites]
- Performance: [is it faster, same speed, or acceptable tradeoff]
- Correctness: [specific scenarios to verify]
```

### 5. Architecture Decision Template

```markdown
# Decide: [Architecture Question]

## Context
- [Why this decision matters]
- [Constraints: budget, time, team skill, scale requirements]
- [Current state and why it is not working]

## Options to Evaluate
1. [Option A with brief pros/cons]
2. [Option B with brief pros/cons]
3. [Option C with brief pros/cons]

## Decision Criteria
- [What makes a good solution: performance, cost, maintainability, risk]

## Output Format
- Evidence table: [fact/measurement for each option]
- Recommendation: [option X because ...]
- Rollback: [how to undo if the decision is wrong]
- Timeline: [when to revisit this decision]
```

### 6. Research Question Template

```markdown
# Research: [Question]

## Background
[What you are building, why the answer matters]

## Specific Questions
1. [Concrete, answerable question]
2. [Not "is X good", but "what are the known tradeoffs of X"]

## Sources to Check
- [Documentation, repos, benchmarks, blog posts, papers]

## Output Format
- Summary: [1-paragraph answer]
- Findings: [table of options and key metrics]
- Recommendation: [which option and why]
- Next steps: [where to validate this in code]
```

### 7. Test Writing Template

```markdown
# Write Tests for [Module]

## Coverage Target
- Happy path: [specific scenarios]
- Error cases: [invalid input, edge cases]
- Integration: [how this module interacts with others]

## Test Naming Convention
`test_<function>_<scenario>_<expected_outcome>`

Example: `test_validateEmail_emptyString_returnsError`

## Constraints
- Test one behavior per test
- Do not mock unless absolutely necessary
- Each test should be independent

## Success Criteria
- Coverage > [X]%
- All tests pass
- Tests run in < [Y] seconds
```

### 8. Documentation Update Template

```markdown
# Update [Document Name]

## Current State
- [What is missing or unclear]
- [Who is confused, what do they not understand]

## Target State
- [Include new sections, examples, clarifications]
- [Audience: developers, users, operators]

## Content to Add
1. [Section heading and key points]
2. [Code examples, not just prose]

## Constraints
- Keep it under [X lines]
- Use existing terminology from [Y document]

## Success Criteria
- Readers can [specific task] without external help
- No ambiguous terms left undefined
```

### 9. Migration Planning Template

```markdown
# Plan Migration: [From X to Y]

## Current State
- [X details: version, scale, architecture]

## Target State
- [Y details: version, scale, architecture]

## Risk Assessment
- What can break: [specific scenarios]
- What cannot break: [non-negotiable requirements]
- Rollback feasibility: [can we go back, how long does it take]

## Migration Strategy
- Phase 1: [setup, shadow, validation]
- Phase 2: [gradual rollout, monitoring]
- Phase 3: [cutover, deprecation, cleanup]

## Success Criteria
- Performance: [target latency, throughput]
- Correctness: [specific scenarios verified]
- Safety: [rollback tested and documented]
```

### 10. Performance Investigation Template

```markdown
# Investigate: [Slow/Expensive Operation]

## Symptom
- [What is slow: latency, throughput, CPU, memory, cost]
- [Impact: how many users, how often]

## Hypotheses
1. [Likely cause A with test plan]
2. [Likely cause B with test plan]
3. [Likely cause C with test plan]

## Investigation Steps
- [Profile/measure, collect data, verify hypothesis]

## Success Criteria
- Root cause identified with evidence
- Fix proposed with expected improvement
- Rollback plan documented
```

## Common Gotchas

**Agent output differs from your intent.** Update the agent's system prompt with a constraint that prevents the wrong behavior, not just a suggestion that it should do better.

**Rules are not being applied.** Check the `paths:` frontmatter. If there is no `paths:` field, the rule applies globally. If the glob pattern does not match the file Claude is editing, the rule does not activate.

**Instructions work in one session but not the next.** Use auto memory to preserve the learnings. CLAUDE.md and rules are read once at session start; they do not evolve during a session.

**Too many instructions reduce adherence.** If CLAUDE.md is > 300 lines or you have > 15 rules, consolidate. Claude follows the first 5-7 strong instructions better than 20 weak ones.

**Contradictions between system instructions and task instructions.** Task instructions (what you say right now) override system instructions (CLAUDE.md, rules, agents). If you need an exception, state it explicitly in the task: "Normally we use Sonnet, but for this task use Opus."

---

## See Also

- **Agents:** Principal Engineer Strategist, Research Orchestrator, Council Coordinator
- **Skills:** Deep Code Intelligence, Self-Healing Advanced, Research Routing
- **Commands:** cc-setup, cc-orchestrate, cc-council
- **References:** .claude/rules/, CLAUDE.md structure, agent system prompt patterns
