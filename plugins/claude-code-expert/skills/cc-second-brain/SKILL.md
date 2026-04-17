---
name: cc-second-brain
description: Manage the three-tier memory system (engram + Obsidian vault + plugin rules) for Claude Code setups. Use this skill whenever saving CC-setup findings, consolidating engram into durable knowledge, writing repo docs to the Obsidian vault, or running /cc-memory subcommands. Triggers on phrases like "save this pattern", "promote to memory", "update the vault", "consolidate memory", "write an ADR", and whenever work on CC plugins, hooks, agents, skills, or autonomy profiles concludes.
---

# CC Second Brain

Three-tier memory: **engram (working)** + **Obsidian vault (durable)** + **plugin rules (baseline)**. Full separation-of-concerns in [conventions.md](../../memory/conventions.md) and [topic-key-taxonomy.md](references/topic-key-taxonomy.md).

## Tier routing — decision tree

```
Did work just conclude?
│
├─ Is it a one-off observation, decision, or discovery?
│   └─ YES → engram (tier 1) — mem_save with CC topic_key (see taxonomy)
│
├─ Is it a reusable pattern (used or useful in ≥ 2 repos)?
│   └─ YES → Obsidian (tier 2) — Research/Claude-Code/Patterns/{slug}.md
│            with frontmatter auto_generated: false if user-curated
│
├─ Is it repo-specific durable knowledge?
│   └─ YES → Obsidian (tier 2) — Repositories/{org}/{repo}.md
│            or Decisions/NNNN-title.md for ADRs
│
└─ Is it a rule every consumer-repo Claude should follow?
    └─ YES → plugin rules (tier 3) — memory/rules/cc-always.md
             (only the plugin maintainer edits this)
```

## Engram — tier 1 write pattern

Call `mem_save` with CC topic_key. See [topic-key-taxonomy.md](references/topic-key-taxonomy.md) for full prefix table.

**Required:** `title`, `content` (**What/Why/Where/Learned** format).
**Recommended:** `topic_key` starting with `cc/*`, `type` (decision/bugfix/architecture/discovery/pattern/config/preference), `scope` (project or personal).

**Examples:**

```
mem_save({
  title: "Chose protect-sensitive-files hook for all new setups",
  type: "decision",
  topic_key: "cc/hooks/protect-sensitive-files",
  content: "**What**: Default install on every /cc-setup run\n**Why**: Prevents writes to .env / credentials / keys\n**Where**: memory/rules/cc-always.md\n**Learned**: Hook matcher Write|Edit is correct — don't also match MultiEdit, it inherits"
})
```

## Obsidian — tier 2 write pattern

**Preferred**: use Obsidian MCP tools (`mcp__obsidian__*`) if loaded — they append/update via the Local REST API.

**Fallback**: direct Write tool at vault paths.

**Auto-generated note frontmatter (consolidator only):**

```yaml
---
auto_generated: true
source: engram
topic_key: cc/patterns/{slug}
reinforcement_count: 7
first_seen: 2026-04-09
last_updated: 2026-04-16
tags: [claude-code, pattern, auto]
---
```

**User-curated note frontmatter:**

```yaml
---
title: {short title}
created: {YYYY-MM-DD}
tags: [claude-code, type/pattern]
---
```

**Durability invariant:** notes WITHOUT `auto_generated: true` are user-curated. Consolidator never overwrites them. If you're writing a note on behalf of the user, use `auto_generated: false` explicitly.

## Plugin rules — tier 3 write pattern

`memory/rules/cc-always.md` — user-only (edit via `/cc-memory edit-always`).
`memory/rules/cc-patterns.md` — consolidator-only.
`memory/rules/DRAFT.md` — consolidator-only (conflicts).

Do NOT hand-edit `cc-patterns.md` or `DRAFT.md` — the consolidator owns them.

## Querying the tiers

| Need | Tool |
|---|---|
| "Have we solved this before?" | `mem_search` with cc/ prefix hint → `mem_context` for recent history |
| "What's the current rule for X?" | Read `memory/rules/cc-always.md` and `memory/rules/cc-patterns.md` |
| "What patterns exist for Y?" | Obsidian MCP search or Grep on `Research/Claude-Code/Patterns/` |
| "What does this repo know?" | Read `Repositories/{org}/{repo}.md` first |

## /cc-memory subcommands

| Subcommand | Action |
|---|---|
| `search <query>` | engram `mem_search` scoped to `cc/*` keys |
| `export [--domain ...]` | write human digest to `memory/digests/{date}.md` |
| `consolidate` | run consolidator: engram → Obsidian + cc-patterns.md |
| `edit-always` | open `memory/rules/cc-always.md` |
| `review` | open `memory/rules/DRAFT.md` (conflicts) |
| `status` | show: last consolidation, pattern count, draft count, cc/* observation count |

## MCP tools the consolidator uses (READ-ONLY on engram)

| Tool | Used for |
|---|---|
| `mem_search` | Find cc/* observations |
| `mem_get_observation` | Fetch full content of a match |
| `mem_context` | Recent session context for timing |

**NEVER** used by the consolidator: `mem_save`, `mem_update`, `mem_delete`. Those are Claude-in-session or user-manual operations only.

## Common anti-patterns

- Saving to engram without a topic_key for CC work → consolidator can't group observations → pattern never promotes.
- Writing to `Repositories/{org}/{repo}.md` with `auto_generated: true` when it's actually hand-curated → consolidator will overwrite it later.
- Editing `memory/rules/cc-patterns.md` by hand → consolidator will clobber your edits on next run. Put hand-curation in `cc-always.md`.
- Skipping `mem_session_summary` at end of session → next session starts blind; consolidator has less to work with.
