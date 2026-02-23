# Project Instructions

## Workflow Protocol
EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT

## Build & Test
- Install: `pnpm install`
- Test: `pnpm test` or `npm test`
- Type check: `npx tsc --noEmit`
- Lint: `npx eslint .`

## Key Commands
- Use subagents for research (preserves main context)
- Use `/compact` when context gets large
- Use `/clear` between unrelated tasks

## Research
- Use Perplexity MCP for web knowledge queries
- Use Firecrawl MCP for scraping specific URLs
- Use Context7 MCP for library documentation
- Check lessons-learned before starting: `.claude/rules/lessons-learned.md`

## Models
| Model | Use |
|-------|-----|
| opus | Architecture, complex decisions |
| sonnet | Development, implementation |
| haiku | Research, fast lookups, docs |

## Self-Healing
When you encounter an error:
1. Fix the issue
2. Update `.claude/rules/lessons-learned.md` with the fix
3. If it reveals a pattern, update the appropriate rule in `.claude/rules/`

## Important Paths
- Rules: `.claude/rules/` (modular, path-scoped instructions)
- Skills: `.claude/skills/` (reusable workflows)
- Agents: `.claude/agents/` (specialized subagents)
- Hooks: `.claude/hooks/` (automated lifecycle actions)
- Plugins: `plugins/` (installed plugin directories)
