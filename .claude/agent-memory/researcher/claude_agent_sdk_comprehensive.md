---
name: Claude Agent SDK Comprehensive Documentation
description: Complete documentation of Claude Agent SDK capabilities, architecture, and integration patterns
type: reference
---

# Claude Agent SDK Comprehensive Documentation

**Source**: https://code.claude.com/docs/en/agent-sdk/overview and related pages
**Version**: Current as of April 2026
**Date Captured**: 2026-04-21

## Overview

The Claude Agent SDK is a production-grade SDK (Python & TypeScript) that brings Claude Code's autonomous agent capabilities into libraries. It provides:

- Same tools, agent loop, and context management as Claude Code
- Built-in tools (Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, etc.)
- Autonomous tool execution (unlike Client SDKs which require manual tool loops)
- Session management with persistence, resumption, and forking
- Subagent spawning with context isolation and parallelization
- Custom MCP servers (in-process) and external MCP integration
- Hook system for intercepting and controlling agent behavior
- Plugin system for extending with commands, skills, agents, and hooks
- Permission controls with multiple modes
- Structured output generation

## Key Differentiation from Client SDK

| Aspect | Client SDK | Agent SDK |
|--------|-----------|----------|
| Tool Execution | Manual (you implement loop) | Automatic (SDK handles orchestration) |
| Complexity | More code, full control | Less code, batteries included |
| Use Case | API access + custom logic | Production agents & automation |
| Built-in Tools | None (you implement) | 10+ tools ready to use |
| Session Management | None | Full persistence, resumption, forking |
| Subagents | N/A | Native support with context isolation |

## Built-in Tools (Always Available)

| Tool | Purpose |
|------|---------|
| **Read** | Read any file in the working directory |
| **Write** | Create new files |
| **Edit** | Make precise edits to existing files |
| **Bash** | Run terminal commands, scripts, git operations |
| **Monitor** | Watch background scripts and react to output lines |
| **Glob** | Find files by pattern (e.g., `**/*.ts`) |
| **Grep** | Search file contents with regex |
| **WebSearch** | Search the web for current information |
| **WebFetch** | Fetch and parse web page content |
| **AskUserQuestion** | Ask clarifying questions with multiple choice |

## Core Architecture

### The Agent Loop

1. **User submits a prompt** via `query(prompt, options)` or `client.query(prompt)`
2. **SDK streams messages** as Claude works (async iterator in Python, async generator in TypeScript)
3. **Claude reasons** about the task and decides which tools to call
4. **SDK executes tools** (no manual loop needed—SDK handles this)
5. **Claude observes results** and decides next steps
6. **Loop continues** until Claude completes the task or hits a limit
7. **Final ResultMessage** indicates success/error/cancellation

### Message Types

- **SystemMessage** (subtype: `init`): Session initialization, available tools, MCP servers, slash commands
- **AssistantMessage**: Claude's reasoning and tool calls
- **ToolResultBlock**: Result from a tool execution (nested in messages)
- **ResultMessage**: Final outcome (subtype: `success`, `error_during_execution`, `error_max_turns`, `error_max_budget_usd`, etc.)

### Sessions

- **Purpose**: Persist conversation history across multiple `query()` calls
- **Persistence**: Stored in `~/.claude/projects/<encoded-cwd>/<session-id>.jsonl`
- **Automatic**: Each `query()` creates a new session by default
- **Continue**: Resume most recent session without tracking ID
- **Resume**: Resume specific session by ID
- **Fork**: Create new session from prior history without modifying original

### Context Management

