# Memory Architecture — Three Tiers

The v8 "second brain" design. Claude Code already had engram (global MCP working memory). The user already had Obsidian set up as a central documentation hub. v8 bridges them into a coherent memory system with strict write discipline.

## Why three tiers

Single-store memory systems under-use available primitives:

- **engram only** → no human-browsable layer, no graph view, no durable curation
- **Obsidian only** → high friction to write, not suitable for high-frequency proactive capture
- **Plugin rules only** → not learning, just static config

Three tiers give each primitive the role it's best at.

## Tier 1 — engram (working memory)

- **What**: every decision, bug fix, discovery, convention Claude encounters.
- **Store**: SQLite + FTS5 via engram global MCP. Already ALWAYS ACTIVE via `SessionStart` hook.
- **Writer**: Claude proactively. Protocol unchanged from engram's existing always-active hook.
- **Reader**: Claude via `mem_search` / `mem_context` / `mem_get_observation`.
- **Convention**: CC-scoped observations use `topic_key` with `cc/*` prefix. Taxonomy in [`../skills/cc-second-brain/references/topic-key-taxonomy.md`](../skills/cc-second-brain/references/topic-key-taxonomy.md).
- **Discipline**: no restriction. Save freely. The prefix convention is advisory.

## Tier 2 — Obsidian vault (durable knowledge)

- **What**: curated, wiki-linked, cross-session knowledge.
- **Store**: Markdown files in `C:/Users/MarkusAhling/obsidian/`.
- **Writer**: (a) user in Obsidian app — freely, (b) `memory-consolidator` agent — for auto-generated notes only.
- **Reader**: Claude via Obsidian MCP (`mcp__obsidian__*`) or direct file access.
- **Structure**:
  - `Research/Claude-Code/Patterns/{slug}.md` — consolidator-promoted reusable patterns
  - `Repositories/{org}/{repo}.md` — per-repo docs (existing vault convention)
  - `Repositories/{org}/{repo}/Decisions/{NNNN}-{title}.md` — ADRs
  - `Projects/{project}/*.md` — active project docs
  - `Projects/Claude-Code-Inbox/{YYYY-MM-DD}.md` — consolidator inbox for weekly user review
- **User-protection invariant** (the whole safety model): a note missing `auto_generated: true` (or with `auto_generated: false`) is **user-curated** and the consolidator **never overwrites it**. This is non-negotiable.

### Auto-generated note frontmatter

```yaml
---
auto_generated: true
source: engram
topic_key: cc/...
reinforcement_count: N
first_seen: YYYY-MM-DD
last_updated: YYYY-MM-DD
tags: [claude-code, pattern, auto]
---
```

### User-curated note frontmatter

```yaml
---
title: {short title}
created: {YYYY-MM-DD}
tags: [claude-code, type/pattern]
---
```

Never add `auto_generated: true` to a user-curated note. Once the flag is there, the note is overwritable.

## Tier 3 — plugin rules (baseline)

- **What**: hard rules and promoted patterns that `/cc-setup` copies into every consumer repo.
- **Store**: `memory/rules/` in this plugin, git-versioned with plugin releases.
- **Writer**: plugin maintainer via `/cc-memory edit-always`; consolidator for `cc-patterns.md` / `DRAFT.md` / `consolidate.log` only.
- **Reader**: `/cc-setup` copies into target repo's `.claude/rules/`.

### Files

| File | Editor | Lifecycle |
|---|---|---|
| `rules/cc-always.md` | **user only** | Hard rules; ships with plugin releases |
| `rules/cc-obsidian-intro.md` | **user only** | Consumer-repo intro to vault |
| `rules/cc-patterns.md` | consolidator only | Promoted patterns (reinforcement ≥3×) |
| `rules/DRAFT.md` | consolidator only | Conflicts awaiting user review |
| `consolidate.log` | consolidator only | Append-only JSON-lines audit |
| `digests/*.md` | `/cc-memory export` | Human digests |
| `conventions.md` | user only | The write discipline itself |

## The consolidator — bridge between tiers

`memory-consolidator` agent (Opus, read-only on engram). Flow:

