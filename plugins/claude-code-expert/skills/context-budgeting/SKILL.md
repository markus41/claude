---
name: context-budgeting
description: Advanced context window management — token arithmetic, anchor budget math, compact strategies, progressive loading, and large codebase partitioning
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
triggers:
  - context budget
  - context window
  - token budget
  - compact strategy
  - anchor budget
  - context full
  - running out of context
  - too many tokens
---

# Context Budget Mastery

Master the art of managing Claude Code's context window for maximum productivity.

## Goal

Help users understand exactly where context is consumed, plan sessions that avoid hitting limits, and recover gracefully when context gets tight.

## Context Window Sizes

| Model | Context Window | Practical Limit |
|-------|---------------:|----------------:|
| Opus 4.6 | 200,000 tokens | ~180,000 usable |
| Sonnet 4.6 | 200,000 tokens | ~180,000 usable |
| Haiku 4.5 | 200,000 tokens | ~180,000 usable |

The ~20k overhead comes from system prompt, tool definitions, and framework messages that are always present.

## Token Arithmetic

### What consumes context

Every request to Claude includes ALL of the following:

| Component | Loaded When | Typical Size | Cached? |
|-----------|-------------|-------------:|---------|
| System prompt | Every turn | 3-5k tokens | Yes (after turn 1) |
| CLAUDE.md (all levels) | Every turn | 2-20k tokens | Yes (after turn 1) |
| Rules (unconditional) | Every turn | 1-10k tokens | Yes (after turn 1) |
| Rules (path-scoped) | When matching files opened | 0-5k tokens | Partially |
| Skill descriptions | Every turn | 1-5k tokens | Yes |
| MCP tool schemas | Every turn | 2-15k tokens | Yes |
| Conversation history | Every turn (grows) | 5-150k tokens | Partially |
| Tool results (latest) | Current turn | 0-10k tokens | No |

### The growth problem

Context grows with every turn because conversation history accumulates:
- Turn 1: ~30k (system + CLAUDE.md + rules + skills + MCP + message)
- Turn 5: ~50k (+ 4 turns of Q&A and tool calls)
- Turn 15: ~100k (+ tool outputs, file reads)
- Turn 30: ~180k (approaching limit — auto-compact triggers)

### Fixed vs. variable budget

```
Fixed overhead (always loaded):
  System prompt           ≈  4,000 tokens
  CLAUDE.md files         ≈  5,000 tokens (varies)
  Unconditional rules     ≈  3,000 tokens (varies)
  Skill descriptions      ≈  2,000 tokens (varies)
  MCP tool schemas        ≈  5,000 tokens (varies)
  ─────────────────────────────────────────────────
  Total fixed overhead    ≈ 19,000 tokens

Variable (grows with session):
  Conversation history    =  grows per turn
  Tool results            =  per tool call
  Loaded skill bodies     =  when skills activated
  Path-scoped rules       =  when matching files read
```

Your **effective working budget** = 200,000 - fixed overhead - safety margin

## Anchor Budget Math

### What are anchors?

Anchors are pieces of context you want to survive `/compact`. Without anchoring, compaction summarizes everything, potentially losing critical state.

### Calculating anchor budget

Rule of thumb: anchors should consume < 10% of your context window.

```
Context window:           200,000 tokens
Target anchor budget:      20,000 tokens (10%)
Available for conversation: 180,000 - fixed overhead
```

### What to anchor

Priority anchoring targets:
1. Current task definition and constraints
2. Key decisions made during the session
3. File paths and line numbers of changes in progress
4. Error messages being investigated
5. Architecture notes discovered during exploration

### What NOT to anchor

