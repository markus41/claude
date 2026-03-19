---
name: cc-bench
intent: Benchmark Claude Code configuration quality across 8 dimensions with scoring, trend tracking, and gap analysis
tags:
  - claude-code-expert
  - command
  - benchmark
  - scoring
  - quality
  - optimization
arguments:
  - name: target
    description: What to benchmark — "full", "compare", or a specific dimension name
    required: false
    type: string
    default: full
flags:
  - name: save
    description: Save benchmark snapshot to .claude/benchmarks/ for trend tracking
    type: boolean
    default: false
  - name: compare
    description: Compare current config against a saved snapshot (timestamp or "latest")
    type: string
  - name: format
    description: Output format
    type: choice
    choices: [summary, detailed, json]
    default: summary
  - name: threshold
    description: Minimum overall score to pass (exit non-zero if below)
    type: number
    default: 0
  - name: top
    description: Show only top N improvement suggestions
    type: number
    default: 3
---

# /cc-bench — Configuration Benchmarking & Scoring

Score your Claude Code configuration across 8 quality dimensions, track improvement
over time, and get targeted suggestions for the highest-ROI upgrades.

## Usage

```bash
/cc-bench                            # Full benchmark with summary
/cc-bench --save                     # Benchmark and save snapshot for trends
/cc-bench --compare latest           # Compare current vs last saved snapshot
/cc-bench --compare 20260319-1430    # Compare against specific snapshot
/cc-bench --format detailed          # Show per-check scores
/cc-bench --format json              # Machine-readable output
/cc-bench context-efficiency         # Benchmark single dimension
/cc-bench --threshold 70             # Fail if overall score < 70
/cc-bench --top 5                    # Show top 5 improvement suggestions
```

---

## The 8 Dimensions

Each dimension is scored 0–100 independently, then weighted into an overall score.

### 1. Context Efficiency (weight: 15%)

How well the configuration uses the context window.

| Check | Points | Criteria |
|-------|--------|----------|
| CLAUDE.md size | 0–20 | Under 200 lines = 20, under 400 = 10, over 400 = 0 |
| Rules file count | 0–15 | 3–8 rules = 15, 1–2 = 10, 9+ = 5, 0 = 0 |
| Rules use path scoping | 0–15 | >50% scoped = 15, some = 10, none = 0 |
| MEMORY.md under 200 lines | 0–10 | Under 200 = 10, under 300 = 5, over = 0 |
| No duplicate instructions | 0–20 | No dups = 20, some = 10, many = 0 |
| Compact-safe anchoring | 0–20 | Critical info in CLAUDE.md/rules = 20, mixed = 10, inline only = 0 |

### 2. Hook Coverage (weight: 12%)

How well hooks guard against errors and automate workflows.

| Check | Points | Criteria |
|-------|--------|----------|
| PreToolUse hooks exist | 0–20 | At least 1 = 20, 0 = 0 |
| PostToolUse hooks exist | 0–15 | At least 1 = 15, 0 = 0 |
| PostToolUseFailure hook | 0–20 | Captures errors = 20, 0 = 0 |
| Hook scripts executable | 0–15 | All executable = 15, some = 5, none = 0 |
| Hooks output valid JSON | 0–15 | All valid = 15, some = 5, none = 0 |
| Notification hooks | 0–15 | At least 1 = 15, 0 = 0 |

### 3. Agent Utilization (weight: 12%)

How effectively agents are configured and used.

| Check | Points | Criteria |
|-------|--------|----------|
| Agents defined | 0–20 | 3+ agents = 20, 1–2 = 10, 0 = 0 |
| Agent frontmatter valid | 0–20 | All valid = 20, some = 10, none = 0 |
| Agents specify models | 0–15 | All specify = 15, some = 5, none = 0 |
| Agent tools restricted | 0–15 | Tools scoped per agent = 15, all have full = 5 |
| Agent descriptions clear | 0–15 | All have descriptions = 15, some = 5 |
| No duplicate agent roles | 0–15 | No overlap = 15, some overlap = 5 |

### 4. MCP Connectivity (weight: 10%)

How well MCP servers are configured and available.

| Check | Points | Criteria |
|-------|--------|----------|
| .mcp.json exists | 0–20 | Present and valid JSON = 20 |
| Servers configured | 0–20 | 2+ servers = 20, 1 = 10, 0 = 0 |
| No disabled servers | 0–15 | None disabled = 15, some = 5 |
| Server commands exist | 0–20 | All commands found = 20, some = 10 |
| Env vars set | 0–15 | All required env vars present = 15 |
| No duplicate servers | 0–10 | No duplicates = 10 |

### 5. Memory Hygiene (weight: 10%)

How well the memory system is organized and maintained.

| Check | Points | Criteria |
|-------|--------|----------|
| MEMORY.md exists | 0–15 | Present = 15 |
| MEMORY.md is index-only | 0–20 | Only links, no inline content = 20 |
| Memory files have frontmatter | 0–20 | All have valid frontmatter = 20 |
| Memory types used correctly | 0–15 | user/feedback/project/reference = 15 |
| No orphaned memory files | 0–15 | All referenced in MEMORY.md = 15 |
| Memory under size limits | 0–15 | Index < 200 lines, files < 100 lines = 15 |

### 6. Security Posture (weight: 15%)

How well the configuration enforces security.

