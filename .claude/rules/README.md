# Rules System

Rules are markdown files that Claude Code loads as project instructions. They define
behavioral constraints that apply consistently across all tasks and all agents in
this project. Unlike skills (which are activated on demand) and hooks (which run at
lifecycle events), rules are always active.

## Why rules are separate from CLAUDE.md

`CLAUDE.md` is the general workflow and tooling guide. Rules in this directory are
scoped — most apply only to specific file types, which means Claude only sees and
enforces them when working on relevant files. This reduces noise and keeps
instructions precise.

## Rule files

| File | Path scope | What it enforces |
|------|------------|-----------------|
| `architecture.md` | Global | Plugin structure, MCP config location, registry paths, agent/skill/hook conventions. Also injects the current date. |
| `code-style.md` | `**/*.ts`, `**/*.tsx`, `**/*.js`, `**/*.jsx` | ES modules, TypeScript strict mode, async/await, max function length (50 lines), naming conventions |
| `docker-k8s.md` | Dockerfiles, docker-compose, `**/*.yaml`, helm/k8s paths | Image tagging (never `:latest` alone), `imagePullPolicy: Always`, `--atomic` on helm, `--no-cache` for prod builds |
| `git-workflow.md` | Global | Commit message format (`type(scope): description`), no `git add -A`, no force push to main, no `.env` commits |
| `research.md` | Global | Always use MCP tools for web research (Perplexity, Firecrawl, Context7) instead of WebFetch/WebSearch |
| `self-healing.md` | Global | Protocol for capturing errors, updating lessons-learned.md, and creating new rules from patterns |
| `testing.md` | `**/*.test.*`, `**/*.spec.*`, `**/tests/**` | Write tests before/alongside code, descriptive test names, prefer real implementations over mocks |
| `lessons-learned.md` | Global | Auto-growing list of captured errors with fixes and prevention strategies. Read at session start. |

## How rules work

Claude Code loads rule files as additional system instructions. Files with a `paths`
frontmatter field are only injected when Claude is working on files matching those
patterns:

```yaml
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
```

Files without a `paths` field (or without frontmatter) are loaded globally for every
task in the project.

## The self-healing loop

The most important rules-level feature is the automated capture of errors into
`lessons-learned.md`. This creates a continuously improving knowledge base:

```
Tool call fails
      │
      ▼
PostToolUseFailure hook fires
      │
      ▼
lessons-learned-capture.sh appends entry to lessons-learned.md
  - Tool name
  - Input that caused the error
  - Error message
  - Status: NEEDS_FIX
      │
      ▼
Claude fixes the issue in the current session
      │
      ▼
Claude updates the entry:
  - Status: RESOLVED
  - Fix: description of what resolved it
  - Prevention: how to avoid it in future
      │
      ▼
Next session: lessons-learned.md is loaded as a rule.
Claude reads the fix and does not repeat the mistake.
```

If a pattern appears in multiple lessons, the self-healing protocol instructs Claude
to create or update a rule in one of the other rule files. For example, repeated
failures with `git add` on already-deleted files led to the git-workflow rule being
sharpened.

## Adding a new rule

Create a new `.md` file in this directory. Add a `paths` frontmatter block if the
rule should only apply to specific file types. Keep rules short and actionable —
they are injected as instructions, not documentation. If a rule needs explanation,
put the explanation in a comment or a secondary section that does not read as a
command.

## Common gotchas

- Rules with `paths` frontmatter only activate for matching files. A Docker rule will
  not fire if Claude is only editing TypeScript.
- `lessons-learned.md` grows automatically. Review it periodically and promote
  recurring entries into permanent rules to keep the file from becoming unwieldy.
- Rule files are loaded in addition to `CLAUDE.md`, not instead of it.

## See also

- [../README.md](../README.md) — Platform overview
- [../hooks/README.md](../hooks/README.md) — Hooks that enforce rules at runtime
- `lessons-learned.md` — The auto-growing error/fix knowledge base
