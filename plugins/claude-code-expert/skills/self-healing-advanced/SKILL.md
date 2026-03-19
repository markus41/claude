# Advanced Self-Healing & Lessons Learned

Enhanced error capture, pattern detection, automated rotation, and rule promotion
for the lessons-learned system.

## The Self-Healing Loop

```
Tool fails → PostToolUseFailure hook captures error
    ↓
Appends to .claude/rules/lessons-learned.md
    ↓
Claude fixes the issue in current session
    ↓
Claude updates entry: NEEDS_FIX → RESOLVED + Fix + Prevention
    ↓
Next session: lessons-learned.md loaded as rule
    ↓
Claude avoids repeating the mistake
    ↓
Pattern detected (3+ similar errors)?
    ↓
Promote to permanent rule in .claude/rules/
    ↓
Archive promoted entries from lessons-learned.md
```

## Pattern Detection

### Automatic Pattern Detection

When reviewing lessons-learned.md, look for these pattern signals:

```yaml
pattern_signals:
  tool_clustering:
    - 3+ errors with same tool (e.g., multiple Bash failures)
    - Signal: tool needs better guardrails or conventions

  error_type_clustering:
    - 3+ errors with same root cause (e.g., path issues, escaping)
    - Signal: fundamental misunderstanding needs a rule

  temporal_clustering:
    - Multiple errors in same session or time window
    - Signal: environmental issue or workflow anti-pattern

  file_clustering:
    - Errors consistently involving same files or directories
    - Signal: those files need documentation or restructuring

  cross_agent_clustering:
    - Same error across different agents/subagents
    - Signal: shared tooling issue needs global rule
```

### Pattern Detection Algorithm

```
For each RESOLVED lesson in lessons-learned.md:
  1. Extract: tool, error_type, root_cause, fix_category
  2. Group by: (tool, root_cause)
  3. If group.count >= 3:
     → Flag for promotion to permanent rule
     → Suggest rule file: .claude/rules/{tool-lowercase}.md
     → Draft rule content from Prevention fields
  4. If group.count >= 5:
     → Auto-promote (create rule file automatically)
     → Archive promoted entries
```

### Pattern Categories

| Pattern | Signal | Promote To |
|---------|--------|------------|
| Bash escaping issues | 3+ bash quote/escape errors | `.claude/rules/code-style.md` |
| Git workflow errors | 3+ git add/push/commit fails | `.claude/rules/git-workflow.md` |
| File path issues | 3+ EISDIR/not found errors | `.claude/rules/architecture.md` |
| JSON structure mistakes | 3+ dict/list assumption fails | `.claude/rules/code-style.md` |
| Docker/K8s issues | 3+ container/deploy errors | `.claude/rules/docker-k8s.md` |
| MCP tool failures | 3+ firecrawl/perplexity errors | `.claude/rules/research.md` |

## Rotation Protocol

### When to Rotate

Rotate lessons-learned.md when:
- File exceeds 500 lines (readability threshold)
- More than 20 RESOLVED entries (noise threshold)
- More than 5 NEEDS_FIX entries older than 7 days (staleness threshold)
- Monthly maintenance review

### Rotation Steps

```
1. ARCHIVE: Move RESOLVED entries older than 30 days to archive
   → .claude/lessons-archive/{year}-{month}.md

2. PROMOTE: Entries with 3+ similar patterns → permanent rules
   → .claude/rules/{topic}.md
   → Mark original entries with: **Promoted to**: {rule file}

3. PRUNE: Remove NEEDS_FIX entries older than 14 days with no resolution
   → These are likely irrelevant or environment-specific
   → Save to archive with note: "Pruned — unresolved after 14 days"

4. REINDEX: Renumber remaining entries for clean reading

5. VERIFY: Check that all Prevention fields are actionable
   → Vague prevention ("be more careful") → rewrite with specifics
```

### Archive Structure

```
.claude/
├── rules/
│   └── lessons-learned.md      # Active lessons (last 30 days)
└── lessons-archive/
    ├── 2026-01.md              # January lessons (archived)
    ├── 2026-02.md              # February lessons (archived)
    └── promoted-rules-log.md   # Record of pattern promotions
```

## Enhanced Capture Hook

Improved `PostToolUseFailure` hook with deduplication and severity tagging:

