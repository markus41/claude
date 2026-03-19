# Prompt Engineering for Claude Code

Write effective prompts for CLAUDE.md, agent system prompts, skill files, and slash commands.
This skill covers the patterns that maximize Claude Code output quality across all
instruction surfaces.

## The Instruction Hierarchy

Claude Code loads instructions from multiple sources. Understanding the hierarchy
determines where to put what.

```
Priority (highest to lowest):
┌──────────────────────────────────────────────┐
│ 1. System prompt (hardcoded, not editable)   │
│ 2. CLAUDE.md (project root)                  │
│ 3. .claude/CLAUDE.md                         │
│ 4. .claude/rules/*.md (matching paths)       │
│ 5. ~/.claude/CLAUDE.md (user-level)          │
│ 6. Skill SKILL.md (on activation)            │
│ 7. Agent .md system prompts                  │
│ 8. Slash command .md prompts                 │
│ 9. Conversation context                      │
└──────────────────────────────────────────────┘

Higher priority instructions override lower ones when they conflict.
```

## CLAUDE.md Prompt Patterns

### Pattern 1: Commands Over Descriptions

Claude responds better to imperative commands than passive descriptions.

```markdown
# BAD — descriptive, vague
This project uses TypeScript and prefers functional programming patterns.
We generally try to avoid mutations when possible.

# GOOD — imperative, specific
- Write all new code in TypeScript strict mode
- Use pure functions — no mutations, no side effects
- Prefer `map`, `filter`, `reduce` over `for` loops
```

### Pattern 2: Show the Build Commands

Always include exact build/test commands. Claude will use them.

```markdown
# BAD — ambiguous
Run tests before committing.

# GOOD — exact commands
## Build & Test
- Install: `pnpm install`
- Test: `pnpm test`
- Type check: `npx tsc --noEmit`
- Lint: `npx eslint . --ext .ts,.tsx`
- Single test: `pnpm test -- --grep "test name"`
```

### Pattern 3: Constraint Boundaries

Tell Claude what NOT to do. Constraints are as important as instructions.

```markdown
## Constraints
- NEVER modify files in `src/generated/` — they are auto-generated
- NEVER commit `.env` files or hardcoded secrets
- NEVER use `any` type in TypeScript — use `unknown` and narrow
- Do NOT add new dependencies without explicit approval
- Do NOT refactor code outside the scope of the current task
```

### Pattern 4: Architecture Decisions Record

Document WHY decisions were made, not just WHAT they are.

```markdown
## Architecture
- **State management**: Zustand (not Redux)
  - Why: simpler API, less boilerplate, better TypeScript inference
- **API layer**: tRPC (not REST)
  - Why: end-to-end type safety, auto-generated client
- **Database**: Prisma + PostgreSQL
  - Why: type-safe queries, migration system, connection pooling
```

### Pattern 5: Keep It Under 200 Lines

CLAUDE.md is always loaded. Every line costs context tokens.

```
Under 100 lines → Lean and focused (ideal)
100–200 lines   → Comprehensive but manageable
200–400 lines   → Getting heavy, consider moving to rules/
400+ lines      → Too large — split into .claude/rules/*.md
```

**Rule of thumb**: If an instruction only applies to certain file types, move it to
a path-scoped rule file instead of keeping it in CLAUDE.md.

## Agent System Prompt Patterns

### Pattern 1: Role + Mission + Constraints

Every agent prompt should open with a clear identity and mission.

```markdown
---
name: api-reviewer
description: Reviews API endpoint code for REST conventions, security, and performance
tools:
  - Read
  - Grep
  - Glob
model: claude-sonnet-4-6
---

# API Review Agent

You are an API review specialist. Your mission is to review API endpoint
code for REST convention compliance, security vulnerabilities, and
performance issues.

## What You Check
1. HTTP method semantics (GET is idempotent, POST creates, etc.)
2. Input validation at the controller boundary
3. Authentication/authorization middleware presence
4. Error response format consistency
5. N+1 query detection in database calls

## What You Do NOT Do
- Do not modify code — only report findings
- Do not review frontend code or tests
- Do not suggest architecture changes
```

### Pattern 2: Scope Tool Access

Restrict agent tools to what they actually need. Fewer tools = more focused agent.

```yaml
# BAD — agent has access to everything
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent

# GOOD — scoped to what a reviewer needs
tools:
  - Read     # Read code files
  - Grep     # Search for patterns
  - Glob     # Find files
```

### Pattern 3: Output Format Specification

Tell the agent exactly how to format its output.

```markdown
## Output Format

Return findings as a structured list:

### [SEVERITY] Finding Title
- **File:** path/to/file.ts:42
- **Issue:** Description of the problem
- **Fix:** Specific fix recommendation
- **Why:** Why this matters (security risk, performance impact, etc.)

Severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO
```

