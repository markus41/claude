# /cc-memory — Hybrid Memory Architecture for Claude Code

Configure persistent memory that survives across sessions using a layered approach:
split rule files for always-loaded context, auto-memory for organic learning, and
optional MCP-backed long-term memory for large codebases.

## Usage

```bash
/cc-memory                      # Interactive setup
/cc-memory --init                # Initialize split memory architecture
/cc-memory --status              # Show memory usage, file sizes, token estimates
/cc-memory --rotate              # Archive old session summaries
/cc-memory --audit               # Check for bloat, duplicates, stale entries
/cc-memory --mcp                 # Set up MCP-backed persistent memory server
/cc-memory --dry-run             # Show what would be created without writing
```

---

## The Memory Problem

Claude Code provides `MEMORY.md` (first 200 lines loaded per session), but this has limits:

- **200-line cap**: Only the first 200 lines are loaded — anything beyond is silently ignored
- **Single file**: Everything competes for space — project identity, preferences, decisions, patterns
- **No semantic search**: Claude can't query past memories, only read what's loaded
- **No session continuity**: Each session starts fresh with no awareness of what happened yesterday

## The Solution: 3-Tier Memory Architecture

### Tier 1: Split Rule Files (Always Loaded)

Files in `.claude/rules/` are auto-loaded every session with no line limit per file.
Split memory by purpose instead of cramming into one MEMORY.md:

```
.claude/rules/
├── memory-profile.md        # Project identity, team, domains
├── memory-preferences.md    # User workflow preferences
├── memory-decisions.md      # Architecture Decision Records
├── memory-patterns.md       # Recurring code patterns & solutions
├── memory-sessions.md       # Recent session summaries (rotated)
└── lessons-learned.md       # Auto-captured errors and fixes
```

#### memory-profile.md
```markdown
# Project Profile

- **Name**: {project_name}
- **Type**: {web app / API / CLI / library / monorepo}
- **Team**: {team_size, roles}
- **Domains**: {business domains}
- **Repo**: {repo_url}
- **Primary language**: {language}
- **Framework**: {framework}
- **Deploy target**: {cloud / on-prem / hybrid}
```

#### memory-preferences.md
```markdown
# User Preferences

## Workflow
- Always use {package_manager} (never npm/yarn)
- Commit style: conventional commits with scope
- PR strategy: one commit per PR, squash on merge
- Test first: write tests before implementation

## Communication
- Be concise — lead with the answer
- No emojis unless asked
- Show file:line references for code

## Tools
- Preferred model: Sonnet for coding, Opus for architecture
- Always run tests before committing
- Use subagents for research to preserve context
```

#### memory-decisions.md
```markdown
# Architecture Decision Records

## ADR-001: {decision_title}
- **Date**: {date}
- **Status**: accepted
- **Context**: {why the decision was needed}
- **Decision**: {what was decided}
- **Consequences**: {trade-offs and implications}

<!-- Add new ADRs at the top. Keep to 3-5 lines each. -->
```

#### memory-patterns.md
```markdown
# Recurring Patterns & Solutions

## Pattern: {pattern_name}
- **Context**: {when this comes up}
- **Solution**: {what works}
- **Anti-pattern**: {what to avoid}
- **Files**: {relevant file paths}
```

#### memory-sessions.md
```markdown
# Recent Session Summaries

## {date} — {session_title}
- **Goal**: {what was attempted}
- **Outcome**: {what was achieved}
- **Key changes**: {files modified}
- **Decisions**: {any ADRs created}
- **Next**: {follow-up tasks}

<!-- Keep last 10 sessions. Rotate older to archive. -->
```

### Tier 2: Auto-Memory (Organic Learning)

Claude's built-in auto-memory writes to `MEMORY.md`. With split rule files handling
structured memory, keep `MEMORY.md` lean for organic observations:

```markdown
# MEMORY.md — Organic Observations

<!-- Auto-maintained by Claude. Keep under 150 lines. -->
<!-- Structured memory lives in .claude/rules/memory-*.md -->

## Project Patterns
- {organically discovered patterns}

## Build Notes
- {build quirks, environment issues}

## People & Process
- {team conventions observed in code}
```

### Tier 3: MCP-Backed Long-Term Memory (For Large Projects)

For projects with 100k+ LOC or multi-repo setups, add an MCP memory server
for semantic search across sessions.

#### Option A: claude-memory-mcp (Recommended)

```bash
# Install
claude mcp add --scope project memory-server -- npx -y claude-memory-mcp

# Or manually in .mcp.json:
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "claude-memory-mcp"],
      "disabled": false
    }
  }
}
```

Features:
- Auto-captures interactions and stores embeddings locally
- Semantic search for relevant past context
- No cloud dependency — runs locally with SQLite + embeddings
- Lifecycle hooks for session-start retrieval and session-end summarization

#### Option B: code-memory (Offline, Local)

```bash
claude mcp add --scope project code-memory -- npx -y code-memory-mcp
```

