# Claude Code Teams & Collaboration

Complete guide to team features, multi-user workflows, and organizational settings.

## Team Plans

### Overview
Claude Code supports team/organizational plans that provide:
- Shared billing and usage tracking
- Managed settings and policies
- Centralized API key management
- Team member management
- Usage analytics and reporting

### Organization Setup
```bash
# Login with organization credentials
claude auth login

# Check organization status
claude config
```

## Enterprise Managed Settings

### Managed Policies
Enterprise admins can enforce settings that individual users cannot override:

```json
{
  "managedSettings": {
    "permissions": {
      "deny": [
        "Bash(curl *)",
        "Bash(wget *)",
        "WebFetch",
        "WebSearch"
      ]
    },
    "model": "claude-sonnet-4-6",
    "allowedModels": ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    "hooks": {
      "PostToolUse": [
        {
          "matcher": "*",
          "hooks": [{
            "type": "command",
            "command": "bash /opt/company/audit-log.sh"
          }]
        }
      ]
    },
    "autoMemory": false,
    "maxTokensPerSession": 500000
  }
}
```

### Settings Hierarchy with Teams
```
Enterprise managed (cannot override)
  └── Organization defaults
      └── Team settings
          └── User settings (~/.claude/settings.json)
              └── Project settings (.claude/settings.json)
                  └── Local overrides (.claude/settings.local.json)
```

## Multi-User Project Conventions

### Shared Configuration (Git-Tracked)
These files should be in version control:
```
.claude/
├── CLAUDE.md              # Project instructions (everyone sees)
├── settings.json          # Shared permission rules
├── rules/                 # Shared rules
│   ├── code-style.md
│   ├── git-workflow.md
│   └── architecture.md
├── skills/                # Shared skills
│   └── deploy/SKILL.md
└── hooks/                 # Shared hooks
    └── pre-commit.sh
```

### Personal Configuration (Git-Ignored)
These stay local per user:
```
.claude/settings.local.json   # Personal overrides
~/.claude/CLAUDE.md            # Personal global instructions
~/.claude/settings.json        # Personal global settings
```

### .gitignore Entries
```gitignore
# Claude Code local files
.claude/settings.local.json
.claude/cache/
.claude/memory/

# Never commit
.env
.env.local
*.pem
*.key
```

## Collaborative Workflows

### Shared CLAUDE.md Best Practices
```markdown
# Project Instructions

## For All Team Members
- Use pnpm (not npm or yarn)
- Follow conventional commits
- Run `pnpm test` before committing
- All PRs require review

## Architecture Decisions
- ADR records in docs/adr/
- Major changes require RFC

## Contacts
- Frontend: @alice
- Backend: @bob
- Infrastructure: @carol
```

### Team Skills
Share skills across the team via git:
```markdown
# .claude/skills/deploy/SKILL.md
---
name: deploy
description: Deploy to staging/production
---

# Deployment Skill

## Steps
1. Run tests: `pnpm test`
2. Build: `pnpm build`
3. Deploy to staging: `kubectl apply -f k8s/staging/`
4. Run smoke tests: `pnpm test:e2e:staging`
5. If passing, deploy to production: `kubectl apply -f k8s/production/`
```

### Team Hooks
Enforce team standards via shared hooks:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/team-bash-guard.sh"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/ensure-tests-pass.sh"
        }]
      }
    ]
  }
}
```

## API Key Management

### Per-User Keys
Each team member uses their own API key:
```bash
export ANTHROPIC_API_KEY="sk-ant-user-specific-key"
```

### Shared Organization Key
Use organization-level auth:
```bash
export ANTHROPIC_AUTH_TOKEN="org-oauth-token"
```

### Key Rotation
```bash
# Generate new key via Anthropic Console
# Update environment variable
# Old key automatically expires based on org policy
```

## Usage Tracking & Analytics

### Per-Session Costs
```
/cost
```

### Organization Dashboard
- View at console.anthropic.com
- Per-user usage breakdown
- Model usage distribution
- Cost trends over time

### Audit Logging Hook
```bash
#!/bin/bash
# .claude/hooks/audit-log.sh
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
USER=$(whoami)
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "$TIMESTAMP|$USER|$TOOL" >> .claude/audit.log
```

## Claude Code Agent Teams (Experimental)

Agent Teams coordinate multiple Claude Code instances working in parallel with direct
teammate-to-teammate communication. Unlike subagents (hub-and-spoke), teams are a
mesh network where any teammate can message any other.

### Enable Agent Teams

```bash
# Environment variable (required, v2.1.32+)
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Or in settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### Team Architecture