1. Queries engram with `cc/*` prefix filter (`mem_search`).
2. Groups matches by exact `topic_key`.
3. Classifies each group:
   - **≥ 3 observations + no conflicts** → promote
   - **≥ 2 with one dissent** → draft (conflict)
   - **< 3** → watchlist (DRAFT.md, note "insufficient reinforcement")
4. For promotable groups:
   a. Checks if target Obsidian note exists + has `auto_generated: true` → if user-curated, skip + draft.
   b. Writes the Obsidian note with full frontmatter.
   c. Appends/updates a one-line pointer in `memory/rules/cc-patterns.md`.
5. Writes conflicts to `memory/rules/DRAFT.md`.
6. Appends JSON log line to `memory/consolidate.log`.

### What the consolidator cannot do

- Write to engram (`mem_save`, `mem_update`, `mem_delete` are forbidden).
- Overwrite Obsidian notes without `auto_generated: true`.
- Edit `memory/rules/cc-always.md` or `cc-obsidian-intro.md` (user-curated only).
- Run without being explicitly invoked (via `/cc-memory consolidate` or a scheduled task).

## Flow end-to-end

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Claude saves to engram proactively                       │
│    mem_save(topic_key="cc/hooks/protect-sensitive-files",   │
│             content="What/Why/Where/Learned")               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼  (any time, user-invoked or scheduled)
┌─────────────────────────────────────────────────────────────┐
│ 2. /cc-memory consolidate → memory-consolidator agent       │
│    reads engram (mem_search with cc/* prefix)               │
│    groups by topic_key                                      │
│    checks ≥3 reinforcements                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Writes auto-generated Obsidian note:                     │
│    Research/Claude-Code/Patterns/hook-protect-sensitive.md  │
│    (auto_generated: true frontmatter)                       │
│                                                             │
│    Appends to memory/rules/cc-patterns.md:                  │
│    - cc/hooks/protect-sensitive-files (seen 5×) →           │
│      [[Research/Claude-Code/Patterns/hook-protect-...]]     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼  (next time /cc-setup runs anywhere)
┌─────────────────────────────────────────────────────────────┐
│ 4. /cc-setup copies memory/rules/cc-patterns.md             │
│    into target repo's .claude/rules/cc-patterns.md          │
│                                                             │
│    Target repo's CLAUDE.md @-references it → auto-loaded    │
│    → new repo's Claude already knows the pattern            │
└─────────────────────────────────────────────────────────────┘
```

## Querying from a session

| Need | Where to look |
|---|---|
| "Have we solved this CC setup problem before?" | `mem_search` with `cc/*` prefix hint |
| "What's the current rule for X?" | `.claude/rules/cc-always.md` + `.claude/rules/cc-patterns.md` |
| "What patterns exist for Y?" | Obsidian MCP search or direct read of `Research/Claude-Code/Patterns/` |
| "What does this repo know?" | `C:/Users/MarkusAhling/obsidian/Repositories/{org}/{repo}.md` |

## FAQ

**Q: Do I need Obsidian installed for this to work?**
A: Obsidian makes tier 2 richer (UI, graph, plugins). But the consolidator falls back to direct file writes if the MCP isn't available — as long as the vault path (`C:/Users/MarkusAhling/obsidian/`) exists. If the path doesn't exist, the consolidator falls further back to text-only updates of `memory/rules/cc-patterns.md` and logs a warning.

**Q: Can I disable the consolidator?**
A: It doesn't run automatically in v8.0 — it's on-demand (`/cc-memory consolidate`) or via the native `schedule` skill. If you don't call it, it does nothing.

**Q: What happens to my hand-curated Obsidian notes?**
A: They're safe as long as they don't have `auto_generated: true` frontmatter. The consolidator reads them but never overwrites them. If you want to prevent even reads, put them outside the `auto_generated:true`-expected paths.

**Q: What if I put `auto_generated: true` on a note and then edit it by hand?**
A: The consolidator will eventually overwrite your edits. Change the frontmatter to `auto_generated: false` if you've taken over maintenance of the note.
