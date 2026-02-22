#!/bin/bash
# SessionStart hook - loads context on new sessions
# Writes to CLAUDE_ENV_FILE for persistent env vars

INPUT=$(cat)
SOURCE=$(echo "$INPUT" | jq -r '.source // "startup"')

# Set useful env vars for the session
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export PROJECT_ROOT="'"$CLAUDE_PROJECT_DIR"'"' >> "$CLAUDE_ENV_FILE"
fi

# Output context for Claude
cat <<'CONTEXT'
Project: Neural Orchestration Platform
Key paths:
- Plugins: plugins/ and .claude/plugins/
- Skills: .claude/skills/
- Agents: .claude/agents/
- Rules: .claude/rules/
- Hooks: .claude/hooks/
- MCP config: .mcp.json

Research tools available:
- Perplexity MCP: Use mcp__perplexity__* for web research
- Firecrawl MCP: Use mcp__firecrawl__* for web scraping
- Context7 MCP: Use for library documentation

Self-learning: Check .claude/rules/lessons-learned.md for known issues and fixes.
CONTEXT

exit 0