```
┌─────────────────────────────────────┐
│           Lead Session              │
│  - Creates team & task list         │
│  - Spawns teammates                 │
│  - Monitors progress               │
│  - Synthesizes results              │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐        │
│  │Teammate A│←→│Teammate B│        │
│  │(frontend)│  │(backend) │        │
│  └──────────┘  └──────────┘        │
│       ↕              ↕              │
│  ┌──────────┐  ┌──────────┐        │
│  │Teammate C│←→│Teammate D│        │
│  │ (infra)  │  │ (tests)  │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

### Team Primitives

| Primitive | Purpose |
|-----------|---------|
| `TeamCreate` | Create a new team with name and roles |
| `TaskCreate` | Add work items with assignee and dependencies |
| `TaskUpdate` | Mark tasks complete, blocked, or add notes |
| `TaskList` | List all tasks (teammates self-claim) |
| `SendMessage` | Direct teammate-to-teammate messaging |
| `TeamDelete` | Dissolve team and clean up |

### Display Modes

- **In-process** (default): `Shift+Down` to cycle between teammate views
- **Split-panes**: Use tmux/iTerm2 for side-by-side teammate views

### Team Best Practices

```yaml
team_guidelines:
  size: 3-5 teammates (optimal)
  tasks_per_teammate: 5-6 (avoid overload)
  token_cost: 4-7x single session
  lead_is_fixed: true  # cannot change mid-session
  nesting: false        # no teams within teams
  session_resume: false # in-process only
```

### Team Lifecycle Management

The lead session is responsible for monitoring teammate health:

```
Every 2 minutes:
  1. Check TaskList for stale assignments (>5 min, no progress)
  2. SendMessage to idle teammates: "Status check?"
  3. For stalled teammates:
     - Try redirecting with clearer instructions
     - If unresponsive >3 min: reassign task to another teammate
  4. For completed teammates with no remaining tasks:
     - Collect final outputs
     - Release teammate
  5. Before finishing:
     - TeamDelete to dissolve
     - Verify all tasks completed or explicitly abandoned
```

### TeammateIdle Hook

Configure automatic idle detection:

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/teammate-idle-handler.sh"
        }]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# teammate-idle-handler.sh
INPUT=$(cat)
TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // "unknown"')
IDLE_SECONDS=$(echo "$INPUT" | jq -r '.idle_seconds // 0')

if [ "$IDLE_SECONDS" -gt 180 ]; then
  echo "WARNING: Teammate $TEAMMATE idle for ${IDLE_SECONDS}s" >&2
fi
```

## Multi-Agent Orchestration Patterns

### Orchestration-First Principle

Claude should **prefer to orchestrate** rather than do work directly:
- Break complex tasks into work units
- Assign each unit to the best-fit agent or teammate
- Monitor progress with periodic check-ins
- Audit every agent's output before accepting
- Clean up idle/stalled agents

### Mandatory Audit Loop

Every agent's work gets a second-round review:

```
Agent A completes → Audit agent reviews A's work
  ↓
PASS → accept
FAIL → return to Agent A with specific fixes (max 2 rounds)
```

For teams with 3+ members, use cross-auditing:
```
Agent A → audited by Agent B
Agent B → audited by Agent C
Agent C → audited by Agent A
```