```bash
#!/bin/bash
# .claude/hooks/lessons-learned-capture.sh (enhanced)

# Read tool failure input
INPUT=$(head -c 65536)

# Validate JSON
if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  exit 0
fi

TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // "unknown"')
ERROR=$(printf '%s' "$INPUT" | jq -r '.error // ""' | head -c 500)
TOOL_INPUT=$(printf '%s' "$INPUT" | jq -r '.tool_input | tostring' | head -c 300)
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Sanitize inputs to prevent injection
TOOL=$(printf '%s' "$TOOL" | tr -cd '[:alnum:]._-')
ERROR=$(printf '%s' "$ERROR" | sed 's/[`$]/\\&/g')
TOOL_INPUT=$(printf '%s' "$TOOL_INPUT" | sed 's/[`$]/\\&/g')

LESSONS_FILE=".claude/rules/lessons-learned.md"

# Deduplication: skip if same tool+error already logged in last 5 entries
if [ -f "$LESSONS_FILE" ]; then
  RECENT=$(tail -50 "$LESSONS_FILE")
  if printf '%s' "$RECENT" | grep -qF "$ERROR"; then
    # Already captured recently, skip
    exit 0
  fi
fi

# Atomic write with flock
(
  flock -n 200 || exit 0

  cat >> "$LESSONS_FILE" << ENTRY

### Error: ${TOOL} failure (${TIMESTAMP})
- **Tool:** ${TOOL}
- **Input:** \`${TOOL_INPUT}\`
- **Error:** ${ERROR}
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving
ENTRY

) 200>"${LESSONS_FILE}.lock"

rm -f "${LESSONS_FILE}.lock"
```

## Cross-Agent Learning

### Sharing Lessons Across Agents

When one agent discovers an error pattern, all agents should benefit:

```yaml
cross_agent_learning:
  capture:
    - Agent encounters error → captured in shared lessons-learned.md
    - lessons-learned.md is a global rule (loaded for all agents)

  broadcast:
    - Promoted rules go to .claude/rules/ (loaded for all agents)
    - Critical findings go to CLAUDE.md (anchored for all sessions)

  agent_memory:
    - Agent-specific patterns saved to agent memory
    - ~/.claude/agent-memory/<agent-name>/patterns.md
    - Loaded only when that agent type is spawned
```

### Knowledge Propagation Flow

```
Agent A encounters error
  ↓
PostToolUseFailure captures to lessons-learned.md
  ↓
Agent A fixes and marks RESOLVED
  ↓
Next session: any agent (A, B, C) reads lessons-learned.md
  ↓
Pattern detected (3+ similar across agents)
  ↓
Promoted to .claude/rules/{topic}.md
  ↓
All agents and sessions inherit the fix permanently
```

## Metrics & Health

### Lessons-Learned Health Score

```
Score = 100 - penalties

Penalties:
  -5 per NEEDS_FIX entry older than 7 days
  -3 per NEEDS_FIX entry older than 3 days
  -2 per RESOLVED entry without Prevention field
  -10 if file exceeds 500 lines (needs rotation)
  -5 per detected pattern not yet promoted to rule
  -15 if same error appears 5+ times (not learning)

Rating:
  90-100: Excellent — errors captured and resolved quickly
  70-89:  Good — some unresolved items need attention
  50-69:  Fair — rotation and promotion needed
  <50:    Poor — lessons-learned system is not being maintained
```

### Audit Check

Run with `/cc-memory --audit`:

```
=== Lessons-Learned Health ===

Entries: 45 (⚠ approaching 500-line limit)
  RESOLVED:  38 (84%)
  NEEDS_FIX:  7 (16%)

Unresolved > 7 days: 3 ← should be resolved or pruned
Patterns detected:   2 ← should be promoted to rules
  - Bash escaping (4 entries) → promote to code-style.md
  - Path errors (3 entries) → promote to architecture.md

Health Score: 72/100
Recommendation: Rotate (archive resolved), promote patterns, resolve stale entries
```

## Integration with Orchestration

### Pre-Task Lesson Check

Before starting any task, the orchestrator should:

```
1. Read .claude/rules/lessons-learned.md
2. Check for NEEDS_FIX entries related to current task
3. If found: proactively avoid known error patterns
4. If many NEEDS_FIX: suggest running rotation first
```

### Post-Task Lesson Update

After completing a task:

```
1. Check if any new errors were captured during the task
2. If yes: update Status to RESOLVED with Fix and Prevention
3. If pattern detected: create/update permanent rule
4. If lessons-learned.md growing: suggest rotation
```
