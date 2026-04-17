# Claude Code Extended Thinking

Complete guide to extended thinking modes and thinking budget configuration.

## Overview

Extended thinking (also called "ultrathink") allows Claude to perform deeper reasoning before responding. This uses additional tokens for internal reasoning that improves quality on complex tasks.

## Thinking Modes

### Trigger Phrases (CLI)
Use these phrases in your prompts to activate thinking levels:

| Phrase | Thinking Tokens | Approx Cost |
|--------|----------------|-------------|
| `think` | ~4,000 tokens | ~$0.06 |
| `think hard` / `megathink` | ~10,000 tokens | ~$0.15 |
| `ultrathink` | ~32,000 tokens | ~$0.48 |

Example: `"ultrathink about how to refactor the auth module"`

### Toggle Shortcut
- `Option+T` — Toggle extended thinking on/off in interactive mode

### Environment Variable
```bash
CLAUDE_CODE_EFFORT_LEVEL=high   # low, medium, high
```

### Default Thinking
Standard reasoning — Claude thinks internally as needed.

### Extended Thinking
More deliberate reasoning with configurable thinking budget.

### Ultrathink
Maximum reasoning depth for the most complex problems. Best for architecture decisions, debugging complex issues, and novel problem-solving.

## Configuration

### Via API (Claude Agent SDK)
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 16000,
  thinking: {
    type: "enabled",
    budget_tokens: 10000  // Tokens allocated for thinking
  },
  messages: [
    { role: "user", content: "Solve this complex architecture problem..." }
  ]
});

// Access thinking content
for (const block of response.content) {
  if (block.type === "thinking") {
    console.log("Thinking:", block.thinking);
  } else if (block.type === "text") {
    console.log("Response:", block.text);
  }
}
```

### Budget Tokens
| Budget | Use Case |
|--------|----------|
| 2,000-5,000 | Simple analysis, code review |
| 5,000-10,000 | Architecture decisions, debugging |
| 10,000-20,000 | Complex multi-step reasoning |
| 20,000+ | Deep research, novel problem solving |

### Streaming with Thinking
```typescript
const stream = await client.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 16000,
  thinking: {
    type: "enabled",
    budget_tokens: 10000
  },
  messages: [{ role: "user", content: "..." }]
});

for await (const event of stream) {
  if (event.type === "content_block_start") {
    if (event.content_block.type === "thinking") {
      console.log("--- Thinking started ---");
    }
  }
  if (event.type === "content_block_delta") {
    if (event.delta.type === "thinking_delta") {
      process.stdout.write(event.delta.thinking);
    } else if (event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }
}
```

## In Claude Code

Within Claude Code sessions, extended thinking is managed automatically based on:
1. Model capabilities
2. Task complexity
3. Available token budget

### When Extended Thinking Activates
- Complex architectural decisions
- Multi-step debugging
- Code review requiring deep analysis
- Planning with many constraints
- Novel problem-solving

### Model Support
| Model | Extended Thinking |
|-------|------------------|
| Claude Opus 4.6 | Full support |
| Claude Sonnet 4.6 | Full support |
| Claude Haiku 4.5 | Limited support |

## Best Practices

1. **Use for complex tasks** — Don't waste thinking budget on simple questions
2. **Set appropriate budgets** — More isn't always better
3. **Monitor costs** — Thinking tokens count toward usage
4. **Combine with planning** — Extended thinking + plan mode for architecture
5. **Review thinking output** — Verify the reasoning, not just the conclusion

## Cost Implications

- Thinking tokens are billed as output tokens
- Higher thinking budgets increase cost per request
- Use `/cost` to monitor thinking token usage
- Consider model routing: use Haiku for simple, Opus for complex

## Thinking in Multi-Turn Conversations

- Thinking context carries across turns
- Each turn can have its own thinking budget
- Claude references previous thinking implicitly
- `/compact` preserves thinking conclusions but drops raw thinking

## API Response Structure

```json
{
  "content": [
    {
      "type": "thinking",
      "thinking": "Let me analyze this step by step...\n1. First consideration...\n2. Second consideration..."
    },
    {
      "type": "text",
      "text": "Based on my analysis, here's what I recommend..."
    }
  ],
  "usage": {
    "input_tokens": 500,
    "output_tokens": 3000,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```