| Check | Points | Criteria |
|-------|--------|----------|
| Permission model configured | 0–20 | Explicit allow/deny = 20, defaults = 5 |
| No secrets in config files | 0–25 | No API keys/tokens in tracked files = 25 |
| .gitignore covers sensitive files | 0–15 | .env, settings.local.json ignored = 15 |
| Hook scripts sanitize input | 0–15 | No raw variable interpolation = 15 |
| MCP servers use env vars for secrets | 0–15 | All secrets in env = 15 |
| No overly broad permissions | 0–10 | No "allow *" patterns = 10 |

### 7. Skill Coverage (weight: 13%)

How well skills cover the project's needs.

| Check | Points | Criteria |
|-------|--------|----------|
| Skills defined | 0–20 | 5+ skills = 20, 1–4 = 10, 0 = 0 |
| Skills have SKILL.md | 0–20 | All have SKILL.md = 20 |
| Skills match tech stack | 0–20 | Skills cover detected languages/frameworks = 20 |
| Skills not too large | 0–15 | All under 500 lines = 15, some over = 5 |
| No duplicate skill coverage | 0–15 | No overlapping skills = 15 |
| Skills have clear triggers | 0–10 | Frontmatter describes activation = 10 |

### 8. Cost Optimization (weight: 13%)

How well the configuration manages token and API costs.

| Check | Points | Criteria |
|-------|--------|----------|
| Model selection in agents | 0–25 | Appropriate models per task = 25 |
| Haiku used for research/lookups | 0–20 | Research agents use haiku = 20 |
| Opus reserved for complex tasks | 0–20 | Only architecture/decisions use opus = 20 |
| Context kept lean | 0–15 | No bloated CLAUDE.md or rules = 15 |
| Subagents used for research | 0–10 | Research delegated to subagents = 10 |
| No redundant skill loading | 0–10 | Skills properly scoped = 10 |

---

## Implementation

When invoked:

### Phase 1: Scan

Read all configuration files and build a project profile:

```bash
# Configuration files
SCAN_FILES=(
  "CLAUDE.md"
  ".claude/CLAUDE.md"
  ".claude/settings.json"
  ".claude/settings.local.json"
  ".mcp.json"
)

# Configuration directories
SCAN_DIRS=(
  ".claude/rules/"
  ".claude/skills/"
  ".claude/agents/"
  ".claude/hooks/"
)

# Count metrics
CLAUDE_MD_LINES=$(wc -l < CLAUDE.md 2>/dev/null || echo 0)
RULES_COUNT=$(ls .claude/rules/*.md 2>/dev/null | wc -l)
SKILLS_COUNT=$(ls -d .claude/skills/*/ 2>/dev/null | wc -l)
AGENTS_COUNT=$(ls .claude/agents/*.md 2>/dev/null | wc -l)
```

### Phase 2: Score

Run all checks for each dimension, accumulate points, calculate weighted overall score.

### Phase 3: Output

#### Summary Format (default)

```
=== Claude Code Configuration Benchmark ===

Overall Score: 74/100

  Context Efficiency   ████████░░  82/100  (weight: 15%)
  Hook Coverage        ██████░░░░  62/100  (weight: 12%)
  Agent Utilization    █████████░  88/100  (weight: 12%)
  MCP Connectivity     ███████░░░  71/100  (weight: 10%)
  Memory Hygiene       ████████░░  78/100  (weight: 10%)
  Security Posture     ██████░░░░  65/100  (weight: 15%)
  Skill Coverage       █████████░  91/100  (weight: 13%)
  Cost Optimization    ███████░░░  69/100  (weight: 13%)

Top 3 Improvements (highest ROI):
  1. [+8pts] Add PostToolUseFailure hook for error capture
  2. [+6pts] Add .env to .gitignore
  3. [+5pts] Switch research agents to haiku model
```

#### Detailed Format

Shows every individual check with pass/fail and point value.

#### JSON Format

```json
{
  "timestamp": "2026-03-19T14:30:00Z",
  "overall_score": 74,
  "dimensions": {
    "context_efficiency": { "score": 82, "weight": 0.15, "checks": [...] },
    "hook_coverage": { "score": 62, "weight": 0.12, "checks": [...] }
  },
  "improvements": [
    { "description": "Add PostToolUseFailure hook", "points": 8, "dimension": "hook_coverage" }
  ]
}
```

### Phase 4: Snapshot (if --save)

Save the benchmark result to `.claude/benchmarks/`:

```
.claude/benchmarks/
├── 20260319-1430.json    ← timestamped snapshots
├── 20260315-0900.json
└── latest.json           ← symlink to most recent
```

### Phase 5: Compare (if --compare)

Load saved snapshot and show delta:

```
=== Benchmark Comparison ===
Comparing: current vs 2026-03-15

  Dimension              Before → After   Delta
  ─────────────────────────────────────────────
  Context Efficiency       75  →  82      +7  ▲
  Hook Coverage            45  →  62      +17 ▲▲
  Agent Utilization        88  →  88       0
  MCP Connectivity         71  →  71       0
  Memory Hygiene           60  →  78      +18 ▲▲
  Security Posture         55  →  65      +10 ▲
  Skill Coverage           91  →  91       0
  Cost Optimization        69  →  69       0
  ─────────────────────────────────────────────
  Overall                  68  →  74      +6  ▲

Best improvement: Memory Hygiene (+18)
```

---

## Threshold Gate

Use `--threshold` in CI or pre-commit to enforce minimum quality:

```bash
/cc-bench --threshold 70 --format json
# Exit 0 if score >= 70, exit 1 if below
```

Combine with `/cc-setup --audit` for a comprehensive quality gate.
