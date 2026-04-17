# Memory Conventions — claude-code-expert v8

The plugin's memory system is **three-tier**. This file documents the separation of concerns. Reading this once is enough — the `cc-second-brain` skill enforces it at runtime.

## Tier 1 — engram (working memory)

**Who writes:** Claude, proactively, on every decision / bug / discovery / convention.
**Who reads:** Claude via `mem_search`, `mem_context`, `mem_get_observation`.
**Format:** follow engram's `What / Why / Where / Learned` structure.
**CC topic_key prefix** (advisory, makes consolidation queryable):

| Domain | Prefix | Example |
|---|---|---|
| Plugin config | `cc/plugin/{name}/{aspect}` | `cc/plugin/claude-code-expert/skill-consolidation` |
| Hook pack | `cc/hooks/{pack}` | `cc/hooks/protect-sensitive-files` |
| Autonomy profile | `cc/autonomy/{profile}` | `cc/autonomy/balanced` |
| Agent topology | `cc/topology/{kit}` | `cc/topology/architect-implementer-reviewer` |
| MCP server | `cc/mcp/{server}/{aspect}` | `cc/mcp/context7/setup` |
| Workflow pack | `cc/workflow/{name}` | `cc/workflow/tdd-implementation` |
| Repo fingerprint | `cc/repo/{slug}/{aspect}` | `cc/repo/taia-a4/stack-detected` |

**Restriction:** nothing restricts what Claude saves to engram. Save freely.

## Tier 2 — Obsidian vault (durable knowledge)

**Location:** `C:/Users/MarkusAhling/obsidian/`
**Access:** Obsidian MCP (Local REST API plugin on port 27123) or direct file write.
**Who writes:** (a) user in the Obsidian app, (b) `memory-consolidator` agent for auto-generated notes.
**Who reads:** Claude via Obsidian MCP or file read; user in the Obsidian app.

**Structure:**

| Content | Path |
|---|---|
| Reusable CC pattern | `Research/Claude-Code/Patterns/{slug}.md` |
| Per-repo docs | `Repositories/{org}/{repo}.md` |
| ADRs | `Repositories/{org}/{repo}/Decisions/{NNNN}-{title}.md` |
| Plugin knowledge | `Repositories/markus41/claude-code-expert.md` |
| Consolidator inbox | `Projects/Claude-Code-Inbox/{YYYY-MM-DD}.md` |

**Frontmatter for auto-generated notes:**

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

**Durability invariant:** a note without `auto_generated: true` (missing the key, or `false`) is **user-curated** — consolidator never overwrites it. This is the only safety the user has; it is non-negotiable.

## Tier 3 — plugin rules (baseline)

**Location:** `memory/rules/` inside this plugin.
**Who writes:** plugin maintainer via `/cc-memory edit-always`; `memory-consolidator` for `cc-patterns.md` / `DRAFT.md` / `consolidate.log` only.
**Who reads:** `/cc-setup` copies these into consumer repos as `.claude/rules/*`.

| File | Editor | Lifecycle |
|---|---|---|
| `rules/cc-always.md` | user only | hard rules; ships with plugin |
| `rules/cc-obsidian-intro.md` | user only | consumer-repo intro to vault |
| `rules/cc-patterns.md` | consolidator only | promoted patterns (≥3× reinforced) |
| `rules/DRAFT.md` | consolidator only | conflicts awaiting review |
| `consolidate.log` | consolidator only | append-only audit |
| `digests/*.md` | `/cc-memory export` | human digests |
| `conventions.md` | user only | this file |

## Write path summary (who can touch what)

| Actor | engram | Obsidian | `memory/rules/cc-always.md` | `memory/rules/cc-obsidian-intro.md` | `memory/rules/cc-patterns.md` | `memory/rules/DRAFT.md` | `memory/consolidate.log` | `memory/digests/` |
|---|---|---|---|---|---|---|---|---|
| Claude (session) | **write** (free) | read | read | read | read | — | — | — |
| `memory-consolidator` | read only | **write** (only if auto_generated:true) | — | — | **write** | **write** | **write** | — |
| User | write via `/cc-memory` | write (any note) | **write** | **write** | — | review | — | — |
| `/cc-memory export` | read | read | — | — | — | — | — | **write** |

## When in doubt

1. Is this a one-off observation with a topic_key? → **engram**.
2. Is this a reusable pattern worth linking to other notes? → **Obsidian**.
3. Does every consumer repo need this rule at setup time? → **`memory/rules/cc-always.md`**.
