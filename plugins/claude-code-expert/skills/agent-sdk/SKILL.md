# Claude Agent SDK

Complete guide to the Claude Agent SDK for building custom AI agents.

## Overview

The Claude Agent SDK allows you to programmatically spawn and control Claude Code sessions from TypeScript/JavaScript or Python applications.

## Installation

### TypeScript/JavaScript
```bash
npm install @anthropic-ai/claude-agent-sdk
# or
pnpm add @anthropic-ai/claude-agent-sdk
```

### Python
```bash
# Using uv (recommended)
uv init && uv add claude-agent-sdk

# Using pip
python3 -m venv .venv && source .venv/bin/activate
pip3 install claude-agent-sdk
```

**Prerequisite:** Claude Code CLI must be installed:
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Required env var:** `ANTHROPIC_API_KEY`

## Basic Usage

```typescript
import { claude } from "@anthropic-ai/claude-code-sdk";

// Simple query
const response = await claude("What files are in this directory?");
console.log(response.text);

// With options
const response = await claude("Refactor this function", {
  model: "claude-sonnet-4-6",
  maxTurns: 10,
  cwd: "/path/to/project",
  allowedTools: ["Read", "Write", "Edit", "Glob", "Grep"],
});
```

## Python SDK

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix the bug in auth.py",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Bash"],
            permission_mode="acceptEdits",
        ),
    ):
        print(message)

asyncio.run(main())
```

### Python Options

```python
ClaudeAgentOptions(
    allowed_tools=["Read", "Edit", "Bash"],
    permission_mode="acceptEdits",    # default, acceptEdits, dontAsk, bypassPermissions, plan
    system_prompt="Custom prompt",
    agents={"reviewer": AgentDefinition(
        description="Expert code reviewer",
        prompt="Analyze code quality.",
        tools=["Read", "Glob", "Grep"],
    )},
    mcp_servers={"playwright": {...}},
)
```

## TypeScript Streaming

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// Stream responses
for await (const message of query({
  prompt: "Explain this codebase",
  options: {
    allowedTools: ["Read", "Glob", "Grep"],
  }
})) {
  console.log(message);
}
```

## Event Types

```typescript
interface TextEvent {
  type: "text";
  text: string;
}

interface ToolUseEvent {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
  id: string;
}

interface ToolResultEvent {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error: boolean;
}

interface StopEvent {
  type: "stop";
  reason: "end_turn" | "max_turns" | "error";
}
```

## Options

```typescript
interface ClaudeOptions {
  // Model selection
  model?: string;                    // Claude model to use

  // Conversation control
  maxTurns?: number;                 // Max agentic turns
  systemPrompt?: string;            // Override system prompt
  appendSystemPrompt?: string;      // Append to system prompt

  // Working directory
  cwd?: string;                     // Working directory for file operations

  // Permissions
  allowedTools?: string[];          // Allowed tools list
  disallowedTools?: string[];       // Denied tools list
  permissionMode?: "default" | "plan" | "bypassPermissions";

  // Session management
  sessionId?: string;               // Resume existing session
  continue?: boolean;               // Continue last session

  // MCP
  mcpConfig?: string;               // Path to MCP config file

  // Environment
  env?: Record<string, string>;     // Additional env vars

  // Input
  inputFormat?: "text" | "stream-json";

  // Abort
  abortSignal?: AbortSignal;        // Cancel the request
}
```

## Built-in Sub-Agent Types

When using the `Agent` tool within Claude Code, these sub-agent types are available:

