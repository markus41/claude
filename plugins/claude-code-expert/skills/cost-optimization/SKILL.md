# Claude Code Cost Optimization

Complete guide to managing costs, model routing, token usage, and caching.

## Cost Tracking

### /cost Command
```
/cost
```
Shows:
- Input tokens consumed
- Output tokens consumed
- Cache read tokens (cheaper)
- Cache write tokens
- Total estimated cost (USD)

## Model Selection & Routing

### Available Models
| Model | ID | Best For | Cost |
|-------|-----|---------|------|
| Opus 4.6 | `claude-opus-4-6` | Architecture, complex decisions | Highest |
| Sonnet 4.6 | `claude-sonnet-4-6` | General development, implementation | Medium |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | Quick lookups, simple tasks | Lowest |

### Switching Models
```
/model claude-haiku-4-5-20251001   # Switch to Haiku for simple tasks
/model claude-sonnet-4-6            # Switch back to Sonnet
/model claude-opus-4-6              # Switch to Opus for complex work
```

### CLI Model Override
```bash
claude -m claude-haiku-4-5-20251001 -p "quick question"
```

### Settings Configuration
```json
{
  "model": "claude-sonnet-4-6",
  "smallFastModel": "claude-haiku-4-5-20251001"
}
```

## Token Reduction Strategies

### 1. Use /compact Frequently
```
/compact                    # Compress full conversation
/compact focus on the API   # Compress with specific focus
```
Reduces context window size, lowering per-message input costs.

### 2. Targeted File Reads
```
// Expensive: read entire large file
Read(file_path="large-file.ts")        // ~5000 tokens

// Cheap: read specific section
Read(file_path="large-file.ts", offset=100, limit=30)  // ~300 tokens

// Cheap: search first
Grep(pattern="function auth", path="src/")  // ~100 tokens
```

### 3. Use Sub-Agents for Research
Sub-agents process information internally and return summaries:
```
// Main context gets only the summary (~500 tokens)
// Instead of 20 file reads (~50,000 tokens)
Agent(subagent_type="Explore", prompt="Find all database models")
```

### 4. Grep Before Read
```
// Don't read every file looking for something
// Search first, then read only matching files
Grep(pattern="TODO|FIXME", type="ts")
```

### 5. Background Tasks
```
// Long tasks don't consume main context while running
Agent(run_in_background=true, ...)
Bash(command="npm test", run_in_background=true)
```

### 6. Clear Between Unrelated Tasks
```
/clear   # Reset context for new topic
```

## Prompt Caching

### How It Works
- Claude Code caches system prompts and conversation history
- Cached tokens cost significantly less (~90% savings)
- Cache hits happen when the same prefix appears in consecutive requests

### Maximizing Cache Hits
1. **Keep CLAUDE.md stable** — Changes invalidate cache
2. **Consistent system prompts** — Don't modify with `--append-system-prompt` frequently
3. **Sequential conversations** — Cache benefits multi-turn conversations

### API-Level Caching
```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: "Your system prompt here...",
      cache_control: { type: "ephemeral" }
    }
  ],
  messages: [...]
});

// Usage shows cache info
console.log(response.usage.cache_creation_input_tokens);
console.log(response.usage.cache_read_input_tokens);
```

## Provider Cost Comparison

### Anthropic Direct
Standard pricing, most features.

### AWS Bedrock
```bash
CLAUDE_CODE_USE_BEDROCK=1 claude
```
- May have different pricing through AWS agreements
- Cross-region inference available
- Committed use discounts possible

### Google Vertex AI
```bash
CLAUDE_CODE_USE_VERTEX=1 claude
```
- GCP pricing and billing
- May have committed use discounts

## Batch Processing (50% Savings)

For non-interactive workloads, use the Message Batches API:
```typescript
const batch = await client.messages.batches.create({
  requests: [
    {
      custom_id: "review-1",
      params: {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Review file1.ts" }]
      }
    },
    {
      custom_id: "review-2",
      params: {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Review file2.ts" }]
      }
    }
  ]
});
```
Batch processing gives 50% cost reduction with 24-hour SLA.

## Cost Estimation

### Rule of Thumb
| Task | Approximate Cost |
|------|-----------------|
| Simple question | $0.01 - $0.05 |
| Code review (1 file) | $0.05 - $0.15 |
| Feature implementation | $0.20 - $1.00 |
| Complex refactoring | $0.50 - $2.00 |
| Full project analysis | $1.00 - $5.00 |

### Factors Affecting Cost
1. Model used (Opus > Sonnet > Haiku)
2. Context window size (more history = more input tokens)
3. Number of tool calls (each adds output + input)
4. File sizes read
5. Number of conversation turns
6. Extended thinking budget

## Best Practices

1. **Start with Sonnet** — Good balance of quality and cost
2. **Use Haiku for exploration** — Switch for simple lookups
3. **Upgrade to Opus for architecture** — Worth the cost for complex decisions
4. **Compact regularly** — Smaller context = lower cost per turn
5. **Delegate research** — Sub-agents are cost-neutral for main context
6. **Monitor with /cost** — Track spending periodically
7. **Use batch API for bulk** — 50% savings on non-interactive work
8. **Leverage caching** — Keep system prompts stable
