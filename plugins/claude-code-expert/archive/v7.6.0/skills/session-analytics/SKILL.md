---
name: session-analytics
description: Understanding and optimizing Claude Code session performance — token tracking, bottleneck identification, caching behavior, and cost estimation
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
triggers:
  - session performance
  - token tracking
  - cost tracking
  - bottleneck
  - slow session
  - expensive session
  - cache hit
  - token waste
---

# Session Analytics

Understand where tokens go, identify waste, and optimize Claude Code sessions for cost and speed.

## Goal

Give users the tools to measure, understand, and improve the efficiency of their Claude Code sessions.

## Token Tracking

### Reading /cost output

Run `/cost` in any session to see:
```
Input tokens:        145,230
Output tokens:        28,450
Cache read tokens:    89,100  (cheaper — 10% of input price)
Cache write tokens:   12,400  (25% more than input price)
Total estimated cost: $0.87
```

### What each category means

| Category | What it represents | Cost relative to input |
|----------|-------------------|----------------------:|
| Input tokens | New content sent to the model each turn | 1.0x |
| Output tokens | Content the model generates | 5.0x (Opus/Sonnet) |
| Cache read | Content matched from prompt cache | 0.1x |
| Cache write | Content added to prompt cache | 1.25x |

Cache reads are your best friend — they're 10x cheaper than fresh input tokens.

### Token flow per turn

Each turn sends:
1. System prompt (~3-5k tokens, usually cached)
2. CLAUDE.md + rules (~2-20k tokens, usually cached after turn 1)
3. Conversation history (grows each turn)
4. Tool results from the previous turn
5. New user message

The conversation history is the main cost driver. It grows monotonically until `/compact`.

## Bottleneck Identification

### Signs of token waste

| Pattern | Symptom | Fix |
|---------|---------|-----|
| Repeated file reads | Same file in tool calls 3+ times | Read once, reference from memory |
| Over-broad Bash output | `ls -R` or `cat` on large files | Use Glob/Grep with limits |
| Unnecessary subagent spawning | Subagent for trivial lookup | Direct tool call instead |
| Large tool output | Bash command returns 500+ lines | Pipe through `head` or `tail` |
| Context thrashing | `/compact` then immediately re-read same files | Better anchor planning |
| Wrong model tier | Opus for file search | Switch to Haiku for lookups |

### Tool call cost ranking

From most to least expensive per call (typical):

1. **Bash** — unbounded output, can return huge results (10k+ tokens)
2. **Read** — proportional to file size (100-5000 tokens typical)
3. **Agent** — spawns new context (10k-100k tokens, but isolated)
4. **Grep (content mode)** — proportional to matches (100-2000 tokens)
5. **Glob** — file list only (50-500 tokens)
6. **Edit** — small diff (100-300 tokens)
7. **Write** — proportional to file size but output-only

### Measuring tool efficiency

Good efficiency indicators:
- Cache read ratio > 60% (most content is being cached)
- Average tool output < 500 tokens per call
- Files read at most twice per session
- Subagents used for research, not simple lookups

## Caching Behavior

### How prompt caching works

Claude Code automatically caches the following between turns:
- System prompt
- CLAUDE.md and rules content
- Conversation history up to a certain point

Cache hits occur when the same content prefix appears in consecutive turns. This means:
- Turn 1: all input is fresh (cache write)
- Turn 2+: system prompt and early conversation = cache read

### Maximizing cache hits

1. **Keep CLAUDE.md stable** — changes invalidate the cache
2. **Don't rearrange conversation** — prefix must match exactly
3. **Batch tool calls** — multiple calls in one turn share the same cached prefix
4. **Avoid /compact too early** — compaction rewrites history, invalidating cache

### Cache break points

These actions invalidate the cache:
- Editing CLAUDE.md mid-session
- `/compact` — rewrites conversation history
- Tool output that changes message ordering
- Switching models mid-session

## Cost Estimation

### Before starting a task

Estimate cost using these heuristics:

| Task Type | Model | Typical Turns | Typical Cost |
|-----------|-------|-------------:|-------------:|
| Quick bug fix | Sonnet | 5-10 | $0.10-0.30 |
| Feature implementation | Sonnet | 15-30 | $0.50-2.00 |
| Large refactor | Sonnet | 30-60 | $2.00-5.00 |
| Architecture analysis | Opus | 10-20 | $3.00-8.00 |
| Code review (council) | Mixed | 20-40 | $3.00-10.00 |
| Research task | Haiku | 5-15 | $0.02-0.10 |

### Tokens per file type

| File Type | Avg Tokens/Line | 100-Line File |
|-----------|----------------:|--------------:|
| TypeScript | ~10 | ~1,000 |
| Python | ~8 | ~800 |
| JSON | ~6 | ~600 |
| Markdown | ~5 | ~500 |
| YAML | ~5 | ~500 |

### Cost reduction techniques

Ordered by impact:

1. **Use Haiku for research** — 18x cheaper than Opus
2. **Use subagents** — isolate expensive work from main context
3. **Compact at 60-70%** — before context becomes too expensive
4. **Limit tool output** — use `head`, `tail`, `--limit` on commands
5. **Batch related work** — maximize cache hits within a session
6. **Avoid re-reading files** — read once, reference from context
7. **Use Grep over Bash grep** — structured output, lower tokens
8. **Set --max-turns for automation** — cap headless sessions

## Metrics to Track

For teams and repeat workflows:

| Metric | Formula | Target |
|--------|---------|--------|
| Cost per commit | total session cost / commits produced | < $1.00 |
| Context efficiency | useful output tokens / total input tokens | > 15% |
| Cache hit rate | cache read tokens / total input tokens | > 50% |
| Tokens per task | total tokens / tasks completed | decreasing over time |

## Session Planning

### Before a complex task

1. Estimate scope: how many files, how complex
2. Choose model tier: Haiku (research), Sonnet (implementation), Opus (architecture)
3. Plan subagent delegation: what can be offloaded
4. Set budget ceiling: expected cost with 50% buffer
5. Plan compact points: at what context % to compact

### During the session

- Monitor with `/cost` periodically
- Switch models when task complexity changes
- Delegate research to Haiku subagents
- Compact before context hits 80%
- Use Grep and Glob before Read (cheaper discovery)