Features:
- Offline-only, no external API calls
- Reduces context bloat by storing and retrieving intelligently
- Good for air-gapped environments

#### Option C: Basic Memory Server (Official)

```bash
claude mcp add --scope project memory -- npx -y @modelcontextprotocol/server-memory
```

Features:
- Simple key-value memory with file-based persistence
- Lightweight but no semantic search
- Good starting point

### Memory MCP Lifecycle Hooks

When using Tier 3 memory, set up these hooks for automatic memory management:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/memory-retrieve.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/memory-observe.sh"
      }]
    }],
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/memory-summarize.sh"
      }]
    }]
  }
}
```

#### memory-retrieve.sh
```bash
#!/bin/bash
# On session start, retrieve recent memories
echo "Loading recent memories..." >&2
# MCP memory server will be queried by Claude automatically
# This hook just logs that memory is available
echo '{"decision": "approve"}'
```

#### memory-observe.sh
```bash
#!/bin/bash
# After file edits, note what changed for memory
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
if [ -n "$FILE" ] && [ "$FILE" != "null" ]; then
  echo "Memory: noted change to $FILE" >&2
fi
echo '{"decision": "approve"}'
```

#### memory-summarize.sh
```bash
#!/bin/bash
# On stop, prompt Claude to update session memory
echo "Consider updating .claude/rules/memory-sessions.md with session summary" >&2
echo '{"decision": "approve"}'
```

---

## Memory Rotation

Over time, `memory-sessions.md` grows. Rotate it:

```bash
# When /cc-memory --rotate is invoked:
# 1. Keep last 10 session entries in memory-sessions.md
# 2. Archive older entries to .claude/memory-archive/{year}-{month}.md
# 3. Update memory-patterns.md with any recurring patterns from archived sessions
# 4. Prune memory-decisions.md of superseded ADRs
```

Archive structure:
```
.claude/
├── rules/
│   ├── memory-sessions.md       # Last 10 sessions
│   └── memory-patterns.md       # Current patterns
└── memory-archive/
    ├── 2026-01.md               # January sessions
    ├── 2026-02.md               # February sessions
    └── 2026-03.md               # March sessions
```

---

## Memory Audit

When `/cc-memory --audit` is invoked, check for:

| Check | Action |
|-------|--------|
| Total token estimate across all memory files | Warn if >10k tokens |
| Duplicate entries across files | Flag and suggest dedup |
| Stale entries (referenced files no longer exist) | Flag for removal |
| MEMORY.md exceeds 200 lines | Warn — lines beyond 200 are invisible |
| memory-sessions.md exceeds 50 entries | Suggest rotation |
| lessons-learned.md NEEDS_FIX entries older than 7 days | Prompt resolution |
| memory-decisions.md has superseded ADRs | Suggest archival |

Output format:
```
=== Memory Audit ===

Files:
  memory-profile.md       12 lines    ~200 tokens    ✓ OK
  memory-preferences.md   18 lines    ~300 tokens    ✓ OK
  memory-decisions.md     45 lines    ~800 tokens    ✓ OK
  memory-patterns.md      28 lines    ~500 tokens    ✓ OK
  memory-sessions.md      67 lines    ~1200 tokens   ⚠ Consider rotating
  lessons-learned.md      120 lines   ~2500 tokens   ⚠ 5 unresolved entries
  MEMORY.md               85 lines    ~1500 tokens   ✓ Under 200-line limit

Total loaded per session: ~7000 tokens
Recommendation: Rotate sessions, resolve lessons-learned entries

Score: 75/100
```

---

## Choosing Your Tier

| Project Size | Recommended Tiers | Why |
|-------------|-------------------|-----|
| Small (<10k LOC) | Tier 1 only | Split rules give enough persistent context |
| Medium (10k-100k) | Tier 1 + Tier 2 | Auto-memory captures organic patterns |
| Large (100k+) | Tier 1 + Tier 2 + Tier 3 | Need semantic search across sessions |
| Multi-repo | Tier 1 + Tier 3 | MCP memory spans repos |
| Team project | Tier 1 (shared) + Tier 2 (personal) | Rules are committed; MEMORY.md is gitignored |

---

## Dry Run Mode

When `/cc-memory --dry-run` is used:

```
=== Memory Setup Plan (Dry Run) ===

Would create:
  .claude/rules/memory-profile.md        (12 lines)
  .claude/rules/memory-preferences.md    (18 lines)
  .claude/rules/memory-decisions.md      (8 lines, template)
  .claude/rules/memory-patterns.md       (8 lines, template)
  .claude/rules/memory-sessions.md       (5 lines, template)

Would modify:
  MEMORY.md                              (trim to <150 lines, add pointer to split files)

Would add to .gitignore:
  .claude/rules/memory-preferences.md    (personal preferences)
  .claude/memory-archive/                (session archives)

MCP recommendation:
  context7 (already installed)           ✓
  memory-server (not installed)          → Would run: claude mcp add ...

Estimated per-session token cost: ~3000 tokens
No files written. Run without --dry-run to apply.
```
