# Context Anchoring System

Preserve critical information across `/compact` events, session boundaries, and agent handoffs.
Context anchoring ensures your most important rules, decisions, and state survive compression.

## What Survives Compaction

```
┌─────────────────────────────────────────────────┐
│              ANCHORED (survives /compact)        │
│                                                  │
│  CLAUDE.md        ← Full file, re-injected      │
│  .claude/rules/*  ← All matching rules reloaded  │
│  MEMORY.md        ← First 200 lines reloaded    │
│  Session metadata ← Project path, git, env       │
│                                                  │
├─────────────────────────────────────────────────┤
│              NOT ANCHORED (summarized away)       │
│                                                  │
│  Conversation turns  ← Compressed to summary    │
│  Tool outputs        ← Discarded or summarized  │
│  MEMORY.md >200 lines ← Not auto-loaded         │
│  Inline instructions  ← Lost after compact      │
│  Variable state       ← Gone unless saved        │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Anchoring Mechanisms

### Mechanism 1: CLAUDE.md (Strongest Anchor)

CLAUDE.md is the **strongest anchor** — fully re-injected after every compaction.

```markdown
# CLAUDE.md — Use for critical, must-not-forget rules

## Build Commands (ANCHORED)
- Install: `pnpm install`
- Test: `pnpm test`

## Architecture Decisions (ANCHORED)
- Always use Context7 before making library decisions
- All agent outputs must be audited before acceptance
```

**Best practice**: Keep CLAUDE.md under 200 lines. Every line has weight because it's always loaded.

### Mechanism 2: Rules Files (Path-Scoped Anchors)

Files in `.claude/rules/` are loaded for matching file types. They survive compaction because they're re-injected from disk, not from conversation history.

```
.claude/rules/
├── architecture.md      ← Global anchor (always loaded)
├── code-style.md        ← Loaded when editing *.ts, *.tsx
├── git-workflow.md      ← Global anchor (always loaded)
├── lessons-learned.md   ← Global anchor (always loaded)
└── research.md          ← Global anchor (always loaded)
```

**Best practice**: Put critical patterns in global rules files (no `paths:` frontmatter). These are always active regardless of what files Claude is working on.

### Mechanism 3: MEMORY.md (200-Line Anchor)

Auto-memory is re-injected after compaction, but only the first 200 lines.

```markdown
# MEMORY.md — Keep under 200 lines

## Critical State (lines 1-50) — ALWAYS LOADED
- Current sprint goal: {goal}
- Active branch: {branch}
- Key decisions: {list}

## Index (lines 51-200) — ALWAYS LOADED
- [Debugging patterns](debugging.md)
- [API conventions](api-conventions.md)
- [Architecture decisions](architecture.md)

## Overflow (lines 201+) — NOT AUTO-LOADED
<!-- Move detailed content to topic files -->
```

**Best practice**: Treat MEMORY.md as an index. Put details in topic files.

### Mechanism 4: PreCompact Hook (State Capture)

Save critical state before compaction happens.

```json
{
  "hooks": {
    "PreCompact": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/anchor-state.sh"
      }]
    }]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/anchor-state.sh
# Save state to a file that Claude can read after compaction

INPUT=$(cat)

# Save current git state
{
  echo "## Anchored State ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo ""
  echo "### Git State"
  echo "- Branch: $(git branch --show-current 2>/dev/null)"
  echo "- Modified: $(git diff --name-only 2>/dev/null | wc -l) files"
  echo "- Staged: $(git diff --cached --name-only 2>/dev/null | wc -l) files"
  echo ""
  echo "### Recent Changes"
  git diff --stat 2>/dev/null | tail -5
} > .claude/anchored-state.md 2>/dev/null

echo "Anchored state saved to .claude/anchored-state.md" >&2
```

### Mechanism 5: PostCompact Hook (State Recovery)

Re-inject critical context after compaction completes.

```bash
#!/bin/bash
# .claude/hooks/recover-state.sh
# Remind Claude about anchored state after compaction

if [ -f ".claude/anchored-state.md" ]; then
  echo "Anchored state available at .claude/anchored-state.md — read it to restore context" >&2
fi
```

### Mechanism 6: Anchor Tags in Rules Files

Use explicit anchor markers in rules files to flag critical content:

```markdown
# .claude/rules/architecture.md