### Parallel Code Review
```typescript
// Multiple team members' changes reviewed simultaneously
const reviews = await Promise.all([
  claude("Review PR #101", { maxTurns: 10 }),
  claude("Review PR #102", { maxTurns: 10 }),
  claude("Review PR #103", { maxTurns: 10 }),
]);
```

### Supervised Pipeline with Audit
```typescript
import { claude } from "@anthropic-ai/claude-code-sdk";

async function supervisedBuild(task: string) {
  // Step 1: Builder implements
  const build = await claude(task, {
    maxTurns: 20,
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  });

  // Step 2: Audit reviewer checks builder's work
  const audit = await claude(
    `Audit this work for gaps, correctness, and security:\n\nTask: ${task}\n\nChanges: ${build.text}`,
    { allowedTools: ["Read", "Glob", "Grep", "Bash"] }
  );

  // Step 3: If audit fails, send fixes back to builder
  if (audit.text.includes("FAIL")) {
    const fix = await claude(
      `Fix these audit findings:\n${audit.text}\n\nOriginal task: ${task}`,
      { allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"] }
    );
    // Re-audit the fixes
    const reaudit = await claude(
      `Re-audit after fixes:\n${fix.text}`,
      { allowedTools: ["Read", "Glob", "Grep", "Bash"] }
    );
    return { build: fix, audit: reaudit };
  }

  return { build, audit };
}
```

### Shared Knowledge Base
Use MCP servers to share team knowledge:
```json
{
  "mcpServers": {
    "team-knowledge": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE": "/shared/team-knowledge.json"
      }
    }
  }
}
```

## Agent Lifecycle Best Practices

### For Subagents
1. **Track IDs**: Record every agent ID returned from Agent tool calls
2. **Collect immediately**: Don't let completed agents sit — collect their results
3. **Check in on background agents**: Use SendMessage every 2 minutes
4. **Terminate stalled agents**: >3 min with no response = terminate
5. **Audit before accepting**: Every output gets a second-round review

### For Agent Teams
1. **Limit team size**: 3-5 teammates optimal
2. **Define clear tasks**: Each task has acceptance criteria
3. **Use dependencies**: Prevent race conditions on shared files
4. **Monitor TaskList**: Watch for unclaimed or stuck tasks
5. **Cross-audit**: Teammates review each other's work
6. **Clean dissolve**: TeamDelete when done, no orphaned teammates

### Token Cost Management

| Pattern | Typical Cost | When to Use |
|---------|-------------|-------------|
| Single agent | ~50k tokens | Simple, single-file changes |
| 2 subagents | ~100-200k | Build + review |
| 3-4 subagents | ~200-400k | Pipeline or parallel work |
| Team (3-5) | ~250-500k | Multi-component features |
| Team (5-10) | ~500k-1M | Large-scale review/QA |

## Onboarding New Team Members

### Checklist
1. Install Claude Code: `npm install -g @anthropic-ai/claude-code`
2. Set API key: `export ANTHROPIC_API_KEY="..."`
3. Clone project: `git clone ...`
4. Run setup: `pnpm install`
5. Test Claude Code: `claude /doctor`
6. Review CLAUDE.md for project conventions
7. Check `.claude/rules/` for coding standards
8. Review `.claude/skills/` for available workflows

### First Run Verification
```bash
# Verify everything works
claude -p "What build and test commands are available in this project?"
```

## Security for Teams

### Principle of Least Privilege
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(npm test)", "Bash(npm run lint)"
    ],
    "deny": [
      "Bash(rm *)", "Bash(sudo *)",
      "Bash(docker *)", "Bash(kubectl *)"
    ]
  }
}
```

### Sensitive Data Protection
- Never commit API keys or secrets
- Use `.env` files (gitignored) for local secrets
- Use hooks to prevent accidental secret commits
- Use managed settings to block network access if needed

### SubagentStop Hook

Enforce cleanup when subagents finish:

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/subagent-cleanup.sh"
        }]
      }
    ]
  }
}
```
