# API Guidelines

## MCP Protocol Conventions

- All MCP tools communicate via JSON-RPC 2.0 over stdio
- Tool names use `snake_case` with a namespace prefix (e.g., `deploy_audit`)
- Parameters are a flat JSON object; avoid deep nesting
- Return values are JSON with a `content` array of `text` or `image` blocks

## Response Format

```json
{
  "content": [
    { "type": "text", "text": "result string or JSON" }
  ]
}
```

## Error Handling

- Return errors as text content with a clear message, not as JSON-RPC errors
- Include actionable fix suggestions in error text when possible
- MCP servers should not crash on bad input; return a descriptive error instead

## Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| MCP tool | `snake_case` | `quality_lint` |
| Slash command | `kebab-case` | `/cc-setup` |
| Plugin directory | `kebab-case` | `claude-code-expert` |
| Agent file | `kebab-case.md` | `code-reviewer.md` |
| Skill directory | `kebab-case/SKILL.md` | `framer-motion/SKILL.md` |

## Versioning

<!-- Fill in: API versioning strategy, backwards compatibility rules -->

## Rate Limiting

<!-- Fill in: Any rate limiting on MCP tool calls or external APIs -->
