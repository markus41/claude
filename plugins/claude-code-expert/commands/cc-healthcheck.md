---
name: cc-healthcheck
intent: Proactive runtime diagnostics — check MCP connectivity, hook validity, context health, lessons-learned freshness, and plugin registry consistency
tags:
  - claude-code-expert
  - command
  - health
  - diagnostics
  - monitoring
  - runtime
arguments:
  - name: target
    description: What to check — "all", "mcp", "hooks", "context", "lessons", "memory", "plugins", or "registry"
    required: false
    type: string
    default: all
flags:
  - name: fix
    description: Auto-fix issues where possible (non-executable scripts, stale entries)
    type: boolean
    default: false
  - name: quiet
    description: Only show failures and warnings, not passing checks
    type: boolean
    default: false
  - name: json
    description: Output results as JSON
    type: boolean
    default: false
---

# /cc-healthcheck — Live Runtime Diagnostics

Proactively monitor Claude Code runtime health during a session. Unlike `/cc-debug`
(reactive, post-failure) and `/cc-troubleshoot` (targeted investigation), `/cc-healthcheck`
is a fast, broad sweep designed to catch problems before they cause failures.

## Usage

```bash
/cc-healthcheck                      # Full health sweep
/cc-healthcheck mcp                  # Check MCP servers only
/cc-healthcheck hooks                # Check hooks only
/cc-healthcheck context              # Check context/memory health
/cc-healthcheck --quiet              # Only show WARN and FAIL
/cc-healthcheck --fix                # Auto-fix what's possible
/cc-healthcheck --json               # Machine-readable output
```

---

## Health Check Domains

### 1. MCP Server Connectivity

Verify every configured MCP server is reachable and responding.

```
Checks:
├── .mcp.json exists and is valid JSON
├── Each server:
│   ├── Command binary exists on PATH
│   ├── Required environment variables are set
│   ├── Server not marked as disabled
│   └── Connection test (if available)
└── No duplicate server names
```

```bash
# Check server commands exist
python3 << 'PYEOF'
import json, os, shutil

mcp_path = ".mcp.json"
if not os.path.exists(mcp_path):
    print("[WARN] No .mcp.json found")
else:
    data = json.load(open(mcp_path))
    for name, cfg in data.get("mcpServers", {}).items():
        disabled = cfg.get("disabled", False)
        cmd = cfg.get("command", "")
        if disabled:
            print(f"[SKIP] {name}: disabled")
            continue
        if cmd and not shutil.which(cmd):
            print(f"[FAIL] {name}: command '{cmd}' not found on PATH")
        else:
            print(f"[PASS] {name}: command '{cmd}' available")
        # Check env vars
        for key, val in cfg.get("env", {}).items():
            if val.startswith("$") or not val:
                env_name = val.lstrip("$") if val.startswith("$") else key
                if not os.environ.get(env_name):
                    print(f"[WARN] {name}: env var {env_name} not set")
PYEOF
```

### 2. Hook Validity

Verify all configured hooks are functional.

```
Checks:
├── settings.json hooks section parses correctly
├── Each hook:
│   ├── Referenced script file exists
│   ├── Script is executable (chmod +x)
│   ├── Script produces valid JSON output (dry-run test)
│   └── Timeout value is within supported range
├── No hooks referencing removed lifecycle events
└── No duplicate hook entries
```

```bash
# Validate hook scripts
python3 << 'PYEOF'
import json, os, stat

settings_path = ".claude/settings.json"
if not os.path.exists(settings_path):
    print("[WARN] No .claude/settings.json found")
else:
    data = json.load(open(settings_path))
    hooks = data.get("hooks", {})
    valid_events = {
        "PreToolUse", "PostToolUse", "PostToolUseFailure",
        "Notification", "Stop", "SubagentStop",
        "PreCompact", "PostCompact"
    }
    for event, configs in hooks.items():
        if event not in valid_events:
            print(f"[FAIL] Unknown hook event: {event}")
            continue
        for config in configs:
            for hook in config.get("hooks", []):
                cmd = hook.get("command", "")
                parts = cmd.split()
                script = parts[-1] if parts else ""
                if script and os.path.exists(script):
                    mode = os.stat(script).st_mode
                    if not (mode & stat.S_IXUSR):
                        print(f"[FAIL] {event}: {script} not executable")
                    else:
                        print(f"[PASS] {event}: {script}")
                elif script:
                    print(f"[FAIL] {event}: {script} not found")
PYEOF
```

### 3. Context Health

Estimate context usage and detect bloat.

```
Checks:
├── CLAUDE.md line count (warn if > 300, fail if > 500)
├── Total rules file size (warn if > 50KB)
├── lessons-learned.md entry count (warn if > 50 entries)
├── MEMORY.md line count (warn if > 200)
├── Combined always-loaded content estimate
└── Ratio of path-scoped vs global rules
```

