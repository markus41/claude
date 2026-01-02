# Claude Orchestration

**Budget:** 100K tokens | **Protocol:** EXPLORE > PLAN > CODE > TEST > FIX > DOCUMENT

## Quick Reference

| Resource | Location |
|----------|----------|
| Full Docs | `[[System/Claude-Instructions/*]]` in Obsidian |
| Agents | `.claude/registry/agents.minimal.json` |
| GitHub Backup | `github.com/markus41/obsidian/blob/main/System/Claude-Instructions/` |

## Rules

- **Sub-agents:** 3-5 minimum (13 max)
- **Testing:** REQUIRED before completion
- **Docs:** Obsidian vault only
- **Context7:** ALWAYS for library docs

## Models

| Model | Use |
|-------|-----|
| opus | Architecture, planning |
| sonnet | Development, analysis |
| haiku | Docs, fast tasks |

## Load On-Demand

```python
mcp__obsidian__get_file_contents("System/Claude-Instructions/{doc}.md")
```

**Docs:** Orchestration-Protocol, MCP-Servers, Agent-Categories, Workflows, Skills-and-Commands

## Command Context Optimization

**Issue:** Slash commands running out of context space.

**Solution:** Commands should load minimal context:
- ✅ Command file only (~200-500 tokens)
- ✅ Minimal CLAUDE.md (~1,000 tokens)
- ❌ NOT full commands.index.json (use queries instead)
- ❌ NOT CLAUDE.full.md (use Obsidian for full docs)
- ❌ NOT all agent definitions (load on-demand via Obsidian MCP)

**See:** `.claude/docs/COMMAND-CONTEXT-OPTIMIZATION.md` for full guide.

**Quick Fix:** When executing commands:
1. Load only the specific command file
2. Query registry for metadata (don't load full index)
3. Load external resources via Obsidian MCP when needed
4. Enforce 2,000 token budget per command