---
name: model-routing
description: Intelligent model selection for Claude Code — decision matrices, cost tables, budget planning, and subagent model assignment for optimal cost/quality tradeoffs
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
triggers:
  - model selection
  - which model
  - cost estimate
  - token budget
  - routing
  - haiku vs sonnet
  - sonnet vs opus
  - model recommendation
  - expensive session
---

# Model Routing Intelligence

Select the right Claude model for each task to optimize the cost/quality tradeoff.

## Goal

Eliminate wasted spend by routing tasks to the cheapest model that produces acceptable quality, while ensuring complex tasks get the reasoning depth they need.

## Decision Matrix

### Task → Model mapping

| Task Type | Recommended Model | Reasoning |
|-----------|-------------------|-----------|
| Architecture decisions | Opus 4.7 | Needs deep multi-step reasoning, hidden coupling detection |
| Complex debugging | Opus 4.7 | Root cause analysis requires holding many hypotheses |
| Security review | Opus 4.7 | Must not miss subtle vulnerabilities |
| Standard implementation | Sonnet 4.6 | Best balance of speed, quality, and cost for code generation |
| Code review | Sonnet 4.6 | Good pattern recognition at reasonable cost |
| Refactoring | Sonnet 4.6 | Mechanical transformations with quality checks |
| Test writing | Sonnet 4.6 | Formulaic but needs understanding of code under test |
| File search / grep | Haiku 4.5 | Simple lookup, no deep reasoning needed |
| Documentation lookup | Haiku 4.5 | Reading and summarizing existing content |
| Commit message generation | Haiku 4.5 | Short, formulaic output |
| Simple Q&A | Haiku 4.5 | Direct answers, no complex analysis |
| Research subagents | Haiku 4.5 | Exploration tasks that return summaries |

### Complexity signals

Use these signals to decide when to escalate from Sonnet to Opus:
- Multiple interacting systems or modules
- Non-obvious failure modes
- "Why does this work?" questions
- Tasks where a wrong answer is expensive to fix
- Cross-cutting concerns (auth, caching, observability)
- Migration or backward-compatibility requirements

Use these signals to downgrade from Sonnet to Haiku:
- Single-file changes
- Mechanical transformations (rename, reformat)
- Reading and summarizing (no generation)
- Answering factual questions about code

## Cost Tables

### Per-token pricing (USD per million tokens)

| Model | Input | Output | Cache Write | Cache Read |
|-------|------:|-------:|------------:|-----------:|
| Opus 4.7 | $15.00 | $75.00 | $18.75 | $1.50 |
| Sonnet 4.6 | $3.00 | $15.00 | $3.75 | $0.30 |
| Haiku 4.5 | $0.80 | $4.00 | $1.00 | $0.08 |

### Cost multipliers

| Comparison | Input | Output |
|-----------|------:|-------:|
| Opus vs Sonnet | 5x | 5x |
| Sonnet vs Haiku | 3.75x | 3.75x |
| Opus vs Haiku | 18.75x | 18.75x |

### Typical session costs

| Task | Model | Est. Tokens (in/out) | Est. Cost |
|------|-------|---------------------:|----------:|
| Simple bug fix | Sonnet | 50k/10k | ~$0.30 |
| Feature implementation | Sonnet | 200k/50k | ~$1.35 |
| Architecture review | Opus | 200k/30k | ~$5.25 |
| Quick lookup | Haiku | 20k/2k | ~$0.02 |
| Research subagent | Haiku | 80k/10k | ~$0.10 |
| Full code review (council) | Mixed | 500k/100k | ~$3-8 |

## Subagent Model Assignment

### Orchestration patterns

When using `cc-orchestrate` or spawning subagents, assign models by role:

```
Research agents     → Haiku (cheap exploration, summary return)
Implementation agents → Sonnet (code generation quality)
Review/audit agents → Sonnet or Opus (depends on risk)
Architecture agents → Opus (deep reasoning required)
```

### Example: builder-validator template

```
builder agent   → Sonnet 4.6 (writes code)
validator agent → Sonnet 4.6 (reviews code)
```

### Example: research-council template

```
researcher agents (3x) → Haiku 4.5 (parallel exploration)
synthesizer agent      → Sonnet 4.6 (combines findings)
```

## Budget Planning

### Setting a session budget

Before starting a task, estimate cost:

1. **Classify the task** using the decision matrix above
2. **Estimate token volume** based on file count and task scope
3. **Calculate cost** using the pricing table
4. **Set model** with `/model` or `claude -m`

### Token estimation rules of thumb

| Content Type | Tokens per Line |
|-------------|----------------:|
| TypeScript/JavaScript | ~10 |
| Python | ~8 |
| JSON/YAML | ~6 |
| Markdown | ~5 |
| Minified code | ~15 |

### Cost control techniques

1. **Start with Haiku for research**, switch to Sonnet for implementation
2. **Use subagents** to isolate expensive research from main context
3. **Compact early** at 60-70% context to avoid expensive re-reads
4. **Limit tool output** — avoid `cat`-ing entire large files; use Grep with limits
5. **Batch related tasks** to benefit from prompt caching (cache read = 10% of input cost)
6. **Use `--max-turns`** in headless mode to cap automated sessions

### Model switching workflow

```bash
# Start with research on Haiku
/model claude-haiku-4-5-20251001
# "Find all files related to auth, summarize the architecture"

# Switch to Sonnet for implementation
/model claude-sonnet-4-6
# "Implement the new auth middleware based on the research above"

# Switch to Opus for the tricky part
/model claude-opus-4-7
# "Review the session handling for race conditions and edge cases"
```

## Environment Variables

```bash
CLAUDE_MODEL=claude-sonnet-4-6          # Default model for sessions
ANTHROPIC_MODEL=claude-sonnet-4-6       # Alternative env var
```

## Settings Configuration

```json
{
  "model": "claude-sonnet-4-6",
  "smallFastModel": "claude-haiku-4-5-20251001"
}
```

The `smallFastModel` is used for internal operations like skill matching and context compression. Keep it on Haiku for cost efficiency.

## Anti-patterns

- Using Opus for everything — 5x the cost of Sonnet with marginal quality improvement on simple tasks
- Using Haiku for complex implementation — saves money but produces lower-quality code that needs more iterations
- Not using subagents — research in main context inflates token count for every subsequent turn
- Re-reading large files — each read costs tokens; anchor important content instead
- Ignoring cache hits — restructure prompts to maximize cache read tokens (10% of input cost)

---

## Effort Control (v2.1.101)

Claude's default effort level is now **`high`** for API-key, Bedrock, Vertex, Team, and Enterprise users. High effort means more extended thinking tokens and more thorough tool use before responding.

### Changing effort level

```text
/effort low      → faster, fewer thinking tokens, good for quick lookups
/effort medium   → balanced (old default)
/effort high     → thorough reasoning, more tool calls (current default for paid)
```

Use `/effort low` for: refactoring mechanical tasks, documentation rewrites, simple file edits.
Use `/effort high` for: architecture reviews, debugging complex failures, security audits.

---

## Thinking Summaries (v2.1.90)

Extended thinking summaries are **off by default** in interactive sessions to reduce visual noise. Re-enable in settings:

```json
{
  "showThinkingSummaries": true
}
```

When enabled, Claude displays a collapsible summary of its reasoning chain before each response. Useful when debugging why Claude made a particular decision.
