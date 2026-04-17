# Claude Code Context Management

Complete guide to managing context window, compression, and conversation flow.

## Context Window Overview

Claude Code manages a conversation context window that accumulates messages, tool calls, and results throughout a session.

### Context Limits
- The context window has a fixed token limit based on the model
- Claude Code automatically warns when approaching limits
- Auto-compact triggers when threshold is reached (configurable)

### Configuration

```json
// settings.json
{
  "autoCompact": true,
  "contextWindow": {
    "compactThreshold": 0.8,
    "warningThreshold": 0.9
  }
}
```

## Context Reduction Strategies

### 1. /compact Command
```
/compact                         # General compression
/compact focus on authentication # Preserve auth-related context
```

**What gets preserved:**
- Key decisions and conclusions
- File paths and structure discoveries
- Error patterns and fixes
- Current task state

**What gets summarized/dropped:**
- Verbose tool outputs
- Intermediate search results
- Exploratory code reads
- Redundant conversation turns

### 2. /clear Command
```
/clear
```
Complete reset — use between unrelated tasks.

### 3. Sub-agents for Research
Offload research to sub-agents to keep main context clean:

```
// Instead of reading 20 files in main context:
Agent(subagent_type="Explore", prompt="Find all API endpoint definitions")

// The agent researches and returns a summary
// Main context only gets the summary, not all file contents
```

### 4. Targeted File Reads
```
// Bad: Read entire large file
Read(file_path="/path/to/large-file.ts")

// Good: Read specific section
Read(file_path="/path/to/large-file.ts", offset=100, limit=50)

// Good: Search first, then read specific matches
Grep(pattern="function authenticate", path="/path/to/")
```

### 5. Background Tasks
Long-running operations in background don't consume main context:
```
Agent(run_in_background=true, ...)
Bash(command="npm test", run_in_background=true)
```

## Context Consumption by Tool

### High Context Consumers
| Tool | Context Impact | Mitigation |
|------|---------------|------------|
| Read (large files) | Very High | Use offset/limit |
| Bash (verbose output) | High | Pipe through head/tail |
| Grep (many matches) | High | Use head_limit |
| Agent (results) | Medium-High | Agent summarizes internally |

### Low Context Consumers
| Tool | Context Impact |
|------|---------------|
| Glob | Low (just file paths) |
| Write | Low (content sent, not echoed back) |
| Edit | Low (just the diff) |
| TodoWrite | Very Low |
| AskUserQuestion | Very Low |

## Conversation Flow Patterns

### Focused Session
```
1. /clear (fresh start)
2. State the objective clearly
3. Claude researches and plans
4. Claude implements
5. Claude tests
6. Session ends
```

### Long Session with Multiple Tasks
```
1. Task A work
2. /compact (preserve Task A context)
3. Task B work
4. /compact (preserve A+B context)
5. Task C work
6. ...
```

### Research-Heavy Session
```
1. Spawn research agents (background)
2. Work on other tasks while agents research
3. Agents return summaries
4. Synthesize findings
5. Implement based on research
```

## Auto-Memory

Claude Code can automatically save important context across sessions:

### What Gets Saved
- Project structure discoveries
- User preferences
- Recurring patterns
- Key file paths
- Configuration details

### Memory Location
- `~/.claude/projects/<project>/memory/MEMORY.md` — Auto-loaded
- Additional topic files in same directory

### Controlling Auto-Memory
```bash
# Disable auto-memory
export DISABLE_AUTOMEMORY=1

# Or in settings.json
{ "autoMemory": false }
```

### Manual Memory Commands
```
/memory              # View current memories
/memory add <text>   # Add memory entry
/memory clear        # Clear all memories

# In conversation
"Remember that we always use pnpm, not npm"
"Forget the previous instruction about yarn"
```

## Token Usage Tracking

### /cost Command
Shows current session costs:
```
/cost
```
Output includes:
- Input tokens used
- Output tokens used
- Cache read/write tokens
- Estimated cost in USD

### Reducing Costs
1. Use `/compact` to reduce repeated context
2. Use sub-agents for exploration
3. Use `claude-haiku-4-5` for simple tasks (`/model claude-haiku-4-5-20251001`)
4. Use targeted reads instead of full file reads
5. Use `Grep` to find specific content instead of reading everything

## Session Management

### Continue Previous Session
```bash
# Resume last conversation
claude --continue
claude -c

# Resume specific session
claude --resume <session-id>
```

### Session ID
```bash
# Set specific session ID
claude --session-id my-session-123
```

### Conversation ID
```bash
# Set conversation ID within session
claude --conversation-id conv-456
```

## Best Practices

1. **Start focused** — State your objective clearly upfront
2. **Compact regularly** — Don't wait for auto-compact
3. **Use sub-agents** — Keep research out of main context
4. **Read selectively** — Use offset/limit for large files
5. **Clear between tasks** — `/clear` for unrelated work
6. **Track costs** — Use `/cost` periodically
7. **Leverage memory** — Save important discoveries for future sessions
8. **Background long tasks** — Use `run_in_background` for slow operations