- **Conversation history**: Automatically compacted when reaching context limits
- **File changes**: Tracked separately for optional [checkpointing/reverting](#file-checkpointing)
- **Subagent isolation**: Subagent context separate from parent (no conversation bleed)
- **Session-specific**: Each session gets its own transcript file

## Core Features & Capabilities

### 1. Subagents (Multi-Agent Orchestration)

**What**: Spawn specialized agents to isolate context, run tasks in parallel, apply specialized instructions

**Context Inheritance**:
- Each subagent has a **fresh conversation** (no parent conversation history)
- Only channel from parent to subagent is the Agent tool's prompt string
- Subagent receives:
  - Its own system prompt (`AgentDefinition.prompt`)
  - Project CLAUDE.md (if loaded via `settingSources`)
  - Tool definitions (subset in `tools` field, or all if omitted)
- Subagent does NOT receive:
  - Parent conversation history
  - Parent system prompt
  - Skills (unless listed in `AgentDefinition.skills`)

**Creation Patterns**:

```python
agents={
    "code-reviewer": AgentDefinition(
        description="Expert code reviewer",
        prompt="You are a code review specialist...",
        tools=["Read", "Grep", "Glob"],  # Optional: restrict tools
        model="sonnet",  # Optional: override model
        skills=["security-audit"],  # Optional: skills this agent can use
        memory="project",  # Optional: memory source (Python only)
        mcpServers=[...]  # Optional: MCP servers available to agent
    )
}
```

**Invocation**:
- **Automatic**: Claude decides when to invoke based on task + `description`
- **Explicit**: Mention by name in prompt: `"Use the code-reviewer agent to..."`

**Parallelization**: Multiple subagents can run concurrently, reducing review time from minutes to seconds

**Tool Restrictions**: Subagents cannot spawn their own subagents (no `Agent` tool in subagent's `tools`)

**Resuming Subagents**: Subagents can be resumed with `resume: sessionId` to continue where they left off. Full conversation history retained.

### 2. Hooks (Lifecycle Interception)

**Purpose**: Run custom code at key agent execution points (pre/post tool use, session start/stop, etc.)

**Available Hooks**:

| Hook | Fires When | Use Case |
|------|-----------|----------|
| `PreToolUse` | Tool call requested (before execution) | Block, modify, or approve tool calls |
| `PostToolUse` | Tool execution completed | Log/audit, append context to result |
| `PostToolUseFailure` | Tool execution failed | Handle errors, retry logic |
| `UserPromptSubmit` | User submits prompt | Inject context into prompt |
| `Stop` | Agent execution stops | Save state, cleanup |
| `SubagentStart` | Subagent initializes | Track spawning |
| `SubagentStop` | Subagent completes | Aggregate results |
| `PreCompact` | Conversation compaction | Archive transcript |
| `PermissionRequest` | Permission dialog would show | Custom approval handling |
| `SessionStart` | Session initializes | Init logging/telemetry |
| `SessionEnd` | Session terminates | Cleanup resources |
| `Notification` | Agent status messages | Forward to Slack/PagerDuty |

**Matcher Patterns**: Filter hooks by tool name or event type using regex (e.g., `"Write|Edit"` for file modifications, `"^mcp__"` for all MCP tools)

**Hook Return Structure**:
```python
{
    "systemMessage": "context to inject",  # Optional: add to conversation
    "continue_": True/False,  # Optional: continue agent?
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow|deny|ask",
        "updatedInput": {...},  # Optional: modify tool input
        "additionalContext": "...",  # Optional: append to result
    }
}
```

**Priority**: `deny` > `ask` > `allow`. If any hook returns deny, operation is blocked.

### 3. MCP Integration

**Two approaches**:
1. **External MCP Servers** (stdio, HTTP/SSE): Connect to GitHub, Slack, databases, etc.
2. **Custom In-Process Tools**: Define tools directly in code with `@tool` decorator / `tool()` function

**External Server Example**:
```python
options = ClaudeAgentOptions(
    mcp_servers={
        "github": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {"GITHUB_TOKEN": os.environ["GITHUB_TOKEN"]}
        }
    },
    allowed_tools=["mcp__github__list_issues", "mcp__github__search_issues"]
)
```

**Tool Naming**: `mcp__<server_name>__<tool_name>` (e.g., `mcp__github__list_issues`)

**Permission Model**: 
- Use `allowedTools` with wildcards (e.g., `"mcp__github__*"`) to pre-approve
- `permissionMode: "acceptEdits"` does NOT auto-approve MCP tools
- Prefer explicit `allowedTools` over broad `permissionMode`

**Error Handling**: Check `init` system message for `mcp_servers` status field to detect connection failures early

**Tool Search**: When you have 100+ tools, use tool search to defer loading until needed (prevents context bloat)

### 4. Custom Tools (In-Process MCP)

**Define**: Use `@tool` (Python) or `tool()` (TypeScript) with name, description, input schema, and async handler

```python
@tool(
    "get_temperature",
    "Get current temperature at a location",
    {"latitude": float, "longitude": float}  # Input schema
)
async def get_temperature(args):
    return {
        "content": [{"type": "text", "text": "..."}],
        "is_error": False  # Optional: mark as error
    }

weather_server = create_sdk_mcp_server(
    name="weather",
    version="1.0.0",
    tools=[get_temperature]
)
```

**Schema**: 
- **TypeScript**: Zod (`z.number()`, `z.enum()`, `.default()`, etc.)
- **Python**: Dict (`{"latitude": float}`) or full JSON Schema dict for advanced (enums, ranges)

**Return Value**:
- **`content`**: Array of blocks: `{type: "text"/"image"/"resource", ...}`
- **`isError`** (TS) / **`is_error`** (Python): Mark as failed so Claude can retry/react

**Annotations**: Metadata flags for optimization:
- `readOnlyHint: true`: Allows parallel execution with other read-only tools
- `destructiveHint`, `idempotentHint`, `openWorldHint`: Informational

**Result Types**:
- **Text**: `{type: "text", text: "..."}`
- **Image**: `{type: "image", data: "<base64>", mimeType: "image/png"}`
- **Resource**: `{type: "resource", resource: {uri, text/blob, mimeType}}`

### 5. Permissions

**Permission Modes**:

| Mode | Behavior |
|------|----------|
| `acceptEdits` (default) | Auto-approve file edits + Bash commands, ask for others |
| `dontAsk` | Deny anything not in `allowedTools` |
| `auto` (TS only) | Model classifier approves/denies each call |
| `bypassPermissions` | Run every tool without prompts (for sandboxed CI) |
| `default` | Custom `canUseTool` callback handles approval |

**Tool Allow/Deny Lists**:
- `allowedTools`: Pre-approved tools run without prompting
- `disallowedTools`: Blocked tools (still visible to Claude, but calls denied)
- `tools`: Controls which **built-in** tools appear in context (prefer over `disallowedTools`)

**Evaluation Order**: 
1. Check if tool is in `tools` (availability)
2. Check hooks for `PreToolUse` decisions
3. Check `disallowedTools`
4. Check permission mode
5. Check `allowedTools`

### 6. Sessions

**Three approaches**:

1. **One-shot**: Single `query()` call, no persistence needed
2. **Automatic (Python)**: Use `ClaudeSDKClient` which tracks session internally
3. **Manual (TypeScript)**: Pass `continue: true` to resume most recent, or capture session ID and use `resume`

**Resuming**:
```python
async for message in query(
    prompt="Now refactor the code",
    options=ClaudeAgentOptions(resume=session_id)
):
    ...
```

**Forking**:
```python
async for message in query(
    prompt="Try OAuth2 instead",
    options=ClaudeAgentOptions(resume=session_id, fork_session=True)
):
    ...
```

**Session Functions**:
- `list_sessions()` / `listSessions()`: Enumerate sessions
- `get_session_messages()` / `getSessionMessages()`: Read transcript
- `get_session_info()` / `getSessionInfo()`: Get metadata
- `rename_session()` / `renameSession()`: Human-readable names
- `tag_session()` / `tagSession()`: Organize by tag

**Cross-Host Resumption**: Sessions are local to the machine. To resume on different host:
- Move session file from `~/.claude/projects/<encoded-cwd>/<session-id>.jsonl` to same path on new host
- OR: Capture results and pass them in fresh session's prompt

### 7. Plugins

**Loading**:
```python
options = ClaudeAgentOptions(
    plugins=[
        {"type": "local", "path": "./my-plugin"},
        {"type": "local", "path": "/absolute/path/plugin"}
    ]
)
```

**Contents**: Skills, agents, hooks, MCP servers, commands

**Naming**: Skills from plugins are namespaced: `/plugin-name:skill-name`

**Plugin Discovery**: Check `init` SystemMessage for `plugins` and `slash_commands` fields

**Directory Structure**:
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── agents/
│   └── specialist.md
├── hooks/
│   └── hooks.json
└── .mcp.json
```

### 8. Claude Code Features in SDK

The SDK can load project CLAUDE.md, skills, hooks, and other Claude Code features via `settingSources`:

```python
options = ClaudeAgentOptions(
    setting_sources=["project"]  # Loads .claude/ directory
)
```

**Features loaded**:
- `CLAUDE.md` / `.claude/CLAUDE.md`: Project memory and instructions
- `.claude/skills/*/SKILL.md`: Reusable capabilities
- `.claude/settings.json`: Hooks, MCP config
- `.claude/commands/`: Slash commands

## Language Support & Runtimes

- **Python**: 3.10+, async/await patterns, uses `httpx` for HTTP
- **TypeScript**: Node.js 18+, async generators, uses native `fetch`
- **Both**: Full type definitions, first-class async support

## Key Classes & APIs

### Python

```python
# Main entry point
query(prompt, options) -> AsyncIterator[Message]

# Session management client
class ClaudeSDKClient:
    async with ClaudeSDKClient(options) as client:
        await client.query(prompt)
        async for message in client.receive_response():
            ...

# Options configuration
ClaudeAgentOptions(
    allowed_tools=["Read", "Edit"],
    permission_mode="acceptEdits",
    mcp_servers={"weather": ...},
    plugins=[...],
    hooks={...},
    agents={...},
    resume=session_id,
    fork_session=True,
    system_prompt="...",
    model="sonnet",
    max_turns=10,
    max_budget_usd=1.00,
    setting_sources=["project"],
    continue_=True
)

# Message types
class SystemMessage
class AssistantMessage
class ResultMessage
class ToolResultBlock

# Tools
@tool(name, description, schema, annotations=...)
async def my_tool(args): return {"content": [...]}

# MCP
create_sdk_mcp_server(name, version, tools=[...])

# Hooks
class HookMatcher(matcher="pattern", hooks=[callback])
async def my_hook(input_data, tool_use_id, context): return {}

# Agents
class AgentDefinition(
    description="...",
    prompt="...",
    tools=[...],
    model="...",
    skills=[...]
)
```

### TypeScript

```typescript
// Main entry point
query({prompt, options}) -> AsyncGenerator<Message>

// Options configuration
{
  allowedTools: ["Read", "Edit"],
  permissionMode: "acceptEdits",
  mcpServers: {"weather": ...},
  plugins: [...],
  hooks: {...},
  agents: {...},
  resume: sessionId,
  forkSession: true,
  systemPrompt: "...",
  model: "sonnet",
  maxTurns: 10,
  maxBudgetUsd: 1.00,
  settingSources: ["project"],
  continue: true,
  persistSession: true
}

// Message types
type SDKMessage = SystemMessage | AssistantMessage | SDKResultMessage | ...
interface SystemMessage { type: "system", subtype: "init", mcp_servers, plugins, slash_commands }
interface AssistantMessage { type: "assistant", message: { content: [...] } }
interface SDKResultMessage { type: "result", session_id, subtype, result }

// Tools
tool(
  name,
  description,
  {field: z.number(), ...},  // Zod schema
  async (args) => ({content: [...]}),
  {annotations: {readOnlyHint: true}}
)

// MCP
createSdkMcpServer({name, version, tools: [...]})

// Hooks
{
  PreToolUse: [{matcher: "pattern", hooks: [callback]}]
}

async (input, toolUseID, {signal}) => ({
  hookSpecificOutput: {
    permissionDecision: "allow|deny|ask"
  }
})

// Agents
{
  "agent-name": {
    description: "...",
    prompt: "...",
    tools: [...],
    model: "..."
  }
}

// Session functions
listSessions()
getSessionMessages(sessionId)
getSessionInfo(sessionId)
renameSession(sessionId, newName)
tagSession(sessionId, tag)
```

## Relevance to Golden Armada (Your Project)

**Your current state**: 18 agents, 21 skills, MCP server with 22 tools, orchestration patterns (blackboard, council, eval-optimizer), three-tier memory

**Agent SDK provides**:

1. **Productionization**: Move from CLI-only to library-based agents you can embed in applications
2. **Subagent Improvements**: Native context isolation + parallelization (better than custom orchestration)
3. **Session Management**: Persist agent state across requests without custom logic
4. **Hook Extensibility**: More sophisticated interception points (PreToolUse vs just PostToolUse)
5. **Plugin Reloading**: Load your custom agents/skills programmatically at runtime
6. **Custom Tool Framework**: Cleaner in-process MCP server pattern than manual tool registration
7. **Permission Fine-Tuning**: Granular control per agent + per tool
8. **Tool Search**: Auto-defer loading 100+ tools (scale your tool ecosystem)
9. **Structured Output**: Built-in JSON validation instead of parsing agent text
10. **Error Propagation**: Cleaner `isError` flag vs string parsing

**Not directly useful**:
- Your three-tier memory is more sophisticated than SDK's single `system_prompt` + `CLAUDE.md`
- Your orchestration patterns (council, blackboard, eval-optimizer) are already custom
- Your existing agents are Claude Code subagents—SDK doesn't change their structure

**Hybrid approach**:
- Keep Golden Armada's orchestration engine
- Expose via Agent SDK so it can be called from applications
- Use SDK's hooks for audit/compliance logging
- Use SDK's custom tools for domain-specific operations

