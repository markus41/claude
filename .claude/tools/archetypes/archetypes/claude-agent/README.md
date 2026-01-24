# Claude Agent Archetype

Create specialized Claude Code agents with defined capabilities, tool permissions, and domain expertise.

## Overview

This archetype generates a complete agent definition including:
- Agent markdown file with frontmatter and capabilities
- Registry entry configuration
- Domain expertise and routing rules
- Tool permissions and restrictions

## When to Use

- Creating specialized domain experts (e.g., security auditor, DB architect)
- Building task-specific automation agents
- Defining agents for specific technology stacks
- Creating review and validation agents

## Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `agentName` | string | Yes | Agent name in kebab-case |
| `displayName` | string | Yes | Human-readable name |
| `description` | string | Yes | Agent's specialization |
| `model` | choice | Yes | opus, sonnet, or haiku |
| `category` | choice | Yes | Organizational category |
| `domains` | multi | Yes | Areas of expertise |
| `tools` | multi | Yes | Allowed tools |
| `complexity` | choice | Yes | Task complexity range |
| `priority` | choice | Yes | Routing priority |

## Example Usage

```bash
# Interactive mode
/archetype create claude-agent

# Non-interactive
/archetype create claude-agent \
  --variable agentName=security-auditor \
  --variable displayName="Security Auditor" \
  --variable description="Performs comprehensive security audits and vulnerability assessments" \
  --variable model=sonnet \
  --variable category=security \
  --variable domains=security,backend,api \
  --variable tools=Read,Grep,Glob,Bash \
  --variable complexity="high (40-80)" \
  --variable priority=high \
  --non-interactive
```

## Generated Structure

```
{agentName}/
├── agents/
│   └── {agentName}.md       # Agent definition
├── registry-entry.json      # Registry configuration
└── README.md                # Agent documentation
```

## Agent Categories

| Category | Best For |
|----------|----------|
| core | General-purpose development |
| devops | CI/CD, infrastructure |
| security | Auditing, vulnerability scanning |
| data | Database, ETL, analytics |
| frontend | UI/UX, React, CSS |
| backend | API, services, logic |
| testing | QA, test generation |
| documentation | Docs, README, comments |
| utility | Helper tasks, cleanup |

## Model Selection Guide

| Model | Best For | Token Cost |
|-------|----------|------------|
| opus | Complex architecture, critical decisions | Highest |
| sonnet | Most development tasks | Medium |
| haiku | Quick lookups, simple tasks, docs | Lowest |

## Routing Configuration

Agents are routed based on:
1. **Domains** - Match task keywords to expertise
2. **Complexity** - Route simple vs complex tasks appropriately
3. **Priority** - When multiple agents match, higher priority wins
4. **Avoid/Prefer** - Explicit routing hints

## Best Practices

1. **Specific scope**: Define narrow, focused expertise
2. **Appropriate model**: Use haiku for simple tasks, sonnet for development
3. **Minimal tools**: Only grant tools the agent needs
4. **Clear domains**: Help routing find the right agent
5. **Document capabilities**: Be explicit about what the agent can/cannot do
