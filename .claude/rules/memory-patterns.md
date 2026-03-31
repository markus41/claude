# Recurring Patterns — Memory

## Plugin Structure

Every plugin follows this directory layout:

```
plugins/<plugin-name>/
  .claude-plugin/
    plugin.json          # Manifest: name, version, commands, skills, agents, hooks
  commands/
    index.json           # Command registry
    <command>.md         # Command definition
  skills/
    <skill-name>/
      SKILL.md           # Skill definition with frontmatter
  agents/
    index.json           # Agent registry
    <agent>.md           # Agent definition with YAML frontmatter
  hooks/                 # Optional: plugin-specific hooks
  docs/                  # Optional: plugin documentation
```

## Hook Pattern

Hook scripts follow this contract:

1. Read JSON context from stdin
2. Parse with `jq` (never string matching)
3. Perform validation or side-effect
4. Write JSON to stdout: `{"decision": "approve"}` or `{"decision": "block", "reason": "..."}`
5. Exit 0 for a valid response, non-zero for errors

```bash
#!/usr/bin/env bash
set -euo pipefail
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
# ... validation logic ...
echo '{"decision": "approve"}'
```

## Skill Pattern

Skills use `SKILL.md` with YAML frontmatter:

```markdown
---
description: Brief description of what this skill does
model: sonnet|opus|haiku
allowed-tools:
  - Read
  - Grep
  - Bash
---
# Skill Name
Instructions for the skill...
```

## Agent Pattern

Agents use `.md` files with YAML frontmatter:

```markdown
---
name: agent-name
description: What this agent specializes in
model: opus|sonnet|haiku
allowed-tools:
  - Read
  - Grep
  - Bash
---
# Agent Name
Role description and instructions...
```

## MCP Server Registration

MCP servers are registered in `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": { "KEY": "value" }
    }
  }
}
```

## State Store Pattern (Zustand)

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface StoreState {
  items: Item[];
  addItem: (item: Item) => void;
}

export const useStore = create<StoreState>()(
  immer((set) => ({
    items: [],
    addItem: (item) => set((state) => { state.items.push(item); }),
  }))
);
```

## Component Pattern (React)

- Functional components with TypeScript interfaces for props
- Use `React.FC` sparingly — prefer explicit return types
- Co-locate styles with components (Tailwind classes or CSS modules)
- Extract hooks for reusable logic into `src/hooks/`
