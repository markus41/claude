---
description: Execution environment selection guide — helps choose between local CLI, Desktop, web, remote SSH, cloud tasks, and cowork sessions based on task requirements. Decision matrix with concrete examples.
model: claude-sonnet-4-6
allowed-tools:
  - Read
  - Bash
---

# Runtime Selection Guide

Claude Code runs in multiple environments. Choosing the wrong one wastes time. This guide gives you a decision matrix and concrete examples for each runtime.

## Quick Decision Matrix

| Need | Use |
|------|-----|
| Local files + git + full toolchain | CLI (terminal) or Desktop |
| Long-running background work, no machine required | Cloud Scheduled Task |
| GUI interaction, visual testing, native apps | Desktop + Computer Use |
| Pair programming with a colleague | Cowork (Web) |
| SSH into a remote server | SSH session |
| Quick Q&A without a project | Web (claude.ai/code) |
| Recurring autonomous engineering | Desktop Task or Cloud Task |
| CI/CD pipelines | GitHub Actions (headless) |

---

## Runtime 1: CLI (Terminal)

**Best for:** Most day-to-day coding work.

**Has access to:** Local files, all local MCP servers, git, project toolchain, `~/.claude/` config.

**Invocation:**
```bash
claude                    # Interactive REPL
claude "fix the auth bug" # One-shot
claude --print "explain this" > output.md  # Headless, pipe output
```

**Choose CLI when:**
- You need to read, write, or run local files
- You need local MCP servers (postgres, filesystem, etc.)
- You're doing active development and want to steer Claude in real time
- You need full toolchain access (custom scripts, local Docker, etc.)

---

## Runtime 2: Claude Desktop App

**Best for:** Background tasks, GUI automation, persistent scheduled tasks, and working without a terminal.

**Has access to:** Everything CLI has, plus computer use (GUI), Desktop-specific scheduled tasks, and a more polished UI.

**Invocation:** Open the Desktop app. Start a conversation or create a scheduled task.

**Choose Desktop when:**
- You want to schedule recurring tasks (runs even when you close the conversation)
- You need computer use / GUI automation (click, type, screenshot)
- You prefer a visual interface over terminal
- You want persistent conversations that survive restarts

**Desktop vs CLI:**
| | CLI | Desktop |
|--|-----|---------|
| Scheduled tasks | Session-scoped `/loop` only | Persistent, survive restarts |
| Computer use | No | Yes |
| Local MCP | Yes | Yes |
| Background while you work | No | Yes |

---

## Runtime 3: Web (claude.ai/code)

**Best for:** Tasks that don't need local files, collaborative review, or starting a session on any machine.

**Has access to:** MCP connectors you configure, GitHub (via connector), no local filesystem.

**Invocation:** Visit claude.ai/code in a browser.

**Choose Web when:**
- You're away from your dev machine
- The task only needs GitHub, Jira, or other cloud connectors
- You want to share a session with a colleague (Cowork)
- You're doing documentation, planning, or architectural review without code changes

**Limitation:** Cannot access local files, local MCP servers, or local toolchain.

---

## Runtime 4: Cowork (Collaborative Web Session)

**Best for:** Real-time collaboration — pair programming, architecture review, team debugging.

**Has access to:** Same as Web. Both participants see Claude's actions in real time.

**Invocation:** Start a Web session, invite a colleague via shared URL.

**Choose Cowork when:**
- You're pair programming and both need to steer Claude
- You're doing a joint architecture review
- You want a colleague to see Claude's reasoning in real time
- Remote team needs to review Claude's PR suggestions together

---

## Runtime 5: SSH Session

**Best for:** Working on a remote server (cloud VM, staging environment, production read-only access).

**Has access to:** Files and toolchain on the remote machine. Claude Code CLI installed remotely.

**Invocation:**
```bash
ssh user@remote-server
claude  # runs on the remote machine
```

**Or with VS Code Remote:**
```
Open Remote-SSH connection in VS Code
Claude Code extension runs on the remote machine
```

**Choose SSH when:**
- You need to work directly on a remote server's files
- The toolchain only exists on the remote machine (custom build environment)
- You need to inspect production logs or configs without transferring them locally
- You're debugging a staging/production-specific issue

---

## Runtime 6: Cloud Scheduled Tasks

**Best for:** Autonomous recurring work that must run without your machine or session.

**Has access to:** Fresh repo clone via GitHub connector. No local files. Configured connectors only.

**Choose Cloud Scheduled Tasks when:**
- The task needs to run overnight, on weekends, or while you're away
- The work is read-only or only writes via GitHub API (PRs, comments, issues)
- You need true "set and forget" automation
- Minimum 1-hour interval is acceptable

**Comparison to Desktop tasks:**

| | Desktop Task | Cloud Task |
|--|-------------|------------|
| Requires machine on | Yes | No |
| Local files | Yes | No (fresh clone only) |
| Local MCP servers | Yes | No |
| Minimum interval | 1 minute | 1 hour |
| Persists across restarts | Yes | Yes (cloud-managed) |

---

## Runtime 7: GitHub Actions (Headless CI)

**Best for:** PR-triggered automation, commit hooks, deployment workflows.

**Has access to:** Actions runner environment (fresh clone, secrets, GitHub API).

**Choose GitHub Actions when:**
- You want Claude to run on every PR (automated review, test generation)
- You need Claude integrated into your existing CI/CD pipeline
- You want cost control with per-run billing vs. always-on tasks
- The trigger is a GitHub event (push, PR open, schedule)

**Quick setup:**
```yaml
- name: Claude PR Review
  uses: anthropics/claude-code-action@beta
  with:
    prompt: "Review this PR for security and correctness issues"
    allowed_tools: "Bash,Read,Grep"
```

---

## Decision Flowchart

```
Do you need local files or toolchain?
├── Yes → Local required
│   ├── Need GUI / computer use? → Desktop
│   ├── Need recurring background task? → Desktop Scheduled Task
│   └── Just coding? → CLI
└── No → Cloud ok
    ├── Need collaboration? → Web + Cowork
    ├── Need recurring autonomous work? → Cloud Scheduled Task
    ├── Triggered by git events? → GitHub Actions
    ├── On a remote server? → SSH
    └── Quick Q&A? → Web
```

## Use `/cc-schedule` for Automation Decisions

For tasks involving scheduling, `/cc-schedule` generates optimized prompts for Desktop, Cloud, or `/loop` based on the task type. It handles the choice automatically for 6 common maintenance workflows.