- File contents (can be re-read)
- Full conversation history (that's what compact summarizes)
- Tool output (can be regenerated)
- Generic instructions (already in CLAUDE.md)

## Compact Strategies

### When to compact

| Signal | Action |
|--------|--------|
| Auto-compact triggers (system message) | Let it happen, but consider manual compact first |
| Context utilization > 70% | Good time for proactive compact |
| Shifting to a new sub-task | Compact to clear old context |
| After a long research phase | Compact before implementation |
| After reading many files | Compact to summarize findings |

### Focus strings

When compacting, provide a focus to guide summarization:

```
/compact Focus on the auth middleware refactor: keep the API contract, test failures, and migration plan
```

Good focus strings:
- Name the specific task
- List what must survive
- Mention key file paths

Bad focus strings:
- Empty (default summarization may miss important details)
- Too broad ("keep everything important")
- Too narrow ("only keep line 42 of auth.ts")

### What survives compact automatically

- CLAUDE.md content (re-read from disk)
- Rules files (re-read from disk)
- Skill descriptions (re-injected)
- MCP tool schemas (re-injected)
- Auto-memory notes (persisted to disk)

### What does NOT survive compact

- Conversation details (summarized, not preserved verbatim)
- Tool outputs (lost unless anchored)
- In-progress reasoning (summarized)
- File contents you read (must re-read)

## Progressive Loading

### The 82% savings pattern

Skills use progressive loading:
- **At startup**: only frontmatter (name, description, triggers) loaded — ~50 tokens per skill
- **When activated**: full skill body loaded — ~500-2000 tokens per skill

With 30 skills:
- All loaded: 30 × 1000 = 30,000 tokens
- Progressive: 30 × 50 + 3 active × 1000 = 4,500 tokens (85% savings)

### Applying progressive loading to your content

1. Keep CLAUDE.md focused on routing and short rules
2. Move reference material to skills (loaded on demand)
3. Use path-scoped rules (loaded only for matching files)
4. Use `@path` imports for large documents (loaded but can be excluded)

## Large Codebase Patterns

### When a repo is too big for one session

Signs you need to partition:
- Reading more than 30-40 files per session
- Context fills up before implementation starts
- Frequent auto-compaction interrupts

### Partitioning strategies

1. **Module-by-module**: tackle one module per session
2. **Research then implement**: research session → notes → implementation session
3. **Subagent delegation**: main context stays clean, subagents explore
4. **Multi-session plan**: plan in session 1, implement in session 2-N

### Using subagents for context isolation

```
Main context: task planning, implementation
  └── Subagent 1: research existing patterns (Haiku)
  └── Subagent 2: explore test coverage (Haiku)
  └── Subagent 3: review dependencies (Haiku)
```

Each subagent gets its own 200k context window. Only summaries return to main context.

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| CLAUDE.md > 500 lines | Eats working budget every turn | Split into rules and skills |
| 10+ unconditional rules | High fixed overhead | Path-scope where possible |
| All skills model-invocable | Description tokens add up | Use `disable-model-invocation: true` for manual-only skills |
| Too many MCP servers | Schema tokens accumulate | Disconnect unused servers (`/mcp`) |
| No compaction strategy | Hit limit unpredictably | Compact proactively at 70% |
| Reading entire large files | Each read adds thousands of tokens | Use Grep to find specific content |
| Ignoring auto-memory | Re-discovering the same facts each session | Let auto-memory persist findings |

## Quick Reference

### Context health check

```
/cost           → see current token usage (subscription: per-model + cache-hit breakdown)
/compact        → manually compact context
/memory         → see what CLAUDE.md/rules are loaded
/mcp            → see MCP server token costs
/model          → check/change current model
```

### /cost per-model breakdown (v2.1.101)

For subscription users, `/cost` now shows a per-model and cache-hit breakdown — not just totals. This lets you see exactly which models are driving cost and how much is hitting the cache.

```
Model             Input    Cache Read   Output    Total
claude-opus-4-7   12,400   8,200        1,800     $0.42
claude-sonnet-4-6 45,200   31,000       8,100     $0.18
                                        Cache savings: $0.08
```

Use this to verify that prompt caching is working (cache reads should be 30-60% of input for repeat sessions) and to identify which agent or skill is the most expensive consumer.

### Rule of thumb targets

| Metric | Target |
|--------|--------|
| Fixed overhead | < 25k tokens (12.5% of 200k) |
| Working budget | > 150k tokens |
| Compact trigger | 70% utilization |
| Anchor budget | < 20k tokens |
| Skills active at once | ≤ 5 |
| MCP servers connected | ≤ 5 |
