---
name: cc-budget
intent: Calculate context budget, audit token consumers, optimize context allocation, and plan anchor strategies for efficient Claude Code sessions
tags:
  - claude-code-expert
  - command
  - context
  - budget
  - optimization
  - compact
arguments:
  - name: action
    description: What to do — show budget, audit consumers, optimize, or plan anchors
    required: false
    type: choice
    choices: [show, audit, optimize, anchor-plan, simulate]
    default: show
flags:
  - name: model
    description: Model to calculate budget for (affects context window size)
    type: choice
    choices: [opus, sonnet, haiku]
    default: sonnet
  - name: task
    description: Task description for simulation mode
    type: string
  - name: verbose
    description: Show detailed breakdown of every context consumer
    type: boolean
    default: false
risk: low
cost: low
---

# /cc-budget — Context Budget Calculator

Use `/cc-budget` to understand how much of your context window is consumed by always-on content (CLAUDE.md, rules, skills, MCP schemas) and how much remains for actual work.

## What it does

Calculates your effective working context by subtracting fixed overhead from the total context window, then recommends optimizations.

## Usage

```bash
/cc-budget                          # Show current context budget
/cc-budget audit                    # Detailed breakdown of token consumers
/cc-budget optimize                 # Suggest reductions to free context
/cc-budget anchor-plan              # Design PreCompact anchor strategy
/cc-budget simulate --task "refactor auth module"  # Estimate context needs
```

## Operating protocol

### Phase 1 — Inventory context consumers
Scan and measure:
- CLAUDE.md files (project, user, managed) — exact line counts
- `.claude/rules/` files — total and per-file
- Loaded skill descriptions (frontmatter only at start)
- MCP server tool schemas
- System prompt overhead

### Phase 2 — Calculate budget
```
Total context window (Sonnet/Opus) = 200,000 tokens
Minus system prompt                ≈   4,000 tokens
Minus CLAUDE.md (all levels)       ≈   X,XXX tokens
Minus rules files                  ≈   X,XXX tokens
Minus skill descriptions           ≈   X,XXX tokens
Minus MCP tool schemas             ≈   X,XXX tokens
                                   ─────────────────
Effective working budget           =   Y,YYY tokens
```

### Phase 3 — Assess and recommend
Based on working budget:
- **> 150k free**: Comfortable — complex tasks, large files, long sessions
- **100-150k free**: Normal — most tasks work fine
- **50-100k free**: Tight — plan compaction, use subagents for research
- **< 50k free**: Critical — consolidate rules, remove unused MCP servers, compact aggressively

### Phase 4 — Report
Output:
- Budget summary table
- Top 5 context consumers (ranked by token count)
- Optimization recommendations (if `optimize` action)
- Anchor file template (if `anchor-plan` action)
- Task simulation results (if `simulate` action)

## Anchor planning mode

When `anchor-plan` is selected:
1. Identify critical state that must survive `/compact`
2. Design a PreCompact hook that saves this state
3. Design a PostCompact hook that restores it
4. Generate hook configuration JSON for `settings.json`

## Output contract

Returns:
- Context budget breakdown table
- Effective working budget (tokens and percentage)
- Health rating (Comfortable / Normal / Tight / Critical)
- Ranked list of optimization suggestions