<!-- ANCHOR: critical-patterns -->
## Critical Patterns (Must Not Forget)
- All agent outputs must be audited before acceptance
- Use Context7 before any library/framework decisions
- Perplexity for knowledge queries, Firecrawl for extraction
- Never deploy without running full test suite
<!-- /ANCHOR -->

## Non-Critical Guidelines
- Prefer functional style over OOP
- Use 2-space indentation
```

## Anchoring Strategy by Information Type

| Information | Anchor Location | Survives Compact? |
|-------------|----------------|-------------------|
| Build commands | CLAUDE.md | Yes (always) |
| Code conventions | `.claude/rules/code-style.md` | Yes (when editing code) |
| Architecture decisions | `.claude/rules/architecture.md` | Yes (always) |
| Error patterns | `.claude/rules/lessons-learned.md` | Yes (always) |
| Git workflow | `.claude/rules/git-workflow.md` | Yes (always) |
| Current task state | PreCompact hook → file | Yes (if saved) |
| User preferences | MEMORY.md (first 200 lines) | Yes |
| Session history | Conversation | No (summarized) |
| Tool outputs | Conversation | No (discarded) |
| Inline instructions | Conversation | No (lost) |

## Cross-Agent Anchoring

When agents hand off work, critical context must be anchored:

### Agent-to-Agent State Transfer

```yaml
handoff_protocol:
  before_handoff:
    - Save findings to a shared file (.claude/handoff-state.md)
    - Include: task, findings, decisions, open questions
    - Format: structured markdown with clear sections

  receiving_agent:
    - Read .claude/handoff-state.md before starting work
    - Inherit: decisions and constraints from previous agent
    - Continue: from where previous agent left off

  after_handoff:
    - Delete temporary handoff file
    - Update MEMORY.md with key decisions
```

### Orchestrator Anchor Pattern

The orchestrator maintains a persistent state file:

```markdown
# .claude/orchestration-state.md (updated by orchestrator)

## Active Task: {description}
## Agents Spawned: [{id, type, status}]
## Audit Status: {pass/fail/pending for each agent}
## Key Decisions: [{decision, rationale}]
## Open Questions: [{question, who should answer}]

<!-- Updated after each agent completes -->
<!-- Read by orchestrator after any /compact event -->
```

## Anchoring for Long Sessions

For sessions that will hit compaction multiple times:

### Progressive Anchoring

```
Session Start
  ├─ CLAUDE.md loaded (anchor)
  ├─ Rules loaded (anchor)
  ├─ MEMORY.md loaded (anchor)
  │
  ├─ Phase 1: Research
  │   └─ Save findings → .claude/rules/memory-sessions.md
  │
  ├─ /compact (auto or manual)
  │   ├─ PreCompact: save state → .claude/anchored-state.md
  │   ├─ Compression: conversation summarized
  │   ├─ PostCompact: remind about anchored state
  │   └─ Re-inject: CLAUDE.md + rules + MEMORY.md
  │
  ├─ Phase 2: Implementation
  │   └─ Key decisions → MEMORY.md or rules file
  │
  ├─ /compact (again)
  │   └─ Same cycle — all anchored content persists
  │
  └─ Session End
      └─ Final state → MEMORY.md for next session
```

### Anchor Budget

Keep total anchored content under these limits for optimal performance:

| Anchor | Max Size | Tokens |
|--------|----------|--------|
| CLAUDE.md | 200 lines | ~3,000 |
| Rules (global) | 500 lines total | ~8,000 |
| Rules (scoped) | 200 lines per file | ~3,000 |
| MEMORY.md | 200 lines | ~3,000 |
| **Total always-loaded** | | **~17,000** |

**Rule of thumb**: If total anchored content exceeds 20k tokens, compliance drops. Keep it focused.

## Setup with /cc-memory

When using `/cc-memory --anchor`:

1. Analyze current CLAUDE.md for critical vs non-critical content
2. Move non-critical content to `.claude/rules/` files
3. Create PreCompact/PostCompact hooks for state capture
4. Set up `.claude/anchored-state.md` for dynamic state
5. Configure MEMORY.md as an index (under 200 lines)
6. Create anchor tags in rules files for must-not-forget content
