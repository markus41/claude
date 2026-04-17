# Obsidian Vault — Knowledge Library

> Instructs Claude in consumer repos to use the user's Obsidian vault as the durable knowledge layer. Copied into each consumer repo by `/cc-setup`.
>
> User-curated only. Consolidator never writes here.

## Where it lives

`C:\Users\MarkusAhling\obsidian\` — the user's central documentation hub across all repositories. Declared as "CENTRAL DOCUMENTATION HUB" in the vault's own CLAUDE.md.

## How to access

**Preferred:** Obsidian MCP — if `mcp__obsidian__*` tools are loaded, use them. They provide append/read/search against the live vault.

**Fallback:** direct file read/write at the absolute path above. Safe when the vault is not open in the Obsidian app.

## When to write to the vault

Write a durable note when:

- A repo-specific architectural decision is made → `Repositories/{org}/{repo}/Decisions/{NNNN}-{title}.md`
- A reusable pattern emerges (used across ≥2 repos or worth re-reading) → `Research/{area}/{topic}.md`
- A project kicks off → `Projects/{project}/README.md`
- Substantive repo setup work completes → update `Repositories/{org}/{repo}.md`

Do not write to the vault for:

- Single-session observations (use engram instead)
- Debugging notes that will be stale in a week
- Personal preferences (those live in user's global `~/.claude/CLAUDE.md`)

## Frontmatter for notes you create

User-curated notes:

```yaml
---
title: {short title}
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
tags: [type/...]
---
```

Never add `auto_generated: true` to a note you're creating on behalf of the user — that flag is reserved for consolidator-generated notes and makes them overwritable.

## Wikilinks

Cross-reference using `[[path/to/note]]` so the vault's graph view stays useful.

## Search

Before starting work on a repo or topic, check the vault for prior work. A quick `Grep` on the vault path or an Obsidian MCP search is cheaper than redoing someone else's thinking.
