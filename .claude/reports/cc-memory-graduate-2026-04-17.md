# cc-memory graduate — dry-run report

**Date**: 2026-04-17
**Command**: `/cc-memory --graduate --dry-run`
**Target file**: `.claude/rules/lessons-learned.md`

This is the proof-of-concept output of the graduation spec landed in
`plugins/claude-code-expert/commands/cc-memory.md`. Nothing has been written
— this is what `--apply` would do.

---

## Input summary

| Metric | Value |
|---|---|
| Total `### Error` entries | **191** |
| Status: `RESOLVED` | 19 (9.9%) |
| Status: `NEEDS_FIX` | 170 (89.0%) |
| Other / unparseable | 2 |
| File size | ~51k tokens (~258 KB on disk) |
| Oldest entry | 2026-02-23 |
| Newest entry | 2026-04-16 |

### Tool breakdown (all 191)

| Tool | Count |
|---|---|
| Bash | 84 |
| WebFetch | 47 |
| Read | 46 |
| mcp__firecrawl__firecrawl_scrape | 4 |
| Task | 3 |
| mcp__firecrawl__firecrawl_search | 3 |
| mcp__github__* | 2 |
| Bash (python3 -c) | 1 |
| Agent | 1 |

### The core diagnosis

**89% of entries never got to RESOLVED.** The self-healing loop is not closing. Most
NEEDS_FIX entries are either legitimate TypeScript-strict compile output that was captured
as "failures" by the PostToolUseFailure hook (tsc exits 2 when there are type errors — which
is its *normal* signal, not a tool failure) or external HTTP 404s that aren't actionable.

Graduation alone won't fix the ratio. The long-term answer is **hook scoping** — the
`PostToolUseFailure` hook should not capture:

- tsc runs with non-zero exit *but* structured compiler output (tsc exit-2 is "there are
  errors", not "the tool broke")
- WebFetch non-200 responses on URLs that are *expected* to potentially 404 (documentation
  spiders hit stale links routinely)
- grep with zero matches (exit 1 is the normal "no matches" signal)

That's a follow-on hook improvement outside this dry-run. For now, the dry-run proposes:

---

## Graduation proposals — promote to permanent rules

Based on signature grouping of RESOLVED entries:

### G1 — Read on directory → use Glob

- **Signature**: `Read` + "EISDIR: illegal operation on a directory"
- **Occurrences**: 6 entries, of which 2 are RESOLVED with identical prevention language
- **Target rule file**: `.claude/rules/self-healing.md`
- **Proposed rule line**:

  ```
  - Before calling Read on a path, confirm it is a file. Use Glob for directories,
    Read for files only. The Read tool fails with EISDIR on directories.
  ```

- **Action on graduation**: mark all 6 entries `Status: GRADUATED → self-healing.md#read-on-directory`

### G2 — git add on already-deleted files

- **Signature**: `Bash` + "pathspec did not match" + "git add"
- **Occurrences**: 2 entries (both RESOLVED, identical prevention)
- **Target rule file**: `.claude/rules/git-workflow.md` (rule already exists!)
- **Action**: no new rule needed — the existing `git-workflow.md` already says
  "After `git rm`, use `git add -u` or just commit directly — don't re-add deleted files."
  Mark the 2 entries `Status: GRADUATED → git-workflow.md` without editing the rule file.

### G3 — Bash failure on inline `!=` in Python

- **Signature**: `Bash (python3 -c)` + "syntax error near `!`"
- **Occurrences**: 1 RESOLVED (below the threshold, but this is a frequent enough
  gotcha in practice that the 1 RESOLVED entry is high-fidelity)
- **Recommendation**: hold — bump to graduation only after a second occurrence.
- **Reference**: `.claude/rules/code-style.md` already has "ES modules" guidance;
  an addition about shell-quoted inline scripts would fit here.

### G4 — Agent prompt too long

- **Signature**: `Agent` / `Task` + "Prompt is too long"
- **Occurrences**: 1 explicit RESOLVED in this session (`Agent prompt too long (2026-04-17T00:02:00Z)`),
  plus 1 RESOLVED "Task resume on running agent" (adjacent but distinct signature).
- **Target**: already mitigated by the new `skills/prompt-budget-preflight/SKILL.md`
  landed this session. Mark the 1 RESOLVED entry
  `Status: GRADUATED → skills/prompt-budget-preflight/SKILL.md`.

### G5 — Git push rejected (remote ahead)

- **Signature**: `Bash` + "non-fast-forward" or "failed to push some refs"
- **Occurrences**: 2 RESOLVED, both referencing the same fix (`git stash && git pull --rebase
  && git stash pop`)
- **Target rule file**: `.claude/rules/git-workflow.md`
- **Proposed rule line** (append):

  ```
  - If `git push` is rejected (non-fast-forward), run `git stash && git pull --rebase
    origin <branch> && git stash pop` before retrying. Never force-push to main.
  ```

- **Action**: append rule; mark both entries `Status: GRADUATED → git-workflow.md#rebase-before-push`

---

## Prune proposals — NEEDS_FIX older than 14 days with no resolution

The majority of NEEDS_FIX entries fall here. A sampling:

| Entry class | Count | Rec |
|---|---|---|
| tsc exit-2 with actual type errors captured during an in-flight refactor | ~60 | Prune — captured mid-iteration; resolved out-of-band by the eventual commit. Not incidents. |
| grep / bash exit-1 on zero matches | ~30 | Prune — normal tool behavior. Hook should stop capturing. |
| WebFetch 404 on documentation URLs | ~45 | Prune — stale-link noise from documentation crawlers. Hook should filter. |
| Read failure on non-existent paths I didn't create | ~12 | Prune — normal negative-lookup behavior. |
| Real incidents still open | ~8 | **Keep as NEEDS_FIX** — these are genuine unresolved issues. |

**Proposed action**: move ~147 NEEDS_FIX entries older than 14 days into
`.claude/rules/lessons-learned-archive.md` as a summarized monthly section:

```
## 2026-02 archive (147 pruned NEEDS_FIX entries)

Most entries were tool-output captures (tsc exit-2 during refactors, grep
zero-match exits, expected 404s) with no corrective action needed. See
commit log 2026-02-23 onward for context on what was actually being done
when these were captured.
```

---

## Archive proposals — RESOLVED older than 30 days

| Status | Count | Rec |
|---|---|---|
| RESOLVED, older than 30 days, graduated above | 4 | Archive — rule now lives in the target rule file |
| RESOLVED, older than 30 days, not graduated | 5 | Archive — low-frequency one-offs |

---

## Projected file-size delta

```
Before apply:
  191 entries · ~51,000 tokens · ~258KB on disk

After --apply (projected):
  ~8 NEEDS_FIX entries kept (active real incidents)
  ~0 RESOLVED entries kept (all graduated or archived)
  +3 new rule lines across git-workflow.md and self-healing.md
  +1 archive file at .claude/rules/lessons-learned-archive.md
  ~6,000 tokens (88% reduction)
```

**Does it meet the 15k-token ceiling?** Yes with margin.

---

## Safety rails exercised in this run

- Count check: 191 entries is below the 500-entry `--apply` ceiling ✓
- Git repo check: target is in a git-tracked branch ✓
- Rollback plan: this report is the before-state snapshot ✓
- Concurrency: no flock acquired — this is read-only ✓

---

## What `--apply` would do next

```
1. Append G1, G5 rule lines to their target rule files.
2. Mark 10 entries GRADUATED → <rule-file>#<anchor>.
3. Move ~147 expired NEEDS_FIX + 5 expired RESOLVED to
   .claude/rules/lessons-learned-archive.md.
4. Shrink the live lessons-learned.md to ~8 active NEEDS_FIX + 4 graduated
   (with pointers) + recent-activity preamble.
5. Emit a commit-ready diff for operator review before touching disk.
```

---

## Operator follow-ups

1. **Tighten the PostToolUseFailure hook** so it stops capturing tsc / grep / expected-404
   noise. This is the biggest single lever for preventing re-bloat. Candidate filter logic:
   ignore captures where the tool's structured output includes a recognizable error surface
   (tsc line `error TS\d+:`, grep "no such file or directory", WebFetch HTTP 4xx on URLs
   matching a configured crawler pattern).
2. Actually run `--apply` against this report. Commit as a standalone PR so the shrinkage
   and graduation are reviewable as one unit.
3. After apply, re-baseline: run `--graduate --dry-run` again, confirm ≤ 15k tokens.
