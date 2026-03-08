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

## Multi-Agent Team Patterns

### Parallel Code Review
```typescript
// Multiple team members' changes reviewed simultaneously
const reviews = await Promise.all([
  claude("Review PR #101", { maxTurns: 10 }),
  claude("Review PR #102", { maxTurns: 10 }),
  claude("Review PR #103", { maxTurns: 10 }),
]);
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