```bash
# Context health metrics
echo "=== Context Health ==="

# CLAUDE.md size
for f in CLAUDE.md .claude/CLAUDE.md; do
  if [ -f "$f" ]; then
    lines=$(wc -l < "$f")
    if [ "$lines" -gt 500 ]; then
      echo "[FAIL] $f: $lines lines (recommended: <200, max: 500)"
    elif [ "$lines" -gt 300 ]; then
      echo "[WARN] $f: $lines lines (recommended: <200)"
    else
      echo "[PASS] $f: $lines lines"
    fi
  fi
done

# Rules total size
if [ -d ".claude/rules" ]; then
  total_kb=$(du -sk .claude/rules/ | cut -f1)
  if [ "$total_kb" -gt 50 ]; then
    echo "[WARN] Rules directory: ${total_kb}KB (recommended: <50KB)"
  else
    echo "[PASS] Rules directory: ${total_kb}KB"
  fi
fi

# Lessons-learned entry count
if [ -f ".claude/rules/lessons-learned.md" ]; then
  entries=$(grep -c "^### Error:" .claude/rules/lessons-learned.md 2>/dev/null || echo 0)
  needs_fix=$(grep -c "NEEDS_FIX" .claude/rules/lessons-learned.md 2>/dev/null || echo 0)
  if [ "$entries" -gt 50 ]; then
    echo "[WARN] lessons-learned.md: $entries entries ($needs_fix unresolved) — consider rotating"
  else
    echo "[PASS] lessons-learned.md: $entries entries ($needs_fix unresolved)"
  fi
fi
```

### 4. Lessons-Learned Freshness

Check for stale NEEDS_FIX entries and unresolved patterns.

```
Checks:
├── NEEDS_FIX entries older than 7 days
├── RESOLVED entries that could be promoted to rules
├── Duplicate or near-duplicate entries
├── Total entry count (recommend rotation if > 40)
└── Pattern clusters (3+ similar errors)
```

### 5. Memory Health

Verify the memory system is well-organized.

```
Checks:
├── MEMORY.md exists at expected path
├── MEMORY.md is index-only (no inline content)
├── MEMORY.md under 200 lines
├── Referenced memory files exist
├── Memory files have valid frontmatter
├── No orphaned memory files (exist but not in index)
└── Memory directories are writable
```

### 6. Plugin Registry Consistency

Verify installed plugins match their manifests.

```
Checks:
├── Each installed plugin has plugin.json
├── Commands in manifest exist on disk
├── Agents in manifest exist on disk
├── Skills in manifest have SKILL.md
├── No orphaned resources (on disk but not in manifest)
└── Plugin versions are consistent
```

---

## Implementation

When invoked:

1. Run all checks for the selected domain(s)
2. Classify each result: PASS, WARN, FAIL, SKIP
3. Count results per category
4. Display results (filtered by `--quiet` if set)
5. If `--fix`: apply auto-fixes for FAIL items where safe
6. Output single-line summary

### Auto-Fix Capabilities

The `--fix` flag can automatically resolve:

| Issue | Fix |
|-------|-----|
| Non-executable hook scripts | `chmod +x` |
| MEMORY.md over 200 lines | Truncate with warning comment |
| Stale NEEDS_FIX entries (>30 days) | Archive to `.claude/rules/lessons-archived.md` |
| Orphaned memory files | Add reference to MEMORY.md |
| Missing skill SKILL.md | Create stub from directory name |

### Output Format

#### Standard Output

```
=== Claude Code Health Check ===

MCP Servers
  [PASS] firecrawl: npx available
  [PASS] perplexity: npx available
  [FAIL] memory: command '@anthropic/memory-server' not found

Hooks
  [PASS] PreToolUse: security-guard.sh
  [PASS] PostToolUseFailure: lessons-learned-capture.sh
  [WARN] PostToolUse: auto-format.sh (not executable)

Context
  [PASS] CLAUDE.md: 142 lines
  [PASS] Rules: 6 files, 28KB total
  [WARN] lessons-learned.md: 47 entries (12 unresolved)

Memory
  [PASS] MEMORY.md: 85 lines
  [PASS] 4 memory files, all referenced

Plugins
  [PASS] claude-code-expert (v5.0.0): 15 commands, 13 agents, 24 skills
  [WARN] 2 orphaned skill directories not in manifest

──────────────────────────────────────────
Health: 8/10 — 1 MCP server unreachable, 1 hook not executable
```

#### JSON Output (--json)

```json
{
  "score": 8,
  "max_score": 10,
  "summary": "1 MCP server unreachable, 1 hook not executable",
  "domains": {
    "mcp": { "pass": 2, "warn": 0, "fail": 1, "checks": [...] },
    "hooks": { "pass": 1, "warn": 1, "fail": 0, "checks": [...] },
    "context": { "pass": 2, "warn": 1, "fail": 0, "checks": [...] },
    "memory": { "pass": 2, "warn": 0, "fail": 0, "checks": [...] },
    "plugins": { "pass": 1, "warn": 1, "fail": 0, "checks": [...] }
  }
}
```

---

## Difference from /cc-debug and /cc-troubleshoot

| Command | When | Focus | Speed |
|---------|------|-------|-------|
| `/cc-healthcheck` | Proactive, during session | Broad sweep, catch issues early | Fast (< 10s) |
| `/cc-debug` | Reactive, after failure | Deep diagnosis of specific failure | Medium |
| `/cc-troubleshoot` | Targeted investigation | Focused on one issue type | Varies |