| Type | Purpose | Tools Available |
|------|---------|----------------|
| `general-purpose` | Multi-step tasks, code search | All tools |
| `Explore` | Fast codebase exploration | Read-only tools |
| `Plan` | Architecture & implementation planning | Read-only tools |
| `claude-code-guide` | Claude Code feature questions | Read-only + web |
| `researcher` | Deep research with web access | Read-only + web |
| `test-writer` | Write comprehensive tests | All tools |
| `code-reviewer` | Code review and quality | Read-only + Bash |
| `debugger` | Debug errors and failures | All tools |
| `doc-writer` | Documentation generation | Write tools |
| `security-reviewer` | Security audit | Read-only + Bash |
| `regex-expert` | Regular expression design | Read/Write tools |
| `prisma-specialist` | Prisma ORM operations | All tools |
| `redis-specialist` | Redis caching patterns | All tools |
| `graphql-specialist` | GraphQL API design | All tools |
| `infrastructure-specialist` | Distributed systems, k8s | All tools |
| `docker-ops` | Docker build and registry | Read-only + Bash |
| `k8s-image-auditor` | K8s deployment auditing | Read-only + Bash |
| `ansible-specialist` | Ansible automation | All tools |
| `pulumi-specialist` | Pulumi IaC | All tools |

## Multi-Agent Patterns

### Parallel Research
```typescript
import { claude } from "@anthropic-ai/claude-code-sdk";

// Run multiple agents in parallel
const [security, performance, docs] = await Promise.all([
  claude("Review security of auth module", {
    allowedTools: ["Read", "Glob", "Grep"],
  }),
  claude("Profile and optimize the API routes", {
    allowedTools: ["Read", "Glob", "Grep", "Bash"],
  }),
  claude("Generate API documentation", {
    allowedTools: ["Read", "Glob", "Grep", "Write"],
  }),
]);
```

### Pipeline Pattern
```typescript
// Step 1: Research
const research = await claude("Analyze the authentication system");

// Step 2: Plan based on research
const plan = await claude(`Based on this analysis: ${research.text}\n\nCreate an implementation plan`);

// Step 3: Implement based on plan
const impl = await claude(`Implement this plan: ${plan.text}`, {
  allowedTools: ["Read", "Write", "Edit", "Bash"],
});
```

### Supervisor Pattern
```typescript
import { claude } from "@anthropic-ai/claude-code-sdk";

async function supervisedTask(task: string) {
  // Worker does the task
  const result = await claude(task, {
    maxTurns: 20,
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  });

  // Reviewer checks the work
  const review = await claude(
    `Review this work for quality and correctness:\n\nTask: ${task}\n\nResult: ${result.text}`,
    {
      allowedTools: ["Read", "Glob", "Grep"],
    }
  );

  return { result, review };
}
```

## Spawning Agents within Claude Code

Inside Claude Code conversations, use the Agent tool:

```
Agent tool parameters:
- prompt: The task description
- subagent_type: Agent specialization (see table above)
- description: Short 3-5 word summary
- run_in_background: true/false for async execution
- isolation: "worktree" for isolated git worktree
- mode: "plan", "acceptEdits", "bypassPermissions", "default", "dontAsk"
- resume: Agent ID to resume previous agent
```

### Background Agents
```
// Launch in background - get notified on completion
Agent(subagent_type="researcher", run_in_background=true, ...)

// Resume a completed agent
Agent(resume="agent-id-here", ...)
```

### Worktree Isolation
```
// Run agent in isolated git worktree
Agent(subagent_type="test-writer", isolation="worktree", ...)
// Agent gets its own copy of the repo
// Changes are on a separate branch
```

## Custom Agents

Create custom agent definitions in `.claude/agents/`:

```markdown
---
name: my-specialist
description: Domain-specific expert
tools:
  - Read
  - Write
  - Edit
  - Bash
model: claude-sonnet-4-6
---

# My Specialist Agent

You are an expert in [domain]. When activated, you should:

1. Analyze the current context
2. Apply domain-specific knowledge
3. Provide actionable recommendations

## Guidelines
- Always check existing code before suggesting changes
- Follow project conventions
- Include tests for new functionality
```

## Error Handling

```typescript
import { claude } from "@anthropic-ai/claude-code-sdk";

try {
  const response = await claude("risky operation", {
    maxTurns: 5,
  });

  if (response.exitCode !== 0) {
    console.error("Agent encountered an error");
  }
} catch (error) {
  if (error.name === "AbortError") {
    console.log("Agent was cancelled");
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Code Review with Claude
  run: |
    npx claude -p "Review the changes in this PR and report issues" \
      --output-format json \
      --max-turns 10 \
      > review.json
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```