### Pattern 4: Model Selection Guidance

Match the model to the agent's cognitive load.

```yaml
# Simple lookups, research, documentation
model: claude-haiku-4-5

# Implementation, code review, standard analysis
model: claude-sonnet-4-6

# Architecture decisions, complex reasoning, security audits
model: claude-opus-4-6
```

## Skill SKILL.md Patterns

### Pattern 1: Lead with the Concept

Skills are loaded on activation. Start with the core concept, then details.

```markdown
# Context Anchoring System

Preserve critical information across `/compact` events, session boundaries,
and agent handoffs. Context anchoring ensures your most important rules,
decisions, and state survive compression.

## Key Concepts
[...high-level explanation...]

## Implementation
[...detailed how-to...]

## Examples
[...concrete examples...]
```

### Pattern 2: Use Diagrams for Architecture

ASCII diagrams are compact and render well in terminals.

```markdown
## Data Flow

```
Request → Middleware → Controller → Service → Repository → Database
                ↓                      ↓
            Auth Check            Validation
                ↓                      ↓
            403/401               400 + errors
```
```

### Pattern 3: Include Copy-Paste Code

Skills should include code that Claude can directly use or adapt.

```markdown
## Hook Template

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/validate-bash.sh"
      }]
    }]
  }
}
```
```

## Slash Command Prompt Patterns

### Pattern 1: Frontmatter Defines the Interface

Use YAML frontmatter for structured arguments and flags.

```yaml
---
name: my-command
intent: One-line description of what this command does
tags:
  - plugin-name
  - relevant-tag
arguments:
  - name: target
    description: What to operate on
    required: true
    type: string
flags:
  - name: dry-run
    description: Preview changes without writing
    type: boolean
    default: false
---
```

### Pattern 2: Usage Examples First

Show usage immediately after the title — users scan for examples.

```markdown
# /my-command — Short Description

## Usage
```bash
/my-command target                # Basic usage
/my-command target --dry-run      # Preview mode
/my-command target --format json  # JSON output
```
```

### Pattern 3: Implementation as Algorithm

Write the implementation section as a clear algorithm Claude can follow.

```markdown
## Implementation

When invoked:

1. **Parse arguments** — extract target, validate flags
2. **Scan** — read relevant files, build project profile
3. **Analyze** — apply checks, score results
4. **Report** — display findings in requested format
5. **Act** — if not --dry-run, apply changes
6. **Verify** — validate changes were applied correctly
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Over-Prompting

```markdown
# BAD — too much instruction, wastes context
When writing TypeScript code, always make sure to follow the TypeScript best
practices as outlined in the official TypeScript documentation. This includes
using proper types, avoiding the use of `any`, ensuring that all functions
have return types specified, and following the naming conventions that are
standard in the TypeScript community. Additionally, make sure...

# GOOD — concise, scannable
## TypeScript Rules
- Strict mode, no `any`
- All functions have explicit return types
- camelCase for variables/functions, PascalCase for types/classes
```

### Anti-Pattern 2: Conflicting Instructions

```markdown
# BAD — contradicts itself
- Keep functions under 50 lines
- Write comprehensive functions that handle all edge cases
- Avoid over-engineering

# GOOD — clear priority
- Keep functions under 50 lines
- Handle edge cases with early returns, not nested conditionals
- If a function needs more than 50 lines, extract helpers
```

### Anti-Pattern 3: Context-Wasting Boilerplate

```markdown
# BAD — tells Claude things it already knows
Claude is an AI assistant made by Anthropic. When helping with code, Claude
should write clean, readable code. Claude should follow best practices...

# GOOD — project-specific, actionable
- This monorepo uses Turborepo with pnpm workspaces
- Shared packages are in `packages/`, apps in `apps/`
- All inter-package imports use `@company/package-name`
```

### Anti-Pattern 4: Vague Quality Instructions

```markdown
# BAD — unmeasurable
Write high-quality code with good test coverage.

# GOOD — specific, measurable
- Every new function needs at least one test
- Tests use describe/it blocks with descriptive names
- Mock only external services, never internal modules
- Test the behavior, not the implementation
```

## Prompt Quality Checklist

Before finalizing any instruction file, verify:

- [ ] **Imperative mood** — commands, not descriptions
- [ ] **Specific** — exact commands, paths, patterns
- [ ] **Scoped** — each instruction applies to a clear domain
- [ ] **Non-contradictory** — no conflicting rules
- [ ] **Concise** — no filler, no boilerplate, no restating obvious things
- [ ] **Prioritized** — most important rules first
- [ ] **Testable** — can you verify compliance? ("no any" is testable, "write good code" is not)
- [ ] **Contextual** — includes WHY when the rule is not obvious
