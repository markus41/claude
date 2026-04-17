---
name: cc-perf
intent: Analyze session performance, identify token waste, track costs, and recommend optimizations for Claude Code sessions
tags:
  - claude-code-expert
  - command
  - performance
  - cost
  - analytics
  - optimization
arguments:
  - name: action
    description: What to analyze — session metrics, optimization tips, model comparison, or budget enforcement
    required: false
    type: choice
    choices: [session, analyze, tips, compare, budget]
    default: session
flags:
  - name: budget
    description: Set a cost ceiling in dollars and warn when approaching it
    type: string
  - name: verbose
    description: Show detailed per-tool-call token breakdown
    type: boolean
    default: false
  - name: export
    description: Export analytics as JSON for external tracking
    type: boolean
    default: false
risk: low
cost: low
---

# /cc-perf — Session Performance Analyzer

Use `/cc-perf` to understand where tokens and money are going in your Claude Code sessions, identify waste, and optimize for cost or speed.

## What it does

Analyzes your current session's token usage patterns and provides actionable optimization recommendations.

## Usage

```bash
/cc-perf                       # Show current session metrics
/cc-perf analyze               # Deep analysis of token waste patterns
/cc-perf tips                  # Quick optimization recommendations
/cc-perf compare               # Compare cost of current task across models
/cc-perf budget --budget $2    # Set cost ceiling, warn at 80%
```

## Operating protocol

### Phase 1 — Gather metrics
Collect from the current session:
- Total tokens (input/output/cache read/cache write)
- Turn count and average tokens per turn
- Tool call frequency by type
- Context utilization percentage
- Estimated cost so far

### Phase 2 — Identify inefficiencies
Look for these patterns:
- **Repeated file reads** — same file read 3+ times → suggest anchoring
- **Over-broad searches** — Bash grep with huge output → suggest Grep with limits
- **Unnecessary tool calls** — Read on directories, failed commands retried
- **Model mismatch** — Opus on simple lookups, Haiku on complex implementation
- **Context bloat** — large tool outputs inflating every subsequent turn

### Phase 3 — Generate recommendations
Produce a prioritized list:
1. Highest-impact optimization (save the most tokens/money)
2. Quick wins (easy changes)
3. Structural improvements (session planning, subagent usage)

### Phase 4 — Report
Output a performance summary table:

| Metric | Value | Rating |
|--------|-------|--------|
| Total cost | $X.XX | Good/Warning/High |
| Context efficiency | XX% | Good/Warning/Low |
| Cache hit rate | XX% | Good/Warning/Low |
| Wasted tokens (est.) | Xk | Good/Warning/High |

### Budget mode
When `--budget` is set:
- Track cumulative cost against the ceiling
- Warn at 80% of budget
- Suggest model downgrade or session split when approaching limit
- Report remaining budget after each analysis

## Output contract

Returns:
- Performance metrics table
- Ranked optimization recommendations (max 5)
- Cost comparison table (if `compare` action)
- Budget status (if `--budget` set)
